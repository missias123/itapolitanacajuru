/**
 * ITAPOLITANA CAJURU - Encomendas v4.0 (MODERN-CLASSIC)
 * O poder de hoje com a estabilidade de 3 meses atrás.
 */

(function(window, document) {
    'use strict';
    console.log("🍦 Sistema de Encomendas v4.0 (Modern-Classic) Ativo!");

    // --- 1. CONFIGURAÇÕES E DADOS (38 sabores OFICIAIS) ---
    var SABORES_LISTA = [
        "Abacaxi ao Vinho", "Abacaxi Suíço", "Blue Ice (Algodão Doce Azul)", "Amarena", "Ameixa",
        "Banana com Nutella", "Bis e Trufa", "Cereja Trufada", "Chocolate", "Chocolate com Café",
        "Coco Queimado", "Creme Paris", "Croquer", "Doce de Leite", "Ferrero Rocher", "Flocos",
        "Kinder Ovo", "Leite Condensado", "Leite Ninho", "Leite Ninho Folheado", "Leite Ninho com Oreo",
        "Limão", "Limão Suíço", "Menta com Chocolate", "Milho Verde", "Morango Trufado",
        "Mousse de Maracujá", "Mousse de Uva", "Nozes", "Nutella", "Ovomaltine", "Pistache",
        "Prestígio", "Sensação", "Torta de Chocolate"
    ];

    var PRODUTOS_CAIXAS = [
        { id: "cx5l_2s", nome: "Caixa 5 Litros - 2 Sabores", preco: 100, max: 2 },
        { id: "cx5l_3s", nome: "Caixa 5 Litros - 3 Sabores", preco: 115, max: 3 },
        { id: "cx10l_2s", nome: "Caixa 10 Litros - 2 Sabores", preco: 150, max: 2 },
        { id: "cx10l_3s", nome: "Caixa 10 Litros - 3 Sabores", preco: 165, max: 3 }
    ];

    // --- 2. ESTADO DO SISTEMA ---
    var carrinho = [];
    var produtoAtual = null;
    var saboresSelecionados = [];
    var picolesSelecionados = {}; // { "Sabor": quantidade }
    var editandoIndex = -1;
    var MIN_PICOLES = 100;

    // --- 3. EXPOSIÇÃO GLOBAL (Para os botões HTML) ---

    // Abrir Modal de Sabores (Caixas e Tortas)
    window.abrirSaboresSorvete = function(id, preco, max, nome, indexParaEditar) {
        console.log("🎯 Abrindo sabores:", nome);
        editandoIndex = (typeof indexParaEditar !== 'undefined') ? indexParaEditar : -1;
        produtoAtual = { id: id, preco: preco, max: max, nome: nome, tipo: 'massa' };
        saboresSelecionados = [];

        if (editandoIndex !== -1 && carrinho[editandoIndex]) {
            saboresSelecionados = (carrinho[editandoIndex].sabores || []).slice();
        }

        var subtitulo = document.getElementById('modal-subtítulo-sabores');
        if (subtitulo) subtitulo.textContent = "Escolha " + max + " sabores para " + nome;

        var grid = document.getElementById('grid-sabores');
        if (grid) {
            grid.innerHTML = SABORES_LISTA.map(function(sabor) {
                var isSel = saboresSelecionados.indexOf(sabor) !== -1;
                return '<button class="sabor-item' + (isSel ? ' sel' : '') + '" onclick="window.toggleSabor(\'' + sabor + '\', this)">' + sabor + '</button>';
            }).join('');
        }

        atualizarStatusSabores();
        abrirModal('modal-sabores');
    };

    window.toggleSabor = function(sabor, btn) {
        var idx = saboresSelecionados.indexOf(sabor);
        if (idx !== -1) {
            saboresSelecionados.splice(idx, 1);
            btn.classList.remove('sel');
        } else {
            if (saboresSelecionados.length >= produtoAtual.max) {
                window.mostrarToast && window.mostrarToast("Limite de " + produtoAtual.max + " sabores atingido!");
                return;
            }
            saboresSelecionados.push(sabor);
            btn.classList.add('sel');
        }
        atualizarStatusSabores();
    };

    function atualizarStatusSabores() {
        var btn = document.getElementById('btn-confirmar-sabores');
        var txt = document.getElementById('txt-confirmar-sabores');
        var grid = document.getElementById('grid-sabores');
        if (!btn || !txt) return;

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

    window.confirmarSabores = function() {
        if (saboresSelecionados.length !== produtoAtual.max) return;

        var item = {
            id: editandoIndex !== -1 ? carrinho[editandoIndex].id : ('item_' + Date.now()),
            prodId: produtoAtual.id,
            nome: produtoAtual.nome,
            preco: produtoAtual.preco,
            max: produtoAtual.max,
            sabores: saboresSelecionados.slice(),
            tipo: 'massa',
            qtd: 1
        };

        if (editandoIndex !== -1) carrinho[editandoIndex] = item;
        else carrinho.push(item);

        fecharModal('modal-sabores');
        salvarCarrinho();
    };

    // --- 4. LÓGICA DE PICOLÉS (ATACADO) ---
    window.abrirModalPicole = function() {
        console.log("🍭 Abrindo picolés atacado");
        picolesSelecionados = {};
        
        var lista = document.getElementById('lista-sabores-picolé');
        if (lista) {
            lista.innerHTML = SABORES_LISTA.map(function(sabor) {
                return '<div class="picole-item">' +
                    '<span class="picole-nome">' + sabor + '</span>' +
                    '<div class="picole-controles">' +
                        '<button type="button" onclick="window.alterarQtdPicole(\'' + sabor + '\', -10)">-10</button>' +
                        '<span class="picole-qtd" id="qtd-' + sabor.replace(/\s/g, '_') + '">0</span>' +
                        '<button type="button" onclick="window.alterarQtdPicole(\'' + sabor + '\', 10)">+10</button>' +
                    '</div>' +
                '</div>';
            }).join('');
        }
        
        atualizarStatusPicoles();
        abrirModal('modal-picolés');
    };

    window.alterarQtdPicole = function(sabor, delta) {
        var atual = picolesSelecionados[sabor] || 0;
        var nova = Math.max(0, atual + delta);
        if (nova === 0) delete picolesSelecionados[sabor];
        else picolesSelecionados[sabor] = nova;

        var el = document.getElementById('qtd-' + sabor.replace(/\s/g, '_'));
        if (el) el.textContent = nova;
        
        atualizarStatusPicoles();
    };

    function atualizarStatusPicoles() {
        var total = 0;
        for (var s in picolesSelecionados) total += picolesSelecionados[s];

        var spanTotal = document.getElementById('total-picolés');
        if (spanTotal) spanTotal.textContent = total;

        var btn = document.getElementById('btn-add-picolés');
        if (btn) {
            btn.disabled = (total < MIN_PICOLES);
            btn.textContent = (total < MIN_PICOLES) ? "🔒 Faltam " + (MIN_PICOLES - total) + " picolés" : "✅ Confirmar " + total + " Picolés";
        }
    }

    window.confirmarPickle = function() {
        var total = 0;
        var resumo = [];
        for (var s in picolesSelecionados) {
            total += picolesSelecionados[s];
            resumo.push(picolesSelecionados[s] + "x " + s);
        }

        if (total < MIN_PICOLES) return;

        carrinho.push({
            id: 'pic_' + Date.now(),
            nome: "Lote de Picolés (" + total + " un)",
            preco: total * 1.80, // Preço oficial de atacado
            detalhes: resumo.join(", "),
            tipo: 'picole',
            qtd: 1
        });

        fecharModal('modal-picolés');
        salvarCarrinho();
    };

    // --- 5. GESTÃO DO CARRINHO ---
    function salvarCarrinho() {
        localStorage.setItem('itap_carrinho', JSON.stringify(carrinho));
        if (window.atualizarBotaoCarrinho) window.atualizarBotaoCarrinho();
        window.mostrarToast && window.mostrarToast("Pedido atualizado!");
        renderizarCarrinho();
    }

    window.removerItem = function(index) {
        carrinho.splice(index, 1);
        salvarCarrinho();
    };

    window.limparCarrinho = function() {
        if (confirm("Deseja realmente excluir todo o seu pedido?")) {
            carrinho = [];
            salvarCarrinho();
            fecharModal('modal-carrinho');
        }
    };

    function renderizarCarrinho() {
        var container = document.getElementById('lista-carrinho');
        if (!container) return;

        if (carrinho.length === 0) {
            container.innerHTML = '<div class="carrinho-vazio">Seu carrinho está vazio.</div>';
            return;
        }

        var total = 0;
        container.innerHTML = carrinho.map(function(item, index) {
            total += item.preco;
            var detalhes = item.tipo === 'massa' ? item.sabores.join(", ") : item.detalhes;
            return '<div class="carrinho-item">' +
                '<div class="carrinho-item-info">' +
                    '<strong>' + item.nome + '</strong>' +
                    '<span>' + detalhes + '</span>' +
                    '<strong>R$ ' + item.preco.toFixed(2).replace('.',',') + '</strong>' +
                '</div>' +
                '<div class="carrinho-item-acoes">' +
                    (item.tipo === 'massa' ? '<button onclick="window.abrirSaboresSorvete(\'' + item.prodId + '\', ' + item.preco + ', ' + item.max + ', \'' + item.nome + '\', ' + index + ')">✏️</button>' : '') +
                    '<button onclick="window.removerItem(' + index + ')">🗑️</button>' +
                '</div>' +
            '</div>';
        }).join('');

        var totalEl = document.getElementById('total-carrinho');
        if (totalEl) totalEl.textContent = "R$ " + total.toFixed(2).replace('.',',');
    }

    // --- 6. UTILITÁRIOS DE TELA ---
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
    window.fecharModal = fecharModal;

    window.toggleSecao = function(id) {
        var el = document.getElementById(id);
        if (!el) return;
        var header = el.previousElementSibling;
        var arrow = header ? header.querySelector('.acc-arrow') : null;

        if (el.style.display === 'block') {
            el.style.display = 'none';
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        } else {
            el.style.display = 'block';
            if (arrow) arrow.style.transform = 'rotate(180deg)';
        }
    };

    // --- 7. RENDERIZAÇÃO INICIAL ---
    function renderizarProdutos() {
        var cCaixas = document.getElementById('lista-caixas');
        if (cCaixas) {
            cCaixas.innerHTML = PRODUTOS_CAIXAS.map(function(p) {
                return '<div class="prod-card">' +
                    '<div class="prod-card-sem-foto">🍦</div>' +
                    '<div class="prod-card-body">' +
                        '<div class="prod-nome">' + p.nome + '</div>' +
                        '<div class="prod-preco">R$ ' + p.preco.toFixed(2).replace('.',',') + '</div>' +
                        '<button class="btn-sabores" onclick="window.abrirSaboresSorvete(\'' + p.id + '\', ' + p.preco + ', ' + p.max + ', \'' + p.nome + '\')">Escolher Sabores</button>' +
                    '</div>' +
                '</div>';
            }).join('');
        }

        var cTortas = document.getElementById('lista-tortas');
        if (cTortas) {
            cTortas.innerHTML = '<div class="prod-card">' +
                '<div class="prod-card-sem-foto">🎂</div>' +
                '<div class="prod-card-body">' +
                    '<div class="prod-nome">Torta de Sorvete (Especial)</div>' +
                    '<div class="prod-preco">R$ 100,00</div>' +
                    '<button class="btn-sabores" onclick="window.abrirSaboresSorvete(\'torta\', 100, 3, \'Torta de Sorvete\')">Escolher Sabores</button>' +
                '</div>' +
            '</div>';
        }
        
        // Picolés (Apenas botão de abrir)
        var cPicoles = document.getElementById('lista-picolés');
        if (cPicoles) {
            cPicoles.innerHTML = '<div class="prod-card">' +
                '<div class="prod-card-sem-foto">🍭</div>' +
                '<div class="prod-card-body">' +
                    '<div class="prod-nome">Picolés em Atacado</div>' +
                    '<div class="prod-preco">R$ 1,80 (unidade)</div>' +
                    '<button class="btn-sabores" onclick="window.abrirModalPicole()">Escolher Sabores</button>' +
                '</div>' +
            '</div>';
        }
    }

    function init() {
        var salvo = localStorage.getItem('itap_carrinho');
        if (salvo) {
            try { carrinho = JSON.parse(salvo); } catch(e) { carrinho = []; }
        }
        renderizarProdutos();
        renderizarCarrinho();
        if (window.atualizarBotaoCarrinho) window.atualizarBotaoCarrinho();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window, document);
