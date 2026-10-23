# Projeto MEW

Site de educação ambiental com API de quizzes, registro de navegação, histórico,
credenciais, exportação CSV e recomendação por conteúdo com similaridade de cosseno.

## Executar

Requer Python 3.10 ou superior. Na primeira configuração, execute na raiz:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Crie um arquivo `.env` na raiz e preencha `DATABASE_URL` com a conexão Neon
fornecida pela equipe. Esse arquivo é privado, ignorado pelo Git e nunca servido
ao navegador. Em seguida, prepare os complementos do banco:

```powershell
.\.venv\Scripts\python.exe -m backend.migrate
```

A migração é idempotente e aditiva: preserva `usuario`, `partida`, `questao`,
`topico` e `resposta_usuario`, criando os metadados da API em `mew_api`.
Não importa nem substitui as 300 questões que já estão no Neon.

No Windows, dê dois cliques em **iniciar.bat**, ou execute:

```powershell
.\.venv\Scripts\python.exe -m backend.server
```

Abra [o site](http://127.0.0.1:8000/). Use esse endereço para todas as páginas,
inclusive catálogo, quiz e relatório. Abrir o HTML diretamente ou usar somente
um servidor de arquivos estáticos não inicia a API.

O iniciador procura o Python definido em `MEW_PYTHON`, o ambiente virtual
`.venv` e, depois, os comandos `py -3` ou `python`. Instale Python 3.10 ou
superior, ou configure `MEW_PYTHON` com o caminho do executável.

## O que está integrado

- Catálogo de 10 espécies com IDs estáveis `pe-1` a `pe-10`.
- Cadastro com nome, e-mail e senha obrigatório antes do quiz, com login e logout.
- Tentativas de cinco perguntas sorteadas entre as 300 perguntas do Neon.
- Correção no servidor, com gabarito e explicação liberados apenas após responder.
- Gravação de cada resposta, retomada após recarregar e proteção contra duplicação.
- Resultado por tópico e selo persistente a partir de 70% (quatro de cinco acertos).
- Histórico, exportação individual e impressão da credencial.
- Registro de visitas aos detalhes, entrada no ambiente 3D e abertura de hotspots.
- Sessão em cookie HttpOnly e atualização das abas ao entrar, trocar de conta ou sair.
- Três sugestões personalizadas de próximos desafios e ajuste de dificuldade.
- Relatório CSV da equipe com filtro por espécie e dificuldade.

As páginas `login.html` e `cadastro.html` usam o visual da Pokédex e estão ligadas
à API. O catálogo oferece os links de acesso e o botão de saída. Quem abre um
quiz sem cadastro vai para o login e retorna ao mesmo desafio após entrar ou
criar a conta. O histórico também exige login e permite sair da conta.
Cadastro e login não possuem um teto geral por IP da rede, permitindo que a turma
acesse pela mesma conexão. A proteção do login considera cada conta e IP, com
cinco tentativas em quinze minutos, sem bloquear os outros alunos.
Consulte o [contrato de autenticação](docs/AUTENTICACAO.md).
O teste de navegador usa as próprias telas para cadastrar, entrar e sair.

## Banco Neon e modo local

Com `DATABASE_URL` configurada, o backend usa PostgreSQL: as questões vêm de
`questao` e `topico`, e os participantes, partidas e respostas são gravados nas
tabelas da equipe. As sessões anônimas, snapshots das perguntas, finalizações e
eventos ficam em `mew_api`. Contas e sessões autenticadas também usam esse schema.
As telas usam o cookie da sessão, enviado automaticamente pelo navegador. O token
de autenticação não é devolvido ao JavaScript nem guardado no localStorage.
Um código CSRF e o ID da conta protegem as ações enviadas pelas páginas.

As consultas normais carregam somente o participante autenticado e os dados
necessários à rota. Responder ou retomar um quiz consulta apenas sua tentativa;
perfil e login não carregam históricos de respostas. Gravações usam bloqueio por
participante, sem um bloqueio global que faça alunos diferentes esperarem entre si.
Histórico e recomendações ainda leem todas as tentativas do próprio participante.

A API usa escolhas de 0 a 3; o banco usa 1 a 4. O adaptador converte ambos os
sentidos e devolve `letraCorreta` de A a D apenas depois de responder. Reiniciar
a API preserva respostas e histórico. Uma falha no Neon retorna 503; a API não
passa silenciosamente a gravar em arquivo local.

Sem `DATABASE_URL`, o modo local persiste em `backend/data/mew.json`. Para usar
JSON explicitamente mesmo com `.env` preenchido, execute
`python -m backend.server --data-file backend/data/mew.json`.

No modo JSON, faça backup da pasta `backend/data` com o servidor parado e use
somente um processo por arquivo. Ela contém também a chave da equipe. No modo
Neon, os dados persistem no PostgreSQL; `.env` e a chave de exportação devem ser
configurados separadamente em cada hospedagem. Dados antigos em JSON não são
importados automaticamente para o banco.

O [guia do banco](docs/BANCO.md) descreve as relações e as conversões implementadas.

## Exportar respostas

Na primeira execução é criada a chave `backend/data/admin-token.txt`.
Abra [Relatório da equipe](http://127.0.0.1:8000/relatorios.html), informe a chave e
baixe o CSV. A chave não é mostrada no site nem armazenada pela tela de relatório.

O CSV usa UTF-8 com BOM e separador `;` para abertura no Excel. Há uma linha por
resposta salva, inclusive de tentativas incompletas, com identificação anônima,
pergunta, escolha, gabarito, acerto, dificuldade e horários em UTC. Tentativas sem
respostas ainda não produzem linhas. As alternativas usam índices de **0 a 3**.

## Recomendador C++ e WebAssembly

No navegador, o C++ é executado como WebAssembly. A API prepara estatísticas e
vetores agregados da participação, sem enviar perguntas ou gabaritos. O módulo
`Site/wasm/recommender-v1.wasm` calcula as pontuações e o front seleciona as três
sugestões com os mesmos critérios de nível e desempate da API. O arquivo Wasm
versionado tem cerca de 2,3 KB e não requer compilador instalado na Vercel.

Após concluir um quiz, `document.querySelector('#recomendacoes').dataset.motor`
mostra `wasm` quando o cálculo foi realizado no navegador. Se o módulo não puder
ser carregado, a interface consulta o recomendador do servidor e informa o motor
real nesse atributo. Notas, respostas, pontos e selos continuam sob controle da API.

Para recompilar depois de alterar o núcleo C++, use Zig ou Clang com wasm-ld:

```powershell
python backend/recommender/build_wasm.py
python backend/recommender/build_wasm.py --check
```

É possível apontar `MEW_WASM_CXX` para o compilador. O build verifica hashes do
código e do binário, evitando publicar um Wasm antigo após uma alteração no C++.
O cálculo é compartilhado com o executável nativo descrito abaixo.

O código em `backend/recommender/main.cpp` calcula a similaridade de cosseno entre
as dificuldades do participante por tópico e o conteúdo de cada desafio. A API
monta as características usando respostas reais e visitas, seleciona o nível
adequado e chama o executável com entrada numérica, sem interpretar comandos.

Compile antes da apresentação para demonstrar a parte C++:

```powershell
python backend/recommender/build.py
```

É necessário um compilador C++17: g++, clang++, Visual C++ em seu terminal de
desenvolvimento, ou Zig. Também há um projeto CMake na mesma pasta. Com CMake e
Visual Studio, o binário pode ficar em `build/Release`; nesse caso configure
`MEW_RECOMMENDER_BIN` com o caminho completo do executável.

O destino padrão é `backend/recommender/build/recommender.exe` no Windows e
`backend/recommender/build/recommender` em outros sistemas. Sem o binário, a API
executa o mesmo cálculo em Python. O campo `motor` da rota de recomendações mostra
`cpp`, `python` ou `python_fallback`; assim uma falha nativa não é mascarada como C++.
O executável não vai para o Git e deve ser recompilado em outro computador.
Essa descrição dos campos `motor` se refere à rota de recomendações do servidor;
o resultado WebAssembly é produzido pelo helper `MewRecommender` no navegador.

O método é filtragem baseada em conteúdo, uma das opções previstas no documento.
Não é um modelo de aprendizado por reforço nem um modelo supervisionado treinado.
Fórmula, limitações e critérios estão em [RECOMENDADOR.md](docs/RECOMENDADOR.md).

## Configuração

| Variável | Padrão | Uso |
|---|---|---|
| `DATABASE_URL` | Ausente | Conexão PostgreSQL com SSL; quando preenchida ativa Neon |
| `MEW_HOST` | `127.0.0.1` | Endereço de escuta |
| `MEW_PORT` | `8000` | Porta |
| `MEW_DATA_FILE` | `backend/data/mew.json` | Arquivo de persistência |
| `MEW_ADMIN_TOKEN` | Chave gerada em arquivo | Chave da exportação geral, mínimo 24 caracteres |
| `MEW_RECOMMENDER_BIN` | Binário em `backend/recommender/build` | Executável do recomendador |
| `MEW_PYTHON` | Detecção pelo iniciador Windows | Python usado por `iniciar.bat` |
| `MEW_COOKIE_SECURE` | `true` na Vercel, inclusive prévias, ou `MEW_ENV=production`; `false` localmente | Defina `true` ao usar HTTPS; `false` somente para desenvolvimento HTTP |

Também existem os argumentos `--host`, `--port` e `--data-file`. O arquivo `.env`
é carregado automaticamente ao iniciar o servidor ou executar a migração.
Variáveis já definidas pelo ambiente de hospedagem têm prioridade. Nunca coloque
a conexão real em arquivos do front, mensagens de erro, logs ou exemplos públicos.

Para uma demonstração em rede local, `python -m backend.server --host 0.0.0.0`
permite acesso pelo IP do computador, sujeito ao firewall. Para publicação pública,
use servidor de aplicação/reverse proxy com HTTPS e configure o `.env` no servidor.
Recursos de câmera e AR em celulares precisam de contexto seguro compatível com
o navegador. As bibliotecas 3D e APIs públicas de Pokémon continuam dependendo
da internet; não foram reimplementadas pelo backend.

Após atualizar uma instalação que usava `mew_session_v1`, será necessário entrar
novamente uma vez. A credencial antiga é removida do localStorage. A validade da
sessão continua sendo de sete dias, e o logout revoga a sessão atual no banco.

## Documentação e testes

- [Contrato HTTP e exemplos](docs/API.md)
- [Cadastro e login para o frontend](docs/AUTENTICACAO.md)
- [Contrato para o banco definitivo](docs/BANCO.md)
- [Algoritmo de recomendação](docs/RECOMENDADOR.md)
- [Publicação na Vercel e verificação do WebAssembly](docs/VERCEL.md)

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Os testes usam diretórios temporários e não alteram os dados reais da oficina.
O teste opcional `MEW_TEST_NEON=1` verifica o Neon dentro de uma transação desfeita
no final, sem deixar participantes ou respostas de teste no banco.
Para os testes de navegador, disponibilize Playwright e Chromium no ambiente de
desenvolvimento e execute `python -m tests.run_browser`. É possível fornecer
`--node CAMINHO` e `--modules PASTA_NODE_MODULES`; `MEW_BROWSER_CHANNEL=chrome`
usa o Chrome instalado. Os resultados temporários ficam em `test-results/`.
O teste inclui troca de conta/logout entre abas, cookie HttpOnly, proteção contra
ações de uma aba antiga e envio de eventos 3D/hotspots. A integração dos eventos
isola o renderizador; ela não mede FPS nem valida um headset VR.
Use `python -m tests.run_browser --neon` para testar o fluxo de navegador contra
o PostgreSQL real com rollback ao terminar.
Acrescente `--vercel` para usar a entrada `api/index.py` e o site preparado para
publicação. Os testes também conferem o Wasm, a alternativa do servidor e a
ausência de gabaritos nos arquivos públicos.
