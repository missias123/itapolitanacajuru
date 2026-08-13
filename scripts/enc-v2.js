/**
 * ITAPOLITANA CAJURU - Lógica de Encomendas v2.6 (Estabilidade Total)
 * Foco: Trava de Scroll, UX Focada e Restauração de Funções.
 */

(function(window) {
    'use strict';

    var carrinho = [];
    var produtoAtual = null;
    var editandoIndex = -1;
    var saboresSelecionados = [];
    var picolesSelecionados = {};
    var MIN_PICOLES = 100;

    var SABORES_OFICIAIS = [
        "Abacaxi ao Vinho", "Abacaxi Suíço", "Algodão Doce (Blue Ice)", "Amarena", "Ameixa",
        "Banana com Nutella", "Bis e Trufa", "Cereja Trufada", "Chocolate", "Chocolate com Café",
        "Coco Queimado", "Creme Paris", "Croquer", "Doce de Leite", "Ferrero Rocher", "Flocos",
        "Kinder Ovo", "Leite Condensado", "Leite Ninho", "Leite Ninho Folheado", "Leite Ninho com Oreo",
        "Limão", "Limão Suíço", "Menta com Chocolate", "Milho Verde", "Morango Trufado",
        "Mousse de Maracujá", "Mousse de Uva", "Nozes", "Nutella", "Ovomaltine", "Pistache",
        "Prestígio", "Sensação", "Torta de Chocolate"
    ];

    function init() {
        console.log("🍦 Encomendas v2.6: Sistema Estabilizado.");
        renderizarTudo();
        window.addEventListener('produtosNuvemCarregados', renderizarTudo);
        try {
            var salvo = localStorage.getItem('itap_carrinho');
            if (salvo) {
                carrinho = JSON.parse(salvo);
                atualizarBotaoCarrinho();
            }
        } catch(e) {}
    }

    function renderizarTudo() {
        renderizarCaixas();
        renderizarTortas();
        renderizarListaPicoles();
    }

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

    function abrirModal(id) {
        var m = document.getElementById(id);
        if (m) {
            m.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Trava scroll do fundo
        }
    }

    function fecharModal(id) {
        var m = document.getElementById(id);
        if (m) {
            m.style.display = 'none';
            document.body.style.overflow = ''; // Destrava scroll
        }
    }

    function abrirSaboresSorvete(id, preço, max, nome, indexParaEditar) {
        editandoIndex = (typeof indexParaEditar !== 'undefined') ? indexParaEditar : -1;
        produtoAtual = { id: id, preço: preço, max: max, nome: nome };
        saboresSelecionados = [];
        if (editandoIndex !== -1) {
            saboresSelecionados = carrinho[editandoIndex].sabores.slice();
            document.getElementById('btn-confirmar-sabores').textContent = "Salvar Alterações";
        } else {
            document.getElementById('btn-confirmar-sabores').textContent = "✓ Confirmar Seleção";
        }
        document.getElementById('modal-subtítulo-sabores').textContent = "Escolha " + max + " sabores para " + nome;
        var grid = document.getElementById('grid-sabores');
        var sabores = (window.PRODUTOS_DATA && window.PRODUTOS_DATA.sorvetes && window.PRODUTOS_DATA.sorvetes.sabores) ? 
            window.PRODUTOS_DATA.sorvetes.sabores : SABORES_OFICIAIS;
        grid.innerHTML = sabores.map(function(s) {
            var sel = saboresSelecionados.indexOf(s) !== -1 ? ' sel' : '';
            return '<button class="sabor-item' + sel + '" onclick="window.toggleSabor(\'' + s + '\', this)">' + s + '</button>';
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
                mostrarToast("Limite de " + produtoAtual.max + " sabores atingido!");
                return;
            }
            saboresSelecionados.push(sabor);
            btn.classList.add('sel');
        }
        atualizarStatusSabores();
    }

    function atualizarStatusSabores() {
        var txt = document.getElementById('txt-confirmar-sabores');
        var btn = document.getElementById('btn-confirmar-sabores');
        var grid = document.getElementById('grid-sabores');
        if (!txt || !btn) return;
        var qtd = saboresSelecionados.length;
        var max = produtoAtual.max;
        txt.textContent = "Selecionado: " + qtd + " / " + max;
        if (grid) {
            if (qtd >= max) grid.classList.add('limite-atingido');
            else grid.classList.remove('limite-atingido');
        }
        btn.disabled = (qtd !== max);
        btn.parentElement.className = (qtd === max) ? 'barra-acao barra-verde' : 'barra-acao barra-azul';
    }

    function confirmarSabores() {
        if (saboresSelecionados.length !== produtoAtual.max) return;
        var item = {
            id: editandoIndex !== -1 ? carrinho[editandoIndex].id : ('massa_' + Date.now()),
            prodId: produtoAtual.id,
            nome: produtoAtual.nome,
            preço: produtoAtual.preço,
            max: produtoAtual.max,
            sabores: saboresSelecionados.slice(),
            tipo: 'massa'
        };
        if (editandoIndex !== -1) carrinho[editandoIndex] = item;
        else carrinho.push(item);
        fecharModal('modal-sabores');
        finalizarAcaoCarrinho();
    }

    function abrirModalPicole(key, indexParaEditar) {
        editandoIndex = (typeof indexParaEditar !== 'undefined') ? indexParaEditar : -1;
        var p = window.PRODUTOS_DATA.picolés[key];
        produtoAtual = { id: key, nome: p.nome, preço: p.preço_atacado };
        picolesSelecionados = {};
        if (editandoIndex !== -1) picolesSelecionados = Object.assign({}, carrinho[editandoIndex].detalhes_raw || {});
        document.getElementById('picolé-título').textContent = p.nome;
        document.getElementById('picolé-preços').textContent = "Mínimo 100 unidades (Atacado)";
        var container = document.getElementById('lista-sabores-picolé');
        container.innerHTML = p.sabores.map(function(s) {
            var qtd = picolesSelecionados[s] || 0;
            return '<div class="picolé-row">' +
                '<span class="picolé-sabor-nome">' + s + '</span>' +
                '<div class="qty-ctrl">' +
                    '<button class="btn-qty" onclick="window.altQtdPicole(\'' + s + '\', -1)">-</button>' +
                    '<span id="qtd-' + s.replace(/\s/g, '_') + '" class="qty-val">' + qtd + '</span>' +
                    '<button class="btn-qty" onclick="window.altQtdPicole(\'' + s + '\', 1)">+</button>' +
                '</div>' +
            '</div>';
        }).join('');
        atualizarStatusPicoles();
        abrirModal('modal-picolé');
        document.getElementById('picolé-tela-tipos').style.display = 'none';
        document.getElementById('picolé-tela-sabores').style.display = 'block';
    }

    function altQtdPicole(sabor, delta) {
        var novo = (picolesSelecionados[sabor] || 0) + delta;
        if (novo < 0) novo = 0;
        picolesSelecionados[sabor] = novo;
        var el = document.getElementById('qtd-' + sabor.replace(/\s/g, '_'));
        if (el) el.textContent = novo;
        atualizarStatusPicoles();
    }

    function atualizarStatusPicoles() {
        var total = 0;
        Object.values(picolesSelecionados).forEach(function(q) { total += q; });
        var btn = document.getElementById('btn-add-picolés');
        var totalGeral = document.getElementById('total-picolés');
        if (totalGeral) totalGeral.textContent = total;
        if (btn) {
            btn.disabled = (total < MIN_PICOLES);
            btn.textContent = (total < MIN_PICOLES) ? "Mínimo 100 unidades" : "Adicionar " + total + " picolés";
        }
    }

    function voltarPicolé() {
        fecharModal('modal-picolé');
        document.getElementById('picolé-tela-sabores').style.display = 'none';
        document.getElementById('picolé-tela-tipos').style.display = 'block';
    }

    function confirmarPickle() {
        var total = 0;
        var detalhes = [];
        var detalhesRaw = {};
        Object.entries(picolesSelecionados).forEach(function(e) {
            if (e[1] > 0) { 
                total += e[1]; 
                detalhes.push(e[1] + "x " + e[0]); 
                detalhesRaw[e[0]] = e[1];
            }
        });
        if (total < MIN_PICOLES) return;
        var item = {
            id: editandoIndex !== -1 ? carrinho[editandoIndex].id : ('picole_' + Date.now()),
            prodId: produtoAtual.id,
            nome: produtoAtual.nome,
            preço: (produtoAtual.preço * total),
            unitario: produtoAtual.preço,
            detalhes: detalhes.join(', '),
            detalhes_raw: detalhesRaw,
            tipo: 'picole'
        };
        if (editandoIndex !== -1) carrinho[editandoIndex] = item;
        else carrinho.push(item);
        fecharModal('modal-picolé');
        finalizarAcaoCarrinho();
    }

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
            lista.innerHTML = '<div style="text-align:center;padding:40px;color:#666;">Seu carrinho está vazio.</div>';
            if (totalEl) totalEl.textContent = 'R$ 0,00';
        } else {
            lista.innerHTML = carrinho.map(function(item, idx) {
                var desc = item.tipo === 'massa' ? item.sabores.join(', ') : item.detalhes;
                return '<div class="resumo-item">' +
                    '<div class="resumo-item-topção">' +
                        '<div class="prod-nome">' + item.nome + '</div>' +
                        '<button class="btn-remover" onclick="window.removerItem(' + idx + ')">🗑️</button>' +
                    '</div>' +
                    '<div class="resumo-sabor">' + desc + '</div>' +
                    '<div style="display:flex;gap:10px;margin-top:10px;">' +
                        '<button class="btn-edit-mini" onclick="window.editarItem(' + idx + ')">✏️ Editar</button>' +
                        '<button class="btn-add-mini" onclick="window.adicionarOutro(' + idx + ')">+ Outro</button>' +
                    '</div>' +
                    '<div class="resumo-sub">R$ ' + item.preço.toFixed(2).replace('.',',') + '</div>' +
                '</div>';
            }).join('');
            var total = carrinho.reduce(function(s, i) { return s + i.preço; }, 0);
            if (totalEl) totalEl.textContent = 'R$ ' + total.toFixed(2).replace('.',',');
        }
        abrirModal('modal-carrinho');
    }

    function removerItem(idx) {
        carrinho.splice(idx, 1);
        localStorage.setItem('itap_carrinho', JSON.stringify(carrinho));
        atualizarBotaoCarrinho();
        abrirCarrinho();
    }

    function editarItem(idx) {
        var item = carrinho[idx];
        fecharModal('modal-carrinho');
        if (item.tipo === 'massa') {
            abrirSaboresSorvete(item.prodId, item.preço, item.max, item.nome, idx);
        } else {
            abrirModalPicole(item.prodId, idx);
        }
    }

    function adicionarOutro(idx) {
        var item = carrinho[idx];
        fecharModal('modal-carrinho');
        if (item.tipo === 'massa') {
            abrirSaboresSorvete(item.prodId, item.preço, item.max, item.nome);
        } else {
            abrirModalPicole(item.prodId);
        }
    }

    function verificarFormulario() {
        var nome = document.getElementById('cliente-nome')?.value.trim();
        var tel = document.getElementById('cliente-tel')?.value.replace(/\D/g, '');
        var btn = document.getElementById('btn-finalizar-pedido');
        if (btn) btn.disabled = !(nome && tel && tel.length >= 10);
    }

    function novoPedido() {
        if (confirm("Deseja realmente limpar todo o pedido e recomeçar?")) {
            carrinho = [];
            localStorage.removeItem('itap_carrinho');
            atualizarBotaoCarrinho();
            fecharModal('modal-carrinho');
            mostrarToast("Pedido excluído!");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function mostrarToast(msg) {
        var t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('ativo');
        setTimeout(function() { t.classList.remove('ativo'); }, 3000);
    }

    // Expor funções globalmente
    window.abrirSaboresSorvete = abrirSaboresSorvete;
    window.toggleSabor = toggleSabor;
    window.confirmarSabores = confirmarSabores;
    window.abrirModalPicole = abrirModalPicole;
    window.altQtdPicole = altQtdPicole;
    window.confirmarPickle = confirmarPickle;
    window.abrirCarrinho = abrirCarrinho;
    window.fecharModal = fecharModal;
    window.removerItem = removerItem;
    window.adicionarOutro = adicionarOutro;
    window.editarItem = editarItem;
    window.voltarPicolé = voltarPicolé;
    window.verificarFormulario = verificarFormulario;
    window.novoPedido = novoPedido;
    window.limparCarrinho = window.novoPedido;
    window.abrirItaBot = function() {
        if(window.ItaBot && window.ItaBot.toggle) window.ItaBot.toggle();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window);
