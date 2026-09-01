/**
 * ITA BOT ENGINE — Motor Compartilhado
 * Sorveteria Itapolitana Cajuru
 *
 * Motor de intenções, roteamento, desambiguação e handlers de produto.
 * Não depende de elementos do DOM, IDs de página ou funções de interface.
 *
 * API pública:
 *   var engine = ItaBotEngine.createEngine();
 *   engine.loadData(prodData, promoData)      — injeta dados de produtos e promoções
 *   engine.mergeRespostas(tag, texto)         — mescla entrada de FAQ nas respostas estáticas
 *   engine.getResponse(text)                  — retorna payload de resposta
 *   engine.resetContext()                     — limpa estado conversacional
 *   engine.getKnowledge()                     — retorna base de conhecimento
 *   engine.norm(s)                            — normaliza texto
 *
 * Payload de resposta:
 *   {
 *     answer   : string,
 *     linkText : string,   linkHref : string,  external : bool,
 *     linkText2: string,   linkHref2: string,  external2: bool,
 *     chips    : string[]
 *   }
 *   ou { __async: true, __asyncFn: function(callback) {} }
 *
 * Sublote: Motor Compartilhado — branch copilot/valores-estao-erraods
 */
(function (root) {
  'use strict';

  /* ─── Normalização de texto ─── */
  function _norm(s) {
    var ACCENT_RE = /[\u0300-\u036f]/g;
    return String(s || '').toLowerCase().normalize('NFD').replace(ACCENT_RE, '').trim();
  }

  /* ─── Factory: cria uma instância do motor ─── */
  function createEngine() {

    /* Estado conversacional por instância */
    var _ctx     = null;   // estado FSM atual
    var _ctxData = {};     // dados acumulados durante contexto
    var _prodData  = null; // cache de dados/produtos.json
    var _promoData = null; // cache de dados/promo.json

    /* ── Respostas estáticas (espelho do widget, centralizado) ── */
    var RESPOSTAS = {
      'horário':       '\ud83d\udd59 Funcionamos todos os dias, das 10h \u00e0s 22h, inclusive feriados.',
      'funciona':      '\ud83d\udd59 Funcionamos todos os dias, das 10h \u00e0s 22h, inclusive feriados.',
      'abre':          '\ud83d\udd59 Abrimos todos os dias \u00e0s 10h e fechamos \u00e0s 22h. Te esperamos!',
      'fecha':         '\ud83d\udd59 Fechamos \u00e0s 22h todos os dias. Venha antes! \ud83d\ude0a',
      'aberto':        '\ud83d\udd59 Funcionamos todos os dias, das 10h \u00e0s 22h, inclusive feriados.',
      'domingo':       '\ud83d\udd59 Sim! Abrimos tamb\u00e9m aos domingos, das 10h \u00e0s 22h. \ud83c\udf66',
      'feriado':       '\ud83d\udd59 Sim! Funcionamos em feriados, das 10h \u00e0s 22h.',
      'endereço':      '\ud83d\udccd Estamos na R. Cel. Manoel Caetano, 311 \u2013 Pra\u00e7a Largo S\u00e3o Bento \u2013 Centro, Cajuru/SP.',
      'localização':   '\ud83d\udccd R. Cel. Manoel Caetano, 311 \u2013 Centro, Cajuru/SP. Clique em "Ver no Mapa" no site!',
      'onde':          '\ud83d\udccd Estamos no centro de Cajuru/SP, na Pra\u00e7a Largo S\u00e3o Bento. R. Cel. Manoel Caetano, 311.',
      'mapa':          '\ud83d\udccd Busque "Sorveteria Itapolitana Cajuru" no Google Maps ou use o bot\u00e3o no site.',
      'cajuru':        '\ud83d\udccd Estamos em Cajuru/SP desde 2007! Atendemos tamb\u00e9m Santa Cruz da Esperan\u00e7a e C\u00e1ssia dos Coqueiros.',
      'whatsapp':      '\ud83d\udcf1 WhatsApp: (16) 99606-2046. Respondemos rapidinho! \ud83d\ude0a',
      'telefone':      '\ud83d\udcf1 WhatsApp: (16) 99606-2046. Chame para encomendas, d\u00favidas ou eventos!',
      'contato':       '\ud83d\udcf1 Fale conosco pelo WhatsApp: (16) 99606-2046.',
      'instagram':     '\ud83d\udcf8 Nos siga: @sorveteriaitapolitanacajuru',
      'sabor':         '\ud83c\udf66 Temos 39 Sabores Sorvete Itapolitana! Destaques: Chocolate, Nutella, Leite Ninho, Morango Trufado, Ferrero Rocher, Pistache, Kinder Ovo (choc. branco) e muito mais.',
      'sabores':       '\ud83c\udf66 Temos 39 Sabores Sorvete Itapolitana! Digite o nome de um sabor para saber o pre\u00e7o.',
      'nutella':       '\ud83c\udf66 Sim! Temos sorvete de Nutella, Banana com Nutella, Sundae com Nutela e mais! \ud83d\ude0b',
      'chocolate':     '\ud83c\udf6b Temos Chocolate, Chocolate com Caf\u00e9, Bis e Trufa, Menta com Chocolate, Prest\u00edgio e Torta de Chocolate!',
      'leite ninho':   '\ud83e\udd5b Temos Leite Ninho, Leite Ninho Folheado e Leite Ninho com Oreo! Os favoritos das crian\u00e7as!',
      'morango':       '\ud83c\udf53 Temos Morango Trufado no sorvete e Morango Split nas ta\u00e7as!',
      'pistache':      '\ud83d\udfe2 Sim! Temos sorvete de Pistache \u2014 um dos sabores mais pedidos!',
      'diet':          '\ud83c\udf3f Sim! Sorvete Diet (1 bola R$ 10). Ideal para quem cuida da sa\u00fade!',
      'vegano':        '\ud83c\udf3f Para informa\u00e7\u00f5es sobre op\u00e7\u00f5es veganas, entre em contato pelo WhatsApp: (16) 99606-2046.',
      'lactose':       '\ud83c\udf3f Para op\u00e7\u00f5es sem lactose, fale pelo WhatsApp: (16) 99606-2046.',
      'alergia':       '\u26a0\ufe0f Para d\u00favidas sobre alergia ou intoler\u00e2ncia aliment\u00e2r, fale diretamente com nossa equipe: (16) 99606-2046.',
      'preço':         '\ud83d\udcb0 Sorvetes a partir de R$ 8,00 \u00b7 Milkshakes a partir de R$ 17,00 \u00b7 A\u00e7a\u00ed a partir de R$ 15,00.',
      'preços':        '\ud83d\udcb0 Sorvetes a partir de R$ 8,00 \u00b7 Milkshakes a partir de R$ 17,00 \u00b7 A\u00e7a\u00ed a partir de R$ 15,00.',
      'quanto':        '\ud83d\udcb0 Sorvetes a partir de R$ 8,00 \u00b7 Milkshakes a partir de R$ 17,00 \u00b7 A\u00e7a\u00ed a partir de R$ 15,00 \u00b7 Picol\u00e9s a partir de R$ 2,50.',
      'pagamento':     '\ud83d\udcb3 Aceitamos Dinheiro, Pix, Cart\u00e3o de D\u00e9bito e Cr\u00e9dito. Encomendas exigem pagamento antecipado.',
      'pix':           '\ud83d\udcb3 Sim! Aceitamos Pix. Para encomendas, pagamento via Pix antecipado.',
      'cartão':        '\ud83d\udcb3 Sim! Aceitamos cart\u00e3o de d\u00e9bito e cr\u00e9dito. Tamb\u00e9m Pix e dinheiro.',
      'complemento':   '\ud83e\uded0 Complementos do a\u00e7a\u00ed: Frutas (R$ 2), Cremes Nutella/Ninho (R$ 3), Guloseimas (R$ 2), Chocolates Kit Kat/Oreo (R$ 4).',
      'atacado':       '\ud83d\udce6 Picol\u00e9s no atacado: m\u00ednimo 100 un., prazo de 3 dias \u00fateis, pagamento antecipado. (16) 99606-2046.',
      'prazo':         '\ud83d\udce6 O prazo m\u00ednimo para encomendas \u00e9 de 3 dias \u00fateis ap\u00f3s confirma\u00e7\u00e3o e pagamento.',
      'torta':         '\ud83c\udf82 Torta de Sorvete R$ 100 com at\u00e9 3 sabores. Encomende com 3 dias de anteced\u00eancia!',
      'caixa':         '\ud83c\udf66 Caixas de 5L (a partir de R$ 100) e 10L (a partir de R$ 150) com 2 ou 3 sabores. Perfeito para festas!',
      'isopor':        '\ud83c\udf66 Is\u00f3pores para viagem: 4 bolas (R$ 25), 7 bolas (R$ 30), 9 bolas (R$ 40), 12 bolas (R$ 50).',
      'taça':          '\ud83c\udf68 Ta\u00e7as especiais: Colegial R$ 20, Sundae R$ 23, Banana Split R$ 25, Ula-Ula R$ 48 e muito mais!',
      'sundae':        '\ud83c\udf68 Sundae R$ 23,00 e Sundae com Nutela R$ 28,00.',
      'brownie':       '\ud83e\udd6e Brownie com Sorvete: 1 bola R$ 20 \u00b7 2 bolas R$ 25.',
      'fondue':        '\ud83e\udd6e Fondue de Sorvete R$ 25. Perfeito para compartilhar!',
      'evento':        '\ud83c\udfaa Temos Carrinho para Eventos! Consulte pelo WhatsApp: (16) 99606-2046.',
      'festa':         '\ud83c\udf89 Fazemos encomendas para festas: Torta, Caixas, Picol\u00e9s no atacado e Carrinho para Eventos!',
      'sorteio':       '\ud83c\udf89 Promo\u00e7\u00f5es e Sorteios\n\n\u26a0\ufe0f O cadastro para o sorteio da caixa de sorvete foi encerrado. A campanha teve mais de 1.400 inscritos, e os sorteios mensais de 1 caixa seguem at\u00e9 dezembro de 2026 para quem j\u00e1 se cadastrou.\n\n\ud83c\udf70 Inscri\u00e7\u00f5es j\u00e1 est\u00e3o abertas para o sorteio mensal de uma torta de sorvete. O sorteio da torta come\u00e7a em janeiro de 2027.\n\n\ud83d\udcdd Cadastre-se exclusivamente pelo site oficial da Itapolitana Cajuru: itapolitanacajuru.com.br, na aba Promo\u00e7\u00e3o.',
      'delivery':      '\ud83d\udeab N\u00e3o fazemos delivery. Encomende e retire na loja em Cajuru/SP.',
      'entrega':       '\ud83d\udeab N\u00e3o fazemos delivery. Para encomendas, a retirada \u00e9 na loja.',
      'artesanal':     '\ud83c\udf66 Nossos sorvetes s\u00e3o Sorvete Itapolitana \u2014 cremosos, em bolas redondas, com 39 Sabores incríveis!',
      'anos':          '\ud83c\udf66 A Sorveteria Itapolitana est\u00e1 em Cajuru desde 2007 \u2014 mais de 19 anos!',
      'historia':      '\ud83c\udf66 Fundada em 2007 em Cajuru/SP, mais de 19 anos de tradi\u00e7\u00e3o!'
    };

    /* ── Base de conhecimento (keywords → payload) ── */
    var itaBotKnowledge = [
      {
        keywords: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'iniciar', 'inicio', 'início', 'menu', 'opções', 'opcoes', 'começo'],
        chips: ['\ud83c\udf66 Card\u00e1pio', '\ud83d\udce6 Encomendas', '\ud83c\udf89 Promo\u00e7\u00f5es', '\ud83d\udccd Localiza\u00e7\u00e3o', '\ud83d\udd59 Hor\u00e1rio']
      },
      {
        keywords: ['fazer pedido', 'pedido', 'pedir', 'comprar', 'quero pedir', 'zap', 'whatsapp', 'whats', 'número', 'numero', 'chamar'],
        answer: 'Para fazer seu pedido, chame a gente no WhatsApp:',
        linkText: '\ud83d\udcac Fazer pedido no WhatsApp',
        linkHref: 'https://wa.me/5516996062046?text=Ol%C3%A1%2C+quero+fazer+um+pedido+na+Sorveteria+Itapolitana',
        external: true,
        linkText2: '\ud83c\udf66 Ver card\u00e1pio',
        linkHref2: 'encomendas.html'
      },
      {
        keywords: ['localização', 'localizacao', 'endereço', 'endereco', 'onde fica', 'como chegar', 'como ir', 'mapa', 'maps', 'waze'],
        answer: 'Estamos aqui: R. Cel. Manoel Caetano, 311 \u2013 Pra\u00e7a Largo S\u00e3o Bento \u2013 Centro, Cajuru/SP.',
        linkText: '\ud83d\udccd Abrir no Google Maps',
        linkHref: 'https://www.google.com/maps/place/Sorveteria+A%C3%A7aiteria+Itapolitana+Cajuru/@-21.2776766,-47.3071817',
        external: true
      },
      {
        keywords: ['horário', 'horario', 'horas', 'que horas abre', 'que horas fecha', 'funcionamento', 'dias de funcionamento'],
        answer: '\ud83d\udd59 Funcionamos todos os dias, das 10h \u00e0s 22h (incluindo s\u00e1bados, domingos e feriados).',
        chips: ['\ud83d\udccd Localiza\u00e7\u00e3o', '\ud83d\udcf1 WhatsApp', '\ud83c\udf66 Card\u00e1pio']
      },
      {
        keywords: ['falar com atendente', 'falar com humano', 'falar com pessoa', 'atendimento humano', 'quero falar com alguem', 'quero falar com alguém'],
        answer: 'Sem problemas! Vou te passar direto para nossa equipe. \ud83d\ude0a',
        linkText: '\ud83d\udcac Falar com atendente',
        linkHref: 'https://wa.me/5516996062046?text=Ol%C3%A1%2C+vim+pelo+site+da+Sorveteria+Itapolitana+e+quero+falar+com+um+atendente',
        external: true
      },
      {
        keywords: ['instagram', 'insta', 'facebook', 'redes sociais', 'seguir'],
        answer: 'Acompanhe as novidades nas redes sociais:',
        linkText: '\ud83d\udcf8 Instagram',
        linkHref: 'https://www.instagram.com/sorveteriaitapolitanacajuru',
        external: true,
        linkText2: '\ud83d\udcd8 Facebook',
        linkHref2: 'https://www.facebook.com/itapolitanacajuru/',
        external2: true
      },
      {
        keywords: ['sobre vocês', 'sobre voces', 'quem são vocês', 'história', 'historia', 'quem somos', 'sobre a sorveteria'],
        answer: 'A Sorveteria Itapolitana prepara sorvetes, a\u00e7a\u00eds e milkshakes com receitas especiais desde 2007 para Cajuru e regi\u00e3o.',
        linkText: '\ud83c\udfea Sobre a loja',
        linkHref: 'sobre.html'
      }
    ];

    /* ─────────────────────────────────────────────────────────────────
       HANDLERS DE PRODUTO
       Todos lêem dados de _prodData sem preços hardcoded.
       Fallbacks numéricos apenas quando fonte indisponível.
    ─────────────────────────────────────────────────────────────────── */

    function _saboresMassa() {
      var official = (_prodData && Array.isArray(_prodData.sabores_sorvete))
        ? _prodData.sabores_sorvete.map(function (item) { return typeof item === 'string' ? item : (item && item.nome); }).filter(Boolean)
        : [];
      if (official.length) return official;
      var legacy = (_prodData && _prodData.sorvetes && Array.isArray(_prodData.sorvetes.sabores)) ? _prodData.sorvetes.sabores : [];
      return legacy.map(function (item) { return typeof item === 'string' ? item : (item && item.nome); }).filter(Boolean);
    }

    function _respSorvetes() {
      var sabores = _saboresMassa();
      var precos  = (_prodData && _prodData.sorvetes) ? (_prodData.sorvetes.precos || _prodData.sorvetes.preços || null) : null;
      var n    = sabores.length || 39;
      var prev = sabores.length > 0
        ? sabores.slice(0, 8).join(', ') + ' e mais ' + (sabores.length - 8) + '...'
        : 'Chocolate, Nutella, Morango Trufado, Pistache, Kinder Ovo (choc. branco) e mais!';
      var casquinha = (precos && precos.casquinha) ? precos.casquinha : null;
      var copo = (precos && precos.copo) ? precos.copo : null;
      var pMinCasquinha = casquinha && casquinha['1 Bola'] != null ? 'R$ ' + casquinha['1 Bola'].toFixed(2).replace('.', ',') : 'R$ 8,00';
      var pMinCopo = copo && copo['1 Bola'] != null ? 'R$ ' + copo['1 Bola'].toFixed(2).replace('.', ',') : 'R$ 8,00';
      return {
        answer: '\ud83c\udf66 Temos ' + n + ' sabores Sorvete Itapolitana!\n\n\u2728 Destaques: ' + prev + '\n\n\ud83d\udcb0 1 bola: casquinha ' + pMinCasquinha + ' · copo ' + pMinCopo + '.\nVer card\u00e1pio completo e fazer pedido:',
        linkText: '\ud83c\udf66 Ver todos os sabores',
        linkHref: 'encomendas.html',
        chips: ['\ud83e\uddd0 Pre\u00e7os de sorvete', '\ud83e\uddc2 Caixas para festas', '\ud83c\udf78 Milkshakes', '\ud83e\uded0 A\u00e7a\u00ed']
      };
    }

    function _respAcai() {
      var copos = (_prodData && _prodData.acai && _prodData.acai.copos) ? _prodData.acai.copos : null;
      var linha = copos
        ? Object.keys(copos).map(function (k) { return k + ' R$ ' + copos[k].toFixed(2).replace('.', ','); }).join(' \u00b7 ')
        : '300ml R$ 15 \u00b7 360ml R$ 16 \u00b7 400ml R$ 17 \u00b7 600ml R$ 20';
      return {
        answer: '\ud83e\uded0 A\u00e7a\u00ed Sorvete Itapolitana!\n\nTamanhos: ' + linha + '\n\nComplementos:\n\ud83c\udf53 Frutas: Morango, Banana, Uva, Kiwi, Abacaxi \u2192 R$ 2,00\n\ud83c\udf6b Cremes (Nutella, Ninho, Pistache) \u2192 R$ 3,00\n\ud83c\udf6d Guloseimas (Granola, Ovomaltine, Leite Cond.) \u2192 R$ 2,00\n\ud83c\udf2b Chocolates (Kit Kat, Oreo, Kinder Bueno) \u2192 R$ 4,00',
        linkText: '\ud83e\uded0 Ver card\u00e1pio completo',
        linkHref: 'encomendas.html',
        chips: ['\ud83c\udf66 Sorvetes', '\ud83c\udf78 Milkshakes', '\ud83c\udf60 Picol\u00e9s', '\ud83c\udf68 Ta\u00e7as']
      };
    }

    function _respPicoles() {
      var p = (_prodData && (_prodData.picolés || _prodData.picoles)) ? (_prodData.picolés || _prodData.picoles) : null;
      var fruta  = (p && p.frutas_agua)                                                   ? p.frutas_agua.preco_varejo.toFixed(2).replace('.', ',')       : '2,50';
      var leite  = (p && p.leite_com_recheio && p.leite_com_recheio.preco_varejo != null) ? p.leite_com_recheio.preco_varejo.toFixed(2).replace('.', ',') : '3,00';
      var ninho  = (p && p.leite_ninho  && p.leite_ninho.preco_varejo  != null)           ? p.leite_ninho.preco_varejo.toFixed(2).replace('.', ',')       : '4,00';
      var eskimo = (p && (p.esquímós || p.esquimos) && (p.esquímós || p.esquimos).preco_varejo != null) ? (p.esquímós || p.esquimos).preco_varejo.toFixed(2).replace('.', ',') : '8,00';
      return {
        answer: '\ud83c\udf60 Picol\u00e9s Sorvete Itapolitana!\n\n' +
                '\ud83c\udf4a Fruta/\u00c1gua \u2014 R$ ' + fruta + ' (Abacaxi, Caju, Groselha, Lim\u00e3o, Melancia, Uva...)\n' +
                '\ud83e\udd5b Leite sem Recheio \u2014 R$ 2,50 (Coco Queimado, Milho Verde, Amendoim, Pistache)\n' +
                '\ud83c\udf53 Leite com Recheio \u2014 R$ ' + leite + ' (A\u00e7a\u00ed, Blue Ice (Algodão Doce Azul), Morango, Chocolate...)\n' +
                '\ud83c\udf3c Picol\u00e9 Especiais \u2014 R$ ' + ninho + ' (Leite Ninho e Ovomaltine)\n' +
                '\ud83c\udf6b Picol\u00e9 Esquim\u00f3 (coberto) \u2014 R$ ' + eskimo + ' (inc. Ovomaltine)\n' +
                '\ud83d\udce6 Atacado (m\u00edn. 100 un.) via encomenda!',
        linkText: '\ud83d\udce6 Ver encomendas',
        linkHref: 'encomendas.html',
        chips: ['\ud83d\udce6 Atacado de picol\u00e9s', '\ud83c\udf6b Picol\u00e9 Esquim\u00f3', '\ud83c\udf66 Sorvetes', '\ud83e\uded0 A\u00e7a\u00ed']
      };
    }

    function _respTacas() {
      var trad = (_prodData && _prodData.tacas && _prodData.tacas.tradicionais) ? _prodData.tacas.tradicionais : null;
      var lista = trad
        ? Object.keys(trad).slice(0, 5).map(function (k) { return k + ' R$ ' + trad[k].toFixed(2).replace('.', ','); }).join('\n')
        : 'Colegial R$ 20 \u00b7 Sundae R$ 23 \u00b7 Banana Split R$ 25 \u00b7 Universit\u00e1rio R$ 23 \u00b7 Ula-Ula R$ 48';
      return {
        answer: '\ud83c\udf68 Ta\u00e7as e Sobremesas!\n\n\u2728 Ta\u00e7as tradicionais:\n' + lista + '\n\n\ud83c\udf6b Ta\u00e7as sujas (Prest\u00edgio, Bis, Kit Kat, Sonho de Valsa) \u2014 R$ 42-45\n\n\ud83e\udd82 Tamb\u00e9m: Brownie R$ 20, Fondue R$ 25, Petit G\u00e2teau R$ 20, Torta de Sorvete R$ 100',
        linkText: '\ud83c\udf68 Ver card\u00e1pio completo',
        linkHref: 'encomendas.html',
        chips: ['\ud83c\udf66 Sorvetes', '\ud83e\uded0 A\u00e7a\u00ed', '\ud83c\udf78 Milkshakes']
      };
    }

    function _respMilkshake() {
      var mk   = (_prodData && _prodData.milkshake && _prodData.milkshake.tradicional) ? _prodData.milkshake.tradicional : null;
      var pMin = (mk && mk['300ml'] != null) ? 'R$ ' + mk['300ml'].toFixed(2).replace('.', ',') : 'R$ 17,00';
      var pMax = (mk && mk['750ml'] != null) ? 'R$ ' + mk['750ml'].toFixed(2).replace('.', ',') : 'R$ 28,00';
      return {
        answer: '\ud83e\udd64 Milkshakes em copo transparente com tampa bolha!\n\nTradicional: 300ml ' + pMin + ' \u00b7 400ml R$ 20 \u00b7 500ml R$ 22 \u00b7 750ml ' + pMax + '\nTop: 360ml R$ 20 \u00b7 600ml R$ 24\n\n\u2795 Adicional Ovomaltine R$ 3,00!',
        linkText: '\ud83e\udd64 Ver card\u00e1pio',
        linkHref: 'encomendas.html',
        chips: ['\ud83c\udf66 Sorvetes', '\ud83e\uded0 A\u00e7a\u00ed', '\ud83c\udf68 Ta\u00e7as']
      };
    }

    function _respEncomendas() {
      return {
        answer: '\ud83d\udce6 Encomendas e Festas!\n\nO processo \u00e9 simples:\n1\ufe0f\u20e3 Escolha os produtos no site\n2\ufe0f\u20e3 Pague antecipado (Pix, cart\u00e3o ou dinheiro)\n3\ufe0f\u20e3 Retire na loja em 3 dias \u00fateis\n\n\ud83e\udd82 Op\u00e7\u00f5es:\n\ud83c\udf82 Torta de Sorvete R$ 100 (at\u00e9 3 sabores)\n\ud83e\uddc8 Caixa 5L a partir de R$ 100\n\ud83e\uddc8 Caixa 10L a partir de R$ 150\n\ud83c\udf60 Picol\u00e9s atacado (m\u00edn. 100 un.)\n\ud83d\udedc Carrinho para Eventos (consulte)',
        linkText: '\ud83d\udce6 Fazer encomenda online',
        linkHref: 'encomendas.html',
        chips: ['\ud83d\udcac Falar no WhatsApp', '\ud83c\udf66 Ver card\u00e1pio']
      };
    }

    /* ── Picolé Especiais de Ovomaltine ── */
    function _respPicoleEspecialOvomaltine(atacado) {
      var p      = _prodData && _prodData.picoles && _prodData.picoles.leite_ninho;
      var varejo = (p && p.preco_varejo  != null) ? p.preco_varejo  : 4;
      var atac   = (p && p.preco_atacado != null) ? p.preco_atacado : 3;
      var vStr   = 'R$ ' + varejo.toFixed(2).replace('.', ',');
      var aStr   = 'R$ ' + atac.toFixed(2).replace('.', ',');
      if (atacado) {
        return {
          answer: '\ud83d\udce6 Picol\u00e9 Especiais de Ovomaltine no atacado:\n\n' + aStr + '/unidade (m\u00ednimo 100 un.)\n\u23f1 Prazo: 3 dias \u00fateis \u00b7 Pagamento antecipado.',
          linkText: '\ud83d\udcac Pedir pelo WhatsApp',
          linkHref: 'https://wa.me/5516996062046?text=Ol%C3%A1%2C+quero+encomendar+picol%C3%A9+Especiais+de+Ovomaltine+no+atacado',
          external: true,
          chips: ['\ud83d\udce6 Fazer encomenda', '\ud83c\udf6b Picol\u00e9 Esquim\u00f3 de Ovomaltine']
        };
      }
      return {
        answer: '\ud83c\udf3c Picol\u00e9 Especiais de Ovomaltine!\n\n\ud83d\udcb0 ' + vStr + ' no varejo\n\ud83d\udce6 ' + aStr + '/un no atacado (m\u00edn. 100 un., prazo 3 dias \u00fateis).',
        linkText: '\ud83d\udce6 Fazer encomenda',
        linkHref: 'encomendas.html',
        chips: ['\ud83d\udce6 Atacado de picol\u00e9s', '\ud83c\udf66 Sorvete de Ovomaltine', '\ud83d\udcac Falar no WhatsApp']
      };
    }

    /* ── Picolés AO LEITE Premium Eskimós de Ovomaltine ── */
    function _respEskimoOvomaltine(atacado) {
      var p      = _prodData && _prodData.picoles && _prodData.picoles.esqu\u00edm\u00f3s;
      var varejo = (p && p.preco_varejo  != null) ? p.preco_varejo  : 8;
      var atac   = (p && p.preco_atacado != null) ? p.preco_atacado : 6;
      var vStr   = 'R$ ' + varejo.toFixed(2).replace('.', ',');
      var aStr   = 'R$ ' + atac.toFixed(2).replace('.', ',');
      if (atacado) {
        return {
          answer: '\ud83d\udce6 Picol\u00e9 Esquim\u00f3 de Ovomaltine no atacado:\n\n' + aStr + '/unidade (m\u00ednimo 100 un.)\n\u23f1 Prazo: 3 dias \u00fateis \u00b7 Pagamento antecipado.',
          linkText: '\ud83d\udcac Pedir pelo WhatsApp',
          linkHref: 'https://wa.me/5516996062046?text=Ol%C3%A1%2C+quero+encomendar+picol%C3%A9+Esquim%C3%B3+de+Ovomaltine+no+atacado',
          external: true,
          chips: ['\ud83d\udce6 Fazer encomenda', '\ud83c\udf3c Picol\u00e9 Especiais de Ovomaltine']
        };
      }
      return {
        answer: '\ud83c\udf6b Picol\u00e9 Esquim\u00f3 de Ovomaltine \u2014 coberto com chocolate!\n\n\ud83d\udcb0 ' + vStr + ' no varejo\n\ud83d\udce6 ' + aStr + '/un no atacado (m\u00edn. 100 un.)\n\n\u2728 Outros sabores do Esquim\u00f3: Bombom, Nutella, Leite Ninho, Nata, Morango, Brigadeiro, Prest\u00edgio.',
        linkText: '\ud83d\udce6 Fazer encomenda',
        linkHref: 'encomendas.html',
        chips: ['\ud83c\udf3c Picol\u00e9 Especiais de Ovomaltine', '\ud83c\udf66 Sorvete de Ovomaltine', '\ud83d\udce6 Atacado de picol\u00e9s']
      };
    }

    /* ── Picolés AO LEITE Especiais de Leite Ninho ── */
    function _respPicoleLeiteNinho(atacado) {
      var p      = _prodData && _prodData.picoles && _prodData.picoles.leite_ninho;
      var varejo = (p && p.preco_varejo  != null) ? p.preco_varejo  : 4;
      var atac   = (p && p.preco_atacado != null) ? p.preco_atacado : 3;
      var vStr   = 'R$ ' + varejo.toFixed(2).replace('.', ',');
      var aStr   = 'R$ ' + atac.toFixed(2).replace('.', ',');
      if (atacado) {
        return {
          answer: '\ud83d\udce6 Picol\u00e9 Especial de Leite Ninho no atacado:\n\n' + aStr + '/unidade (m\u00ednimo 100 un.)\n\u23f1 Prazo: 3 dias \u00fateis \u00b7 Pagamento antecipado.',
          linkText: '\ud83d\udcac Pedir pelo WhatsApp',
          linkHref: 'https://wa.me/5516996062046?text=Ol%C3%A1%2C+quero+encomendar+picol%C3%A9+Especiais+de+Leite+Ninho+no+atacado',
          external: true,
          chips: ['\ud83d\udce6 Fazer encomenda', '\ud83c\udf3c Picol\u00e9 Especiais de Ovomaltine']
        };
      }
      return {
        answer: '\ud83c\udf3c Picol\u00e9 Especial de Leite Ninho!\n\n\ud83d\udcb0 ' + vStr + ' no varejo\n\ud83d\udce6 ' + aStr + '/un no atacado (m\u00edn. 100 un., prazo 3 dias \u00fateis).',
        linkText: '\ud83d\udce6 Fazer encomenda',
        linkHref: 'encomendas.html',
        chips: ['\ud83d\udce6 Atacado de picol\u00e9s', '\ud83c\udf3c Picol\u00e9 Especiais de Ovomaltine', '\ud83d\udcac Falar no WhatsApp']
      };
    }

    /* ── Picolés AO LEITE Premium Eskimós genérico (sem Ovomaltine) ── */
    function _respEskimo(atacado) {
      var p      = _prodData && _prodData.picoles && _prodData.picoles.esqu\u00edm\u00f3s;
      var varejo = (p && p.preco_varejo  != null) ? p.preco_varejo  : 8;
      var atac   = (p && p.preco_atacado != null) ? p.preco_atacado : 6;
      var vStr   = 'R$ ' + varejo.toFixed(2).replace('.', ',');
      var aStr   = 'R$ ' + atac.toFixed(2).replace('.', ',');
      if (atacado) {
        return {
          answer: '\ud83d\udce6 Picol\u00e9 Esquim\u00f3 no atacado:\n\n' + aStr + '/unidade (m\u00ednimo 100 un.)\n\u23f1 Prazo: 3 dias \u00fateis \u00b7 Pagamento antecipado.',
          linkText: '\ud83d\udcac Pedir pelo WhatsApp',
          linkHref: 'https://wa.me/5516996062046?text=Ol%C3%A1%2C+quero+encomendar+picol%C3%A9+Esquim%C3%B3+no+atacado',
          external: true,
          chips: ['\ud83d\udce6 Fazer encomenda', '\ud83c\udf60 Picol\u00e9s']
        };
      }
      return {
        answer: '\ud83c\udf6b Picol\u00e9 Esquim\u00f3 \u2014 coberto com chocolate!\n\n\ud83d\udcb0 ' + vStr + ' no varejo\n\ud83d\udce6 ' + aStr + '/un no atacado (m\u00edn. 100 un.)\n\nSabores: Bombom, Nutella, Ovomaltine, Leite Ninho, Nata, Morango, Brigadeiro, Prest\u00edgio.',
        linkText: '\ud83d\udce6 Fazer encomenda',
        linkHref: 'encomendas.html',
        chips: ['\ud83d\udce6 Atacado de picol\u00e9s', '\ud83c\udf60 Picol\u00e9s', '\ud83d\udcac Falar no WhatsApp']
      };
    }

    /* ── Busca dinâmica de sabor de sorvete ── */
    function _buscarSabor(msg) {
      var sabores = _saboresMassa();
      if (!sabores.length) return null;
      var l = _norm(msg);
      var encontrado = null;
      for (var i = 0; i < sabores.length; i++) {
        var sNorm = _norm(sabores[i]);
        if (l.indexOf(sNorm) !== -1) { encontrado = sabores[i]; break; }
        var partes = sNorm.split(' ');
        for (var j = 0; j < partes.length; j++) {
          if (partes[j].length >= 4 && l.indexOf(partes[j]) !== -1) { encontrado = sabores[i]; break; }
        }
        if (encontrado) break;
      }
      if (!encontrado) return null;
      var precos = _prodData.sorvetes.precos || _prodData.sorvetes.preços || {};
      var casquinha = precos.casquinha || {};
      var copo = precos.copo || {};
      function _linhaFormato(label, tabela) {
        return label + ': 1 bola R$ ' + Number(tabela['1 Bola'] ?? 8).toFixed(2).replace('.', ',') + ' · 2 bolas R$ ' + Number(tabela['2 Bolas'] ?? 10).toFixed(2).replace('.', ',') + ' · 3 bolas R$ ' + Number(tabela['3 Bolas'] ?? 12).toFixed(2).replace('.', ',');
      }
      var linhaPre = _linhaFormato('Casquinha', casquinha) + ' · ' + _linhaFormato('Copo', copo);
      return {
        answer: '\ud83c\udf66 Temos ' + encontrado + '! \ud83d\ude0b\n\nPre\u00e7os: ' + linhaPre + '\n\nGostaria de ver outras op\u00e7\u00f5es ou o card\u00e1pio completo?',
        linkText: '\ud83c\udf66 Ver card\u00e1pio completo',
        linkHref: 'encomendas.html',
        chips: ['\ud83e\uddd0 Outros pre\u00e7os', '\ud83c\udf78 Milkshakes', '\ud83e\uded0 A\u00e7a\u00ed', '\ud83d\udce6 Fazer encomenda']
      };
    }

    /* ── Promoções ── */
    function _respPromoAtiva() {
      if (_promoData && _promoData.ativo) {
        return {
          answer: '\ud83c\udf89 ' + (_promoData.titulo || 'Promo\u00e7\u00e3o ativa!') + '\n\n' + (_promoData.descricao || ''),
          linkText: _promoData.btnTexto || '\ud83c\udf81 Ver promo\u00e7\u00e3o',
          linkHref: 'promocao.html'
        };
      }
      return {
        answer: '\ud83c\udf89 Promo\u00e7\u00f5es e Sorteios\n\n\u26a0\ufe0f O cadastro para o sorteio da caixa de sorvete foi encerrado. A campanha teve mais de 1.400 inscritos, e os sorteios mensais de 1 caixa seguem at\u00e9 dezembro de 2026 para quem j\u00e1 se cadastrou.\n\n\ud83c\udf70 Inscri\u00e7\u00f5es j\u00e1 est\u00e3o abertas para o sorteio mensal de uma torta de sorvete. O sorteio da torta come\u00e7a em janeiro de 2027.\n\n\ud83d\udcdd Cadastre-se exclusivamente pelo site oficial da Itapolitana Cajuru: itapolitanacajuru.com.br, na aba Promo\u00e7\u00e3o.',
        linkText: '\ud83c\udf81 Ver inscri\u00e7\u00e3o para 2027',
        linkHref: 'promocao.html',
        chips: ['\ud83e\uded0 Promo\u00e7\u00f5es de a\u00e7a\u00ed', '\ud83c\udf66 Pre\u00e7os de sorvete']
      };
    }

    function _respPromoAcai() {
      var copos = (_prodData && _prodData.acai && _prodData.acai.copos) ? _prodData.acai.copos : null;
      var acaiPromo = (_prodData && _prodData.acai_promocao) ? _prodData.acai_promocao : null;
      var txt = '\ud83e\uded0 Pre\u00e7os do A\u00e7a\u00ed Sorvete Itapolitana!\n\n';
      if (copos) {
        txt += Object.keys(copos).map(function (k) { return k + ': R$ ' + copos[k].toFixed(2).replace('.', ','); }).join('\n');
      } else {
        txt += '300ml R$ 15 \u00b7 360ml R$ 16 \u00b7 400ml R$ 17 \u00b7 600ml R$ 20';
      }
      if (acaiPromo && acaiPromo.length) {
        txt += '\n\n\ud83d\udd25 Combos especiais:\n' + acaiPromo.slice(0, 3).map(function (p) { return '\u2022 ' + p.nome + ' ' + p.desc + ' \u2014 R$ ' + p.preco.toFixed(2).replace('.', ','); }).join('\n');
      }
      return { answer: txt, linkText: '\ud83e\uded0 Ver card\u00e1pio do a\u00e7a\u00ed', linkHref: 'encomendas.html' };
    }

    function _respPromoSorvetes() {
      var precos = (_prodData && _prodData.sorvetes) ? (_prodData.sorvetes.precos || _prodData.sorvetes.preços || {}) : {};
      function _linhaPreco(tabela) {
        return '1 bola R$ ' + Number(tabela['1 Bola'] ?? 8).toFixed(2).replace('.', ',') + ' · 2 bolas R$ ' + Number(tabela['2 Bolas'] ?? 10).toFixed(2).replace('.', ',') + ' · 3 bolas R$ ' + Number(tabela['3 Bolas'] ?? 12).toFixed(2).replace('.', ',');
      }
      var linhaCasquinha = _linhaPreco(precos.casquinha || {});
      var linhaCopo = _linhaPreco(precos.copo || {});
      return {
        answer: '\ud83c\udf66 Pre\u00e7os dos sorvetes Sorvete Itapolitana!\n\nCasquinha: ' + linhaCasquinha + '\nCopo: ' + linhaCopo + '\n\n39 Sabores para escolher! Veja o cardápio completo:',
        linkText: '\ud83c\udf66 Ver card\u00e1pio',
        linkHref: 'encomendas.html'
      };
    }

    /* ── Fidelidade (encerrado — resposta via callback) ── */
    function _buscarPontosAsync(nome, dataStr) {
      var dataNorm = null;
      var partes = dataStr.replace(/[.\-]/g, '/').split('/');
      if (partes.length === 3) {
        var dd   = parseInt(partes[0], 10);
        var mm   = parseInt(partes[1], 10);
        var aaaa = parseInt(partes[2], 10);
        if (!isNaN(dd) && !isNaN(mm) && !isNaN(aaaa) &&
            dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 &&
            aaaa >= 1900 && aaaa <= 2099 && String(partes[2]).length === 4) {
          dataNorm = String(aaaa) + '-' + String(mm).padStart(2, '0') + '-' + String(dd).padStart(2, '0');
        }
      }
      var primeiro = (nome || '').trim().split(' ')[0] || 'cliente';
      return {
        __async: true,
        __asyncFn: function (cb) {
          var resp;
          if (!dataNorm) {
            resp = {
              answer: 'N\u00e3o entendi a data \ud83d\ude05\n\nUse o formato DD/MM/AAAA, por exemplo: 15/03/1995',
              chips: ['\ud83d\udd04 Tentar novamente']
            };
          } else {
            resp = {
              answer: 'O programa de fidelidade foi encerrado, ' + primeiro + '. Fale conosco pelo WhatsApp se tiver d\u00favidas! \ud83d\udcac',
              chips: ['\ud83d\udcac Atendimento no WhatsApp']
            };
          }
          setTimeout(function () { cb(resp); }, 0);
        }
      };
    }

    /* ── Handler de contexto (FSM) ── */
    function _handleContexto(msg) {
      var l = _norm(msg);
      if (_ctx === 'await_cardapio_cat') {
        _ctx = null;
        if (l.indexOf('sorvete') !== -1 || l.indexOf('massa') !== -1 || l.indexOf('bola') !== -1 || l.indexOf('sabor') !== -1) return _respSorvetes();
        if (l.indexOf('picol') !== -1) return _respPicoles();
        if (l.indexOf('acai') !== -1 || l.indexOf('açai') !== -1) return _respAcai();
        if (l.indexOf('taca') !== -1 || l.indexOf('taça') !== -1 || l.indexOf('sobremesa') !== -1 || l.indexOf('brownie') !== -1) return _respTacas();
        if (l.indexOf('milk') !== -1 || l.indexOf('shake') !== -1) return _respMilkshake();
        if (l.indexOf('encomen') !== -1 || l.indexOf('festa') !== -1 || l.indexOf('caixa') !== -1 || l.indexOf('torta') !== -1) return _respEncomendas();
        _ctx = 'await_cardapio_cat';
        return { answer: 'N\u00e3o entendi a categoria \ud83d\ude05 Escolha uma op\u00e7\u00e3o:', chips: ['\ud83c\udf66 Sorvetes', '\ud83e\uded0 A\u00e7a\u00ed', '\ud83c\udf60 Picol\u00e9s', '\ud83c\udf68 Ta\u00e7as', '\ud83e\udd64 Milkshakes', '\ud83d\udce6 Encomendas'] };
      }
      if (_ctx === 'await_promo_cat') {
        _ctx = null;
        if (l.indexOf('acai') !== -1 || l.indexOf('açai') !== -1) return _respPromoAcai();
        if (l.indexOf('sorvete') !== -1 || l.indexOf('preco') !== -1 || l.indexOf('preço') !== -1) return _respPromoSorvetes();
        return _respPromoAtiva();
      }
      if (_ctx === 'await_fid_nome') {
        _ctxData.nome = msg.trim();
        _ctx = 'await_fid_nascimento';
        var prim = msg.trim().split(' ')[0] || 'cliente';
        return { answer: '\u00d3timo, ' + prim + '! \ud83d\ude0a Agora me diga sua data de nascimento no formato DD/MM/AAAA:' };
      }
      if (_ctx === 'await_fid_nascimento') {
        _ctx = null;
        return _buscarPontosAsync((_ctxData.nome || '').trim(), msg);
      }
      return null;
    }

    /* ── Monta payload a partir de entrada da base de conhecimento ── */
    function _montarResposta(entry) {
      return {
        answer:    entry.answer    || '',
        linkText:  entry.linkText  || '',
        linkHref:  (entry.linkHref && entry.linkHref.indexOf(['java', 'script:'].join('')) === -1) ? entry.linkHref : '',
        external:  !!entry.external,
        linkText2: entry.linkText2 || '',
        linkHref2: (entry.linkHref2 && entry.linkHref2.indexOf(['java', 'script:'].join('')) === -1) ? entry.linkHref2 : '',
        external2: !!entry.external2,
        chips:     entry.chips     || []
      };
    }

    /* ─────────────────────────────────────────────────────────────────
       ROTEAMENTO PRINCIPAL
       Prioridades obrigatórias:
       1. Picolé + Ovomaltine
       2. Esquimó + Ovomaltine
       3. Sorvete + Ovomaltine
       4. Picolé + Leite Ninho
       5. Esquimó genérico
       6. Categoria (cardápio, promo, fidelidade)
       7. Base de conhecimento
       8. RESPOSTAS estáticas
       9. Busca de sabor
      10. Fallback
    ─────────────────────────────────────────────────────────────────── */
    function _getResponse(msg) {
      var l  = _norm(msg);
      var cr = _handleContexto(msg);
      if (cr) return cr;

      /* Sinais semânticos */
      var temOvo    = l.indexOf('ovomalt') !== -1;
      var temEskimo = l.indexOf('eskimo') !== -1 || l.indexOf('esquimo') !== -1 || l.indexOf('coberto') !== -1;
      var temPicol  = l.indexOf('picole') !== -1 || l.indexOf('picolé') !== -1;
      var temSorv   = l.indexOf('sorvete') !== -1;
      var temAtac   = l.indexOf('atacado') !== -1 || l.indexOf('encomend') !== -1 || l.indexOf('atacad') !== -1;
      var temNinho  = l.indexOf('ninho') !== -1;

      /* ── Desambiguação Ovomaltine ── */
      if (temOvo) {
        if (temEskimo)                    return _respEskimoOvomaltine(temAtac);
        if (temPicol && !temSorv)         return _respPicoleEspecialOvomaltine(temAtac);
        if (temSorv  && !temPicol)        { var sf0 = _buscarSabor('sorvete de ovomaltine'); if (sf0) return sf0; }
        if (temAtac) {
          return {
            answer: '\ud83e\udd14 Qual produto de Ovomaltine no atacado?\n\n\ud83c\udf3c Picol\u00e9 Especiais \u2014 R$ 3,00/un (m\u00edn. 100)\n\ud83c\udf6b Picol\u00e9 Esquim\u00f3 (coberto) \u2014 R$ 6,00/un (m\u00edn. 100)',
            chips: ['\ud83c\udf3c Picol\u00e9 Especiais de Ovomaltine atacado', '\ud83c\udf6b Picol\u00e9 Esquim\u00f3 de Ovomaltine atacado', '\ud83d\udcac Falar no WhatsApp']
          };
        }
        return {
          answer: '\ud83e\udd14 Temos Ovomaltine em tr\u00eas produtos!\n\n\ud83c\udf3c Picol\u00e9 Especiais de Ovomaltine \u2014 R$ 4,00 varejo\n\ud83c\udf6b Picol\u00e9 Esquim\u00f3 de Ovomaltine (coberto) \u2014 R$ 8,00 varejo\n\ud83c\udf66 Sorvete de Ovomaltine \u2014 vendido por bola\n\nQual voc\u00ea quer saber?',
          chips: ['\ud83c\udf3c Picol\u00e9 Especiais de Ovomaltine', '\ud83c\udf6b Picol\u00e9 Esquim\u00f3 de Ovomaltine', '\ud83c\udf66 Sorvete de Ovomaltine']
        };
      }

      /* ── Esquimó genérico (sem Ovomaltine) ── */
      if (temEskimo && !temOvo) return _respEskimo(temAtac);



      /* ── Picolé de Leite Ninho ── */
      if (temNinho && !temOvo && !temEskimo && (temPicol || temAtac)) return _respPicoleLeiteNinho(temAtac);

      /* ── Busca por sabor de sorvete específico ── */
      var SORVETE_DE_RE = /\btem\b/;
      if (l.indexOf('sorvete de') !== -1 || l.indexOf('preco do') !== -1 || l.indexOf('preço do') !== -1 || SORVETE_DE_RE.test(l)) {
        var sf = _buscarSabor(msg);
        if (sf) return sf;
      }

      /* ── Cardápio ── */
      if (l === 'cardapio' || l === 'menu' || l.indexOf('cardapio') !== -1 || l.indexOf('cardápio') !== -1) {
        _ctx = 'await_cardapio_cat';
        return {
          answer: 'Que \u00f3timo! \ud83d\ude0b Qual categoria te interessa?',
          chips: ['\ud83c\udf66 Sorvetes de massa', '\ud83e\uded0 A\u00e7a\u00ed', '\ud83c\udf60 Picol\u00e9s', '\ud83c\udf68 Ta\u00e7as e Sobremesas', '\ud83e\udd64 Milkshakes', '\ud83d\udce6 Encomendas / Festas']
        };
      }

      /* ── Promoções ── */
      if (l.indexOf('promo') !== -1 || l.indexOf('oferta') !== -1 || l.indexOf('desconto') !== -1) {
        if (_promoData && _promoData.ativo) return _respPromoAtiva();
        _ctx = 'await_promo_cat';
        return {
          answer: 'Temos op\u00e7\u00f5es incr\u00edveis! \ud83c\udf89 Sobre qual voc\u00ea quer saber?',
          chips: ['\ud83e\uded0 Pre\u00e7os do A\u00e7a\u00ed', '\ud83c\udf66 Pre\u00e7os de Sorvete', '\ud83c\udf81 Sorteio mensal', '\ud83c\udf89 Ver tudo']
        };
      }

      /* ── Picolés genéricos ou específicos ── */
      if (temPicol || l.indexOf('picole') !== -1 || l.indexOf('picolé') !== -1 || l.indexOf('sorvete no pau') !== -1) {
        if (temNinho) return _respPicoleLeiteNinho(temAtac);
        return _respPicoles();
      }

      /* ── Açaí ── */
      if (l.indexOf('acai') !== -1 || l.indexOf('açai') !== -1) {
        return _respAcai();
      }

      /* ── Milkshakes ── */
      if (l.indexOf('milk') !== -1 || l.indexOf('shake') !== -1) {
        return _respMilkshake();
      }

      /* ── Taças e Sobremesas ── */
      if (l.indexOf('taca') !== -1 || l.indexOf('taça') !== -1 || l.indexOf('sobremesa') !== -1 || l.indexOf('brownie') !== -1 || l.indexOf('fondue') !== -1) {
        return _respTacas();
      }

      /* ── Encomendas, Retirada e Caixas ── */
      if (l.indexOf('encomen') !== -1 || l.indexOf('retirada') !== -1 || l.indexOf('caixa') !== -1 || l.indexOf('torta') !== -1 || l.indexOf('festa') !== -1 || l.indexOf('pedido') !== -1) {
        return _respEncomendas();
      }

      /* ── Fidelidade ── */
      if (l.indexOf('fidelidade') !== -1 || l.indexOf('pontos') !== -1 || l.indexOf('cadastro') !== -1) {
        _ctxData = {};
        _ctx = 'await_fid_nome';
        return { answer: 'Vamos consultar seu cadastro 😊 Qual é seu nome completo?' };
      }

      /* ── Base de conhecimento ── */
      for (var i = 0; i < itaBotKnowledge.length; i++) {
        var entry = itaBotKnowledge[i];
        if (!entry || !Array.isArray(entry.keywords)) continue;
        for (var j = 0; j < entry.keywords.length; j++) {
          if (l.indexOf(_norm(entry.keywords[j])) !== -1) {
            return _montarResposta(entry);
          }
        }
      }

      /* ── Respostas estáticas ── */
      for (var k in RESPOSTAS) {
        if (Object.prototype.hasOwnProperty.call(RESPOSTAS, k) && k !== 'default' && l.indexOf(_norm(k)) !== -1) {
          var r = typeof RESPOSTAS[k] === 'function' ? RESPOSTAS[k]() : RESPOSTAS[k];
          return { answer: typeof r === 'string' ? r : String(r) };
        }
      }

      /* ── Busca de sabor (segunda tentativa) ── */
      if (_prodData) {
        var sf2 = _buscarSabor(msg);
        if (sf2) return sf2;
      }

      /* ── Fallback ── */
      return {
        answer: 'N\u00e3o entendi direitinho \ud83d\ude05 Mas posso te ajudar com:',
        chips: ['\ud83c\udf66 Card\u00e1pio', '\ud83d\udce6 Encomendas', '\ud83c\udf89 Promo\u00e7\u00f5es', '\ud83d\udccd Localiza\u00e7\u00e3o', '\ud83d\udd59 Hor\u00e1rio', '\ud83d\udcac Atendente']
      };
    }

    /* ─────────────────────────────────────────────────────────────────
       API PÚBLICA DO MOTOR
    ─────────────────────────────────────────────────────────────────── */
    return {
      /**
       * Injeta dados carregados de dados/produtos.json e dados/promo.json.
       * Chamar sempre que os dados forem atualizados.
       */
      loadData: function (prodData, promoData) {
        if (prodData  !== null && prodData  !== undefined) _prodData  = prodData;
        if (promoData !== null && promoData !== undefined) _promoData = promoData;
      },

      /**
       * Mescla uma entrada de FAQ nas respostas estáticas.
       * Não sobrescreve entradas que já são funções.
       * @param {string} tag   Chave normalizada (tag do FAQ)
       * @param {string} texto Texto da resposta
       */
      mergeRespostas: function (tag, texto) {
        var chave = _norm(tag);
        if (typeof RESPOSTAS[chave] !== 'function') {
          RESPOSTAS[chave] = texto;
        }
      },

      /**
       * Processa o texto do usuário e retorna um payload de resposta.
       * @param  {string} text  Texto digitado pelo usuário
       * @return {object}       Payload { answer, chips, linkText, linkHref, ... }
       *                        ou       { __async: true, __asyncFn: fn(callback) }
       */
      getResponse: function (text) {
        return _getResponse(text);
      },

      /** Reinicia o contexto conversacional (FSM e dados acumulados). */
      resetContext: function () {
        _ctx     = null;
        _ctxData = {};
      },

      /** Retorna a base de conhecimento (array de intents). */
      getKnowledge: function () {
        return itaBotKnowledge;
      },

      /** Expõe o normalizador de texto para uso pelas interfaces. */
      norm: _norm
    };
  }

  /* Expõe o namespace global */
  root.ItaBotEngine = {
    createEngine: createEngine,
    norm: _norm
  };

}(window));
