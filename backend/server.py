"""Execute na raiz: python -m backend.server. Configuração privada no .env."""
import argparse
import json
import logging
import os
from pathlib import Path
import secrets
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlsplit

from .service import ApiError, Service
from .storage import AccountConflict, JsonRepository, StorageUnavailable
from .config import ConfigurationError, database_url as configured_database_url, load_environment
from .browser import browser_session, cookie_header, read_cookie, secure_cookie_setting, verify_browser_post
from .diagnostics import RequestTrace

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "Site"
MAX_BODY = 16384


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE), **kwargs)

    @property
    def api_service(self):
        return self.server.service

    @property
    def cookie_secure(self):
        return self.server.cookie_secure

    def end_headers(self):
        if getattr(self, '_session_cookie', None):
            self.send_header('Set-Cookie', self._session_cookie)
            self._session_cookie = None
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("Cache-Control", "no-store")
        trace = getattr(self, '_request_trace', None)
        if trace is not None:
            self.send_header('X-Request-ID', trace.request_id)
        super().end_headers()

    def send_response(self, code, message=None):
        trace = getattr(self, '_request_trace', None)
        if trace is not None:
            trace.status = code
        super().send_response(code, message)

    def log_message(self, fmt, *args):
        # Não registrar query string, cabeçalhos de autenticação ou corpos.
        if getattr(self, '_request_trace', None) is None:
            logging.info("%s %s", self.command, urlsplit(self.path).path)

    def send_json(self, status, value):
        trace = getattr(self, '_request_trace', None)
        if trace is not None and isinstance(value, dict) and isinstance(value.get('erro'), dict):
            trace.error_code = value['erro'].get('codigo')
        payload = json.dumps(value, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def api(self):
        self._session_cookie = None
        self._request_trace = RequestTrace(self.command, self.path)
        try:
            body = {}
            if self.command == "POST":
                if self.headers.get("Transfer-Encoding"):
                    raise ApiError(400, "invalid_body", "Transfer-Encoding não suportado.")
                if self.headers.get_content_type() != "application/json":
                    raise ApiError(415, "invalid_content_type", "Envie application/json.")
                try:
                    length = int(self.headers.get("Content-Length", "0"))
                except ValueError:
                    raise ApiError(400, "invalid_body", "Tamanho de corpo inválido.")
                if not 0 < length <= MAX_BODY:
                    raise ApiError(413, "invalid_body", "Corpo ausente ou acima de 16 KB.")
                try:
                    body = json.loads(self.rfile.read(length).decode("utf-8"))
                except (ValueError, UnicodeError):
                    raise ApiError(400, "invalid_json", "JSON inválido.")
                if not isinstance(body, dict):
                    raise ApiError(400, "invalid_json", "Envie um objeto JSON.")
            authorization = self.headers.get("Authorization", "")
            bearer = authorization[7:] if authorization.startswith("Bearer ") else ""
            cookie = read_cookie(self.headers)
            browser_client = not bearer and (self.headers.get('X-MEW-Client') == 'browser' or bool(cookie))
            token = bearer or cookie
            parsed = urlsplit(self.path)
            if self.command == 'POST' and browser_client:
                verify_browser_post(self.headers, cookie, self.cookie_secure)
                if parsed.path not in ('/api/login', '/api/cadastro', '/api/participantes'):
                    if not self.headers.get('X-MEW-Participant'):
                        raise ApiError(409, 'session_changed', 'Atualize a página para confirmar a conta atual.')
            if self.command == 'GET' and parsed.path == '/api/sessao':
                if not cookie:
                    self.send_json(200, {'id': None, 'cadastrado': False, 'usuario': None, 'csrf_token': None})
                    return
                try:
                    _, profile = self.api_service.dispatch('GET', '/api/participantes/me', {}, cookie, {})
                except ApiError as error:
                    if error.status != 401:
                        raise
                    self._session_cookie = cookie_header('', self.cookie_secure)
                    self.send_json(200, {'id': None, 'cadastrado': False, 'usuario': None, 'csrf_token': None})
                    return
                self.send_json(200, browser_session(profile, cookie))
                return
            # O cadastro pode aproveitar um visitante, mas uma conta existente
            # não é sobrescrita ao cadastrar outra pessoa no mesmo navegador.
            if browser_client and self.command == 'POST' and parsed.path == '/api/cadastro' and cookie:
                _, profile = self.api_service.dispatch('GET', '/api/participantes/me', {}, cookie, {})
                if profile['cadastrado']:
                    token = ''
            status, value = self.api_service.dispatch(self.command, parsed.path, body, token,
                parse_qs(parsed.query, keep_blank_values=True), client_ip=self.client_address[0],
                expected_participant=self.headers.get('X-MEW-Participant') if browser_client else None)
            if browser_client and self.command == 'POST' and parsed.path in ('/api/login', '/api/cadastro', '/api/participantes'):
                fresh_token = value['token']
                _, profile = self.api_service.dispatch('GET', '/api/participantes/me', {}, fresh_token, {})
                self._session_cookie = cookie_header(fresh_token, self.cookie_secure)
                value = browser_session(profile, fresh_token, value.get('expira_em'))
            elif browser_client and parsed.path == '/api/logout':
                self._session_cookie = cookie_header('', self.cookie_secure)
            if isinstance(value, bytes):
                self.send_response(status)
                self.send_header("Content-Type", "text/csv; charset=utf-8")
                self.send_header("Content-Disposition", 'attachment; filename="mew-respostas.csv"')
                self.send_header("Content-Length", str(len(value)))
                self.end_headers()
                self.wfile.write(value)
            else:
                self.send_json(status, value)
        except ApiError as error:
            self.send_json(error.status, {"erro": {"codigo": error.code, "mensagem": error.message}})
        except AccountConflict as error:
            self.send_json(409, {'erro': {'codigo': 'registration_conflict', 'mensagem': str(error)}})
        except ConfigurationError as error:
            self._request_trace.error = error
            self.send_json(503, {'erro': {'codigo': 'configuration_error', 'mensagem': str(error)}})
        except StorageUnavailable as error:
            self._request_trace.error = error
            self.send_json(503, {'erro': {'codigo': 'database_unavailable', 'mensagem': str(error)}})
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            self._request_trace.disconnected = True
        except Exception as error:
            self._request_trace.error = error
            self.send_json(500, {"erro": {"codigo": "internal_error", "mensagem": "Não foi possível concluir. Tente novamente."}})
        finally:
            try:
                self._request_trace.finish()
            finally:
                self._request_trace = None

    def allowed_static(self):
        path = unquote(urlsplit(self.path).path)
        resolved = (SITE / path.lstrip("/")).resolve()
        if not resolved.is_relative_to(SITE.resolve()):
            return False
        if any(part.startswith(".") for part in Path(path).parts):
            return False
        if resolved.name.lower() == "quiz_perguntas.json":
            return False
        return resolved.is_file() or resolved == SITE.resolve()

    def do_GET(self):
        if urlsplit(self.path).path.startswith("/api/"):
            self.api()
        elif self.allowed_static():
            super().do_GET()
        else:
            self.send_error(404)

    def do_HEAD(self):
        if urlsplit(self.path).path.startswith("/api/") or not self.allowed_static():
            self.send_error(404)
        else:
            super().do_HEAD()

    def do_POST(self):
        if urlsplit(self.path).path.startswith("/api/") or urlsplit(self.path).path == '/resposta':
            self.api()
        else:
            self.send_error(404)


class MewServer(ThreadingHTTPServer):
    daemon_threads = True

    def server_close(self):
        super().server_close()
        if hasattr(self, 'service'):
            self.service.repository.close()


def create_server(host="127.0.0.1", port=8000, data_file=None, admin_token=None, database_url=None, repository=None, cookie_secure=None):
    # data_file explícito isola os testes/demonstrações locais do banco real.
    use_database = database_url or (configured_database_url() if data_file is None and repository is None else None)
    data_file = Path(data_file or os.getenv("MEW_DATA_FILE", ROOT / "backend" / "data" / "mew.json"))
    if not admin_token:
        admin_token = os.getenv("MEW_ADMIN_TOKEN")
    if not admin_token:
        token_file = data_file.parent / "admin-token.txt"
        token_file.parent.mkdir(parents=True, exist_ok=True)
        if not token_file.exists():
            token_file.write_text(secrets.token_urlsafe(32), encoding="utf-8")
        admin_token = token_file.read_text(encoding="utf-8").strip()
    if len(admin_token) < 24:
        raise ValueError("A chave da equipe deve ter pelo menos 24 caracteres.")
    if repository is None:
        if use_database:
            from .postgres import PostgresRepository
            repository = PostgresRepository(use_database)
        else:
            repository = JsonRepository(data_file)
    server = None
    try:
        service = Service(repository, SITE, admin_token)
        server = MewServer((host, port), Handler)
        server.service = service
        server.cookie_secure = secure_cookie_setting() if cookie_secure is None else cookie_secure
    except Exception:
        repository.close()
        if server:
            server.server_close()
        raise
    return server


def main():
    load_environment()
    parser = argparse.ArgumentParser(description="Projeto MEW — front e API no mesmo endereço")
    parser.add_argument("--host", default=os.getenv("MEW_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.getenv("MEW_PORT", "8000")))
    parser.add_argument("--data-file", type=Path)
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    try:
        server = create_server(args.host, args.port, args.data_file)
    except (ConfigurationError, StorageUnavailable) as error:
        raise SystemExit(str(error)) from None
    print(f"MEW disponível em http://{args.host}:{args.port}/", flush=True)
    print(f"Armazenamento: {server.service.repository.kind}", flush=True)
    print("Relatório da equipe: /relatorios.html. Chave em backend/data/admin-token.txt (ou MEW_ADMIN_TOKEN).", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
