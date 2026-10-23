/* =========================================================
   CONFIG
   ========================================================= */
const CREDENCIAL_MIN = 0.7;

/* Tópicos exibidos no quiz — apenas 5 categorias visíveis. */
const TOPICOS_EXIBIDOS = {
  bioma: 'Bioma',
  habitat: 'Habitat',
  cadeia_alimentar: 'Cadeia Alimentar',
  predacao: 'Predação',
  conservacao: 'Conservação'
};

/* Tópicos que existem no backend e nas perguntas, mas NÃO são
   exibidos como categorias próprias. O conteúdo é diluído em
   "Conservação" (será explicado durante a apresentação). */
const TOPICOS_OCULTOS = {
  ecologia: 'conservacao',
  taxonomia: 'conservacao'
};

function topicoCanonico(slug) {
  return TOPICOS_OCULTOS[slug] || slug;
}

function topicoLabel(slug) {
  return TOPICOS_EXIBIDOS[topicoCanonico(slug)] || 'Conservação';
}

function agruparTopicos(topicosBackend) {
  const resultado = {};
  for (const [slug, stats] of Object.entries(topicosBackend || {})) {
    const canon = topicoCanonico(slug);
    if (!TOPICOS_EXIBIDOS[canon]) continue;
    const atual = resultado[canon] || (resultado[canon] = { acertos: 0, total: 0 });
    atual.acertos += stats.acertos;
    atual.total += stats.total;
  }
  return resultado;
}

/* =========================================================
   STATE
   ========================================================= */
const state = {
  animalId: null,
  animalInfo: null,
  tentativaId: null,
  enviando: false,
  resultado: null,
  dificuldade: null,
  perguntas: [],
  indice: 0,
  acertos: 0,
  respondidas: [],
  topicosStatus: {}
};

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  state.animalId = params.get('animal');

  if (!state.animalId) {
    renderErro('Nenhum animal especificado na URL.');
    return;
  }

  document.getElementById('btnVoltar').href = `detalhes.html?id=${state.animalId}`;

  try {
    if (!await MewAPI.requireAccount()) return;
    state.animalInfo = await MewAPI.request(`/api/especies/${encodeURIComponent(state.animalId)}`);
    document.getElementById('animalNome').textContent = state.animalInfo.nome;
    document.getElementById('animalCientifico').textContent = state.animalInfo.nome_cientifico;

    if (params.get('novo') === '1' && state.animalInfo.niveis.includes(params.get('nivel'))) {
      history.replaceState(null, '', `quiz.html?animal=${encodeURIComponent(state.animalId)}`);
      renderTelaDificuldade();
      await iniciarQuiz(params.get('nivel'));
      return;
    }

    const attemptId = params.get('tentativa') || MewAPI.read(`mew_attempt:${state.animalId}`);
    if (attemptId) {
      try {
        const attempt = await MewAPI.authenticated(`/api/tentativas/${encodeURIComponent(attemptId)}`);
        if (attempt.especie_id === state.animalId) {
          MewAPI.write(`mew_attempt:${state.animalId}`, attempt.id);
          await carregarTentativa(attempt);
          return;
        }
      } catch (error) {
        if (error.status !== 404) throw error;
        MewAPI.remove(`mew_attempt:${state.animalId}`);
      }
    }
  } catch (error) {
    renderErro(error.message);
    return;
  }

  renderTelaDificuldade();
});

/* =========================================================
   TELA DIFICULDADE
   ========================================================= */
function renderTelaDificuldade() {
  const area = document.getElementById('quizArea');
  const temFacil = state.animalInfo.niveis.includes('facil');
  const temInter = state.animalInfo.niveis.includes('intermediario');
  const temDificil = state.animalInfo.niveis.includes('dificil');

  area.innerHTML = `
    <div class="quiz-card tela-dificuldade">
      <div style="position:relative; display:inline-block; margin: 0 auto;">
        <span class="sparkle s1">
          <svg viewBox="0 0 24 24"><path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="#FFCB05"/></svg>
        </span>
        <span class="sparkle s2">
          <svg viewBox="0 0 24 24"><path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="#FFCB05"/></svg>
        </span>
        <h1 class="titulo-quiz">
          <span class="titulo-interrogacao">?</span>
          QUIZ
          <span class="titulo-interrogacao">?</span>
        </h1>
      </div>

      <p class="subtitulo-quiz">
        Bem-vindo à <strong>Missão Ecológica</strong> com o(a) <strong>${MewAPI.escape(state.animalInfo.nome)}</strong>.<br>
        Escolha um nível de dificuldade para começar. Suas respostas ajudam a personalizar os próximos desafios.
      </p>

      <div>
        <div class="titulo-dificuldade">▸ Escolha o desafio</div>
        <div class="subtitulo-dificuldade">Cada nível tem um conjunto diferente de perguntas</div>

        <div class="opcoes-dificuldade">
          ${temFacil ? `
            <button class="btn-dificuldade" data-nivel="facil">
              <span class="icone">🌱</span>
              <span class="nome">Fácil</span>
              <span class="desc">Conceitos básicos sobre o bioma e a espécie</span>
              <span class="estrelas">★☆☆</span>
            </button>
          ` : ''}

          ${temInter ? `
            <button class="btn-dificuldade" data-nivel="intermediario">
              <span class="icone">🔥</span>
              <span class="nome">Intermediário</span>
              <span class="desc">Detalhes, ameaças e características específicas</span>
              <span class="estrelas">★★☆</span>
            </button>
          ` : ''}

          ${temDificil ? `
            <button class="btn-dificuldade" data-nivel="dificil">
              <span class="icone">💀</span>
              <span class="nome">Difícil</span>
              <span class="desc">Efeito dominó ecológico e raciocínio sistêmico</span>
              <span class="estrelas">★★★</span>
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  area.querySelectorAll('.btn-dificuldade').forEach(btn => {
    btn.addEventListener('click', () => iniciarQuiz(btn.dataset.nivel));
  });
}

/* =========================================================
   INICIAR
   ========================================================= */
async function iniciarQuiz(dificuldade) {
  if (state.enviando) return;
  state.enviando = true;
  document.querySelectorAll('button').forEach(button => button.disabled = true);
  try {
    const attempt = await MewAPI.createAttempt(state.animalId, dificuldade);
    history.replaceState(null, '', `quiz.html?animal=${encodeURIComponent(state.animalId)}`);
    await carregarTentativa(attempt);
  } catch (error) {
    mostrarErroEnvio(error.message);
  } finally {
    state.enviando = false;
    document.querySelectorAll('button').forEach(button => button.disabled = false);
  }
}

async function carregarTentativa(attempt) {
  state.tentativaId = attempt.id;
  state.dificuldade = attempt.dificuldade;
  state.perguntas = attempt.perguntas;
  state.respondidas = attempt.respostas;
  state.acertos = attempt.respostas.filter(a => a.acertou).length;
  state.topicosStatus = {};
  for (const answer of attempt.respostas) {
    const topic = state.topicosStatus[answer.topico] || (state.topicosStatus[answer.topico] = { acertos: 0, total: 0 });
    topic.total++;
    if (answer.acertou) topic.acertos++;
  }
  if (attempt.resultado) { await finalizarQuiz(attempt.resultado); return; }
  const unanswered = state.perguntas.findIndex(q => !attempt.respostas.some(a => a.id === q.id));
  state.indice = unanswered < 0 ? state.perguntas.length - 1 : unanswered;
  renderPergunta();
  if (unanswered < 0) mostrarFeedback(attempt.respostas.find(a => a.id === state.perguntas[state.indice].id));
}

function mostrarErroEnvio(message) {
  let area = document.getElementById('erroEnvio');
  if (!area) {
    area = document.createElement('p');
    area.id = 'erroEnvio';
    area.className = 'mew-integracao-erro';
    area.setAttribute('role', 'alert');
    document.getElementById('quizArea').appendChild(area);
  }
  area.textContent = message;
}

/* =========================================================
   TELA PERGUNTA
   ========================================================= */
function renderPergunta() {
  const area = document.getElementById('quizArea');
  const p = state.perguntas[state.indice];
  const total = state.perguntas.length;
  const atual = state.indice + 1;
  const pct = ((atual - 1) / total) * 100;

  const dificuldadeLabel = {
    facil: 'Fácil',
    intermediario: 'Intermediário',
    dificil: 'Difícil'
  }[state.dificuldade];

  const letras = ['A', 'B', 'C', 'D'];

  area.innerHTML = `
    <div class="quiz-card tela-pergunta">
      <div class="progresso-wrap">
        <div class="progresso-info">
          <span>Pergunta ${atual} de ${total}</span>
          <span class="badge-dificuldade badge-${state.dificuldade}">${dificuldadeLabel}</span>
        </div>
        <div class="progresso-barra">
          <div class="progresso-preenchimento" style="width: ${pct}%"></div>
        </div>
      </div>

      <div class="pergunta-texto">
        <span class="topico-tag">${topicoLabel(p.topico)}</span>
        <p>${MewAPI.escape(p.pergunta)}</p>
      </div>

      <div class="opcoes-resposta" id="opcoesResposta">
        ${p.opcoes.map((op, i) => `
          <button class="btn-opcao" data-index="${i}">
            <span class="letra">${letras[i]}</span>
            <span>${MewAPI.escape(op)}</span>
          </button>
        `).join('')}
      </div>

      <div id="feedbackArea"></div>
      <div id="acaoArea" style="display:flex; justify-content:center;"></div>
    </div>
  `;

  requestAnimationFrame(() => {
    const bar = area.querySelector('.progresso-preenchimento');
    if (bar) bar.style.width = `${(atual / total) * 100}%`;
  });

  area.querySelectorAll('.btn-opcao').forEach(btn => {
    btn.addEventListener('click', () => responder(parseInt(btn.dataset.index, 10)));
  });
}

/* =========================================================
   RESPONDER
   ========================================================= */
async function responder(escolha) {
  if (state.enviando || state.respondidas.some(a => a.id === state.perguntas[state.indice].id)) return;
  state.enviando = true;
  document.getElementById('erroEnvio')?.remove();
  document.querySelectorAll('.btn-opcao').forEach(button => button.disabled = true);
  try {
    const answer = await MewAPI.authenticated(`/api/tentativas/${state.tentativaId}/respostas`, {
      method: 'POST',
      body: { pergunta_id: state.perguntas[state.indice].id, alternativa_escolhida: escolha }
    });
    state.respondidas.push(answer);
    if (answer.acertou) state.acertos++;
    const topic = state.topicosStatus[answer.topico] || (state.topicosStatus[answer.topico] = { acertos: 0, total: 0 });
    topic.total++;
    if (answer.acertou) topic.acertos++;
    mostrarFeedback(answer);
  } catch (error) {
    if (error.status === 409) {
      // Retorno perdido ou outra aba já gravou: refaz o GET e mostra o estado atual.
      try {
        const attempt = await MewAPI.authenticated(`/api/tentativas/${state.tentativaId}`);
        await carregarTentativa(attempt);
      } catch (refreshError) { mostrarErroEnvio(refreshError.message); }
    } else {
      mostrarErroEnvio(error.message + ' Você pode enviar a mesma alternativa novamente.');
      document.querySelectorAll('.btn-opcao').forEach(button => button.disabled = false);
    }
  } finally { state.enviando = false; }
}

function mostrarFeedback(answer) {
  const escolha = answer.escolha;
  const acertou = answer.acertou;
  const p = { ...state.perguntas[state.indice], correta: answer.correta, explicacao: answer.explicacao };
  const botoes = document.querySelectorAll('.btn-opcao');
  const letras = ['A', 'B', 'C', 'D'];
  botoes.forEach(button => button.disabled = true);
  botoes[p.correta].classList.add('correta');
  if (!acertou) botoes[escolha].classList.add('errada');

  const feedbackArea = document.getElementById('feedbackArea');
  feedbackArea.innerHTML = `
    <div class="feedback ${acertou ? 'ok' : 'erro'}">
      <span class="icone-feedback">${acertou ? '✅' : '❌'}</span>
      <div class="texto-feedback">
        <div class="titulo-feedback">${acertou ? 'Correto!' : 'Resposta correta: ' + letras[p.correta]}</div>
        <div class="explicacao">${MewAPI.escape(p.explicacao)}</div>
      </div>
    </div>
  `;

  const acaoArea = document.getElementById('acaoArea');
  const ultima = state.indice === state.perguntas.length - 1;
  acaoArea.innerHTML = `
    <button class="btn-principal" id="btnProxima">
      ${ultima ? '🏆 Ver Resultado' : 'Próxima →'}
    </button>
  `;
  document.getElementById('btnProxima').addEventListener('click', proximaPergunta);
}

function proximaPergunta() {
  if (state.indice === state.perguntas.length - 1) {
    finalizarQuiz();
  } else {
    state.indice++;
    renderPergunta();
  }
}

/* =========================================================
   RESULTADO
   ========================================================= */
async function finalizarQuiz(savedResult = null) {
  const button = document.getElementById('btnProxima');
  if (button) { button.disabled = true; button.textContent = 'Salvando resultado…'; }
  let result;
  try {
    result = savedResult || await MewAPI.authenticated(`/api/tentativas/${state.tentativaId}/finalizar`, { method: 'POST', body: {} });
  } catch (error) {
    mostrarErroEnvio(error.message);
    if (button) { button.disabled = false; button.textContent = 'Tentar salvar resultado novamente'; }
    return;
  }
  state.resultado = result;
  state.topicosStatus = result.topicos;
  const total = result.total;
  const acertos = result.acertos;
  const pct = result.percentual;
  const acertouSelo = result.selo.conquistado;

  let emoji, titulo, msg;
  if (pct === 1) {
    emoji = '🏆'; titulo = 'Perfeito!'; msg = 'Você dominou completamente o tema. Impressionante!';
  } else if (pct >= 0.7) {
    emoji = '🌟'; titulo = 'Muito bem!'; msg = 'Você tem um ótimo domínio sobre a espécie. Continue assim!';
  } else if (pct >= 0.5) {
    emoji = '📚'; titulo = 'Bom trabalho!'; msg = 'Você está no caminho certo. Revise os tópicos mais fracos para evoluir.';
  } else {
    emoji = '🌱'; titulo = 'Continue tentando!'; msg = 'Cada erro é uma chance de aprender. Releia a página do animal e tente de novo.';
  }

  // Agrupa ecologia/taxonomia dentro de conservação para exibição.
  const topicosAgrupados = agruparTopicos(state.topicosStatus);
  const topicosHTML = Object.entries(topicosAgrupados).map(([top, st]) => {
    const p = st.acertos / st.total;
    const cls = p >= 0.7 ? 'ok' : (p >= 0.5 ? 'medio' : 'ruim');
    const pctTopico = Math.round(p * 100);
    return `
      <div class="topico-badge ${cls}">
        <span>${TOPICOS_EXIBIDOS[top] || top}</span>
        <div class="mini-barra"><div style="width: ${pctTopico}%"></div></div>
        <span>${st.acertos}/${st.total}</span>
      </div>
    `;
  }).join('');

  const seloHTML = acertouSelo ? `
    <div class="selo-credencial">
      <div class="selo-titulo">★ Credencial Conquistada ★</div>
      <div class="selo-nome">Analista Ambiental</div>
      <div class="selo-desc">Mestre da Taxonomia · ${MewAPI.escape(state.animalInfo.nome)}</div>
      <div class="selo-data">
        ${new Date(result.selo.emitido_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        · ID: ${MewAPI.escape(result.selo.id)}
      </div>
    </div>
  ` : `
    <div class="resultado-msg" style="padding: 16px 20px; background: rgba(0, 224, 255, 0.05); border-radius: 16px; border: 2px dashed rgba(0, 224, 255, 0.35);">
      💡 Acerte <strong style="color:#ffcb05;">${Math.ceil(CREDENCIAL_MIN * total)}</strong> de ${total} para conquistar o selo de <strong style="color:#ffcb05;">Analista Ambiental</strong>.
    </div>
  `;

  document.getElementById('quizArea').innerHTML = `
    <div class="quiz-card tela-resultado">
      <div style="position:relative; display:inline-block;">
        <span class="sparkle s1">
          <svg viewBox="0 0 24 24"><path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="#FFCB05"/></svg>
        </span>
        <span class="sparkle s3">
          <svg viewBox="0 0 24 24"><path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="#FFCB05"/></svg>
        </span>
        <div class="resultado-emoji">${emoji}</div>
      </div>

      <div class="resultado-titulo">${titulo}</div>
      <div class="resultado-placar">${acertos}<small>/${total}</small></div>
      <div class="resultado-msg">${msg}</div>

      ${topicosHTML ? `
        <div style="margin-top: 4px;">
          <div style="font-family:'Courier New',monospace; font-size:0.7rem; letter-spacing:2px; color:#00e0ff; text-transform:uppercase; margin-bottom:10px; text-shadow: 0 0 10px rgba(0,224,255,0.5);">
            ▸ Desempenho por tópico
          </div>
          <div class="detalhes-topicos">${topicosHTML}</div>
        </div>
      ` : ''}

      ${seloHTML}

      <div class="acoes-resultado" style="margin-top: 8px;">
        <button class="btn-secundario" id="btnExportar">📥 Baixar minhas respostas</button>
        <button class="btn-secundario" id="btnRefazer">🔄 Jogar de novo</button>
        <button class="btn-secundario" id="btnTrocarNivel">🎯 Trocar nível</button>
        <a class="btn-secundario" href="detalhes.html?id=${state.animalId}">🐾 Voltar ao animal</a>
        <a class="btn-secundario" href="historico.html">Meu histórico</a>
        ${acertouSelo ? '<button class="btn-secundario" id="btnImprimir">Imprimir credencial</button>' : ''}
      </div>
      <section id="recomendacoes" class="mew-recomendacoes" aria-live="polite">Buscando próximos desafios…</section>
    </div>
  `;

  document.getElementById('btnRefazer').addEventListener('click', () => iniciarQuiz(state.dificuldade));
  document.getElementById('btnTrocarNivel').addEventListener('click', renderTelaDificuldade);
  document.getElementById('btnImprimir')?.addEventListener('click', () => window.print());
  document.getElementById('btnExportar').addEventListener('click', async event => {
    event.target.disabled = true;
    try { await MewAPI.download(`/api/tentativas/${state.tentativaId}/respostas.csv`, 'minhas-respostas-mew.csv'); }
    catch (error) { mostrarErroEnvio(error.message); }
    finally { event.target.disabled = false; }
  });

  const area = document.getElementById('recomendacoes');
  try {
    const data = await MewRecommender.recommend();
    area.dataset.motor = data.motor;
    const niveis = { facil: 'Fácil', intermediario: 'Intermediário', dificil: 'Difícil' };
    area.innerHTML = '<h2>Seus próximos desafios</h2>' + data.recomendacoes.map(item =>
      `<a href="quiz.html?animal=${encodeURIComponent(item.especie_id)}&nivel=${encodeURIComponent(item.dificuldade)}&novo=1">${MewAPI.escape(item.nome)} · ${MewAPI.escape(niveis[item.dificuldade])}</a><p>${MewAPI.escape(item.motivo)} Foco: ${MewAPI.escape(TOPICOS_EXIBIDOS[topicoCanonico(item.topico_foco)] || topicoCanonico(item.topico_foco))}.</p>`
    ).join('');
  } catch (error) {
    area.textContent = 'Seu resultado foi salvo. ' + error.message;
  }
}

function renderErro(msg) {
  document.getElementById('quizArea').innerHTML = `
    <div class="quiz-card">
      <div class="erro-tela">
        ⚠ ${MewAPI.escape(msg)}<br><br>
        <button class="btn-secundario" onclick="location.reload()">Tentar novamente</button>
        <a class="btn-secundario" href="index.html" style="margin-top:14px;">← Voltar para a Pokédex</a>
      </div>
    </div>
  `;
}
