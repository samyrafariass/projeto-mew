from concurrent.futures import ThreadPoolExecutor
import json
import os
from pathlib import Path
import socket
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from backend.auth import AuthLimiter
from backend.server import SITE, create_server
from backend.service import ApiError, Service
from backend.storage import JsonRepository, StorageUnavailable


class LoginReliabilityTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.service = Service(JsonRepository(Path(self.tmp.name) / 'state.json'), SITE,
                               'private-test-admin-at-least-24-chars')
        self.password = 'Senha real para testar o login!'
        self.body = {'email': 'aluno@example.com', 'senha': self.password}
        self.service.signup({'nome': 'Aluno de teste', **self.body}, '')

    def login(self, password=None, email='aluno@example.com', ip='rede-da-turma'):
        return self.service.login({'email': email, 'senha': self.password if password is None else password}, ip)

    def assert_failure(self, status=401):
        with self.assertRaises(ApiError) as raised:
            self.login('senha incorreta')
        self.assertEqual(raised.exception.status, status)

    def test_more_than_five_successful_logins_are_allowed(self):
        for _ in range(12):
            self.assertEqual(self.login(email=' ALUNO@EXAMPLE.COM ')[0], 200)

    def test_success_clears_failures_and_other_accounts_keep_access(self):
        for _ in range(4):
            self.assert_failure()
        self.assertEqual(self.login()[0], 200)
        for _ in range(5):
            self.assert_failure()
        self.assert_failure(429)
        self.service.signup({'nome': 'Outro aluno', 'email': 'outro@example.com', 'senha': self.password}, '')
        self.assertEqual(self.login(email='outro@example.com')[0], 200)
        self.assertEqual(self.login(ip='outra-rede')[0], 200)

    def test_database_failures_do_not_count_as_wrong_passwords(self):
        for _ in range(4):
            self.assert_failure()
        with patch.object(self.service.repository, 'snapshot', side_effect=StorageUnavailable()):
            for _ in range(6):
                with self.assertRaises(StorageUnavailable):
                    self.login()
        self.assertEqual(self.login()[0], 200)

    def test_parallel_successful_logins_do_not_trigger_a_lockout(self):
        with ThreadPoolExecutor(max_workers=4) as workers:
            responses = list(workers.map(lambda _: self.login(), range(12)))
        self.assertTrue(all(status == 200 for status, _ in responses))


class LimiterWindowTests(unittest.TestCase):
    def test_lockout_expires_without_blocking_other_students(self):
        limiter = AuthLimiter()
        with patch('backend.auth.time.monotonic', return_value=100):
            for _ in range(5):
                limiter.record_failure('rede', 'aluno@example.com')
            self.assertFalse(limiter.allow('rede', 'aluno@example.com'))
            self.assertTrue(limiter.allow('rede', 'outra-conta@example.com'))
        with patch('backend.auth.time.monotonic', return_value=1000):
            self.assertTrue(limiter.allow('rede', 'aluno@example.com'))

    def test_counter_memory_is_bounded_without_a_global_ip_lockout(self):
        limiter = AuthLimiter()
        limiter.max_buckets = 3
        for number in range(10):
            limiter.record_failure('rede', f'aluno-{number}@example.com')
        self.assertLessEqual(len(limiter.buckets), 3)
        self.assertTrue(limiter.allow('rede', 'novo-aluno@example.com'))


class RequestDiagnosticsTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.server = create_server(port=0, data_file=Path(self.tmp.name) / 'state.json',
                                    admin_token='private-test-admin-at-least-24-chars')
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f'http://127.0.0.1:{self.server.server_port}'

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.tmp.cleanup()

    def call(self, path='/api/health?token=private-query', body=None):
        request = Request(self.base + path,
                          headers={'Authorization': 'Bearer private-bearer',
                                   'Cookie': 'mew_session=private-cookie', 'Content-Type': 'application/json'},
                          data=body)
        try:
            response = urlopen(request, timeout=10)
        except HTTPError as error:
            response = error
        with response:
            return response.status, response.headers, response.read()

    def check_record(self, status, path='/api/health?token=private-query', body=None):
        with self.assertLogs('mew.api', level='INFO') as captured:
            actual, headers, _ = self.call(path, body)
            # A leitura do corpo pode terminar antes de o handler concluir o log.
            for _ in range(100):
                if captured.records:
                    break
                threading.Event().wait(.01)
        self.assertEqual(actual, status)
        self.assertEqual(len(captured.records), 1)
        record = json.loads(captured.records[0].getMessage())
        self.assertEqual(record['request_id'], headers['X-Request-ID'])
        self.assertEqual(record['status'], status)
        self.assertGreaterEqual(record['duration_ms'], 0)
        for secret in ('private-query', 'private-bearer', 'private-cookie', 'private-body', 'private-exception'):
            self.assertNotIn(secret, captured.output[0])
        return record

    def test_success_has_a_correlated_id_and_no_credentials(self):
        record = self.check_record(200)
        self.assertEqual(record['route'], '/api/health')
        self.assertEqual(record['method'], 'GET')

    def test_database_error_has_status_and_safe_error_code(self):
        with patch.object(self.server.service.repository, 'check_health', create=True,
                          side_effect=StorageUnavailable()):
            record = self.check_record(503)
        self.assertEqual(record['error_code'], 'database_unavailable')
        self.assertEqual(record['error_type'], 'StorageUnavailable')

    def test_unexpected_error_does_not_log_its_private_message(self):
        with patch.object(self.server.service.repository, 'check_health', create=True,
                          side_effect=RuntimeError('private-exception')):
            record = self.check_record(500)
        self.assertEqual(record['error_type'], 'RuntimeError')
        self.assertIn('error_site', record)

    def test_invalid_body_is_not_logged(self):
        record = self.check_record(400, '/api/login', b'{"senha":"private-body"')
        self.assertEqual(record['error_code'], 'invalid_json')

    def test_unknown_paths_do_not_disclose_private_text(self):
        record = self.check_record(401, '/api/private-query')
        self.assertEqual(record['route'], 'unknown')


@unittest.skipUnless(os.getenv('MEW_TEST_NEON') == '1', 'Teste de leitura opcional do Neon.')
class NeonConnectionReliabilityTests(unittest.TestCase):
    def setUp(self):
        from backend.config import database_url, load_environment
        from backend.postgres import PostgresRepository
        load_environment()
        self.repository = PostgresRepository(database_url())
        self.addCleanup(self.repository.close)

    def test_dead_idle_connection_is_replaced_before_the_next_query(self):
        with self.repository.connection() as connection:
            connection.execute('SELECT 1')
        # Interrompe somente o socket desta conexão de teste; não encerra
        # sessões do PostgreSQL nem modifica registros compartilhados.
        transport = socket.socket(fileno=connection.pgconn.socket)
        try:
            transport.shutdown(socket.SHUT_RDWR)
        finally:
            transport.detach()
        self.repository.check_health()

    def test_twenty_parallel_reads_use_the_pool_without_failures(self):
        with ThreadPoolExecutor(max_workers=20) as workers:
            results = list(workers.map(lambda _: self.repository.check_health(), range(20)))
        self.assertEqual(len(results), 20)


if __name__ == '__main__':
    unittest.main()
