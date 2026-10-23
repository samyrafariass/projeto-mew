import json
import os
from pathlib import Path
import random
import shutil
import subprocess
import unittest
from unittest.mock import patch

from backend.recommendations import TOPICS, prepare_recommendation, recommend, score
from backend.recommender.build_wasm import verify_wasm
from backend.server import SITE
from backend.service import Service

NODE = os.getenv('MEW_NODE') or shutil.which('node')


class WasmTests(unittest.TestCase):
    def test_binary_matches_the_cpp_source(self):
        verify_wasm()

    @unittest.skipUnless(NODE, 'Node necessário para verificar WebAssembly.')
    def test_scores_rankings_and_fallback_in_javascript(self):
        rng = random.Random(42)
        scores = []
        for weakness in [[0.0]*7, [1.0]*7, *[[rng.random() for _ in range(7)] for _ in range(10)]]:
            rows = [[0.0]*9, [1.0]*9, *[[rng.random() for _ in range(9)] for _ in range(30)]]
            scores.append({'weakness': weakness, 'candidates': rows,
                'expected': [score(weakness, row[:7], row[7], row[8]) for row in rows]})
        service = Service(None, SITE, 'not-used')
        rankings = []
        for level in ('facil', 'intermediario', 'dificil'):
            for correct in (0, 2, 5):
                attempt = {'participant_id': 'test', 'status': 'concluida', 'finished_at': '2026-10-22T12:00:00+00:00',
                    'especie_id': 'pe-1', 'dificuldade': level, 'questions': [{}]*5,
                    'answers': {str(i): {'topico': TOPICS[i], 'acertou': i < correct} for i in range(5)}}
                data = {'attempts': {'test': attempt}, 'events': [{'participant_id': 'test', 'especie_id': 'pe-2'}]}
                with patch.dict(os.environ, {'MEW_RECOMMENDER_BIN': str(SITE / 'missing-native-binary')}):
                    expected = recommend(data, 'test', service.catalog, service.quizzes)
                rankings.append({'payload': prepare_recommendation(data, 'test', service.catalog, service.quizzes), 'expected': expected})
        with patch.dict(os.environ, {'MEW_RECOMMENDER_BIN': str(SITE / 'missing-native-binary')}):
            empty = {'attempts': {}, 'events': []}
            rankings.append({'payload': prepare_recommendation(empty, 'test', service.catalog, service.quizzes),
                'expected': recommend(empty, 'test', service.catalog, service.quizzes)})
        root = Path(__file__).resolve().parents[1]
        result = subprocess.run([NODE, str(root / 'tests' / 'wasm.cjs')], cwd=root,
            input=json.dumps({'scores': scores, 'rankings': rankings}), text=True, capture_output=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stderr)
