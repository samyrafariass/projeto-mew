const API_URL = 'https://pokeapi.co/api/v2/pokemon';
const MOVE_URL = 'https://pokeapi.co/api/v2/move';
const ABILITY_URL = 'https://pokeapi.co/api/v2/ability';
const ENCOUNTER_URL = 'https://pokeapi.co/api/v2/pokemon';
const SPECIES_URL = 'https://pokeapi.co/api/v2/pokemon-species';
const ARTWORK = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';
const SPRITE  = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const CRY_URL = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest';

const NOMES_STATS = {
  hp: 'HP', attack: 'Ataque', defense: 'Defesa',
  'special-attack': 'Atq. Esp.', 'special-defense': 'Def. Esp.', speed: 'Velocidade'
};

const NOMES_TIPOS = {
  normal: 'Normal', fire: 'Fogo', water: 'Água', electric: 'Elétrico',
  grass: 'Planta', ice: 'Gelo', fighting: 'Lutador', poison: 'Venenoso',
  ground: 'Terra', flying: 'Voador', psychic: 'Psíquico', bug: 'Inseto',
  rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão', dark: 'Sombrio',
  steel: 'Aço', fairy: 'Fada'
};

const CLASSES_DANO = { physical: 'Físico', special: 'Especial', status: 'Status' };

/* =========================================================
   MAPEAMENTO: VERSÃO DO JOGO → GERAÇÃO
   ========================================================= */
const VERSAO_PARA_GERACAO = {
  // Gen 1
  'red': 1, 'blue': 1, 'yellow': 1, 'green': 1,
  // Gen 2
  'gold': 2, 'silver': 2, 'crystal': 2,
  // Gen 3
  'ruby': 3, 'sapphire': 3, 'emerald': 3,
  'firered': 3, 'leafgreen': 3, 'colosseum': 3, 'xd': 3,
  // Gen 4
  'diamond': 4, 'pearl': 4, 'platinum': 4,
  'heartgold': 4, 'soulsilver': 4,
  // Gen 5
  'black': 5, 'white': 5, 'black-2': 5, 'white-2': 5,
  // Gen 6
  'x': 6, 'y': 6, 'omega-ruby': 6, 'alpha-sapphire': 6,
  // Gen 7
  'sun': 7, 'moon': 7, 'ultra-sun': 7, 'ultra-moon': 7,
  'lets-go-pikachu': 7, 'lets-go-eevee': 7,
  // Gen 8
  'sword': 8, 'shield': 8,
  'brilliant-diamond': 8, 'shining-pearl': 8, 'legends-arceus': 8,
  // Gen 9
  'scarlet': 9, 'violet': 9
};

const NOME_GERACAO = {
  1: 'Kanto', 2: 'Johto', 3: 'Hoenn', 4: 'Sinnoh', 5: 'Unova',
  6: 'Kalos', 7: 'Alola', 8: 'Galar', 9: 'Paldea'
};

/* =========================================================
   REGIÕES
   ========================================================= */
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

const PREFIXO_REGIAO = {
  1: 'kanto-', 2: 'johto-', 3: 'hoenn-', 4: 'sinnoh-', 5: 'unova-',
  6: 'kalos-', 7: 'alola-', 8: 'galar-', 9: 'paldea-'
};

function obterRegiao(pokemonId) {
  for (const [gen, reg] of Object.entries(REGIOES)) {
    if (pokemonId >= reg.inicio && pokemonId <= reg.fim) {
      return { geracao: parseInt(gen), ...reg };
    }
  }
  return null;
}

/* =========================================================
   COORDENADAS DAS ROTAS DE KANTO
   ========================================================= */
const COORDENADAS_KANTO = {
  'kanto-route-1':  { x: 19,  y: 78 }, 'kanto-route-2':  { x: 22,  y: 50 },
  'kanto-route-3':  { x: 32,  y: 19 }, 'kanto-route-4':  { x: 47,  y: 19 },
  'kanto-route-5':  { x: 51,  y: 35 }, 'kanto-route-6':  { x: 53,  y: 56 },
  'kanto-route-7':  { x: 44,  y: 50 }, 'kanto-route-8':  { x: 65,  y: 44 },
  'kanto-route-9':  { x: 68,  y: 26 }, 'kanto-route-10': { x: 82,  y: 34 },
  'kanto-route-11': { x: 64,  y: 66 }, 'kanto-route-12': { x: 74,  y: 62 },
  'kanto-route-13': { x: 72,  y: 76 }, 'kanto-route-14': { x: 62,  y: 79 },
  'kanto-route-15': { x: 50,  y: 79 }, 'kanto-route-16': { x: 30,  y: 52 },
  'kanto-route-17': { x: 24,  y: 62 }, 'kanto-route-18': { x: 34,  y: 74 },
  'kanto-route-19': { x: 65,  y: 86 }, 'kanto-route-20': { x: 40,  y: 90 },
  'kanto-route-21': { x: 22,  y: 90 }, 'kanto-route-22': { x: 12,  y: 60 },
  'kanto-route-23': { x: 6,   y: 32 }, 'kanto-route-24': { x: 53,  y: 12 },
  'kanto-route-25': { x: 68,  y: 8  }, 'kanto-route-26': { x: 82,  y: 12 },
  'kanto-route-27': { x: 90,  y: 12 }, 'kanto-route-28': { x: 92,  y: 7  },
  'kanto-viridian-forest':   { x: 24,  y: 36 },
  'kanto-mt-moon':           { x: 42,  y: 16 },
  'kanto-rock-tunnel':       { x: 82,  y: 26 },
  'kanto-digletts-cave':     { x: 26,  y: 56 },
  'kanto-safari-zone':       { x: 60,  y: 78 },
  'kanto-seafoam-islands':   { x: 48,  y: 90 },
  'kanto-pokemon-mansion':   { x: 18,  y: 92 },
  'kanto-power-plant':       { x: 93,  y: 28 },
  'kanto-victory-road':      { x: 5,   y: 18 },
  'kanto-pokemon-tower':     { x: 78,  y: 42 },
  'kanto-cerulean-cave':     { x: 60,  y: 10 },
  'kanto-silph-co':          { x: 50,  y: 48 },
  'kanto-celadon-mansion':   { x: 38,  y: 50 },
  'kanto-game-corner':       { x: 40,  y: 52 },
  'kanto-oaks-lab':          { x: 17,  y: 86 },
  'kanto-fighting-dojo':     { x: 52,  y: 50 },
  'kanto-cinnabar-island':   { x: 18,  y: 92 },
  'kanto-indigo-plateau':    { x: 5,   y: 10 },
  'kanto-saffron-city':      { x: 50,  y: 48 },
  'kanto-celadon-city':      { x: 38,  y: 50 },
  'kanto-cerulean-city':     { x: 50,  y: 22 },
  'kanto-vermilion-city':    { x: 55,  y: 66 },
  'kanto-lavender-town':     { x: 78,  y: 42 },
  'kanto-fuchsia-city':      { x: 72,  y: 82 },
  'kanto-pallet-town':       { x: 17,  y: 86 },
  'kanto-viridian-city':     { x: 22,  y: 60 },
  'kanto-pewter-city':       { x: 22,  y: 22 }
};

const TAMANHOS_DESTAQUE = {
  'kanto-route-1':  { w: 5, h: 8 },  'kanto-route-2':  { w: 5, h: 10 },
  'kanto-route-3':  { w: 10, h: 4 }, 'kanto-route-4':  { w: 8, h: 4 },
  'kanto-route-5':  { w: 4, h: 8 },  'kanto-route-6':  { w: 4, h: 8 },
  'kanto-route-7':  { w: 8, h: 4 },  'kanto-route-8':  { w: 10, h: 4 },
  'kanto-route-9':  { w: 12, h: 4 }, 'kanto-route-10': { w: 4, h: 8 },
  'kanto-route-11': { w: 10, h: 4 }, 'kanto-route-12': { w: 4, h: 8 },
  'kanto-route-13': { w: 4, h: 6 },  'kanto-route-14': { w: 8, h: 4 },
  'kanto-route-15': { w: 10, h: 4 }, 'kanto-route-16': { w: 8, h: 4 },
  'kanto-route-17': { w: 4, h: 8 },  'kanto-route-18': { w: 10, h: 5 },
  'kanto-route-19': { w: 4, h: 6 },  'kanto-route-20': { w: 12, h: 5 },
  'kanto-route-21': { w: 8, h: 5 },  'kanto-route-22': { w: 8, h: 4 },
  'kanto-route-23': { w: 4, h: 12 }, 'kanto-route-24': { w: 4, h: 6 },
  'kanto-route-25': { w: 12, h: 4 }, 'kanto-route-26': { w: 6, h: 4 },
  'kanto-route-27': { w: 6, h: 4 },  'kanto-route-28': { w: 6, h: 4 },
  'kanto-viridian-forest': { w: 10, h: 10 }, 'kanto-mt-moon': { w: 8, h: 8 },
  'kanto-rock-tunnel':     { w: 8,  h: 8  }, 'kanto-digletts-cave': { w: 6, h: 6 },
  'kanto-safari-zone':     { w: 14, h: 12 }, 'kanto-seafoam-islands': { w: 10, h: 8 },
  'kanto-pokemon-mansion': { w: 8,  h: 8  }, 'kanto-power-plant': { w: 8, h: 8 },
  'kanto-victory-road':    { w: 8,  h: 8  }, 'kanto-pokemon-tower': { w: 6, h: 6 },
  'kanto-cerulean-cave':   { w: 8,  h: 8  }, 'kanto-silph-co': { w: 6, h: 6 },
  'kanto-celadon-mansion': { w: 6,  h: 6  }, 'kanto-game-corner': { w: 6, h: 6 },
  'kanto-oaks-lab':        { w: 6,  h: 6  }, 'kanto-fighting-dojo': { w: 6, h: 6 },
  'kanto-cinnabar-island': { w: 10, h: 8  }, 'kanto-indigo-plateau': { w: 8, h: 8 },
  'kanto-saffron-city':    { w: 8,  h: 8  }, 'kanto-celadon-city': { w: 8, h: 8 },
  'kanto-cerulean-city':   { w: 8,  h: 8  }, 'kanto-vermilion-city': { w: 8, h: 8 },
  'kanto-lavender-town':   { w: 8,  h: 8  }, 'kanto-fuchsia-city': { w: 8, h: 8 },
  'kanto-pallet-town':     { w: 8,  h: 8  }, 'kanto-viridian-city': { w: 8, h: 8 },
  'kanto-pewter-city':     { w: 8,  h: 8  }
};

const TAMANHO_PADRAO = { w: 8, h: 6 };

const ABREVIACOES = {
  'viridian-forest': 'VF', 'mt-moon': 'MM', 'rock-tunnel': 'RT', 'digletts-cave': 'DC',
  'safari-zone': 'SZ', 'seafoam-islands': 'SI', 'pokemon-mansion': 'PM', 'power-plant': 'PP',
  'victory-road': 'VR', 'pokemon-tower': 'PT', 'cerulean-cave': 'CC', 'silph-co': 'SC',
  'celadon-mansion': 'CM', 'game-corner': 'GC', 'oaks-lab': 'OL', 'fighting-dojo': 'FD',
  'cinnabar-island': 'CI', 'indigo-plateau': 'IP', 'saffron-city': 'SA', 'celadon-city': 'CE',
  'cerulean-city': 'CR', 'vermilion-city': 'VE', 'lavender-town': 'LA', 'fuchsia-city': 'FU',
  'pallet-town': 'PA', 'viridian-city': 'VI', 'pewter-city': 'PE'
};

function obterLabel(nomeArea) {
  if (nomeArea.includes('route-')) return nomeArea.split('route-')[1];
  const chave = nomeArea.replace(/^kanto-/, '');
  return ABREVIACOES[chave] || '•';
}

/* =========================================================
   DICIONÁRIO DE HABILIDADES
   ========================================================= */
const DESCRICOES_HABILIDADES = {
  'overgrow': 'Quando o HP está baixo, os movimentos do tipo Planta ficam mais fortes.',
  'chlorophyll': 'Sob luz solar intensa, a Velocidade é dobrada.',
  'blaze': 'Quando o HP está baixo, os movimentos do tipo Fogo ficam mais fortes.',
  'solar-power': 'Sob luz solar intensa, o Ataque Especial aumenta, mas o Pokémon perde HP a cada turno.',
  'torrent': 'Quando o HP está baixo, os movimentos do tipo Água ficam mais fortes.',
  'rain-dish': 'Recupera HP gradualmente enquanto estiver chovendo.',
  'shield-dust': 'Impede os efeitos secundários dos movimentos do oponente.',
  'run-away': 'Permite fugir de qualquer Pokémon selvagem.',
  'shed-skin': 'Pode curar problemas de status a cada turno.',
  'compound-eyes': 'Aumenta a precisão dos movimentos.',
  'tinted-lens': 'Aumenta o poder dos movimentos contra tipos resistentes.',
  'swarm': 'Quando o HP está baixo, os movimentos do tipo Inseto ficam mais fortes.',
  'sniper': 'Aumenta o dano dos acertos críticos.',
  'keen-eye': 'Impede que a precisão seja reduzida.',
  'tangled-feet': 'Aumenta a evasão quando o Pokémon está confuso.',
  'big-pecks': 'Impede que a Defesa seja reduzida.',
  'guts': 'Aumenta o Ataque quando tem um problema de status.',
  'hustle': 'Aumenta o Ataque, mas reduz a precisão dos movimentos físicos.',
  'sheer-force': 'Aumenta o poder dos movimentos, mas remove seus efeitos secundários.',
  'intimidate': 'Reduz o Ataque do oponente ao entrar em batalha.',
  'unnerve': 'Impede o oponente de comer Berries.',
  'static': 'Pode paralisar quem faz contato físico.',
  'lightning-rod': 'Atrai movimentos elétricos para si e fica imune a eles.',
  'sand-veil': 'Aumenta a evasão durante uma tempestade de areia.',
  'poison-point': 'Pode envenenar quem faz contato físico.',
  'rivalry': 'Aumenta o dano contra oponentes do mesmo gênero.',
  'cute-charm': 'Pode atrair quem faz contato físico.',
  'magic-guard': 'Só sofre dano de ataques diretos.',
  'friend-guard': 'Reduz pela metade o dano recebido pelos aliados.',
  'flash-fire': 'Fica imune a Fogo e fortalece seus movimentos de Fogo ao ser atingido por um.',
  'drought': 'Invoca luz solar intensa ao entrar em batalha.',
  'immunity': 'Impede que o Pokémon seja envenenado.',
  'poison-heal': 'Recupera HP em vez de sofrer dano quando envenenado.',
  'sand-rush': 'Dobra a Velocidade durante uma tempestade de areia.',
  'sand-force': 'Aumenta o poder de movimentos de Pedra, Terra e Aço durante tempestade de areia.',
  'pickup': 'Pode pegar itens usados pelo oponente.',
  'technician': 'Aumenta o poder de movimentos com 60 de poder ou menos.',
  'skill-link': 'Movimentos que atacam várias vezes sempre atingem o número máximo de golpes.',
  'oblivious': 'Impede que o Pokémon seja atraído.',
  'own-tempo': 'Impede que o Pokémon fique confuso.',
  'regenerator': 'Recupera HP ao trocar de Pokémon.',
  'water-absorb': 'Fica imune a Água e recupera HP ao ser atingido por um movimento desse tipo.',
  'damp': 'Impede o uso de movimentos de auto-destruição.',
  'water-veil': 'Impede que o Pokémon seja queimado.',
  'synchronize': 'Passa queimadura, veneno ou paralisia para o oponente.',
  'inner-focus': 'Impede que o Pokémon recue.',
  'telepathy': 'Evita dano causado por aliados.',
  'no-guard': 'Todos os movimentos acertam o alvo sem errar.',
  'vital-spirit': 'Impede que o Pokémon durma.',
  'steadfast': 'Aumenta a Velocidade ao recuar.',
  'rock-head': 'Não sofre dano de recuo.',
  'sturdy': 'Não é nocauteado com um único golpe quando está com HP cheio.',
  'weak-armor': 'Reduz a Defesa e aumenta a Velocidade ao ser atingido por um ataque físico.',
  'magnet-pull': 'Impede que Pokémon do tipo Aço fujam da batalha.',
  'analytic': 'Aumenta o poder dos movimentos se o Pokémon se mover por último.',
  'limber': 'Impede que o Pokémon seja paralisado.',
  'klutz': 'Impede o uso de itens segurados.',
  'unburden': 'Dobra a Velocidade ao perder um item segurado.',
  'cloud-nine': 'Nega os efeitos do clima enquanto estiver em batalha.',
  'levitate': 'Fica imune a movimentos do tipo Terra.',
  'cursed-body': 'Pode desabilitar o movimento de quem faz contato físico.',
  'hyper-cutter': 'Impede que o Ataque seja reduzido.',
  'shell-armor': 'Impede que o oponente acerte um golpe crítico.',
  'soundproof': 'Fica imune a movimentos sonoros.',
  'bulletproof': 'Fica imune a movimentos de bola e bomba.',
  'volt-absorb': 'Fica imune a Elétrico e recupera HP ao ser atingido por um movimento desse tipo.',
  'illuminate': 'Aumenta a taxa de encontros com Pokémon selvagens.',
  'swift-swim': 'Dobra a Velocidade durante a chuva.',
  'thick-fat': 'Reduz o dano recebido de movimentos de Fogo e Gelo.',
  'hydration': 'Cura problemas de status quando está chovendo.',
  'battle-armor': 'Impede que o oponente acerte um golpe crítico.',
  'flame-body': 'Pode queimar quem faz contato físico.',
  'natural-cure': 'Cura problemas de status ao trocar de Pokémon.',
  'serene-grace': 'Dobra a chance de efeitos secundários dos movimentos.',
  'healer': 'Pode curar problemas de status dos aliados.',
  'insomnia': 'Impede que o Pokémon durma.',
  'forewarn': 'Revela um dos movimentos do oponente.',
  'bad-dreams': 'Causa dano a oponentes adormecidos a cada turno.',
  'justified': 'Aumenta o Ataque ao ser atingido por movimentos do tipo Sombrio.',
  'iron-fist': 'Aumenta o poder de movimentos de punho.',
  'reckless': 'Aumenta o poder de movimentos com dano de recuo.',
  'plus': 'Aumenta o Ataque Especial se um aliado tiver Plus ou Minus.',
  'early-bird': 'Acorda de sono em metade do tempo normal.',
  'sap-sipper': 'Fica imune a Planta e aumenta o Ataque ao ser atingido por um movimento desse tipo.',
  'overcoat': 'Fica imune a dano de clima e a movimentos de pó.',
  'stench': 'Pode fazer o oponente recuar.',
  'sticky-hold': 'Impede que o item segurado seja roubado.',
  'poison-touch': 'Pode envenenar quem faz contato físico.',
  'heatproof': 'Reduz o dano recebido de movimentos de Fogo.',
  'heavy-metal': 'Dobra o peso do Pokémon.',
  'gluttony': 'Come Berries mais cedo do que o normal.',
  'scrappy': 'Permite atingir Pokémon do tipo Fantasma com movimentos de Normal e Lutador.',
  'filter': 'Reduz o dano de movimentos super efetivos.',
  'dry-skin': 'Recupera HP na chuva, perde HP no sol e sofre dano extra de Fogo.',
  'mold-breaker': 'Ignora as habilidades do oponente ao atacar.',
  'moxie': 'Aumenta o Ataque ao nocautear um oponente.',
  'anger-point': 'Aumenta o Ataque ao máximo quando atingido por um golpe crítico.',
  'rattled': 'Aumenta a Velocidade ao ser atingido por movimentos de Sombrio, Inseto ou Fantasma.',
  'imposter': 'Transforma-se no oponente ao entrar em batalha.',
  'adaptability': 'Aumenta o bônus de STAB de 1.5x para 2x.',
  'anticipation': 'Avisa se o oponente tem movimentos super efetivos contra ele.',
  'quick-feet': 'Aumenta a Velocidade quando tem um problema de status.',
  'trace': 'Copia a habilidade do oponente.',
  'download': 'Aumenta o Ataque ou Ataque Especial baseado nas defesas do oponente.',
  'pressure': 'Aumenta o consumo de PP dos movimentos do oponente.',
  'snow-cloak': 'Aumenta a evasão durante a neve.',
  'marvel-scale': 'Aumenta a Defesa quando tem um problema de status.',
  'multiscale': 'Reduz o dano recebido quando está com HP cheio.',
  'truant': 'O Pokémon só pode agir a cada dois turnos.',
  'wonder-guard': 'Só sofre dano de movimentos super efetivos.',
  'magic-bounce': 'Reflete movimentos de status de volta ao oponente.',
  'prankster': 'Aumenta a prioridade de movimentos de status.',
  'competitive': 'Aumenta o Ataque Especial quando tem qualquer atributo reduzido.',
  'defiant': 'Aumenta o Ataque quando tem qualquer atributo reduzido.',
  'frisk': 'Revela o item segurado do oponente.',
  'pickpocket': 'Rouba o item de quem faz contato físico.',
  'aftermath': 'Causa dano a quem nocauteia o Pokémon com contato físico.',
  'snow-warning': 'Invoca neve ao entrar em batalha.',
  'honey-gather': 'Pode coletar Mel após uma batalha.',
  'tangling-hair': 'Pode reduzir a Velocidade de quem faz contato físico.',
  'gooey': 'Reduz a Velocidade de quem faz contato físico.',
  'symbiosis': 'Passa seu item para um aliado quando ele usa o dele.',
  'stamina': 'Aumenta a Defesa ao ser atingido por um ataque.',
  'water-compaction': 'Aumenta muito a Defesa ao ser atingido por Água.',
  'merciless': 'Ataques sempre acertam crítico contra alvos envenenados.',
  'mirror-armor': 'Reflete reduções de atributos de volta ao oponente.',
  'punk-rock': 'Aumenta o poder de movimentos sonoros e reduz o dano recebido deles.',
  'sand-spit': 'Cria uma tempestade de areia ao ser atingido.',
  'ice-scales': 'Reduz o dano de movimentos especiais.',
  'ripen': 'Dobra o efeito de Berries.',
  'fluffy': 'Reduz o dano de contato, mas dobra o dano de Fogo.',
  'steam-engine': 'Aumenta muito a Velocidade ao ser atingido por Água ou Fogo.',
  'propeller-tail': 'Ignora movimentos que redirecionam ataques.',
  'screen-cleaner': 'Remove barreiras ao entrar em batalha.',
  'steely-spirit': 'Aumenta o poder de movimentos de Aço dos aliados.',
  'perish-body': 'Faz o oponente desmaiar em 3 turnos se fizer contato.',
  'wandering-spirit': 'Troca habilidades ao fazer contato físico.',
  'gorilla-tactics': 'Aumenta o Ataque, mas trava no primeiro movimento.',
  'neutralizing-gas': 'Suprime as habilidades de todos os Pokémon em batalha.',
  'pastel-veil': 'Impede envenenamento dos aliados.',
  'hunger-switch': 'Alterna entre as formas Cheio e Faminto.',
  'quick-draw': 'Pequena chance de atacar primeiro.',
  'curious-medicine': 'Aumenta o Ataque Especial ao entrar em batalha.',
  'unseen-fist': 'Permite atingir alvos protegidos.',
  'queenly-majesty': 'Impede que os oponentes ataquem primeiro.',
  'lingering-aroma': 'Pode reduzir a evasão ao ser atingido.',
  'well-baked-body': 'Imune a Fogo e aumenta a Defesa ao ser atingido por ele.',
  'wind-power': 'Recarrega o próximo movimento elétrico ao ser atingido por vento.',
  'ice-face': 'Bloqueia dano uma vez e depois muda de forma.',
  'cotton-down': 'Reduz a Velocidade de todos ao ser atingido.',
  'ball-fetch': 'Pega a bola e aumenta a Velocidade.'
};

/* =========================================================
   UTILITÁRIOS
   ========================================================= */
function capitalizar(texto) {
  return texto.replace(/-/g, ' ').split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

async function buscarDescricaoHabilidade(nomeOriginal) {
  if (DESCRICOES_HABILIDADES[nomeOriginal]) return DESCRICOES_HABILIDADES[nomeOriginal];
  try {
    const res = await fetch(`${ABILITY_URL}/${nomeOriginal}`);
    const data = await res.json();
    const flavor = data.flavor_text_entries.find(f => f.language.name === 'es')
                || data.flavor_text_entries.find(f => f.language.name === 'en');
    if (flavor) return flavor.flavor_text.replace(/\s+/g, ' ');
  } catch (e) { console.error(e); }
  return 'Descrição não disponível.';
}

/* =========================================================
   BUSCAR DESCRIÇÕES DA POKÉDEX POR GERAÇÃO
   ========================================================= */
async function buscarDescricaoPokedex(pokemonId) {
  try {
    const res = await fetch(`${SPECIES_URL}/${pokemonId}`);
    if (!res.ok) return null;
    const data = await res.json();

    const genero = data.genera?.find(g => g.language.name === 'pt' || g.language.name === 'en')?.genus || null;

    // Idiomas em ordem de prioridade
    const prioridadeIdioma = { 'pt': 0, 'pt-BR': 0, 'en': 1, 'es': 2, 'ja': 3 };

    // Agrupa por geração — pega o idioma de maior prioridade por geração
    const porGeracao = {};

    data.flavor_text_entries.forEach(entry => {
      const versao = entry.version?.name;
      const geracao = VERSAO_PARA_GERACAO[versao];
      if (!geracao) return;

      const idioma = entry.language.name;
      const prioridade = prioridadeIdioma[idioma];
      if (prioridade === undefined) return;

      const atual = porGeracao[geracao];
      if (!atual || prioridade < atual.prioridade) {
        porGeracao[geracao] = {
          texto: entry.flavor_text
            .replace(/[\n\f\r]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim(),
          idioma: idioma === 'pt-BR' ? 'PT-BR' : idioma.toUpperCase(),
          versao: capitalizar(versao.replace(/-/g, ' ')),
          prioridade
        };
      }
    });

    // Converte em array ordenado por geração
    const descricoes = Object.entries(porGeracao)
      .map(([gen, d]) => ({
        geracao: parseInt(gen),
        regiao: NOME_GERACAO[parseInt(gen)] || `Gen ${gen}`,
        texto: d.texto,
        idioma: d.idioma,
        versao: d.versao
      }))
      .sort((a, b) => a.geracao - b.geracao);

    return { genero, descricoes };
  } catch (e) {
    console.error('Erro ao buscar descrição:', e);
    return null;
  }
}

/* =========================================================
   MODAL DE HABILIDADE
   ========================================================= */
function abrirModalHabilidade(nomeOriginal, nomeBonito) {
  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-box">
        <button class="modal-close" id="modal-close">✕</button>
        <h4>${nomeBonito}</h4>
        <p id="modal-descricao">Carregando descrição...</p>
      </div>
    </div>
  `;
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') fecharModal();
  });
  document.getElementById('modal-close').addEventListener('click', fecharModal);
  document.addEventListener('keydown', escutarEsc);
  buscarDescricaoHabilidade(nomeOriginal).then(desc => {
    const el = document.getElementById('modal-descricao');
    if (el) el.textContent = desc;
  });
}

function fecharModal() {
  document.getElementById('modal-container').innerHTML = '';
  document.removeEventListener('keydown', escutarEsc);
}

function escutarEsc(e) { if (e.key === 'Escape') fecharModal(); }

/* =========================================================
   TOCAR GRITO
   ========================================================= */
function tocarGrito(pokemonId) {
  const audio = new Audio(`${CRY_URL}/${pokemonId}.ogg`);
  audio.volume = 0.5;
  audio.play().catch(() => {
    const fallback = new Audio(`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${pokemonId}.ogg`);
    fallback.volume = 0.5;
    fallback.play().catch(e => console.warn('Não foi possível tocar o grito:', e));
  });
}

/* =========================================================
   SOM DO SHINY
   ========================================================= */
function tocarSparkleShiny() {
  try {
    const AudioContexto = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContexto();

    const master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);

    const notas = [
      { freq: 1046.50, delay: 0.00, dur: 0.28 },
      { freq: 1318.51, delay: 0.07, dur: 0.28 },
      { freq: 1567.98, delay: 0.14, dur: 0.30 },
      { freq: 2093.00, delay: 0.21, dur: 0.55 },
      { freq: 2637.02, delay: 0.28, dur: 0.65 }
    ];

    notas.forEach(({ freq, delay, dur }) => {
      const t = ctx.currentTime + delay;

      const osc1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = freq;

      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 2;

      const osc3 = ctx.createOscillator();
      const g3 = ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.value = freq * 3;

      g1.gain.setValueAtTime(0, t);
      g1.gain.linearRampToValueAtTime(0.55, t + 0.008);
      g1.gain.exponentialRampToValueAtTime(0.001, t + dur);

      g2.gain.setValueAtTime(0, t);
      g2.gain.linearRampToValueAtTime(0.18, t + 0.006);
      g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.8);

      g3.gain.setValueAtTime(0, t);
      g3.gain.linearRampToValueAtTime(0.06, t + 0.004);
      g3.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.6);

      osc1.connect(g1); g1.connect(master);
      osc2.connect(g2); g2.connect(master);
      osc3.connect(g3); g3.connect(master);

      osc1.start(t); osc1.stop(t + dur + 0.05);
      osc2.start(t); osc2.stop(t + dur * 0.8 + 0.05);
      osc3.start(t); osc3.stop(t + dur * 0.6 + 0.05);
    });

    setTimeout(() => {
      if (ctx.state !== 'closed') ctx.close();
    }, 1500);
  } catch (e) {
    console.warn('Não foi possível tocar o som do shiny:', e);
  }
}

/* =========================================================
   ALTERNAR SHINY
   ========================================================= */
function alternarShiny(imgElement, sprites, botao) {
  const estaShiny = imgElement.dataset.shiny === 'true';
  const novoEstado = !estaShiny;

  const novaSrc = novoEstado
    ? (sprites.shinyArtwork || sprites.shiny || sprites.normalArtwork)
    : (sprites.normalArtwork || sprites.normal);

  imgElement.dataset.shiny = novoEstado ? 'true' : 'false';
  imgElement.src = novaSrc;

  if (botao) {
    botao.classList.toggle('ativo', novoEstado);
    botao.querySelector('.shiny-texto').textContent = novoEstado ? 'Shiny ✦' : 'Shiny';
  }

  imgElement.classList.remove('shiny-flash');
  void imgElement.offsetWidth;
  imgElement.classList.add('shiny-flash');

  if (novoEstado) tocarSparkleShiny();
}

/* =========================================================
   BUSCAR MOVIMENTOS
   ========================================================= */
async function buscarMovimentos(pokemon) {
  const porNivel = [];
  const porTM = [];
  const porTutor = [];
  const porEgg = [];

  const vistosNivel = new Set();
  const vistosTM = new Set();
  const vistosTutor = new Set();
  const vistosEgg = new Set();

  pokemon.moves.forEach(m => {
    const nomeMov = m.move.name;
    const detalhes = m.version_group_details;

    const temNivel = detalhes.some(d => d.move_learn_method.name === 'level-up');
    const temTM = detalhes.some(d => d.move_learn_method.name === 'machine');
    const temTutor = detalhes.some(d => d.move_learn_method.name === 'tutor');
    const temEgg = detalhes.some(d => d.move_learn_method.name === 'egg');

    if (temNivel && !vistosNivel.has(nomeMov)) {
      vistosNivel.add(nomeMov);
      const niveis = detalhes
        .filter(d => d.move_learn_method.name === 'level-up')
        .map(d => d.level_learned_at);
      porNivel.push({ nome: nomeMov, nivel: Math.min(...niveis) });
    }
    if (temTM && !vistosTM.has(nomeMov)) { vistosTM.add(nomeMov); porTM.push({ nome: nomeMov }); }
    if (temTutor && !vistosTutor.has(nomeMov)) { vistosTutor.add(nomeMov); porTutor.push({ nome: nomeMov }); }
    if (temEgg && !vistosEgg.has(nomeMov)) { vistosEgg.add(nomeMov); porEgg.push({ nome: nomeMov }); }
  });

  async function carregarDetalhes(lista) {
    return Promise.all(lista.map(async info => {
      try {
        const res = await fetch(`${MOVE_URL}/${info.nome}`);
        const data = await res.json();
        return {
          nome: info.nome,
          nivel: info.nivel,
          tipo: data.type.name,
          poder: data.power,
          precisao: data.accuracy,
          pp: data.pp,
          classe: data.damage_class.name
        };
      } catch (e) { return null; }
    }));
  }

  const [nivel, tm, tutor, egg] = await Promise.all([
    carregarDetalhes(porNivel),
    carregarDetalhes(porTM),
    carregarDetalhes(porTutor),
    carregarDetalhes(porEgg)
  ]);

  return {
    nivel: nivel.filter(m => m !== null).sort((a, b) => a.nivel - b.nivel),
    tm: tm.filter(m => m !== null).sort((a, b) => a.nome.localeCompare(b.nome)),
    tutor: tutor.filter(m => m !== null).sort((a, b) => a.nome.localeCompare(b.nome)),
    egg: egg.filter(m => m !== null).sort((a, b) => a.nome.localeCompare(b.nome))
  };
}

/* =========================================================
   RENDERIZAR LISTA DE MOVIMENTOS
   ========================================================= */
function renderizarListaMovimentos(movimentos, tipo) {
  if (!movimentos || movimentos.length === 0) return '';

  const linhas = movimentos.map(m => {
    const tipoNome = NOMES_TIPOS[m.tipo] || m.tipo;
    const poder = m.poder !== null ? m.poder : '—';
    const precisao = m.precisao !== null ? `${m.precisao}%` : '—';

    let prefixo;
    if (tipo === 'nivel') prefixo = m.nivel === 0 ? 'Ini.' : `Nv ${m.nivel}`;
    else if (tipo === 'tm') prefixo = 'TM';
    else if (tipo === 'tutor') prefixo = 'TUT';
    else prefixo = 'OVO';

    return `
      <div class="move-row">
        <span class="move-level move-level-${tipo}">${prefixo}</span>
        <span class="tipo tipo-${m.tipo} move-tipo">${tipoNome}</span>
        <span class="move-name">${capitalizar(m.nome)}</span>
        <span class="move-stats">${CLASSES_DANO[m.classe] || m.classe} · Poder ${poder} · Prec. ${precisao} · PP ${m.pp}</span>
      </div>
    `;
  }).join('');

  return `<div class="moves-list">${linhas}</div>`;
}

/* =========================================================
   BUSCAR ROTAS
   ========================================================= */
async function buscarRotas(pokemonId, geracaoAtual) {
  try {
    const res = await fetch(`${ENCOUNTER_URL}/${pokemonId}/encounters`);
    if (!res.ok) return [];
    const data = await res.json();

    const prefixoAtual = PREFIXO_REGIAO[geracaoAtual];
    const rotas = [];
    const vistos = new Set();

    for (const area of data) {
      const nomeArea = area.location_area.name;
      if (!nomeArea.startsWith(prefixoAtual)) continue;
      if (vistos.has(nomeArea)) continue;
      vistos.add(nomeArea);
      rotas.push({ nome: nomeArea });
    }

    return rotas;
  } catch (e) {
    console.error('Erro ao buscar rotas:', e);
    return [];
  }
}

/* =========================================================
   RENDERIZAR DESCRIÇÕES POR GERAÇÃO
   ========================================================= */
function renderizarDescricoes(descricao) {
  if (!descricao || descricao.descricoes.length === 0) {
    return `
      <div class="pokedex-descricao">
        <div class="pokedex-descricao-titulo">
          <span class="desc-icone">📖</span>
          <span>Descrições da Pokédex</span>
        </div>
        <p class="pokedex-descricao-texto desc-indisponivel">Descrição não disponível para este Pokémon.</p>
      </div>
    `;
  }

  const totalGeracoes = descricao.descricoes.length;

  const blocos = descricao.descricoes.map(d => `
    <div class="desc-geracao-bloco" data-geracao="${d.geracao}">
      <div class="desc-geracao-cabecalho">
        <div class="desc-geracao-tags">
          <span class="desc-geracao-tag">Gen ${d.geracao}</span>
          <span class="desc-geracao-regiao">${d.regiao}</span>
        </div>
        <div class="desc-geracao-meta">
          <span class="desc-geracao-versao">${d.versao}</span>
          <span class="desc-geracao-idioma">${d.idioma}</span>
        </div>
      </div>
      <p class="pokedex-descricao-texto">${d.texto}</p>
    </div>
  `).join('');

  const generoHTML = descricao.genero
    ? `<span class="desc-info"><span class="desc-genero">${descricao.genero}</span></span>`
    : '';

  return `
    <div class="pokedex-descricao">
      <div class="pokedex-descricao-titulo">
        <span class="desc-icone">📖</span>
        <span>Descrições da Pokédex</span>
        <span class="desc-contador">${totalGeracoes} ${totalGeracoes === 1 ? 'geração' : 'gerações'}</span>
        ${generoHTML}
      </div>
      <div class="desc-geracoes-lista">
        ${blocos}
      </div>
    </div>
  `;
}

/* =========================================================
   MAPA DINÂMICO + DESCRIÇÃO
   ========================================================= */
function renderizarMapa(rotas, regiao, descricao) {
  const listaRotas = rotas.length > 0
    ? rotas.map(r => {
        const prefixo = PREFIXO_REGIAO[regiao.geracao] || '';
        const nomeLimpo = r.nome.startsWith(prefixo) ? r.nome.slice(prefixo.length) : r.nome;
        const nomeBonito = capitalizar(nomeLimpo.replace(/-/g, ' '));
        return `<span class="rota-tag">${nomeBonito}</span>`;
      }).join('')
    : `<span class="sem-rota">Este Pokémon não aparece em nenhuma rota de ${regiao.nome}.</span>`;

  let destaquesHTML = '';
  if (regiao.geracao === 1 && rotas.length > 0) {
    destaquesHTML = rotas.map(r => {
      const coord = COORDENADAS_KANTO[r.nome];
      if (!coord) return '';
      const tamanho = TAMANHOS_DESTAQUE[r.nome] || TAMANHO_PADRAO;
      const nomeBonito = capitalizar(r.nome.replace('kanto-', '').replace(/-/g, ' '));
      const label = obterLabel(r.nome);
      const left = coord.x - tamanho.w / 2;
      const top = coord.y - tamanho.h / 2;
      return `
        <span class="mapa-destaque" style="left:${left}%; top:${top}%; width:${tamanho.w}%; height:${tamanho.h}%;"></span>
        <span class="mapa-marcador" style="left:${coord.x}%; top:${coord.y}%;" title="${nomeBonito}">
          <span class="mapa-label">${label}</span>
        </span>
      `;
    }).join('');
  }

  const estiloMapa = `
    background-image: url('mapa-mundo.png');
    background-size: ${regiao.zoom}% auto;
    background-position: ${regiao.posicaoX}% ${regiao.posicaoY}%;
    background-repeat: no-repeat;
  `;

  return `
    <div class="mapa-kanto">
      <div class="mapa-titulo">▸ Rotas em ${regiao.nome} (Gen ${regiao.geracao})</div>
      <div class="mapa-imagem">
        <div class="mapa-foto-crop" style="${estiloMapa}"></div>
        <div class="mapa-destaques-container">${destaquesHTML}</div>
      </div>
      <div class="mapa-rotas">${rotas.length > 0 ? listaRotas : ''}</div>
      ${renderizarDescricoes(descricao)}
    </div>
  `;
}

/* =========================================================
   FUNÇÃO PRINCIPAL (ROTEADOR)
   ========================================================= */
async function carregarDetalhes() {
  const container = document.getElementById('detalhes-container');
  const loading = document.getElementById('loading-detalhes');

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    loading.style.display = 'none';
    container.innerHTML = '<p class="loading">Pokémon ou Animal não encontrado.</p>';
    return;
  }

  // LÓGICA DE INTERCEPTAÇÃO (PROJETO MEW)
  if (id.startsWith('pe-')) {
    // Se tiver o prefixo "pe-", carrega o 3D da fauna local
    await carregarAnimalFauna(id, container, loading);
  } else {
    // Caso contrário, roda o seu código original da PokeAPI
    await carregarPokemonClassico(id, container, loading);
  }
}


/* =========================================================
   1. FUNÇÃO DA FAUNA LOCAL (AMBIENTE 3D A-FRAME)
   ========================================================= */
async function carregarAnimalFauna(id, container, loading) {
  try {
    // Busca os dados do arquivo JSON local
    const resposta = await fetch('fauna_pe.json');
    if (!resposta.ok) throw new Error('Arquivo fauna_pe.json não encontrado');
    
    const baseDados = await resposta.json();
    const animal = baseDados[id];

    if (!animal) {
        throw new Error('Animal não encontrado no banco de dados local.');
    }

    loading.style.display = 'none';

    // Injeta o HTML do A-Frame e os dados do animal
    container.innerHTML = `
      <div class="detalhes-layout">
        <div class="col-esquerda">
          
          <!-- Tela do Ambiente Virtual 3D -->
          <div class="screen ambiente-virtual" style="position: relative; overflow: hidden; border-radius: 15px; padding: 0;">
            <a-scene embedded style="width: 100%; height: 350px;" vr-mode-ui="enabled: false">
              <a-assets>
                <a-asset-item id="modelo3d" src="${animal.modelo_gltf}"></a-asset-item>
                <img id="fundo-bioma" src="${animal.cenario_fundo}">
              </a-assets>

              <!-- Cenário 360 do Bioma -->
              <a-sky src="#fundo-bioma"></a-sky>

              <!-- Modelo 3D girando -->
              <a-gltf-model src="#modelo3d" position="0 1 -3" scale="${animal.escala || 1} ${animal.escala || 1} ${animal.escala || 1}" animation="property: rotation; to: 0 360 0; loop: true; dur: 10000"></a-gltf-model>

              <a-light type="ambient" color="#ffffff" intensity="0.9"></a-light>
              <a-entity camera look-controls></a-entity>
            </a-scene>

            <!-- Botão da Inteligência Artificial / Missão -->
            <button id="btn-missao" class="shiny-btn" style="position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); z-index: 999; font-weight: bold; font-size: 14px;">
              🔬 Iniciar Missão Ecológica
            </button>
          </div>

          <!-- Bloco de Identidade do Animal -->
          <div class="screen screen-identidade" style="margin-top: 15px;">
            <div class="numero-grande">${id.toUpperCase()}</div>
            <h2>${animal.nome}</h2>
            <div class="tipos"><span class="tipo" style="background: #3fb950; text-transform: uppercase;">${animal.bioma}</span></div>
            <p style="color: #ff4d4d; font-weight: bold; margin-top: 10px; font-size: 14px;">⚠️ Status: ${animal.ameaca}</p>
          </div>
        </div>
        
        <div class="col-direita">
          <div class="screen info-bloco">
             <h3>▸ Descrição Biológica</h3>
             <p style="line-height: 1.6; font-size: 14px; margin-top: 10px;">${animal.descricao}</p>
          </div>
          
          <div class="screen info-bloco">
            <h3>▸ Dados Ecológicos</h3>
            <div class="fisico" style="margin-top: 10px;">
              <div class="item"><div class="label">Reino</div><div class="valor">Animalia</div></div>
              <div class="item"><div class="label">Ocorrência</div><div class="valor">Pernambuco</div></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.title = `${animal.nome} — FaunaDex`;

    // Conecta o botão de missão
    document.getElementById('btn-missao').addEventListener('click', () => {
        alert("Em breve: Integração C++ / WebAssembly para o Quiz Adaptativo!");
    });

  } catch (erro) {
    loading.style.display = 'none';
    container.innerHTML = '<p class="loading">Erro ao carregar o animal da fauna. Verifique os arquivos 3D e o JSON.</p>';
    console.error('Erro:', erro);
  }
}


/* =========================================================
   2. FUNÇÃO ORIGINAL (POKEAPI CLÁSSICA)
   ========================================================= */
async function carregarPokemonClassico(id, container, loading) {
  try {
    const resposta = await fetch(`${API_URL}/${id}`);
    if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
    const pokemon = await resposta.json();

    loading.style.display = 'none';

    const regiao = obterRegiao(pokemon.id);
    const normalArtwork = pokemon.sprites.other['official-artwork'].front_default;
    const shinyArtwork = pokemon.sprites.other['official-artwork'].front_shiny;
    const normalPixel = pokemon.sprites.front_default;
    const shinyPixel = pokemon.sprites.front_shiny;

    const imagem = normalArtwork || normalPixel;
    const fallback = normalPixel;

    const temShiny = !!(shinyArtwork || shinyPixel);

    const numero = String(pokemon.id).padStart(4, '0');
    const nome = capitalizar(pokemon.name);

    const tiposHTML = pokemon.types
      .map(t => `<span class="tipo tipo-${t.type.name}">${NOMES_TIPOS[t.type.name] || t.type.name}</span>`)
      .join('');

    const altura = (pokemon.height / 10).toFixed(1);
    const peso = (pokemon.weight / 10).toFixed(1);

    const habilidadesHTML = pokemon.abilities
      .map(a => {
        const nomeOriginal = a.ability.name;
        const nomeBonito = capitalizar(nomeOriginal);
        const oculta = a.is_hidden ? ' <small style="opacity:0.6">(oculta)</small>' : '';
        return `<li data-habilidade="${nomeOriginal}" data-nome-bonito="${nomeBonito}">${nomeBonito}${oculta}</li>`;
      })
      .join('');

    const statsHTML = pokemon.stats
      .map(s => {
        const statNome = NOMES_STATS[s.stat.name] || s.stat.name;
        const valor = s.base_stat;
        const porcentagem = Math.min((valor / 255) * 100, 100);
        return `
          <div class="stat-row">
            <span class="stat-name">${statNome}</span>
            <div class="stat-bar-bg"><div class="stat-bar" style="width: ${porcentagem}%"></div></div>
            <span class="stat-valor">${valor}</span>
          </div>
        `;
      })
      .join('');

    const regiaoHTML = regiao
      ? `<div class="regiao-info">Gen ${regiao.geracao} · ${regiao.nome}</div>`
      : '';

    const botaoShinyHTML = temShiny
      ? `<button class="shiny-btn" id="shiny-btn" title="Alternar shiny">
           <span class="shiny-icone">✨</span>
           <span class="shiny-texto">Shiny</span>
         </button>`
      : '';

    container.innerHTML = `
      <div class="detalhes-layout">
        <div class="col-esquerda">
          <div class="screen screen-imagem" id="screen-imagem" title="Clique para ouvir o grito">
            <img
              src="${imagem}"
              alt="${nome}"
              id="imagem-pokemon"
              data-shiny="false"
              onerror="this.onerror=null; this.src='${fallback}';"
            >
            <span class="som-icone">🔊</span>
            ${botaoShinyHTML}
          </div>

          <div class="screen screen-identidade">
            <div class="numero-grande">Nº ${numero}</div>
            <h2>${nome}</h2>
            ${regiaoHTML}
            <div class="tipos">${tiposHTML}</div>
          </div>

          <div class="screen info-bloco" id="mapa-container">
            <p class="loading" style="padding:1rem;font-size:0.85rem;">Carregando mapa...</p>
          </div>
        </div>

        <div class="col-direita">
          <div class="screen info-bloco">
            <h3>▸ Dados Físicos</h3>
            <div class="fisico">
              <div class="item"><div class="label">Altura</div><div class="valor">${altura} m</div></div>
              <div class="item"><div class="label">Peso</div><div class="valor">${peso} kg</div></div>
            </div>
          </div>

          <div class="screen info-bloco">
            <h3>▸ Habilidades <small style="color:#7a9fb8;font-size:0.7rem;letter-spacing:0;text-transform:none;">(clique para ver detalhes)</small></h3>
            <ul class="habilidades" id="habilidades-lista">${habilidadesHTML}</ul>
          </div>

          <div class="screen info-bloco">
            <h3>▸ Estatísticas Base</h3>
            ${statsHTML}
          </div>

          <div class="screen info-bloco" id="bloco-nivel">
            <h3>▸ Movimentos por Nível <span class="mov-count" id="count-nivel"></span></h3>
            <div id="movimentos-nivel"><p class="loading" style="padding:1rem;font-size:0.85rem;">Carregando movimentos...</p></div>
          </div>

          <div class="screen info-bloco" id="bloco-tm" style="display:none;">
            <h3>▸ Movimentos de TM <span class="mov-count" id="count-tm"></span></h3>
            <div id="movimentos-tm"></div>
          </div>

          <div class="screen info-bloco" id="bloco-tutor" style="display:none;">
            <h3>▸ Movimentos de Tutor <span class="mov-count" id="count-tutor"></span></h3>
            <div id="movimentos-tutor"></div>
          </div>

          <div class="screen info-bloco" id="bloco-egg" style="display:none;">
            <h3>▸ Movimentos de Ovo <span class="mov-count" id="count-egg"></span></h3>
            <div id="movimentos-egg"></div>
          </div>
        </div>
      </div>
    `;

    document.title = `${nome} — Pokédex`;

    document.getElementById('screen-imagem').addEventListener('click', (e) => {
      if (e.target.closest('#shiny-btn')) return;
      tocarGrito(pokemon.id);
    });

    if (temShiny) {
      const botao = document.getElementById('shiny-btn');
      const img = document.getElementById('imagem-pokemon');

      botao.addEventListener('click', (e) => {
        e.stopPropagation();
        alternarShiny(img, {
          normalArtwork: normalArtwork,
          shinyArtwork: shinyArtwork,
          normal: normalPixel,
          shiny: shinyPixel
        }, botao);
      });
    }

    document.querySelectorAll('#habilidades-lista li').forEach(li => {
      li.addEventListener('click', () => {
        abrirModalHabilidade(li.dataset.habilidade, li.dataset.nomeBonito);
      });
    });

    buscarMovimentos(pokemon).then(({ nivel, tm, tutor, egg }) => {
      const elNivel = document.getElementById('movimentos-nivel');
      const countNivel = document.getElementById('count-nivel');
      if (nivel.length > 0) {
        elNivel.innerHTML = renderizarListaMovimentos(nivel, 'nivel');
        countNivel.textContent = `(${nivel.length})`;
      } else {
        elNivel.innerHTML = '<p class="sem-movimentos">Nenhum movimento por nível.</p>';
      }

      if (tm.length > 0) {
        const bloco = document.getElementById('bloco-tm');
        bloco.style.display = '';
        document.getElementById('movimentos-tm').innerHTML = renderizarListaMovimentos(tm, 'tm');
        document.getElementById('count-tm').textContent = `(${tm.length})`;
      }

      if (tutor.length > 0) {
        const bloco = document.getElementById('bloco-tutor');
        bloco.style.display = '';
        document.getElementById('movimentos-tutor').innerHTML = renderizarListaMovimentos(tutor, 'tutor');
        document.getElementById('count-tutor').textContent = `(${tutor.length})`;
      }

      if (egg.length > 0) {
        const bloco = document.getElementById('bloco-egg');
        bloco.style.display = '';
        document.getElementById('movimentos-egg').innerHTML = renderizarListaMovimentos(egg, 'egg');
        document.getElementById('count-egg').textContent = `(${egg.length})`;
      }
    });

    Promise.all([
      buscarRotas(pokemon.id, regiao ? regiao.geracao : 1),
      buscarDescricaoPokedex(pokemon.id)
    ]).then(([rotas, descricao]) => {
      const el = document.getElementById('mapa-container');
      if (el && regiao) el.innerHTML = renderizarMapa(rotas, regiao, descricao);
    });

  } catch (erro) {
    loading.style.display = 'none';
    container.innerHTML = '<p class="loading">Erro ao carregar. Verifique sua conexão.</p>';
    console.error('Erro:', erro);
  }
}

document.addEventListener('DOMContentLoaded', carregarDetalhes);