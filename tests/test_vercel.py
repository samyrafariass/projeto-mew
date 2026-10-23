import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from api import index
from backend.browser import secure_cookie_setting
from backend.config import ConfigurationError
from scripts.build_site import build_site
from tests import test_browser_sessions as browser_tests


class VercelSessionTests(browser_tests.BrowserSessionTests):
    """O handler publicado deve cumprir o mesmo contrato de cookies da API local."""
    def setUp(self):
        super().setUp()
        self.server.RequestHandlerClass = index.handler
        service_patch = patch.object(index, 'get_service', return_value=self.server.service)
        cookie_patch = patch.object(index, 'secure_cookie_setting', return_value=False)
        service_patch.start()
        cookie_patch.start()
        self.addCleanup(service_patch.stop)
        self.addCleanup(cookie_patch.stop)


class VercelBuildTests(unittest.TestCase):
    def test_public_build_excludes_answer_keys_and_hidden_files(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            site = root / 'Site'
            site.mkdir()
            (site / 'index.html').write_text('público', encoding='utf-8')
            (site / 'fauna_pe.json').write_text('{}')
            (site / 'quiz_perguntas.json').write_text('gabaritos privados')
            (site / '.env').write_text('segredo de teste')
            output = build_site(root)
            self.assertTrue((output / 'index.html').is_file())
            self.assertTrue((output / 'fauna_pe.json').is_file())
            self.assertFalse((output / 'quiz_perguntas.json').exists())
            self.assertFalse((output / '.env').exists())
            # Uma publicação seguinte também remove arquivos privados antigos.
            (output / 'quiz_perguntas.json').write_text('arquivo antigo')
            self.assertFalse((build_site(root) / 'quiz_perguntas.json').exists())

    def test_preview_and_production_use_secure_cookie(self):
        for environment in ('preview', 'production'):
            with patch.dict(os.environ, {'VERCEL_ENV': environment}, clear=True):
                self.assertTrue(secure_cookie_setting())

    def test_missing_database_is_configuration_error_without_json_fallback(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(index, 'load_environment'), patch.object(index, '_service', None):
            with self.assertRaises(ConfigurationError):
                index.get_service()
