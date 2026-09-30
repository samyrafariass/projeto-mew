const API_URL = 'https://pokeapi.co/api/v2/pokemon';
const TYPE_URL = 'https://pokeapi.co/api/v2/type';
const ALL_ITEMS_URL = 'https://pokeapi.co/api/v2/item?limit=3000';
const ITEM_URL = 'https://pokeapi.co/api/v2/item';
const ITEM_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items';
const TRAD_MYMEMORY = 'https://api.mymemory.translated.net/get';
const ARTWORK = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';
const SPRITE  = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

const ITENS_CACHE_KEY = 'pokedex_itens_lista_v9';
const ITEM_DET_CACHE_KEY = 'pokedex_item_detalhes_v10';
const TRAD_CACHE_KEY = 'pokedex_trad_dict_v2';
const TRAD_FAIL_KEY = 'pokedex_trad_fails_v1';
const IDIOMA_KEY = 'pokedex_idioma_itens';
const EMAIL_KEY = 'pokedex_trad_email';
const CACHE_DURACAO_MS = 30 * 24 * 60 * 60 * 1000;

const TOTAL_POKEMON = 1025;
const HP_BASE = 10;
const HP_MULT = 2;
const MAX_CANDIDATOS_MOVES = 16;
const MAX_UNICOS_POR_CARTA = 2;

const CATEGORIAS_PT = {
  'species-specific': 'Específico de Espécie', 'standard-balls': 'Bolas Padrão',
  'special-balls': 'Bolas Especiais', 'apricorn-balls': 'Bolas de Apricorn',
  'apricorn-box': 'Caixa de Apricorn', 'healing': 'Cura', 'status-cures': 'Cura de Status',
  'pp-recovery': 'Recuperação de PP', 'revival': 'Revive', 'vitamins': 'Vitaminas',
  'effort-drop': 'Redução de EV', 'medicine': 'Medicina', 'other': 'Outros',
  'in-a-pinch': 'Situações Difíceis', 'picky-healing': 'Cura Especial',
  'held-items': 'Itens Equipáveis', 'choice': 'Choice', 'effort-training': 'Treino de EV',
  'bad-held-items': 'Itens Prejudiciais', 'training': 'Treino', 'plates': 'Plates',
  'type-enhancement': 'Aumento de Tipo', 'evolution': 'Evolução', 'spelunking': 'Exploração',
  'picky': 'Seletivo', 'all-mail': 'Cartas', 'all-machines': 'Máquinas (TMs/HMs)',
  'loot': 'Espólio', 'mulch': 'Fertilizantes', 'dex-completion': 'Completar a Dex',
  'jewels': 'Joias', 'collectibles': 'Colecionáveis', 'evolution-items': 'Itens de Evolução',
  'blocks': 'Blocos', 'flute': 'Flautas', 'apricorn': 'Apricorn',
  'data-cards': 'Cartões de Dados', 'curry-ingredients': 'Ingredientes de Curry',
  'pokeride': 'Pokéride', 'memories': 'Memories', 'miracle-shooter': 'Miracle Shooter',
  'z-crystals': 'Z-Crystals', 'mega-stones': 'Mega Stones', 'unused': 'Não Utilizado',
  'plot-advancement': 'Avanço de História', 'gameplay': 'Jogabilidade',
  'long-lost-items': 'Itens Perdidos', 'pickup': 'Coleta', 'wonders': 'Maravilhas',
  'berries': 'Berries'
};

const ATRIBUTOS_PT = {
  'countable': 'Contável', 'consumable': 'Consumível', 'usable-overworld': 'Usável no Mundo',
  'usable-in-battle': 'Usável em Batalha', 'holdable': 'Equipável',
  'holdable-passive': 'Equipável (Passivo)', 'holdable-active': 'Equipável (Ativo)',
  'underground': 'Subsolo', 'past-gen': 'Geração Passada'
};

const DESCRICOES_HABILIDADES = {
  'overgrow': 'Com HP na metade ou menos, ataques de Planta ganham +2 de dano.',
  'chlorophyll': 'Sob sol intenso, a Velocidade é dobrada.',
  'blaze': 'Com HP na metade ou menos, ataques de Fogo ganham +2 de dano.',
  'solar-power': 'Sob sol intenso, o Atq. Esp. aumenta em 1, mas o Pokémon perde 1 de HP por turno.',
  'torrent': 'Com HP na metade ou menos, ataques de Água ganham +2 de dano.',
  'rain-dish': 'Recupera 1 de HP por turno enquanto estiver chovendo.',
  'shield-dust': 'Impede efeitos secundários dos ataques do oponente.',
  'run-away': 'Permite fugir de qualquer encontro selvagem.',
  'shed-skin': 'Tirando 5 ou 6 no dado, cura um status no início do turno.',
  'compound-eyes': 'Aumenta em 1 a rolagem de acerto dos ataques.',
  'tinted-lens': 'Ataques contra tipos resistentes causam dano dobrado.',
  'swarm': 'Com HP na metade ou menos, ataques de Inseto ganham +2 de dano.',
  'sniper': 'Acertos críticos causam +3 de dano extra.',
  'keen-eye': 'Impede que a rolagem de acerto deste Pokémon seja reduzida.',
  'tangled-feet': 'Aumenta a evasão em 1 quando este Pokémon está confuso.',
  'big-pecks': 'Impede que a Defesa deste Pokémon seja reduzida.',
  'guts': 'Aumenta o Ataque em 1 quando este Pokémon tem um status negativo.',
  'hustle': 'Aumenta o Ataque em 1, mas reduz em 1 o acerto dos ataques físicos.',
  'sheer-force': 'Aumenta o dano dos ataques em 1, mas remove efeitos secundários.',
  'intimidate': 'Ao entrar em batalha, reduz o Ataque do oponente em 1.',
  'unnerve': 'Impede o oponente de usar Berries.',
  'static': 'Tirando 5 ou 6 no dado, paralisia quem fizer contato físico.',
  'lightning-rod': 'Atrai ataques elétricos para si e fica imune a eles.',
  'sand-veil': 'Aumenta a evasão em 1 durante uma tempestade de areia.',
  'poison-point': 'Tirando 5 ou 6 no dado, envenena quem fizer contato físico.',
  'rivalry': 'Ataques causam +1 de dano contra oponentes do mesmo gênero.',
  'cute-charm': 'Tirando 5 ou 6 no dado, atrai quem fizer contato físico.',
  'magic-guard': 'Só sofre dano de ataques diretos. Ignora dano de status e clima.',
  'friend-guard': 'Reduz pela metade o dano recebido pelos aliados.',
  'flash-fire': 'Imune a Fogo. Ao ser atingido por um ataque de Fogo, seus ataques de Fogo ganham +2 de dano.',
  'drought': 'Invoca luz solar intensa ao entrar em batalha.',
  'immunity': 'Impede que este Pokémon seja envenenado.',
  'poison-heal': 'Em vez de sofrer dano por veneno, recupera 1 de HP por turno.',
  'sand-rush': 'Dobra a Velocidade durante uma tempestade de areia.',
  'sand-force': 'Ataques de Pedra, Terra e Aço ganham +2 de dano durante tempestade de areia.',
  'pickup': 'Pode pegar itens usados pelo oponente.',
  'technician': 'Ataques com 3 de dano ou menos ganham +1 de dano.',
  'skill-link': 'Ataques múltiplos sempre atingem o número máximo de golpes.',
  'oblivious': 'Impede que este Pokémon seja atraído.',
  'own-tempo': 'Impede que este Pokémon fique confuso.',
  'regenerator': 'Recupera 2 de HP ao trocar de Pokémon.',
  'water-absorb': 'Imune a Água. Recupera 2 de HP ao ser atingido por um ataque desse tipo.',
  'damp': 'Impede o uso de ataques de auto-destruição.',
  'water-veil': 'Impede que este Pokémon seja queimado.',
  'synchronize': 'Passa queimadura, veneno ou paralisia para o oponente.',
  'inner-focus': 'Impede que este Pokémon recue.',
  'telepathy': 'Evita dano causado por aliados.',
  'no-guard': 'Todos os ataques acertam o alvo sem errar.',
  'vital-spirit': 'Impede que este Pokémon durma.',
  'steadfast': 'Aumenta a Velocidade em 1 ao recuar.',
  'rock-head': 'Não sofre dano de recuo.',
  'sturdy': 'Não é nocauteado com um único golpe quando está com HP cheio.',
  'weak-armor': 'Ao ser atingido por ataque físico, perde 1 de Def e ganha 1 de Vel.',
  'magnet-pull': 'Impede que Pokémon do tipo Aço fujam da batalha.',
  'analytic': 'Se este Pokémon se mover por último, causa +1 de dano.',
  'limber': 'Impede que este Pokémon seja paralisado.',
  'klutz': 'Impede o uso de itens segurados.',
  'unburden': 'Dobra a Velocidade ao perder um item segurado.',
  'cloud-nine': 'Nega os efeitos do clima enquanto estiver em batalha.',
  'levitate': 'Imune a ataques do tipo Terra.',
  'cursed-body': 'Tirando 5 ou 6 no dado, desabilita o ataque de quem fizer contato físico.',
  'hyper-cutter': 'Impede que o Ataque deste Pokémon seja reduzido.',
  'shell-armor': 'Impede que o oponente acerte um golpe crítico.',
  'soundproof': 'Imune a ataques sonoros.',
  'bulletproof': 'Imune a ataques de bola e bomba.',
  'volt-absorb': 'Imune a Elétrico. Recupera 2 de HP ao ser atingido por um ataque desse tipo.',
  'illuminate': 'Aumenta a taxa de encontros com Pokémon selvagens.',
  'swift-swim': 'Dobra a Velocidade durante a chuva.',
  'thick-fat': 'Reduz em 1 o dano recebido de ataques de Fogo e Gelo.',
  'hydration': 'Cura problemas de status quando está chovendo.',
  'battle-armor': 'Impede que o oponente acerte um golpe crítico.',
  'flame-body': 'Tirando 5 ou 6 no dado, queima quem fizer contato físico.',
  'natural-cure': 'Cura problemas de status ao trocar de Pokémon.',
  'serene-grace': 'Dobra a chance de efeitos secundários dos ataques.',
  'healer': 'Pode curar problemas de status dos aliados.',
  'insomnia': 'Impede que este Pokémon durma.',
  'forewarn': 'Revela um dos ataques do oponente.',
  'bad-dreams': 'Causa 1 de dano a oponentes adormecidos a cada turno.',
  'justified': 'Aumenta o Ataque em 1 ao ser atingido por ataques do tipo Sombrio.',
  'iron-fist': 'Ataques de punho ganham +1 de dano.',
  'reckless': 'Ataques com dano de recuo ganham +1 de dano.',
  'plus': 'Se um aliado tiver Plus ou Minus, ganha +1 de Atq. Esp.',
  'early-bird': 'Acorda de sono em metade do tempo normal.',
  'sap-sipper': 'Imune a Planta. Aumenta o Ataque em 1 ao ser atingido por um ataque desse tipo.',
  'overcoat': 'Imune a dano de clima e a ataques de pó.',
  'stench': 'Tirando 5 ou 6 no dado, faz o oponente recuar.',
  'sticky-hold': 'Impede que o item segurado seja roubado.',
  'poison-touch': 'Tirando 5 ou 6 no dado, envenena quem fizer contato físico.',
  'heatproof': 'Reduz em 1 o dano recebido de ataques de Fogo.',
  'heavy-metal': 'Dobra o peso deste Pokémon.',
  'gluttony': 'Come Berries mais cedo do que o normal.',
  'scrappy': 'Permite atingir Pokémon do tipo Fantasma com ataques de Normal e Lutador.',
  'filter': 'Reduz em 1 o dano recebido de ataques super efetivos.',
  'dry-skin': 'Recupera 1 de HP na chuva, perde 1 de HP no sol e sofre +1 de dano de Fogo.',
  'mold-breaker': 'Ignora as habilidades do oponente ao atacar.',
  'moxie': 'Aumenta o Ataque em 1 ao nocautear um oponente.',
  'anger-point': 'Aumenta o Ataque em 2 ao ser atingido por um golpe crítico.',
  'rattled': 'Aumenta a Velocidade em 1 ao ser atingido por ataques de Sombrio, Inseto ou Fantasma.',
  'imposter': 'Transforma-se no oponente ao entrar em batalha.',
  'adaptability': 'Ataques do mesmo tipo do Pokémon ganham +1 de dano extra.',
  'anticipation': 'Avisa se o oponente tem ataques super efetivos contra ele.',
  'quick-feet': 'Aumenta a Velocidade em 2 quando tem um status negativo.',
  'trace': 'Copia a habilidade do oponente.',
  'download': 'Aumenta em 1 o Ataque ou Atq. Esp. baseado nas defesas do oponente.',
  'pressure': 'Aumenta o consumo de PP dos ataques do oponente.',
  'snow-cloak': 'Aumenta a evasão em 1 durante a neve.',
  'marvel-scale': 'Aumenta a Defesa em 2 quando tem um status negativo.',
  'multiscale': 'Reduz pela metade o dano recebido quando está com HP cheio.',
  'truant': 'Este Pokémon só pode agir a cada dois turnos.',
  'wonder-guard': 'Só sofre dano de ataques super efetivos.',
  'magic-bounce': 'Reflete ataques de status de volta ao oponente.',
  'prankster': 'Aumenta a prioridade de ataques de status.',
  'competitive': 'Aumenta o Atq. Esp. em 2 quando tem qualquer atributo reduzido.',
  'defiant': 'Aumenta o Ataque em 2 quando tem qualquer atributo reduzido.',
  'frisk': 'Revela o item segurado do oponente.',
  'pickpocket': 'Rouba o item de quem fizer contato físico.',
  'aftermath': 'Causa 1 de dano a quem nocautear este Pokémon com contato físico.',
  'snow-warning': 'Invoca neve ao entrar em batalha.',
  'honey-gather': 'Pode coletar Mel após uma batalha.',
  'tangling-hair': 'Tirando 5 ou 6 no dado, reduz em 1 a Velocidade de quem fizer contato físico.',
  'gooey': 'Reduz em 1 a Velocidade de quem fizer contato físico.',
  'symbiosis': 'Passa seu item para um aliado quando ele usa o dele.',
  'stamina': 'Aumenta a Defesa em 1 ao ser atingido por um ataque.',
  'water-compaction': 'Aumenta a Defesa em 2 ao ser atingido por Água.',
  'merciless': 'Ataques sempre acertam crítico contra alvos envenenados.',
  'mirror-armor': 'Reflete reduções de atributos de volta ao oponente.',
  'punk-rock': 'Ataques sonoros ganham +1 de dano e recebe -1 de dano deles.',
  'sand-spit': 'Cria uma tempestade de areia ao ser atingido.',
  'ice-scales': 'Reduz em 1 o dano de ataques especiais.',
  'ripen': 'Dobra o efeito de Berries.',
  'fluffy': 'Reduz em 1 o dano de contato, mas dobra o dano recebido de Fogo.',
  'steam-engine': 'Aumenta a Velocidade em 2 ao ser atingido por Água ou Fogo.',
  'propeller-tail': 'Ignora ataques que redirecionam ataques.',
  'screen-cleaner': 'Remove barreiras ao entrar em batalha.',
  'steely-spirit': 'Ataques de Aço dos aliados ganham +1 de dano.',
  'perish-body': 'Faz o oponente desmaiar em 3 turnos se fizer contato.',
  'wandering-spirit': 'Troca habilidades ao fazer contato físico.',
  'gorilla-tactics': 'Aumenta o Ataque em 2, mas trava no primeiro ataque.',
  'neutralizing-gas': 'Suprime as habilidades de todos os Pokémon em batalha.',
  'pastel-veil': 'Impede envenenamento dos aliados.',
  'hunger-switch': 'Alterna entre as formas Cheio e Faminto.',
  'quick-draw': 'Tirando 6 no dado, ataca primeiro mesmo com Velocidade menor.',
  'curious-medicine': 'Aumenta o Atq. Esp. em 1 ao entrar em batalha.',
  'unseen-fist': 'Permite atingir alvos protegidos.',
  'queenly-majesty': 'Impede que os oponentes ataquem primeiro.',
  'lingering-aroma': 'Tirando 5 ou 6 no dado, reduz em 1 a evasão ao ser atingido.',
  'well-baked-body': 'Imune a Fogo e aumenta a Defesa em 2 ao ser atingido por ele.',
  'wind-power': 'Recarrega o próximo ataque elétrico ao ser atingido por vento.',
  'ice-face': 'Bloqueia dano uma vez e depois muda de forma.',
  'cotton-down': 'Reduz em 1 a Velocidade de todos ao ser atingido.',
  'ball-fetch': 'Pega a bola e aumenta a Velocidade em 1.'
};

const HABS_LENDARIAS_POR_TIPO = {
  fire:      { nome: 'chama-eterna',          nomeBonito: 'Chama Eterna',          descricao: 'Seus ataques de Fogo ignoram resistências e causam +1 de dano.' },
  water:     { nome: 'mare-infinda',          nomeBonito: 'Maré Infinda',          descricao: 'Recupera 2 de HP no início de cada turno.' },
  electric:  { nome: 'tempestade-primordial', nomeBonito: 'Tempestade Primordial', descricao: 'Ao entrar em batalha, invoca chuva por 5 turnos.' },
  grass:     { nome: 'flora-ancestral',       nomeBonito: 'Flora Ancestral',       descricao: 'No início de cada turno, recupera 1 de HP.' },
  ice:       { nome: 'era-glacial',           nomeBonito: 'Era Glacial',           descricao: 'Invoca nevasca ao entrar em batalha. Reduz em 1 a Velocidade dos inimigos.' },
  fighting:  { nome: 'espirito-inabalavel',   nomeBonito: 'Espírito Inabalável',   descricao: 'Não recua e ignora efeitos de medo ou intimidação.' },
  poison:    { nome: 'toxina-primordial',     nomeBonito: 'Toxina Primordial',     descricao: 'Ataques podem envenenar mesmo contra imunidades.' },
  ground:    { nome: 'fissura-antiga',        nomeBonito: 'Fissura Antiga',        descricao: 'Ataques de Terra ignoram imunidades de Voador e Levitate.' },
  flying:    { nome: 'senhor-dos-ventos',     nomeBonito: 'Senhor dos Ventos',     descricao: 'Ataques de Voador sempre acertam e não podem ser esquivados.' },
  psychic:   { nome: 'mente-cosmica',         nomeBonito: 'Mente Cósmica',         descricao: 'Imune a ataques de status e efeitos mentais.' },
  bug:       { nome: 'enxame-lendario',       nomeBonito: 'Enxame Lendário',       descricao: 'Ataques de Inseto causam +1 de dano.' },
  rock:      { nome: 'nucleo-rochoso',        nomeBonito: 'Núcleo Rochoso',        descricao: 'Defesa aumentada em 2 contra ataques físicos.' },
  ghost:     { nome: 'alma-errante',          nomeBonito: 'Alma Errante',          descricao: 'Imune a ataques de Normal e Lutador.' },
  dragon:    { nome: 'furia-draconica',       nomeBonito: 'Fúria Draconiana',      descricao: 'Ataques de Dragão causam dano dobrado contra outras criaturas lendárias.' },
  dark:      { nome: 'sombra-primordial',     nomeBonito: 'Sombra Primordial',     descricao: 'No primeiro turno de batalha, não pode ser alvo de ataques.' },
  steel:     { nome: 'armadura-mitica',       nomeBonito: 'Armadura Mítica',       descricao: 'Reduz todo dano recebido em 1 (mínimo 1).' },
  fairy:     { nome: 'bencao-arcana',         nomeBonito: 'Bênção Arcana',         descricao: 'Imune a ataques de Dragão e Sombrio.' },
  normal:    { nome: 'essencia-primordial',   nomeBonito: 'Essência Primordial',   descricao: 'Todos os atributos aumentam em 1 enquanto estiver com HP cheio.' }
};

const HABS_LENDARIAS_GENERICAS = [
  { nome: 'presenca-cosmica',  nomeBonito: 'Presença Cósmica',  descricao: 'Inimigos em batalha têm -1 de Ataque.' },
  { nome: 'essencia-lendaria', nomeBonito: 'Essência Lendária', descricao: 'Imune a efeitos de status negativos.' },
  { nome: 'poder-ancestral',   nomeBonito: 'Poder Ancestral',   descricao: 'Ataques causam +1 de dano contra Pokémon não-lendários.' }
];

const CLASSES_DANO_PT = { physical: 'Físico', special: 'Especial', status: 'Status' };

const AILMENTS_PT = {
  paralysis: 'paralisia', burn: 'queimadura', freeze: 'congelamento',
  poison: 'veneno', 'bad-poison': 'veneno grave', sleep: 'sono',
  confusion: 'confusão', infatuation: 'atração', trap: 'aprisionamento',
  flinch: 'recuo', torment: 'tormento', disable: 'desabilitação', yawn: 'sonolência'
};

const STATS_MOVE_PT = {
  hp: 'HP', attack: 'Ataque', defense: 'Defesa',
  'special-attack': 'Atq. Esp.', 'special-defense': 'Def. Esp.',
  speed: 'Velocidade', accuracy: 'Precisão', evasion: 'Evasão'
};

function chanceParaDado(chance) {
  if (!chance || chance <= 0) return null;
  if (chance >= 100) return 'sempre';
  if (chance >= 50)  return 'tirando 4, 5 ou 6 no dado';
  if (chance >= 30)  return 'tirando 5 ou 6 no dado';
  return 'tirando 6 no dado';
}

function capitalizarPrimeira(txt) {
  if (!txt) return txt;
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

function calcularCategoriaUso(dano) {
  if (dano <= 2) return 'at-will';
  if (dano <= 4) return 'eot';
  return 'unico';
}

function embaralhar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function gerarEfeitoMovePt(d) {
  const partes = [];
  const meta = d.meta || {};

  if (meta.ailment?.name && meta.ailment.name !== 'none') {
    const gatilho = chanceParaDado(meta.ailment_chance || 100);
    const txt = AILMENTS_PT[meta.ailment.name] || meta.ailment.name;
    if (gatilho === 'sempre') partes.push(`Sempre causa ${txt}.`);
    else partes.push(`${capitalizarPrimeira(gatilho)}, causa ${txt}.`);
  }

  if (Array.isArray(d.stat_changes) && d.stat_changes.length) {
    d.stat_changes.forEach(sc => {
      const statNome = STATS_MOVE_PT[sc.stat.name] || sc.stat.name;
      const valor = Math.abs(sc.change);
      const alvo = sc.change > 0 ? 'Aumenta' : 'Reduz';
      partes.push(`${alvo} ${statNome} em ${valor}.`);
    });
  }

  if (meta.crit_rate && meta.crit_rate > 0) {
    if (meta.crit_rate >= 2) partes.push('Crítico tirando 4, 5 ou 6 no dado.');
    else partes.push('Crítico tirando 5 ou 6 no dado.');
  }

  if (meta.drain && meta.drain > 0) partes.push(`Recupera ${meta.drain}% do dano causado como HP.`);
  if (meta.drain && meta.drain < 0) partes.push(`Recua ${Math.abs(meta.drain)}% do dano causado.`);
  if (meta.healing && meta.healing > 0) partes.push(`Recupera ${meta.healing}% de HP.`);

  if (meta.min_hits && meta.max_hits && meta.max_hits > 1) {
    partes.push(meta.min_hits === meta.max_hits
      ? `Atinge ${meta.max_hits} vezes.`
      : `Atinge ${meta.min_hits}–${meta.max_hits} vezes.`);
  }

  if (meta.flinch_chance && meta.flinch_chance > 0) {
    const gatilho = chanceParaDado(meta.flinch_chance);
    if (gatilho === 'sempre') partes.push('Sempre faz o oponente recuar.');
    else partes.push(`${capitalizarPrimeira(gatilho)}, faz o oponente recuar.`);
  }

  return partes.join(' ') || null;
}

function extrairNomeMovePt(d) {
  const nomes = d.names || [];
  const pt = nomes.find(n => n.language.name === 'pt-BR')
          || nomes.find(n => n.language.name === 'pt');
  if (pt && pt.name) return pt.name;
  return capitalizar(d.name);
}

let idiomaItens = localStorage.getItem(IDIOMA_KEY) || 'pt';
let modalItemAberto = null;
let tradDict = {};
let tradFails = {};
let emailTrad = localStorage.getItem(EMAIL_KEY) || '';
let itemDetalhes = {};

const REGIOES = {
  1: { nome: 'Kanto',  inicio: 1,   fim: 151,  zoom: 550, posicaoX: 67, posicaoY: 44 },
  2: { nome: 'Johto',  inicio: 152, fim: 251,  zoom: 550, posicaoX: 50, posicaoY: 45 },
  3: { nome: 'Hoenn',  inicio: 252, fim: 386,  zoom: 550, posicaoX: 62, posicaoY: 55 },
  4: { nome: 'Sinnoh', inicio: 387, fim: 493,  zoom: 550, posicaoX: 70, posicaoY: 19 },
  5: { nome: 'Unova',  inicio: 494, fim: 649,  zoom: 550, posicaoX: 39, posicaoY: 55 },
  6: { nome: 'Kalos',  inicio: 650, fim: 721,  zoom: 550, posicaoX: 37, posicaoY: 29 },
  7: { nome: 'Alola',  inicio: 722, fim: 809,  zoom: 550, posicaoX: 85, posicaoY: 39 },
  8: { nome: 'Galar',  inicio: 810, fim: 898,  zoom: 550, posicaoX: 9,  posicaoY: 31 },
  9: { nome: 'Paldea', inicio: 899, fim: 1025, zoom: 550, posicaoX: 25, posicaoY: 39 }
};

const REGIOES_HOTSPOTS = {
  1: { x: 68.9, y: 42.6, w: 8.4, h: 3.9 }, 2: { x: 49.4, y: 44.3, w: 8.2, h: 3.4 },
  3: { x: 62.0, y: 54.2, w: 9.4, h: 3.5 }, 4: { x: 70.6, y: 18.0, w: 9.6, h: 4.2 },
  5: { x: 36.7, y: 55.3, w: 8.2, h: 3.8 }, 6: { x: 35.2, y: 29.4, w: 8.8, h: 4.1 },
  7: { x: 83.9, y: 38.3, w: 8.6, h: 3.7 }, 8: { x: 5.0,  y: 34.4, w: 8.8, h: 4.2 },
  9: { x: 24.8, y: 39.3, w: 9.9, h: 3.8 }
};

const NOMES_TIPOS = {
  normal: 'Normal', fire: 'Fogo', water: 'Água', electric: 'Elétrico',
  grass: 'Planta', ice: 'Gelo', fighting: 'Lutador', poison: 'Venenoso',
  ground: 'Terra', flying: 'Voador', psychic: 'Psíquico', bug: 'Inseto',
  rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão', dark: 'Sombrio',
  steel: 'Aço', fairy: 'Fada'
};

const ORDEM_GRUPOS = [
  'balls','medicine','vitamins','berries','evolution','mega','zcrystals','tms',
  'plates','memories','gems','typeboost','choice','power','species','scarves',
  'bands','incenses','mulch','flutes','treasures','fossils','shards',
  'apricorns','mail','photos','key','held','outros'
];

const NOME_GRUPO = {
  balls: '🔴 Pokébolas', medicine: '💉 Medicina', vitamins: '💊 Vitaminas',
  berries: '🍒 Berries', evolution: '💎 Itens de Evolução', mega: '🌟 Mega Stones',
  zcrystals: '🔮 Z-Crystals', tms: '📀 TMs, HMs e TRs', plates: '🛡️ Plates',
  memories: '📼 Memories', gems: '💠 Gems', typeboost: '⚔️ Aumento de Tipo',
  choice: '🎯 Choice Items', power: '🏋️ Power Items', species: '🦴 Específicos',
  scarves: '🧣 Scarves', bands: '🎗️ Bands', incenses: '🕯️ Incenses',
  mulch: '🌱 Mulches', flutes: '🎵 Flautas', treasures: '💰 Tesouros',
  fossils: '🦕 Fósseis', shards: '💠 Shards', apricorns: '🌰 Apricorns',
  mail: '✉️ Cartas', photos: '📸 Fotos', key: '🔑 Itens-chave',
  held: '📦 Equipáveis', outros: '❓ Outros'
};

const ORDEM_BALLS = [
  'poke-ball','great-ball','ultra-ball','master-ball','premier-ball','heal-ball',
  'net-ball','nest-ball','dive-ball','dusk-ball','timer-ball','quick-ball',
  'repeat-ball','luxury-ball','level-ball','lure-ball','moon-ball','friend-ball',
  'love-ball','heavy-ball','fast-ball','sport-ball','safari-ball','park-ball',
  'dream-ball','beast-ball','cherish-ball','hisui-ball','strange-ball'
];

const MEDICINA = [
  'potion','super-potion','hyper-potion','max-potion','full-restore','revive',
  'max-revive','antidote','burn-heal','ice-heal','awakening','paralyze-heal',
  'full-heal','ether','max-ether','elixir','max-elixir','berry-juice','fresh-water',
  'soda-pop','lemonade','moomoo-milk','energy-powder','energy-root','heal-powder',
  'revival-herb','lava-cookie','old-gateau','casteliacone','sweet-heart',
  'rage-candy-bar','big-malasada','max-honey','pewter-crunchies','shalour-sable','lumiose-galette'
];

const VITAMINAS = [
  'hp-up','protein','iron','calcium','zinc','carbos','pp-up','pp-max','dynamax-candy',
  'health-wing','muscle-wing','resist-wing','genius-wing','clever-wing','swift-wing','pretty-wing',
  'health-feather','muscle-feather','resist-feather','genius-feather','clever-feather','swift-feather','pretty-feather'
];

const ITENS_TIPO_BOOST = [
  'charcoal','mystic-water','miracle-seed','magnet','never-melt-ice','black-belt',
  'poison-barb','soft-sand','sharp-beak','twisted-spoon','silver-powder','hard-stone',
  'spell-tag','dragon-fang','black-glasses','metal-coat','silk-scarf','fairy-feather',
  'odd-incense','sea-incense','rock-incense','wave-incense','rose-incense','pure-incense',
  'full-incense','lax-incense','luck-incense'
];

const ITENS_ESPECIE = [
  'light-ball','thick-club','stick','lucky-punch','metal-powder','quick-powder',
  'deep-sea-tooth','deep-sea-scale','soul-dew','adamant-orb','lustrous-orb','griseous-orb',
  'electric-seed','psychic-seed','misty-seed','grassy-seed','rusted-sword','rusted-shield'
];

const ITENS_EVOLUCAO = [
  'kings-rock','metal-coat','dragon-scale','up-grade','dubious-disc','protector',
  'electirizer','magmarizer','reaper-cloth','razor-claw','razor-fang','oval-stone',
  'shiny-stone','dusk-stone','dawn-stone','ice-stone','sun-stone','moon-stone',
  'leaf-stone','fire-stone','water-stone','thunder-stone','everstone','link-cable',
  'sweet-apple','tart-apple','cracked-pot','chipped-pot','galarica-cuff','galarica-wreath',
  'strawberry-sweet','love-sweet','berry-sweet','clover-sweet','flower-sweet','star-sweet',
  'ribbon-sweet','auspicious-armor','malicious-armor','scroll-of-darkness','scroll-of-waters',
  'peat-block','black-augurite','syrupy-apple','unremarkable-teacup','masterpiece-teacup',
  'metal-alloy','gimmighoul-coin'
];

const TESOUROS = [
  'nugget','big-nugget','pearl','big-pearl','pearl-string','stardust','star-piece',
  'comet-shard','rare-bone','relic-copper','relic-silver','relic-gold','relic-vase',
  'relic-band','relic-statue','relic-crown','heart-scale','slowpoke-tail','shoal-salt',
  'shoal-shell','balm-mushroom','big-mushroom','tiny-mushroom','pretty-feather',
  'gold-bottle-cap','bottle-cap','wishing-piece','amaze-mulch','snowball','strange-ball'
];

const FOSSEIS = [
  'helix-fossil','dome-fossil','old-amber','root-fossil','claw-fossil','skull-fossil',
  'armor-fossil','cover-fossil','plume-fossil','jaw-fossil','sail-fossil',
  'fossilized-bird','fossilized-fish','fossilized-drake','fossilized-dino'
];

const ITENS_CHAVE = [
  'bicycle','old-rod','good-rod','super-rod','town-map','poke-flute','silph-scope',
  's-s-ticket','mystery-egg','coin-case','itemfinder','dowsing-machine','dowsing-mchn',
  'exp-share','vs-seeker','teachy-tv','pokegear','poke-radar','vs-recorder',
  'catching-charm','shiny-charm','oval-charm','exp-charm','mark-charm','gracidea',
  'azure-flute','tidal-bell','clear-bell','lunar-feather','rainbow-wing','silver-wing',
  'light-stone','dark-stone','god-stone','reins-of-unity','dna-splicers','reveal-glass',
  'prison-bottle','ride-pager','forage-bag','poke-finder','holo-caster','rotom-dex',
  'island-challenge-amulet','sparkling-stone','sun-flute','moon-flute','z-ring','z-power-ring'
];

function obterGrupoItem(nome) {
  const n = nome.toLowerCase();
  if (n.endsWith('-ball') || n === 'ball') return 'balls';
  if (n.endsWith('-berry')) return 'berries';
  if (/^(tm|hm|tr)\d+/.test(n)) return 'tms';
  if (MEDICINA.includes(n)) return 'medicine';
  if (VITAMINAS.includes(n)) return 'vitamins';
  if (n.endsWith('-ite') || /-ite-[xy]$/.test(n)) {
    if (n !== 'metronome' && n !== 'everstone' && n !== 'stone' && n !== 'megaton' &&
        n !== 'granite' && n !== 'satellite' && n !== 'favorite') return 'mega';
  }
  if (n.endsWith('-ium-z') || n.includes('ium-z') || n === 'z-crystal') return 'zcrystals';
  if (n.endsWith('-plate')) return 'plates';
  if (n.endsWith('-memory')) return 'memories';
  if (n.endsWith('-gem')) return 'gems';
  if (ITENS_TIPO_BOOST.includes(n)) return 'typeboost';
  if (n.startsWith('choice-')) return 'choice';
  if (n.startsWith('power-') || n === 'macho-brace') return 'power';
  if (ITENS_ESPECIE.includes(n)) return 'species';
  if (n.endsWith('-scarf')) return 'scarves';
  if (n.endsWith('-band')) return 'bands';
  if (n.endsWith('-incense')) return 'incenses';
  if (n.endsWith('-mulch')) return 'mulch';
  if (n.endsWith('-flute')) return 'flutes';
  if (n.includes('fossil') || FOSSEIS.includes(n)) return 'fossils';
  if (n.endsWith('-shard')) return 'shards';
  if (n.endsWith('-apricorn')) return 'apricorns';
  if (n.endsWith('-mail')) return 'mail';
  if (n.endsWith('-photo')) return 'photos';
  if (n.endsWith('-stone')) return 'evolution';
  if (ITENS_EVOLUCAO.includes(n)) return 'evolution';
  if (TESOUROS.includes(n)) return 'treasures';
  if (ITENS_CHAVE.includes(n)) return 'key';
  return 'held';
}

function compararItens(a, b, invertido) {
  const gA = obterGrupoItem(a.nome), gB = obterGrupoItem(b.nome);
  if (gA !== gB) {
    let pa = ORDEM_GRUPOS.indexOf(gA); let pb = ORDEM_GRUPOS.indexOf(gB);
    if (pa === -1) pa = 999; if (pb === -1) pb = 999;
    return pa - pb;
  }
  if (gA === 'balls') {
    const ia = ORDEM_BALLS.indexOf(a.nome), ib = ORDEM_BALLS.indexOf(b.nome);
    if (ia !== -1 && ib !== -1) return invertido ? ib - ia : ia - ib;
  }
  if (gA === 'tms') {
    const nA = parseInt(a.nome.replace(/\D/g, ''), 10) || 0;
    const nB = parseInt(b.nome.replace(/\D/g, ''), 10) || 0;
    if (nA !== nB) return invertido ? nB - nA : nA - nB;
  }
  const cmp = capitalizar(a.nome).localeCompare(capitalizar(b.nome));
  return invertido ? -cmp : cmp;
}

function ordenarItens(itens, invertido = false) {
  return [...itens].sort((a, b) => compararItens(a, b, invertido));
}

const NOMES_POKEMON = [
  'bulbasaur','ivysaur','venusaur','charmander','charmeleon','charizard',
  'squirtle','wartortle','blastoise','caterpie','metapod','butterfree',
  'weedle','kakuna','beedrill','pidgey','pidgeotto','pidgeot',
  'rattata','raticate','spearow','fearow','ekans','arbok',
  'pikachu','raichu','sandshrew','sandslash','nidoran-f','nidorina',
  'nidoqueen','nidoran-m','nidorino','nidoking','clefairy','clefable',
  'vulpix','ninetales','jigglypuff','wigglytuff','zubat','golbat',
  'oddish','gloom','vileplume','paras','parasect','venonat',
  'venomoth','diglett','dugtrio','meowth','persian','psyduck',
  'golduck','mankey','primeape','growlithe','arcanine','poliwag',
  'poliwhirl','poliwrath','abra','kadabra','alakazam','machop',
  'machoke','machamp','bellsprout','weepinbell','victreebel','tentacool',
  'tentacruel','geodude','graveler','golem','ponyta','rapidash',
  'slowpoke','slowbro','magnemite','magneton','farfetchd','doduo',
  'dodrio','seel','dewgong','grimer','muk','shellder',
  'cloyster','gastly','haunter','gengar','onix','drowzee',
  'hypno','krabby','kingler','voltorb','electrode','exeggcute',
  'exeggutor','cubone','marowak','hitmonlee','hitmonchan','lickitung',
  'koffing','weezing','rhyhorn','rhydon','chansey','tangela',
  'kangaskhan','horsea','seadra','goldeen','seaking','staryu',
  'starmie','mr-mime','scyther','jynx','electabuzz','magmar',
  'pinsir','tauros','magikarp','gyarados','lapras','ditto',
  'eevee','vaporeon','jolteon','flareon','porygon','omanyte',
  'omastar','kabuto','kabutops','aerodactyl','snorlax','articuno',
  'zapdos','moltres','dratini','dragonair','dragonite','mewtwo','mew',
  'chikorita','bayleef','meganium','cyndaquil','quilava','typhlosion',
  'totodile','croconaw','feraligatr','sentret','furret','hoothoot',
  'noctowl','ledyba','ledian','spinarak','ariados','crobat',
  'chinchou','lanturn','pichu','cleffa','igglybuff','togepi',
  'togetic','natu','xatu','mareep','flaaffy','ampharos',
  'bellossom','marill','azumarill','sudowoodo','politoed','hoppip',
  'skiploom','jumpluff','aipom','sunkern','sunflora','yanma',
  'wooper','quagsire','espeon','umbreon','murkrow','slowking',
  'misdreavus','unown','wobbuffet','girafarig','pineco','forretress',
  'dunsparce','gligar','steelix','snubbull','granbull','qwilfish',
  'scizor','shuckle','heracross','sneasel','teddiursa','ursaring',
  'slugma','magcargo','swinub','piloswine','corsola','remoraid',
  'octillery','delibird','mantine','skarmory','houndour','houndoom',
  'kingdra','phanpy','donphan','porygon2','stantler','smeargle',
  'tyrogue','hitmontop','smoochum','elekid','magby','miltank',
  'blissey','raikou','entei','suicune','larvitar','pupitar',
  'tyranitar','lugia','ho-oh','celebi',
  'treecko','grovyle','sceptile','torchic','combusken','blaziken',
  'mudkip','marshtomp','swampert','poochyena','mightyena','zigzagoon',
  'linoone','wurmple','silcoon','beautifly','cascoon','dustox',
  'lotad','lombre','ludicolo','seedot','nuzleaf','shiftry',
  'taillow','swellow','wingull','pelipper','ralts','kirlia',
  'gardevoir','surskit','masquerain','shroomish','breloom','slakoth',
  'vigoroth','slaking','nincada','ninjask','shedinja','whismur',
  'loudred','exploud','makuhita','hariyama','azurill','nosepass',
  'skitty','delcatty','sableye','mawile','aron','lairon',
  'aggron','meditite','medicham','electrike','manectric','plusle',
  'minun','volbeat','illumise','roselia','gulpin','swalot',
  'carvanha','sharpedo','wailmer','wailord','numel','camerupt',
  'torkoal','spoink','grumpig','spinda','trapinch','vibrava',
  'flygon','cacnea','cacturne','swablu','altaria','zangoose',
  'seviper','lunatone','solrock','barboach','whiscash','corphish',
  'crawdaunt','baltoy','claydol','lileep','cradily','anorith',
  'armaldo','feebas','milotic','castform','kecleon','shuppet',
  'banette','duskull','dusclops','tropius','chimecho','absol',
  'wynaut','snorunt','glalie','spheal','sealeo','walrein',
  'clamperl','huntail','gorebyss','relicanth','luvdisc','bagon',
  'shelgon','salamence','beldum','metang','metagross','regirock',
  'regice','registeel','latias','latios','kyogre','groudon',
  'rayquaza','jirachi','deoxys',
  'turtwig','grotle','torterra','chimchar','monferno','infernape',
  'piplup','prinplup','empoleon','starly','staravia','staraptor',
  'bidoof','bibarel','kricketot','kricketune','shinx','luxio',
  'luxray','budew','roserade','cranidos','rampardos','shieldon',
  'bastiodon','burmy','wormadam','mothim','combee','vespiquen',
  'pachirisu','buizel','floatzel','cherubi','cherrim','shellos',
  'gastrodon','ambipom','drifloon','drifblim','buneary','lopunny',
  'mismagius','honchkrow','glameow','purugly','chingling','stunky',
  'skuntank','bronzor','bronzong','bonsly','mime-jr','happiny',
  'chatot','spiritomb','gible','gabite','garchomp','munchlax',
  'riolu','lucario','hippopotas','hippowdon','skorupi','drapion',
  'croagunk','toxicroak','carnivine','finneon','lumineon','mantyke',
  'snover','abomasnow','weavile','magnezone','lickilicky','rhyperior',
  'tangrowth','electivire','magmortar','togekiss','yanmega','leafeon',
  'glaceon','gliscor','mamoswine','porygon-z','gallade','probopass',
  'dusknoir','froslass','rotom','uxie','mesprit','azelf',
  'dialga','palkia','heatran','regigigas','giratina','cresselia',
  'phione','manaphy','darkrai','shaymin','arceus',
  'victini','snivy','servine','serperior','tepig','pignite',
  'emboar','oshawott','dewott','samurott','patrat','watchog',
  'lillipup','herdier','stoutland','purrloin','liepard','pansage',
  'simisage','pansear','simisear','panpour','simipour','munna',
  'musharna','pidove','tranquill','unfezant','blitzle','zebstrika',
  'roggenrola','boldore','gigalith','woobat','swoobat','drilbur',
  'excadrill','audino','timburr','gurdurr','conkeldurr','tympole',
  'palpitoad','seismitoad','throh','sawk','sewaddle','swadloon',
  'leavanny','venipede','whirlipede','scolipede','cottonee','whimsicott',
  'petilil','lilligant','basculin','sandile','krokorok','krookodile',
  'darumaka','darmanitan','maractus','dwebble','crustle','scraggy',
  'scrafty','sigilyph','yamask','cofagrigus','tirtouga','carracosta',
  'archen','archeops','trubbish','garbodor','zorua','zoroark',
  'minccino','cinccino','gothita','gothorita','gothitelle','solosis',
  'duosion','reuniclus','ducklett','swanna','vanillite','vanillish',
  'vanilluxe','deerling','sawsbuck','emolga','karrablast','escavalier',
  'foongus','amoonguss','frillish','jellicent','alomomola','joltik',
  'galvantula','ferroseed','ferrothorn','klink','klang','klinklang',
  'tynamo','eelektrik','eelektross','elgyem','beheeyem','litwick',
  'lampent','chandelure','axew','fraxure','haxorus','cubchoo',
  'beartic','cryogonal','shelmet','accelgor','stunfisk','mienfoo',
  'mienshao','druddigon','golett','golurk','pawniard','bisharp',
  'bouffalant','rufflet','braviary','vullaby','mandibuzz','heatmor',
  'durant','deino','zweilous','hydreigon','larvesta','volcarona',
  'cobalion','terrakion','virizion','tornadus','thundurus','reshiram',
  'zekrom','landorus','kyurem','keldeo','meloetta','genesect',
  'chespin','quilladin','chesnaught','fennekin','braixen','delphox',
  'froakie','frogadier','greninja','bunnelby','diggersby','fletchling',
  'fletchinder','talonflame','scatterbug','spewpa','vivillon','litleo',
  'pyroar','flabebe','floette','florges','skiddo','gogoat',
  'pancham','pangoro','furfrou','espurr','meowstic','honedge',
  'doublade','aegislash','spritzee','aromatisse','swirlix','slurpuff',
  'inkay','malamar','binacle','barbaracle','skrelp','dragalge',
  'clauncher','clawitzer','helioptile','heliolisk','tyrunt','tyrantrum',
  'amaura','aurorus','sylveon','hawlucha','dedenne','carbink',
  'goomy','sliggoo','goodra','klefki','phantump','trevenant',
  'pumpkaboo','gourgeist','bergmite','avalugg','noibat','noivern',
  'xerneas','yveltal','zygarde','diancie','hoopa','volcanion',
  'rowlet','dartrix','decidueye','litten','torracat','incineroar',
  'popplio','brionne','primarina','pikipek','trumbeak','toucannon',
  'yungoos','gumshoos','grubbin','charjabug','vikavolt','crabrawler',
  'crabominable','oricorio','cutiefly','ribombee','rockruff','lycanroc',
  'wishiwashi','mareanie','toxapex','mudbray','mudsdale','dewpider',
  'araquanid','fomantis','lurantis','morelull','shiinotic','salandit',
  'salazzle','stufful','bewear','bounsweet','steenee','tsareena',
  'comfey','oranguru','passimian','wimpod','golisopod','sandygast',
  'palossand','pyukumuku','type-null','silvally','minior','komala',
  'turtonator','togedemaru','mimikyu','bruxish','drampa','dhelmise',
  'jangmo-o','hakamo-o','kommo-o','tapu-koko','tapu-lele','tapu-bulu',
  'tapu-fini','cosmog','cosmoem','solgaleo','lunala','nihilego',
  'buzzwole','pheromosa','xurkitree','celesteela','kartana','guzzlord',
  'necrozma','magearna','marshadow','poipole','naganadel','stakataka',
  'blacephalon','zeraora','meltan','melmetal',
  'grookey','thwackey','rillaboom','scorbunny','raboot','cinderace',
  'sobble','drizzile','inteleon','skwovet','greedent','rookidee',
  'corvisquire','corviknight','blipbug','dottler','orbeetle','nickit',
  'thievul','gossifleur','eldegoss','wooloo','dubwool','chewtle',
  'drednaw','yamper','boltund','rolycoly','carkol','coalossal',
  'applin','flapple','appletun','silicobra','sandaconda','cramorant',
  'arrokuda','barraskewda','toxel','toxtricity','sizzlipede','centiskorch',
  'clobbopus','grapploct','sinistea','polteageist','hatenna','hattrem',
  'hatterene','impidimp','morgrem','grimmsnarl','obstagoon','perrserker',
  'cursola','sirfetchd','mr-rime','runerigus','milcery','alcremie',
  'falinks','pincurchin','snom','frosmoth','stonjourner','eiscue',
  'indeedee','morpeko','cufant','copperajah','dracozolt','arctozolt',
  'dracovish','arctovish','duraludon','dreepy','drakloak','dragapult',
  'zacian','zamazenta','eternatus','kubfu','urshifu','zarude',
  'regieleki','regidrago','glastrier','spectrier','calyrex','wyrdeer',
  'kleavor','ursaluna','basculegion','sneasler','overqwil','enamorus',
  'sprigatito','floragato','meowscarada','fuecoco','crocalor','skeledirge',
  'quaxly','quaxwell','quaquaval','lechonk','oinkologne','tarountula',
  'spidops','nymble','lokix','pawmi','pawmo','pawmot',
  'tandemaus','maushold','fidough','dachsbun','smoliv','dolliv',
  'arboliva','squawkabilly','nacli','naclstack','garganacl','charcadet',
  'armarouge','ceruledge','tadbulb','bellibolt','wattrel','kilowattrel',
  'maschiff','mabosstiff','shroodle','grafaiai','bramblin','brambleghast',
  'toedscool','toedscruel','klawf','capsakid','scovillain','rellor',
  'rabsca','flittle','espathra','tinkatink','tinkatuff','tinkaton',
  'wiglett','wugtrio','bombirdier','finizen','palafin','varoom',
  'revavroom','cyclizar','orthworm','glimmet','glimmora','greavard',
  'houndstone','flamigo','cetoddle','cetitan','veluza','dondozo',
  'tatsugiri','annihilape','clodsire','farigiraf','dudunsparce','kingambit',
  'great-tusk','scream-tail','brute-bonnet','flutter-mane','slither-wing','sandy-shocks',
  'iron-treads','iron-bundle','iron-hands','iron-jugulis','iron-moth','iron-thorns',
  'frigibax','arctibax','baxcalibur','gimmighoul','gholdengo','wo-chien',
  'chien-pao','ting-lu','chi-yu','roaring-moon','iron-valiant','koraidon',
  'miraidon','walking-wake','iron-leaves','dipplin','poltchageist','sinistcha',
  'okidogi','munkidori','fezandipiti','ogerpon','archaludon','hydrapple',
  'gouging-fire','raging-bolt','iron-boulder','iron-crown','terapagos','pecharunt'
];

let todosPokemon = [];
let tiposPorPokemon = {};
let jaCarregou = false;

let todosItens = [];
let itensPorNome = {};
let itensCarregados = false;
let ordemItensAtual = 'az';

let cartasLoadPromise = null;

document.addEventListener('DOMContentLoaded', () => {
  carregarDictTrad();
  carregarCacheDetalhes();
  injetarEstilos();
  configurarAbas();
  renderizarRegioes();
  renderizarHotspotsMapa();
  configurarFiltros();
  configurarFiltrosItens();
  criarBotaoIdioma();
  criarBotaoRegras();
  carregarPokemon();
  carregarItens();
  configurarFiltrosCartas();
  configurarDeck();
});

function carregarDictTrad() {
  try {
    const bruto = localStorage.getItem(TRAD_CACHE_KEY);
    if (bruto) tradDict = JSON.parse(bruto) || {};
  } catch (e) { tradDict = {}; }
  try {
    const bruto = localStorage.getItem(TRAD_FAIL_KEY);
    if (bruto) tradFails = JSON.parse(bruto) || {};
  } catch (e) { tradFails = {}; }
}

function salvarDictTrad() {
  try { localStorage.setItem(TRAD_CACHE_KEY, JSON.stringify(tradDict)); } catch (e) {}
}
function salvarTradFails() {
  try { localStorage.setItem(TRAD_FAIL_KEY, JSON.stringify(tradFails)); } catch (e) {}
}

function injetarEstilos() {
  if (document.getElementById('estilos-extras-pokedex')) return;
  const style = document.createElement('style');
  style.id = 'estilos-extras-pokedex';
  style.textContent = `
    .filtros-container.itens-filtros { grid-template-columns: 2fr 1fr 1fr; }
    .btn-idioma-itens {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 0.4rem; padding: 0.5rem 0.8rem;
      background: rgba(0, 20, 40, 0.8);
      border: 2px solid rgba(0, 224, 255, 0.35);
      color: #e0f4ff; border-radius: 8px;
      font-family: 'Courier New', monospace; font-size: 0.82rem;
      font-weight: bold; letter-spacing: 1px;
      cursor: pointer; transition: all 0.25s; text-transform: uppercase;
    }
    .btn-idioma-itens:hover {
      background: rgba(0, 224, 255, 0.15);
      border-color: #00e0ff;
      box-shadow: 0 0 14px rgba(0, 224, 255, 0.5);
      transform: translateY(-2px);
    }
    .btn-idioma-itens .idioma-bandeira { font-size: 1.05rem; line-height: 1; }
    .filtro-grupo.filtro-tipos-grupo { position: relative; }
    .tipo-mult-btn {
      width: 100%;
      display: flex; align-items: center; justify-content: space-between;
      gap: 0.4rem; padding: 0.5rem 0.7rem;
      background: rgba(0, 20, 40, 0.8);
      border: 2px solid rgba(0, 224, 255, 0.35);
      color: #e0f4ff; border-radius: 8px;
      font-size: 0.85rem; font-family: inherit;
      cursor: pointer; text-align: left;
      transition: all 0.2s; outline: none;
    }
    .tipo-mult-btn:hover, .tipo-mult-btn.aberto {
      border-color: #00e0ff;
      box-shadow: 0 0 12px rgba(0, 224, 255, 0.5);
    }
    .tipo-mult-seta { font-size: 0.65rem; color: #00e0ff; transition: transform 0.2s; flex-shrink: 0; }
    .tipo-mult-btn.aberto .tipo-mult-seta { transform: rotate(180deg); }
    #tipo-mult-texto { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tipo-mult-painel {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0;
      z-index: 200;
      background: linear-gradient(135deg, #0a1628 0%, #051020 100%);
      border: 2px solid rgba(0, 224, 255, 0.4);
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 224, 255, 0.3);
      max-height: 300px; overflow-y: auto;
      padding: 0.4rem; display: none;
    }
    .tipo-mult-painel.aberto { display: block; }
    .tipo-mult-item {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.35rem 0.5rem; border-radius: 5px;
      cursor: pointer; font-size: 0.8rem; color: #d0f4ff;
      transition: background 0.15s; user-select: none;
    }
    .tipo-mult-item:hover { background: rgba(0, 224, 255, 0.1); }
    .tipo-mult-item input[type="checkbox"] {
      width: 15px; height: 15px; accent-color: #00e0ff;
      cursor: pointer; margin: 0; flex-shrink: 0;
    }
    .tipo-mult-item.tipo-mult-todos {
      border-bottom: 1px dashed rgba(0, 224, 255, 0.2);
      margin-bottom: 0.3rem; padding-bottom: 0.4rem;
      font-weight: bold; color: #ffcb05;
    }
    .tipo-mult-painel::-webkit-scrollbar { width: 6px; }
    .tipo-mult-painel::-webkit-scrollbar-track { background: rgba(0, 224, 255, 0.05); }
    .tipo-mult-painel::-webkit-scrollbar-thumb { background: rgba(0, 224, 255, 0.4); border-radius: 3px; }
    .pokemon-card .tipos-mini {
      display: flex; gap: 0.2rem; flex-wrap: wrap;
      justify-content: center; align-items: center;
      margin-top: 0.3rem;
    }
    .pokemon-card .tipo-mini {
      font-size: 0.58rem; padding: 0.1rem 0.4rem;
      border-radius: 4px; display: inline-block;
      text-transform: uppercase; font-weight: bold;
      color: #fff; letter-spacing: 0.5px; line-height: 1.4;
    }
    .item-sprite-fb {
      display: none;
      width: 48px; height: 48px;
      align-items: center; justify-content: center;
      font-size: 1.6rem; opacity: 0.35;
    }
    .trad-status {
      display: inline-flex; align-items: center; gap: 0.35rem;
      font-size: 0.6rem; padding: 0.1rem 0.45rem;
      border-radius: 4px; letter-spacing: 0.5px;
      font-family: 'Courier New', monospace;
      margin-left: 0.4rem;
    }
    .trad-status.trad-ok {
      background: rgba(76, 175, 80, 0.15);
      border: 1px solid rgba(76, 175, 80, 0.5);
      color: #81c784;
    }
    .trad-status.trad-loading {
      background: rgba(255, 203, 5, 0.12);
      border: 1px solid rgba(255, 203, 5, 0.4);
      color: #ffcb05;
    }
    .trad-status.trad-fail {
      background: rgba(239, 83, 80, 0.15);
      border: 1px solid rgba(239, 83, 80, 0.5);
      color: #ef5350;
      cursor: help;
    }
    .trad-aviso {
      display: flex; align-items: center; gap: 0.5rem;
      margin-top: 0.5rem; padding: 0.45rem 0.65rem;
      background: rgba(239, 83, 80, 0.08);
      border: 1px solid rgba(239, 83, 80, 0.3);
      border-left: 3px solid #ef5350;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 0.68rem;
      color: #ffb3b3;
      line-height: 1.4;
    }
    .trad-aviso button {
      margin-left: auto;
      padding: 0.25rem 0.6rem;
      background: rgba(0, 224, 255, 0.12);
      border: 1px solid rgba(0, 224, 255, 0.4);
      border-radius: 6px;
      color: #00e0ff;
      font-family: 'Courier New', monospace;
      font-size: 0.62rem;
      font-weight: bold;
      letter-spacing: 1px;
      cursor: pointer;
      text-transform: uppercase;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .trad-aviso button:hover {
      background: rgba(0, 224, 255, 0.25);
      border-color: #00e0ff;
      box-shadow: 0 0 10px rgba(0, 224, 255, 0.5);
    }
    .filtro-grupo.filtro-grupo-regras { min-width: 110px; }
    .btn-regras-cartas {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 0.4rem; padding: 0.5rem 0.9rem;
      background: rgba(255, 203, 5, 0.08);
      border: 2px solid rgba(255, 203, 5, 0.4);
      color: #ffcb05; border-radius: 8px;
      font-family: 'Courier New', monospace; font-size: 0.82rem;
      font-weight: bold; letter-spacing: 1px;
      cursor: pointer; transition: all 0.25s; text-transform: uppercase;
    }
    .btn-regras-cartas:hover {
      background: rgba(255, 203, 5, 0.2);
      border-color: #ffcb05;
      box-shadow: 0 0 14px rgba(255, 203, 5, 0.5);
      transform: translateY(-2px);
    }
    .modal-regras-box {
      background: linear-gradient(135deg, #0a1628 0%, #051020 100%);
      border: 3px solid #ffcb05;
      border-radius: 16px;
      padding: 1.6rem 1.4rem 1.3rem;
      max-width: 620px;
      width: 100%;
      max-height: 92vh;
      overflow-y: auto;
      box-shadow: 0 0 60px rgba(255, 203, 5, 0.5), inset 0 0 40px rgba(0, 0, 0, 0.7);
      position: relative;
      animation: modalPop 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2);
    }
    .modal-regras-titulo {
      color: #ffcb05;
      font-size: 1.2rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-family: 'Courier New', monospace;
      margin: 0 0 1rem 0;
      padding-bottom: 0.6rem;
      border-bottom: 2px dashed rgba(255, 203, 5, 0.35);
      text-shadow: 0 0 12px rgba(255, 203, 5, 0.6);
    }
    .modal-regras-secao {
      margin-bottom: 0.9rem;
      padding: 0.7rem 0.9rem;
      background: rgba(0, 224, 255, 0.03);
      border: 1px solid rgba(0, 224, 255, 0.15);
      border-left: 3px solid rgba(255, 203, 5, 0.6);
      border-radius: 8px;
    }
    .modal-regras-secao h4 {
      color: #ffcb05;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-family: 'Courier New', monospace;
      margin: 0 0 0.4rem 0;
      text-shadow: 0 0 8px rgba(255, 203, 5, 0.4);
    }
    .modal-regras-secao p {
      color: #d0f4ff;
      font-size: 0.85rem;
      line-height: 1.5;
      margin: 0 0 0.35rem 0;
    }
    .modal-regras-secao p:last-child { margin-bottom: 0; }
    .modal-regras-secao b {
      color: #00e0ff;
      font-family: 'Courier New', monospace;
    }
    .modal-regras-dica {
      color: #7a9fb8 !important;
      font-size: 0.78rem !important;
      font-style: italic;
      margin-top: 0.3rem !important;
      padding-top: 0.4rem;
      border-top: 1px dashed rgba(0, 224, 255, 0.15);
    }
    .carta-mov-uso {
      padding: 0.08rem 0.4rem;
      border-radius: 5px;
      font-family: 'Courier New', monospace;
      font-size: 0.6rem;
      font-weight: bold;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    .carta-mov-uso-at-will {
      background: rgba(76, 175, 80, 0.15);
      border: 1px solid rgba(76, 175, 80, 0.5);
      color: #81c784;
      text-shadow: 0 0 4px rgba(76, 175, 80, 0.5);
    }
    .carta-mov-uso-eot {
      background: rgba(255, 203, 5, 0.15);
      border: 1px solid rgba(255, 203, 5, 0.5);
      color: #ffcb05;
      text-shadow: 0 0 4px rgba(255, 203, 5, 0.5);
    }
    .carta-mov-uso-unico {
      background: rgba(239, 83, 80, 0.15);
      border: 1px solid rgba(239, 83, 80, 0.5);
      color: #ef5350;
      text-shadow: 0 0 4px rgba(239, 83, 80, 0.5);
    }
    .deck-card { cursor: pointer; }
    .deck-card-ver {
      position: relative; z-index: 2;
      margin-top: 0.3rem;
      text-align: center;
      font-family: 'Courier New', monospace;
      font-size: 0.55rem;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #00e0ff;
      padding: 0.18rem 0.4rem;
      background: rgba(0, 224, 255, 0.08);
      border: 1px solid rgba(0, 224, 255, 0.35);
      border-radius: 5px;
      text-shadow: 0 0 5px rgba(0, 224, 255, 0.5);
      transition: all 0.2s;
    }
    .deck-card:hover .deck-card-ver {
      background: rgba(0, 224, 255, 0.2);
      border-color: #00e0ff;
    }
    .modal-carta-deck-box {
      background: linear-gradient(135deg, #0a1628 0%, #051020 100%);
      border: 3px solid #00e0ff;
      border-radius: 16px;
      padding: 1.2rem;
      max-width: 640px;
      width: 100%;
      max-height: 94vh;
      overflow-y: auto;
      box-shadow: 0 0 60px rgba(0, 224, 255, 0.55), inset 0 0 40px rgba(0, 0, 0, 0.7);
      position: relative;
      animation: modalPop 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2);
    }
    .modal-carta-deck-box .carta-pokemon {
      border: none;
      background: transparent;
      box-shadow: none;
      padding: 0;
      transform: none !important;
    }
    .modal-carta-deck-rodape {
      margin-top: 0.8rem;
      padding-top: 0.8rem;
      border-top: 1px dashed rgba(0, 224, 255, 0.25);
      text-align: center;
    }
    @media (max-width: 600px) {
      .filtros-container.itens-filtros { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
}

function criarBotaoIdioma() {
  const container = document.querySelector('.itens-filtros');
  if (!container || document.getElementById('btn-idioma-itens')) return;

  const grupo = document.createElement('div');
  grupo.className = 'filtro-grupo';
  const label = document.createElement('label');
  label.textContent = 'Idioma';
  const btn = document.createElement('button');
  btn.id = 'btn-idioma-itens';
  btn.className = 'btn-idioma-itens';
  btn.type = 'button';
  btn.title = 'Alternar idioma dos itens';
  atualizarVisualBotaoIdioma(btn);
  btn.addEventListener('click', alternarIdiomaItens);

  grupo.appendChild(label);
  grupo.appendChild(btn);
  container.appendChild(grupo);
}

function criarBotaoRegras() {
  const painel = document.getElementById('painel-cartas');
  if (!painel || document.getElementById('btn-regras-cartas')) return;

  const filtros = painel.querySelector('.filtros-container');
  if (!filtros) return;

  const grupo = document.createElement('div');
  grupo.className = 'filtro-grupo filtro-grupo-regras';
  grupo.innerHTML = `
    <label>Ajuda</label>
    <button id="btn-regras-cartas" class="btn-regras-cartas" type="button" title="Ver regras do sistema de cartas">
      📖 Regras
    </button>
  `;
  filtros.appendChild(grupo);

  document.getElementById('btn-regras-cartas').addEventListener('click', abrirModalRegras);
}

function abrirModalRegras() {
  const container = document.getElementById('modal-item-container');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-overlay" id="modal-regras-overlay">
      <div class="modal-regras-box">
        <button class="modal-close" id="modal-regras-close">✕</button>
        <h3 class="modal-regras-titulo">📖 Regras do Sistema de Cartas</h3>

        <div class="modal-regras-secao">
          <h4>⚔ Acerto</h4>
          <p>Role <b>1d6 + Atq</b> (ou <b>1d6 + AtqE</b> para golpes especiais) contra <b>1d6 + Def</b> (ou <b>1d6 + DefE</b>) do oponente.</p>
          <p>Se o seu resultado for <b>maior ou igual</b>, o golpe acerta.</p>
        </div>

        <div class="modal-regras-secao">
          <h4>💥 Crítico</h4>
          <p>Se o atacante tirar <b>6 natural no 1d6</b> (ou <b>10+ no 2d6</b> para lendários), o dano é <b>multiplicado por 2</b>.</p>
          <p class="modal-regras-dica">Alguns golpes têm chance de crítico aumentada — isso fica descrito no próprio golpe.</p>
        </div>

        <div class="modal-regras-secao">
          <h4>⚡ Super Efetivo / 🛡 Resistente</h4>
          <p>Se o tipo do golpe for <b>super efetivo</b> contra o alvo, some <b>+2 de dano</b>.</p>
          <p>Se for <b>pouco efetivo</b>, subtraia <b>1 de dano</b> (mínimo 1).</p>
          <p>Se o alvo for <b>imune</b>, o golpe não causa dano.</p>
        </div>

        <div class="modal-regras-secao">
          <h4>❤️ HP</h4>
          <p>O HP é calculado a partir do stat base convertido para a escala da carta, multiplicado por 2 e somado a uma base de 10.</p>
          <p>Normal: <b>12 a 26</b> · Lendário: <b>12 a 30</b>.</p>
        </div>

        <div class="modal-regras-secao">
          <h4>🎯 Ações &amp; Usos</h4>
          <p>Cada Pokémon faz <b>1 ação por turno</b> — escolher um dos 4 golpes disponíveis na carta.</p>
          <p>Os golpes têm <b>categorias de uso</b> baseadas na força deles (dano intrínseco):</p>
          <p><b>∞ At-will</b> — pode ser usado todo turno (golpes fracos, dano 0–2).</p>
          <p><b>🔄 EoT</b> — depois de usado, espere 1 turno antes de usar de novo (golpes médios, dano 3–4).</p>
          <p><b>1× Uso único</b> — só pode ser usado uma vez por batalha (golpes fortes, dano 5+).</p>
          <p class="modal-regras-dica">Cada Pokémon tem 1 at-will, 1 EoT e, quando disponível, 1 uso único — garantindo progressão.</p>
        </div>

        <div class="modal-regras-secao">
          <h4>🎲 Decks Aleatórios</h4>
          <p>Quando um deck é sorteado, cada Pokémon recebe <b>um conjunto único de golpes</b> — dois jogadores com o mesmo Pokémon podem ter move pools diferentes.</p>
          <p class="modal-regras-dica">Clique em qualquer carta do deck pra ver os golpes sorteados.</p>
        </div>

        <div class="modal-regras-secao">
          <h4>🌱 Evolução</h4>
          <p>Quando um Pokémon derrota um oponente <b>sem ser derrubado</b>, ele evolui para a próxima forma, ganhando stats melhores e novos golpes.</p>
          <p>Se o Pokémon for derrubado antes de evoluir, volta à forma base.</p>
        </div>

        <div class="modal-regras-secao">
          <h4>🎴 Deck</h4>
          <p>Cada deck tem <b>6 Pokémon</b> — apenas <b>formas base ou únicas</b> (sem evoluções) e no máximo <b>1 lendário</b>.</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-regras-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-regras-overlay') fecharModalRegras();
  });
  document.getElementById('modal-regras-close').addEventListener('click', fecharModalRegras);
  document.addEventListener('keydown', escutarEscRegras);
}

function fecharModalRegras() {
  const container = document.getElementById('modal-item-container');
  if (container) container.innerHTML = '';
  document.removeEventListener('keydown', escutarEscRegras);
}

function escutarEscRegras(e) { if (e.key === 'Escape') fecharModalRegras(); }

function atualizarVisualBotaoIdioma(btn) {
  const alvo = btn || document.getElementById('btn-idioma-itens');
  if (!alvo) return;
  if (idiomaItens === 'pt') {
    alvo.innerHTML = `<span class="idioma-bandeira">🇧🇷</span><span>PT</span>`;
  } else {
    alvo.innerHTML = `<span class="idioma-bandeira">🇺🇸</span><span>EN</span>`;
  }
}

function alternarIdiomaItens() {
  idiomaItens = idiomaItens === 'pt' ? 'en' : 'pt';
  localStorage.setItem(IDIOMA_KEY, idiomaItens);
  atualizarVisualBotaoIdioma();
  if (modalItemAberto) abrirDetalhesItem(modalItemAberto);
}

function configurarAbas() {
  const abas = document.querySelectorAll('.aba');
  const paineis = document.querySelectorAll('.painel');
  abas.forEach(aba => {
    aba.addEventListener('click', () => {
      const destino = aba.dataset.aba;
      abas.forEach(a => a.classList.remove('ativa'));
      paineis.forEach(p => p.classList.remove('ativo'));
      aba.classList.add('ativa');
      document.getElementById(`painel-${destino}`).classList.add('ativo');

      if (destino === 'cartas' && !cartasCarregadas) iniciarCarregamentoCartas();
      if (destino === 'deck'   && !cartasCarregadas) iniciarCarregamentoCartas();
    });
  });
}

function iniciarCarregamentoCartas() {
  if (cartasLoadPromise) return cartasLoadPromise;
  cartasLoadPromise = carregarCartas();
  return cartasLoadPromise;
}

async function carregarPokemon() {
  if (jaCarregou) return;
  jaCarregou = true;
  const loading = document.getElementById('loading');
  try {
    todosPokemon = NOMES_POKEMON.map((nome, i) => ({ id: i + 1, nome }));
    loading.style.display = 'none';
    renderizarPokemon(todosPokemon);
    carregarTiposBackground();
  } catch (erro) {
    loading.textContent = 'Erro ao carregar os Pokémon.';
  }
}

async function carregarTiposBackground() {
  try {
    const nomesTipos = Object.keys(NOMES_TIPOS);
    const promessas = nomesTipos.map(async tipo => {
      const res = await fetch(`${TYPE_URL}/${tipo}`);
      const data = await res.json();
      const ids = data.pokemon.map(p => {
        const m = p.pokemon.url.match(/\/(\d+)\/?$/);
        return m ? parseInt(m[1]) : null;
      }).filter(id => id !== null && id <= TOTAL_POKEMON);
      return { tipo, ids };
    });
    const resultados = await Promise.all(promessas);
    resultados.forEach(({ tipo, ids }) => {
      ids.forEach(id => {
        if (!tiposPorPokemon[id]) tiposPorPokemon[id] = [];
        tiposPorPokemon[id].push(tipo);
      });
    });
    renderizarPokemon(todosPokemon);
  } catch (e) {}
}

function renderizarPokemon(lista) {
  const grid = document.getElementById('pokemon-grid');
  grid.innerHTML = '';
  if (lista.length === 0) {
    grid.innerHTML = '<p class="loading" style="grid-column: 1/-1;">Nenhum Pokémon encontrado.</p>';
    return;
  }
  const CHUNK = 60;
  for (let i = 0; i < lista.length; i += CHUNK) {
    lista.slice(i, i + CHUNK).forEach(p => grid.appendChild(criarCardPokemon(p)));
  }
}

function criarCardPokemon(p) {
  const numero = String(p.id).padStart(4, '0');
  const tipos = tiposPorPokemon[p.id] || [];
  const tiposParaMostrar = tipos.length > 0 ? tipos : ['normal'];
  const tiposHTML = tiposParaMostrar.map(t => {
    const nome = NOMES_TIPOS[t] || t;
    return `<span class="tipo-mini tipo-${t}">${nome}</span>`;
  }).join('');

  const card = document.createElement('a');
  card.href = `detalhes.html?id=${p.id}`;
  card.className = 'pokemon-card';
  card.innerHTML = `
    <img src="${ARTWORK}/${p.id}.png" alt="${p.nome}" loading="lazy"
         onerror="this.onerror=null; this.src='${SPRITE}/${p.id}.png';">
    <div class="numero">#${numero}</div>
    <div class="nome">${capitalizar(p.nome)}</div>
    <div class="tipos-mini">${tiposHTML}</div>
  `;
  return card;
}

function configurarFiltros() {
  const inputBusca = document.getElementById('filtro-busca');
  const selectGeracao = document.getElementById('filtro-geracao');
  const inputNumero = document.getElementById('filtro-numero');

  Object.entries(REGIOES).forEach(([id, gen]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = `Gen ${id} - ${gen.nome}`;
    selectGeracao.appendChild(option);
  });

  const selectTipoOriginal = document.getElementById('filtro-tipo');
  criarFiltroTiposCustom(selectTipoOriginal);

  inputBusca.addEventListener('input', aplicarFiltrosPokemon);
  selectGeracao.addEventListener('change', aplicarFiltrosPokemon);
  inputNumero.addEventListener('input', aplicarFiltrosPokemon);
}

function aplicarFiltrosPokemon() {
  const busca = document.getElementById('filtro-busca').value.toLowerCase().trim();
  const geracao = document.getElementById('filtro-geracao').value;
  const numero = document.getElementById('filtro-numero').value.trim();
  const tiposSelecionados = obterTiposSelecionados();

  const lista = todosPokemon.filter(p => {
    if (busca && !p.nome.toLowerCase().includes(busca)) return false;
    if (numero && String(p.id) !== numero) return false;
    if (geracao) {
      const gen = REGIOES[geracao];
      if (p.id < gen.inicio || p.id > gen.fim) return false;
    }
    if (tiposSelecionados.length > 0) {
      const tiposDoPokemon = tiposPorPokemon[p.id] || [];
      if (!tiposSelecionados.every(t => tiposDoPokemon.includes(t))) return false;
    }
    return true;
  });

  renderizarPokemon(lista);
}

function criarFiltroTiposCustom(selectOriginal) {
  if (!selectOriginal || selectOriginal.dataset.substituido === 'true') return;
  selectOriginal.dataset.substituido = 'true';
  selectOriginal.style.display = 'none';

  const grupo = selectOriginal.parentElement;
  grupo.classList.add('filtro-tipos-grupo');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'tipo-mult-btn';
  btn.className = 'tipo-mult-btn';
  btn.innerHTML = `<span id="tipo-mult-texto">Todos</span><span class="tipo-mult-seta">▼</span>`;

  const painel = document.createElement('div');
  painel.id = 'tipo-mult-painel';
  painel.className = 'tipo-mult-painel';
  painel.innerHTML = `
    <label class="tipo-mult-item tipo-mult-todos">
      <input type="checkbox" data-tipo="__todos__" checked><span>Todos</span>
    </label>
    ${Object.entries(NOMES_TIPOS).map(([v, n]) => `
      <label class="tipo-mult-item">
        <input type="checkbox" data-tipo="${v}"><span>${n}</span>
      </label>
    `).join('')}
  `;

  grupo.appendChild(btn);
  grupo.appendChild(painel);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const aberto = painel.classList.toggle('aberto');
    btn.classList.toggle('aberto', aberto);
  });

  document.addEventListener('click', (e) => {
    if (!grupo.contains(e.target)) {
      painel.classList.remove('aberto');
      btn.classList.remove('aberto');
    }
  });

  painel.addEventListener('change', (e) => {
    const alvo = e.target;
    if (alvo.dataset.tipo === '__todos__') {
      painel.querySelectorAll('input[data-tipo]').forEach(i => {
        i.checked = i.dataset.tipo === '__todos__';
      });
    } else {
      painel.querySelector('input[data-tipo="__todos__"]').checked = false;
      const algum = [...painel.querySelectorAll('input[data-tipo]:checked')]
        .some(i => i.dataset.tipo !== '__todos__');
      if (!algum) painel.querySelector('input[data-tipo="__todos__"]').checked = true;
    }
    atualizarTextoBotaoTipos();
    aplicarFiltrosPokemon();
  });

  atualizarTextoBotaoTipos();
}

function atualizarTextoBotaoTipos() {
  const painel = document.getElementById('tipo-mult-painel');
  const texto = document.getElementById('tipo-mult-texto');
  if (!painel || !texto) return;
  const marcados = [...painel.querySelectorAll('input[data-tipo]:checked')]
    .map(i => i.dataset.tipo).filter(t => t !== '__todos__');
  if (marcados.length === 0) texto.textContent = 'Todos';
  else if (marcados.length === 1) texto.textContent = NOMES_TIPOS[marcados[0]] || marcados[0];
  else if (marcados.length <= 2) texto.textContent = marcados.map(t => NOMES_TIPOS[t] || t).join(', ');
  else texto.textContent = `${marcados.length} tipos`;
}

function obterTiposSelecionados() {
  const painel = document.getElementById('tipo-mult-painel');
  if (!painel) return [];
  return [...painel.querySelectorAll('input[data-tipo]:checked')]
    .map(i => i.dataset.tipo).filter(t => t !== '__todos__');
}

function lerCacheItens() {
  try {
    const bruto = localStorage.getItem(ITENS_CACHE_KEY);
    if (!bruto) return null;
    const cache = JSON.parse(bruto);
    if (!cache.timestamp || !Array.isArray(cache.itens)) return null;
    if (Date.now() - cache.timestamp > CACHE_DURACAO_MS) {
      localStorage.removeItem(ITENS_CACHE_KEY);
      return null;
    }
    return cache.itens;
  } catch (e) { return null; }
}

function salvarCacheItens(itens) {
  try {
    localStorage.setItem(ITENS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), itens }));
  } catch (e) {}
}

function carregarCacheDetalhes() {
  try { itemDetalhes = JSON.parse(localStorage.getItem(ITEM_DET_CACHE_KEY) || '{}'); }
  catch (e) { itemDetalhes = {}; }
}

function salvarCacheDetalhes() {
  try { localStorage.setItem(ITEM_DET_CACHE_KEY, JSON.stringify(itemDetalhes)); } catch (e) {}
}

function limparTexto(t) {
  return t.replace(/[\n\f\r]/g, ' ').replace(/\s+/g, ' ').trim();
}

function extrairNomeTraduzido(item, idioma) {
  const nomes = item.names || [];
  if (idioma === 'pt') {
    let n = nomes.find(x => x.language.name === 'pt-BR');
    if (!n) n = nomes.find(x => x.language.name === 'pt');
    if (n && n.name) return n.name;
  }
  if (idioma === 'en') {
    const n = nomes.find(x => x.language.name === 'en');
    if (n && n.name) return n.name;
  }
  return capitalizar(item.name);
}

function extrairDescricao(item, idioma) {
  const entradas = item.flavor_text_entries || [];
  let entrada = null;
  if (idioma === 'pt') {
    entrada = entradas.find(f => f.language.name === 'pt-BR');
    if (!entrada) entrada = entradas.find(f => f.language.name === 'pt');
  }
  if (!entrada && idioma === 'en') {
    entrada = entradas.find(f => f.language.name === 'en');
  }
  return entrada ? limparTexto(entrada.text) : null;
}

function extrairEfeito(item) {
  const efeitos = item.effect_entries || [];
  const e = efeitos.find(x => x.language.name === 'pt-BR')
         || efeitos.find(x => x.language.name === 'pt')
         || efeitos.find(x => x.language.name === 'en');
  if (!e) return null;
  const txt = (e.short_effect || e.effect || '').trim();
  return txt ? limparTexto(txt) : null;
}

function traduzirCategoria(cat) {
  if (!cat) return null;
  return CATEGORIAS_PT[cat] || capitalizar(cat.replace(/-/g, ' '));
}

function traduzirAtributos(listaBruta) {
  if (!Array.isArray(listaBruta) || listaBruta.length === 0) return null;
  return listaBruta.map(a => ATRIBUTOS_PT[a] || capitalizar(a.replace(/-/g, ' '))).join(' · ');
}

function obterNomeItem(nomeOuItem) {
  const nome = typeof nomeOuItem === 'string' ? nomeOuItem : nomeOuItem.nome;
  const det = itemDetalhes[nome];
  if (!det) return capitalizar(nome);
  if (idiomaItens === 'pt') return det.nomePt || det.nomeEn || capitalizar(nome);
  return det.nomeEn || det.nomePt || capitalizar(nome);
}

function textoInvalido(t) {
  if (!t) return true;
  const s = String(t).trim();
  if (!s) return true;
  if (/^MYMEMORY WARNING/i.test(s)) return true;
  if (/QUERY LENGTH LIMIT/i.test(s)) return true;
  if (/INVALID/i.test(s)) return true;
  if (/PLEASE SELECT TWO DISTINCT/i.test(s)) return true;
  return false;
}

async function chamarMyMemory(texto, langpair, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let url = `${TRAD_MYMEMORY}?q=${encodeURIComponent(texto)}&langpair=${encodeURIComponent(langpair)}`;
    if (emailTrad) url += `&de=${encodeURIComponent(emailTrad)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (res.status === 429) return { status: 429 };
    if (!res.ok) return { status: res.status };
    const data = await res.json();
    const t = data?.responseData?.translatedText;
    if (!textoInvalido(t)) return { status: 200, texto: t };
    return { status: 200, texto: null };
  } catch (e) {
    clearTimeout(timer);
    return { status: 0, erro: e };
  }
}

async function traduzirEnParaPt(texto, forcar = false) {
  if (!texto) return null;
  const chave = texto.slice(0, 500);
  if (tradDict[chave] && !forcar) return tradDict[chave];

  const langpairs = ['en|pt-BR', 'en|pt'];
  const delays = [0, 1200, 3000];

  for (let tent = 0; tent < delays.length; tent++) {
    if (delays[tent] > 0) await new Promise(r => setTimeout(r, delays[tent]));

    const lp = langpairs[tent % langpairs.length];
    const resp = await chamarMyMemory(texto, lp);

    if (resp.status === 429) continue;
    if (resp.status === 200 && resp.texto) {
      tradDict[chave] = resp.texto;
      delete tradFails[chave];
      salvarDictTrad();
      salvarTradFails();
      return resp.texto;
    }
  }

  tradFails[chave] = Date.now();
  salvarTradFails();
  return null;
}

function deveTentarTraduzirNovamente(chave) {
  const quando = tradFails[chave];
  if (!quando) return true;
  return (Date.now() - quando) > 5 * 60 * 1000;
}

async function carregarItens() {
  if (itensCarregados) return;
  itensCarregados = true;
  const loading = document.getElementById('loading-itens');

  const cache = lerCacheItens();
  if (cache && cache.length > 0) {
    todosItens = cache;
    itensPorNome = {};
    todosItens.forEach(it => { itensPorNome[it.nome] = it; });
    loading.style.display = 'none';
    renderizarItensComAgrupamento();
    return;
  }

  try {
    loading.innerHTML = '📥 Baixando lista de itens...';
    const res = await fetch(ALL_ITEMS_URL);
    const data = await res.json();

    todosItens = data.results.map(r => ({
      nome: r.name,
      sprite: `${ITEM_SPRITE_BASE}/${r.name}.png`
    }));

    itensPorNome = {};
    todosItens.forEach(it => { itensPorNome[it.nome] = it; });
    salvarCacheItens(todosItens);

    loading.style.display = 'none';
    renderizarItensComAgrupamento();
  } catch (erro) {
    loading.textContent = 'Erro ao carregar os itens.';
  }
}

function renderizarItensComAgrupamento() {
  const inputBusca = document.getElementById('filtro-item-busca');
  const busca = inputBusca ? inputBusca.value.toLowerCase().trim() : '';
  let lista = todosItens.filter(item => {
    if (!busca) return true;
    const nomeExibido = obterNomeItem(item).toLowerCase();
    return nomeExibido.includes(busca) || item.nome.toLowerCase().includes(busca);
  });
  lista = ordenarItens(lista, ordemItensAtual === 'za');
  renderizarItens(lista);
}

function renderizarItens(lista) {
  const grid = document.getElementById('itens-grid');
  grid.innerHTML = '';
  if (lista.length === 0) {
    const p = document.createElement('p');
    p.className = 'loading';
    p.style.gridColumn = '1/-1';
    p.textContent = 'Nenhum item encontrado.';
    grid.appendChild(p);
    return;
  }
  let grupoAtual = null;
  lista.forEach(item => {
    const grupo = obterGrupoItem(item.nome);
    if (grupo !== grupoAtual) {
      grupoAtual = grupo;
      const header = document.createElement('div');
      header.className = 'itens-grupo-header';
      header.textContent = NOME_GRUPO[grupo] || '❓ Outros';
      header.dataset.grupo = grupo;
      grid.appendChild(header);
    }
    grid.appendChild(criarCardItem(item));
  });
}

function criarCardItem(item) {
  const card = document.createElement('div');
  card.className = 'item-card';
  card.dataset.nome = item.nome;
  card.innerHTML = `
    <div class="item-sprite-wrap">
      <img src="${item.sprite}" alt="${capitalizar(item.nome)}" loading="lazy" class="item-sprite"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <span class="item-sprite-fb">📦</span>
    </div>
    <div class="item-nome">${obterNomeItem(item)}</div>
  `;
  card.addEventListener('click', () => abrirDetalhesItem(item.nome));
  return card;
}

function configurarFiltrosItens() {
  const inputBusca = document.getElementById('filtro-item-busca');
  const selectOrdem = document.getElementById('filtro-item-ordem');
  inputBusca.addEventListener('input', () => renderizarItensComAgrupamento());
  selectOrdem.addEventListener('change', () => {
    ordemItensAtual = selectOrdem.value;
    renderizarItensComAgrupamento();
  });
}

async function obterDetalhesItem(nome) {
  if (itemDetalhes[nome]) return itemDetalhes[nome];
  try {
    const r = await fetch(`${ITEM_URL}/${nome}`);
    if (!r.ok) return null;
    const d = await r.json();
    const det = {
      nomePt: extrairNomeTraduzido(d, 'pt'),
      nomeEn: extrairNomeTraduzido(d, 'en'),
      descricaoPt: extrairDescricao(d, 'pt'),
      descricaoEn: extrairDescricao(d, 'en'),
      efeito: extrairEfeito(d),
      categoria: d.category?.name || null,
      custo: (d.cost !== null && d.cost !== undefined) ? d.cost : null,
      geracao: d.game_indices?.length
        ? d.game_indices[0].generation.name.replace('generation-', '').toUpperCase()
        : null,
      atributos: d.attributes?.length ? d.attributes.map(a => a.name) : null
    };
    itemDetalhes[nome] = det;
    salvarCacheDetalhes();
    return det;
  } catch (e) { return null; }
}

async function abrirDetalhesItem(nomeItem) {
  const item = itensPorNome[nomeItem];
  const container = document.getElementById('modal-item-container');
  if (!item) return;
  modalItemAberto = nomeItem;

  container.innerHTML = `
    <div class="modal-overlay" id="modal-item-overlay">
      <div class="modal-item-box">
        <button class="modal-close" id="modal-item-close">✕</button>
        <div class="modal-item-cabecalho">
          <div class="modal-item-sprite-wrap">
            <img src="${item.sprite}" alt="${capitalizar(nomeItem)}" class="modal-item-sprite"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <span class="item-sprite-fb" style="display:none;font-size:2.2rem;">📦</span>
          </div>
          <div class="modal-item-titulo-info">
            <h3 id="modal-item-nome">${capitalizar(nomeItem)}</h3>
            <div class="modal-item-tags" id="modal-item-tags"></div>
          </div>
        </div>
        <div id="modal-item-corpo">
          <p class="loading" style="padding:1rem;font-size:0.85rem;">Carregando detalhes...</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-item-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-item-overlay') fecharModalItem();
  });
  document.getElementById('modal-item-close').addEventListener('click', fecharModalItem);
  document.addEventListener('keydown', escutarEscItem);

  const det = await obterDetalhesItem(nomeItem);
  if (!det) {
    document.getElementById('modal-item-corpo').innerHTML =
      '<p class="desc-indisponivel">Detalhes não disponíveis para este item.</p>';
    return;
  }

  const nomeExibido = obterNomeItem(item);
  document.getElementById('modal-item-nome').textContent = nomeExibido;

  const grupoItem = obterGrupoItem(nomeItem);
  const nomeGrupo = NOME_GRUPO[grupoItem] || null;
  const categoria = det.categoria ? traduzirCategoria(det.categoria) : null;
  const atributos = det.atributos ? traduzirAtributos(det.atributos) : null;
  const geracao = det.geracao ? `Gen ${det.geracao}` : null;

  document.getElementById('modal-item-tags').innerHTML = `
    ${nomeGrupo ? `<span class="modal-item-tag tag-grupo">${nomeGrupo}</span>` : ''}
    ${categoria ? `<span class="modal-item-tag tag-categoria">${categoria}</span>` : ''}
    ${geracao ? `<span class="modal-item-tag tag-geracao">${geracao}</span>` : ''}
  `;

  let descricao = idiomaItens === 'pt'
    ? (det.descricaoPt || det.descricaoEn)
    : (det.descricaoEn || det.descricaoPt);
  let idiomaDescricao = det.descricaoPt ? 'PT' : (det.descricaoEn ? 'EN' : '—');
  let precisaTraduzirDesc = idiomaItens === 'pt' && !det.descricaoPt && det.descricaoEn;

  let efeito = det.efeito;
  let efeitoEhIngles = !!det.efeito && idiomaItens === 'pt';

  const efeitoLabel = idiomaItens === 'pt' ? '⚡ Efeito' : '⚡ Effect';
  const descricaoLabel = idiomaItens === 'pt' ? '📖 Descrição' : '📖 Description';
  const custoLabel = idiomaItens === 'pt' ? '💰 Custo' : '💰 Cost';
  const atributosLabel = idiomaItens === 'pt' ? '🏷️ Atributos' : '🏷️ Attributes';

  document.getElementById('modal-item-corpo').innerHTML = `
    ${efeito ? `
      <div class="modal-item-secao">
        <h4>${efeitoLabel} <span class="modal-item-idioma" id="efeito-idioma">EN</span></h4>
        <p class="modal-item-efeito" id="modal-efeito">${efeito}</p>
        <div id="efeito-extra"></div>
      </div>
    ` : ''}
    ${descricao ? `
      <div class="modal-item-secao">
        <h4>${descricaoLabel} <span class="modal-item-idioma" id="desc-idioma">${idiomaDescricao}</span></h4>
        <p class="modal-item-descricao" id="modal-desc">${descricao}</p>
        <div id="desc-extra"></div>
      </div>
    ` : ''}
    <div class="modal-item-meta">
      ${det.custo !== null ? `<div class="modal-item-meta-item"><span class="meta-label">${custoLabel}</span><span class="meta-valor">₽${det.custo}</span></div>` : ''}
      ${atributos ? `<div class="modal-item-meta-item"><span class="meta-label">${atributosLabel}</span><span class="meta-valor">${atributos}</span></div>` : ''}
    </div>
  `;

  if (idiomaItens === 'pt' && (precisaTraduzirDesc || efeitoEhIngles)) {
    await tentarTraduzirTudoNoModal(nomeItem);
  }
}

async function tentarTraduzirTudoNoModal(nomeItem) {
  const det = itemDetalhes[nomeItem];
  if (!det) return;

  const descEl = document.getElementById('modal-desc');
  const descIdiomaEl = document.getElementById('desc-idioma');
  const descExtraEl = document.getElementById('desc-extra');

  if (descEl && descIdiomaEl && idiomaItens === 'pt' && !det.descricaoPt && det.descricaoEn) {
    const chave = det.descricaoEn.slice(0, 500);
    const cache = tradDict[chave];

    if (cache) {
      descEl.textContent = cache;
      descIdiomaEl.textContent = 'PT';
      if (descExtraEl) descExtraEl.innerHTML = '';
    } else if (deveTentarTraduzirNovamente(chave)) {
      if (descExtraEl) descExtraEl.innerHTML = '<span class="trad-status trad-loading">🌐 Traduzindo...</span>';
      const traducao = await traduzirEnParaPt(det.descricaoEn);
      if (traducao) {
        det.descricaoPtTraduzida = traducao;
        salvarCacheDetalhes();
        descEl.textContent = traducao;
        descIdiomaEl.textContent = 'PT';
        if (descExtraEl) descExtraEl.innerHTML = '<span class="trad-status trad-ok">✓ traduzido</span>';
      } else {
        if (descExtraEl) {
          descExtraEl.innerHTML = `
            <div class="trad-aviso">
              <span>⚠ Serviço de tradução indisponível (limite diário atingido).</span>
              <button type="button" data-retrad desc>🔄 Tentar</button>
            </div>
          `;
          const btn = descExtraEl.querySelector('button[data-retrad]');
          if (btn) btn.addEventListener('click', () => tentarTraduzirTudoNoModal(nomeItem));
        }
      }
    } else {
      if (descExtraEl) {
        descExtraEl.innerHTML = '<span class="trad-status trad-fail" title="Limite do tradutor atingido. Aguarde alguns minutos.">⚠ sem tradução</span>';
      }
    }
  }

  const efeitoEl = document.getElementById('modal-efeito');
  const efeitoIdiomaEl = document.getElementById('efeito-idioma');
  const efeitoExtraEl = document.getElementById('efeito-extra');

  if (efeitoEl && efeitoIdiomaEl && det.efeito && idiomaItens === 'pt') {
    if (det.efeitoPt) {
      efeitoEl.textContent = det.efeitoPt;
      efeitoIdiomaEl.textContent = 'PT';
      if (efeitoExtraEl) efeitoExtraEl.innerHTML = '';
      return;
    }
    const chave = det.efeito.slice(0, 500);
    const cache = tradDict[chave];
    if (cache) {
      efeitoEl.textContent = cache;
      efeitoIdiomaEl.textContent = 'PT';
      if (efeitoExtraEl) efeitoExtraEl.innerHTML = '';
      return;
    }
    if (deveTentarTraduzirNovamente(chave)) {
      if (efeitoExtraEl) efeitoExtraEl.innerHTML = '<span class="trad-status trad-loading">🌐 Traduzindo...</span>';
      const traducao = await traduzirEnParaPt(det.efeito);
      if (traducao) {
        det.efeitoPt = traducao;
        salvarCacheDetalhes();
        efeitoEl.textContent = traducao;
        efeitoIdiomaEl.textContent = 'PT';
        if (efeitoExtraEl) efeitoExtraEl.innerHTML = '<span class="trad-status trad-ok">✓ traduzido</span>';
      } else {
        if (efeitoExtraEl) {
          efeitoExtraEl.innerHTML = `
            <div class="trad-aviso">
              <span>⚠ Serviço de tradução indisponível (limite diário atingido).</span>
              <button type="button" data-retrad ef>🔄 Tentar</button>
            </div>
          `;
          const btn = efeitoExtraEl.querySelector('button[data-retrad]');
          if (btn) btn.addEventListener('click', () => tentarTraduzirTudoNoModal(nomeItem));
        }
      }
    } else {
      if (efeitoExtraEl) {
        efeitoExtraEl.innerHTML = '<span class="trad-status trad-fail" title="Limite do tradutor atingido. Aguarde alguns minutos.">⚠ sem tradução</span>';
      }
    }
  }
}

function fecharModalItem() {
  document.getElementById('modal-item-container').innerHTML = '';
  document.removeEventListener('keydown', escutarEscItem);
  modalItemAberto = null;
}

function escutarEscItem(e) { if (e.key === 'Escape') fecharModalItem(); }

function renderizarRegioes() {
  const grid = document.getElementById('regioes-grid');
  if (!grid) return;
  grid.innerHTML = '';
  Object.entries(REGIOES).forEach(([gen, reg]) => {
    const card = document.createElement('div');
    card.className = 'regiao-card';
    const estiloMiniatura = `
      background-image: url('mapa-mundo.png');
      background-size: ${reg.zoom}% auto;
      background-position: ${reg.posicaoX}% ${reg.posicaoY}%;
    `;
    card.innerHTML = `
      <div class="regiao-miniatura" style="${estiloMiniatura}"></div>
      <div class="regiao-info">
        <div class="regiao-nome">${reg.nome}</div>
        <div class="regiao-geracao">Gen ${gen}</div>
        <div class="regiao-dex">#${String(reg.inicio).padStart(4, '0')} – #${String(reg.fim).padStart(4, '0')}</div>
      </div>
    `;
    card.addEventListener('click', () => abrirModalRegiao(parseInt(gen)));
    grid.appendChild(card);
  });
}

function renderizarHotspotsMapa() {
  const container = document.querySelector('.mapa-mundi-imagem');
  if (!container) return;
  const antigo = container.querySelector('.mapa-hotspots-overlay');
  if (antigo) antigo.remove();
  const overlay = document.createElement('div');
  overlay.className = 'mapa-hotspots-overlay';
  Object.entries(REGIOES_HOTSPOTS).forEach(([gen, h]) => {
    const reg = REGIOES[gen];
    if (!reg) return;
    const btn = document.createElement('button');
    btn.className = 'mapa-hotspot';
    btn.type = 'button';
    btn.title = `Ver mapa de ${reg.nome}`;
    btn.style.left = (h.x - h.w / 2) + '%';
    btn.style.top = (h.y - h.h / 2) + '%';
    btn.style.width = h.w + '%';
    btn.style.height = h.h + '%';
    btn.innerHTML = `<span class="mapa-hotspot-label">${reg.nome}</span>`;
    btn.addEventListener('click', (e) => { e.stopPropagation(); abrirModalRegiao(parseInt(gen)); });
    overlay.appendChild(btn);
  });
  container.appendChild(overlay);
}

function abrirModalRegiao(geracao) {
  const reg = REGIOES[geracao];
  if (!reg) return;
  const container = document.getElementById('modal-regiao-container');
  const estiloAmpliado = `
    background-size: ${reg.zoom * 1.3}% auto;
    background-position: ${reg.posicaoX}% ${reg.posicaoY}%;
  `;
  const linkBulba = `https://bulbapedia.bulbagarden.net/wiki/${reg.nome}`;
  container.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-regiao-box">
        <button class="modal-close" id="modal-close">✕</button>
        <div class="modal-regiao-titulo">
          <h3>${reg.nome}</h3>
          <span class="modal-geracao">Gen ${geracao}</span>
          <span class="modal-dex">#${String(reg.inicio).padStart(4, '0')} – #${String(reg.fim).padStart(4, '0')}</span>
        </div>
        <div class="modal-regiao-imagem-wrap">
          <div class="modal-regiao-imagem" style="${estiloAmpliado}"></div>
        </div>
        <div class="modal-regiao-acoes">
          <a class="btn-externo btn-bulba" href="${linkBulba}" target="_blank" rel="noopener">📖 Bulbapedia</a>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') fecharModalRegiao();
  });
  document.getElementById('modal-close').addEventListener('click', fecharModalRegiao);
  document.addEventListener('keydown', escutarEscRegiao);
}

function fecharModalRegiao() {
  document.getElementById('modal-regiao-container').innerHTML = '';
  document.removeEventListener('keydown', escutarEscRegiao);
}

function escutarEscRegiao(e) { if (e.key === 'Escape') fecharModalRegiao(); }

function capitalizar(texto) {
  return texto.replace(/-/g, ' ').split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

const CARD_SPECIES_URL = 'https://pokeapi.co/api/v2/pokemon-species';
const CARD_MOVE_URL    = 'https://pokeapi.co/api/v2/move';

const CARTAS_CACHE_KEY    = 'pokedex_cartas_cache_v16';
const EVO_CHAIN_CACHE_KEY = 'pokedex_evo_chain_cache_v16';
const MOVE_DET_CACHE_KEY  = 'pokedex_move_det_cache_v16';

let cartasCarregadas = false;
let todasCartas = [];
let cartasPorId = {};
let evoChainCache = {};
let moveDetCache = {};

const EFETIVIDADE_TIPOS = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

function efetividadeMultipla(tipoAtk, tiposDef) {
  let mult = 1;
  const tab = EFETIVIDADE_TIPOS[tipoAtk] || {};
  tiposDef.forEach(td => { if (tab[td] !== undefined) mult *= tab[td]; });
  return mult;
}

function calcFraquezasResistencias(tipos) {
  const fraquezas = [], resistencias = [], imunidades = [];
  Object.keys(NOMES_TIPOS).forEach(t => {
    const m = efetividadeMultipla(t, tipos);
    if (m === 0) imunidades.push(t);
    else if (m >= 2) fraquezas.push({ tipo: t, mult: m });
    else if (m <= 0.5) resistencias.push({ tipo: t, mult: m });
  });
  return { fraquezas, resistencias, imunidades };
}

function extrairIdUrl(url) {
  const m = url.match(/\/(\d+)\/?$/);
  return m ? parseInt(m[1]) : null;
}

function converterStat(valorBase, isLendario) {
  const max = isLendario ? 10 : 8;
  return Math.max(1, Math.min(max, Math.ceil(valorBase / 20)));
}

function converterDano(poder) {
  if (!poder || poder <= 0) return 0;
  return Math.max(1, Math.min(10, Math.ceil(poder / 20)));
}

function statDoGolpe(classe) {
  if (classe === 'physical') return 'Atq';
  if (classe === 'special') return 'AtqE';
  return '—';
}

function calcularSlotsHabilidades(isLendario, evolucao) {
  if (isLendario) return 3;
  if (!evolucao) return 2;

  const temAnterior = !!evolucao.anterior;
  const temProximo = evolucao.proximo && evolucao.proximo.length > 0;

  if (!temAnterior && !temProximo) return 2;
  if (!temAnterior && temProximo) return 1;
  if (temAnterior && temProximo) return 2;
  if (temAnterior && !temProximo) return 3;
  return 2;
}

function carregarCachesCartas() {
  try {
    const c = localStorage.getItem(CARTAS_CACHE_KEY);
    if (c) {
      const p = JSON.parse(c);
      if (p.timestamp && Date.now() - p.timestamp < CACHE_DURACAO_MS && Array.isArray(p.cartas)) {
        todasCartas = p.cartas;
        cartasPorId = {};
        todasCartas.forEach(x => cartasPorId[x.id] = x);
      }
    }
  } catch (e) {}
  try { evoChainCache = JSON.parse(localStorage.getItem(EVO_CHAIN_CACHE_KEY) || '{}'); } catch (e) { evoChainCache = {}; }
  try { moveDetCache = JSON.parse(localStorage.getItem(MOVE_DET_CACHE_KEY) || '{}'); } catch (e) { moveDetCache = {}; }
}

function salvarCacheCartas() {
  try { localStorage.setItem(CARTAS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), cartas: todasCartas })); } catch (e) {}
}
function salvarCacheEvo()  { try { localStorage.setItem(EVO_CHAIN_CACHE_KEY, JSON.stringify(evoChainCache)); } catch (e) {} }
function salvarCacheMove() { try { localStorage.setItem(MOVE_DET_CACHE_KEY, JSON.stringify(moveDetCache)); } catch (e) {} }

async function buscarDetalhesMove(nome) {
  if (moveDetCache[nome]) return moveDetCache[nome];
  try {
    const r = await fetch(`${CARD_MOVE_URL}/${nome}`);
    if (!r.ok) return null;
    const d = await r.json();

    const danoConv = converterDano(d.power);

    const info = {
      nome: d.name,
      nomeBonito: capitalizar(d.name),
      nomePt: extrairNomeMovePt(d),
      tipo: d.type.name,
      poder: d.power,
      dano: danoConv,
      categoriaUso: calcularCategoriaUso(danoConv),
      pp: d.pp,
      classe: d.damage_class.name,
      classePt: CLASSES_DANO_PT[d.damage_class.name] || d.damage_class.name,
      stat: statDoGolpe(d.damage_class.name),
      efeito: gerarEfeitoMovePt(d)
    };
    moveDetCache[nome] = info;
    return info;
  } catch (e) { return null; }
}

async function buscarCadeiaEvolucao(url) {
  if (evoChainCache[url]) return evoChainCache[url];
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const d = await r.json();
    evoChainCache[url] = d.chain;
    return d.chain;
  } catch (e) { return null; }
}

function encontrarNaCadeia(chain, id) {
  let resultado = null;
  function percorrer(no, anterior) {
    const idNo = extrairIdUrl(no.species.url);
    if (idNo === id) {
      resultado = {
        anterior: anterior ? { id: anterior.id, nome: anterior.nome } : null,
        atual: { id: idNo, nome: no.species.name },
        proximo: no.evolves_to.map(f => ({ id: extrairIdUrl(f.species.url), nome: f.species.name }))
      };
    }
    no.evolves_to.forEach(f => percorrer(f, { id: idNo, nome: no.species.name }));
  }
  percorrer(chain, null);
  return resultado;
}

function listarMovimentosPorNivel(pokemon) {
  const porNivel = [];
  const vistos = new Set();
  pokemon.moves.forEach(m => {
    const temNivel = m.version_group_details.some(d => d.move_learn_method.name === 'level-up');
    if (temNivel && !vistos.has(m.move.name)) {
      vistos.add(m.move.name);
      const niveis = m.version_group_details
        .filter(d => d.move_learn_method.name === 'level-up')
        .map(d => d.level_learned_at);
      porNivel.push({ nome: m.move.name, nivel: Math.min(...niveis) });
    }
  });
  porNivel.sort((a, b) => a.nivel - b.nivel);
  return porNivel;
}

/* =========================================================
   Escolha CANÔNICA (Cartas Pokédex) — sem randomização
   ========================================================= */
function selecionarCandidatos(porNivel) {
  const total = porNivel.length;
  if (total <= MAX_CANDIDATOS_MOVES) return [...porNivel];

  const indices = new Set();
  for (let i = 0; i < 4 && i < total; i++) indices.add(i);
  for (let i = 1; i <= 6; i++) indices.add(Math.floor((total - 1) * i / 7));
  for (let i = 1; i <= 4 && total - i >= 0; i++) indices.add(total - i);

  return [...indices].sort((a, b) => a - b).map(i => porNivel[i]);
}

async function escolherMovimentosBalanceados(pokemon) {
  const porNivel = listarMovimentosPorNivel(pokemon);
  if (porNivel.length === 0) return [];

  const candidatos = selecionarCandidatos(porNivel);

  const detalhes = (await Promise.all(candidatos.map(m => buscarDetalhesMove(m.nome))))
    .map((d, i) => d ? { ...d, nivel: candidatos[i].nivel } : null)
    .filter(d => d !== null);

  if (detalhes.length === 0) return [];

  return escolherDeDetalhes(detalhes);
}

/* =========================================================
   Escolha ALEATÓRIA (Deck) — randomiza dentro de cada pool
   ========================================================= */
async function sortearMovimentosAleatorios(carta) {
  const nomes = carta._moveNomes || [];
  if (nomes.length === 0) return carta.movimentos || [];

  const embaralhados = embaralhar(nomes);
  const qtd = Math.min(MAX_CANDIDATOS_MOVES, embaralhados.length);
  const candidatos = embaralhados.slice(0, qtd);

  const detalhes = (await Promise.all(candidatos.map(n => buscarDetalhesMove(n))))
    .filter(d => d !== null);

  if (detalhes.length === 0) return carta.movimentos || [];

  return escolherDeDetalhes(detalhes, true);
}

/* =========================================================
   Núcleo comum: escolhe 4 moves com regras de balanceamento
   randomizar = true → embaralha dentro de cada categoria
   ========================================================= */
function escolherDeDetalhes(detalhes, randomizar = false) {
  let atWillAtaque = detalhes.filter(d => d.categoriaUso === 'at-will' && d.classe !== 'status' && d.dano > 0);
  let atWillStatus = detalhes.filter(d => d.categoriaUso === 'at-will' && (d.classe === 'status' || d.dano === 0));
  let eot          = detalhes.filter(d => d.categoriaUso === 'eot');
  let unico        = detalhes.filter(d => d.categoriaUso === 'unico');

  if (randomizar) {
    atWillAtaque = embaralhar(atWillAtaque);
    atWillStatus = embaralhar(atWillStatus);
    eot          = embaralhar(eot);
    unico        = embaralhar(unico);
  } else {
    atWillAtaque.sort((a, b) => a.nivel - b.nivel);
    atWillStatus.sort((a, b) => a.nivel - b.nivel);
    eot.sort((a, b) => a.nivel - b.nivel);
    unico.sort((a, b) => a.nivel - b.nivel);
  }

  const escolhidos = [];
  const usados = new Set();

  function add(m) {
    if (m && !usados.has(m.nome) && escolhidos.length < 4) {
      escolhidos.push(m);
      usados.add(m.nome);
      return true;
    }
    return false;
  }

  // 1) atk at-will (fallback: status)
  if (atWillAtaque.length > 0) add(atWillAtaque[0]);
  else if (atWillStatus.length > 0) add(atWillStatus[0]);

  // 2) eot
  if (eot.length > 0) add(eot[0]);

  // 3) único
  if (unico.length > 0) add(unico[0]);

  // 4) coringa
  let pool4 = [
    ...eot.slice(1),
    ...atWillAtaque.slice(1),
    ...unico.slice(1),
    ...atWillStatus.slice(1)
  ];
  if (randomizar) pool4 = embaralhar(pool4);

  for (const d of pool4) {
    if (escolhidos.length >= 4) break;
    if (d.categoriaUso === 'unico') {
      const totalUnicos = escolhidos.filter(e => e.categoriaUso === 'unico').length;
      if (totalUnicos >= MAX_UNICOS_POR_CARTA) continue;
    }
    add(d);
  }

  // Fallback
  if (escolhidos.length < 4) {
    let restantes = detalhes.filter(d => !usados.has(d.nome));
    if (randomizar) restantes = embaralhar(restantes);
    for (const d of restantes) {
      if (escolhidos.length >= 4) break;
      add(d);
    }
  }

  // Ordena por nível (mas no caso random, embaralha leve mantendo at-will primeiro)
  if (randomizar) {
    const ordem = { 'at-will': 0, 'eot': 1, 'unico': 2 };
    escolhidos.sort((a, b) => {
      const oa = ordem[a.categoriaUso] ?? 3;
      const ob = ordem[b.categoriaUso] ?? 3;
      if (oa !== ob) return oa - ob;
      return a.nivel - b.nivel;
    });
  } else {
    escolhidos.sort((a, b) => a.nivel - b.nivel);
  }

  return escolhidos;
}

function completarHabilidadesLendario(habilidades, tipos, slotsDesejados) {
  const nomesExistentes = new Set(habilidades.map(h => h.nome));
  const tipoPrincipal = tipos[0];
  const temaTipo = HABS_LENDARIAS_POR_TIPO[tipoPrincipal];

  if (temaTipo && !nomesExistentes.has(temaTipo.nome) && habilidades.length < slotsDesejados) {
    habilidades.push({ ...temaTipo, isHidden: false, isHomebrew: true });
    nomesExistentes.add(temaTipo.nome);
  }

  let idx = 0;
  while (habilidades.length < slotsDesejados && idx < HABS_LENDARIAS_GENERICAS.length) {
    const gen = HABS_LENDARIAS_GENERICAS[idx++];
    if (!nomesExistentes.has(gen.nome)) {
      habilidades.push({ ...gen, isHidden: false, isHomebrew: true });
      nomesExistentes.add(gen.nome);
    }
  }

  return habilidades;
}

async function buscarCartaCompleta(id) {
  try {
    const [pRes, sRes] = await Promise.all([
      fetch(`${API_URL}/${id}`),
      fetch(`${CARD_SPECIES_URL}/${id}`)
    ]);
    if (!pRes.ok || !sRes.ok) return null;
    const p = await pRes.json();
    const s = await sRes.json();

    const tipos = p.types.map(t => t.type.name);
    const sb = {};
    p.stats.forEach(st => { sb[st.stat.name] = st.base_stat; });
    const isLendario = !!(s.is_legendary || s.is_mythical);

    // Lista COMPLETA de moves level-up (só nomes, pra economizar espaço)
    const porNivelCompleto = listarMovimentosPorNivel(p);
    const _moveNomes = porNivelCompleto.map(m => m.nome);

    const movsDet = await escolherMovimentosBalanceados(p);

    let evolucao = null;
    if (s.evolution_chain?.url) {
      const chain = await buscarCadeiaEvolucao(s.evolution_chain.url);
      if (chain) evolucao = encontrarNaCadeia(chain, id);
    }

    const slotsHab = calcularSlotsHabilidades(isLendario, evolucao);
    const todasHabs = (p.abilities || [])
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map(a => ({
        nome: a.ability.name,
        nomeBonito: capitalizar(a.ability.name),
        isHidden: a.is_hidden,
        descricao: DESCRICOES_HABILIDADES[a.ability.name] || 'Habilidade especial deste Pokémon.'
      }));

    let habilidades = todasHabs.slice(0, slotsHab);

    if (isLendario && habilidades.length < 3) {
      habilidades = completarHabilidadesLendario(habilidades, tipos, 3);
    }

    const hpConvertido = converterStat(sb.hp, isLendario);

    return {
      id: p.id, nome: p.name, tipos,
      sprite: p.sprites.other['official-artwork'].front_default || p.sprites.front_default,
      hp: hpConvertido * HP_MULT + HP_BASE,
      ataque: converterStat(sb.attack, isLendario),
      defesa: converterStat(sb.defense, isLendario),
      ataqueEspecial: converterStat(sb['special-attack'], isLendario),
      defesaEspecial: converterStat(sb['special-defense'], isLendario),
      velocidade: converterStat(sb.speed, isLendario),
      statsBrutos: sb,
      movimentos: movsDet,
      _moveNomes,
      efetividade: calcFraquezasResistencias(tipos),
      evolucao,
      habilidades,
      slotsHabilidades: slotsHab,
      totalHabilidadesAPI: todasHabs.length,
      isLendario,
      dado: isLendario ? '2d6' : '1d6'
    };
  } catch (e) { return null; }
}

async function carregarCartas() {
  if (cartasCarregadas) return;

  const loading = document.getElementById('loading-cartas');
  const grid = document.getElementById('cartas-grid');
  if (!loading || !grid) return;

  carregarCachesCartas();

  if (todasCartas.length >= TOTAL_POKEMON) {
    cartasCarregadas = true;
    loading.style.display = 'none';
    todasCartas.sort((a, b) => a.id - b.id);
    renderizarCartas(todasCartas);
    return;
  }

  cartasCarregadas = true;
  todasCartas = [];
  cartasPorId = {};
  grid.innerHTML = '';
  loading.style.display = 'block';
  loading.textContent = `🎴 Carregando cartas... 0/${TOTAL_POKEMON}`;

  const ids = Array.from({ length: TOTAL_POKEMON }, (_, i) => i + 1);
  let completos = 0;
  let nextIdx = 0;
  let contadorSalvar = 0;
  const CONC = 40;

  async function worker() {
    while (true) {
      const idx = nextIdx++;
      if (idx >= ids.length) break;
      const id = ids[idx];
      const carta = await buscarCartaCompleta(id);
      if (carta) {
        todasCartas.push(carta);
        cartasPorId[carta.id] = carta;
        grid.appendChild(criarCarta(carta));
        completos++;
        if (completos % 5 === 0) {
          loading.textContent = `🎴 Carregando cartas... ${completos}/${TOTAL_POKEMON}`;
        }
        contadorSalvar++;
        if (contadorSalvar % 150 === 0) {
          salvarCacheEvo(); salvarCacheMove();
        }
      }
    }
  }

  await Promise.all(Array.from({ length: CONC }, () => worker()));

  salvarCacheCartas(); salvarCacheEvo(); salvarCacheMove();
  todasCartas.sort((a, b) => a.id - b.id);
  renderizarCartas(todasCartas);
  loading.style.display = 'none';
}

function classeStatPct(valor, isLendario, isHP) {
  const max = isLendario ? 10 : 8;
  if (isHP) {
    const maxHP = max * HP_MULT + HP_BASE;
    return Math.min((valor / maxHP) * 100, 100);
  }
  return Math.min((valor / max) * 100, 100);
}

function tiposEfetBadges(lista) {
  if (!lista || lista.length === 0) return '<span class="carta-efet-nenhum">—</span>';
  return lista.map(({ tipo, mult }) => {
    const nome = NOMES_TIPOS[tipo] || tipo;
    const tag = mult === 4 ? '4×' : mult === 2 ? '2×' : mult === 0.5 ? '½' : mult === 0.25 ? '¼' : '';
    return `<span class="tipo tipo-${tipo} carta-efet-tipo">${nome}${tag ? ` <b>${tag}</b>` : ''}</span>`;
  }).join('');
}

function renderizarCartas(lista) {
  const grid = document.getElementById('cartas-grid');
  grid.innerHTML = '';
  if (lista.length === 0) {
    grid.innerHTML = '<p class="loading" style="grid-column:1/-1;">Nenhuma carta encontrada.</p>';
    return;
  }
  const frag = document.createDocumentFragment();
  const CHUNK = 30;
  for (let i = 0; i < lista.length; i += CHUNK) {
    lista.slice(i, i + CHUNK).forEach(c => frag.appendChild(criarCarta(c)));
  }
  grid.appendChild(frag);
}

/* =========================================================
   GERA HTML DA CARTA (usado na Cartas E no modal do Deck)
   ========================================================= */
function gerarHTMLCarta(c, opts = {}) {
  const { mostrarPosicao = false, posicao = null } = opts;
  const numero = String(c.id).padStart(4, '0');
  const tiposHTML = c.tipos.map(t =>
    `<span class="tipo tipo-${t}">${NOMES_TIPOS[t] || t}</span>`
  ).join('');

  const movsHTML = c.movimentos.map(m => {
    const danoTxt = m.dano > 0 ? `⚔ ${m.dano}` : '—';
    const statTxt = m.stat === '—' ? '—' : m.stat;
    const efeitoHTML = m.efeito ? `<p class="carta-mov-efeito">${m.efeito}</p>` : '';
    const statusClasse = m.classe === 'status' ? 'carta-mov-status' : '';

    const uso = m.categoriaUso || 'at-will';
    const usoLabel = uso === 'at-will' ? '∞' : (uso === 'eot' ? '🔄' : '1×');
    const usoTooltip = uso === 'at-will'
      ? 'At-will — pode usar todo turno'
      : uso === 'eot'
        ? 'EoT — depois de usar, espere 1 turno'
        : 'Uso único — apenas uma vez por batalha';

    return `
      <div class="carta-mov ${statusClasse}">
        <div class="carta-mov-topo">
          <span class="tipo tipo-${m.tipo} carta-mov-tipo">${NOMES_TIPOS[m.tipo] || m.tipo}</span>
          <span class="carta-mov-nome">${m.nomePt}</span>
        </div>
        <div class="carta-mov-linha2">
          <span class="carta-mov-dano" title="Dano do golpe">${danoTxt}</span>
          <span class="carta-mov-stat" title="Atributo usado na rolagem">${statTxt}</span>
          <span class="carta-mov-classe">${m.classePt}</span>
          <span class="carta-mov-uso carta-mov-uso-${uso}" title="${usoTooltip}">${usoLabel}</span>
        </div>
        ${efeitoHTML}
      </div>
    `;
  }).join('');

  const habsHTML = (c.habilidades || []).map(h => `
    <div class="carta-hab${h.isHomebrew ? ' carta-hab-homebrew' : ''}">
      <div class="carta-hab-cabecalho">
        <span class="carta-hab-icone">◆</span>
        <span class="carta-hab-nome">${h.nomeBonito}</span>
      </div>
      <p class="carta-hab-desc">${h.descricao}</p>
    </div>
  `).join('');

  const totalSlots = c.slotsHabilidades || (c.habilidades || []).length;
  const totalExibidas = (c.habilidades || []).length;
  const contadorHab = `${totalExibidas}/${totalSlots}`;

  const evo = c.evolucao;
  let evoHTML = '<span class="carta-evo-sem">Não evolui</span>';
  if (evo && (evo.anterior || evo.proximo.length > 0)) {
    const partes = [];
    if (evo.anterior) partes.push(`<span class="carta-evo-item anterior">${capitalizar(evo.anterior.nome)}</span>`);
    partes.push(`<span class="carta-evo-item atual">${capitalizar(evo.atual.nome)}</span>`);
    if (evo.proximo.length > 0) {
      evo.proximo.forEach(p => partes.push(`<span class="carta-evo-item proximo">${capitalizar(p.nome)}</span>`));
    }
    evoHTML = partes.join('<span class="carta-evo-seta">→</span>');
  }

  const maxStat = c.isLendario ? 10 : 8;
  const maxHP = maxStat * HP_MULT + HP_BASE;
  const minHP = 1 * HP_MULT + HP_BASE;

  const numeroDisplay = mostrarPosicao && posicao
    ? `🎲 #${posicao} — Nº ${numero}`
    : `Nº ${numero}`;

  return `
    <div class="carta-cabecalho">
      <span class="carta-numero">${numeroDisplay}</span>
      <span class="carta-dado ${c.isLendario ? 'carta-dado-lendario' : ''}" title="Dados usados em batalha">
        <span class="carta-dado-icone">${c.isLendario ? '🎲🎲' : '🎲'}</span>
        <span>${c.dado}</span>
      </span>
    </div>
    <div class="carta-imagem-wrap">
      ${c.isLendario ? '<span class="carta-badge-lendario">★ LENDÁRIO</span>' : ''}
      <img class="carta-imagem" src="${c.sprite}" alt="${capitalizar(c.nome)}" loading="lazy">
    </div>
    <div class="carta-identidade">
      <h3 class="carta-nome">${capitalizar(c.nome)}</h3>
      <div class="carta-tipos">${tiposHTML}</div>
    </div>

    <div class="carta-secao carta-secao-hab">
      <div class="carta-secao-titulo">Habilidades <span class="carta-hab-contador">${contadorHab}</span></div>
      <div class="carta-habilidades">${habsHTML}</div>
    </div>

    <div class="carta-secao">
      <div class="carta-secao-titulo">Estatísticas <span class="carta-stat-escala">HP ${minHP}–${maxHP} · outros 1–${maxStat}</span></div>
      <div class="carta-stats">
        <div class="carta-stat"><span class="carta-stat-label">HP</span><div class="carta-stat-bar"><div style="width:${classeStatPct(c.hp, c.isLendario, true)}%"></div></div><span class="carta-stat-valor">${c.hp}</span></div>
        <div class="carta-stat"><span class="carta-stat-label">Atq</span><div class="carta-stat-bar"><div style="width:${classeStatPct(c.ataque, c.isLendario)}%"></div></div><span class="carta-stat-valor">${c.ataque}</span></div>
        <div class="carta-stat"><span class="carta-stat-label">Def</span><div class="carta-stat-bar"><div style="width:${classeStatPct(c.defesa, c.isLendario)}%"></div></div><span class="carta-stat-valor">${c.defesa}</span></div>
        <div class="carta-stat"><span class="carta-stat-label">AtqE</span><div class="carta-stat-bar"><div style="width:${classeStatPct(c.ataqueEspecial, c.isLendario)}%"></div></div><span class="carta-stat-valor">${c.ataqueEspecial}</span></div>
        <div class="carta-stat"><span class="carta-stat-label">DefE</span><div class="carta-stat-bar"><div style="width:${classeStatPct(c.defesaEspecial, c.isLendario)}%"></div></div><span class="carta-stat-valor">${c.defesaEspecial}</span></div>
        <div class="carta-stat"><span class="carta-stat-label">Vel</span><div class="carta-stat-bar"><div style="width:${classeStatPct(c.velocidade, c.isLendario)}%"></div></div><span class="carta-stat-valor">${c.velocidade}</span></div>
      </div>
    </div>

    <div class="carta-secao">
      <div class="carta-secao-titulo">
        Golpes
        <span class="carta-mov-legenda">1 ação/turno</span>
      </div>
      <div class="carta-movimentos">${movsHTML}</div>
    </div>

    <div class="carta-secao">
      <div class="carta-secao-titulo">Efetividade</div>
      <div class="carta-efet">
        <div class="carta-efet-linha"><span class="carta-efet-label">Fraco</span><div class="carta-efet-tags">${tiposEfetBadges(c.efetividade.fraquezas)}</div></div>
        <div class="carta-efet-linha"><span class="carta-efet-label">Resiste</span><div class="carta-efet-tags">${tiposEfetBadges(c.efetividade.resistencias)}</div></div>
        <div class="carta-efet-linha"><span class="carta-efet-label">Imune</span><div class="carta-efet-tags">${tiposEfetBadges(c.efetividade.imunidades)}</div></div>
      </div>
    </div>

    <div class="carta-secao carta-secao-evo">
      <div class="carta-secao-titulo">Evolução</div>
      <div class="carta-evo-cadeia">${evoHTML}</div>
    </div>
  `;
}

function criarCarta(c) {
  const el = document.createElement('div');
  el.className = 'carta-pokemon' + (c.isLendario ? ' carta-lendaria' : '');
  el.dataset.id = c.id;
  el.dataset.lendario = c.isLendario ? 'true' : 'false';
  el.dataset.nome = c.nome;
  el.innerHTML = gerarHTMLCarta(c);
  return el;
}

function configurarFiltrosCartas() {
  const busca = document.getElementById('filtro-carta-busca');
  const raridade = document.getElementById('filtro-carta-raridade');
  if (!busca || !raridade) return;
  busca.addEventListener('input', aplicarFiltrosCartas);
  raridade.addEventListener('change', aplicarFiltrosCartas);

  const tabCartas = document.querySelector('[data-aba="cartas"]');
  if (tabCartas) {
    tabCartas.addEventListener('click', () => {
      if (!cartasCarregadas) iniciarCarregamentoCartas();
    });
  }
}

function aplicarFiltrosCartas() {
  if (!cartasCarregadas) return;
  const busca = (document.getElementById('filtro-carta-busca')?.value || '').toLowerCase().trim();
  const raridade = document.getElementById('filtro-carta-raridade')?.value || 'todas';

  const filtradas = todasCartas.filter(c => {
    if (busca && !c.nome.toLowerCase().includes(busca)) return false;
    if (raridade === 'lendarias' && !c.isLendario) return false;
    if (raridade === 'comuns' && c.isLendario) return false;
    return true;
  });

  filtradas.sort((a, b) => a.id - b.id);
  renderizarCartas(filtradas);
}

/* =========================================================
   DECK ALEATÓRIO (com movesets únicos por sorteio)
   ========================================================= */
const DECK_TAMANHO = 6;
const DECK_MAX_LENDARIOS = 1;
const DECK_CACHE_KEY = 'pokedex_deck_atual_v3';
const DECK_GERACAO_KEY = 'pokedex_deck_geracao_v2';

function configurarDeck() {
  const btnSortear = document.getElementById('btn-sortear-deck');
  const btnLimpar  = document.getElementById('btn-limpar-deck');
  const selectGeracao = document.getElementById('deck-geracao');
  if (!btnSortear || !btnLimpar) return;

  if (selectGeracao && selectGeracao.options.length <= 1) {
    Object.entries(REGIOES).forEach(([id, reg]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = `Gen ${id} - ${reg.nome}`;
      selectGeracao.appendChild(opt);
    });

    const salva = localStorage.getItem(DECK_GERACAO_KEY);
    if (salva) selectGeracao.value = salva;

    selectGeracao.addEventListener('change', () => {
      localStorage.setItem(DECK_GERACAO_KEY, selectGeracao.value);
    });
  }

  btnSortear.addEventListener('click', sortearDeck);
  btnLimpar.addEventListener('click', limparDeck);

  restaurarDeckSalvo();
}

function restaurarDeckSalvo() {
  try {
    const bruto = localStorage.getItem(DECK_CACHE_KEY);
    if (!bruto) return;
    const enxuto = JSON.parse(bruto);
    if (!Array.isArray(enxuto) || enxuto.length === 0) return;

    const tentar = setInterval(() => {
      if (cartasCarregadas && todasCartas.length > 0) {
        clearInterval(tentar);
        const deck = enxuto
          .map(e => {
            const base = cartasPorId[e.id];
            if (!base) return null;
            return { ...base, movimentos: e.movimentos || base.movimentos };
          })
          .filter(Boolean);
        if (deck.length > 0) renderizarDeck(deck);
      }
    }, 300);

    setTimeout(() => clearInterval(tentar), 60000);
  } catch (e) {}
}

function obterPokemonBase(geracao) {
  const base = todasCartas.filter(c => !c.evolucao || !c.evolucao.anterior);
  if (!geracao) return base;
  const reg = REGIOES[geracao];
  if (!reg) return base;
  return base.filter(c => c.id >= reg.inicio && c.id <= reg.fim);
}

function sortearAleatorioSemRepetir(arr, qtd, idsUsados) {
  const disponiveis = arr.filter(c => !idsUsados.has(c.id));
  const sorteados = [];
  while (sorteados.length < qtd && disponiveis.length > 0) {
    const idx = Math.floor(Math.random() * disponiveis.length);
    const escolhido = disponiveis[idx];
    sorteados.push(escolhido);
    idsUsados.add(escolhido.id);
    disponiveis.splice(idx, 1);
  }
  return sorteados;
}

async function sortearDeck() {
  const info = document.getElementById('deck-info');
  const btn = document.getElementById('btn-sortear-deck');
  const selectGeracao = document.getElementById('deck-geracao');
  const geracao = selectGeracao ? selectGeracao.value : '';

  if (!cartasCarregadas || todasCartas.length < TOTAL_POKEMON) {
    if (info) info.textContent = '⏳ Carregando cartas... aguarde (primeira vez demora um pouco).';
    if (btn) btn.disabled = true;
    try {
      await iniciarCarregamentoCartas();
    } catch (e) {}
    if (btn) btn.disabled = false;
  }

  const base = obterPokemonBase(geracao);
  if (base.length === 0) {
    if (info) {
      info.innerHTML = `<span class="deck-info-vazio">⚠ Não há Pokémon base suficientes ${
        geracao ? `na ${REGIOES[geracao].nome}` : 'no catálogo'
      }.</span>`;
    }
    return;
  }

  if (base.length < DECK_TAMANHO) {
    if (info) {
      info.innerHTML = `<span class="deck-info-vazio">⚠ Só existem ${base.length} Pokémon base ${
        geracao ? `na ${REGIOES[geracao].nome}` : ''
      }. Escolha outra geração ou "Todas".</span>`;
    }
    return;
  }

  const naoLendarios = base.filter(c => !c.isLendario);
  const lendarios    = base.filter(c =>  c.isLendario);

  const idsUsados = new Set();

  const querLendario = lendarios.length > 0 && Math.random() < 0.5;
  const qtdLendarios = querLendario ? Math.min(DECK_MAX_LENDARIOS, DECK_TAMANHO) : 0;
  const qtdNormais   = DECK_TAMANHO - qtdLendarios;

  const normaisSorteados = sortearAleatorioSemRepetir(naoLendarios, qtdNormais, idsUsados);
  const lendariosSorteados = qtdLendarios > 0
    ? sortearAleatorioSemRepetir(lendarios, qtdLendarios, idsUsados)
    : [];

  let deck = [...normaisSorteados, ...lendariosSorteados];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  if (info) info.innerHTML = '<span class="deck-info-tag">🎲 Sorteando movesets...</span>';
  if (btn) btn.disabled = true;

  // Sorteia movimentos únicos pra cada Pokemon
  const deckFinal = await Promise.all(
    deck.map(async (c) => {
      try {
        const movimentos = await sortearMovimentosAleatorios(c);
        return { ...c, movimentos };
      } catch (e) {
        return c;
      }
    })
  );

  if (btn) btn.disabled = false;

  salvarDeck(deckFinal);
  renderizarDeck(deckFinal);
}

function limparDeck() {
  try { localStorage.removeItem(DECK_CACHE_KEY); } catch (e) {}
  const grid = document.getElementById('deck-grid');
  const info = document.getElementById('deck-info');
  if (grid) grid.innerHTML = '';
  if (info) {
    info.innerHTML = '<span class="deck-info-vazio">Nenhum deck sorteado ainda. Clique em <b>🎲 Sortear Deck</b> pra começar.</span>';
  }
}

function salvarDeck(deck) {
  try {
    const enxuto = deck.map(c => ({
      id: c.id,
      movimentos: c.movimentos
    }));
    localStorage.setItem(DECK_CACHE_KEY, JSON.stringify(enxuto));
  } catch (e) {}
}

function renderizarDeck(deck) {
  const grid = document.getElementById('deck-grid');
  const info = document.getElementById('deck-info');
  if (!grid) return;

  grid.innerHTML = '';

  const totalLendarios = deck.filter(c => c.isLendario).length;
  const selectGeracao = document.getElementById('deck-geracao');
  const geracaoNome = selectGeracao && selectGeracao.value
    ? REGIOES[selectGeracao.value]?.nome
    : null;

  if (info) {
    info.innerHTML = `
      <span class="deck-info-tag">🎴 ${deck.length} Pokémon</span>
      ${geracaoNome ? `<span class="deck-info-tag">Gen ${selectGeracao.value} · ${geracaoNome}</span>` : '<span class="deck-info-tag">Todas as gerações</span>'}
      <span class="deck-info-tag">${totalLendarios} lendário${totalLendarios === 1 ? '' : 's'}</span>
      <span class="deck-info-dica">Clique numa carta pra ver os golpes sorteados</span>
    `;
  }

  const frag = document.createDocumentFragment();
  deck.forEach((c, i) => frag.appendChild(criarCardDeck(c, i + 1)));
  grid.appendChild(frag);
}

function criarCardDeck(c, posicao) {
  const card = document.createElement('div');
  card.className = 'deck-card' + (c.isLendario ? ' deck-card-lendario' : '');
  card.dataset.id = c.id;
  card.dataset.posicao = posicao;

  const tiposHTML = c.tipos.map(t =>
    `<span class="tipo tipo-${t} deck-card-tipo">${NOMES_TIPOS[t] || t}</span>`
  ).join('');

  card.innerHTML = `
    <div class="deck-card-posicao">#${posicao}</div>
    ${c.isLendario ? '<div class="deck-card-estrela">★</div>' : ''}
    <div class="deck-card-imagem-wrap">
      <img class="deck-card-imagem" src="${c.sprite}" alt="${capitalizar(c.nome)}" loading="lazy">
    </div>
    <div class="deck-card-nome">${capitalizar(c.nome)}</div>
    <div class="deck-card-tipos">${tiposHTML}</div>
    <div class="deck-card-stats">
      <div class="deck-card-stat"><span class="deck-card-stat-label">HP</span><span class="deck-card-stat-valor hp">${c.hp}</span></div>
      <div class="deck-card-stat"><span class="deck-card-stat-label">Atq</span><span class="deck-card-stat-valor">${c.ataque}</span></div>
      <div class="deck-card-stat"><span class="deck-card-stat-label">Def</span><span class="deck-card-stat-valor">${c.defesa}</span></div>
      <div class="deck-card-stat"><span class="deck-card-stat-label">AtqE</span><span class="deck-card-stat-valor">${c.ataqueEspecial}</span></div>
      <div class="deck-card-stat"><span class="deck-card-stat-label">DefE</span><span class="deck-card-stat-valor">${c.defesaEspecial}</span></div>
      <div class="deck-card-stat"><span class="deck-card-stat-label">Vel</span><span class="deck-card-stat-valor">${c.velocidade}</span></div>
    </div>
    <div class="deck-card-dado">${c.isLendario ? '🎲🎲 2d6' : '🎲 1d6'}</div>
    <div class="deck-card-ver">🎲 Ver golpes</div>
  `;

  card.addEventListener('click', () => abrirModalCartaDeck(c, posicao));

  return card;
}

/* =========================================================
   MODAL DA CARTA DO DECK
   ========================================================= */
function abrirModalCartaDeck(c, posicao) {
  const container = document.getElementById('modal-item-container');
  if (!container) return;

  const html = gerarHTMLCarta(c, { mostrarPosicao: true, posicao });

  container.innerHTML = `
    <div class="modal-overlay" id="modal-carta-overlay">
      <div class="modal-carta-deck-box">
        <button class="modal-close" id="modal-carta-close">✕</button>
        <div class="carta-pokemon${c.isLendario ? ' carta-lendaria' : ''}">
          ${html}
        </div>
        <div class="modal-carta-deck-rodape">
          <a href="detalhes.html?id=${c.id}" target="_blank" rel="noopener" class="btn-externo btn-bulba">
            🔍 Ver página completa do Pokémon
          </a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-carta-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-carta-overlay') fecharModalCartaDeck();
  });
  document.getElementById('modal-carta-close').addEventListener('click', fecharModalCartaDeck);
  document.addEventListener('keydown', escutarEscCartaDeck);
}

function fecharModalCartaDeck() {
  const container = document.getElementById('modal-item-container');
  if (container) container.innerHTML = '';
  document.removeEventListener('keydown', escutarEscCartaDeck);
}

function escutarEscCartaDeck(e) {
  if (e.key === 'Escape') fecharModalCartaDeck();
}