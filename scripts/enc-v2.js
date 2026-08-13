/**
 * ITAPOLITANA CAJURU - Lógica de Encomendas v2.5 (Perfeição Funcional)
 * Foco: Estabilidade, Sincronismo e UX Fluida.
 */

(function(window) {
    'use strict';

    // --- ESTADO ---
    var carrinho = [];
    var produtoAtual = null;
    var saboresSelecionados = [];
    var picolesSelecionados = {}; // { sabor: quantidade }
    var MIN_PICOLES = 100;

    // Sabores Oficiais (Fallback caso a nuvem demore)
    var SABORES_OFICIAIS = [
        "Abacaxi ao Vinho", "Abacaxi Suíço", "Algodão Doce (Blue Ice)", "Amarena", "Ameixa",
        "Banana com Nutella", "Bis e Trufa", "Cereja Trufada", "Chocolate", "Chocolate com Café",
        "Coco Queimado", "Creme Paris", "Croquer", "Doce de Leite", "Ferrero Rocher", "Flocos",
        "Kinder Ovo", "Leite Condensado", "Leite Ninho", "Leite Ninho Folheado", "Leite Ninho com Oreo",
        "Limão", "Limão Suíço", "Menta com Chocolate", "Milho Verde", "Morango Trufado",
        "Mousse de Maracujá", "Mousse de Uva", "Nozes", "Nutella", "Ovomaltine", "Pistache",
        "Prestígio", "Sensação", "Torta de Chocolate"
    ];

    // --- INICIALIZAÇÃO ---
    function init() {
        console.log("🍦 Encomendas v2.5: Iniciando...");
        
        // Renderização inicial
        renderizarTudo();
        
        // Escuta atualizações da nuvem (products.js)
        window.addEventListener('produtosNuvemCarregados', function() {
            console.log("☁️ Dados da nuvem recebidos. Atualizando interface...");
            renderizarTudo();
        });

        // Carregar carrinho salvo
        try {
            var salvo = localStorage.getItem('itap_carrinho');
            if (salvo) {
                carrinho = JSON.parse(salvo);
                atualizarBotaoCarrinho();
            }
        } catch(e) { console.warn("Falha ao carregar carrinho", e); }
    }

    function renderizarTudo() {
        renderizarCaixas();
        renderizarTortas();
        renderizarListaPicoles();
    }

    // --- RENDERIZADORES ---
    function renderizarCaixas() {
        var container = document.getElementById('lista-caixas');
        if (!container) return;
        
        var caixas = [
            { id: "cx5l_2s", nome: "Caixa 5 Litros - 2 Sabores", preço: 100, max: 2 },
            { id: "cx5l_3s", nome: "Caixa 5 Litros - 3 Sabores", preço: 115, max: 3 },
            { id: "cx10l_2s", nome: "Caixa 10 Litros - 2 Sabores", preço: 150, max: 2 },
            { id: "cx10l_3s", nome: "Caixa 10 Litros - 3 Sabores", preço: 165, max: 3 }
        ];

        container.innerHTML = caixas.map(function(p) {
            return '<div class="prod-card">' +
                '<div class="prod-card-sem-foto">🍦</div>' +
                '<div class="prod-card-body">' +
                    '<div class="prod-nome">' + p.nome + '</div>' +
                    '<div class="prod-preço">R$ ' + p.preço.toFixed(2).replace('.',',') + '</div>' +
                    '<button class="btn-sabores" onclick="window.abrirSaboresSorvete(\'' + p.id + '\', ' + p.preço + ', ' + p.max + ', \'' + p.nome + '\')">Escolher Sabores</button>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    function renderizarTortas() {
        var container = document.getElementById('lista-tortas');
        if (!container) return;
        
        container.innerHTML = '<div class="prod-card">' +
            '<div class="prod-card-sem-foto">🎂</div>' +
            '<div class="prod-card-body">' +
                '<div class="prod-nome">Torta de Sorvete (Especial)</div>' +
                '<div class="prod-preço">R$ 100,00</div>' +
                '<button class="btn-sabores" onclick="window.abrirSaboresSorvete(\'torta\', 100, 3, \'Torta de Sorvete\')">Escolher Sabores</button>' +
            '</div>' +
        '</div>';
    }

    function renderizarListaPicoles() {
        var container = document.getElementById('lista-picolés');
        if (!container) return;
        
        var picoles = window.PRODUTOS_DATA && window.PRODUTOS_DATA.picolés ? window.PRODUTOS_DATA.picolés : {};
        var html = '';
        
        Object.keys(picoles).forEach(function(key) {
            var p = picoles[key];
            html += '<div class="prod-card">' +
                '<div class="prod-card-sem-foto">🍭</div>' +
                '<div class="prod-card-body">' +
                    '<div class="prod-nome">' + p.nome + '</div>' +
                    '<div class="prod-preço">Atacado: R$ ' + p.preço_atacado.toFixed(2).replace('.',',') + '</div>' +
                    '<button class="btn-sabores" onclick="window.abrirModalPicole(\'' + key + '\')">Escolher Sabores</button>' +
                '</div>' +
            '</div>';
        });
        
        if (html) container.innerHTML = html;
    }

    // --- MODAIS ---
    function abrirModal(id) {
        var m = document.getElementById(id);
        if (m) {
            m.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function fecharModal(id) {
        var m = document.getElementById(id);
        if (m) {
            m.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // --- FLUXO SABORES (MASSA) ---
    function abrirSaboresSorvete(id, preço, max, nome) {
        produtoAtual = { id: id, preço: preço, max: max, nome: nome };
        saboresSelecionados = [];
        
        document.getElementById('modal-subtítulo-sabores').textContent = "Escolha " + max + " sabores para " + nome;
        
        var grid = document.getElementById('grid-sabores');
        var sabores = (window.PRODUTOS_DATA && window.PRODUTOS_DATA.sorvetes && window.PRODUTOS_DATA.sorvetes.sabores) ? 
            window.PRODUTOS_DATA.sorvetes.sabores : SABORES_OFICIAIS;

        grid.innerHTML = sabores.map(function(s) {
            return '<button class="sabor-item" onclick="window.toggleSabor(\'' + s + '\', this)">' + s + '</button>';
        }).join('');

        atualizarStatusSabores();
        abrirModal('modal-sabores');
    }

    function toggleSabor(sabor, btn) {
        var idx = saboresSelecionados.indexOf(sabor);
        if (idx !== -1) {
            saboresSelecionados.splice(idx, 1);
            btn.classList.remove('sel');
        } else {
            if (saboresSelecionados.length >= produtoAtual.max) {
                var removido = saboresSelecionados.shift();
                document.querySelectorAll('.sabor-item').forEach(function(b) {
                    if (b.textContent === removido) b.classList.remove('sel');
                });
            }
            saboresSelecionados.push(sabor);
            btn.classList.add('sel');
        }
        atualizarStatusSabores();
    }

    function atualizarStatusSabores() {
        var txt = document.getElementById('txt-confirmar-sabores');
        var btn = document.getElementById('btn-confirmar-sabores');
        if (!txt || !btn) return;
        
        var qtd = saboresSelecionados.length;
        txt.textContent = "Selecionado: " + qtd + " / " + produtoAtual.max;
        
        btn.disabled = (qtd !== produtoAtual.max);
        btn.parentElement.className = (qtd === produtoAtual.max) ? 'barra-acao barra-verde' : 'barra-acao barra-azul';
    }

    function confirmarSabores() {
        if (saboresSelecionados.length !== produtoAtual.max) return;
        
        carrinho.push({
            id: 'massa_' + Date.now(),
            nome: produtoAtual.nome,
            preço: produtoAtual.preço,
            sabores: saboresSelecionados.slice(),
            tipo: 'massa'
        });
        
        fecharModal('modal-sabores');
        finalizarAcaoCarrinho();
    }

    // --- FLUXO PICOLÉS ---
    function abrirModalPicole(key) {
        var p = window.PRODUTOS_DATA.picolés[key];
        produtoAtual = { id: key, nome: p.nome, preço: p.preço_atacado };
        picolesSelecionados = {};
        
        document.getElementById('picolé-título').textContent = p.nome;
        document.getElementById('picolé-preços').textContent = "Mínimo 100 unidades (Atacado)";
        
        var container = document.getElementById('lista-sabores-picolé');
        container.innerHTML = p.sabores.map(function(s) {
            return '<div class="sabor-picole-row" style="display:flex;align-items:center;justify-content:space-between;padding:10px;border-bottom:1px solid #eee;">' +
                '<span style="font-weight:700;">' + s + '</span>' +
                '<div style="display:flex;align-items:center;gap:12px;">' +
                    '<button onclick="window.altQtdPicole(\'' + s + '\', -1)" style="width:30px;height:30px;border-radius:50%;border:1px solid #ccc;">-</button>' +
                    '<span id="qtd-' + s.replace(/\s/g, '_') + '" style="font-weight:900;min-width:20px;text-align:center;">0</span>' +
                    '<button onclick="window.altQtdPicole(\'' + s + '\', 1)" style="width:30px;height:30px;border-radius:50%;border:1px solid #ccc;">+</button>' +
                '</div>' +
            '</div>';
        }).join('');

        atualizarStatusPicoles();
        abrirModal('modal-picolé');
        document.getElementById('picolé-tela-tipos').style.display = 'none';
        document.getElementById('picolé-tela-sabores').style.display = 'block';
    }

    function altQtdPicole(sabor, delta) {
        var atual = picolesSelecionados[sabor] || 0;
        var novo = atual + delta;
        if (novo < 0) novo = 0;
        
        picolesSelecionados[sabor] = novo;
        var el = document.getElementById('qtd-' + sabor.replace(/\s/g, '_'));
        if (el) el.textContent = novo;
        
        atualizarStatusPicoles();
    }

    function atualizarStatusPicoles() {
        var total = 0;
        Object.values(picolesSelecionados).forEach(function(q) { total += q; });
        
        var progressNum = document.getElementById('picolé-progress-num');
        var progressFill = document.getElementById('picolé-progress-fill');
        var btn = document.getElementById('btn-add-picolés');
        var totalGeral = document.getElementById('total-picolés');

        if (progressNum) progressNum.textContent = total;
        if (totalGeral) totalGeral.textContent = total;
        if (progressFill) progressFill.style.width = Math.min((total/MIN_PICOLES)*100, 100) + "%";
        
        if (btn) {
            btn.disabled = (total < MIN_PICOLES);
            btn.textContent = (total < MIN_PICOLES) ? "Mínimo 100 unidades" : "Adicionar " + total + " picolés";
        }
    }

    function confirmarPickle() {
        var total = 0;
        var detalhes = [];
        Object.entries(picolesSelecionados).forEach(function(e) {
            if (e[1] > 0) { total += e[1]; detalhes.push(e[1] + "x " + e[0]); }
        });

        if (total < MIN_PICOLES) return;

        carrinho.push({
            id: 'picole_' + Date.now(),
            nome: produtoAtual.nome,
            preço: produtoAtual.preço * total,
            detalhes: detalhes.join(', '),
            tipo: 'picole'
        });

        fecharModal('modal-picolé');
        finalizarAcaoCarrinho();
    }

    // --- CARRINHO ---
    function finalizarAcaoCarrinho() {
        atualizarBotaoCarrinho();
        localStorage.setItem('itap_carrinho', JSON.stringify(carrinho));
        mostrarToast("Adicionado ao carrinho!");
    }

    function atualizarBotaoCarrinho() {
        var btn = document.getElementById('btn-carrinho');
        var badge = document.getElementById('carrinho-badge');
        var totalEl = document.getElementById('carrinho-total');
        
        if (carrinho.length > 0) {
            btn.classList.add('ativo');
            if (badge) badge.textContent = carrinho.length;
            var total = carrinho.reduce(function(s, i) { return s + i.preço; }, 0);
            if (totalEl) totalEl.textContent = 'R$ ' + total.toFixed(2).replace('.',',');
        } else {
            btn.classList.remove('ativo');
        }
    }

    function abrirCarrinho() {
        var lista = document.getElementById('lista-carrinho');
        var totalEl = document.getElementById('total-carrinho');
        
        if (carrinho.length === 0) {
            lista.innerHTML = '<p style="text-align:center;padding:20px;color:#888;">Carrinho vazio</p>';
            totalEl.textContent = 'R$ 0,00';
        } else {
            lista.innerHTML = carrinho.map(function(item, idx) {
                var desc = item.tipo === 'massa' ? item.sabores.join(', ') : item.detalhes;
                return '<div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee;">' +
                    '<div><b>' + item.nome + '</b><br><small>' + desc + '</small></div>' +
                    '<div style="text-align:right"><b>R$ ' + item.preço.toFixed(2).replace('.',',') + '</b><br>' +
                    '<button onclick="window.removerItem(' + idx + ')" style="color:red;border:none;background:none;font-size:11px;">Remover</button></div>' +
                '</div>';
            }).join('');
            var total = carrinho.reduce(function(s, i) { return s + i.preço; }, 0);
            totalEl.textContent = 'R$ ' + total.toFixed(2).replace('.',',');
        }
        abrirModal('modal-carrinho');
    }

    function removerItem(idx) {
        carrinho.splice(idx, 1);
        abrirCarrinho();
        atualizarBotaoCarrinho();
        localStorage.setItem('itap_carrinho', JSON.stringify(carrinho));
    }

    function finalizarPedido() {
        if (carrinho.length === 0) return;
        var msg = "🍦 *NOVO PEDIDO - ITAPOLITANA*\n\n";
        var total = 0;
        carrinho.forEach(function(i) {
            msg += "✅ *" + i.nome + "*\n";
            msg += "   " + (i.tipo === 'massa' ? i.sabores.join(', ') : i.detalhes) + "\n";
            msg += "   R$ " + i.preço.toFixed(2).replace('.',',') + "\n\n";
            total += i.preço;
        });
        msg += "*TOTAL: R$ " + total.toFixed(2).replace('.',',') + "*";
        window.open("https://wa.me/5516996062046?text=" + encodeURIComponent(msg), '_blank');
    }

    function mostrarToast(msg) {
        var t = document.getElementById('toast') || document.createElement('div');
        t.id = 'toast'; t.className = 'toast ativo sucesso'; t.textContent = msg;
        if (!document.getElementById('toast')) document.body.appendChild(t);
        setTimeout(function() { t.classList.remove('ativo'); }, 3000);
    }

    // --- EXPOSIÇÃO ---
    window.abrirSaboresSorvete = abrirSaboresSorvete;
    window.toggleSabor = toggleSabor;
    window.confirmarSabores = confirmarSabores;
    window.abrirModalPicole = abrirModalPicole;
    window.altQtdPicole = altQtdPicole;
    window.confirmarPickle = confirmarPickle;
    window.fecharModal = fecharModal;
    window.abrirCarrinho = abrirCarrinho;
    window.removerItem = removerItem;
    window.finalizarPedido = finalizarPedido;
    window.toggleSecao = function(id) {
        var c = document.getElementById(id);
        if (!c) return;
        var ab = c.classList.contains('aberto');
        document.querySelectorAll('.categoria-conteudo').forEach(function(el) { el.classList.remove('aberto'); });
        if (!ab) c.classList.add('aberto');
    };

    init();

})(window);
