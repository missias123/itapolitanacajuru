
(function(window, document) {
    'use strict';
    
    var SABORES = ["Abacaxi ao Vinho", "Amarena", "Chocolate", "Ferrero Rocher", "Leite Ninho", "Morango Trufado", "Nutella", "Pistache", "Sensação", "Torta de Chocolate"];
    var PRODUTOS = [
        { id: "cx5l_2s", nome: "Caixa 5 Litros - 2 Sabores", preco: 100, max: 2, cat: 'caixas' },
        { id: "cx5l_3s", nome: "Caixa 5 Litros - 3 Sabores", preco: 115, max: 3, cat: 'caixas' },
        { id: "cx10l_2s", nome: "Caixa 10 Litros - 2 Sabores", preco: 150, max: 2, cat: 'caixas' },
        { id: "cx10l_3s", nome: "Caixa 10 Litros - 3 Sabores", preco: 165, max: 3, cat: 'caixas' }
    ];

    var carrinho = [];
    var produtoAtual = null;
    var saboresSelecionados = [];
    var picolesSelecionados = {};

    window.toggleSecao = function(id) {
        var el = document.getElementById(id);
        var isOpen = el.style.display === 'block';
        document.querySelectorAll('.categoria-conteudo').forEach(c => c.style.display = 'none');
        el.style.display = isOpen ? 'none' : 'block';
    };

    window.abrirModal = function(id) {
        document.getElementById(id).style.display = 'flex';
        document.body.classList.add('lock-scroll');
    };

    window.fecharModal = function(id) {
        document.getElementById(id).style.display = 'none';
        document.body.classList.remove('lock-scroll');
    };

    window.abrirSaboresSorvete = function(id, preco, max, nome) {
        produtoAtual = { id: id, preco: preco, max: max, nome: nome };
        saboresSelecionados = [];
        document.getElementById('modal-subtitulo-sabores').textContent = "Escolha " + max + " sabores";
        var grid = document.getElementById('grid-sabores');
        grid.innerHTML = SABORES.map(s => `<div class="sabor-item" onclick="window.toggleSabor('${s}', this)">${s}</div>`).join('');
        grid.classList.remove('limite-atingido');
        document.getElementById('btn-confirmar-sabores').disabled = true;
        window.abrirModal('modal-sabores');
    };

    window.toggleSabor = function(sabor, el) {
        var idx = saboresSelecionados.indexOf(sabor);
        if (idx > -1) {
            saboresSelecionados.splice(idx, 1);
            el.classList.remove('sel');
        } else {
            if (saboresSelecionados.length < produtoAtual.max) {
                saboresSelecionados.push(sabor);
                el.classList.add('sel');
            }
        }
        var grid = document.getElementById('grid-sabores');
        if (saboresSelecionados.length >= produtoAtual.max) grid.classList.add('limite-atingido');
        else grid.classList.remove('limite-atingido');
        document.getElementById('btn-confirmar-sabores').disabled = (saboresSelecionados.length !== produtoAtual.max);
    };

    window.confirmarSabores = function() {
        carrinho.push({
            nome: produtoAtual.nome,
            preco: produtoAtual.preco,
            detalhes: saboresSelecionados.join(', ')
        });
        window.fecharModal('modal-sabores');
        atualizarCarrinho();
    };

    window.abrirModalPicole = function() {
        picolesSelecionados = {};
        var lista = document.getElementById('lista-sabores-picole');
        lista.innerHTML = SABORES.map(s => `
            <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                <span>${s}</span>
                <div>
                    <button onclick="window.addPicole('${s}', -10)">-</button>
                    <span id="q-${s}" style="margin:0 10px;">0</span>
                    <button onclick="window.addPicole('${s}', 10)">+</button>
                </div>
            </div>
        `).join('');
        window.abrirModal('modal-picoles');
    };

    window.addPicole = function(sabor, qtd) {
        var atual = picolesSelecionados[sabor] || 0;
        picolesSelecionados[sabor] = Math.max(0, atual + qtd);
        document.getElementById('q-' + sabor).textContent = picolesSelecionados[sabor];
        var total = Object.values(picolesSelecionados).reduce((a, b) => a + b, 0);
        document.getElementById('total-picoles').textContent = total;
        document.getElementById('btn-confirmar-picoles').disabled = (total < 100);
    };

    window.confirmarPickle = function() {
        var total = Object.values(picolesSelecionados).reduce((a, b) => a + b, 0);
        var detalhes = Object.entries(picolesSelecionados).filter(e => e[1] > 0).map(e => e[1] + 'x ' + e[0]).join(', ');
        carrinho.push({
            nome: "Lote de Picolés (" + total + " un)",
            preco: total * 1.80,
            detalhes: detalhes
        });
        window.fecharModal('modal-picoles');
        atualizarCarrinho();
    };

    window.abrirCarrinho = function() {
        var lista = document.getElementById('lista-carrinho');
        var total = 0;
        lista.innerHTML = carrinho.map((item, i) => {
            total += item.preco;
            return `
                <div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
                    <div><strong>${item.nome}</strong><br><small>${item.detalhes}</small></div>
                    <div>R$ ${item.preco.toFixed(2)} <button onclick="window.removerItem(${i})">🗑️</button></div>
                </div>
            `;
        }).join('');
        document.getElementById('total-carrinho').textContent = "R$ " + total.toFixed(2);
        window.abrirModal('modal-carrinho');
    };

    window.removerItem = function(i) {
        carrinho.splice(i, 1);
        window.abrirCarrinho();
        atualizarCarrinho();
    };

    window.limparCarrinho = function() {
        if (confirm("Limpar pedido?")) {
            carrinho = [];
            atualizarCarrinho();
            window.fecharModal('modal-carrinho');
        }
    };

    function atualizarCarrinho() {
        var total = carrinho.reduce((a, b) => a + b.preco, 0);
        var btn = document.getElementById('btn-carrinho-fixo');
        if (carrinho.length > 0) {
            btn.style.display = 'flex';
            document.getElementById('carrinho-qtd').textContent = carrinho.length;
            document.getElementById('carrinho-total').textContent = "R$ " + total.toFixed(2);
        } else {
            btn.style.display = 'none';
        }
    }

    window.finalizarPedido = function() {
        var texto = "Olá! Gostaria de fazer uma encomenda:\n\n" + 
            carrinho.map(i => "* " + i.nome + " (" + i.detalhes + ") - R$ " + i.preco.toFixed(2)).join('\n') + 
            "\n\n*Total: R$ " + carrinho.reduce((a, b) => a + b.preco, 0).toFixed(2) + "*";
        window.open("https://wa.me/5516996062046?text=" + encodeURIComponent(texto));
    };

    // Render Inicial
    document.getElementById('lista-caixas').innerHTML = PRODUTOS.map(p => `
        <div class="prod-card">
            <div class="prod-nome">${p.nome}</div>
            <div class="prod-preco">R$ ${p.preco.toFixed(2)}</div>
            <button class="btn-sabores" onclick="window.abrirSaboresSorvete('${p.id}', ${p.preco}, ${p.max}, '${p.nome}')">Escolher Sabores</button>
        </div>
    `).join('');
    
    document.getElementById('lista-tortas').innerHTML = `
        <div class="prod-card">
            <div class="prod-nome">Torta Especial</div>
            <div class="prod-preco">R$ 100,00</div>
            <button class="btn-sabores" onclick="window.abrirSaboresSorvete('torta', 100, 3, 'Torta Especial')">Escolher Sabores</button>
        </div>
    `;

    document.getElementById('lista-picoles').innerHTML = `
        <div class="prod-card">
            <div class="prod-nome">Lote Picolés</div>
            <div class="prod-preco">R$ 1,80 / un</div>
            <button class="btn-sabores" onclick="window.abrirModalPicole()">Escolher Sabores</button>
        </div>
    `;

})(window, document);

