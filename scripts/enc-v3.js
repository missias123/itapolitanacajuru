/**
 * ITAPOLITANA CAJURU - Lógica de Encomendas v3.3 (CLÁSSICA BLINDADA)
 * Baseada na estabilidade de Maio/2026 com a inteligência de Agosto/2026.
 */

(function(window, document) {
    'use strict';
    console.log("🍦 Sistema de Encomendas v3.3 (Estabilidade Total) carregando...");

    // 1. DADOS OFICIAIS (35 SABORES) - Redundância Total
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

    // 2. ESTADO DO SISTEMA
    var carrinho = [];
    var produtoAtual = null;
    var saboresSelecionados = [];
    var editandoIndex = -1;

    // 3. FUNÇÕES DE ABERTURA (EXPOSIÇÃO GLOBAL IMEDIATA)
    window.abrirSaboresSorvete = function(id, preco, max, nome, indexParaEditar) {
        console.log("🎯 Abrindo sabores para:", nome);
        
        // Reset ou Carregamento de Edição
        editandoIndex = (typeof indexParaEditar !== 'undefined') ? indexParaEditar : -1;
        produtoAtual = { id: id, preco: preco, max: max, nome: nome };
        saboresSelecionados = [];

        if (editandoIndex !== -1 && carrinho[editandoIndex]) {
            saboresSelecionados = (carrinho[editandoIndex].sabores || []).slice();
        }

        // Atualizar Textos do Modal
        var subtitulo = document.getElementById('modal-subtítulo-sabores');
        if (subtitulo) subtitulo.textContent = "Escolha " + max + " sabores para " + nome;

        var btnConf = document.getElementById('btn-confirmar-sabores');
        if (btnConf) btnConf.textContent = (editandoIndex !== -1) ? "Salvar Alterações" : "✓ Confirmar Seleção";

        // Renderizar Grid de Sabores
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
                if (window.mostrarToast) window.mostrarToast("Limite de " + produtoAtual.max + " sabores atingido!");
                else alert("Limite de " + produtoAtual.max + " sabores atingido!");
                return;
            }
            saboresSelecionados.push(sabor);
            btn.classList.add('sel');
        }
        atualizarStatusSabores();
    };

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

    window.confirmarSabores = function() {
        if (saboresSelecionados.length !== produtoAtual.max) return;

        var item = {
            id: editandoIndex !== -1 ? carrinho[editandoIndex].id : ('massa_' + Date.now()),
            prodId: produtoAtual.id,
            nome: produtoAtual.nome,
            preco: produtoAtual.preco,
            max: produtoAtual.max,
            sabores: saboresSelecionados.slice(),
            tipo: 'massa'
        };

        if (editandoIndex !== -1) carrinho[editandoIndex] = item;
        else carrinho.push(item);

        fecharModal('modal-sabores');
        salvarCarrinho();
    };

    // 4. UTILITÁRIOS DE MODAL E CARRINHO
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

    function salvarCarrinho() {
        localStorage.setItem('itap_carrinho', JSON.stringify(carrinho));
        if (window.atualizarBotaoCarrinho) window.atualizarBotaoCarrinho();
        if (window.mostrarToast) window.mostrarToast("Adicionado ao carrinho!");
    }

    // 5. RENDERIZAÇÃO INICIAL (O CORAÇÃO DO SITE)
    function renderizarProdutos() {
        console.log("🎨 Renderizando produtos na tela...");
        
        // Caixas
        var containerCaixas = document.getElementById('lista-caixas');
        if (containerCaixas) {
            containerCaixas.innerHTML = PRODUTOS_CAIXAS.map(function(p) {
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

        // Tortas
        var containerTortas = document.getElementById('lista-tortas');
        if (containerTortas) {
            containerTortas.innerHTML = '<div class="prod-card">' +
                '<div class="prod-card-sem-foto">🎂</div>' +
                '<div class="prod-card-body">' +
                    '<div class="prod-nome">Torta de Sorvete (Especial)</div>' +
                    '<div class="prod-preco">R$ 100,00</div>' +
                    '<button class="btn-sabores" onclick="window.abrirSaboresSorvete(\'torta\', 100, 3, \'Torta de Sorvete\')">Escolher Sabores</button>' +
                '</div>' +
            '</div>';
        }
    }

    // 6. INICIALIZAÇÃO SEGURA
    function init() {
        var salvo = localStorage.getItem('itap_carrinho');
        if (salvo) {
            try { carrinho = JSON.parse(salvo); } catch(e) { carrinho = []; }
        }
        renderizarProdutos();
        if (window.atualizarBotaoCarrinho) window.atualizarBotaoCarrinho();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window, document);
