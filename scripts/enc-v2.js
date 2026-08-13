/**
 * ITAPOLITANA CAJURU - Lógica de Encomendas v2.1 (UX Genius Edition)
 * Compatível com ganchos HTML de encomendas.html
 */

(function(window) {
    'use strict';

    // --- ESTADO ---
    let carrinho = [];
    let produtoAtual = null;
    let saboresSelecionados = [];
    let picolésSelecionados = {}; // { sabor: quantidade }
    
    // Dados Locais (Fallback se products.js falhar)
    const DADOS_LOCAL = {
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
        console.log("📦 Encomendas: Inicializando...");
        renderizarCaixas();
        renderizarTortas();
        atualizarBotãoCarrinho();
        
        // Listener para dados carregados do products.js (se disponível)
        document.addEventListener('produtosNuvemCarregados', function() {
            console.log("📦 Encomendas: Dados da nuvem recebidos.");
            renderizarCaixas();
            renderizarTortas();
        });
    }

    // --- RENDERIZAÇÃO ---
    function renderizarCaixas() {
        const container = document.getElementById('lista-caixas');
        if (!container) return;
        const caixas = (window._itap_caixas && window._itap_caixas.length) ? window._itap_caixas : DADOS_LOCAL.caixas;
        
        container.innerHTML = caixas.map(p => `
            <div class="prod-card">
                <div class="prod-nome">${p.nome}</div>
                <div class="prod-preço">R$ ${p.preço},00</div>
                <button class="btn-sabores" onclick="abrirSaboresSorvete('${p.id}', 'caixas')">Escolher Sabores</button>
            </div>
        `).join('');
    }

    function renderizarTortas() {
        const container = document.getElementById('lista-tortas');
        if (!container) return;
        const tortas = (window._itap_tortas && window._itap_tortas.length) ? window._itap_tortas : DADOS_LOCAL.tortas;

        container.innerHTML = tortas.map(p => `
            <div class="prod-card">
                <div class="prod-nome">${p.nome}</div>
                <div class="prod-preço">R$ ${p.preço},00</div>
                <button class="btn-sabores" onclick="abrirSaboresSorvete('${p.id}', 'tortas')">Escolher Sabores</button>
            </div>
        `).join('');
    }

    // --- CONTROLE DE SEÇÕES (ACCORDION) ---
    function toggleSecao(id) {
        const conteudo = document.getElementById(id);
        if (!conteudo) return;
        
        const isAberto = conteudo.classList.contains('aberto');
        
        // Fecha todos
        document.querySelectorAll('.categoria-conteudo').forEach(el => el.classList.remove('aberto'));
        document.querySelectorAll('.categoria-header').forEach(el => el.classList.remove('aberta'));

        if (!isAberto) {
            conteudo.classList.add('aberto');
            conteudo.parentElement.querySelector('.categoria-header').classList.add('aberta');
            conteudo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // --- MODAIS ---
    function abrirModal(id) {
        const m = document.getElementById(id);
        if (m) m.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function fecharModal(id) {
        const m = document.getElementById(id);
        if (m) m.style.display = 'none';
        document.body.style.overflow = '';
    }

    // --- FLUXO SABORES ---
    function abrirSaboresSorvete(id, tipo) {
        const lista = tipo === 'caixas' ? 
            ((window._itap_caixas || DADOS_LOCAL.caixas)) : 
            ((window._itap_tortas || DADOS_LOCAL.tortas));
            
        produtoAtual = lista.find(p => p.id === id);
        if (!produtoAtual) return;

        saboresSelecionados = [];
        
        const titulo = document.getElementById('modal-título-sabores');
        if (titulo) titulo.textContent = produtoAtual.nome;
        
        const sub = document.getElementById('modal-subtítulo-sabores');
        if (sub) sub.textContent = `Escolha exatamente ${produtoAtual.maxSabores} sabores`;

        renderizarGridSabores();
        atualizarStatusSabores();
        abrirModal('modal-sabores');
    }

    function renderizarGridSabores() {
        const grid = document.getElementById('grid-sabores');
        if (!grid) return;
        
        const sabores = (window.PRODUTOS_DATA && window.PRODUTOS_DATA.sorvetes && window.PRODUTOS_DATA.sorvetes.sabores) ? 
            window.PRODUTOS_DATA.sorvetes.sabores : DADOS_LOCAL.sabores;

        grid.innerHTML = sabores.map(s => `
            <button class="sabor-item" onclick="toggleSabor('${s}', this)">${s}</button>
        `).join('');
    }

    function toggleSabor(sabor, btn) {
        const idx = saboresSelecionados.indexOf(sabor);
        if (idx !== -1) {
            saboresSelecionados.splice(idx, 1);
            btn.classList.remove('sel');
        } else {
            if (saboresSelecionados.length >= produtoAtual.maxSabores) {
                alert(`⚠️ Máximo de ${produtoAtual.maxSabores} sabores atingido!`);
                return;
            }
            saboresSelecionados.push(sabor);
            btn.classList.add('sel');
        }
        atualizarStatusSabores();
    }

    function atualizarStatusSabores() {
        const txt = document.getElementById('txt-confirmar-sabores');
        const btn = document.getElementById('btn-confirmar-sabores');
        if (!txt || !btn) return;

        const falta = produtoAtual.maxSabores - saboresSelecionados.length;
        
        if (falta === 0) {
            txt.textContent = "Tudo pronto! Pode confirmar.";
            btn.disabled = false;
            btn.style.opacity = "1";
        } else {
            txt.textContent = `Faltam ${falta} sabor(es)...`;
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
            sabores: [...saboresSelecionados],
            quantidade: 1
        });

        fecharModal('modal-sabores');
        atualizarBotãoCarrinho();
        mostrarToast(`✅ ${produtoAtual.nome} adicionado!`);
    }

    // --- CARRINHO ---
    function atualizarBotãoCarrinho() {
        const btn = document.getElementById('btn-carrinho');
        const badge = document.getElementById('carrinho-badge');
        const valor = document.getElementById('carrinho-valor');
        
        if (!btn) return;

        const totalItens = carrinho.length;
        const totalPreço = carrinho.reduce((sum, item) => sum + (item.preço * item.quantidade), 0);

        if (totalItens > 0) {
            btn.style.display = 'flex';
            if (badge) badge.textContent = totalItens;
            if (valor) valor.textContent = `R$ ${totalPreço.toFixed(2).replace('.', ',')}`;
        } else {
            btn.style.display = 'none';
        }
    }

    function abrirCarrinho() {
        renderizarItensCarrinho();
        abrirModal('modal-carrinho');
    }

    function renderizarItensCarrinho() {
        const lista = document.getElementById('lista-carrinho');
        const totalTxt = document.getElementById('total-carrinho');
        if (!lista) return;

        if (carrinho.length === 0) {
            lista.innerHTML = '<p style="text-align:center;padding:20px;color:#666;">Seu carrinho está vazio.</p>';
            if (totalTxt) totalTxt.textContent = "R$ 0,00";
            return;
        }

        lista.innerHTML = carrinho.map((item, index) => `
            <div class="carrinho-item" style="display:flex;justify-content:space-between;padding:12px;border-bottom:1px solid #eee;align-items:center;">
                <div>
                    <div style="font-weight:800;font-size:0.9rem;">${item.nome}</div>
                    <div style="font-size:0.75rem;color:#666;">${item.sabores ? item.sabores.join(', ') : ''}</div>
                    <div style="font-weight:700;color:var(--azul);">R$ ${item.preço},00</div>
                </div>
                <button onclick="removerItem(${index})" style="background:none;border:none;color:#D32F2F;font-weight:900;padding:8px;cursor:pointer;">✕</button>
            </div>
        `).join('');

        const total = carrinho.reduce((sum, item) => sum + (item.preço * item.quantidade), 0);
        if (totalTxt) totalTxt.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    function removerItem(index) {
        carrinho.splice(index, 1);
        renderizarItensCarrinho();
        atualizarBotãoCarrinho();
    }

    function mostrarToast(msg) {
        const t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('ativo');
        setTimeout(() => t.classList.remove('ativo'), 3000);
    }

    // --- EXPOSIÇÃO GLOBAL (Obrigatório para onclick do HTML) ---
    window.toggleSecao = toggleSecao;
    window.abrirSaboresSorvete = abrirSaboresSorvete;
    window.toggleSabor = toggleSabor;
    window.confirmarSabores = confirmarSabores;
    window.fecharModal = fecharModal;
    window.abrirCarrinho = abrirCarrinho;
    window.removerItem = removerItem;
    window.fecharCarrinho = () => fecharModal('modal-carrinho');

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window);
