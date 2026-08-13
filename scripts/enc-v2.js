/**
 * ITAPOLITANA CAJURU - Lógica de Encomendas v2.8 (BLINDAGEM TOTAL)
 * Foco: Exportação antecipada, logs de depuração e compatibilidade absoluta.
 */

(function(window) {
    'use strict';
    console.log("🚀 Script Encomendas v2.8 carregando...");

    // 1. EXPORTAÇÃO ANTECIPADA (Garante que os botões funcionem mesmo durante o carregamento)
    window.abrirSaboresSorvete = function(id, preço, max, nome, indexParaEditar) {
        console.log("🖱️ Clique detectado: abrirSaboresSorvete", id, nome);
        if (typeof _abrirSaboresSorvete === 'function') {
            _abrirSaboresSorvete(id, preço, max, nome, indexParaEditar);
        } else {
            console.error("❌ Erro: Função interna _abrirSaboresSorvete não carregada.");
            alert("Erro no sistema. Por favor, recarregue a página (F5).");
        }
    };

    window.toggleSabor = function(sabor, btn) {
        if (typeof _toggleSabor === 'function') _toggleSabor(sabor, btn);
    };

    window.confirmarSabores = function() {
        if (typeof _confirmarSabores === 'function') _confirmarSabores();
    };

    window.abrirModalPicole = function(key, indexParaEditar) {
        if (typeof _abrirModalPicole === 'function') _abrirModalPicole(key, indexParaEditar);
    };

    window.altQtdPicole = function(sabor, delta) {
        if (typeof _altQtdPicole === 'function') _altQtdPicole(sabor, delta);
    };

    window.confirmarPickle = function() {
        if (typeof _confirmarPickle === 'function') _confirmarPickle();
    };

    window.abrirCarrinho = function() {
        if (typeof _abrirCarrinho === 'function') _abrirCarrinho();
    };

    window.fecharModal = function(id) {
        if (typeof _fecharModal === 'function') _fecharModal(id);
    };

    window.removerItem = function(idx) {
        if (typeof _removerItem === 'function') _removerItem(idx);
    };

    window.adicionarOutro = function(idx) {
        if (typeof _adicionarOutro === 'function') _adicionarOutro(idx);
    };

    window.editarItem = function(idx) {
        if (typeof _editarItem === 'function') _editarItem(idx);
    };

    window.voltarPicolé = function() {
        if (typeof _voltarPicolé === 'function') _voltarPicolé();
    };

    window.verificarFormulario = function() {
        if (typeof _verificarFormulario === 'function') _verificarFormulario();
    };

    window.novoPedido = function() {
        if (typeof _novoPedido === 'function') _novoPedido();
    };

    window.limparCarrinho = function() {
        window.novoPedido();
    };

    window.abrirItaBot = function() {
        if(window.ItaBot && window.ItaBot.toggle) window.ItaBot.toggle();
    };

    // 2. VARIÁVEIS INTERNAS
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

    // 3. IMPLEMENTAÇÃO DAS FUNÇÕES INTERNAS
    function _abrirSaboresSorvete(id, preço, max, nome, indexParaEditar) {
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
        if (!grid) {
            console.error("❌ Erro: Grid de sabores não encontrado no HTML.");
            return;
        }

        var sabores = (window.PRODUTOS_DATA && window.PRODUTOS_DATA.sorvetes && window.PRODUTOS_DATA.sorvetes.sabores) ? 
            window.PRODUTOS_DATA.sorvetes.sabores : SABORES_OFICIAIS;
            
        grid.innerHTML = sabores.map(function(s) {
            var sel = saboresSelecionados.indexOf(s) !== -1 ? ' sel' : '';
            return '<button class="sabor-item' + sel + '" onclick="window.toggleSabor(\'' + s + '\', this)">' + s + '</button>';
        }).join('');
        
        _atualizarStatusSabores();
        _abrirModal('modal-sabores');
    }

    function _toggleSabor(sabor, btn) {
        var idx = saboresSelecionados.indexOf(sabor);
        if (idx !== -1) {
            saboresSelecionados.splice(idx, 1);
            btn.classList.remove('sel');
        } else {
            if (saboresSelecionados.length >= produtoAtual.max) {
                _mostrarToast("Limite de " + produtoAtual.max + " sabores atingido!");
                return;
            }
            saboresSelecionados.push(sabor);
            btn.classList.add('sel');
        }
        _atualizarStatusSabores();
    }

    function _atualizarStatusSabores() {
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

    function _confirmarSabores() {
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
        _fecharModal('modal-sabores');
        _finalizarAcaoCarrinho();
    }

    function _abrirModalPicole(key, indexParaEditar) {
        editandoIndex = (typeof indexParaEditar !== 'undefined') ? indexParaEditar : -1;
        var picolesData = (window.PRODUTOS_DATA && window.PRODUTOS_DATA.picolés) ? window.PRODUTOS_DATA.picolés : {};
        var p = picolesData[key];
        if (!p) return;
        
        produtoAtual = { id: key, nome: p.nome, preço: p.preço_atacado };
        picolesSelecionados = {};
        if (editandoIndex !== -1) picolesSelecionados = Object.assign({}, carrinho[editandoIndex].detalhes_raw || {});
        
        var titulo = document.getElementById('picolé-título');
        var precos = document.getElementById('picolé-preços');
        if (titulo) titulo.textContent = p.nome;
        if (precos) precos.textContent = "Mínimo 100 unidades (Atacado)";
        
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
        _atualizarStatusPicoles();
        _abrirModal('modal-picolé');
        var telaTipos = document.getElementById('picolé-tela-tipos');
        var telaSabores = document.getElementById('picolé-tela-sabores');
        if (telaTipos) telaTipos.style.display = 'none';
        if (telaSabores) telaSabores.style.display = 'block';
    }

    function _altQtdPicole(sabor, delta) {
        var novo = (picolesSelecionados[sabor] || 0) + delta;
        if (novo < 0) novo = 0;
        picolesSelecionados[sabor] = novo;
        var el = document.getElementById('qtd-' + sabor.replace(/\s/g, '_'));
        if (el) el.textContent = novo;
        _atualizarStatusPicoles();
    }

    function _atualizarStatusPicoles() {
        var total = 0;
        Object.keys(picolesSelecionados).forEach(function(k) { total += picolesSelecionados[k]; });
        var btn = document.getElementById('btn-add-picolés');
        var totalGeral = document.getElementById('total-picolés');
        if (totalGeral) totalGeral.textContent = total;
        if (btn) {
            btn.disabled = (total < MIN_PICOLES);
            btn.textContent = (total < MIN_PICOLES) ? "Mínimo 100 unidades" : "Adicionar " + total + " picolés";
        }
    }

    function _voltarPicolé() {
        _fecharModal('modal-picolé');
        var telaTipos = document.getElementById('picolé-tela-tipos');
        var telaSabores = document.getElementById('picolé-tela-sabores');
        if (telaSabores) telaSabores.style.display = 'none';
        if (telaTipos) telaTipos.style.display = 'block';
    }

    function _confirmarPickle() {
        var total = 0;
        var detalhes = [];
        var detalhesRaw = {};
        Object.keys(picolesSelecionados).forEach(function(sabor) {
            var qtd = picolesSelecionados[sabor];
            if (qtd > 0) { 
                total += qtd; 
                detalhes.push(qtd + "x " + sabor); 
                detalhesRaw[sabor] = qtd;
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
        _fecharModal('modal-picolé');
        _finalizarAcaoCarrinho();
    }

    function _abrirModal(id) {
        var m = document.getElementById(id);
        if (m) {
            m.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function _fecharModal(id) {
        var m = document.getElementById(id);
        if (m) {
            m.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    function _finalizarAcaoCarrinho() {
        _atualizarBotaoCarrinho();
        localStorage.setItem('itap_carrinho', JSON.stringify(carrinho));
        _mostrarToast("Adicionado ao carrinho!");
    }

    function _atualizarBotaoCarrinho() {
        var btn = document.getElementById('btn-carrinho');
        var badge = document.getElementById('carrinho-badge');
        var totalEl = document.getElementById('carrinho-total');
        if (carrinho.length > 0) {
            if (btn) btn.classList.add('ativo');
            if (badge) badge.textContent = carrinho.length;
            var total = 0;
            carrinho.forEach(function(i) { total += i.preço; });
            if (totalEl) totalEl.textContent = 'R$ ' + total.toFixed(2).replace('.',',');
        } else {
            if (btn) btn.classList.remove('ativo');
        }
    }

    function _abrirCarrinho() {
        var lista = document.getElementById('lista-carrinho');
        var totalEl = document.getElementById('total-carrinho');
        if (!lista) return;
        
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
            var total = 0;
            carrinho.forEach(function(i) { total += i.preço; });
            if (totalEl) totalEl.textContent = 'R$ ' + total.toFixed(2).replace('.',',');
        }
        _abrirModal('modal-carrinho');
    }

    function _removerItem(idx) {
        carrinho.splice(idx, 1);
        localStorage.setItem('itap_carrinho', JSON.stringify(carrinho));
        _atualizarBotaoCarrinho();
        _abrirCarrinho();
    }

    function _editarItem(idx) {
        var item = carrinho[idx];
        _fecharModal('modal-carrinho');
        if (item.tipo === 'massa') {
            _abrirSaboresSorvete(item.prodId, item.preço, item.max, item.nome, idx);
        } else {
            _abrirModalPicole(item.prodId, idx);
        }
    }

    function _adicionarOutro(idx) {
        var item = carrinho[idx];
        _fecharModal('modal-carrinho');
        if (item.tipo === 'massa') {
            _abrirSaboresSorvete(item.prodId, item.preço, item.max, item.nome);
        } else {
            _abrirModalPicole(item.prodId);
        }
    }

    function _verificarFormulario() {
        var elNome = document.getElementById('cliente-nome');
        var elTel = document.getElementById('cliente-tel');
        var nome = elNome ? elNome.value.trim() : "";
        var tel = elTel ? elTel.value.replace(/\D/g, '') : "";
        var btn = document.getElementById('btn-finalizar-pedido');
        if (btn) btn.disabled = !(nome && tel && tel.length >= 10);
    }

    function _novoPedido() {
        if (confirm("Deseja realmente limpar todo o pedido e recomeçar?")) {
            carrinho = [];
            localStorage.removeItem('itap_carrinho');
            _atualizarBotaoCarrinho();
            _fecharModal('modal-carrinho');
            _mostrarToast("Pedido excluído!");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function _mostrarToast(msg) {
        var t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('ativo');
        setTimeout(function() { t.classList.remove('ativo'); }, 3000);
    }

    // 4. RENDERIZAÇÃO
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
        var picoles = (window.PRODUTOS_DATA && window.PRODUTOS_DATA.picolés) ? window.PRODUTOS_DATA.picolés : {};
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

    function renderizarTudo() {
        console.log("🛠️ Renderizando produtos...");
        renderizarCaixas();
        renderizarTortas();
        renderizarListaPicoles();
    }

    function init() {
        console.log("🍦 Encomendas v2.8: Inicializando...");
        renderizarTudo();
        window.addEventListener('produtosNuvemCarregados', function() {
            console.log("☁️ Dados da nuvem carregados. Re-renderizando...");
            renderizarTudo();
        });
        try {
            var salvo = localStorage.getItem('itap_carrinho');
            if (salvo) {
                carrinho = JSON.parse(salvo);
                _atualizarBotaoCarrinho();
            }
        } catch(e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window);
