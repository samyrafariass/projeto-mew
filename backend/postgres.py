"""Persistência Neon com consultas e bloqueios limitados ao participante."""
import copy
import hashlib
from contextlib import contextmanager
from datetime import datetime, timezone
from uuid import UUID

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from psycopg_pool import ConnectionPool, PoolTimeout

from .catalog import DATABASE_LEVELS, build_quizzes
from .config import ConfigurationError
from .storage import AccountConflict, StorageUnavailable


def utc_iso(value):
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def utc_naive(value):
    return datetime.fromisoformat(value).astimezone(timezone.utc).replace(tzinfo=None)


class PostgresRepository:
    kind = 'postgresql'

    def __init__(self, url):
        self.pool = ConnectionPool(
            conninfo=url, name='mew-api', min_size=0, max_size=4, timeout=12,
            kwargs={'row_factory': dict_row, 'connect_timeout': 10, 'prepare_threshold': None},
            # Uma conexão pode ter caído enquanto a função estava inativa.
            # A validação ocorre antes da transação; escritas não são repetidas.
            check=ConnectionPool.check_connection, max_idle=60,
            open=True,
        )
        try:
            with self.connection() as conn:
                exists = conn.execute("SELECT to_regclass('mew_api.migration') AS name").fetchone()['name']
                if not exists or not conn.execute('SELECT 1 FROM mew_api.migration WHERE version=3').fetchone():
                    raise ConfigurationError('Prepare o banco executando: python -m backend.migrate')
        except Exception:
            self.close()
            raise

    @contextmanager
    def connection(self):
        try:
            with self.pool.connection() as conn:
                conn.execute('SET LOCAL statement_timeout = 10000')
                yield conn
        except psycopg.errors.UniqueViolation as error:
            if error.diag.constraint_name in ('usuario_email_key', 'usuario_email_normalizado_key'):
                raise AccountConflict() from None
            raise StorageUnavailable() from None
        except (psycopg.Error, PoolTimeout):
            raise StorageUnavailable() from None

    def close(self):
        self.pool.close()

    def load_quizzes(self, catalog):
        with self.connection() as conn:
            rows = conn.execute('''SELECT q.*, t.nome_topico FROM public.questao q
                JOIN public.topico t ON t.id_topico=q.id_topico ORDER BY q.id_questao''').fetchall()
        return build_quizzes(rows, catalog)

    def check_health(self):
        with self.connection() as conn:
            conn.execute('SELECT 1')

    def _participant_ids(self, conn, *, token=None, email=None, participant_id=None, empty=False, **scope):
        """None representa a leitura administrativa completa, nunca a sessão pública."""
        if token is None and email is None and participant_id is None and not empty:
            return None
        ids = set()
        if isinstance(token, str) and 0 < len(token) <= 200:
            hashed = hashlib.sha256(token.encode()).hexdigest()
            rows = conn.execute('''SELECT p.id FROM mew_api.sessao s
                JOIN mew_api.participante p ON p.id=s.participante_id
                WHERE s.token_hash=%s AND s.expires_at>now() AND p.registered_at IS NOT NULL
                UNION ALL SELECT id FROM mew_api.participante
                WHERE token_hash=%s AND registered_at IS NULL''', (hashed, hashed)).fetchall()
            ids.update(str(row['id']) for row in rows)
        if email is not None:
            rows = conn.execute('''SELECT p.id FROM mew_api.participante p
                JOIN public.usuario u ON u.id_usuario=p.id_usuario
                WHERE lower(btrim(u.email))=%s AND p.registered_at IS NOT NULL''', (email,)).fetchall()
            ids.update(str(row['id']) for row in rows)
        if participant_id is not None:
            try:
                ids.add(str(UUID(str(participant_id))))
            except ValueError:
                pass
        return sorted(ids)

    def _read(self, conn, *, participant_ids=None, sections=('sessions', 'attempts', 'events'),
              attempt_id=None, request_id=None, filters=None, include_participants=True, **scope):
        data = {'schema_version': 1, 'participants': {}, 'attempts': {}, 'events': [], 'sessions': {}}
        if participant_ids == []:
            return data
        params = () if participant_ids is None else (participant_ids,)
        where = '' if participant_ids is None else ' WHERE p.id = ANY(%s::uuid[])'
        participants = conn.execute('''SELECT p.*,u.nome,u.email,u.senha,u.pontuacao_usuario
                FROM mew_api.participante p JOIN public.usuario u ON u.id_usuario=p.id_usuario''' + where, params) if include_participants else []
        for row in participants:
            pid = str(row['id'])
            data['participants'][pid] = {'id': pid, 'token_hash': row['token_hash'],
                'created_at': utc_iso(row['created_at']), '_db_user_id': row['id_usuario'],
                '_db_score': row['pontuacao_usuario'], 'nome': row['nome'],
                'email': row['email'] if row['registered_at'] else None,
                'password_hash': row['senha'] if row['registered_at'] else None,
                'registered_at': utc_iso(row['registered_at']) if row['registered_at'] else None}
        if 'sessions' in sections:
            where = '' if participant_ids is None else ' WHERE participante_id = ANY(%s::uuid[])'
            for row in conn.execute('SELECT * FROM mew_api.sessao' + where, params):
                sid = str(row['id'])
                data['sessions'][sid] = {'id': sid, 'participant_id': str(row['participante_id']),
                    'token_hash': row['token_hash'], 'created_at': utc_iso(row['created_at']), 'expires_at': utc_iso(row['expires_at'])}
        level_codes = {label: key for key, label in DATABASE_LEVELS.items()}
        by_match = {}
        clauses, attempt_params = [], []
        if participant_ids is not None:
            clauses.append('t.participante_id = ANY(%s::uuid[])')
            attempt_params.append(participant_ids)
        valid_attempt = True
        if attempt_id is not None:
            try:
                attempt_id = str(UUID(str(attempt_id)))
            except ValueError:
                valid_attempt = False
            clauses.append('t.id=%s')
            attempt_params.append(attempt_id)
        if request_id is not None:
            # Tipos inválidos são rejeitados pelo serviço, sem erros de adaptação SQL.
            if not isinstance(request_id, str):
                valid_attempt = False
            clauses.append('t.request_id=%s')
            attempt_params.append(request_id)
        for field, value in (filters or {}).items():
            if field == 'especie_id':
                clauses.append('t.especie_id=%s')
                attempt_params.append(value)
            elif field == 'dificuldade':
                clauses.append('p.nivel=%s')
                attempt_params.append(DATABASE_LEVELS[value])
        where = ' WHERE ' + ' AND '.join(clauses) if clauses else ''
        attempts = conn.execute('''SELECT t.*, p.nivel, p.data_inicio FROM mew_api.tentativa t
                JOIN public.partida p ON p.id_partida=t.id_partida''' + where, tuple(attempt_params)) if 'attempts' in sections and valid_attempt else []
        for row in attempts:
            aid = str(row['id'])
            attempt = {'id': aid, 'participant_id': str(row['participante_id']), 'request_id': row['request_id'],
                       'especie_id': row['especie_id'], 'dificuldade': level_codes[row['nivel']],
                       'started_at': utc_iso(row['data_inicio']), 'finished_at': utc_iso(row['finished_at']) if row['finished_at'] else None,
                       'status': row['status'], 'questions': row['questions'], 'answers': {}, '_db_match_id': row['id_partida']}
            data['attempts'][aid] = attempt
            by_match[row['id_partida']] = attempt
        answers = conn.execute('''SELECT * FROM public.resposta_usuario
                WHERE id_partida = ANY(%s::integer[]) ORDER BY id_resposta_usuario''', (list(by_match),)) if by_match else []
        for row in answers:
            attempt = by_match[row['id_partida']]
            question = next(q for q in attempt['questions'] if q['Id_Questao'] == row['id_questao'])
            qid = question['id']
            correct = row['letra_correta_apresentada'] - 1
            attempt['answers'][qid] = {'id': qid, 'Id_Questao': row['id_questao'], 'topico': question['topico'],
                'escolha': row['resposta_usuario'] - 1, 'acertou': bool(row['acerto_erro']), 'correta': correct,
                'letraCorreta': chr(65 + correct), 'explicacao': question['explicacao'],
                'respondida_em': utc_iso(row['data_resposta']), 'tempo_resposta_segundos': row['tempo_resposta_segundos']}
        if 'events' in sections:
            where = '' if participant_ids is None else ' WHERE participante_id = ANY(%s::uuid[])'
            for row in conn.execute('SELECT * FROM mew_api.evento' + where + ' ORDER BY id', params):
                data['events'].append({'participant_id': str(row['participante_id']), 'especie_id': row['especie_id'],
                                       'tipo': row['tipo'], 'created_at': utc_iso(row['created_at']), '_db_id': row['id']})
        return data

    def _write(self, conn, old, data):
        # Apenas inserções e alterações pertencentes à API. Registros externos
        # não são consultados como usuários da API nem apagados pelo adaptador.
        for pid, participant in data['participants'].items():
            if pid in old['participants']:
                previous = old['participants'][pid]
                if (participant.get('registered_at'), participant['token_hash']) != (previous.get('registered_at'), previous['token_hash']):
                    conn.execute('UPDATE mew_api.participante SET registered_at=%s,token_hash=%s WHERE id=%s',
                                 (participant.get('registered_at'), participant['token_hash'], pid))
                if participant.get('registered_at') and any(participant.get(k) != previous.get(k) for k in ('nome', 'email', 'password_hash')):
                    conn.execute('UPDATE public.usuario SET nome=%s,email=%s,senha=%s WHERE id_usuario=%s',
                        (participant['nome'], participant['email'], participant['password_hash'], participant['_db_user_id']))
                continue
            registered = bool(participant.get('registered_at'))
            user_id = conn.execute('''INSERT INTO public.usuario
                (nome,email,senha,pontuacao_usuario,data_cadastro) VALUES (%s,%s,%s,0,%s) RETURNING id_usuario''',
                (participant['nome'] if registered else 'Participante ' + pid[:8],
                 participant['email'] if registered else 'anon-' + pid + '@mew.invalid',
                 participant['password_hash'] if registered else '!' + participant['token_hash'],
                 utc_naive(participant['created_at']))).fetchone()['id_usuario']
            conn.execute('''INSERT INTO mew_api.participante (id,id_usuario,token_hash,created_at,registered_at) VALUES (%s,%s,%s,%s,%s)''',
                         (pid, user_id, participant['token_hash'], participant['created_at'], participant.get('registered_at')))
            participant['_db_user_id'] = user_id
        for aid, attempt in data['attempts'].items():
            previous = old['attempts'].get(aid)
            user_id = data['participants'][attempt['participant_id']]['_db_user_id']
            if previous is None:
                match_id = conn.execute('''INSERT INTO public.partida (id_usuario,nivel,data_inicio)
                    VALUES (%s,%s,%s) RETURNING id_partida''',
                    (user_id, DATABASE_LEVELS[attempt['dificuldade']], utc_naive(attempt['started_at']))).fetchone()['id_partida']
                conn.execute('''INSERT INTO mew_api.tentativa
                    (id,participante_id,id_partida,request_id,especie_id,status,questions,finished_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)''',
                    (aid, attempt['participant_id'], match_id, attempt['request_id'], attempt['especie_id'],
                     attempt['status'], Jsonb(attempt['questions']), attempt['finished_at']))
                attempt['_db_match_id'] = match_id
            elif (attempt['status'], attempt['finished_at']) != (previous['status'], previous['finished_at']):
                conn.execute('UPDATE mew_api.tentativa SET status=%s,finished_at=%s WHERE id=%s',
                             (attempt['status'], attempt['finished_at'], aid))
            previous_answers = previous['answers'] if previous else {}
            for qid, answer in attempt['answers'].items():
                if qid in previous_answers:
                    continue
                question = next(q for q in attempt['questions'] if q['id'] == qid)
                conn.execute('''INSERT INTO public.resposta_usuario
                    (id_partida,id_questao,resposta_usuario,letra_correta_apresentada,acerto_erro,tempo_resposta_segundos,data_resposta)
                    VALUES (%s,%s,%s,%s,%s,%s,%s)''',
                    (attempt['_db_match_id'], question['Id_Questao'], answer['escolha'] + 1,
                     answer['correta'] + 1, int(answer['acertou']), answer.get('tempo_resposta_segundos'), utc_naive(answer['respondida_em'])))
                if answer['acertou']:
                    conn.execute('UPDATE public.usuario SET pontuacao_usuario=pontuacao_usuario+1 WHERE id_usuario=%s', (user_id,))
        before = {e['_db_id'] for e in old['events']}
        after = {e['_db_id'] for e in data['events'] if '_db_id' in e}
        if before - after:
            conn.execute('DELETE FROM mew_api.evento WHERE id = ANY(%s)', (list(before - after),))
        for event in data['events']:
            if '_db_id' not in event:
                conn.execute('''INSERT INTO mew_api.evento (participante_id,especie_id,tipo,created_at) VALUES (%s,%s,%s,%s)''',
                             (event['participant_id'], event['especie_id'], event['tipo'], event['created_at']))
        removed = set(old.get('sessions', {})) - set(data.get('sessions', {}))
        if removed:
            conn.execute('DELETE FROM mew_api.sessao WHERE id = ANY(%s::uuid[])', (list(removed),))
        for sid, session in data.get('sessions', {}).items():
            if sid not in old.get('sessions', {}):
                conn.execute('''INSERT INTO mew_api.sessao (id,participante_id,token_hash,created_at,expires_at)
                    VALUES (%s,%s,%s,%s,%s)''', (sid, session['participant_id'], session['token_hash'], session['created_at'], session['expires_at']))

    @contextmanager
    def transaction(self, readonly=False, **scope):
        with self.connection() as conn:
            ids = self._participant_ids(conn, **scope)
            if not readonly:
                # Pessoas diferentes não aguardam o mesmo lock global. A linha do
                # participante serializa respostas, pontos e sessões da própria conta.
                where = '' if ids is None else ' WHERE id = ANY(%s::uuid[])'
                conn.execute('SELECT id FROM mew_api.participante' + where + ' ORDER BY id FOR UPDATE',
                             () if ids is None else (ids,)).fetchall()
            original = self._read(conn, participant_ids=ids, **scope)
            if readonly:
                yield original
                return
            data = copy.deepcopy(original)
            yield data
            if data != original:
                self._write(conn, original, data)

    def snapshot(self, **scope):
        with self.transaction(readonly=True, **scope) as data:
            return data
