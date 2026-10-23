/* C++/WebAssembly calcula as pontuações; notas, respostas e selos ficam na API. */
window.MewRecommender = (() => {
  const levels = ['facil', 'intermediario', 'dificil'];
  const wasmURL = new URL('wasm/recommender-v1.wasm', document.currentScript.src).href;
  let modulePromise;

  async function loadModule() {
    if (!modulePromise) modulePromise = (async () => {
      if (typeof WebAssembly !== 'object') throw new Error('WebAssembly indisponível.');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(wasmURL, {signal: controller.signal, credentials: 'same-origin'});
        if (!response.ok) throw new Error('Não foi possível carregar o recomendador.');
        const {instance} = await WebAssembly.instantiate(await response.arrayBuffer(), {});
        const api = instance.exports;
        if (typeof api.mew_abi_version !== 'function' || api.mew_abi_version() !== 1 ||
            typeof api.mew_score !== 'function' || typeof api.mew_input_buffer !== 'function' || !api.memory) {
          throw new Error('Versão incompatível do recomendador.');
        }
        return api;
      } finally { clearTimeout(timer); }
    })().catch(error => { modulePromise = null; throw error; });
    return modulePromise;
  }

  function validate(payload) {
    const unit = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
    const vector = value => Array.isArray(value) && value.length === 7 && value.every(unit);
    if (!payload || payload.versao !== 1 || !vector(payload.necessidades) ||
        !levels.includes(payload.nivel_alvo) || !Array.isArray(payload.candidatos) ||
        payload.candidatos.length < 1 || payload.candidatos.length > 10000 ||
        !payload.candidatos.every(c => c && vector(c.features) && unit(c.fit) && unit(c.novelty) &&
          /^pe-\d+$/.test(c.especie_id) && levels.includes(c.dificuldade) &&
          typeof c.nome === 'string' && typeof c.topico_foco === 'string' && typeof c.motivo === 'string')) {
      throw new Error('Dados incompatíveis com o recomendador.');
    }
  }

  async function calculate(payload) {
    validate(payload);
    const api = await loadModule();
    const pointer = api.mew_input_buffer();
    const buffer = new Float64Array(api.memory.buffer, pointer, 200);
    buffer.set(payload.necessidades, 0);
    const target = levels.indexOf(payload.nivel_alvo);
    const ranked = payload.candidatos.map(candidate => {
      buffer.set(candidate.features, 100);
      const value = api.mew_score(pointer, pointer + 100 * 8, 7, candidate.fit, candidate.novelty);
      if (!Number.isFinite(value) || value < 0) throw new Error('Falha no cálculo WebAssembly.');
      return {candidate, value, rankValue: Math.round(value * 1e12) / 1e12,
        distance: Math.abs(levels.indexOf(candidate.dificuldade) - target)};
    });
    // Mesmos critérios de nível, desempate e diversidade usados pela API.
    ranked.sort((a, b) => a.distance - b.distance || b.rankValue - a.rankValue ||
      (a.candidate.especie_id < b.candidate.especie_id ? -1 : a.candidate.especie_id > b.candidate.especie_id ? 1 : 0) ||
      (a.candidate.dificuldade < b.candidate.dificuldade ? -1 : a.candidate.dificuldade > b.candidate.dificuldade ? 1 : 0));
    const seen = new Set(), recommendations = [];
    for (const {candidate: c, value} of ranked) {
      if (seen.has(c.especie_id)) continue;
      seen.add(c.especie_id);
      recommendations.push({especie_id: c.especie_id, nome: c.nome, dificuldade: c.dificuldade,
        pontuacao: Math.round(value * 1e6) / 1e6, topico_foco: c.topico_foco, motivo: c.motivo});
      if (recommendations.length === 3) break;
    }
    return {motor: 'wasm', metodo: payload.metodo, respostas_analisadas: payload.respostas_analisadas,
      taxa_acertos: payload.taxa_acertos, topicos: payload.topicos, recomendacoes: recommendations};
  }

  async function recommend() {
    let payload;
    try { payload = await MewAPI.authenticated('/api/participantes/me/recomendacoes/insumos'); }
    catch (error) {
      if (error.status !== 404) throw error;
      return {...await MewAPI.authenticated('/api/participantes/me/recomendacoes'), fallback_wasm: true};
    }
    try { return await calculate(payload); }
    catch (error) {
      console.warn('[MewRecommender] Usando o recomendador do servidor:', error.message);
      return {...await MewAPI.authenticated('/api/participantes/me/recomendacoes'), fallback_wasm: true};
    }
  }

  return {recommend, calculate};
})();
