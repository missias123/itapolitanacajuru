// ========================================
// SORVETERIA ITAPOLITANA - MAIN SCRIPT
// ========================================

let carrinho = [];

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

// Função para enviar pedido
function enviarPedido() {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    const nome = document.getElementById('nome').value.trim();
    const telefone = document.getElementById('telefone').value.trim();

    if (!nome || !telefone) {
        alert('Por favor, preencha seu nome e telefone!');
        return;
    }

    // Construir mensagem do pedido
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
    mensagem += `\nPor favor, confirme o pedido!`;

    // Codificar para URL
    const mensagemCodificada = encodeURIComponent(mensagem);
    const whatsappUrl = `https://wa.me/551633541234?text=${mensagemCodificada}`;

    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');

    // Limpar carrinho após envio
    setTimeout(() => {
        carrinho = [];
        atualizarCarrinho();
        document.getElementById('nome').value = '';
        document.getElementById('telefone').value = '';
        mostrarNotificacao('Pedido enviado com sucesso!');
    }, 500);
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
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #00E5FF 0%, #39FF14 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
    `;
    notif.textContent = mensagem;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Adicionar animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Inicializar ao carregar
document.addEventListener('DOMContentLoaded', function() {
    atualizarCarrinho();
});
