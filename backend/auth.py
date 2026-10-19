"""Senhas com scrypt e proteção básica contra tentativas repetidas de login."""
import hashlib
import hmac
import re
import secrets
import threading
import time
from functools import lru_cache

SCRYPT_N, SCRYPT_R, SCRYPT_P = 2**15, 8, 3
HASH_SLOTS = threading.BoundedSemaphore(2)
EMAIL = re.compile(r"[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}\Z")


def normalize_email(value):
    if not isinstance(value, str):
        raise ValueError('Informe um e-mail válido de até 100 caracteres.')
    email = value.strip().casefold()
    if len(email) > 100 or not EMAIL.fullmatch(email) or email.endswith('.invalid'):
        raise ValueError('Informe um e-mail válido de até 100 caracteres.')
    return email


def validate_signup(body):
    name, password = body.get('nome'), body.get('senha')
    if not isinstance(name, str) or not 2 <= len(name.strip()) <= 50 or any(ord(c) < 32 for c in name):
        raise ValueError('Informe um nome de 2 a 50 caracteres.')
    email = normalize_email(body.get('email'))
    if not isinstance(password, str) or not 5 <= len(password) <= 128:
        raise ValueError('A senha deve ter de 5 a 128 caracteres.')
    return name.strip(), email, password


def derive(password, salt):
    with HASH_SLOTS:
        return hashlib.scrypt(password.encode('utf-8'), salt=salt, n=SCRYPT_N, r=SCRYPT_R,
                              p=SCRYPT_P, dklen=32, maxmem=64*1024*1024)


def hash_password(password):
    salt = secrets.token_bytes(16)
    key = derive(password, salt)
    return f'scrypt$v1${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}${salt.hex()}${key.hex()}'


def verify_password(password, encoded):
    if not isinstance(password, str) or not 1 <= len(password) <= 128 or not isinstance(encoded, str):
        return False
    try:
        algorithm, version, n, r, p, salt, expected = encoded.split('$')
        if (algorithm, version, n, r, p) != ('scrypt', 'v1', str(SCRYPT_N), str(SCRYPT_R), str(SCRYPT_P)):
            return False
        if len(salt) != 32 or len(expected) != 64:
            return False
        actual = derive(password, bytes.fromhex(salt))
        return hmac.compare_digest(actual, bytes.fromhex(expected))
    except (ValueError, TypeError):
        return False


@lru_cache(maxsize=1)
def dummy_password():
    return hash_password('Conta inexistente ' + secrets.token_urlsafe(20))


class AuthLimiter:
    """Até 5 tentativas por conta/IP em 15 minutos, sem teto por IP da turma."""

    def __init__(self):
        self.lock = threading.Lock()
        self.buckets = {}

    def allow(self, ip, email=''):
        current = time.monotonic()
        window = 900
        keys = [(('login-account', hashlib.sha256((ip + '\0' + email).encode()).hexdigest()), 5)]
        with self.lock:
            self.buckets = {key: item for key, item in self.buckets.items() if item[0] > current}
            if len(self.buckets) > 10000:
                return False
            if any(self.buckets.get(key, (0, 0))[1] >= limit for key, limit in keys):
                return False
            for key, _ in keys:
                expiry, count = self.buckets.get(key, (current + window, 0))
                self.buckets[key] = (expiry, count + 1)
            return True
