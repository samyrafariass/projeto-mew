# Publicação do MEW na Vercel

O frontend e o módulo WebAssembly são servidos como arquivos estáticos. A API
Python usa `api/index.py`, e os dados continuam no PostgreSQL/Neon. O site e
`/api` usam o mesmo domínio para preservar cookies, CSRF e a integração existente.

## Configurar o projeto

Use a raiz do repositório como Root Directory e o preset Other. Mantenha o
comando e a pasta de saída definidos no `vercel.json`:

- Build Command: `python scripts/build_site.py`.
- Output Directory: `.build/site`.
- A API Python fica em `api/index.py`; `/api/*` e `/resposta` são encaminhados a ela.

Prefira a publicação pela integração com o GitHub. O repositório contém cerca de
681 MiB em modelos 3D; o upload de fontes pela CLI no plano Hobby tem limite de
100 MB. Esse limite da CLI é diferente do tamanho do pacote da função Python.
Referências: [funções Python em /api](https://vercel.com/docs/functions/runtimes/python/api-directory)
e [limites de upload](https://vercel.com/docs/limits#static-file-uploads).

Configure nas variáveis da Vercel, em Production e Preview:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | Conexão privada do Neon com SSL e pooler |
| `MEW_ADMIN_TOKEN` | Chave aleatória privada com pelo menos 24 caracteres |
| `MEW_COOKIE_SECURE` | `true` para HTTPS |

Não coloque esses valores no frontend, no Git ou no `vercel.json`. O backend
publicado exige Neon e uma chave da equipe válida; não grava em JSON quando falta
configuração. O serviço e o pool são inicializados na primeira chamada que precisa
dos dados e reutilizados pela instância da função. Erros de configuração retornam
503 com uma mensagem sem credenciais. As migrações existentes devem estar aplicadas;
esta integração com Wasm não adiciona tabelas nem exige uma migração nova.

## WebAssembly e arquivos públicos

O Wasm compilado fica em `Site/wasm/recommender-v1.wasm` e deve ser versionado com
`backend/recommender/wasm-manifest.json`. A Vercel verifica que ele corresponde ao
C++ atual; não precisa instalar compilador ou executar o `.exe`.

Ao alterar `score.cpp`, `score.hpp` ou o script de compilação, execute localmente:

```powershell
python backend/recommender/build_wasm.py
python backend/recommender/build_wasm.py --check
```

É necessário Zig ou Clang com wasm-ld para recompilar. O módulo não usa WASI ou
recursos específicos do Windows. O código C++ faz os cálculos no navegador;
JavaScript carrega o módulo e usa as pontuações para selecionar os desafios.

O build gera uma pasta pública nova e exclui `quiz_perguntas.json` e arquivos
ocultos. Os modelos 3D continuam disponíveis no frontend, mas ficam excluídos do
pacote da função Python, junto dos testes, ferramentas e arquivos locais. O
catálogo `Site/fauna_pe.json` permanece disponível à API. `.vercelignore` impede
enviar `.env`, ferramentas, dados locais e relatórios temporários.

## Conferir depois da publicação

1. Abra `/api/health`: deve responder `status: ok` e `armazenamento: postgresql`.
2. Abra `/quiz_perguntas.json`: o arquivo deve retornar 404.
3. Cadastre uma conta, entre, conclua um quiz, consulte o histórico e baixe o CSV.
4. Na tela do resultado, confira no console do navegador:

```javascript
document.querySelector('#recomendacoes').dataset.motor
```

O resultado deve ser `wasm`. A rota `/recomendacoes/insumos` fornece os vetores,
enquanto o helper do frontend executa o C++. A rota antiga `/recomendacoes`
continua retornando o motor do servidor: normalmente `python` na Vercel.
Se o Wasm não carregar, a interface usa essa alternativa e indica o motor real.

Teste localmente os arquivos da publicação e a entrada Vercel com:

```powershell
python -m tests.run_browser --vercel
python -m tests.run_browser --vercel --neon
```

O segundo comando usa uma transação com rollback. Playwright e Chromium/Chrome
são dependências de desenvolvimento, conforme o README. A validação local não
substitui a conferência do domínio publicado e de suas variáveis de ambiente.

O site aguarda até 45 segundos em cadastro/login e inicialização da sessão, e
15 segundos nas demais chamadas.
O módulo Wasm tem timeout de dez segundos antes de recorrer ao servidor. Os modelos
3D originais continuam pesados: essa integração não modifica sua geometria nem
comprova FPS em celulares ou headsets.
