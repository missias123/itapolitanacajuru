




// Estado único do pedido, também exposto para auditoria e testes.
    window.carrinho = window.carrinho || [];
    window.picolesSelecionados = window.picolesSelecionados || {};

    var carrinho = window.carrinho;
    var picolesSelecionados = window.picolesSelecionados;

    var SABORES_SORVETE = [
        "Abacaxi ao Vinho", "Abacaxi Suíço", "Algodão Doce (Blue Ice)", "Amarena", "Ameixa",
        "Banana com Nutella", "Bis e Trufa", "Cereja Trufada", "Chocolate", "Chocolate com Café",
        "Coco Queimado", "Creme Paris", "Croquer", "Doce de Leite", "Ferrero Rocher", "Flocos",
        "Kinder Ovo", "Leite Condensado", "Leite Ninho", "Leite Ninho Folheado", "Leite Ninho com Oreo",
        "Limão", "Limão Suíço", "Menta com Chocolate", "Milho Verde", "Morango Trufado",
        "Mousse de Maracujá", "Mousse de Uva", "Nozes", "Nutella", "Ovomaltine", "Pistache",
        "Prestígio", "Sensação", "Torta de Chocolate"
    ];

    var PICOLES_CATALOGO = {
        "Frutas / Base Água (R$ 1,80)": { preco: 1.80, sabores: ["Abacaxi", "Caju", "Goiaba", "Groselha", "Limão", "Melância", "Uva", "Tamarindo"] },
        "Recheados — Base Leite (R$ 2,00)": { preco: 2.00, sabores: ["Açaí", "Blue Ice (Algodão Doce Azul)", "Caraxi (Abacaxi com Caramelo)", "Coco Branco", "Chocolate", "Amarena", "Leite Condensado", "Mamão Papaia", "Maracujá", "Morango", "Menta com Chocolate", "Nata com Goiaba"] },
        "Sem Recheio — Base Leite (R$ 2,00)": { preco: 2.00, sabores: ["Coco Queimado", "Milho Verde", "Amendoim", "Pistache"] },
        "Especiais — Base Leite (R$ 3,00)": { preco: 3.00, sabores: ["Leite Ninho", "Ovomaltine"] },
        "Esquimós — Base Leite (R$ 6,00)": { preco: 6.00, sabores: ["Bombom", "Nutella", "Ovomaltine", "Leite Ninho", "Nata", "Morango", "Brigadeiro", "Prestígio"] }
    };

    var PRODUTOS = [
        { id: "cx5l_2s", nome: "Caixa 5 Litros - 2 Sabores", preco: 100, max: 2, estoque: 18, esgotado: false },
        { id: "cx5l_3s", nome: "Caixa 5 Litros - 3 Sabores", preco: 115, max: 3, estoque: 18, esgotado: false },
        { id: "cx10l_2s", nome: "Caixa 10 Litros - 2 Sabores", preco: 150, max: 2, estoque: 15, esgotado: false },
        { id: "cx10l_3s", nome: "Caixa 10 Litros - 3 Sabores", preco: 165, max: 3, estoque: 15, esgotado: false }
    ];
    var TORTA_ESTOQUE = { id: "torta1", nome: "Torta de Sorvete", preco: 100, max: 3, estoque: 10, esgotado: false };
    var ACRESCIMOS = [
        { id: "acr_0", nome: "Canudinho Wafer", preco: 0.25, estoque: 100, esgotado: false },
        { id: "acr_1", nome: "Casquinhas", preco: 0.25, estoque: 100, esgotado: false },
        { id: "acr_2", nome: "Cascão", preco: 1.00, estoque: 100, esgotado: false },
        { id: "acr_3", nome: "Cestinha Recheada", preco: 1.00, estoque: 100, esgotado: false },
        { id: "acr_4", nome: "Cobertura 1.3L", preco: 40.00, estoque: 100, esgotado: false }
    ];
    var ESTOQUE_CARREGADO = false;
    var ESTOQUE_URL = "dados/produtos.json";
    var MAPA_PICOLES_ESTOQUE = {
        "Frutas / Base Água (R$ 1,80)": [{ chave: "frutas_agua", sabores: ["Abacaxi", "Caju", "Goiaba", "Groselha", "Limão", "Melância", "Uva", "Tamarindo"] }],
        "Recheados — Base Leite (R$ 2,00)": [{ chave: "leite_com_recheio", sabores: ["Açaí", "Blue Ice (Algodão Doce Azul)", "Caraxi (Abacaxi com Caramelo)", "Coco Branco", "Chocolate", "Amarena", "Leite Condensado", "Mamão Papaia", "Maracujá", "Morango", "Menta com Chocolate", "Nata com Goiaba"] }],
        "Sem Recheio — Base Leite (R$ 2,00)": [{ chave: "leite_sem_recheio", sabores: ["Coco Queimado", "Milho Verde", "Amendoim", "Pistache"] }],
        "Especiais — Base Leite (R$ 3,00)": [
            { chave: "leite_ninho", sabores: ["Leite Ninho"] },
            { chave: "ovomaltine", sabores: ["Ovomaltine"] }
        ],
        "Esquimós — Base Leite (R$ 6,00)": [{ chave: "esquimós", sabores: ["Bombom", "Nutella", "Ovomaltine", "Leite Ninho", "Nata", "Morango", "Brigadeiro", "Prestígio"] }]
    }; 
    var ESTOQUE_PICOLES = {}; 

    function chaveSegura(valor) {
        return String(valor).replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    function normalizarCategoriaPicolé(dados, chave, fallback) {
        var cat = (dados && (dados[chave] || dados[chave.replace('esquímós', 'esquimós')])) || {};
        var lista = Array.isArray(cat.sabores) ? cat.sabores : fallback;
        var estados = {};
        lista.forEach(function (item) {
            var nome = typeof item === 'string' ? item : item && item.nome;
            if (!nome) return;
            estados[nome] = {
                estoque: Math.max(0, Number(item && typeof item === 'object' && item.estoque != null ? item.estoque : (cat.estoque != null ? cat.estoque : 0))),
                esgotado: Boolean((item && typeof item === 'object' && item.esgotado) || cat.esgotado || Number(cat.estoque || 0) <= 0)
            };
        });
        return estados;
    }

    function infoEstoquePicole(tipo, sabor) {
        var grupo = PICOLES_CATALOGO[tipo];
        var info = grupo && grupo.estoquePorSabor ? grupo.estoquePorSabor[sabor] : null;
        return info || { estoque: 0, esgotado: true, chaveEstoque: null };
    }

    function quantidadeSelecionadaDaOrigem(chaveEstoque) {
        if (!chaveEstoque) return 0;
        return Object.entries(picolesSelecionados).reduce(function (total, entrada) {
            var info = infoEstoquePicole(entrada[0].split('|')[0], entrada[0].split('|').slice(1).join('|'));
            return total + (info.chaveEstoque === chaveEstoque ? entrada[1] : 0);
        }, 0);
    }

    function estoqueDisponivelParaSabor(tipo, sabor, atual) {
        var info = infoEstoquePicole(tipo, sabor);
        var reservadoNaOrigem = quantidadeSelecionadaDaOrigem(info.chaveEstoque) - atual;
        return Math.max(0, Math.min(MAX_PICOLES_POR_SABOR, info.estoque - reservadoNaOrigem));
    }

    async function carregarEstoqueEncomendas() {
        try {
            var resposta = await fetch(ESTOQUE_URL + '?v=' + Date.now(), { cache: 'no-store' });
            if (!resposta.ok) throw new Error('Não foi possível ler o estoque oficial.');
            var dados = await resposta.json();
            var caixas = Array.isArray(dados.caixas_enc) ? dados.caixas_enc : [];
            PRODUTOS = PRODUTOS.map(function (padrao) {
                var item = caixas.find(function (c) { return c.id === padrao.id; });
                return item ? Object.assign({}, padrao, { preco: Number(item.preço ?? item.preco ?? padrao.preco), max: Number(item.maxSabores || padrao.max), estoque: Number(item.estoque ?? padrao.estoque), esgotado: Boolean(item.esgotado || Number(item.estoque) <= 0) }) : padrao;
            });
            var tortas = Array.isArray(dados.tortas_enc) ? dados.tortas_enc : [];
            if (tortas[0]) TORTA_ESTOQUE = Object.assign({}, TORTA_ESTOQUE, { preco: Number(tortas[0].preço ?? tortas[0].preco ?? TORTA_ESTOQUE.preco), max: Number(tortas[0].maxSabores || TORTA_ESTOQUE.max), estoque: Number(tortas[0].estoque ?? TORTA_ESTOQUE.estoque), esgotado: Boolean(tortas[0].esgotado || Number(tortas[0].estoque) <= 0) });
            var acrescimos = Array.isArray(dados.acrescimos) ? dados.acrescimos : [];
            ACRESCIMOS = ACRESCIMOS.map(function (padrao) {
                var item = acrescimos.find(function (a) { return a.id === padrao.id; });
                return item ? Object.assign({}, padrao, { nome: item.nome || padrao.nome, preco: Number(item.preço ?? item.preco ?? padrao.preco), estoque: Number(item.estoque ?? padrao.estoque), esgotado: Boolean(item.esgotado || Number(item.estoque) <= 0) }) : padrao;
            });
            var rawPicoles = dados.picolés || dados.picoles || {};
            Object.keys(PICOLES_CATALOGO).forEach(function (tipo) {
                var grupo = PICOLES_CATALOGO[tipo];
                var porSabor = {};
                (MAPA_PICOLES_ESTOQUE[tipo] || []).forEach(function (origem) {
                    var estados = normalizarCategoriaPicolé(rawPicoles, origem.chave, origem.sabores);
                    origem.sabores.forEach(function (sabor) {
                        var estado = estados[sabor] || { estoque: 0, esgotado: true };
                        porSabor[sabor] = Object.assign({}, estado, { chaveEstoque: origem.chave });
                    });
                });
                grupo.estoquePorSabor = porSabor;
            });
            ESTOQUE_CARREGADO = true;
        } catch (erro) {
            console.warn('[Encomendas] estoque não carregado:', erro.message);
            Object.keys(PICOLES_CATALOGO).forEach(function (tipo) {
                PICOLES_CATALOGO[tipo].estoquePorSabor = {};
                PICOLES_CATALOGO[tipo].sabores.forEach(function (sabor) { PICOLES_CATALOGO[tipo].estoquePorSabor[sabor] = { estoque: 0, esgotado: true, chaveEstoque: null }; });
            });
        }
        renderizarCatalogoEncomendas();
    }

    var produtoAtual = null;
    var saboresSelecionados = [];
    // Chave: "Tipo|Sabor"; cada linha mantém preço, quantidade e subtotal próprios.
    var MAX_PICOLES_POR_SABOR = 25;
    var MIN_PICOLES_ATACADO = 100;
    window.toggleSecao = function(id) {
        var el = document.getElementById(id);
        var catPai = el.closest('.categoria');
        var isOpen = el.style.display === 'block';
        
        document.querySelectorAll('.categoria-conteudo').forEach(c => c.style.display = 'none');
        document.querySelectorAll('.categoria').forEach(cat => {
            cat.style.display = 'block';
            cat.classList.remove('open');
        });
        
        if (isOpen) {
            el.style.display = 'none';
            if (catPai) catPai.classList.remove('open');
        } else {
            el.style.display = 'block';
            if (catPai) catPai.classList.add('open');
            // Isola as outras categorias para dar o efeito de foco (padrão grandes sites)
            document.querySelectorAll('.categoria').forEach(cat => {
                if (!cat.contains(el)) cat.style.display = 'none';
            });
            // Garante botão voltar dentro do conteúdo se não existir
            var conteudoEl = el;
            if (!conteudoEl.querySelector('.btn-voltar-encomenda')) {
                var btnVoltar = document.createElement('div');
                btnVoltar.className = 'btn-voltar-encomenda';
                btnVoltar.style = 'margin-bottom: 20px;';
                var iconVoltar = (typeof window.ItapIcon === 'function') ? window.ItapIcon('truck', 'white') : '←';
                btnVoltar.innerHTML = '<div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;"><button type="button" class="btn-voltar-nivel" onclick="window.fecharSecaoEncomenda(\'' + id + '\')" style="width:50px; height:50px; border-radius:50%; border:none; background:#EA1D2C; color:#fff; font-weight:900; font-size:1.2rem; cursor:pointer; box-shadow:0 4px 12px rgba(232,0,13,0.4); display:flex; align-items:center; justify-content:center; animation: neonPulse 2s infinite;">' + iconVoltar + '</button><span style="font-weight:800; color:#EA1D2C; font-size:1.1rem;">Voltar</span></div>';
                conteudoEl.insertBefore(btnVoltar, conteudoEl.firstChild);
            }
        }
    };

    window.fecharSecaoEncomenda = function(id) {
        var el = document.getElementById(id);
        var catPai = el ? el.closest('.categoria') : null;
        if (el) el.style.display = 'none';
        if (catPai) catPai.classList.remove('open');
        document.querySelectorAll('.categoria').forEach(cat => cat.style.display = 'block');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.abrirModal = function(id) {
        document.getElementById(id).style.display = 'flex';
        document.body.classList.add('lock-scroll');
    };

    function estoqueDisponivelProduto(id, ignorarIndice) {
        var produto = id === 'torta' ? TORTA_ESTOQUE : PRODUTOS.find(function (p) { return p.id === id; });
        if (!produto) return 0;
        var usado = carrinho.reduce(function (total, item, indice) {
            return indice !== ignorarIndice && !item.isPicole && item.id === id ? total + 1 : total;
        }, 0);
        return Math.max(0, Number(produto.estoque || 0) - usado);
    }

    function statusEstoqueProduto(produto) {
        var estoque = Number(produto && produto.estoque || 0);
        return estoque > 0 && !produto.esgotado ? 'Disponível: ' + estoque : 'Esgotado';
    }

    function escaparHtml(valor) {
        return String(valor == null ? '' : valor).replace(/[&<>"']/g, function (c) {
            return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
        });
    }

    function seloLeitePasteurizadoHtml() {
        return '<span class="selo-leite-pasteurizado" role="note">Leite Pasteurizado da Fazenda</span>';
    }

    function quantidadeAcrescimoNoCarrinho(id) {
        var item = carrinho.find(function (entrada) { return entrada.isAcrescimo && entrada.id === id; });
        return item ? Number(item.quantidade || 0) : 0;
    }

    function estoqueDisponivelAcrescimo(id) {
        var produto = ACRESCIMOS.find(function (entrada) { return entrada.id === id; });
        if (!produto || produto.esgotado) return 0;
        return Math.max(0, Number(produto.estoque || 0) - quantidadeAcrescimoNoCarrinho(id));
    }

    window.alterarQuantidadeAcrescimo = function(id, delta) {
        var produto = ACRESCIMOS.find(function (entrada) { return entrada.id === id; });
        if (!produto) return;
        var indice = carrinho.findIndex(function (entrada) { return entrada.isAcrescimo && entrada.id === id; });
        var atual = indice >= 0 ? Number(carrinho[indice].quantidade || 0) : 0;
        var limite = produto.esgotado ? 0 : Math.max(0, Number(produto.estoque || 0));
        var novaQuantidade = Math.max(0, Math.min(limite, atual + Number(delta || 0)));

        if (novaQuantidade === 0) {
            if (indice >= 0) carrinho.splice(indice, 1);
        } else if (indice >= 0) {
            carrinho[indice].quantidade = novaQuantidade;
            carrinho[indice].preco = novaQuantidade * produto.preco;
        } else {
            carrinho.push({
                id: produto.id,
                tipo: 'Acréscimo',
                nome: produto.nome,
                precoUnit: produto.preco,
                quantidade: novaQuantidade,
                preco: novaQuantidade * produto.preco,
                sabores: [],
                isAcrescimo: true,
                isPicole: false
            });
        }
        window.carrinho = carrinho;
        renderizarCatalogoEncomendas();
        atualizarCarrinhoFixo();
    };

    window.adicionarAcrescimo = function(id) {
        if (estoqueDisponivelAcrescimo(id) <= 0) {
            var produto = ACRESCIMOS.find(function (entrada) { return entrada.id === id; });
            alert((produto ? produto.nome : 'Este acréscimo') + ' está esgotado ou atingiu o limite disponível.');
            return;
        }
        window.alterarQuantidadeAcrescimo(id, 1);
    };

    function renderizarAcrescimos() {
        var el = document.getElementById('lista-acrescimos');
        if (!el) return;
        el.innerHTML = ACRESCIMOS.map(function (p) {
            var quantidade = quantidadeAcrescimoNoCarrinho(p.id);
            var indisponivel = Boolean(p.esgotado || Number(p.estoque || 0) <= 0);
            var subtotal = quantidade * Number(p.preco || 0);
            var nome = escaparHtml(p.nome);
            return `<div class="prod-card prod-card--azul acrescimo-card ${indisponivel ? 'is-esgotado' : ''}">
                <div class="prod-nome">${nome}</div>
                <div class="prod-preco">R$ ${Number(p.preco).toFixed(2).replace('.',',')} <span style="font-size:.75rem;color:#666;font-weight:700;">/ unidade</span></div>
                <div class="prod-card__estoque ${indisponivel ? 'is-esgotado' : ''}">${indisponivel ? 'Esgotado' : 'Disponível: ' + Number(p.estoque) + ' unidade(s)'}</div>
                <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:8px 0 10px;" aria-label="Quantidade de ${nome}">
                    <button type="button" aria-label="Diminuir quantidade de ${nome}" onclick="window.alterarQuantidadeAcrescimo('${p.id}', -1)" ${quantidade <= 0 ? 'disabled' : ''} style="width:44px;height:44px;border:1px solid #D5D5D5;border-radius:50%;background:#fff;color:#333;font-size:1.2rem;font-weight:900;cursor:pointer;">−</button>
                    <span id="qtd-acr-${p.id}" style="min-width:30px;text-align:center;font-size:1.15rem;font-weight:900;">${quantidade}</span>
                    <button type="button" aria-label="Aumentar quantidade de ${nome}" onclick="window.alterarQuantidadeAcrescimo('${p.id}', 1)" ${indisponivel || quantidade >= Number(p.estoque || 0) ? 'disabled' : ''} style="width:44px;height:44px;border:1px solid var(--primary);border-radius:50%;background:var(--primary);color:#fff;font-size:1.2rem;font-weight:900;cursor:pointer;">+</button>
                </div>
                <div id="subtotal-acr-${p.id}" style="font-size:.85rem;color:var(--success);font-weight:900;margin-bottom:12px;">Subtotal: R$ ${subtotal.toFixed(2).replace('.',',')}</div>
                <button class="btn-sabores btn-sabores--acrescimos" type="button" onclick="window.adicionarAcrescimo('${p.id}')" ${indisponivel ? 'disabled' : ''}>Adicionar ao carrinho</button>
            </div>`;
        }).join('');
    }

    function renderizarCatalogoEncomendas() {
        var caixasEl = document.getElementById('lista-caixas');
        var tortasEl = document.getElementById('lista-tortas');
        var picolesEl = document.getElementById('lista-picoles');
        var acrescimosEl = document.getElementById('lista-acrescimos');
        if (!caixasEl || !tortasEl || !picolesEl || !acrescimosEl) return;

        caixasEl.innerHTML = PRODUTOS.map(function (p) {
            var indisponivel = Boolean(p.esgotado || Number(p.estoque || 0) <= 0);
            var cores = {
                cx5l_2s: { btn: 'btn-sabores--caixa-azul', card: 'prod-card--azul' },
                cx5l_3s: { btn: 'btn-sabores--caixa-verde', card: 'prod-card--verde' },
                cx10l_2s: { btn: 'btn-sabores--caixa-amarela', card: 'prod-card--amarela' },
                cx10l_3s: { btn: 'btn-sabores--caixa-roxa', card: 'prod-card--roxa' }
            }[p.id] || { btn: 'btn-sabores--caixa-azul', card: 'prod-card--azul' };
            
            var status = indisponivel ? 'Esgotado' : 'Disponível: ' + Number(p.estoque) + ' unidade(s)';
            var nome = escaparHtml(p.nome);
            return `<div class="prod-card ${cores.card} ${indisponivel ? 'is-esgotado' : ''}">
                <div class="prod-nome">${nome}</div>
                ${seloLeitePasteurizadoHtml()}
                <div style="font-size:0.85rem; color:#666; margin-bottom:10px;">${p.max} Sabores Tipo Artesanal</div>
                <div class="prod-card__estoque">${status}</div>
                <div class="prod-preco">R$ ${p.preco.toFixed(2).replace('.',',')}</div>
                <button class="btn-sabores ${cores.btn}" onclick="window.abrirSaboresSorvete('${p.id}', ${p.preco}, ${p.max}, '${nome}')" ${indisponivel ? 'disabled' : ''}>Escolher sabores</button>
            </div>`;
        }).join('');

        var tortaIndisponivel = Boolean(TORTA_ESTOQUE.esgotado || Number(TORTA_ESTOQUE.estoque || 0) <= 0);
        tortasEl.innerHTML = `<div class="prod-card prod-card--verde ${tortaIndisponivel ? 'is-esgotado' : ''}">
            <div class="prod-nome">Torta de Sorvete</div>
            ${seloLeitePasteurizadoHtml()}
            <div style="font-size:0.85rem; color:#666; margin-bottom:10px;">Até 3 Sabores Tipo Artesanal</div>
            <div class="prod-card__estoque">${statusEstoqueProduto(TORTA_ESTOQUE)}</div>
            <div class="prod-preco">R$ ${TORTA_ESTOQUE.preco.toFixed(2).replace('.',',')}</div>
            <button class="btn-sabores btn-sabores--tortas" onclick="window.abrirSaboresSorvete('torta', ${TORTA_ESTOQUE.preco}, ${TORTA_ESTOQUE.max}, 'Torta de Sorvete')" ${tortaIndisponivel ? 'disabled' : ''}>Escolher sabores</button>
        </div>`;

        picolesEl.innerHTML = `<div class="prod-card prod-card--roxa">
            <div class="prod-nome">Lote de Picolés Atacado</div>
            <div style="font-size:0.8rem; color:#666; margin-bottom:10px;">Tipo acima; preço, quantidade e subtotal por sabor; mínimo 100 unidades</div>
            <div class="prod-card__estoque">Estoque consultado no catálogo oficial</div>
            <div class="prod-preco">A partir de R$ 1,80 / unidade</div>
            <button class="btn-sabores btn-sabores--picoles" onclick="window.abrirModalPicole()">Montar lote</button>
        </div>`;
        renderizarAcrescimos();
    }

    window.fecharModal = function(id) {
        document.getElementById(id).style.display = 'none';
        document.body.classList.remove('lock-scroll');
    };

    window.abrirSaboresSorvete = function(id, preco, max, nome, editIndex) {
        var produtoEstoque = id === 'torta' ? TORTA_ESTOQUE : PRODUTOS.find(function (p) { return p.id === id; });
        if (produtoEstoque && estoqueDisponivelProduto(id, editIndex) <= 0) {
            alert(nome + ' está esgotado no estoque.');
            renderizarCatalogoEncomendas();
            return;
        }
        produtoAtual = { id: id, preco: preco, max: max, nome: nome, editIndex: editIndex };
        saboresSelecionados = (editIndex !== undefined && carrinho[editIndex]) ? carrinho[editIndex].sabores.slice() : [];
        
        document.getElementById('modal-titulo-sabores').textContent = nome;
        document.getElementById('modal-subtitulo-sabores').textContent = "Selecione " + max + " sabores Tipo Artesanal:";
        
        var grid = document.getElementById('grid-sabores');
        grid.innerHTML = SABORES_SORVETE.map(s => {
            var sel = saboresSelecionados.includes(s);
            return `<div class="sabor-item ${sel?'sel':''}" onclick="window.toggleSabor('${s}', this)">${s}</div>`;
        }).join('');
        
        atualizarAcaoSabores();
        window.abrirModal('modal-sabores');
    };

    window.toggleSabor = function(sabor, el) {
        var idx = saboresSelecionados.indexOf(sabor);
        if (idx > -1) {
            saboresSelecionados.splice(idx, 1);
            el.classList.remove('sel');
        } else {
            if (saboresSelecionados.length >= produtoAtual.max) return;
            saboresSelecionados.push(sabor);
            el.classList.add('sel');
        }
        atualizarAcaoSabores();
    };

    function atualizarAcaoSabores() {
        var btn = document.getElementById('btn-confirmar-sabores');
        var status = document.getElementById('status-sabores');
        var pronto = saboresSelecionados.length === produtoAtual.max;
        btn.disabled = !pronto;
        btn.classList.toggle('is-ready', pronto);
        
        if (pronto) {
            status.textContent = "Tudo certo! Pode confirmar.";
            status.classList.add('ready');
        } else {
            var falta = produtoAtual.max - saboresSelecionados.length;
            status.textContent = "Faltam " + falta + " sabores.";
            status.classList.remove('ready');
        }
    }

    window.confirmarSabores = function() {
        var disponivel = estoqueDisponivelProduto(produtoAtual.id, produtoAtual.editIndex);
        if (disponivel <= 0) {
            alert(produtoAtual.nome + ' não possui estoque disponível.');
            window.fecharModal('modal-sabores');
            renderizarCatalogoEncomendas();
            return;
        }
        var item = {
            id: produtoAtual.id,
            tipo: produtoAtual.id === 'torta' ? 'Sobremesa' : 'Sorvete em Caixa',
            nome: produtoAtual.nome,
            preco: produtoAtual.preco,
            sabores: saboresSelecionados.slice(),
            isPicole: false
        };
        if (produtoAtual.editIndex !== undefined) carrinho[produtoAtual.editIndex] = item;
        else carrinho.push(item);
        window.fecharModal('modal-sabores');
        atualizarCarrinhoFixo();
    };

    window.filtrarSecaoPicole = function(tipoId) {
        document.querySelectorAll('.picole-grupo-sec').forEach(el => {
            el.style.display = (tipoId === 'todos' || el.dataset.tipoId === tipoId) ? 'block' : 'none';
        });
        document.querySelectorAll('.picole-aba-btn').forEach(btn => {
            if (btn.dataset.tipoId === tipoId) {
                btn.style.background = 'var(--primary)';
                btn.style.color = '#fff';
                btn.style.borderColor = 'var(--primary)';
            } else {
                btn.style.background = '#f7f7f7';
                btn.style.color = '#333';
                btn.style.borderColor = '#ddd';
            }
        });
    };

    window.abrirModalPicole = function() {
        if (!ESTOQUE_CARREGADO) {
            alert('Aguarde: consultando o estoque oficial.');
            return;
        }
        var abasHtml = '<button type="button" class="picole-aba-btn" data-tipo-id="todos" onclick="window.filtrarSecaoPicole(\'todos\')" style="padding: 7px 14px; border-radius: 20px; border: 1px solid var(--primary); background: var(--primary); color: #fff; font-weight: 800; font-size: 0.8rem; cursor: pointer; white-space: nowrap; flex: 0 0 auto;">Todos</button>';
        var html = '';
        
        Object.entries(PICOLES_CATALOGO).forEach(([tipo, grupo], index) => {
            var iconId = tipo.includes('Água') ? 'drop' : tipo.includes('Recheado') ? 'chocolate' : tipo.includes('Esquimó') ? 'popsicle' : 'star';
            var icon = (typeof window.ItapIcon === 'function') ? window.ItapIcon(iconId, 'orange small') : '';
            var tipoCurto = tipo.split('(')[0].trim();
            var tipoId = 'grupo-picole-' + index;
            
            abasHtml += `<button type="button" class="picole-aba-btn" data-tipo-id="${tipoId}" onclick="window.filtrarSecaoPicole('${tipoId}')" style="padding: 7px 14px; border-radius: 20px; border: 1px solid #ddd; background: #f7f7f7; color: #333; font-weight: 800; font-size: 0.8rem; cursor: pointer; white-space: nowrap; flex: 0 0 auto; display: flex; align-items: center; gap: 6px;">${icon}<span>${tipoCurto}</span></button>`;
            
            html += `<div class="picole-grupo-sec" data-tipo-id="${tipoId}" style="margin-bottom: 16px;">
                <div class="picole-grupo-sec__titulo">
                    <span class="picole-grupo-sec__icon">${icon}</span><span class="picole-grupo-sec__label">${tipo}</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">`;
            
            grupo.sabores.forEach(s => {
                var key = tipo + "|" + s;
                var qtd = picolesSelecionados[key] || 0;
                var info = infoEstoquePicole(tipo, s);
                var indisponivel = Boolean(info.esgotado || Number(info.estoque || 0) <= 0);
                var subtotal = qtd * grupo.preco;
                var hasSelected = qtd > 0;
                
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: ${hasSelected ? '#F0FDF4' : '#FAFAFA'}; border: 1.5px solid ${hasSelected ? '#86EFAC' : '#E5E7EB'}; border-radius: 12px; transition: all 0.2s;" data-picole-key="${key}" class="${indisponivel ? 'is-esgotado' : ''}">
                        <div style="flex: 1; padding-right: 10px;">
                            <div style="font-weight: 800; font-size: 0.92rem; color: #1A1A1A;">${escaparHtml(s)}</div>
                            ${tipo.indexOf('Base Leite') !== -1 ? seloLeitePasteurizadoHtml() : ''}
                            <div style="font-size: 0.75rem; color: #666; margin-top: 1px;">R$ ${grupo.preco.toFixed(2).replace('.',',')} un. ${indisponivel ? '· <span style="color:#B42318; font-weight:800;">Esgotado</span>' : ''}</div>
                            <div id="sub-${key}" style="font-size: 0.78rem; font-weight: 800; color: var(--success); margin-top: 2px;">Subtotal: R$ ${subtotal.toFixed(2).replace('.',',')}</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;" aria-label="Quantidade de ${escaparHtml(s)}">
                            <button type="button" aria-label="Remover" onclick="window.addPicole('${key}', -1)" ${qtd <= 0 ? 'disabled' : ''} style="width: 44px; height: 44px; border: 1px solid #D5D5D5; border-radius: 50%; background: #fff; color: #333; font-size: 1.2rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center;">−</button>
                            <span id="q-${key}" style="min-width: 26px; text-align: center; font-weight: 900; font-size: 1.1rem; color: ${hasSelected ? 'var(--success)' : '#333'};">${qtd}</span>
                            <button type="button" aria-label="Adicionar" onclick="window.addPicole('${key}', 1)" ${indisponivel || qtd >= MAX_PICOLES_POR_SABOR ? 'disabled' : ''} style="width: 44px; height: 44px; border: 1px solid var(--primary); border-radius: 50%; background: var(--primary); color: #fff; font-size: 1.2rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center;">+</button>
                        </div>
                    </div>
                `;
            });
            html += `</div></div>`;
        });
        
        document.getElementById('picoles-abas-container').innerHTML = abasHtml;
        document.getElementById('lista-sabores-picole').innerHTML = html;
        atualizarAcaoPicoles();
        window.abrirModal('modal-picoles');
    };

    window.addPicole = function(key, delta) {
        var atual = picolesSelecionados[key] || 0;
        var partes = key.split('|');
        var tipo = partes[0];
        var sabor = partes.slice(1).join('|');
        var disponivel = estoqueDisponivelParaSabor(tipo, sabor, atual);
        var novo = delta > 0 ? Math.min(MAX_PICOLES_POR_SABOR, atual + delta, atual + disponivel) : Math.max(0, atual + delta);
        if (novo === 0) delete picolesSelecionados[key];
        else picolesSelecionados[key] = novo;
        document.getElementById('q-' + key).textContent = novo;
        var tipoFull = key.split('|')[0];
        var grupo = PICOLES_CATALOGO[tipoFull];
        var subtotalEl = document.getElementById('sub-' + key);
        if (subtotalEl && grupo) subtotalEl.textContent = 'Subtotal: R$ ' + (novo * grupo.preco).toFixed(2).replace('.',',');
        var linha = document.querySelector('[data-picole-key="' + CSS.escape(key) + '"]');
        if (linha) {
            var botoes = linha.querySelectorAll('button');
            if (botoes[0]) botoes[0].disabled = novo <= 0;
            if (botoes[1]) botoes[1].disabled = novo >= MAX_PICOLES_POR_SABOR || estoqueDisponivelParaSabor(tipo, sabor, novo) <= 0;
        }
        atualizarAcaoPicoles();
    };

    function atualizarAcaoPicoles() {
        var total = Object.values(picolesSelecionados).reduce((a, b) => a + b, 0);
        var valorTotal = Object.entries(picolesSelecionados).reduce(function (soma, entry) {
            var partes = entry[0].split('|');
            var grupo = PICOLES_CATALOGO[partes[0]];
            return soma + (Number(entry[1]) * (grupo ? Number(grupo.preco) : 0));
        }, 0);
        var valorFormatado = valorTotal.toFixed(2).replace('.', ',');
        var pronto = total >= MIN_PICOLES_ATACADO;
        var btn = document.getElementById('btn-confirmar-picoles');
        var status = document.getElementById('status-picoles');
        var totalEl = document.getElementById('total-picoles');
        var barra = document.getElementById('progresso-picoles');
        
        totalEl.textContent = total + " unidades";
        barra.style.width = Math.min(100, (total/MIN_PICOLES_ATACADO)*100) + "%";
        barra.classList.toggle('ready', pronto);
        btn.disabled = !pronto;
        btn.classList.toggle('is-ready', pronto);
        
        if (pronto) {
            status.textContent = "Lote mínimo atingido · Selecionadas: " + total + " · R$ " + valorFormatado;
            status.classList.add('ready');
        } else {
            status.textContent = "Faltam " + (MIN_PICOLES_ATACADO - total) + " unidades · Selecionadas: " + total + " · R$ " + valorFormatado;
            status.classList.remove('ready');
        }
    }

    window.confirmarPicole = function() {
        // Remover picolés antigos para reinserir por sabor
        carrinho = carrinho.filter(i => !i.isPicole);
        window.carrinho = carrinho;
        
        Object.entries(picolesSelecionados).forEach(([key, qtd]) => {
            var parts = key.split('|');
            var tipoFull = parts[0];
            var sabor = parts[1];
            var precoUnit = PICOLES_CATALOGO[tipoFull].preco;
            
            carrinho.push({
                id: key,
                tipo: "Picolé " + tipoFull.split('(')[0].trim(),
                nome: sabor,
                preco: qtd * precoUnit,
                quantidade: qtd,
                precoUnit: precoUnit,
                isPicole: true
            });
        });
        
        window.fecharModal('modal-picoles');
        atualizarCarrinhoFixo();
    };

    window.abrirCarrinho = function() {
        // Sempre abre na Etapa 1 (Revisão)
        window.voltarParaRevisao();
        
        var lista = document.getElementById('lista-carrinho');
        var total = 0;
        
        if (carrinho.length === 0) {
            lista.innerHTML = '<div style="text-align:center; padding: 40px 20px; color:#666;"><div style="font-size: 3rem; margin-bottom: 10px;">🛒</div><strong style="font-size: 1.2rem;">Seu carrinho está vazio</strong><p style="font-size: 0.9rem; margin-top: 5px;">Adicione caixas de sorvete, tortas ou picolés para encomendar.</p></div>';
            document.getElementById('btn-prosseguir').style.display = 'none';
        } else {
            document.getElementById('btn-prosseguir').style.display = 'block';
            lista.innerHTML = carrinho.map((item, i) => {
                total += Number(item.preco || 0);
                var desc = item.isPicole ? `${item.quantidade} unidades · R$ ${item.precoUnit.toFixed(2)}/un` : item.isAcrescimo ? `${item.quantidade} unidade(s) · R$ ${item.precoUnit.toFixed(2).replace('.',',')}/un` : 'Sabores: ' + item.sabores.join(', ');
                return `
                    <div style="padding: 16px; background: #FFF; border: 1px solid #E8E8E8; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                        <div style="flex: 1; padding-right: 15px;">
                            <div style="font-size: 0.75rem; font-weight: 900; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">${item.tipo}</div>
                            <div style="font-weight: 900; font-size: 1.1rem; color: #1A1A1A;">${item.nome}</div>
                            <div style="font-size: 0.85rem; color: #666; margin-top: 4px; line-height: 1.3;">${desc}</div>
                            ${item.isAcrescimo ? `<div style="font-size:.8rem;color:var(--success);font-weight:800;margin-top:4px;">Subtotal do item: R$ ${Number(item.preco).toFixed(2).replace('.',',')}</div>` : ''}
                            <div style="margin-top: 10px; display: flex; gap: 8px;">
                                <button onclick="window.editarItem(${i})" style="border: none; background: #EEF4FF; color: #1565C0; font-weight: 800; font-size: 0.8rem; padding: 6px 12px; border-radius: 8px; cursor: pointer;">✏️ Editar</button>
                                <button onclick="window.removerItem(${i})" style="border: none; background: #FFF0F0; color: #D32F2F; font-weight: 800; font-size: 0.8rem; padding: 6px 12px; border-radius: 8px; cursor: pointer;">🗑️ Excluir</button>
                            </div>
                        </div>
                        <div style="font-weight: 900; font-size: 1.2rem; color: var(--success); text-align: right;">R$ ${item.preco.toFixed(2).replace('.',',')}</div>
                    </div>
                `;
            }).join('');
        }
        
        document.getElementById('total-carrinho').textContent = "R$ " + total.toFixed(2).replace('.',',');
        
        var totalPicoles = carrinho.filter(i => i.isPicole).reduce((a, b) => a + b.quantidade, 0);
        var temPicole = totalPicoles > 0;
        var picoleOk = !temPicole || totalPicoles >= MIN_PICOLES_ATACADO;
        
        var status = document.getElementById('status-carrinho');
        var btnProsseguir = document.getElementById('btn-prosseguir');
        
        if (carrinho.length > 0 && picoleOk) {
            status.style.display = 'none';
            btnProsseguir.disabled = false;
            btnProsseguir.style.opacity = '1';
        } else if (temPicole && !picoleOk) {
            status.style.display = 'block';
            status.textContent = "O lote de picolés precisa de 100 unidades. Faltam " + (MIN_PICOLES_ATACADO - totalPicoles) + ".";
            status.className = "cart-status";
            btnProsseguir.disabled = true;
            btnProsseguir.style.opacity = '0.5';
        } else {
            status.style.display = 'none';
            btnProsseguir.disabled = true;
            btnProsseguir.style.opacity = '0.5';
        }
        
        window.abrirModal('modal-carrinho');
    };

    // FUNÇÕES DO FLUXO DE 3 ETAPAS
    window.irParaFormulario = function() {
        document.getElementById('titulo-etapa-carrinho').textContent = "🛒 Etapa 2: Identificação do Cliente";
        document.getElementById('etapa-revisao').style.display = 'none';
        document.getElementById('etapa-formulario').style.display = 'block';
        document.getElementById('botoes-etapa-1').style.display = 'none';
        document.getElementById('botoes-etapa-2').style.display = 'flex';
        
        // Reset form state
        document.getElementById('pedido-nome').value = '';
        document.getElementById('pedido-endereco').value = '';
        document.getElementById('pedido-whatsapp').value = '';
        document.getElementById('pedido-ciencia').checked = false;
        document.getElementById('bloco-endereco').style.opacity = '0.4';
        document.getElementById('bloco-endereco').style.pointerEvents = 'none';
        document.getElementById('pedido-endereco').disabled = true;
        document.getElementById('bloco-whatsapp').style.opacity = '0.4';
        document.getElementById('bloco-whatsapp').style.pointerEvents = 'none';
        document.getElementById('pedido-whatsapp').disabled = true;
        document.getElementById('bloco-ciencia').style.opacity = '0.4';
        document.getElementById('bloco-ciencia').style.pointerEvents = 'none';
        document.getElementById('pedido-ciencia').disabled = true;
        
        var btnFin = document.getElementById('btn-finalizar-pedido');
        btnFin.style.opacity = '0.5';
        btnFin.style.pointerEvents = 'none';
    };

    window.voltarParaRevisao = function() {
        document.getElementById('titulo-etapa-carrinho').textContent = "🛒 Etapa 1: Revisão do Carrinho";
        document.getElementById('etapa-revisao').style.display = 'block';
        document.getElementById('etapa-formulario').style.display = 'none';
        document.getElementById('botoes-etapa-1').style.display = 'flex';
        document.getElementById('botoes-etapa-2').style.display = 'none';
    };

    window.validarNome = function() {
        var nome = document.getElementById('pedido-nome').value.trim();
        var blocoEnd = document.getElementById('bloco-endereco');
        var inputEnd = document.getElementById('pedido-endereco');
        
        if (nome.length >= 3) {
            blocoEnd.style.opacity = '1';
            blocoEnd.style.pointerEvents = 'auto';
            inputEnd.disabled = false;
        } else {
            blocoEnd.style.opacity = '0.4';
            blocoEnd.style.pointerEvents = 'none';
            inputEnd.disabled = true;
            inputEnd.value = '';
            window.validarEndereco();
        }
    };

    window.validarEndereco = function() {
        var end = document.getElementById('pedido-endereco').value.trim();
        var blocoWp = document.getElementById('bloco-whatsapp');
        var inputWp = document.getElementById('pedido-whatsapp');
        
        if (end.length >= 5) {
            blocoWp.style.opacity = '1';
            blocoWp.style.pointerEvents = 'auto';
            inputWp.disabled = false;
        } else {
            blocoWp.style.opacity = '0.4';
            blocoWp.style.pointerEvents = 'none';
            inputWp.disabled = true;
            inputWp.value = '';
            window.validarWhatsapp();
        }
    };

    window.validarWhatsapp = function() {
        var zap = document.getElementById('pedido-whatsapp').value.trim();
        var tel = zap.replace(/\D/g, '');
        var ciencia = document.getElementById('pedido-ciencia').checked;
        var btnFin = document.getElementById('btn-finalizar-pedido');
        
        var blocoCiencia = document.getElementById('bloco-ciencia');
        var inputCiencia = document.getElementById('pedido-ciencia');
        
        if (/^16\d{8,9}$/.test(tel)) {
            blocoCiencia.style.opacity = '1';
            blocoCiencia.style.pointerEvents = 'auto';
            inputCiencia.disabled = false;
            
            if (ciencia) {
                btnFin.style.opacity = '1';
                btnFin.style.pointerEvents = 'auto';
                btnFin.disabled = false;
            } else {
                btnFin.style.opacity = '0.5';
                btnFin.style.pointerEvents = 'none';
                btnFin.disabled = true;
            }
        } else {
            blocoCiencia.style.opacity = '0.4';
            blocoCiencia.style.pointerEvents = 'none';
            inputCiencia.disabled = true;
            inputCiencia.checked = false;
            btnFin.style.opacity = '0.5';
            btnFin.style.pointerEvents = 'none';
        }
    };

    window.editarItem = function(i) {
        var item = carrinho[i];
        if (!item) return;
        if (item.isAcrescimo) {
            window.fecharModal('modal-carrinho');
            var secaoAcrescimos = document.getElementById('sec-acrescimos');
            if (secaoAcrescimos && secaoAcrescimos.style.display !== 'block') window.toggleSecao('sec-acrescimos');
            return;
        }
        if (item.isPicole) window.abrirModalPicole();
        else if (item.id === 'torta') window.abrirSaboresSorvete('torta', 100, 3, 'Torta de Sorvete', i);
        else {
            var p = PRODUTOS.find(x => x.id === item.id);
            window.abrirSaboresSorvete(p.id, p.preco, p.max, p.nome, i);
        }
    };

    window.removerItem = function(i) {
        var item = carrinho[i];
        if (item.isPicole) {
            delete picolesSelecionados[item.id];
        }
        carrinho.splice(i, 1);
        atualizarCarrinhoFixo();
        window.abrirCarrinho();
    };

    window.limparCarrinho = function() {
        if (confirm("Limpar todo o pedido?")) {
            carrinho = [];
            picolesSelecionados = {};
            window.carrinho = carrinho;
            window.picolesSelecionados = picolesSelecionados;
            atualizarCarrinhoFixo();
            window.fecharModal('modal-carrinho');
        }
    };

    function atualizarCarrinhoFixo() {
        var total = carrinho.reduce((a, b) => a + b.preco, 0);
        var btn = document.getElementById('btn-carrinho-fixo');
        if (carrinho.length > 0) {
            btn.style.display = 'flex';
            document.getElementById('carrinho-qtd').textContent = carrinho.length;
            document.getElementById('carrinho-total').textContent = "R$ " + total.toFixed(2).replace('.',',');
        } else {
            btn.style.display = 'none';
        }
    }

	    window.finalizarPedido = function() {
	        var nome = document.getElementById('pedido-nome').value.trim();
	        var end = document.getElementById('pedido-endereco').value.trim();
	        var zap = document.getElementById('pedido-whatsapp').value.trim();
	        var tel = zap.replace(/\D/g, '');
	        
	        if (nome.length < 3) {
	            alert("Por favor, preencha seu Nome Completo.");
	            document.getElementById('pedido-nome').focus();
	            return;
	        }
	        if (end.length < 5) {
	            alert("Por favor, preencha o Endereço de Entrega Completo.");
	            document.getElementById('pedido-endereco').focus();
	            return;
	        }
	        if (!/^16\d{8,9}$/.test(tel)) {
	            alert("Atenção: Apenas telefones com o DDD 16 são aceitos para encomendas nesta região.");
	            document.getElementById('pedido-whatsapp').focus();
	            return;
	        }
        
        var texto = `Olá! Gostaria de fazer uma encomenda.\n\n✅ ESTOU CIENTE DO PRAZO DE 5 DIAS ÚTEIS APÓS O PAGAMENTO PARA ELABORAR O PEDIDO.\n\nCliente: ${nome}\nEndereço: ${end}\nWhatsApp: ${zap}\n\nItens:\n` +
            carrinho.map(item => {
                var desc = item.isPicole ? `${item.quantidade} un x R$ ${item.precoUnit.toFixed(2)}` : item.isAcrescimo ? `${item.quantidade} unidade(s) x R$ ${item.precoUnit.toFixed(2)}` : `Sabores: ${item.sabores.join(', ')}`;
                return `▪ ${item.tipo}: ${item.nome}\n  ${desc}\n  Subtotal: R$ ${Number(item.preco || 0).toFixed(2).replace('.',',')}`;
            }).join('\n\n') +
            `\n\nTotal do Pedido: R$ ${carrinho.reduce((a,b)=>a+b.preco,0).toFixed(2).replace('.',',')}`;
            
        window.open('https://wa.me/5516996062046?text=' + encodeURIComponent(texto), '_blank');
    };

    function abrirSecaoPorRota() {
        var hash = String(window.location.hash || '').replace(/^#/, '').toLowerCase();
        var params = new URLSearchParams(window.location.search);
        var rota = hash || String(params.get('secao') || params.get('categoria') || '').toLowerCase();
        var mapa = { caixas: 'sec-caixas', tortas: 'sec-tortas', picoles: 'sec-picoles', 'picolés': 'sec-picoles', acrescimos: 'sec-acrescimos', 'acréscimos': 'sec-acrescimos' };
        var id = mapa[rota];
        if (id) window.toggleSecao(id);
    }
    // Permite trocar de gaveta por link/hash sem recarregar a página e sem criar outro renderizador.
    window.addEventListener('hashchange', abrirSecaoPorRota);

    // Inicialização única: renderiza uma prévia e, em seguida, substitui pelos dados oficiais do estoque.
    renderizarCatalogoEncomendas();
    carregarEstoqueEncomendas();
    abrirSecaoPorRota();

// Fim do script
