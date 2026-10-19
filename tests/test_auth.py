from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import tempfile
from concurrent.futures import ThreadPoolExecutor
import unittest

from backend.auth import hash_password, verify_password
from backend.service import ApiError, Service
from backend.server import SITE
from backend.storage import JsonRepository

PASSWORD = 'Minha senha longa de teste 2026!'


class AccountTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / 'accounts.json'
        self.repository = JsonRepository(self.path)
        self.service = Service(self.repository, SITE, 'admin-test-with-at-least-24-characters')

    def tearDown(self):
        self.tmp.cleanup()

    def call(self, method, path, body=None, token='', ip='test'):
        return self.service.dispatch(method, path, body or {}, token, {}, client_ip=ip)

    def signup(self, email='Pessoa@Example.com', token=''):
        return self.call('POST', '/api/cadastro', {'nome': 'Pessoa de teste', 'email': email, 'senha': PASSWORD}, token)[1]

    def assert_error(self, status, method, path, body=None, token='', ip='test'):
        with self.assertRaises(ApiError) as raised:
            self.call(method, path, body, token, ip)
        self.assertEqual(raised.exception.status, status)
        return raised.exception

    def test_registration_required_and_guest_upgrade(self):
        _, guest = self.call('POST', '/api/participantes')
        body = {'especie_id': 'pe-1', 'dificuldade': 'facil', 'request_id': 'one'}
        error = self.assert_error(403, 'POST', '/api/tentativas', body, guest['token'])
        self.assertEqual(error.code, 'registration_required')
        account = self.signup(token=guest['token'])
        self.assertEqual(account['id'], guest['id'])
        self.assert_error(401, 'GET', '/api/participantes/me', token=guest['token'])
        self.assertEqual(self.call('POST', '/api/tentativas', body, account['token'])[0], 201)
        profile = self.call('GET', '/api/participantes/me', token=account['token'])[1]
        self.assertEqual(profile['email'], 'pessoa@example.com')
        self.assertTrue(profile['cadastrado'])

    def test_passwords_and_tokens_are_not_stored_in_plaintext(self):
        account = self.signup()
        stored = self.path.read_text(encoding='utf-8')
        self.assertNotIn(PASSWORD, stored)
        self.assertNotIn(account['token'], stored)
        state = self.repository.snapshot()
        encoded = state['participants'][account['id']]['password_hash']
        self.assertTrue(verify_password(PASSWORD, encoded))
        self.assertFalse(verify_password(PASSWORD + 'x', encoded))
        self.assertNotEqual(encoded, hash_password(PASSWORD))
        self.assertNotIn('password_hash', json.dumps(account))
        self.assertNotIn('token_hash', json.dumps(account))

    def test_validation_duplicate_email_and_login_errors(self):
        for key, value in (('nome', 'x'), ('nome', 'a'*51), ('email', 'invalid'), ('senha', '1234'), ('senha', 'a'*129), ('senha', None)):
            body = {'nome': 'Pessoa teste', 'email': 'pessoa@example.com', 'senha': PASSWORD, key: value}
            self.assert_error(400, 'POST', '/api/cadastro', body, ip=key+str(value))
        self.signup()
        self.assert_error(409, 'POST', '/api/cadastro', {'nome': 'Outra pessoa', 'email': ' PESSOA@example.com ', 'senha': PASSWORD})
        wrong = self.assert_error(401, 'POST', '/api/login', {'email': 'pessoa@example.com', 'senha': 'Outra senha incorreta longa!'})
        unknown = self.assert_error(401, 'POST', '/api/login', {'email': 'naoexiste@example.com', 'senha': 'Outra senha incorreta longa!'})
        self.assertEqual(wrong.message, unknown.message)

    def test_cross_device_logout_expiry_and_restart(self):
        first = self.signup()
        self.service = Service(JsonRepository(self.path), SITE, 'admin-test-with-at-least-24-characters')
        second = self.call('POST', '/api/login', {'email': 'PESSOA@example.com', 'senha': PASSWORD})[1]
        self.assertEqual(first['id'], second['id'])
        self.assertNotEqual(first['token'], second['token'])
        self.call('POST', '/api/logout', token=first['token'])
        self.assert_error(401, 'GET', '/api/participantes/me', token=first['token'])
        self.assertEqual(self.call('GET', '/api/participantes/me', token=second['token'])[0], 200)
        with self.service.repository.transaction() as data:
            for session in data['sessions'].values():
                session['expires_at'] = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat()
        self.assert_error(401, 'GET', '/api/participantes/me', token=second['token'])

    def test_login_throttling(self):
        self.signup()
        body = {'email': 'pessoa@example.com', 'senha': 'Uma senha errada longa!'}
        for _ in range(5):
            self.assert_error(401, 'POST', '/api/login', body)
        self.assert_error(429, 'POST', '/api/login', body)
        self.signup(email='outro-aluno@example.com')
        self.assertEqual(self.call('POST', '/api/login', {'email': 'outro-aluno@example.com', 'senha': PASSWORD})[0], 200)
        self.assertEqual(self.call('POST', '/api/login', {'email': body['email'], 'senha': PASSWORD}, ip='outro-dispositivo')[0], 200)

    def test_many_students_can_signup_and_login_from_the_same_ip(self):
        # Ultrapassa tanto o antigo teto de 10 cadastros quanto o de 30 logins.
        # Usa contas e hashes reais, sem dispensar validações ou autenticação.
        def student(index):
            email = f'aluno-{index}@example.com'
            body = {'nome': f'Aluno {index}', 'email': email, 'senha': PASSWORD}
            status, account = self.call('POST', '/api/cadastro', body, ip='ip-da-faculdade')
            self.assertEqual(status, 201)
            status, session = self.call('POST', '/api/login', {'email': email, 'senha': PASSWORD}, ip='ip-da-faculdade')
            self.assertEqual(status, 200)
            self.assertEqual(session['id'], account['id'])
            return account['id']
        with ThreadPoolExecutor(max_workers=4) as pool:
            ids = list(pool.map(student, range(40)))
        self.assertEqual(len(set(ids)), 40)
        self.assertEqual(len(self.repository.snapshot()['participants']), 40)

    def test_parallel_duplicate_signup_creates_only_one_account(self):
        def create(index):
            try:
                return self.signup()['id']
            except ApiError as error:
                return error.status
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(create, range(2)))
        self.assertEqual(results.count(409), 1)
        self.assertEqual(len(self.repository.snapshot()['participants']), 1)


if __name__ == '__main__':
    unittest.main()
