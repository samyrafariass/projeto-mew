"""Entrada Vercel: reaproveita o contrato HTTP do servidor local."""
import os
from pathlib import Path
import sys
import threading

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.config import ConfigurationError, database_url, load_environment
from backend.browser import secure_cookie_setting
from backend.server import Handler
from backend.service import Service

_service = None
_service_lock = threading.Lock()


def get_service():
    global _service
    if _service is None:
        with _service_lock:
            if _service is None:
                load_environment()
                url = database_url()
                if not url:
                    raise ConfigurationError('Configure DATABASE_URL nas variáveis de ambiente da Vercel.')
                admin_token = os.getenv('MEW_ADMIN_TOKEN', '').strip()
                if len(admin_token) < 24:
                    raise ConfigurationError('Configure MEW_ADMIN_TOKEN com pelo menos 24 caracteres na Vercel.')
                from backend.postgres import PostgresRepository
                repository = PostgresRepository(url)
                try:
                    _service = Service(repository, ROOT / 'Site', admin_token)
                except Exception:
                    repository.close()
                    raise
    return _service


class handler(Handler):
    @property
    def api_service(self):
        return get_service()

    @property
    def cookie_secure(self):
        return secure_cookie_setting()

    def do_GET(self):
        self.api()

    def do_POST(self):
        self.api()

    def do_HEAD(self):
        self.send_error(405, 'Use GET ou POST.')
