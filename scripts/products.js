const produtos = {
    sorvetes: {
        sabores: [
            "Abacaxi ao Vinho",
            "Abacaxi Suíço",
            "Algodão Doce (Blue Ice)",
            "Amarena",
            "Ameixa",
            "Banana com Nutella",
            "Bis e Trufa",
            "Cereja Trufada",
            "Chocolate",
            "Chocolate com Café",
            "Coco Queimado",
            "Creme Paris",
            "Croquer",
            "Doce de Leite",
            "Ferrero Rocher",
            "Flocos",
            "Kinder Ovo",
            "Leite Condensado",
            "Leite Ninho",
            "Leite Ninho Folheado",
            "Leite Ninho com Oreo",
            "Limão",
            "Limão Suíço",
            "Menta com Chocolate",
            "Milho Verde",
            "Morango Trufado",
            "Mousse de Maracujá",
            "Mousse de Uva",
            "Nozes",
            "Nutella",
            "Ovomaltine",
            "Pistache",
            "Prestígio",
            "Sensação",
            "Torta de Chocolate"
        ],
        preços: {
            casquinha_copão: { "1 Bola": 8.00, "2 Bolas": 10.00, "3 Bolas": 12.00 },
            copão_recheado: { "1 Bola": 10.00, "2 Bolas": 12.00, "3 Bolas": 15.00 },
            cascão: { "1 Bola": 12.00, "2 Bolas": 16.00 },
            cestinha: { "1 Bola": 14.00, "2 Bolas": 18.00, "3 Bolas": 20.00 }
        }
    },
    picolés: {
        leite_ninho: {
            nome: "Picolé Especiais",
            preço_varejo: 4.00,
            preço_atacado: 4.00,
            estoque: 200,
            sabores: ["Leite Ninho", "Ovomaltine"]
        },
        frutas_agua: {
            nome: "Picolé de Fruta/Água",
            preço_varejo: 2.50,
            preço_atacado: 1.80,
            estoque: 200,
            sabores: ["Abacaxi", "Caju", "Goiaba", "Groselha", "Limão", "Melância", "Uva", "Tamarindo"]
        },
        leite_sem_recheio: {
            nome: "Picolé de Leite sem Recheio",
            preço_varejo: 2.50,
            preço_atacado: 2.00,
            estoque: 200,
            sabores: ["Coco Queimado", "Milho Verde", "Amendoim", "Pistache"]
        },
        leite_com_recheio: {
            nome: "Picolé de Leite com Recheio",
            preço_varejo: 3.00,
            preço_atacado: 2.00,
            estoque: 200,
            sabores: ["Açaí", "Blue Ice", "Caraxi", "Coco Branco", "Chocolate", "Amarena", "Leite Condensado", "Mamão Papaia", "Maracujá", "Morango", "Menta com Chocolate", "Nata com Goiaba"]
        },
        esquimós: {
            nome: "Picolé Esquimó",
            preço_varejo: 8.00,
            preço_atacado: 6.00,
            estoque: 200,
            sabores: ["Bombom", "Nutella", "Ovomaltine", "Leite Ninho", "Nata", "Morango", "Brigadeiro", "Prestígio"]
        }
    },
    açaí_promoção: [
        { nome: "Açaí Promocional 400ml", desc: "Açaí + Banana + Leite em Pó + Leite Condensado", preço: 15.00 },
        { nome: "Açaí Promocional 400ml", desc: "Açaí + Morango + Leite em Pó + Leite Condensado", preço: 16.00 },
        { nome: "Açaí Promocional 400ml", desc: "Açaí + Morango + Nutella", preço: 18.00 },
        { nome: "Açaí Promocional 400ml", desc: "Açaí + Banana + Confete + Leite Condensado", preço: 17.00 },
        { nome: "Açaí Promocional 500ml", desc: "Açaí + Morango + Granola + Leite Condensado + Leite em Pó", preço: 20.00 },
        { nome: "Açaí Promocional 500ml", desc: "Açaí + Banana + Creme Leite Ninho + Paçoca", preço: 20.00 },
        { nome: "Açaí Promocional 600ml", desc: "Açaí + Morango + Banana + Leite em Pó + Leite Condensado", preço: 23.00 },
        { nome: "Açaí Promocional 700ml", desc: "Açaí + Morango + Nutella", preço: 28.00 }
    ],
    açaí: {
        copos: { "300ml": 15.00, "360ml": 16.00, "400ml": 17.00, "600ml": 20.00 },
        complementos: {
            frutas: {
                preço: 2.00,
                itens: ["Morango", "Banana", "Uva", "Kiwi", "Abacaxi", "Cereja"]
            },
            cremes: {
                preço: 3.00,
                itens: ["Nutella", "Creme de Ninho", "Geleia de Morango", "Creme de Amendoim", "Goiabada", "Creme de Pistache", "Mel"]
            },
            guloseimas: {
                preço: 2.00,
                itens: ["Granola", "Paçoca", "Leite em Pó", "Ovomaltine", "Confete", "Chocoball", "Chantilly", "Granulado", "Leite Condensado"]
            },
            chocolates: {
                preço: 4.00,
                itens: ["Sonho de Valsa/Ouro Branco", "Prestígio", "Charge", "Kit Kat", "Kinder Bueno", "Lácta", "Bis", "Oreo", "Gotas de Chocolate", "Talento"]
            }
        }
    },
    caixas_viagem: {
        "10 Litros (2 sabores)": 150.00,
        "10 Litros (3 sabores)": 165.00,
        "5 Litros (2 sabores)": 100.00,
        "5 Litros (3 sabores)": 115.00
    },
    isopores_viagem: {
        "4 Bolas": 25.00,
        "7 Bolas": 30.00,
        "9 Bolas": 40.00,
        "12 Bolas": 50.00
    },
    milkshake: {
        tradicional: { "300ml": 17.00, "400ml": 20.00, "500ml": 22.00, "750ml": 28.00 },
        top: { "360ml": 20.00, "600ml": 24.00 },
        adicional_ovomaltine: 3.00
    },
    tacas: {
        tradicionais: {
            "Colegial": 20.00,
            "Sundae": 23.00,
            "Banana Split": 25.00,
            "Universitário": 23.00,
            "Morango Split": 28.00,
            "Vaca Preta": 23.00,
            "Sundae com Nutella": 28.00,
            "Ula-Ula": 48.00
        },
        sujas: {
            "Prestígio": 42.00,
            "Bis com Negresco": 42.00,
            "Lacta com Leite Ninho": 42.00,
            "Kit Kat": 42.00,
            "Morango com Ovomaltine": 42.00,
            "Sonho de Valsa": 45.00,
            "Unicórnio": 28.00
        }
    },
    sobremesas: {
        "Torta de Sorvete": 100.00,
        "Fondue": 25.00,
        "Sorvete com Bolo no Copo 600ml": 25.00,
        "Petit Gâteau (1 bola)": 20.00,
        "Petit Gâteau (2 bolas)": 25.00,
        "Sorvete Diet (1 bola)": 10.00
    }
};

// Carrega dados atualizados do JSON remoto e atualiza o objeto 'produtos' global.
// Chamada por enc-v2.js antes de renderizar os cards de encomenda.
async function carregarPreçosNuvem() {
  try {
    const resp = await fetch('/dados/produtos.json?t=' + Date.now(), { cache: 'no-store' });
    if (!resp.ok) return;
    const dados = await resp.json();

    // ── Sorvetes ─────────────────────────────────────────
    if (dados.sorvetes) {
      if (dados.sorvetes.sabores) produtos.sorvetes.sabores = dados.sorvetes.sabores;
      if (dados.sorvetes.precos) {
        const p = dados.sorvetes.precos;
        produtos.sorvetes.preços = {
          casquinha_copão: p.casquinha_copo  || p.casquinha_copão,
          copão_recheado:  p.copo_recheado   || p.copão_recheado,
          cascão:          p.cascão,
          cestinha:        p.cestinha
        };
      }
    }

    // ── Picolés ───────────────────────────────────────────
    if (dados.picoles) {
      Object.entries(dados.picoles).forEach(([key, p]) => {
        if (produtos.picolés[key]) {
          if (p.preco_varejo  !== undefined) produtos.picolés[key].preço_varejo  = p.preco_varejo;
          if (p.preco_atacado !== undefined) produtos.picolés[key].preço_atacado = p.preco_atacado;
          if (p.estoque       !== undefined) produtos.picolés[key].estoque       = p.estoque;
          if (p.sabores)                     produtos.picolés[key].sabores       = p.sabores;
        }
      });
    }

    // ── Caixas de encomenda ───────────────────────────────
    if (dados.caixas_enc && dados.caixas_enc.length > 0) {
      window._itap_caixas = dados.caixas_enc.map(c => ({
        id:         c.id,
        nome:       c.nome,
        preço:      c['preço'] || c.preco || 100,
        maxSabores: c.maxSabores || 2,
        estoque:    c.estoque   || 0,
        esgotado:   !!(c.esgotado || c.estoque <= 0)
      }));
    }

    // ── Tortas de encomenda ───────────────────────────────
    if (dados.tortas_enc && dados.tortas_enc.length > 0) {
      window._itap_tortas = dados.tortas_enc.map(t => ({
        id:         t.id,
        nome:       t.nome,
        preço:      t['preço'] || t.preco || 100,
        maxSabores: t.maxSabores || 3,
        estoque:    t.estoque   || 0,
        esgotado:   !!(t.esgotado || t.estoque <= 0)
      }));
    }

    // ── Outros ────────────────────────────────────────────
    if (dados.milkshake)        produtos.milkshake        = dados.milkshake;
    if (dados.tacas)            produtos.tacas            = dados.tacas;
    if (dados.açaí || dados.acai) produtos.açaí = dados.açaí || dados.acai;
    if (dados.caixas_viagem)    produtos.caixas_viagem    = dados.caixas_viagem;
    if (dados.isopores_viagem)  produtos.isopores_viagem  = dados.isopores_viagem;
    if (dados.sobremesas)       produtos.sobremesas       = dados.sobremesas;

  } catch (e) {
    console.warn('[Itap] carregarPreçosNuvem falhou, usando dados locais:', e.message);
  }
}
