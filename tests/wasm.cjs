const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

(async () => {
  const fixtures = JSON.parse(fs.readFileSync(0, 'utf8'));
  const bytes = fs.readFileSync('Site/wasm/recommender-v1.wasm');
  const module = await WebAssembly.compile(bytes);
  assert.deepEqual(WebAssembly.Module.imports(module), [], 'O Wasm não depende de bibliotecas externas');
  const api = (await WebAssembly.instantiate(module, {})).exports;
  assert.equal(api.mew_abi_version(), 1);
  const pointer = api.mew_input_buffer();
  const buffer = new Float64Array(api.memory.buffer, pointer, 200);
  for (const test of fixtures.scores) {
    buffer.set(test.weakness);
    for (let i = 0; i < test.candidates.length; i++) {
      const row = test.candidates[i];
      buffer.set(row.slice(0, 7), 100);
      const actual = api.mew_score(pointer, pointer + 800, 7, row[7], row[8]);
      assert.ok(Math.abs(actual - test.expected[i]) < 1e-12, 'Wasm e Python devem calcular a mesma pontuação');
    }
  }
  buffer.fill(0);
  assert.equal(api.mew_score(pointer, pointer + 800, 0, 1, 1), -1);
  assert.equal(api.mew_score(pointer, pointer + 800, 101, 1, 1), -1);
  buffer[0] = NaN;
  assert.equal(api.mew_score(pointer, pointer + 800, 7, 1, 1), -1);

  let current, failWasm = false;
  function frontend() {
    const context = {window: {}, document: {currentScript: {src: 'https://test.example/recomendador.js'}},
      URL, WebAssembly, AbortController, setTimeout, clearTimeout, console: {warn() {}},
      fetch: async () => {
        if (failWasm) throw new Error('Rede indisponível');
        return {ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)};
      },
      MewAPI: {authenticated: async path => path.endsWith('/insumos') ? current.payload : current.expected}};
    vm.runInNewContext(fs.readFileSync('Site/recomendador.js', 'utf8'), context);
    return context.window.MewRecommender;
  }
  const recommender = frontend();
  for (const test of fixtures.rankings) {
    current = test;
    const result = JSON.parse(JSON.stringify(await recommender.recommend()));
    assert.equal(result.motor, 'wasm');
    assert.deepEqual({...result, motor: 'python'}, current.expected, 'Níveis, desempates e sugestões coincidem com a API');
  }
  failWasm = true;
  const fallback = await frontend().recommend();
  assert.equal(fallback.fallback_wasm, true);
  assert.equal(fallback.motor, 'python');
  console.log('Wasm OK: pontuações, validação, ranking real do frontend e alternativa do servidor.');
})().catch(error => { console.error(error); process.exitCode = 1; });
