import copy
import csv
import hashlib
import hmac
import io
import json
import secrets
from datetime import datetime, timezone, timedelta
from pathlib import Path
from uuid import uuid4

from .recommendations import LEVELS, prepare_recommendation, recommend
from .auth import AuthLimiter, dummy_password, hash_password, normalize_email, validate_signup, verify_password


def now():
    return datetime.now(timezone.utc).isoformat()


class ApiError(Exception):
    def __init__(self, status, code, message):
        self.status, self.code, self.message = status, code, message
        super().__init__(message)


def require(condition, status, code, message):
    if not condition:
        raise ApiError(status, code, message)


def digest(token):
    return hashlib.sha256(token.encode()).hexdigest()


class Service:
    def __init__(self, repository, site, admin_token):
        self.repository = repository
        self.admin_token = admin_token
        self.auth_limiter = AuthLimiter()
        fauna = json.loads((Path(site) / "fauna_pe.json").read_text(encoding="utf-8"))
        self.catalog = {a["id"]: a for a in fauna["especies_ameacadas"]}
        if repository is not None and hasattr(repository, 'load_quizzes'):
            self.quizzes = repository.load_quizzes(self.catalog)
        else:
            self.quizzes = json.loads((Path(site) / "quiz_perguntas.json").read_text(encoding="utf-8"))
        for species_id, quiz in self.quizzes.items():
            if species_id not in self.catalog:
                raise ValueError("Quiz sem espécie cadastrada")
            for level in LEVELS:
                if not quiz.get(level):
                    raise ValueError("Quiz sem perguntas")
                for question in quiz[level]:
                    if not (len(question["opcoes"]) == 4 and type(question["correta"]) is int and 0 <= question["correta"] < 4):
                        raise ValueError("Pergunta inválida")

    def participant(self, data, token):
        require(isinstance(token, str) and 0 < len(token) <= 200, 401, "unauthorized", "Identificação ausente ou inválida.")
        hashed = digest(token)
        for session in data.get('sessions', {}).values():
            if hmac.compare_digest(session['token_hash'], hashed) and datetime.fromisoformat(session['expires_at']) > datetime.now(timezone.utc):
                account = data['participants'].get(session['participant_id'])
                if account and account.get('registered_at'):
                    return account
        for participant in data["participants"].values():
            if not participant.get('registered_at') and hmac.compare_digest(participant["token_hash"], hashed):
                return participant
        raise ApiError(401, "unauthorized", "Identificação expirada ou inválida. Inicie uma nova sessão.")

    def profile(self, data, account):
        score = account.get('_db_score')
        if score is None:
            score = sum(int(answer['acertou']) for attempt in data['attempts'].values()
                        if attempt['participant_id'] == account['id'] for answer in attempt['answers'].values())
        return {'id': account['id'], 'nome': account.get('nome'), 'email': account.get('email'),
                'cadastrado': bool(account.get('registered_at')), 'pontuacao': score,
                'criado_em': account['created_at']}

    def new_session(self, data, account):
        current = datetime.now(timezone.utc)
        sessions = data.setdefault('sessions', {})
        for sid in list(sessions):
            if datetime.fromisoformat(sessions[sid]['expires_at']) <= current:
                del sessions[sid]
        personal = sorted((s for s in sessions.values() if s['participant_id'] == account['id']), key=lambda s: s['created_at'])
        for old in personal[:-9]:
            del sessions[old['id']]
        token = secrets.token_urlsafe(32)
        session = {'id': str(uuid4()), 'participant_id': account['id'], 'token_hash': digest(token),
                   'created_at': current.isoformat(), 'expires_at': (current + timedelta(days=7)).isoformat()}
        sessions[session['id']] = session
        return {'id': account['id'], 'token': token, 'cadastrado': True, 'expira_em': session['expires_at'],
                'usuario': self.profile(data, account)}

    def signup(self, body, token):
        try:
            name, email, password = validate_signup(body)
        except ValueError as error:
            raise ApiError(400, 'invalid_registration', str(error)) from None
        encoded = hash_password(password)
        with self.repository.transaction(token=token if token else None, email=email,
                                         sections=('sessions',), empty=not bool(token)) as data:
            require(not any(p.get('registered_at') and p.get('email') == email for p in data['participants'].values()),
                    409, 'registration_conflict', 'Não foi possível cadastrar com os dados informados.')
            if token:
                account = self.participant(data, token)
                require(not account.get('registered_at'), 409, 'already_registered', 'Esta participação já possui cadastro.')
            else:
                account = {'id': str(uuid4()), 'token_hash': digest(secrets.token_urlsafe(32)), 'created_at': now()}
                data['participants'][account['id']] = account
            account.update({'nome': name, 'email': email, 'password_hash': encoded, 'registered_at': now(),
                            'token_hash': digest(secrets.token_urlsafe(32))})
            return 201, self.new_session(data, account)

    def login(self, body, client_ip):
        email, password = body.get('email'), body.get('senha')
        try:
            email = normalize_email(email)
        except ValueError:
            email = ''
        require(self.auth_limiter.allow(client_ip, email), 429, 'auth_rate_limit', 'Muitas tentativas. Aguarde antes de tentar novamente.')
        data = self.repository.snapshot(email=email, sections=())
        account = next((p for p in data['participants'].values() if p.get('registered_at') and p.get('email') == email), None)
        encoded = account.get('password_hash') if account else dummy_password()
        valid = verify_password(password, encoded)
        if account is None or not valid:
            self.auth_limiter.record_failure(client_ip, email)
            raise ApiError(401, 'invalid_credentials', 'E-mail ou senha inválidos.')
        with self.repository.transaction(participant_id=account['id'], sections=('sessions',)) as data:
            current = data['participants'].get(account['id'])
            require(current is not None and current.get('password_hash') == encoded, 401, 'invalid_credentials', 'E-mail ou senha inválidos.')
            session = self.new_session(data, current)
        self.auth_limiter.record_success(client_ip, email)
        return 200, session

    def own_attempt(self, data, attempt_id, participant):
        attempt = data["attempts"].get(attempt_id)
        require(attempt is not None and attempt["participant_id"] == participant["id"], 404, "not_found", "Tentativa não encontrada.")
        return attempt

    def public_attempt(self, attempt):
        return {"id": attempt["id"], "especie_id": attempt["especie_id"], "dificuldade": attempt["dificuldade"],
                "status": attempt["status"], "iniciada_em": attempt["started_at"], "finalizada_em": attempt["finished_at"],
                "perguntas": [{**{k: q[k] for k in ("id", "pergunta", "opcoes", "topico")},
                               "Id_Questao": q.get('Id_Questao', q['id'])} for q in attempt["questions"]],
                "respostas": list(attempt["answers"].values()), "resultado": self.result(attempt) if attempt["status"] == "concluida" else None}

    def result(self, attempt):
        answers = list(attempt["answers"].values())
        correct = sum(x["acertou"] for x in answers)
        total = len(attempt["questions"])
        topics = {}
        for answer in answers:
            item = topics.setdefault(answer["topico"], {"acertos": 0, "total": 0})
            item["total"] += 1
            item["acertos"] += int(answer["acertou"])
        awarded = correct / total >= .7
        return {"tentativa_id": attempt["id"], "acertos": correct, "total": total, "percentual": correct / total,
                "topicos": topics, "selo": {"conquistado": awarded, "nome": "Analista Ambiental",
                "id": "MEW-" + attempt["id"] if awarded else None, "emitido_em": attempt["finished_at"] if awarded else None}}

    def dispatch(self, method, path, body, token, query, client_ip='local', expected_participant=None):
        if method == 'POST' and path == '/api/cadastro':
            return self.signup(body, token)
        if method == 'POST' and path == '/api/login':
            return self.login(body, client_ip)
        if method == 'POST' and path in ('/api/resposta', '/resposta'):
            attempt_id = body.get('tentativa_id')
            question_id = body.get('Id_Questao')
            require(isinstance(attempt_id, str) and '/' not in attempt_id, 400, 'invalid_attempt', 'Informe tentativa_id.')
            require(type(question_id) in (int, str), 400, 'invalid_question', 'Informe Id_Questao.')
            path = f'/api/tentativas/{attempt_id}/respostas'
            body = {'pergunta_id': str(question_id), 'alternativa_escolhida': body.get('alternativa_escolhida')}
        parts = path.strip("/").split("/")
        if method == "GET" and path == "/api/health":
            if hasattr(self.repository, 'check_health'):
                self.repository.check_health()
            return 200, {"status": "ok", "armazenamento": getattr(self.repository, 'kind', 'json')}
        if method == "GET" and path == "/api/especies":
            return 200, {"estado": "Pernambuco", "pais": "Brasil", "especies_ameacadas": list(self.catalog.values())}
        if method == "GET" and len(parts) == 3 and parts[:2] == ["api", "especies"]:
            animal = self.catalog.get(parts[2])
            require(animal is not None, 404, "not_found", "Espécie não encontrada.")
            return 200, {**animal, "nome": animal["nome_popular"], "niveis": list(LEVELS)}
        if method == "POST" and path == "/api/participantes":
            token_value = secrets.token_urlsafe(32)
            participant = {"id": str(uuid4()), "token_hash": digest(token_value), "created_at": now()}
            with self.repository.transaction(participant_id=participant['id'], sections=()) as data:
                data["participants"][participant["id"]] = participant
            return 201, {"id": participant["id"], "token": token_value, 'cadastrado': False, 'cadastro_obrigatorio': True}

        if method == "GET" and path == "/api/exportacoes/respostas.csv":
            require(bool(token) and hmac.compare_digest(digest(token), digest(self.admin_token)), 401, "unauthorized", "Chave da equipe ausente ou inválida.")
            filters = {}
            for key in query:
                require(key in ("especie_id", "dificuldade"), 400, "invalid_filter", "Filtro desconhecido.")
            for key in ("especie_id", "dificuldade"):
                if key in query:
                    value = query[key][0]
                    require(value in (self.catalog if key == "especie_id" else LEVELS), 400, "invalid_filter", "Filtro inválido.")
                    filters[key] = value
            data = self.repository.snapshot(sections=('attempts',), filters=filters, include_participants=False)
            attempts = [a for a in data['attempts'].values() if all(a[key] == value for key, value in filters.items())]
            return 200, self.csv(attempts)

        recommendation_paths = ('/api/participantes/me/recomendacoes', '/api/participantes/me/recomendacoes/insumos')
        sections = ['sessions']
        if path == '/api/participantes/me/historico' or path in recommendation_paths or parts[:2] == ['api', 'tentativas']:
            sections.append('attempts')
        if path == '/api/eventos' or path in recommendation_paths:
            sections.append('events')
        attempt_id = parts[2] if len(parts) >= 3 and parts[:2] == ['api', 'tentativas'] else None
        request_id = body.get('request_id') if method == 'POST' and path == '/api/tentativas' else None
        with self.repository.transaction(token=token, sections=sections, attempt_id=attempt_id,
                                         request_id=request_id, readonly=method == 'GET') as data:
            participant = self.participant(data, token)
            pid = participant["id"]
            require(expected_participant is None or expected_participant == pid, 409, 'session_changed',
                    'A conta foi alterada em outra aba. Atualize a página antes de continuar.')
            if method == "GET" and path == "/api/participantes/me":
                return 200, self.profile(data, participant)
            if method == 'POST' and path == '/api/logout':
                hashed = digest(token)
                for sid, session in list(data.get('sessions', {}).items()):
                    if hmac.compare_digest(session['token_hash'], hashed):
                        del data['sessions'][sid]
                if not participant.get('registered_at'):
                    participant['token_hash'] = digest(secrets.token_urlsafe(32))
                return 200, {'encerrado': True}
            if method == 'POST' and (path == '/api/tentativas' or (len(parts) == 4 and parts[:2] == ['api', 'tentativas'] and parts[3] in ('respostas', 'finalizar'))):
                require(bool(participant.get('registered_at')), 403, 'registration_required', 'Faça seu cadastro ou entre na sua conta antes de iniciar o quiz.')
            if method == "GET" and path == "/api/participantes/me/historico":
                attempts = sorted((a for a in data["attempts"].values() if a["participant_id"] == pid), key=lambda a: a["started_at"], reverse=True)
                return 200, {"tentativas": [{"id": a["id"], "especie_id": a["especie_id"], "dificuldade": a["dificuldade"], "status": a["status"],
                                            "iniciada_em": a["started_at"], "resultado": self.result(a) if a["status"] == "concluida" else None} for a in attempts]}
            if method == "GET" and path == "/api/participantes/me/recomendacoes":
                return 200, recommend(data, pid, self.catalog, self.quizzes)
            if method == 'GET' and path == '/api/participantes/me/recomendacoes/insumos':
                return 200, prepare_recommendation(data, pid, self.catalog, self.quizzes)
            if method == "POST" and path == "/api/eventos":
                require(isinstance(body.get("tipo"), str) and body["tipo"] in ("visualizacao_especie", "exploracao_3d", "hotspot"), 400, "invalid_event", "Evento inválido.")
                require(isinstance(body.get("especie_id"), str) and body["especie_id"] in self.catalog, 400, "invalid_species", "Espécie inválida.")
                # Evita crescimento ilimitado das visitas; respostas nunca são descartadas.
                personal_events = [e for e in data["events"] if e["participant_id"] == pid]
                if len(personal_events) >= 1000:
                    data["events"].remove(personal_events[0])
                data["events"].append({"participant_id": pid, "especie_id": body["especie_id"], "tipo": body["tipo"], "created_at": now()})
                return 201, {"registrado": True}
            if method == "POST" and path == "/api/tentativas":
                species_id, level, request_id = body.get("especie_id"), body.get("dificuldade"), body.get("request_id")
                require(isinstance(species_id, str) and species_id in self.quizzes, 400, "invalid_species", "Espécie inválida.")
                require(isinstance(level, str) and level in LEVELS, 400, "invalid_level", "Dificuldade inválida.")
                require(isinstance(request_id, str) and 1 <= len(request_id) <= 100, 400, "invalid_request_id", "Informe um request_id de até 100 caracteres.")
                for existing in data["attempts"].values():
                    if existing["participant_id"] == pid and existing["request_id"] == request_id:
                        require(existing["especie_id"] == species_id and existing["dificuldade"] == level, 409, "request_conflict", "request_id já utilizado para outro desafio.")
                        return 200, self.public_attempt(existing)
                attempt = {"id": str(uuid4()), "participant_id": pid, "request_id": request_id, "especie_id": species_id,
                           "dificuldade": level, "started_at": now(), "finished_at": None, "status": "em_andamento",
                           "questions": copy.deepcopy(secrets.SystemRandom().sample(self.quizzes[species_id][level], 5)), "answers": {}}
                data["attempts"][attempt["id"]] = attempt
                return 201, self.public_attempt(attempt)
            if len(parts) in (3, 4) and parts[:2] == ["api", "tentativas"]:
                attempt = self.own_attempt(data, parts[2], participant)
                if method == "GET" and len(parts) == 3:
                    return 200, self.public_attempt(attempt)
                action = parts[3] if len(parts) == 4 else ""
                if method == "GET" and action == "respostas.csv":
                    return 200, self.csv([attempt])
                if method == "POST" and action == "respostas":
                    question_id, choice = body.get("pergunta_id"), body.get("alternativa_escolhida")
                    require(isinstance(question_id, str), 400, "invalid_question", "Pergunta inválida.")
                    require(type(choice) is int and 0 <= choice < 4, 400, "invalid_choice", "Escolha uma alternativa entre 0 e 3.")
                    question = next((q for q in attempt["questions"] if q["id"] == question_id), None)
                    require(question is not None, 400, "invalid_question", "Pergunta não pertence a esta tentativa.")
                    previous = attempt["answers"].get(question_id)
                    if previous:
                        require(previous["escolha"] == choice, 409, "already_answered", "Esta pergunta já foi respondida com outra alternativa.")
                        return 200, previous
                    require(attempt["status"] == "em_andamento", 409, "finished", "Tentativa já finalizada.")
                    answered_at = now()
                    previous_time = max((a['respondida_em'] for a in attempt['answers'].values()), default=attempt['started_at'])
                    elapsed = max(0, int((datetime.fromisoformat(answered_at) - datetime.fromisoformat(previous_time)).total_seconds()))
                    answer = {"id": question_id, "Id_Questao": question.get('Id_Questao', question_id),
                              "topico": question["topico"], "escolha": choice,
                              "acertou": choice == question["correta"], "correta": question["correta"],
                              "letraCorreta": chr(65 + question['correta']),
                              "explicacao": question["explicacao"], "respondida_em": answered_at,
                              "tempo_resposta_segundos": min(elapsed, 2147483647)}
                    attempt["answers"][question_id] = answer
                    return 201, answer
                if method == "POST" and action == "finalizar":
                    require(len(attempt["answers"]) == len(attempt["questions"]), 409, "incomplete", "Responda todas as perguntas antes de finalizar.")
                    if attempt["status"] != "concluida":
                        attempt["status"], attempt["finished_at"] = "concluida", now()
                    return 200, self.result(attempt)
            raise ApiError(404, "not_found", "Rota não encontrada.")

    def csv(self, attempts):
        output = io.StringIO(newline="")
        fields = ["participante_id", "tentativa_id", "especie_id", "especie", "dificuldade", "status", "iniciada_em", "finalizada_em",
                  "pergunta_id", "enunciado", "topico", "alternativa_escolhida", "texto_escolhido", "alternativa_correta", "texto_correto", "acertou", "respondida_em"]
        writer = csv.DictWriter(output, fieldnames=fields, delimiter=";")
        writer.writeheader()
        for attempt in sorted(attempts, key=lambda a: a["started_at"]):
            for question in attempt["questions"]:
                answer = attempt["answers"].get(question["id"])
                if not answer:
                    continue
                row = {"participante_id": attempt["participant_id"], "tentativa_id": attempt["id"], "especie_id": attempt["especie_id"],
                       "especie": self.catalog[attempt["especie_id"]]["nome_popular"], "dificuldade": attempt["dificuldade"], "status": attempt["status"],
                       "iniciada_em": attempt["started_at"], "finalizada_em": attempt["finished_at"], "pergunta_id": question["id"],
                       "enunciado": question["pergunta"], "topico": answer["topico"], "alternativa_escolhida": answer["escolha"],
                       "texto_escolhido": question["opcoes"][answer["escolha"]], "alternativa_correta": question["correta"],
                       "texto_correto": question["opcoes"][question["correta"]], "acertou": int(answer["acertou"]), "respondida_em": answer["respondida_em"]}
                # Texto exportado não deve se tornar fórmula ao abrir no Excel.
                writer.writerow({k: "'" + v if isinstance(v, str) and v.lstrip().startswith(("=", "+", "-", "@")) else v for k, v in row.items()})
        return output.getvalue().encode("utf-8-sig")
