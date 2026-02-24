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
        precos: {
            casquinha_copo: { "1 Bola": 8.00, "2 Bolas": 10.00, "3 Bolas": 12.00 },
            copo_recheado: { "1 Bola": 10.00, "2 Bolas": 12.00, "3 Bolas": 15.00 },
            cascão: { "1 Bola": 12.00, "2 Bolas": 16.00 },
            cestinha: { "1 Bola": 14.00, "2 Bolas": 18.00, "3 Bolas": 20.00 }
        }
    },
    picoles: {
        frutas_agua: {
            nome: "Picolé de Fruta/Água",
            preco_varejo: 2.50,
            preco_atacado: 1.80,
            estoque: 200,
            sabores: ["Abacaxi", "Caju", "Goiaba", "Groselha", "Limão", "Melância", "Uva", "Tamarindo"]
        },
        leite_sem_recheio: {
            nome: "Picolé de Leite sem Recheio",
            preco_varejo: 2.50,
            preco_atacado: 2.00,
            estoque: 200,
            sabores: ["Coco Queimado", "Milho Verde", "Amendoim", "Pistache"]
        },
        leite_com_recheio: {
            nome: "Picolé de Leite com Recheio",
            preco_varejo: 3.00,
            preco_atacado: 2.00,
            estoque: 200,
            sabores: ["Açaí", "Blue Ice", "Caraxi", "Coco Branco", "Chocolate", "Amarena", "Leite Condensado", "Mamão Papaia", "Maracujá", "Morango", "Menta com Chocolate", "Nata com Goiaba"]
        },
        leite_ninho: {
            nome: "Picolé Leite Ninho",
            preco_varejo: 4.00,
            preco_atacado: 3.00,
            estoque: 200,
            sabores: ["Leite Ninho"]
        },
        esquimós: {
            nome: "Picolé Esquimó",
            preco_varejo: 8.00,
            preco_atacado: 6.00,
            estoque: 200,
            sabores: ["Bombom", "Nutella", "Ovomaltine", "Leite Ninho", "Nata", "Morango", "Brigadeiro", "Prestígio"]
        }
    },
    acai_promocao: [
        { nome: "Açaí Promocional 400ml", desc: "Açaí + Banana + Leite em Pó + Leite Condensado", preco: 15.00 },
        { nome: "Açaí Promocional 400ml", desc: "Açaí + Morango + Leite em Pó + Leite Condensado", preco: 16.00 },
        { nome: "Açaí Promocional 400ml", desc: "Açaí + Morango + Nutella", preco: 18.00 },
        { nome: "Açaí Promocional 400ml", desc: "Açaí + Banana + Confete + Leite Condensado", preco: 17.00 },
        { nome: "Açaí Promocional 500ml", desc: "Açaí + Morango + Granola + Leite Condensado + Leite em Pó", preco: 20.00 },
        { nome: "Açaí Promocional 500ml", desc: "Açaí + Banana + Creme Leite Ninho + Paçoca", preco: 20.00 },
        { nome: "Açaí Promocional 600ml", desc: "Açaí + Morango + Banana + Leite em Pó + Leite Condensado", preco: 23.00 },
        { nome: "Açaí Promocional 700ml", desc: "Açaí + Morango + Nutella", preco: 28.00 }
    ],
    acai: {
        copos: { "300ml": 15.00, "360ml": 16.00, "400ml": 17.00, "600ml": 20.00 },
        complementos: {
            frutas: {
                preco: 2.00,
                itens: ["Morango", "Banana", "Uva", "Kiwi", "Abacaxi", "Cereja"]
            },
            cremes: {
                preco: 3.00,
                itens: ["Nutella", "Creme de Ninho", "Geleia de Morango", "Creme de Amendoim", "Goiabada", "Creme de Pistache", "Mel"]
            },
            guloseimas: {
                preco: 2.00,
                itens: ["Granola", "Paçoca", "Leite em Pó", "Ovomaltine", "Confete", "Chocoball", "Chantilly", "Granulado", "Leite Condensado"]
            },
            chocolates: {
                preco: 4.00,
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
        "Sorvete com Bolo no Pote": 25.00,
        "Petit Gâteau (1 bola)": 20.00,
        "Petit Gâteau (2 bolas)": 25.00,
        "Sorvete Diet (1 bola)": 10.00
    }
};
