/* Sessão HttpOnly no mesmo endereço. O JavaScript recebe apenas perfil e CSRF. */
window.MewAPI = (() => {
  let sessionPromise;
  let bootstrapPromise;
  let csrf = null;
  let identity;
  let revision = 0;
  let changed = false;
  const ACCOUNT_KEY = 'mew_account_v2';
  const memory = new Map();
  const read = key => { try { return localStorage.getItem(key) ?? memory.get(key) ?? null; } catch (_) { return memory.get(key) || null; } };
  const write = (key, value) => { memory.set(key, value); try { localStorage.setItem(key, value); } catch (_) {} };
  const remove = key => { memory.delete(key); try { localStorage.removeItem(key); } catch (_) {} };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  // A versão antiga guardava o token no navegador. Exige novo login uma vez,
  // em vez de continuar mantendo essa credencial acessível ao JavaScript.
  remove('mew_session_v1');
  let marker = read(ACCOUNT_KEY);

  class ApiHttpError extends Error {
    constructor(status, code, message) {
      super(message || `Erro ${status}`);
      this.name = 'ApiHttpError';
      this.status = status;
      this.code = code;
      this.isHttp = true;
    }
  }

  async function request(path, { method = 'GET', body, token, binary = false, participantId } = {}) {
    if (method === 'POST' && !token) await currentSession();
    const controller = new AbortController();
    // Cadastro e login podem aguardar uma fila de hashes e a inicialização da API.
    const authPath = /^\/api\/(cadastro|login|participantes|sessao)$/.test(path);
    const timer = setTimeout(() => controller.abort(), authPath ? 45000 : 15000);
    try {
      const response = await fetch(path, {
        method,
        credentials: 'same-origin',
        signal: controller.signal,
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          'X-MEW-Client': 'browser',
          ...(method === 'POST' && csrf && !token ? { 'X-CSRF-Token': csrf } : {}),
          ...(participantId ? { 'X-MEW-Participant': participantId } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      });

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const isJson = contentType.includes('application/json');

      if (!response.ok) {
        let payload = null;
        if (isJson) { try { payload = await response.json(); } catch (_) {} }
        const error = new ApiHttpError(
          response.status,
          payload?.erro?.codigo || payload?.code,
          payload?.erro?.mensagem || payload?.message
        );
        if (!token && (error.code === 'session_changed' || error.code === 'csrf_failed')) accountChanged();
        throw error;
      }

      if (binary) return await response.blob();
      if (isJson) return await response.json();
      throw new Error('Resposta inesperada do servidor.');
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof ApiHttpError) throw error;

      // Erro de rede ou timeout: só aceita fallback de dados estáticos.
      const fallback = await tryStaticFallback(path, { method });
      if (fallback !== undefined) return fallback;

      if (error.name === 'AbortError') throw new Error('O servidor demorou para responder. Tente novamente.');
      throw new Error('Sem conexão com o servidor. Verifique a rede e tente novamente.');
    } finally {
      clearTimeout(timer);
    }
  }

  async function tryStaticFallback(path, { method }) {
    if (method !== 'GET') return undefined;

    if (path === '/api/especies') {
      try {
        const res = await fetch('fauna_pe.json', { cache: 'no-store' });
        if (res.ok) return await res.json();
      } catch (_) {}
    }

    const match = path.match(/^\/api\/especies\/([^/?#]+)$/);
    if (match) {
      const id = decodeURIComponent(match[1]);
      try {
        const res = await fetch('fauna_pe.json', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const animal = (data.especies_ameacadas || []).find(a => String(a.id) === id);
          if (animal) {
            return { ...animal, nome: animal.nome_popular, niveis: ['facil', 'intermediario', 'dificil'] };
          }
        }
      } catch (_) {}
    }

    return undefined;
  }

  function accountChanged() {
    if (changed) return;
    changed = true;
    revision++;
    csrf = null;
    sessionPromise = null;
    location.reload();
  }

  function assertCurrent(version = revision) {
    if (changed || version !== revision || read(ACCOUNT_KEY) !== marker) {
      accountChanged();
      throw new ApiHttpError(409, 'session_changed', 'A conta foi alterada. Aguarde a atualização da página.');
    }
  }

  function publishAccount(id) {
    marker = JSON.stringify({ id, revision: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}` });
    write(ACCOUNT_KEY, marker);
  }

  async function currentSession(refresh = false) {
    if (refresh) bootstrapPromise = null;
    if (!bootstrapPromise) {
      const version = revision;
      bootstrapPromise = request('/api/sessao').then(session => {
        assertCurrent(version);
        if (identity !== undefined && (identity !== session.id || (csrf && csrf !== session.csrf_token))) {
          accountChanged();
          throw new ApiHttpError(409, 'session_changed', 'A sessão foi atualizada.');
        }
        identity = session.id;
        csrf = session.csrf_token;
        let previous;
        try { previous = JSON.parse(marker || 'null'); } catch (_) {}
        if (!previous || previous.id !== session.id) publishAccount(session.id);
        return session;
      }).catch(error => { bootstrapPromise = null; throw error; });
    }
    return bootstrapPromise;
  }

  async function ensureSession() {
    assertCurrent();
    if (!sessionPromise) sessionPromise = (async () => {
      const session = await currentSession();
      if (session.id) return session;
      const guest = await request('/api/participantes', { method: 'POST', body: {} });
      setSession(guest);
      return guest;
    })().catch(error => { sessionPromise = null; throw error; });
    return sessionPromise;
  }

  async function authenticated(path, options = {}) {
    const session = await ensureSession();
    const version = revision;
    assertCurrent(version);
    try {
      const result = await request(path, { ...options, participantId: session.id });
      assertCurrent(version);
      return result;
    } catch (error) {
      if ((error.status === 401 && session.cadastrado) || error.code === 'registration_required') {
        goToLogin();
      }
      throw error;
    }
  }

  function goToLogin() {
    location.assign(`login.html?next=${encodeURIComponent(location.pathname + location.search)}`);
  }

  async function requireAccount() {
    const session = await ensureSession();
    if (!session.cadastrado) { goToLogin(); return null; }
    return session;
  }

  function clearProgress() {
    const keys = new Set(memory.keys());
    try { for (let i = 0; i < localStorage.length; i++) keys.add(localStorage.key(i)); } catch (_) {}
    for (const key of keys) {
      if (key?.startsWith('mew_attempt:') || key?.startsWith('mew_pending:')) remove(key);
    }
  }

  function setSession(session) {
    let previous;
    try { previous = JSON.parse(marker || 'null'); } catch (_) {}
    if (previous?.id !== session.id) clearProgress();
    identity = session.id;
    csrf = session.csrf_token;
    changed = false;
    revision++;
    publishAccount(session.id);
    bootstrapPromise = Promise.resolve(session);
    sessionPromise = Promise.resolve(session);
  }

  async function logout() {
    assertCurrent();
    const session = await ensureSession();
    if (session?.id) {
      try { await request('/api/logout', { method: 'POST', body: {}, participantId: session.id }); }
      catch (error) { if (error.status !== 401) throw error; }
    }
    clearProgress();
    revision++;
    identity = null;
    csrf = null;
    publishAccount(null);
    bootstrapPromise = null;
    sessionPromise = null;
  }

  window.addEventListener('storage', event => {
    if ((event.key === ACCOUNT_KEY && event.newValue !== marker) || event.key === null) accountChanged();
  });
  window.addEventListener('pageshow', event => { if (event.persisted) accountChanged(); });
  window.addEventListener('focus', () => {
    if (identity !== undefined && !changed) currentSession(true).catch(() => {});
  });

  async function createAttempt(speciesId, level) {
    const key = `mew_pending:${speciesId}:${level}`;
    const requestId = read(key) || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
    write(key, requestId);
    const attempt = await authenticated('/api/tentativas', {
      method: 'POST',
      body: { especie_id: speciesId, dificuldade: level, request_id: requestId }
    });
    write(`mew_attempt:${speciesId}`, attempt.id);
    remove(key);
    return attempt;
  }

  async function download(path, filename, adminToken) {
    const blob = adminToken
      ? await request(path, { token: adminToken, binary: true })
      : await authenticated(path, { binary: true });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function track(speciesId, type = 'visualizacao_especie') {
    if (/^pe-\d+$/.test(speciesId || '')) {
      return authenticated('/api/eventos', { method: 'POST', body: { especie_id: speciesId, tipo: type } })
        .catch(error => console.warn('[MewAPI] Falha ao registrar evento:', error.message));
    }
  }

  return { request, authenticated, currentSession, ensureSession, requireAccount, setSession, logout, createAttempt, download, track, escape, read, write, remove, ApiHttpError };
})();
