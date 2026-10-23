import csv
import io
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from backend.server import SITE, create_server
from backend.service import Service
from backend.storage import JsonRepository
from backend.storage import StorageUnavailable
from backend.recommendations import score

ADMIN = "test-admin-key-with-at-least-24-characters"


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / "store.json"
        self.server = create_server(port=0, data_file=self.path, admin_token=ADMIN)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"
        self.session = self.call('POST', '/api/cadastro', {'nome': 'Participante de teste', 'email': 'api-test@example.com', 'senha': 'Senha longa para teste 123!'})[1]
        self.token = self.session["token"]

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.tmp.cleanup()

    def call(self, method, path, body=None, token=None, raw=None, content_type="application/json"):
        headers = {"Content-Type": content_type}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        data = raw if raw is not None else json.dumps(body).encode() if body is not None else None
        request = Request(self.base + path, data=data, method=method, headers=headers)
        try:
            response = urlopen(request, timeout=10)
        except HTTPError as error:
            response = error
        with response:
            payload = response.read()
            if response.headers.get_content_type() == "application/json":
                payload = json.loads(payload)
            return response.code, payload

    def attempt(self, request_id="test-attempt", species="pe-1", level="facil"):
        status, attempt = self.call("POST", "/api/tentativas", {"especie_id": species, "dificuldade": level, "request_id": request_id}, self.token)
        self.assertIn(status, (200, 201))
        return attempt

    def answer(self, attempt, question, choice):
        return self.call("POST", f'/api/tentativas/{attempt["id"]}/respostas', {"pergunta_id": question["id"], "alternativa_escolhida": choice}, self.token)

    def finish(self, correct_count=5, request_id="test-attempt", level="facil"):
        attempt = self.attempt(request_id=request_id, level=level)
        pool = self.server.service.quizzes["pe-1"][level]
        for index, question in enumerate(attempt["perguntas"]):
            correct = next(q["correta"] for q in pool if q["id"] == question["id"])
            choice = correct if index < correct_count else (correct + 1) % 4
            self.assertEqual(self.answer(attempt, question, choice)[0], 201)
        status, result = self.call("POST", f'/api/tentativas/{attempt["id"]}/finalizar', {}, self.token)
        self.assertEqual(status, 200)
        return attempt, result

    def test_catalog_and_secrets_not_public(self):
        status, catalog = self.call("GET", "/api/especies")
        self.assertEqual(status, 200)
        self.assertEqual(len(catalog["especies_ameacadas"]), 10)
        self.assertEqual(len({a["id"] for a in catalog["especies_ameacadas"]}), 10)
        for path in ("/quiz_perguntas.json", "/quiz_perguntas%2ejson", "/backend/data/mew.json", "/assets/", "/../README.md", '/.env', '/.env.production', '/.git/config'):
            self.assertEqual(self.call("GET", path)[0], 404, path)
        self.assertEqual(self.call("GET", "/api/especies/pe-999")[0], 404)
        self.assertEqual(self.call("GET", "/")[0], 200)
        attempt = self.attempt()
        self.assertEqual(len(attempt["perguntas"]), 5)
        self.assertEqual(len({q["id"] for q in attempt["perguntas"]}), 5)
        self.assertNotIn('"correta"', json.dumps(attempt))
        self.assertNotIn('"explicacao"', json.dumps(attempt))

    def test_validation_and_auth(self):
        self.assertEqual(self.call("POST", "/api/tentativas", {})[0], 401)
        for field, value in (("especie_id", []), ("especie_id", "pe-999"), ("dificuldade", "impossivel"), ("dificuldade", {}), ("request_id", "")):
            body = {"especie_id": "pe-1", "dificuldade": "facil", "request_id": "ok", field: value}
            self.assertEqual(self.call("POST", "/api/tentativas", body, self.token)[0], 400)
        self.assertEqual(self.call("POST", "/api/eventos", {"tipo": "hotspot", "especie_id": []}, self.token)[0], 400)
        self.assertEqual(self.call("POST", "/api/participantes", raw=b"{")[0], 400)
        self.assertEqual(self.call("POST", "/api/participantes", raw=b"[]")[0], 400)
        self.assertEqual(self.call("POST", "/api/participantes", raw=b"{}", content_type="text/plain")[0], 415)
        self.assertEqual(self.call("POST", "/api/participantes", raw=b"x"*17000)[0], 413)

    def test_feedback_route_and_database_unavailable(self):
        attempt = self.attempt()
        question = attempt['perguntas'][0]
        body = {'tentativa_id': attempt['id'], 'Id_Questao': question['Id_Questao'], 'alternativa_escolhida': 0}
        status, answer = self.call('POST', '/resposta', body, self.token)
        self.assertEqual(status, 201)
        self.assertIn(answer['letraCorreta'], 'ABCD')
        self.assertEqual(self.call('POST', '/api/resposta', body, self.token), (200, answer))
        with patch.object(self.server.service.repository, 'check_health', create=True, side_effect=StorageUnavailable()):
            status, error = self.call('GET', '/api/health')
            self.assertEqual(status, 503)
            self.assertEqual(error['erro']['codigo'], 'database_unavailable')

    def test_participant_isolation(self):
        attempt = self.attempt()
        other = self.call('POST', '/api/cadastro', {'nome': 'Outra pessoa', 'email': 'outra@example.com', 'senha': 'Outra senha longa de teste!'})[1]['token']
        for method, action, body in (("GET", "", None), ("POST", "/respostas", {"pergunta_id": attempt["perguntas"][0]["id"], "alternativa_escolhida": 0}),
                                     ("GET", "/respostas.csv", None), ("POST", "/finalizar", {})):
            self.assertEqual(self.call(method, f'/api/tentativas/{attempt["id"]}{action}', body, other)[0], 404)
        history = self.call("GET", "/api/participantes/me/historico", token=other)[1]
        self.assertEqual(history["tentativas"], [])
        self.assertEqual(self.call("GET", "/api/exportacoes/respostas.csv", token=other)[0], 401)

    def test_idempotency_and_concurrent_answers(self):
        attempt = self.attempt()
        self.assertEqual(self.attempt()["id"], attempt["id"])
        self.assertEqual(self.call("POST", "/api/tentativas", {"especie_id": "pe-2", "dificuldade": "facil", "request_id": "test-attempt"}, self.token)[0], 409)
        question = attempt["perguntas"][0]
        with ThreadPoolExecutor(max_workers=8) as pool:
            statuses = list(pool.map(lambda _: self.answer(attempt, question, 0)[0], range(8)))
        self.assertEqual(statuses.count(201), 1)
        self.assertEqual(statuses.count(200), 7)
        self.assertEqual(self.answer(attempt, question, 1)[0], 409)
        self.assertEqual(len(self.server.service.repository.snapshot()["attempts"][attempt["id"]]["answers"]), 1)

    def test_choice_validation_and_incomplete_attempt(self):
        attempt = self.attempt()
        for choice in (True, -1, 4, "1", None, []):
            self.assertEqual(self.answer(attempt, attempt["perguntas"][0], choice)[0], 400)
        self.assertEqual(self.answer(attempt, {"id": "pe2-f1"}, 0)[0], 400)
        self.assertEqual(self.call("POST", f'/api/tentativas/{attempt["id"]}/finalizar', {}, self.token)[0], 409)

    def test_grading_credential_and_finalization_idempotency(self):
        attempt, result = self.finish(correct_count=4)
        self.assertEqual(result["acertos"], 4)
        self.assertEqual(result["percentual"], .8)
        self.assertTrue(result["selo"]["conquistado"])
        again = self.call("POST", f'/api/tentativas/{attempt["id"]}/finalizar', {}, self.token)[1]
        self.assertEqual(again, result)
        _, low = self.finish(correct_count=3, request_id="second")
        self.assertFalse(low["selo"]["conquistado"])
        self.assertIsNone(low["selo"]["id"])

    def test_persistence_resume_and_snapshots(self):
        attempt = self.attempt()
        self.answer(attempt, attempt["perguntas"][0], 0)
        reloaded = Service(JsonRepository(self.path), SITE, ADMIN)
        status, restored = reloaded.dispatch("GET", f'/api/tentativas/{attempt["id"]}', {}, self.token, {})
        self.assertEqual(status, 200)
        self.assertEqual(len(restored["respostas"]), 1)
        self.assertEqual(restored["perguntas"], attempt["perguntas"])
        source = self.server.service.quizzes["pe-1"]["facil"]
        question = next(q for q in source if q["id"] == attempt["perguntas"][0]["id"])
        question["pergunta"] = "Conteúdo alterado depois da tentativa"
        self.assertNotEqual(restored["perguntas"][0]["pergunta"], question["pergunta"])

    def test_csv_auth_filter_and_contents(self):
        attempt, result = self.finish(correct_count=4)
        status, payload = self.call("GET", "/api/exportacoes/respostas.csv", token=ADMIN)
        self.assertEqual(status, 200)
        self.assertTrue(payload.startswith(b"\xef\xbb\xbf"))
        rows = list(csv.DictReader(io.StringIO(payload.decode("utf-8-sig")), delimiter=";"))
        self.assertEqual(len(rows), 5)
        self.assertEqual(sum(int(row["acertou"]) for row in rows), 4)
        self.assertTrue(all(row["status"] == "concluida" for row in rows))
        self.assertEqual(self.call("GET", f'/api/tentativas/{attempt["id"]}/respostas.csv', token=self.token)[1], payload)
        self.assertEqual(len(self.call("GET", "/api/exportacoes/respostas.csv?especie_id=pe-2", token=ADMIN)[1].decode("utf-8-sig").splitlines()), 1)
        self.assertEqual(self.call("GET", "/api/exportacoes/respostas.csv?dificuldade=foo", token=ADMIN)[0], 400)

    def test_recommendations_and_events(self):
        inputs_path = '/api/participantes/me/recomendacoes/insumos'
        self.assertEqual(self.call('GET', inputs_path)[0], 401)
        initial = self.call("GET", "/api/participantes/me/recomendacoes", token=self.token)[1]
        self.assertEqual(len(initial["recomendacoes"]), 3)
        self.assertTrue(all(item["dificuldade"] == "facil" for item in initial["recomendacoes"]))
        self.assertEqual(self.call("POST", "/api/eventos", {"tipo": "exploracao_3d", "especie_id": "pe-1"}, self.token)[0], 201)
        self.finish(correct_count=5)
        next_items = self.call("GET", "/api/participantes/me/recomendacoes", token=self.token)[1]
        self.assertEqual(next_items["respostas_analisadas"], 5)
        self.assertEqual(sum(item["total"] for item in next_items["topicos"].values()), 5)
        self.assertTrue(all(item["dificuldade"] == "intermediario" for item in next_items["recomendacoes"]))
        self.assertEqual(next_items["metodo"], "conteudo_cosseno")
        status, inputs = self.call('GET', inputs_path, token=self.token)
        self.assertEqual(status, 200)
        self.assertEqual(inputs['respostas_analisadas'], 5)
        self.assertEqual(inputs['nivel_alvo'], 'intermediario')
        self.assertEqual(len(inputs['necessidades']), 7)
        self.assertEqual(len(inputs['candidatos']), 30)
        for field in ('correta', 'explicacao', 'pergunta', 'opcoes', 'password_hash', 'token_hash'):
            self.assertNotIn('"' + field + '"', json.dumps(inputs))
        for candidate in inputs['candidatos']:
            self.assertEqual(len(candidate['features']), 7)


class StorageTests(unittest.TestCase):
    def test_rollback_and_corruption(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "store.json"
            repo = JsonRepository(path)
            with repo.transaction() as data:
                data["events"].append({"sample": True})
            original = path.read_bytes()
            with self.assertRaises(RuntimeError):
                with repo.transaction() as data:
                    data["events"].clear()
                    raise RuntimeError("rollback")
            self.assertEqual(path.read_bytes(), original)
            self.assertEqual(len(repo.snapshot()["events"]), 1)
            path.write_text("invalid json", encoding="utf-8")
            with self.assertRaises(ValueError):
                JsonRepository(path)
            self.assertEqual(path.read_text(), "invalid json")

    def test_cosine_similarity(self):
        self.assertAlmostEqual(score([1, 0], [1, 0], 1, 1), 1)
        self.assertAlmostEqual(score([1, 0], [0, 1], 1, 1), .35)
        self.assertAlmostEqual(score([0, 0], [0, 0], 0, 0), 0)


if __name__ == "__main__":
    unittest.main()
