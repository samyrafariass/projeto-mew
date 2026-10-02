/* =========================================================
   MewBiomas — Sistema de biomas procedurais para a fauna
   Detecta o habitat do animal e monta uma cena A-Frame
   com céu panorâmico, chão, vegetação e objetos temáticos.
   ========================================================= */
(function () {
  'use strict';

  /* -------------------------------------------------------
     Definição de biomas
     ------------------------------------------------------- */
  const BIOMAS = {
    manguezal: {
      nome: 'Manguezal',
      skyTopo: '#7BC8E8',
      skyBase: '#A8D5BA',
      fog: '#9DC9A8',
      fogDensity: 0.022,
      ground: '#6B7A4A',
      groundVariacao: '#7A8A58',
      agua: '#5A8B8E',
      aguaOpacity: 0.72,
      colinas: '#5A7A5A',
      arvores: { tronco: '#4A2F1A', folha: '#3A6B2E' },
      arbustos: '#4A7A3A',
      pedras: '#6A6A5A',
      qtd: { arvores: 14, arbustos: 16, pedras: 5 }
    },
    caatinga: {
      nome: 'Caatinga',
      skyTopo: '#6CB4EE',
      skyBase: '#F0D8A0',
      fog: '#E8D0A0',
      fogDensity: 0.012,
      ground: '#C8B080',
      groundVariacao: '#D8C090',
      agua: null,
      colinas: '#B0A080',
      arvores: { tronco: '#8A7050', folha: '#8A9A4A' },
      arbustos: '#A0A860',
      pedras: '#A89880',
      cactos: '#4A8A4A',
      qtd: { arvores: 5, arbustos: 22, pedras: 14, cactos: 8 }
    },
    cerrado: {
      nome: 'Cerrado',
      skyTopo: '#5FA8D3',
      skyBase: '#E8D8B0',
      fog: '#E0D0A8',
      fogDensity: 0.015,
      ground: '#B89A60',
      groundVariacao: '#C8AA70',
      agua: null,
      colinas: '#A0A070',
      arvores: { tronco: '#5A3A20', folha: '#4A6B30' },
      arbustos: '#6A7A40',
      pedras: '#8A8070',
      qtd: { arvores: 10, arbustos: 18, pedras: 10 }
    },
    mataAtlantica: {
      nome: 'Mata Atlântica',
      skyTopo: '#5AA0C0',
      skyBase: '#90C0A0',
      fog: '#6AA080',
      fogDensity: 0.035,
      ground: '#3A5020',
      groundVariacao: '#4A6028',
      agua: null,
      colinas: '#3A6A4A',
      arvores: { tronco: '#3A2515', folha: '#2A5A1E' },
      arbustos: '#3A6A2A',
      pedras: '#5A5A50',
      qtd: { arvores: 28, arbustos: 22, pedras: 3 }
    },
    florestaTropical: {
      nome: 'Floresta Tropical',
      skyTopo: '#4A90A4',
      skyBase: '#78B088',
      fog: '#4A8060',
      fogDensity: 0.04,
      ground: '#2E4520',
      groundVariacao: '#3A5528',
      agua: null,
      colinas: '#3A6A3A',
      arvores: { tronco: '#3A2010', folha: '#1E4A15' },
      arbustos: '#2A5A1E',
      pedras: '#4A4A40',
      qtd: { arvores: 32, arbustos: 24, pedras: 3 }
    },
    recife: {
      nome: 'Recife de Corais',
      skyTopo: '#50B8D9',
      skyBase: '#90DCEA',
      fog: '#80D0E0',
      fogDensity: 0.02,
      ground: '#E8D8B0',
      groundVariacao: '#F0E0C0',
      agua: '#4AAACC',
      aguaOpacity: 0.55,
      colinas: null,
      arvores: null,
      arbustos: '#A0C8B0',
      pedras: '#C8B890',
      corais: ['#FF6B9D', '#FFA07A', '#FFD700', '#EE82EE', '#40E0D0', '#FF8C69'],
      qtd: { arvores: 0, arbustos: 4, pedras: 10, corais: 18 }
    },
    oceano: {
      nome: 'Oceano',
      skyTopo: '#2E8BC0',
      skyBase: '#7BB8D9',
      fog: '#2E6BAA',
      fogDensity: 0.03,
      ground: '#3A5A7A',
      groundVariacao: '#4A6A8A',
      agua: '#1A5276',
      aguaOpacity: 0.7,
      colinas: null,
      arvores: null,
      arbustos: null,
      pedras: '#5A5A6A',
      qtd: { arvores: 0, arbustos: 0, pedras: 5 }
    },
    costeiro: {
      nome: 'Costeiro',
      skyTopo: '#FFC888',
      skyBase: '#FFE8C0',
      fog: '#FFE0B0',
      fogDensity: 0.012,
      ground: '#E8D8A8',
      groundVariacao: '#F0E0B8',
      agua: '#5FB4D4',
      aguaOpacity: 0.62,
      colinas: '#D0B090',
      arvores: { tronco: '#6A4A2A', folha: '#4A7A3A' },
      arbustos: '#6A8A4A',
      pedras: '#B0A090',
      qtd: { arvores: 3, arbustos: 6, pedras: 8 }
    }
  };

  /* -------------------------------------------------------
     Detecta bioma a partir do habitat / nome / classe
     ------------------------------------------------------- */
  function detectarBioma(animal) {
    const habitats = Array.isArray(animal.habitat)
      ? animal.habitat.join(' ')
      : (animal.habitat || '');
    const texto = [
      habitats,
      animal.nome_popular || '',
      animal.classe || ''
    ].join(' ').toLowerCase();

    if (/recife|corai/.test(texto))                          return 'recife';
    if (/oceano|pelágic|pelagic|águas abertas/.test(texto))  return 'oceano';
    if (/mangue|estuár|estuar|ambientes costeiros/.test(texto)) return 'manguezal';
    if (/mata atlântica|atlantic/.test(texto))               return 'mataAtlantica';
    if (/floresta tropical|floresta úmida/.test(texto))      return 'florestaTropical';
    if (/cerrado/.test(texto))                               return 'cerrado';
    if (/caatinga|semiárid|áreas abertas/.test(texto))       return 'caatinga';
    if (/litoral|costeir|praia|costões/.test(texto))         return 'costeiro';
    return 'mataAtlantica';
  }

  /* -------------------------------------------------------
     Gera textura panorâmica (gradiente) via canvas
     ------------------------------------------------------- */
  function criarTexturaGradiente(corTopo, corBase) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0.00, corTopo);
      grad.addColorStop(0.55, corBase);
      grad.addColorStop(1.00, corBase);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 512);

      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 12; i++) {
        const cx = Math.random() * 64;
        const cy = 40 + Math.random() * 130;
        const r = 12 + Math.random() * 22;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      return canvas.toDataURL('image/png');
    } catch (e) {
      return null;
    }
  }

  /* -------------------------------------------------------
     Helpers
     ------------------------------------------------------- */
  function posAleatoria(minRaio, maxRaio) {
    const ang = Math.random() * Math.PI * 2;
    const r = minRaio + Math.random() * (maxRaio - minRaio);
    return { x: Math.cos(ang) * r, z: Math.sin(ang) * r };
  }

  function variarCor(hex, intensidade) {
    const c = hex.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(c.slice(0, 2), 16) + intensidade));
    const g = Math.max(0, Math.min(255, parseInt(c.slice(2, 4), 16) + intensidade));
    const b = Math.max(0, Math.min(255, parseInt(c.slice(4, 6), 16) + intensidade));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  /* -------------------------------------------------------
     Geradores de elementos
     ------------------------------------------------------- */
  function gerarArvore(bioma, x, z) {
    if (!bioma.arvores) return '';
    const altura = 1.2 + Math.random() * 2.0;
    const rf = 0.6 + Math.random() * 0.55;
    const { tronco, folha } = bioma.arvores;
    const rot = Math.random() * 360;
    return `
      <a-entity position="${x.toFixed(2)} 0 ${z.toFixed(2)}" rotation="0 ${rot.toFixed(1)} 0">
        <a-cylinder position="0 ${(altura / 2).toFixed(2)} 0"
                    radius="0.12" height="${altura.toFixed(2)}"
                    color="${tronco}" shadow="cast: true"></a-cylinder>
        <a-sphere position="0 ${(altura + rf * 0.55).toFixed(2)} 0"
                  radius="${rf.toFixed(2)}"
                  color="${folha}" shadow="cast: true"></a-sphere>
        <a-sphere position="${(rf * 0.55).toFixed(2)} ${(altura + rf * 0.25).toFixed(2)} ${(rf * 0.45).toFixed(2)}"
                  radius="${(rf * 0.7).toFixed(2)}"
                  color="${folha}"></a-sphere>
        <a-sphere position="${(-rf * 0.5).toFixed(2)} ${(altura + rf * 0.4).toFixed(2)} ${(-rf * 0.5).toFixed(2)}"
                  radius="${(rf * 0.65).toFixed(2)}"
                  color="${folha}"></a-sphere>
      </a-entity>
    `;
  }

  function gerarArbusto(bioma, x, z) {
    const r = 0.3 + Math.random() * 0.4;
    const cor = bioma.arbustos || '#4A7A3A';
    return `
      <a-entity position="${x.toFixed(2)} 0 ${z.toFixed(2)}">
        <a-sphere position="0 ${(r * 0.7).toFixed(2)} 0"
                  radius="${r.toFixed(2)}"
                  color="${cor}" shadow="cast: true"></a-sphere>
        <a-sphere position="${(r * 0.55).toFixed(2)} ${(r * 0.5).toFixed(2)} ${(r * 0.35).toFixed(2)}"
                  radius="${(r * 0.75).toFixed(2)}"
                  color="${cor}"></a-sphere>
      </a-entity>
    `;
  }

  function gerarPedra(bioma, x, z) {
    const r = 0.18 + Math.random() * 0.5;
    const rot = Math.random() * 360;
    const cor = bioma.pedras || '#6A6A5A';
    return `
      <a-dodecahedron position="${x.toFixed(2)} ${(r * 0.65).toFixed(2)} ${z.toFixed(2)}"
                      radius="${r.toFixed(2)}"
                      color="${cor}"
                      rotation="0 ${rot.toFixed(1)} 0"
                      shadow="cast: true"></a-dodecahedron>
    `;
  }

  function gerarCacto(bioma, x, z) {
    const cor = bioma.cactos || '#4A8A4A';
    const h = 0.9 + Math.random() * 0.9;
    const rot = Math.random() * 360;
    const temBraco1 = Math.random() > 0.35;
    const temBraco2 = Math.random() > 0.55;
    const altBraco = h * (0.45 + Math.random() * 0.2);
    const compBraco = 0.35 + Math.random() * 0.25;

    let html = `
      <a-entity position="${x.toFixed(2)} 0 ${z.toFixed(2)}" rotation="0 ${rot.toFixed(1)} 0">
        <a-cylinder position="0 ${(h / 2).toFixed(2)} 0"
                    radius="0.14" height="${h.toFixed(2)}"
                    color="${cor}" shadow="cast: true"></a-cylinder>
        <a-sphere position="0 ${h.toFixed(2)} 0"
                  radius="0.14"
                  color="${cor}"></a-sphere>
    `;
    if (temBraco1) {
      html += `
        <a-cylinder position="${compBraco.toFixed(2)} ${altBraco.toFixed(2)} 0"
                    rotation="0 0 -90"
                    radius="0.09" height="${compBraco.toFixed(2)}"
                    color="${cor}"></a-cylinder>
        <a-cylinder position="${(compBraco * 1.5).toFixed(2)} ${(altBraco + compBraco * 0.5).toFixed(2)} 0"
                    radius="0.09" height="${(compBraco * 1.1).toFixed(2)}"
                    color="${cor}"></a-cylinder>
      `;
    }
    if (temBraco2) {
      html += `
        <a-cylinder position="${(-compBraco).toFixed(2)} ${(altBraco * 1.15).toFixed(2)} 0"
                    rotation="0 0 90"
                    radius="0.08" height="${compBraco.toFixed(2)}"
                    color="${cor}"></a-cylinder>
        <a-cylinder position="${(-compBraco * 1.5).toFixed(2)} ${(altBraco * 1.15 + compBraco * 0.5).toFixed(2)} 0"
                    radius="0.08" height="${(compBraco * 0.9).toFixed(2)}"
                    color="${cor}"></a-cylinder>
      `;
    }
    html += '</a-entity>';
    return html;
  }

  function gerarCoral(bioma, x, z) {
    if (!bioma.corais || bioma.corais.length === 0) return '';
    const cor = bioma.corais[Math.floor(Math.random() * bioma.corais.length)];
    const h = 0.35 + Math.random() * 0.7;
    const tipo = Math.floor(Math.random() * 3);
    const rot = Math.random() * 360;

    if (tipo === 0) {
      return `
        <a-entity position="${x.toFixed(2)} 0 ${z.toFixed(2)}" rotation="0 ${rot.toFixed(1)} 0">
          <a-cylinder position="0 ${(h / 2).toFixed(2)} 0" radius="0.09" height="${h.toFixed(2)}" color="${cor}"></a-cylinder>
          <a-cylinder position="0.13 ${(h * 0.75).toFixed(2)} 0" radius="0.06" height="${(h * 0.6).toFixed(2)}" color="${cor}"></a-cylinder>
          <a-cylinder position="-0.13 ${(h * 0.8).toFixed(2)} 0" radius="0.06" height="${(h * 0.55).toFixed(2)}" color="${cor}"></a-cylinder>
          <a-sphere position="0 ${h.toFixed(2)} 0" radius="0.12" color="${cor}"></a-sphere>
        </a-entity>
      `;
    } else if (tipo === 1) {
      return `
        <a-dodecahedron position="${x.toFixed(2)} ${(h * 0.4).toFixed(2)} ${z.toFixed(2)}"
                        radius="${h.toFixed(2)}"
                        color="${cor}"
                        scale="1 0.7 1"></a-dodecahedron>
      `;
    } else {
      return `
        <a-entity position="${x.toFixed(2)} 0 ${z.toFixed(2)}" rotation="0 ${rot.toFixed(1)} 0">
          <a-cone position="0 ${(h * 0.5).toFixed(2)} 0"
                  radius-bottom="${(h * 0.35).toFixed(2)}"
                  radius-top="0"
                  height="${h.toFixed(2)}"
                  color="${cor}"></a-cone>
          <a-sphere position="0 ${(h * 0.85).toFixed(2)} 0" radius="0.1" color="${cor}"></a-sphere>
        </a-entity>
      `;
    }
  }

  function gerarColinas(bioma, multiplicador) {
    if (!bioma.colinas) return '';
    const qtd = Math.round(10 * multiplicador);
    let html = '';
    for (let i = 0; i < qtd; i++) {
      const ang = (i / qtd) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const dist = 28 + Math.random() * 12;
      const x = Math.cos(ang) * dist;
      const z = Math.sin(ang) * dist;
      const raio = 6 + Math.random() * 6;
      const alt = 0.25 + Math.random() * 0.45;
      html += `<a-cone position="${x.toFixed(2)} ${(raio * alt * 0.28).toFixed(2)} ${z.toFixed(2)}"
                       radius-bottom="${raio.toFixed(2)}"
                       radius-top="${(raio * 0.35).toFixed(2)}"
                       height="${(raio * alt).toFixed(2)}"
                       color="${bioma.colinas}"></a-cone>`;
    }
    return html;
  }

  /* -------------------------------------------------------
     Monta a cena completa do bioma
     ------------------------------------------------------- */
  function montarCena3D(animal, opts) {
    opts = opts || {};
    const densidade = opts.densidade === 'baixa' ? 0.55 : 1.0;

    const biomaNome = detectarBioma(animal);
    const bioma = BIOMAS[biomaNome];

    let skySrc = animal.panorama || bioma.panorama || null;
    if (!skySrc) {
      skySrc = criarTexturaGradiente(bioma.skyTopo, bioma.skyBase);
    }

    let html = '';

    if (skySrc) {
      html += `<a-sky src="${skySrc}" color="${bioma.skyBase}"></a-sky>`;
    } else {
      html += `<a-sky color="${bioma.skyBase}"></a-sky>`;
    }

    html += `
      <a-circle position="0 0 0"
                rotation="-90 0 0"
                radius="90"
                color="${bioma.ground}"
                shadow="receive: true"></a-circle>
    `;

    const numPatches = Math.round(8 * densidade);
    for (let i = 0; i < numPatches; i++) {
      const { x, z } = posAleatoria(2, 35);
      const r = 1.5 + Math.random() * 3.5;
      const cor = bioma.groundVariacao || variarCor(bioma.ground, 15);
      html += `
        <a-circle position="${x.toFixed(2)} 0.005 ${z.toFixed(2)}"
                  rotation="-90 0 0"
                  radius="${r.toFixed(2)}"
                  color="${cor}"
                  opacity="0.55"
                  transparent="true"></a-circle>
      `;
    }

    if (bioma.agua) {
      html += `
        <a-circle position="0 0.03 0"
                  rotation="-90 0 0"
                  radius="90"
                  color="${bioma.agua}"
                  opacity="${bioma.aguaOpacity || 0.7}"
                  transparent="true"></a-circle>
      `;
    }

    html += gerarColinas(bioma, densidade);

    if (bioma.arvores) {
      const n = Math.round((bioma.qtd.arvores || 10) * densidade);
      for (let i = 0; i < n; i++) {
        const { x, z } = posAleatoria(3.5, 22);
        html += gerarArvore(bioma, x, z);
      }
    }

    if (bioma.arbustos) {
      const n = Math.round((bioma.qtd.arbustos || 10) * densidade);
      for (let i = 0; i < n; i++) {
        const { x, z } = posAleatoria(2.5, 25);
        html += gerarArbusto(bioma, x, z);
      }
    }

    if (bioma.pedras) {
      const n = Math.round((bioma.qtd.pedras || 6) * densidade);
      for (let i = 0; i < n; i++) {
        const { x, z } = posAleatoria(2, 28);
        html += gerarPedra(bioma, x, z);
      }
    }

    if (bioma.cactos) {
      const n = Math.round((bioma.qtd.cactos || 6) * densidade);
      for (let i = 0; i < n; i++) {
        const { x, z } = posAleatoria(2.5, 20);
        html += gerarCacto(bioma, x, z);
      }
    }

    if (bioma.corais) {
      const n = Math.round((bioma.qtd.corais || 12) * densidade);
      for (let i = 0; i < n; i++) {
        const { x, z } = posAleatoria(1.5, 18);
        html += gerarCoral(bioma, x, z);
      }
    }

    html += `
      <a-entity light="type: ambient; color: #ffffff; intensity: 0.85"></a-entity>
      <a-entity position="6 9 6"
                light="type: directional; color: #fff8e8; intensity: 1.25; castShadow: true; shadowMapWidth: 2048; shadowMapHeight: 2048"></a-entity>
      <a-entity position="-5 3 -3"
                light="type: point; color: #ffe8c8; intensity: 0.35"></a-entity>
    `;

    return { html, bioma };
  }

  window.MewBiomas = {
    BIOMAS,
    detectarBioma,
    montarCena3D,
    criarTexturaGradiente
  };
})();