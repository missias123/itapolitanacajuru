// ========================================
// SORVETERIA ITAPOLITANA - MAIN SCRIPT
// ========================================

let carrinho = [];

// Função para alternar visibilidade das categorias (Acordeão)
function toggleCategoria(elemento) {
    const categoria = elemento.parentElement;
    const estaAtiva = categoria.classList.contains('ativa');
    
    // Fechar todas as outras categorias
    document.querySelectorAll('.categoria').forEach(cat => {
        cat.classList.remove('ativa');
    });
    
    // Se não estava ativa, abrir a atual
    if (!estaAtiva) {
        categoria.classList.add('ativa');
        // Rolar suavemente para a categoria aberta
        setTimeout(() => {
            categoria.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
}

// Função para adicionar ao carrinho
function adicionarAoCarrinho(categoria = null, nome = null, preco = null) {
    let categoriaForm = categoria || document.getElementById('categoria').value;
    let nomeForm = nome || document.getElementById('sabor').value;
    let precoForm = preco;
    let quantidadeForm = parseInt(document.getElementById('quantidade').value) || 1;

    if (!categoriaForm || !nomeForm) {
        alert('Por favor, selecione uma categoria e um sabor!');
        return;
    }

    // Se não foi passado preço, buscar do array de produtos
    if (!precoForm) {
        const produtoEncontrado = produtos[categoriaForm]?.find(p => p.nome === nomeForm);
        precoForm = produtoEncontrado?.preco || 0;
    }

    const item = {
        id: Date.now(),
        categoria: categoriaForm,
        nome: nomeForm,
        preco: precoForm,
        quantidade: quantidadeForm
    };

    carrinho.push(item);
    atualizarCarrinho();
    
    // Limpar formulário
    document.getElementById('quantidade').value = 1;
    
    // Feedback visual
    mostrarNotificacao(`${nomeForm} adicionado ao carrinho!`);
}

// Função para remover do carrinho
function removerDoCarrinho(id) {
    carrinho = carrinho.filter(item => item.id !== id);
    atualizarCarrinho();
}

// Função para atualizar exibição do carrinho
function atualizarCarrinho() {
    const carrinhoItems = document.getElementById('carrinho-items');
    const total = document.getElementById('total');

    if (!carrinhoItems || !total) return;

    if (carrinho.length === 0) {
        carrinhoItems.innerHTML = '<p style="color: #999; text-align: center;">Carrinho vazio</p>';
        total.textContent = '0,00';
        return;
    }

    let totalPreco = 0;
    carrinhoItems.innerHTML = carrinho.map(item => {
        const subtotal = item.preco * item.quantidade;
        totalPreco += subtotal;
        
        return `
            <div class="carrinho-item">
                <div class="carrinho-item-info">
                    <div class="carrinho-item-nome">${item.nome}</div>
                    <div>Quantidade: ${item.quantidade}</div>
                    <div class="carrinho-item-preco">R$ ${subtotal.toFixed(2)}</div>
                </div>
                <button class="btn-remover" onclick="removerDoCarrinho(${item.id})">Remover</button>
            </div>
        `;
    }).join('');

    total.textContent = totalPreco.toFixed(2);
}

// Função para limpar carrinho
function limparCarrinho() {
    if (confirm('Tem certeza que deseja limpar o carrinho?')) {
        carrinho = [];
        atualizarCarrinho();
        mostrarNotificacao('Carrinho limpo!');
    }
}

// Lógica de Etapas do Pedido
function mostrarCarrinhoFinal() {
    if (carrinho.length === 0) {
        alert('Adicione itens ao carrinho antes de finalizar!');
        return;
    }
    document.getElementById('carrinho-acoes-normal').style.display = 'none';
    document.getElementById('carrinho-acoes-final').style.display = 'none';
    
    const acoesContainer = document.getElementById('carrinho-acoes-normal');
    acoesContainer.style.display = 'flex';
    acoesContainer.style.flexDirection = 'row';
    acoesContainer.style.gap = '10px';
    
    scrollToSection('encomendas');
}

function etapaFinalPedido() {
    const nome = document.getElementById('nome').value.trim();
    const telefone = document.getElementById('telefone').value.trim();

    if (!nome || !telefone) {
        alert('Por favor, preencha seu nome e telefone!');
        return;
    }

    document.getElementById('carrinho-acoes-normal').style.display = 'none';
    document.getElementById('carrinho-acoes-final').style.display = 'block';
}

function voltarEtapaPedido() {
    document.getElementById('carrinho-acoes-final').style.display = 'none';
    document.getElementById('carrinho-acoes-normal').style.display = 'flex';
    scrollToSection('cardapio');
}

// Função para enviar pedido
function enviarPedido() {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    const nome = document.getElementById('nome').value.trim();
    const telefone = document.getElementById('telefone').value.trim();

    let mensagem = `*PEDIDO SORVETERIA ITAPOLITANA*\n\n`;
    mensagem += `*Cliente:* ${nome}\n`;
    mensagem += `*Telefone:* ${telefone}\n\n`;
    mensagem += `*Itens do Pedido:*\n`;

    let total = 0;
    carrinho.forEach((item, index) => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;
        mensagem += `${index + 1}. ${item.nome} (${item.quantidade}x) - R$ ${subtotal.toFixed(2)}\n`;
    });

    mensagem += `\n*Total:* R$ ${total.toFixed(2)}\n`;
    mensagem += `\n*Atenção:* O produto será retirado na loja e só será produzido após o pagamento.\n`;
    mensagem += `\nPor favor, confirme o pedido!`;

    const mensagemCodificada = encodeURIComponent(mensagem);
    const whatsappUrl = `https://wa.me/5516991472045?text=${mensagemCodificada}`;

    window.open(whatsappUrl, '_blank');

    setTimeout(() => {
        carrinho = [];
        atualizarCarrinho();
        document.getElementById('nome').value = '';
        document.getElementById('telefone').value = '';
        document.getElementById('carrinho-acoes-final').style.display = 'none';
        document.getElementById('carrinho-acoes-normal').style.display = 'flex';
        mostrarNotificacao('Pedido enviado com sucesso!');
    }, 500);
}

// Modal de Sabores
function abrirModalSabores(categoria) {
    const modal = document.getElementById('modal-sabores');
    const titulo = document.getElementById('modal-titulo');
    const lista = document.getElementById('lista-sabores-modal');
    
    const nomesCategorias = {
        'milkshake': 'Sabores para Milk Shake',
        'tacas': 'Sabores para Taças',
        'tacas-premium': 'Sabores para Taças Premium'
    };
    
    titulo.textContent = nomesCategorias[categoria] || 'Escolha seu sabor';
    
    const sabores = produtos.sorvete;
    
    lista.innerHTML = sabores.map(s => `
        <div class="sabor-item-modal" onclick="selecionarSaborModal('${categoria}', '${s.nome}')">
            ${s.nome}
        </div>
    `).join('');
    
    modal.style.display = 'block';
}

function fecharModalSabores() {
    document.getElementById('modal-sabores').style.display = 'none';
}

function selecionarSaborModal(categoria, sabor) {
    document.getElementById('categoria').value = categoria;
    atualizarSabores();
    
    const saborSelect = document.getElementById('sabor');
    const option = document.createElement('option');
    option.value = sabor;
    option.textContent = sabor;
    option.selected = true;
    saborSelect.appendChild(option);
    
    fecharModalSabores();
    scrollToSection('encomendas');
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('modal-sabores');
    if (event.target == modal) {
        fecharModalSabores();
    }
}

// Função para rolar até uma seção
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Função para mostrar notificação
function mostrarNotificacao(mensagem) {
    const notif = document.createElement('div');
    notif.className = 'notificacao-itapolitana';
    notif.textContent = mensagem;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.classList.add('fade-out');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Inicializar ao carregar
document.addEventListener('DOMContentLoaded', function() {
    atualizarCarrinho();
});
