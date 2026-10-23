# Recomendação de desafios ecológicos

Implementação de filtragem baseada em conteúdo com similaridade de cosseno,
conforme uma das alternativas descritas no projeto. Não exige um dataset de
treinamento externo. O perfil é atualizado usando as respostas registradas.

## Características

São sete dimensões: bioma, habitat, cadeia_alimentar, predacao, conservacao,
ecologia e taxonomia. Para cada tópico:

`necessidade = 1 - (acertos + 1) / (respostas + 2)`

A suavização de Laplace evita divisões por zero e conclusões extremas com uma
única resposta. Sem histórico, todas as necessidades começam em 0,5. O vetor de
conteúdo de cada candidato é a proporção de suas dez perguntas por tópico.

## Dificuldade

Sem tentativa concluída, começar no fácil. Considerando a última tentativa
concluída, subir um nível com pelo menos 80% de acertos, descer um nível com menos
de 50%, ou manter o nível nos outros resultados. Respeitar os limites fácil e
difícil. O ranking prioriza candidatos no nível alvo antes de comparar conteúdo.

## Pontuação

`pontuacao = 0,65 × cosseno(necessidade, conteudo) + 0,25 × ajuste_nivel + 0,10 × novidade`

`ajuste_nivel = 1 / (1 + distancia_ao_nivel_alvo)`

`novidade = 1 / (1 + tentativas_concluidas_no_desafio + penalidade_visita)`

A penalidade de visita é 0,25 se a espécie já foi visitada. Visitas não equivalem
a domínio: são apenas um sinal leve para diversificar a exploração. Tentativas
incompletas contribuem para o perfil de tópicos por suas respostas salvas, mas
não mudam o nível alvo. Retornar três espécies diferentes, com foco e motivo.

## C++ e integração

Python lê os registros e monta os vetores. O frontend solicita
`GET /api/participantes/me/recomendacoes/insumos`, autenticado, e recebe apenas
estatísticas por tópico, nível alvo e os vetores dos trinta candidatos. Não recebe
perguntas, alternativas corretas, explicações privadas ou credenciais do banco.

`score.cpp` contém o cálculo compartilhado entre o executável nativo e o módulo
WebAssembly. `build_wasm.py` usa Zig ou Clang para compilar esse C++ para Wasm,
sem imports, filesystem, threads ou bibliotecas externas. O módulo usa uma página
de memória fixa de 64 KiB e dois vetores de até cem doubles. A interface possui
versão de ABI e rejeita dimensões, NaN e números fora dos limites permitidos.

`Site/recomendador.js` carrega o módulo uma vez por página e executa o cálculo
em C++/Wasm. O ranking respeita o nível alvo, retorna três espécies distintas e
usa os mesmos desempates da API. Para evitar diferenças mínimas entre plataformas,
a ordenação compara pontuações arredondadas a doze casas decimais. O resultado
do helper identifica `motor=wasm`; o atributo `data-motor` da seção de sugestões
permite verificar a execução sem alterar o visual do quiz.

Se Wasm estiver indisponível ou seu download falhar, o frontend chama a rota
original de recomendações. Ela mantém o cálculo em Python ou usa o executável
nativo quando este estiver instalado. Nessa rota, `motor=cpp` comprova o uso do
binário, `python_fallback` identifica falha dele e `python` indica sua ausência.
O protocolo nativo continua usando stdin/stdout e timeout de três segundos.

Notas, pontuação do aluno, correção e selos continuam sendo calculados e gravados
pela API. Alterar uma recomendação no navegador não altera os dados do quiz.
Os testes comparam pontuações e rankings entre Python, C++ nativo e WebAssembly,
incluindo novos participantes, diferentes dificuldades e falha de carregamento.

## Limites

O sistema adapta conteúdo ao histórico, mas não estima causalmente aprendizado
nem valida a qualidade científica das perguntas. Os pesos foram definidos para
o protótipo e não calibrados com uma avaliação pedagógica. Como cada nível usa
dez perguntas por espécie, há pouco conteúdo para diversificação prolongada.
