"""Cookie HttpOnly, origem e proteção CSRF da interface no mesmo endereço."""
import hashlib
import hmac
from http.cookies import CookieError, SimpleCookie
import os
from urllib.parse import urlsplit

from .config import ConfigurationError
from .service import require

COOKIE_NAME = 'mew_session'
SESSION_SECONDS = 7 * 24 * 60 * 60


def secure_cookie_setting():
    value = os.getenv('MEW_COOKIE_SECURE', '').strip().lower()
    if not value:
        return bool(os.getenv('VERCEL')) or os.getenv('VERCEL_ENV') in ('production', 'preview') or os.getenv('MEW_ENV') == 'production'
    if value not in ('true', 'false', '1', '0'):
        raise ConfigurationError('MEW_COOKIE_SECURE deve ser true ou false.')
    return value in ('true', '1')


def read_cookie(headers):
    cookies = SimpleCookie()
    try:
        cookies.load(headers.get('Cookie', ''))
    except CookieError:
        return ''
    value = cookies.get(COOKIE_NAME)
    return value.value if value and 0 < len(value.value) <= 200 else ''


def csrf_token(token):
    # O segredo é o próprio token aleatório HttpOnly. Não há novo segredo global
    # nem coluna extra no banco; reinícios não invalidam a proteção CSRF.
    return hmac.new(token.encode(), b'mew-csrf-v1', hashlib.sha256).hexdigest()


def cookie_header(token, secure=False):
    cookies = SimpleCookie()
    cookies[COOKIE_NAME] = token
    cookie = cookies[COOKIE_NAME]
    cookie['path'] = '/'
    cookie['httponly'] = True
    cookie['samesite'] = 'Strict'
    cookie['max-age'] = SESSION_SECONDS if token else 0
    if secure:
        cookie['secure'] = True
    return cookie.OutputString()


def verify_browser_post(headers, token, secure=False):
    require(headers.get('X-MEW-Client') == 'browser', 403, 'csrf_failed', 'Solicitação não autorizada. Atualize a página.')
    require(headers.get('Sec-Fetch-Site', 'same-origin') not in ('cross-site', 'same-site'),
            403, 'csrf_failed', 'Solicitação de outra origem não autorizada.')
    origin = headers.get('Origin')
    if origin:
        try:
            actual = urlsplit(origin)
            expected = urlsplit(('https' if secure else 'http') + '://' + headers.get('Host', ''))
            valid = (actual.scheme, actual.hostname, actual.port) == (expected.scheme, expected.hostname, expected.port)
            valid = valid and not actual.username and not actual.path and not actual.query and not actual.fragment
        except ValueError:
            valid = False
        require(valid, 403, 'csrf_failed', 'Solicitação de outra origem não autorizada.')
    if token:
        supplied = headers.get('X-CSRF-Token', '')
        require(len(supplied) == 64 and supplied.isascii() and hmac.compare_digest(supplied, csrf_token(token)),
                403, 'csrf_failed', 'A sessão foi atualizada. Recarregue a página antes de continuar.')


def browser_session(profile, token, expires_at=None):
    result = {'id': profile['id'], 'cadastrado': profile['cadastrado'], 'usuario': profile,
              'csrf_token': csrf_token(token)}
    if expires_at:
        result['expira_em'] = expires_at
    return result
