const {chromium} = require(process.env.MEW_NODE_MODULES ? `${process.env.MEW_NODE_MODULES}/playwright` : 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.MEW_TEST_URL;
const questions = JSON.parse(fs.readFileSync(process.env.MEW_TEST_QUESTIONS_PATH || 'Site/quiz_perguntas.json', 'utf8'));

(async () => {
  const browser = await chromium.launch({headless: true, ...(process.env.MEW_BROWSER_CHANNEL ? {channel: process.env.MEW_BROWSER_CHANNEL} : {})});
  const context = await browser.newContext({viewport: {width: 1280, height: 900}, acceptDownloads: true});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    // Isola a integração local; as APIs públicas de Pokémon não são parte do teste.
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    const email = `browser-${require('node:crypto').randomUUID()}@example.com`;
    const password = '12345';
    // Visitante é encaminhado à entrada e volta ao mesmo quiz após se cadastrar.
    await page.goto(`${base}/quiz.html?animal=pe-1`);
    await page.waitForURL('**/login.html?next=*');
    await page.screenshot({path: 'test-results/login-desktop.png', fullPage: true});
    const guest = await page.evaluate(() => MewAPI.currentSession());
    await page.setViewportSize({width: 390, height: 844});
    await page.screenshot({path: 'test-results/login-mobile.png', fullPage: true});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.getByRole('link', {name: 'Crie sua conta', exact: true}).click();
    await page.screenshot({path: 'test-results/cadastro-mobile.png', fullPage: true});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.setViewportSize({width: 1280, height: 900});
    await page.screenshot({path: 'test-results/cadastro-desktop.png', fullPage: true});
    await page.getByLabel('Nome', {exact: true}).fill('Teste navegador');
    await page.getByLabel('E-mail', {exact: true}).fill(email);
    await page.getByLabel('Senha', {exact: true}).fill(password);
    await page.getByRole('button', {name: 'Mostrar', exact: true}).click();
    assert.equal(await page.locator('#senha').getAttribute('type'), 'text');
    await page.getByRole('button', {name: 'Ocultar', exact: true}).click();
    await page.getByLabel('Confirmar senha', {exact: true}).fill('Outra senha longa diferente!');
    await page.getByRole('button', {name: 'Criar minha conta', exact: true}).click();
    assert.equal(await page.locator('#confirmar-senha').evaluate(input => input.validity.customError), true);
    await page.getByLabel('Confirmar senha', {exact: true}).fill(password);
    await page.getByRole('button', {name: 'Criar minha conta', exact: true}).click();
    await page.waitForURL('**/quiz.html?animal=pe-1');
    assert.equal((await page.evaluate(() => MewAPI.ensureSession())).id, guest.id);
    await page.getByRole('button', {name: /Fácil/}).click();
    await page.locator('.pergunta-texto p').waitFor();
    const session = await page.evaluate(() => MewAPI.ensureSession());
    const sessionCookie = (await context.cookies()).find(cookie => cookie.name === 'mew_session');
    assert.ok(sessionCookie.httpOnly);
    assert.equal(sessionCookie.sameSite, 'Strict');
    assert.equal(await page.evaluate(() => document.cookie.includes('mew_session=')), false);
    assert.equal(await page.evaluate(() => localStorage.getItem('mew_session_v1')), null);
    assert.ok(!('token' in session), 'O JavaScript não recebe o token de autenticação');
    const attemptId = await page.evaluate(() => localStorage.getItem('mew_attempt:pe-1'));
    // Somente o driver do teste pode ler o cookie HttpOnly, para testar revogação.
    const auth = {Authorization: `Bearer ${sessionCookie.value}`};
    const initial = await (await context.request.get(`${base}/api/tentativas/${attemptId}`, {headers: auth})).json();
    assert.equal(initial.perguntas.length, 5);
    assert.ok(!JSON.stringify(initial).includes('"correta"'));
    await require('./events.cjs')(context, base);

    // Servidor grava, mas a primeira resposta da rede se perde: retry não duplica.
    let loseResponse = true;
    const answerRoute = `${base}/api/tentativas/${attemptId}/respostas`;
    await page.route(answerRoute, async route => {
      if (loseResponse) { loseResponse = false; await route.fetch(); await route.abort(); }
      else await route.continue();
    });
    async function choose(correct = true) {
      const text = await page.locator('.pergunta-texto p').textContent();
      const normalized = value => value.normalize('NFC').replace(/\s+/gu, ' ').trim();
      const question = questions['pe-1'].facil.find(q => normalized(q.pergunta) === normalized(text));
      assert.ok(question, `Pergunta mostrada pertence ao catálogo: ${text}`);
      await page.locator('.btn-opcao').nth(correct ? question.correta : (question.correta + 1) % 4).click();
    }
    await choose();
    await page.locator('#erroEnvio').waitFor();
    await choose();
    await page.locator('#btnProxima').waitFor();
    await page.locator('#btnProxima').click();
    await choose();
    await page.locator('#btnProxima').click();
    await page.reload();
    await page.getByText('Pergunta 3 de 5', {exact: true}).waitFor();
    for (let i = 2; i < 5; i++) {
      await choose(i !== 4);
      await page.locator('#btnProxima').click();
    }
    await page.locator('.selo-credencial').waitFor();
    await page.locator('#recomendacoes a').first().waitFor();
    assert.equal(await page.locator('.resultado-placar').innerText(), '4/5');
    const result = await (await context.request.get(`${base}/api/tentativas/${attemptId}`, {headers: auth})).json();
    assert.equal(result.respostas.length, 5);
    assert.equal(result.resultado.acertos, 4);
    assert.ok(result.resultado.selo.conquistado);
    await page.screenshot({path: 'test-results/quiz-resultado.png', fullPage: true});
    const ownDownload = page.waitForEvent('download');
    await page.locator('#btnExportar').click();
    const ownFile = await ownDownload;
    await ownFile.saveAs('test-results/respostas-participante.csv');
    const csv = fs.readFileSync('test-results/respostas-participante.csv', 'utf8');
    assert.ok(csv.includes(attemptId));
    await page.reload();
    await page.locator('.selo-credencial').waitFor();

    await page.getByRole('link', {name: 'Meu histórico', exact: true}).click();
    await page.getByRole('link', {name: 'Ver resultado e baixar respostas'}).waitFor();
    await page.getByRole('link', {name: 'Ver resultado e baixar respostas'}).click();
    await page.locator('.selo-credencial').waitFor();
    await page.locator('#recomendacoes a').first().click();
    await page.locator('.pergunta-texto p').waitFor();
    assert.match(await page.locator('.badge-dificuldade').textContent(), /Intermediário/i);

    await page.goto(`${base}/relatorios.html`);
    await page.locator('#especie option[value="pe-1"]').waitFor({state: 'attached'});
    await page.locator('#chave').fill('chave-incorreta');
    await page.getByRole('button', {name: 'Baixar respostas em CSV'}).click();
    await page.getByText('Chave da equipe ausente ou inválida.', {exact: true}).waitFor();
    await page.locator('#chave').fill(process.env.MEW_TEST_ADMIN_TOKEN);
    const adminDownload = page.waitForEvent('download');
    await page.getByRole('button', {name: 'Baixar respostas em CSV'}).click();
    await (await adminDownload).saveAs('test-results/respostas-equipe.csv');
    const teamCsv = fs.readFileSync('test-results/respostas-equipe.csv', 'utf8');
    const header = csv.slice(0, csv.indexOf('\n') + 1);
    assert.ok(teamCsv.startsWith(header), 'Relatórios usam as mesmas colunas');
    // O Neon compartilhado pode conter respostas reais anteriores ao teste.
    // A tentativa de teste deve aparecer completa, sem excluir outras pessoas.
    assert.ok(teamCsv.includes(csv.slice(header.length)), 'Relatório da equipe inclui todas as respostas desta tentativa');

    await page.goto(`${base}/index.html`);
    await page.locator('[data-aba="mewdex"]').click();
    await page.locator('.mewdex-card').first().waitFor();
    assert.equal(await page.locator('.mewdex-card').count(), 10);
    assert.equal(await page.locator('.mewdex-card').first().getAttribute('href'), 'detalhes.html?id=pe-1');
    // Mesmo fluxo em tela estreita, usando o resultado já salvo.
    await page.setViewportSize({width: 390, height: 844});
    await page.goto(`${base}/quiz.html?animal=pe-1&tentativa=${attemptId}`);
    await page.locator('.selo-credencial').waitFor();
    await page.screenshot({path: 'test-results/quiz-mobile.png', fullPage: true});
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(overflow, false, 'Resultado não deve ultrapassar a largura do celular');

    // A saída revoga o token, e o login recupera conta, pontos e resultado salvo.
    await page.goto(`${base}/historico.html`);
    await page.getByRole('link', {name: 'Ver resultado e baixar respostas'}).waitFor();
    await page.getByRole('button', {name: 'Sair da conta', exact: true}).click();
    await page.waitForURL('**/login.html');
    assert.equal(await page.evaluate(() => localStorage.getItem('mew_session_v1')), null);
    assert.equal(await page.evaluate(() => Object.keys(localStorage).some(key => /^mew_(attempt|pending):/.test(key))), false);
    assert.equal((await context.request.get(`${base}/api/participantes/me`, {headers: auth})).status(), 401);
    await page.getByLabel('E-mail', {exact: true}).fill(email);
    await page.getByLabel('Senha', {exact: true}).fill('Senha incorreta de teste');
    await page.getByRole('button', {name: 'Entrar na conta', exact: true}).click();
    await page.getByRole('alert').filter({hasText: 'E-mail ou senha inválidos.'}).waitFor();
    assert.equal(await page.locator('#auth-error').evaluate(element => document.activeElement === element), true);
    await page.getByLabel('Senha', {exact: true}).fill(password);
    await page.getByRole('button', {name: 'Entrar na conta', exact: true}).click();
    await page.waitForURL('**/index.html');
    await page.getByText('Olá, Teste navegador · 4 pontos', {exact: true}).waitFor();
    const restored = await page.evaluate(() => MewAPI.ensureSession());
    const restoredCookie = (await context.cookies()).find(cookie => cookie.name === 'mew_session');
    assert.equal(restored.id, session.id);
    assert.notEqual(restoredCookie.value, sessionCookie.value);
    await page.locator('#mew-account').getByRole('link', {name: 'Meu histórico', exact: true}).click();
    await page.getByRole('link', {name: 'Ver resultado e baixar respostas'}).click();
    await page.locator('.selo-credencial').waitFor();

    // Um destino externo nunca é aceito na volta do login.
    await page.goto(`${base}/login.html?next=https%3A%2F%2Fexample.com`);
    await page.getByText('Você está conectado como Teste navegador.', {exact: false}).waitFor();
    assert.equal(await page.getByRole('link', {name: 'Continuar com esta conta'}).getAttribute('href'), 'index.html');

    const secondTab = await context.newPage();
    secondTab.on('pageerror', error => errors.push(error.message));
    await secondTab.goto(`${base}/index.html`);
    await secondTab.getByText('Olá, Teste navegador · 4 pontos', {exact: true}).waitFor();
    // Trocar de conta limpa os atalhos e atualiza também a outra aba aberta.
    await page.evaluate(() => localStorage.setItem('mew_attempt:pe-1', 'tentativa-da-conta-anterior'));
    await page.goto(`${base}/cadastro.html`);
    await page.getByLabel('Nome', {exact: true}).fill('Outra pessoa');
    await page.getByLabel('E-mail', {exact: true}).fill(`other-${require('node:crypto').randomUUID()}@example.com`);
    await page.getByLabel('Senha', {exact: true}).fill(password);
    await page.getByLabel('Confirmar senha', {exact: true}).fill(password);
    await page.getByRole('button', {name: 'Criar minha conta', exact: true}).click();
    await page.waitForURL('**/index.html');
    await page.getByText('Olá, Outra pessoa · 0 pontos', {exact: true}).waitFor();
    await secondTab.getByText('Olá, Outra pessoa · 0 pontos', {exact: true}).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('mew_attempt:pe-1')), null);
    assert.equal((await secondTab.evaluate(() => MewAPI.currentSession())).id,
      (await page.evaluate(() => MewAPI.currentSession())).id);
    const recommendations = await page.evaluate(() => MewAPI.authenticated('/api/participantes/me/recomendacoes'));
    // Mesmo sem o evento de storage, o servidor impede uma aba antiga de sair da conta nova.
    const current = await page.evaluate(() => MewAPI.currentSession());
    const stale = await context.request.post(`${base}/api/logout`, {
      headers: {'X-MEW-Client': 'browser', 'X-CSRF-Token': current.csrf_token, 'X-MEW-Participant': restored.id}, data: {}
    });
    assert.equal(stale.status(), 409);
    assert.equal((await page.evaluate(() => MewAPI.authenticated('/api/participantes/me'))).id, current.id);
    await page.getByRole('button', {name: 'Sair da conta', exact: true}).click();
    await secondTab.locator('#mew-account').getByRole('link', {name: 'Entrar', exact: true}).waitFor();
    await secondTab.close();
    assert.deepEqual(errors, []);
    console.log('E2E OK: cookie HttpOnly, troca de conta e logout entre abas, bloqueio de aba antiga, cadastro, login, quiz, retry, retomada, selo, recomendação, histórico, CSV, catálogo e celular.');
    console.log(`Motor de recomendação: ${recommendations.motor}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
