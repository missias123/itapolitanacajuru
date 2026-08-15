/**
 * DATASET DE PRODUTOS — Sorveteria Itapolitana Cajuru
 * Este arquivo contém a base local de produtos e preços.
 * Ele é sincronizado automaticamente com /dados/produtos.json via fetch.
 */

window.PRODUTOS_DATA = {
    sorvetes: {
        sabores: [
            "Abacaxi ao Vinho", "Abacaxi Suíço", "Blue Ice (Algodão Doce Azul)", "Amarena", "Ameixa",
            "Banana com Nutella", "Bis e Trufa", "Cereja Trufada", "Chocolate", "Chocolate com Café",
            "Coco Queimado", "Creme Paris", "Croquer", "Doce de Leite", "Ferrero Rocher", "Flocos",
            "Kinder Ovo", "Leite Condensado", "Leite Ninho", "Leite Ninho Folheado", "Leite Ninho com Oreo",
            "Limão", "Limão Suíço", "Menta com Chocolate", "Milho Verde", "Morango Trufado",
            "Mousse de Maracujá", "Mousse de Uva", "Nozes", "Nutella", "Ovomaltine", "Pistache",
            "Prestígio", "Sensação", "Torta de Chocolate"
        ],
        preços: {
            casquinha_copão: { "1 Bola": 8, "2 Bolas": 10, "3 Bolas": 12 },
            copão_recheado:  { "1 Bola": 10, "2 Bolas": 12, "3 Bolas": 15 },
            cascão:          { "1 Bola": 12, "2 Bolas": 16 },
            cestinha:        { "1 Bola": 14, "2 Bolas": 18, "3 Bolas": 20 }
        }
    },
    picolés: {
        frutas_agua: {
            nome: "Picolé Frutas / Base Água", preço_varejo: 2.5, preço_atacado: 1.8,
            sabores: ["Abacaxi", "Caju", "Goiaba", "Groselha", "Limão", "Melância", "Uva", "Tamarindo"]
        },
        leite_sem_recheio: {
            nome: "Picolé Sem Recheio — Base Leite", preço_varejo: 2.5, preço_atacado: 2,
            sabores: ["Coco Queimado", "Milho Verde", "Amendoim", "Pistache"]
        },
        leite_com_recheio: {
            nome: "Picolé Recheado — Base Leite", preço_varejo: 3, preço_atacado: 2,
            sabores: ["Açaí", "Blue Ice (Algodão Doce Azul)", "Caraxi (Abacaxi com Caramelo)", "Coco Branco", "Chocolate", "Amarena", "Leite Condensado", "Mamão Papaia", "Maracujá", "Morango", "Menta com Chocolate", "Nata com Goiaba"]
        },
        leite_ninho: {
            nome: "Picolé Especial — Base Leite (Leite Ninho)", preço_varejo: 4, preço_atacado: 3, sabores: ["Leite Ninho"]
        },
        ovomaltine: {
            nome: "Picolé Especial — Base Leite (Ovomaltine)", preço_varejo: 4, preço_atacado: 3, sabores: ["Ovomaltine"]
        },
        esquimos: {
            nome: "Picolé Esquimó — Base Leite", preço_varejo: 8, preço_atacado: 6,
            sabores: ["Bombom", "Nutella", "Ovomaltine", "Leite Ninho", "Nata", "Morango", "Brigadeiro", "Prestígio"]
        }
    },
    açaí: {
        copos: [
            { ml: 250, preço: 13 }, { ml: 300, preço: 15 }, { ml: 400, preço: 17 },
            { ml: 500, preço: 20 }, { ml: 600, preço: 22 }, { ml: 700, preço: 27 }
        ]
    },
    milkshake: {
        tradicional: { "300ml": 17, "400ml": 20, "500ml": 22, "750ml": 28 },
        top: { "360ml": 20, "600ml": 24 }
    },
    tacas: {
        tradicionais: { "Colegial": 20, "Sundae": 23, "Banana Split": 25, "Universitário": 23, "Morango Split": 28, "Vaca Preta": 23, "Sundae com Nutella": 28, "Ula-Ula": 48 },
        sujas: { "Prestígio": 42, "Bis com Negresco": 42, "Lacta com Leite Ninho": 42, "Kit Kat": 42, "Morango com Ovomaltine": 42, "Sonho de Valsa": 45, "Unicórnio": 28 }
    },
    sobremesas: {
        "Torta de Sorvete": 100, "Fondue": 25, "Sorvete com Bolo no Copo 300ml": 15,
        "Sorvete com Bolo no Copo 600ml": 25, "Petit Gâteau (1 bola)": 20,
        "Petit Gâteau (2 bolas)": 25, "Brownie com Sorvete (1 bola)": 20,
        "Brownie com Sorvete (2 bolas)": 25, "Sorvete Diet (1 bola)": 10
    },
    tortas_enc: [{ id: "torta1", nome: "Torta de Sorvete", preço: 100, maxSabores: 3, estoque: 10, esgotado: false }],
    acrescimos: [
        { id: "acr_0", nome: "Canudinho Wafer", preço: 0.25, estoque: 100, esgotado: false },
        { id: "acr_1", nome: "Casquinhas", preço: 0.25, estoque: 100, esgotado: false },
        { id: "acr_2", nome: "Cascão", preço: 1, estoque: 100, esgotado: false },
        { id: "acr_3", nome: "Cestinha Recheada", preço: 1, estoque: 100, esgotado: false },
        { id: "acr_4", nome: "Cobertura 1.3L", preço: 40, estoque: 100, esgotado: false }
    ],
    caixas_viagem: { "10 Litros (2 sabores)": 150, "10 Litros (3 sabores)": 165, "5 Litros (2 sabores)": 100, "5 Litros (3 sabores)": 115 },
    isopores_viagem: { "4 Bolas": 25, "7 Bolas": 30, "9 Bolas": 40, "12 Bolas": 50 }
};

/**
 * Sincroniza os preços locais com o arquivo JSON na nuvem.
 */
async function carregarPreçosNuvem() {
  try {
    const resp = await fetch('dados/produtos.json');
    if (!resp.ok) return;
    const dados = await resp.json();
    const pData = window.PRODUTOS_DATA;

    if (dados.sorvetes) {
      if (dados.sorvetes.sabores) pData.sorvetes.sabores = dados.sorvetes.sabores;
      if (dados.sorvetes.precos) {
        const p = dados.sorvetes.precos;
        pData.sorvetes.preços = {
          casquinha_copão: p.casquinha_copo  || p.casquinha_copão,
          copão_recheado:  p.copo_recheado   || p.copão_recheado,
          cascão:          p.cascão,
          cestinha:        p.cestinha
        };
      }
    }

    if (dados.picoles) {
      Object.entries(dados.picoles).forEach(([key, p]) => {
        if (pData.picolés[key]) {
          if (p.preco_varejo  !== undefined) pData.picolés[key].preço_varejo  = p.preco_varejo;
          if (p.preco_atacado !== undefined) pData.picolés[key].preço_atacado = p.preco_atacado;
          if (p.estoque       !== undefined) pData.picolés[key].estoque       = p.estoque;
          if (p.sabores)                     pData.picolés[key].sabores       = p.sabores;
        }
      });
    }

    if (dados.caixas_enc) {
      pData.caixas_enc = dados.caixas_enc;
      window._itap_caixas = dados.caixas_enc.map(c => ({
        id: c.id, nome: c.nome, preço: c.preço || c.preco || 100,
        maxSabores: c.maxSabores || 2, estoque: c.estoque || 0,
        esgotado: !!(c.esgotado || c.estoque <= 0)
      }));
    }

    if (dados.tortas_enc) {
      pData.tortas_enc = dados.tortas_enc;
      window._itap_tortas = dados.tortas_enc.map(t => ({
        id: t.id, nome: t.nome, preço: t.preço || t.preco || 100,
        maxSabores: t.maxSabores || 3, estoque: t.estoque || 0,
        esgotado: !!(t.esgotado || t.estoque <= 0)
      }));
    }

    if (dados.acrescimos)       pData.acrescimos       = dados.acrescimos;
    if (dados.milkshake)        pData.milkshake        = dados.milkshake;
    if (dados.tacas)            pData.tacas            = dados.tacas;
    if (dados.açaí || dados.acai) pData.açaí           = dados.açaí || dados.acai;
    if (dados.caixas_viagem)    pData.caixas_viagem    = dados.caixas_viagem;
    if (dados.isopores_viagem)  pData.isopores_viagem  = dados.isopores_viagem;
    if (dados.sobremesas)       pData.sobremesas       = dados.sobremesas;
    
    window.dispatchEvent(new CustomEvent('produtosNuvemCarregados', { detail: pData }));

  } catch (e) {
    console.warn('[Itap] carregarPreçosNuvem falhou:', e.message);
  }
}

// Iniciar carregamento
carregarPreçosNuvem();
