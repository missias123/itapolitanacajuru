// ========================================
// SORVETERIA ITAPOLITANA - MAIN SCRIPT
// ========================================

let carrinho = [];
let selecaoAtual = {};

// Função para alternar visibilidade das categorias (Acordeão)
function toggleCategoria(elemento) {
    const categoria = elemento.parentElement;
    categoria.classList.toggle("ativa");
}

// Funções do Modal Genérico
function abrirModal(titulo, opcoes, tipo, categoria) {
    const modal = document.getElementById('modal-selecao');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalOpcoes = document.getElementById('modal-opcoes');

    modalTitulo.textContent = titulo;
    modalOpcoes.innerHTML = '';
    selecaoAtual = { tipo, categoria, itens: {} };

    if (tipo === 'sabores') {
        opcoes.forEach(sabor => {
            modalOpcoes.innerHTML += `
                <div class="opcao-item" onclick="selecionarItem(this, '${sabor}', null, false)">
                    ${sabor}
                </div>
            `;
        });
    } else if (tipo === 'complementos') {
        for (const compCategoria in opcoes) {
            const { preco, itens } = opcoes[compCategoria];
            modalOpcoes.innerHTML += `<h4 class="complemento-categoria">${compCategoria.replace('_', ' ')} - R$ ${preco.toFixed(2)}</h4>`;
            itens.forEach(item => {
                modalOpcoes.innerHTML += `
                    <div class="opcao-item" onclick="selecionarItem(this, '${item}', ${preco}, true)">
                        ${item}
                    </div>
                `;
            });
        }
    }

    modal.style.display = 'block';
}

function fecharModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function selecionarItem(elemento, nome, preco, multiplo) {
    if (!multiplo) {
        document.querySelectorAll('#modal-opcoes .opcao-item.selecionado').forEach(el => el.classList.remove('selecionado'));
        selecaoAtual.itens = {}; 
    }

    elemento.classList.toggle('selecionado');

    if (elemento.classList.contains('selecionado')) {
        selecaoAtual.itens[nome] = { preco };
    } else {
        delete selecaoAtual.itens[nome];
    }
}

function confirmarSelecao() {
    if (Object.keys(selecaoAtual.itens).length === 0) {
        alert("Selecione ao menos uma opção.");
        return;
    }

    if (selecaoAtual.tipo === 'sabores') {
        const nomeSabor = Object.keys(selecaoAtual.itens)[0];
        let preco = 0;

        if(selecaoAtual.categoria.startsWith('picole')){
            preco = produtos.picoles[selecaoAtual.categoria.replace('picole_', '')].preco;
        } else if (selecaoAtual.categoria === 'milkshake'){
            preco = produtos.milkshake.tradicional['300ml']; // Preço base
        } else if (selecaoAtual.categoria === 'tacas'){
            preco = produtos.tacas.tradicionais['Colegial']; // Preço base
        } else if (selecaoAtual.categoria === 'tacas_premium'){
            preco = produtos.tacas.sujas['Prestígio']; // Preço base
        }

        adicionarAoCarrinho(selecaoAtual.categoria, `${selecaoAtual.categoria.replace('_', ' ')} - ${nomeSabor}`, preco);

    } else if (selecaoAtual.tipo === 'complementos') {
        const tamanho = prompt("Qual o tamanho do copo de açaí? (300ml, 360ml, 400ml, 600ml)");
        if (produtos.acai.copos[tamanho]) {
            let precoFinal = produtos.acai.copos[tamanho];
            let nomeFinal = `Açaí ${tamanho} com: `;
            const complementosSelecionados = [];

            for (const nome in selecaoAtual.itens) {
                precoFinal += selecaoAtual.itens[nome].preco;
                complementosSelecionados.push(nome);
            }
            nomeFinal += complementosSelecionados.join(', ');

            adicionarAoCarrinho('açaí', nomeFinal, precoFinal);
        } else {
            alert("Tamanho de copo inválido!");
            return;
        }
    }

    fecharModal('modal-selecao');
}

// Funções para abrir modais específicos
function abrirModalSabores(categoria) {
    let sabores = produtos.sorvetes.sabores;
    let titulo = "Escolha os Sabores";

    if (categoria.startsWith('picole')) {
        const tipoPicole = categoria.replace('picole_', '');
        sabores = produtos.picoles[tipoPicole].sabores;
        titulo = `Sabores de Picolé - ${tipoPicole.replace(/_/g, ' ')}`;
    }

    abrirModal(titulo, sabores, 'sabores', categoria);
}

function abrirModalComplementos(categoria) {
    if (categoria === 'acai') {
        abrirModal("Monte seu Açaí", produtos.acai.complementos, 'complementos', 'acai');
    }
}

// Funções do Carrinho
function adicionarAoCarrinho(categoria, nome, preco, quantidade = 1) {
    const item = {
        id: Date.now(),
        categoria,
        nome,
        preco,
        quantidade
    };
    carrinho.push(item);
    atualizarCarrinho();
    mostrarNotificacao(`${nome} adicionado ao carrinho!`);
}

function removerDoCarrinho(id) {
    carrinho = carrinho.filter(item => item.id !== id);
    atualizarCarrinho();
}

function atualizarCarrinho() {
    const carrinhoItems = document.getElementById('carrinho-items');
    const totalEl = document.getElementById('total');
    let totalPreco = 0;

    if (!carrinhoItems) return;

    if (carrinho.length === 0) {
        carrinhoItems.innerHTML = '<p>Carrinho vazio</p>';
        if(totalEl) totalEl.textContent = '0,00';
        return;
    }

    carrinhoItems.innerHTML = carrinho.map(item => {
        const subtotal = item.preco * item.quantidade;
        totalPreco += subtotal;
        return `
            <div class="carrinho-item">
                <div>
                    <div class="carrinho-item-nome">${item.nome}</div>
                    <div class="carrinho-item-preco">R$ ${item.preco.toFixed(2)} x ${item.quantidade} = R$ ${subtotal.toFixed(2)}</div>
                </div>
                <button onclick="removerDoCarrinho(${item.id})">Remover</button>
            </div>
        `;
    }).join('');

    if(totalEl) totalEl.textContent = totalPreco.toFixed(2).replace('.', ',');
}

// Notificação
function mostrarNotificacao(mensagem) {
    const notif = document.createElement('div');
    notif.className = 'notificacao-itapolitana';
    notif.textContent = mensagem;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.classList.add('fade-out');
        setTimeout(() => notif.remove(), 500);
    }, 2000);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    atualizarCarrinho();
});

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('modal-selecao');
    if (event.target == modal) {
        fecharModal('modal-selecao');
    }
}

function scrollToSection(id){
    const element = document.getElementById(id);
    element.scrollIntoView({behavior: "smooth"});
}
document.addEventListener("DOMContentLoaded", () => {
    const promoBtn = document.getElementById("promo-btn");
    const promoModal = document.getElementById("promotion-modal");
    const closePromoBtn = document.querySelector(".close-promo-btn");

    if (promoBtn) {
        promoBtn.onclick = () => promoModal.style.display = "block";
    }

    if (closePromoBtn) {
        closePromoBtn.onclick = () => promoModal.style.display = "none";
    }

    window.onclick = (event) => {
        if (event.target == promoModal) {
            promoModal.style.display = "none";
        }
    };

    // Countdown Timer
    const countdownElement = document.getElementById("countdown");
    if (countdownElement) {
        const sorteioDate = new Date("2026-03-31T23:59:59").getTime();

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = sorteioDate - now;

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            countdownElement.innerHTML = `<div>${days}<span>DIAS</span></div><div>${hours}<span>HORAS</span></div><div>${minutes}<span>MIN</span></div><div>${seconds}<span>SEG</span></div>`;

            if (distance < 0) {
                clearInterval(interval);
                countdownElement.innerHTML = "SORTEIO REALIZADO";
            }
        }, 1000);
    }
});

function renderizarPicoles() {
    const container = document.getElementById('picoles-container');
    if (!container) return;

    for (const tipo in produtos.picoles) {
        const picole = produtos.picoles[tipo];
        const card = document.createElement('div');
        card.className = 'picole-card';
        card.innerHTML = `
            <h4>${picole.nome}</h4>
            <p>R$ ${picole.preco.toFixed(2)}</p>
            <button onclick="abrirModalSabores('picole_${tipo}')">Ver Sabores</button>
        `;
        container.appendChild(card);
    }
}

document.addEventListener('DOMContentLoaded', renderizarPicoles);
