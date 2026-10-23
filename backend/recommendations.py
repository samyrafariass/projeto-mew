"""Filtragem baseada em conteúdo com similaridade de cosseno.

O executável C++ faz o cálculo; Python mantém o mesmo algoritmo quando o
compilador/binário ainda não está disponível. A resposta identifica o motor.
"""
import math
import os
from pathlib import Path
import subprocess

TOPICS = ("bioma", "habitat", "cadeia_alimentar", "predacao", "conservacao", "ecologia", "taxonomia")
LEVELS = ("facil", "intermediario", "dificil")


def score(weakness, features, fit, novelty):
    dot = sum(a * b for a, b in zip(weakness, features))
    norm = math.sqrt(sum(a*a for a in weakness) * sum(b*b for b in features))
    return 0.65 * (dot / norm if norm else 0) + 0.25 * fit + 0.10 * novelty


def prepare_recommendation(data, participant_id, catalog, quizzes):
    """Somente estatísticas e vetores agregados; nunca inclui questões ou gabaritos."""
    attempts = [a for a in data["attempts"].values() if a["participant_id"] == participant_id]
    counts = {topic: {"acertos": 0, "total": 0} for topic in TOPICS}
    for attempt in attempts:
        for answer in attempt["answers"].values():
            item = counts[answer["topico"]]
            item["total"] += 1
            item["acertos"] += int(answer["acertou"])
    # Laplace: nenhum histórico significa incerteza 0.5, sem divisão por zero.
    weakness = [1 - (counts[t]["acertos"] + 1) / (counts[t]["total"] + 2) for t in TOPICS]
    total = sum(x["total"] for x in counts.values())
    correct = sum(x["acertos"] for x in counts.values())
    recent = sorted((a for a in attempts if a["status"] == "concluida"), key=lambda a: a["finished_at"])[-5:]
    target = 0
    if recent:
        latest = recent[-1]
        current = LEVELS.index(latest["dificuldade"])
        rate = sum(x["acertou"] for x in latest["answers"].values()) / len(latest["questions"])
        target = min(2, current + 1) if rate >= .8 else max(0, current - 1) if rate < .5 else current
    visits = {e["especie_id"] for e in data["events"] if e["participant_id"] == participant_id}
    candidates = []
    for species_id, quiz in quizzes.items():
        for level_index, level in enumerate(LEVELS):
            pool = quiz[level]
            features = [sum(q["topico"] == t for q in pool) / len(pool) for t in TOPICS]
            completed = sum(a["especie_id"] == species_id and a["dificuldade"] == level and a["status"] == "concluida" for a in attempts)
            novelty = 1 / (1 + completed + (.25 if species_id in visits else 0))
            fit = 1 / (1 + abs(level_index - target))
            strongest = max(range(len(TOPICS)), key=lambda i: weakness[i] * features[i])
            candidates.append({"especie_id": species_id, "nome": catalog[species_id]["nome_popular"],
                               "dificuldade": level, "features": features, "fit": fit, "novelty": novelty,
                               "topico_foco": TOPICS[strongest],
                               "motivo": "Comece explorando esta espécie." if not total else "Reforce este tema em uma dificuldade ajustada ao seu último resultado."})
    return {"versao": 1, "metodo": "conteudo_cosseno", "ordem_topicos": list(TOPICS),
            "necessidades": weakness, "nivel_alvo": LEVELS[target], "candidatos": candidates,
            "respostas_analisadas": total, "taxa_acertos": correct / total if total else None, "topicos": counts}


def recommend(data, participant_id, catalog, quizzes):
    prepared = prepare_recommendation(data, participant_id, catalog, quizzes)
    weakness, candidates = prepared['necessidades'], prepared['candidatos']
    target = LEVELS.index(prepared['nivel_alvo'])
    scores = [score(weakness, c["features"], c["fit"], c["novelty"]) for c in candidates]
    executable = Path(os.getenv("MEW_RECOMMENDER_BIN", str(Path(__file__).parent / "recommender" / "build" / ("recommender.exe" if os.name == "nt" else "recommender"))))
    engine = "python"
    if executable.is_file():
        lines = [f"{len(TOPICS)} {len(candidates)}", " ".join(map(str, weakness))]
        lines += [" ".join(map(str, c["features"] + [c["fit"], c["novelty"]])) for c in candidates]
        try:
            result = subprocess.run([str(executable)], input="\n".join(lines) + "\n", text=True,
                                    capture_output=True, timeout=3, check=True)
            native_scores = [float(x) for x in result.stdout.split()]
            if len(native_scores) != len(candidates) or not all(math.isfinite(x) for x in native_scores):
                raise ValueError("Saída inválida do recomendador")
            scores, engine = native_scores, "cpp"
        except (OSError, ValueError, subprocess.SubprocessError):
            engine = "python_fallback"
    # O nível pedagógico é uma restrição: a similaridade não deve manter o
    # aluno no fácil depois de demonstrar domínio do nível atual.
    ranking = sorted(range(len(candidates)), key=lambda i: (
        abs(LEVELS.index(candidates[i]["dificuldade"]) - target),
        -round(scores[i], 12), candidates[i]["especie_id"], candidates[i]["dificuldade"]))
    suggestions, seen = [], set()
    for index in ranking:
        c = candidates[index]
        if c["especie_id"] in seen:
            continue
        seen.add(c["especie_id"])
        suggestions.append({"especie_id": c["especie_id"], "nome": c["nome"], "dificuldade": c["dificuldade"],
                            "pontuacao": round(scores[index], 6), "topico_foco": c['topico_foco'], "motivo": c['motivo']})
        if len(suggestions) == 3:
            break
    return {"motor": engine, **{key: prepared[key] for key in ('metodo', 'respostas_analisadas', 'taxa_acertos', 'topicos')},
            "recomendacoes": suggestions}
