/**
 * ITAPOLITANA CAJURU - Lógica de Encomendas v3.1 (BLINDAGEM TOTAL)
 * Foco: Redundância absoluta, sem dependências externas, compatibilidade ES5.
 */

(function(window) {
    'use strict';
    console.log("🚀 Script Encomendas v3.1 carregando...");

    // 1. DADOS DE REDUNDÂNCIA (Caso products.js falhe)
    var SABORES_DEFAULT = [
        "Abacaxi ao Vinho", "Abacaxi Suíço", "Algodão Docê (Blue Ice)", "Amarena", "Ameixa",
        "Banana com Nutella", "Bis e Trufa", "Cereja Trufada", "Chocolate", "Chocolate com Café",
        "Coco Queimado", "Creme Paris", "Croquer", "Doce de Leite", "Ferrero Rocher", "Flocos",
        "Kinder Ovo", "Leite Condensado", "Leite Ninho", "Leite Ninho Folheado", "Leite Ninho com Oreo",
        "Limão", "Limão Suíço", "Menta com Chocolate", "Milho Verde", "Morango Trufado",
        "Mousse de Maracujá", "Mousse de Uva", "Nozes", "Nutella", "Ovomaltine", "Pistache",
        "Prestígio", "Sensação", "Torta de Chocolate"
    ];

    var CAIXAS_DEFAULT = [
        { id: "cx5l_2s", nome: "Caixa 5 Litros - 2 Sabores", preço: 100, max: 2 },
        { id: "cx5l_3s", nome: "Caixa 5 Litros - 3 Sabores", preço: 115, max: 3 },
        { id: "cx10l_2s", nome: "Caixa 10 Litros - 2 Sabores", preço: 150, max: 2 },
        { id: "cx10l_3s", nome: "Caixa 10 Litros - 3 Sabores", preço: 165, max: 3 }
    ];

    // 2. VARIÁVEIS DE ESTADO
    var carrinho = [];
    var produtoAtual = null;
    var editandoIndex = -1;
    var saboresSelecionados = [];
    var picolesSelecionados = {};
    var MIN_PICOLES = 100;

    // 3. EXPOSIÇÃO GLOBAL IMEDIATA (PLANO B)
    window.abrirSaboresSorvete = function(id, preço, max, nome, indexParaEditar) {
        console.log("🖱️ Clique: abrirSaboresSorvete", id);
        editandoIndex = (typeof indexParaEditar !== 'undefined') ? indexParaEditar : -1;
        produtoAtual = { id: id, preço: preço, max: max, nome: nome };
        saboresSelecionados = [];
        
        var btnConfirmar = document.getElementById('btn-confirmar-sabores');
        var subtitulo = document.getElementById('modal-subtítulo-sabores');
        
        if (editandoIndex !== -1) {
            saboresSelecionados = carrinho[editandoIndex].sabores.slice();
            if (btnConfirmar) btnConfirmar.textContent = "Salvar Alterações";
        } else {
            if (btnConfirmar) btnConfirmar.textContent = "✓ Confirmar Seleção";
        }
        
        if (subtitulo) subtitulo.textContent = "Escolha " + max + " sabores para " + nome;
        
        var grid = document.getElementById('grid-sabores');
        if (!grid) return;

        var listaSabores = SABORES_DEFAULT;
        if (window.PRODUTOS_DATA && window.PRODUTOS_DATA.sorvetes && window.PRODUTOS_DATA.sorvetes.sabores) {
            listaSabores = window.PRODUTOS_DATA.sorvetes.sabores;
        }
            
        grid.innerHTML = listaSabores.map(function(s) {
            var sel = saboresSelecionados.indexOf(s) !== -1 ? ' sel' : '';
            return '<button class="sabor-item' + sel + '" onclick="window.toggleSabor(\'' + s + '\', this)">' + s + '</button>';
        }).join('');
        
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
                mostrarToast("Limite de " + produtoAtual.max + " sabores atingido!");
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
            preço: produtoAtual.preço,
            max: produtoAtual.max,
            sabores: saboresSelecionados.slice(),
            tipo: 'massa'
        };
        if (editandoIndex !== -1) carrinho[editandoIndex] = item;
        else carrinho.push(item);
        fecharModal('modal-sabores');
        finalizarAcaoCarrinho();
    };

    window.abrirModalPicole = function(key, indexParaEditar) {
        editandoIndex = (typeof indexParaEditar !== 'undefined') ? indexParaEditar : -1;
        var picolesData = (window.PRODUTOS_DATA && window.PRODUTOS_DATA.picolés) ? window.PRODUTOS_DATA.picolés : {};
        var p = picolesData[key];
        if (!p) return;
        
        produtoAtual = { id: key, nome: p.nome, preço: p.preço_atacado };
        picolesSelecionados = {};
        if (editandoIndex !== -1) picolesSelecionados = Object.assign({}, carrinho[editandoIndex].detalhes_raw || {});
        
        var titulo = document.getElementById('picolé-título');
        if (titulo) titulo.textContent = p.nome;
        
        var container = document.getElementById('lista-sabores-picolé');
        if (container) {
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
        }
        atualizarStatusPicoles();
        abrirModal('modal-picolé');
        var tSabores = document.getElementById('picolé-tela-sabores');
        var tTipos = document.getElementById('picolé-tela-tipos');
        if (tSabores) tSabores.style.display = 'block';
        if (tTipos) tTipos.style.display = 'none';
    };

    window.altQtdPicole = function(sabor, delta) {
        var n = (picolesSelecionados[sabor] || 0) + delta;
        if (n < 0) n = 0;
        picolesSelecionados[sabor] = n;
        var el = document.getElementById('qtd-' + sabor.replace(/\s/g, '_'));
        if (el) el.textContent = n;
        atualizarStatusPicoles();
    };

    function atualizarStatusPicoles() {
        var total = 0;
        Object.keys(picolesSelecionados).forEach(function(k) { total += picolesSelecionados[k]; });
        var btn = document.getElementById('btn-add-picolés');
        var tGeral = document.getElementById('total-picolés');
        if (tGeral) tGeral.textContent = total;
        if (btn) {
            btn.disabled = (total < MIN_PICOLES);
            btn.textContent = (total < MIN_PICOLES) ? "Mínimo 100 unidades" : "Adicionar " + total + " picolés";
        }
    }

    window.confirmarPickle = function() {
        var total = 0;
        var det = [];
        var detRaw = {};
        Object.keys(picolesSelecionados).forEach(function(s) {
            var q = picolesSelecionados[s];
            if (q > 0) { total += q; det.push(q + "x " + s); detRaw[s] = q; }
        });
        if (total < MIN_PICOLES) return;
        var item = {
            id: editandoIndex !== -1 ? carrinho[editandoIndex].id : ('picole_' + Date.now()),
            prodId: produtoAtual.id,
            nome: produtoAtual.nome,
            preço: (produtoAtual.preço * total),
            detalhes: det.join(', '),
            detalhes_raw: detRaw,
            tipo: 'picole'
        };
        if (editandoIndex !== -1) carrinho[editandoIndex] = item;
        else carrinho.push(item);
        fecharModal('modal-picolé');
        finalizarAcaoCarrinho();
    };

    function abrirModal(id) {
        var m = document.getElementById(id);
        if (m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
    }

    function fecharModal(id) {
        var m = document.getElementById(id);
        if (m) { m.style.display = 'none'; document.body.style.overflow = ''; }
    }
    window.fecharModal = fecharModal;

    function finalizarAcaoCarrinho() {
        localStorage.setItem('itap_carrinho', JSON.stringify(carrinho));
        atualizarBotaoCarrinho();
        mostrarToast("Adicionado ao carrinho!");
    }

    function atualizarBotaoCarrinho() {
        var btn = document.getElementById('btn-carrinho');
        var badge = document.getElementById('carrinho-badge');
        var totalEl = document.getElementById('carrinho-total');
        if (carrinho.length > 0) {
            if (btn) btn.classList.add('ativo');
            if (badge) badge.textContent = carrinho.length;
            var t = 0; carrinho.forEach(function(i) { t += i.preço; });
            if (totalEl) totalEl.textContent = 'R$ ' + t.toFixed(2).replace('.',',');
        } else {
            if (btn) btn.classList.remove('ativo');
        }
    }
    window.abrirCarrinho = function() {
        var lista = document.getElementById('lista-carrinho');
        var totalEl = document.getElementById('total-carrinho');
        if (!lista) return;
        if (carrinho.length === 0) {
            lista.innerHTML = '<div style="text-align:center;padding:40px;color:#666;">Seu carrinho está vazio.</div>';
            if (totalEl) totalEl.textContent = 'R$ 0,00';
        } else {
            lista.innerHTML = carrinho.map(function(item, idx) {
                var d = item.tipo === 'massa' ? item.sabores.join(', ') : item.detalhes;
                return '<div class="resumo-item">' +
                    '<div class="resumo-item-topção">' +
                        '<div class="prod-nome">' + item.nome + '</div>' +
                        '<button class="btn-remover" onclick="window.removerItem(' + idx + ')">🗑️</button>' +
                    '</div>' +
                    '<div class="resumo-sabor">' + d + '</div>' +
                    '<div style="display:flex;gap:10px;margin-top:10px;">' +
                        '<button class="btn-edit-mini" onclick="window.editarItem(' + idx + ')">✏️ Editar</button>' +
                        '<button class="btn-add-mini" onclick="window.adicionarOutro(' + idx + ')">+ Outro</button>' +
                    '</div>' +
                    '<div class="resumo-sub">R$ ' + item.preço.toFixed(2).replace('.',',') + '</div>' +
                '</div>';
            }).join('');
            var t = 0; carrinho.forEach(function(i) { t += i.preço; });
            if (totalEl) totalEl.textContent = 'R$ ' + t.toFixed(2).replace('.',',');
        }
        abrirModal('modal-carrinho');
    };

    window.removerItem = function(idx) {
        carrinho.splice(idx, 1);
        localStorage.setItem('itap_carrinho', JSON.stringify(carrinho));
        atualizarBotaoCarrinho();
        window.abrirCarrinho();
    };

    window.editarItem = function(idx) {
        var item = carrinho[idx];
        fecharModal('modal-carrinho');
        if (item.tipo === 'massa') window.abrirSaboresSorvete(item.prodId, item.preço, item.max, item.nome, idx);
        else window.abrirModalPicole(item.prodId, idx);
    };

    window.adicionarOutro = function(idx) {
        var item = carrinho[idx];
        fecharModal('modal-carrinho');
        if (item.tipo === 'massa') window.abrirSaboresSorvete(item.prodId, item.preço, item.max, item.nome);
        else window.abrirModalPicole(item.prodId);
    };

    window.verificarFormulario = function() {
        var n = document.getElementById('cliente-nome');
        var t = document.getElementById('cliente-tel');
        var btn = document.getElementById('btn-finalizar-pedido');
        if (btn) btn.disabled = !(n && t && n.value.trim() && t.value.replace(/\D/g, '').length >= 10);
    };

    window.limparCarrinho = function() {
        if (confirm("Limpar pedido?")) {
            carrinho = []; localStorage.removeItem('itap_carrinho');
            atualizarBotaoCarrinho(); fecharModal('modal-carrinho');
        }
    };

    function mostrarToast(m) {
        var t = document.getElementById('toast'); if (!t) return;
        t.textContent = m; t.classList.add('ativo');
        setTimeout(function() { t.classList.remove('ativo'); }, 3000);
    }

    function renderizarTudo() {
        console.log("🛠️ Renderizando produtos...");
        var cCaixas = document.getElementById('lista-caixas');
        if (cCaixas) {
            cCaixas.innerHTML = CAIXAS_DEFAULT.map(function(p) {
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
        var cTortas = document.getElementById('lista-tortas');
        if (cTortas) {
            cTortas.innerHTML = '<div class="prod-card">' +
                '<div class="prod-card-sem-foto">🎂</div>' +
                '<div class="prod-card-body">' +
                    '<div class="prod-nome">Torta de Sorvete (Especial)</div>' +
                    '<div class="prod-preço">R$ 100,00</div>' +
                    '<button class="btn-sabores" onclick="window.abrirSaboresSorvete(\'torta\', 100, 3, \'Torta de Sorvete\')">Escolher Sabores</button>' +
                '</div>' +
            '</div>';
        }
        var cPicoles = document.getElementById('lista-picolés');
        if (cPicoles) {
            var pData = (window.PRODUTOS_DATA && window.PRODUTOS_DATA.picolés) ? window.PRODUTOS_DATA.picolés : {};
            var h = '';
            Object.keys(pData).forEach(function(k) {
                var p = pData[k];
                h += '<div class="prod-card">' +
                    '<div class="prod-card-sem-foto">🍭</div>' +
                    '<div class="prod-card-body">' +
                        '<div class="prod-nome">' + p.nome + '</div>' +
                        '<div class="prod-preço">Atacado: R$ ' + p.preço_atacado.toFixed(2).replace('.',',') + '</div>' +
                        '<button class="btn-sabores" onclick="window.abrirModalPicole(\'' + k + '\')">Escolher Sabores</button>' +
                    '</div>' +
                '</div>';
            });
            if (h) cPicoles.innerHTML = h;
        }
    }

    function init() {
        renderizarTudo();
        try {
            var s = localStorage.getItem('itap_carrinho');
            if (s) { carrinho = JSON.parse(s); atualizarBotaoCarrinho(); }
        } catch(e) {}
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})(window);
