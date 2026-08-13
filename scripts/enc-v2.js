/**
 * ITAPOLITANA CAJURU - Lógica de Encomendas v2.3 (UX Genius Edition)
 * Correção Crítica: Inicialização de Variáveis e Exposição Global
 */

(function(window) {
    'use strict';

    // --- ESTADO ---
    var carrinho = [];
    var produtoAtual = null;
    var saboresSelecionados = [];
    
    // Dados Locais (Fallback)
    var DADOS_LOCAL = {
        caixas: [
            { id: "cx5l_2s", nome: "Caixa 5 Litros - 2 Sabores", preço: 100, maxSabores: 2 },
            { id: "cx5l_3s", nome: "Caixa 5 Litros - 3 Sabores", preço: 115, maxSabores: 3 },
            { id: "cx10l_2s", nome: "Caixa 10 Litros - 2 Sabores", preço: 150, maxSabores: 2 },
            { id: "cx10l_3s", nome: "Caixa 10 Litros - 3 Sabores", preço: 165, maxSabores: 3 }
        ],
        tortas: [
            { id: "torta1", nome: "Torta de Sorvete", preço: 100, maxSabores: 3 }
        ],
        sabores: ["Abacaxi", "Amendoim", "Banana", "Baunilha", "Beijinho", "Blue Ice", "Brigadeiro", "Chocolate", "Coco", "Creme", "Doce de Leite", "Flocos", "Limão", "Milho Verde", "Morango", "Ninho c/ Nutella", "Passas ao Rum", "Pistache", "Sensação", "Uva"]
    };

    // --- INICIALIZAÇÃO ---
    function init() {
        console.log("📦 Encomendas: Inicializando v2.3...");
        renderizarCaixas();
        renderizarTortas();
        atualizarBotãoCarrinho();
        
        window.addEventListener('produtosNuvemCarregados', function() {
            renderizarCaixas();
            renderizarTortas();
        });
    }

    // --- RENDERIZAÇÃO ---
    function renderizarCaixas() {
        var container = document.getElementById('lista-caixas');
        if (!container) return;
        var caixas = (window._itap_caixas && window._itap_caixas.length > 0) ? window._itap_caixas : DADOS_LOCAL.caixas;
        container.innerHTML = caixas.map(function(p) {
            return '<div class="prod-card">' +
                '<div class="prod-nome">' + p.nome + '</div>' +
                '<div class="prod-preço">R$ ' + p.preço + ',00</div>' +
                '<button class="btn-sabores" onclick="window.abrirSaboresSorvete(\'' + p.id + '\', \'caixas\')">Escolher Sabores</button>' +
            '</div>';
        }).join('');
    }

    function renderizarTortas() {
        var container = document.getElementById('lista-tortas');
        if (!container) return;
        var tortas = (window._itap_tortas && window._itap_tortas.length > 0) ? window._itap_tortas : DADOS_LOCAL.tortas;
        container.innerHTML = tortas.map(function(p) {
            return '<div class="prod-card">' +
                '<div class="prod-nome">' + p.nome + '</div>' +
                '<div class="prod-preço">R$ ' + p.preço + ',00</div>' +
                '<button class="btn-sabores" onclick="window.abrirSaboresSorvete(\'' + p.id + '\', \'tortas\')">Escolher Sabores</button>' +
            '</div>';
        }).join('');
    }

    // --- MODAIS ---
    function abrirModal(id) {
        var m = document.getElementById(id);
        if (m) m.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function fecharModal(id) {
        var m = document.getElementById(id);
        if (m) m.style.display = 'none';
        document.body.style.overflow = '';
    }

    // --- FLUXO SABORES ---
    function abrirSaboresSorvete(id, tipo) {
        var lista = tipo === 'caixas' ? 
            (window._itap_caixas || DADOS_LOCAL.caixas) : 
            (window._itap_tortas || DADOS_LOCAL.tortas);
            
        produtoAtual = lista.find(function(p) { return p.id === id; });
        if (!produtoAtual) return;

        saboresSelecionados = [];
        var titulo = document.getElementById('modal-título-sabores');
        if (titulo) titulo.textContent = produtoAtual.nome;
        
        renderizarGridSabores();
        atualizarStatusSabores();
        abrirModal('modal-sabores');
    }

    function renderizarGridSabores() {
        var grid = document.getElementById('grid-sabores');
        if (!grid) return;
        var sabores = (window.PRODUTOS_DATA && window.PRODUTOS_DATA.sorvetes && window.PRODUTOS_DATA.sorvetes.sabores) ? 
            window.PRODUTOS_DATA.sorvetes.sabores : DADOS_LOCAL.sabores;

        grid.innerHTML = sabores.map(function(s) {
            return '<button class="sabor-item" onclick="window.toggleSabor(\'' + s + '\', this)">' + s + '</button>';
        }).join('');
    }

    function toggleSabor(sabor, btn) {
        var idx = saboresSelecionados.indexOf(sabor);
        if (idx !== -1) {
            saboresSelecionados.splice(idx, 1);
            btn.classList.remove('sel');
        } else {
            if (saboresSelecionados.length >= produtoAtual.maxSabores) {
                alert('⚠️ Máximo de ' + produtoAtual.maxSabores + ' sabores atingido!');
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
        if (!txt || !btn) return;
        var falta = produtoAtual.maxSabores - saboresSelecionados.length;
        if (falta === 0) {
            txt.textContent = "Tudo pronto! Pode confirmar.";
            btn.disabled = false;
            btn.style.opacity = "1";
        } else {
            txt.textContent = "Faltam " + falta + " sabor(es)...";
            btn.disabled = true;
            btn.style.opacity = "0.5";
        }
    }

    function confirmarSabores() {
        if (!produtoAtual || saboresSelecionados.length !== produtoAtual.maxSabores) return;
        carrinho.push({
            id: produtoAtual.id + '_' + Date.now(),
            nome: produtoAtual.nome,
            preço: produtoAtual.preço,
            sabores: saboresSelecionados.slice(),
            quantidade: 1
        });
        fecharModal('modal-sabores');
        atualizarBotãoCarrinho();
    }

    function atualizarBotãoCarrinho() {
        var btn = document.getElementById('btn-carrinho');
        var badge = document.getElementById('carrinho-badge');
        var valor = document.getElementById('carrinho-valor');
        if (!btn) return;
        var totalItens = carrinho.length;
        var totalPreço = carrinho.reduce(function(sum, item) { return sum + item.preço; }, 0);
        if (totalItens > 0) {
            btn.style.display = 'flex';
            if (badge) badge.textContent = totalItens;
            if (valor) valor.textContent = 'R$ ' + totalPreço + ',00';
        } else {
            btn.style.display = 'none';
        }
    }

    // --- EXPOSIÇÃO GLOBAL ---
    window.abrirSaboresSorvete = abrirSaboresSorvete;
    window.toggleSabor = toggleSabor;
    window.confirmarSabores = confirmarSabores;
    window.fecharModal = fecharModal;
    window.toggleSecao = function(id) {
        var conteudo = document.getElementById(id);
        if (!conteudo) return;
        var isAberto = conteudo.classList.contains('aberto');
        document.querySelectorAll('.categoria-conteudo').forEach(function(el) { el.classList.remove('aberto'); });
        if (!isAberto) {
            conteudo.classList.add('aberto');
            conteudo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    init();

})(window);
