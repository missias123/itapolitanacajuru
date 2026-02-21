// ===== GESTÃO DO CARRINHO =====

let cart = [];

// Adicionar item ao carrinho
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            quantity: 1
        });
    }
    
    updateCart();
    showNotification(`${name} adicionado ao carrinho!`);
}

// Remover item do carrinho
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCart();
}

// Atualizar quantidade
function updateQuantity(id, quantity) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity = Math.max(1, quantity);
        updateCart();
    }
}

// Atualizar visualização do carrinho
function updateCart() {
    const cartDiv = document.getElementById('cart');
    const totalDiv = document.getElementById('total');
    
    if (cart.length === 0) {
        cartDiv.innerHTML = '<p style="text-align: center; color: #999;">Seu carrinho está vazio</p>';
        totalDiv.textContent = 'R$ 0,00';
        return;
    }
    
    let total = 0;
    cartDiv.innerHTML = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div>
                <div class="cart-item-name">${item.name}</div>
                <div style="font-size: 12px; color: #999;">
                    Qtd: <input type="number" min="1" value="${item.quantity}" 
                    onchange="updateQuantity(${item.id}, this.value)" 
                    style="width: 40px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
            </div>
            <div class="cart-item-price">R$ ${itemTotal.toFixed(2)}</div>
            <button onclick="removeFromCart(${item.id})" 
            style="background: #ff6b6b; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
            Remover</button>
        `;
        cartDiv.appendChild(cartItem);
    });
    
    totalDiv.textContent = `R$ ${total.toFixed(2)}`;
}

// Avançar para checkout
function proceedCheckout() {
    if (cart.length === 0) {
        alert('Adicione itens ao carrinho antes de prosseguir!');
        return;
    }
    
    // Ocultar botões iniciais
    document.querySelector('.initial-flow-buttons').style.display = 'none';
    
    // Mostrar botões finais
    document.getElementById('checkoutActions').style.display = 'flex';
    
    // Scroll para o topo
    window.scrollTo(0, 0);
}

// Voltar a comprar
function addMore() {
    // Mostrar botões iniciais
    document.querySelector('.initial-flow-buttons').style.display = 'flex';
    
    // Ocultar botões finais
    document.getElementById('checkoutActions').style.display = 'none';
}

// Voltar a comprar (do checkout)
function backToShopping() {
    // Mostrar botões iniciais
    document.querySelector('.initial-flow-buttons').style.display = 'flex';
    
    // Ocultar botões finais
    document.getElementById('checkoutActions').style.display = 'none';
}

// Enviar pedido
function submitOrder() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    // Preparar dados do pedido
    const orderData = {
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        date: new Date().toLocaleString('pt-BR'),
        timestamp: Date.now()
    };
    
    // Salvar no localStorage
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Preparar mensagem para WhatsApp
    const message = prepareWhatsAppMessage(orderData);
    
    // Enviar via WhatsApp
    const whatsappUrl = `https://wa.me/5516991472045?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Limpar carrinho
    cart = [];
    updateCart();
    
    // Resetar interface
    document.querySelector('.initial-flow-buttons').style.display = 'flex';
    document.getElementById('checkoutActions').style.display = 'none';
    
    showNotification('Pedido enviado com sucesso! Você será redirecionado para o WhatsApp.');
}

// Preparar mensagem para WhatsApp
function prepareWhatsAppMessage(orderData) {
    let message = '🍦 *NOVO PEDIDO - Sorveteria Itapolitana*\n\n';
    message += '📋 *Itens do Pedido:*\n';
    
    orderData.items.forEach(item => {
        const itemTotal = (item.price * item.quantity).toFixed(2);
        message += `• ${item.name} (x${item.quantity}) - R$ ${itemTotal}\n`;
    });
    
    message += `\n💰 *Total: R$ ${orderData.total.toFixed(2)}*\n`;
    message += `📅 *Data: ${orderData.date}*\n\n`;
    message += '⏰ *Retirada: Após 3 dias úteis*\n';
    message += '📍 *Local: Pça Lgo São Bento, 311 - Cajuru/SP*\n';
    message += '🌟 *Atendemos: Cajuru, Santa Cruz da Esperança e Cássia dos Coqueiros*';
    
    return message;
}

// Notificação
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Adicionar estilos de animação
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

// Inicializar carrinho ao carregar
document.addEventListener('DOMContentLoaded', () => {
    updateCart();
});
