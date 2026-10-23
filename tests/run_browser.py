"""Executa testes reais de navegador com dados isolados e servidor temporário."""
import argparse
import os
import json
from pathlib import Path
import subprocess
import tempfile
import threading
from http.server import SimpleHTTPRequestHandler
from urllib.parse import urlsplit

from backend.server import create_server


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--node', default='node')
    parser.add_argument('--modules', default='')
    parser.add_argument('--neon', action='store_true', help='Usa o banco real dentro de transação desfeita no final.')
    parser.add_argument('--vercel', action='store_true', help='Usa a entrada Vercel e os arquivos preparados para publicação.')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    output = root / 'test-results'
    output.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(dir=output) as directory:
        token = 'browser-test-admin-key-with-24-characters'
        repository = None
        if args.neon:
            from dotenv import dotenv_values
            from tests.neon_support import RollbackPostgresRepository
            url = dotenv_values(root / '.env').get('DATABASE_URL')
            if not url:
                raise SystemExit('Configure DATABASE_URL no .env antes do teste --neon.')
            repository = RollbackPostgresRepository(url)
        server = create_server(port=0, data_file=Path(directory) / 'data.json', admin_token=token, repository=repository, cookie_secure=False)
        if args.vercel:
            from api.index import handler
            from scripts.build_site import build_site
            from backend.recommender.build_wasm import verify_wasm
            verify_wasm()
            public = build_site(root)

            class Preview(handler):
                @property
                def api_service(self):
                    return server.service

                @property
                def cookie_secure(self):
                    return False  # Somente o servidor HTTP temporário deste teste.

                def __init__(self, *args, **kwargs):
                    SimpleHTTPRequestHandler.__init__(self, *args, directory=str(public), **kwargs)

                def do_GET(self):
                    if urlsplit(self.path).path.startswith('/api/'):
                        return super().do_GET()
                    return SimpleHTTPRequestHandler.do_GET(self)

            server.RequestHandlerClass = Preview
        question_file = Path(directory) / 'questions.json'
        question_file.write_text(json.dumps(server.service.quizzes, ensure_ascii=False), encoding='utf-8')
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            env = {**os.environ, 'MEW_TEST_URL': f'http://127.0.0.1:{server.server_port}', 'MEW_TEST_ADMIN_TOKEN': token,
                   'MEW_TEST_QUESTIONS_PATH': str(question_file)}
            if args.modules:
                env['MEW_NODE_MODULES'] = args.modules
            result = subprocess.run([args.node, str(root / 'tests' / 'e2e.cjs')], env=env, cwd=root)
        finally:
            server.shutdown()
            server.server_close()
            thread.join()
        raise SystemExit(result.returncode)


if __name__ == '__main__':
    main()
