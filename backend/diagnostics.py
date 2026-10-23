"""Registros HTTP sem corpos, cookies, credenciais ou mensagens de exceções."""
import json
import logging
from pathlib import Path
import secrets
import time
from urllib.parse import urlsplit


LOGGER = logging.getLogger('mew.api')
if not LOGGER.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(message)s'))
    LOGGER.addHandler(handler)
LOGGER.setLevel(logging.INFO)
LOGGER.propagate = False

PUBLIC_ROUTES = frozenset((
    '/api/health', '/api/especies', '/api/participantes', '/api/cadastro',
    '/api/login', '/api/logout', '/api/sessao', '/api/eventos', '/api/tentativas',
    '/api/participantes/me', '/api/participantes/me/historico',
    '/api/participantes/me/recomendacoes', '/api/participantes/me/recomendacoes/insumos',
    '/api/exportacoes/respostas.csv', '/api/resposta', '/resposta',
))


def route_name(path):
    try:
        path = urlsplit(path).path
    except ValueError:
        return 'unknown'
    if path in PUBLIC_ROUTES:
        return path
    parts = path.strip('/').split('/')
    if len(parts) == 3 and parts[:2] == ['api', 'especies']:
        return '/api/especies/:id'
    if len(parts) in (3, 4) and parts[:2] == ['api', 'tentativas']:
        if len(parts) == 3:
            return '/api/tentativas/:id'
        if parts[3] in ('respostas', 'finalizar', 'respostas.csv'):
            return '/api/tentativas/:id/' + parts[3]
    # Rotas desconhecidas podem conter texto privado fornecido pelo cliente.
    return 'unknown'


class RequestTrace:
    def __init__(self, method, path):
        self.request_id = secrets.token_hex(12)
        self.started = time.perf_counter()
        self.method = method if method in ('GET', 'POST', 'HEAD', 'OPTIONS', 'PUT', 'DELETE', 'PATCH') else 'OTHER'
        self.route = route_name(path)
        self.status = None
        self.error_code = None
        self.error = None
        self.disconnected = False

    def finish(self):
        status = self.status or (499 if self.disconnected else 500)
        record = {'event': 'http_request', 'request_id': self.request_id,
                  'method': self.method, 'route': self.route, 'status': status,
                  'duration_ms': round((time.perf_counter() - self.started) * 1000, 2)}
        if self.error_code:
            record['error_code'] = self.error_code
        if self.disconnected:
            record['client_disconnected'] = True
        if self.error is not None:
            record['error_type'] = type(self.error).__name__
            frame = self.error.__traceback__
            if frame is not None:
                while frame.tb_next:
                    frame = frame.tb_next
                record['error_site'] = '{}:{}:{}'.format(
                    Path(frame.tb_frame.f_code.co_filename).name,
                    frame.tb_lineno, frame.tb_frame.f_code.co_name)
        level = logging.ERROR if status >= 500 else logging.WARNING if status >= 400 else logging.INFO
        LOGGER.log(level, json.dumps(record, ensure_ascii=True, allow_nan=False))
