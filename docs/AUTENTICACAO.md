# Cadastro e login para o frontend

O cadastro é obrigatório antes de iniciar ou responder um quiz. A navegação pelo
catálogo continua pública. As páginas `Site/login.html` e `Site/cadastro.html`
já estão conectadas às rotas abaixo, usando o estilo da Pokédex. O catálogo
oferece entrada, cadastro e saída; o histórico também permite sair. O quiz
encaminha visitantes ao login, preservando o desafio escolhido no retorno.

## Cadastro

`POST /api/cadastro`, com `Content-Type: application/json`:

```json
{"nome":"Nome do aluno","email":"aluno@example.com","senha":"Uma senha longa escolhida pelo aluno"}
```

Nome: 2 a 50 caracteres. E-mail: até 100 caracteres, normalizado para minúsculas
e sem espaços nas extremidades. Senha: 5 a 128 caracteres; espaços e Unicode
são aceitos, sem regras artificiais de símbolos obrigatórios.

As telas enviam `X-MEW-Client: browser`. Retorno 201, com cookie HttpOnly e
metadados da sessão (o valor abaixo é apenas ilustrativo):

```json
{
  "id":"UUID_DO_PARTICIPANTE",
  "csrf_token":"CODIGO_CSRF_DE_64_CARACTERES",
  "cadastrado":true,
  "expira_em":"2026-10-25T20:00:00+00:00",
  "usuario":{"id":"UUID_DO_PARTICIPANTE","nome":"Nome do aluno","email":"aluno@example.com","cadastrado":true,"pontuacao":0,"criado_em":"2026-10-18T20:00:00+00:00"}
}
```

Se o navegador já possui uma participação visitante válida, seu cookie permite
converter a participação em conta, preservando os vínculos anteriores. O token
de visitante é invalidado e substituído por um novo cookie. Sem visitante, cria
uma conta nova. Cadastrar outra pessoa enquanto há uma conta conectada cria uma
nova conta e troca a sessão do navegador, sem sobrescrever o cadastro anterior.

## Login

`POST /api/login`:

```json
{"email":"aluno@example.com","senha":"Uma senha longa escolhida pelo aluno"}
```

Retorna 200 com a mesma estrutura de sessão do cadastro, incluindo nome e
pontuação. É possível entrar em outro dispositivo e recuperar o mesmo ID,
histórico, credenciais e pontuação. Cada login gera um token diferente. O login
não duplica o participante nem a pontuação. Erros de e-mail inexistente e senha
incorreta retornam a mesma mensagem: `E-mail ou senha inválidos.`

## Integração com MewAPI

Depois do cadastro ou login, atualize os metadados em memória com `setSession()` e
carregue o destino desejado. O método também atualiza o cache em memória e limpa
atalhos de tentativas quando a conta é diferente da anterior:

```javascript
const session = await MewAPI.request('/api/login', {
  method: 'POST', body: {email, senha}
});
MewAPI.setSession(session);
location.assign('index.html');
```

Use o mesmo fluxo para `/api/cadastro`, acrescentando `nome` ao corpo. Não use
`ensureSession()` para simular cadastro: ele cria somente um visitante quando não
há sessão. O quiz exige uma conta autenticada.

`MewAPI.currentSession()` consulta `GET /api/sessao`, que recupera o perfil e o
código CSRF a partir do cookie. O token de autenticação nunca é devolvido por
essas chamadas do navegador. `MewAPI.authenticated()` usa o cookie e envia o ID
da conta em `X-MEW-Participant`; em POST também envia `X-CSRF-Token`. O código CSRF
fica apenas em memória. O cookie usa `HttpOnly`, `SameSite=Strict` e `Path=/`.
Em HTTPS, configure `MEW_COOKIE_SECURE=true` para acrescentar `Secure`; em HTTP
local use `false`. Na Vercel, produção e prévias ativam Secure por padrão quando
não há configuração explícita; `MEW_ENV=production` também ativa essa proteção.

No localStorage fica somente um marcador com ID público e revisão aleatória
para avisar outras abas. Ao trocar de conta ou sair, elas recarregam seus dados.
A API também impede gravações e logout com ID/CSRF de uma sessão anterior,
mesmo se a aba perder o aviso. O retorno do navegador ao histórico em cache e
o foco da aba também verificam a sessão. Dados sensíveis não ficam no marcador.

`GET /api/participantes/me`, autenticado, retorna o perfil atualizado. Verifique
`cadastrado === true` antes de oferecer o início do quiz. A API também impõe essa
regra: visitantes recebem HTTP 403 e código `registration_required` ao iniciar,
responder ou finalizar uma tentativa. A tela pode então encaminhar ao cadastro
ou login. `MewAPI.requireAccount()` já faz esse encaminhamento no quiz e no
histórico. Token ausente, expirado ou revogado retorna 401.

## Sair da conta

`POST /api/logout`, corpo `{}`, com cookie, CSRF e ID da conta atual. O retorno
200 expira o cookie. O helper limpa os atalhos `mew_attempt:*` e `mew_pending:*`
e avisa as outras abas. A saída revoga somente a sessão
atual; o histórico permanece no banco e outras sessões continuam válidas.

`MewAPI.logout()` faz a revogação e limpeza local, inclusive se a sessão já
expirou. Os botões “Sair da conta” do catálogo e histórico usam esse método.
Se o servidor falhar, a interface informa o erro e permite tentar novamente.

Instalações antigas exigem um novo login após esta atualização: `mew_session_v1`
é removido do localStorage e não é usado para autenticar as novas telas.

## Clientes externos à interface

Scripts podem continuar usando `Authorization: Bearer TOKEN`. Cadastro/login
sem cookie e sem `X-MEW-Client: browser` mantêm o retorno `token` para esse caso.
Um visitante pode enviar seu Bearer ao cadastrar para converter a participação.
Um Bearer de conta já cadastrada não permite sobrescrevê-la. O logout Bearer
revoga a sessão correspondente. Esse contrato não deve ser usado nas telas
para voltar a armazenar credenciais no localStorage.

## Sessões e proteção de senha

- Sessões duram sete dias e há até dez sessões por conta. Ao ultrapassar o limite,
  a mais antiga é encerrada. Tokens são aleatórios; o banco guarda somente hashes.
- A senha usa scrypt com salt aleatório, N=32768, r=8, p=3, uma configuração
  documentada pela [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
  A API nunca devolve a senha ou seu hash. O campo `usuario.senha` armazena o hash.
- Login permite cinco tentativas por combinação de IP e conta em quinze minutos.
  Exceder esse limite retorna 429 somente para essa combinação. Não há teto geral
  de cadastros ou logins por IP: alunos na mesma rede podem criar suas próprias
  contas e entrar sem consumir um limite compartilhado pela turma. A proteção
  do login é por processo; em múltiplas réplicas precisa de estado compartilhado.
- Para publicação, use HTTPS. Senhas e tokens não devem ser colocados em URLs,
  logs, arquivos públicos ou mensagens de erro.

Esta entrega inclui cadastro, login, perfil e logout. Verificação de e-mail,
recuperação de senha e edição de perfil não foram solicitadas e não possuem rotas.
Contas antigas inseridas diretamente por outros clientes não são autenticadas
como texto puro: precisam de migração de credenciais e vínculo na API.
