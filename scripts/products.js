// ===== PRODUTOS PADRONIZADOS (VERSÃO CORRIGIDA) =====

const products = {
    sorvetes: [
        { id: 1, name: 'Caixa 5L', category: 'Sorvetes', price: 35.00, description: '2 ou 3 sabores' },
        { id: 2, name: 'Caixa 10L', category: 'Sorvetes', price: 65.00, description: '2 ou 3 sabores' },
        { id: 3, name: 'Cone 1 Bola', category: 'Sorvetes', price: 5.00, description: 'Múltiplos sabores' },
        { id: 4, name: 'Cone 2 Bolas', category: 'Sorvetes', price: 8.00, description: 'Múltiplos sabores' },
        { id: 5, name: 'Cone 3 Bolas', category: 'Sorvetes', price: 10.00, description: 'Múltiplos sabores' },
        { id: 6, name: 'Torta de Sorvete', category: 'Sorvetes', price: 45.00, description: '3 sabores' },
        { id: 7, name: 'Pote 500ml', category: 'Sorvetes', price: 15.00, description: 'Sabor único' },
        { id: 8, name: 'Pote 1L', category: 'Sorvetes', price: 28.00, description: 'Sabor único' },
        { id: 9, name: 'Pote 2L', category: 'Sorvetes', price: 52.00, description: 'Sabor único' },
        { id: 10, name: 'Sorvete Artesanal', category: 'Sorvetes', price: 6.00, description: 'Porção especial' },
        { id: 11, name: 'Combo Família', category: 'Sorvetes', price: 75.00, description: 'Vários sabores' }
    ],
    
    picoles: [
        // PICOLÉ DE LEITE COM RECHEIO (R$ 3,00) - ATUALIZADO CONFORME PDF
        { id: 101, name: 'Picolé Morango', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Morango' },
        { id: 102, name: 'Picolé Maracujá', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Maracujá' },
        { id: 103, name: 'Picolé Limão', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Limão' },
        { id: 104, name: 'Picolé Coco', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Coco' },
        { id: 105, name: 'Picolé Amendoim', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Amendoim' },
        { id: 106, name: 'Picolé Doce de Leite', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Doce de Leite' },
        { id: 107, name: 'Picolé Chocolate', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Chocolate' },
        { id: 108, name: 'Picolé Abacaxi', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Abacaxi' },
        { id: 109, name: 'Picolé Banana', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Banana' },
        { id: 110, name: 'Picolé Uva', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Uva' },
        { id: 111, name: 'Picolé Goiaba', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Goiaba' },
        { id: 112, name: 'Picolé Blue Ice', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Blue Ice' },
        { id: 113, name: 'Picolé Caraxi', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Caraxi' },
        { id: 114, name: 'Picolé Coco Branco', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Coco Branco' },
        { id: 115, name: 'Picolé Amarena', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Amarena' },
        { id: 116, name: 'Picolé Leite Condensado', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Leite Condensado' },
        { id: 117, name: 'Picolé Mamão Papaia', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Mamão Papaia' },
        { id: 118, name: 'Picolé Menta c/ Choc', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Menta c/ Choc' },
        { id: 119, name: 'Picolé Nata c/ Goiaba', category: 'Picolé de Leite com Recheio', price: 3.00, description: 'Leite com Recheio', flavor: 'Nata c/ Goiaba' },
        
        // PICOLÉS ESKIMOS (R$ 8,00) - ATUALIZADO CONFORME PDF
        { id: 120, name: 'Picolé Brigadeiro', category: 'Picolés Eskimos', price: 8.00, description: 'Eskimo Premium', flavor: 'Brigadeiro' },
        { id: 121, name: 'Picolé Bombom', category: 'Picolés Eskimos', price: 8.00, description: 'Eskimo Premium', flavor: 'Bombom' },
        { id: 122, name: 'Picolé Nutella', category: 'Picolés Eskimos', price: 8.00, description: 'Eskimo Premium', flavor: 'Nutella' },
        { id: 123, name: 'Picolé Ovomaltine', category: 'Picolés Eskimos', price: 8.00, description: 'Eskimo Premium', flavor: 'Ovomaltine' },
        { id: 124, name: 'Picolé Leite Ninho', category: 'Picolés Eskimos', price: 8.00, description: 'Eskimo Premium', flavor: 'Leite Ninho' },
        { id: 125, name: 'Picolé Nata', category: 'Picolés Eskimos', price: 8.00, description: 'Eskimo Premium', flavor: 'Nata' },
        { id: 126, name: 'Picolé Morango (Eskimo)', category: 'Picolés Eskimos', price: 8.00, description: 'Eskimo Premium', flavor: 'Morango' },
        { id: 127, name: 'Picolé Prestígio', category: 'Picolés Eskimos', price: 8.00, description: 'Eskimo Premium', flavor: 'Prestígio' }
    ],
    
    acai: [
        { id: 201, name: 'Açaí 300ml', category: 'Açaí Promoção', price: 12.00, description: 'Com granola e mel' },
        { id: 202, name: 'Açaí 500ml', category: 'Açaí Promoção', price: 18.00, description: 'Com granola e mel' },
        { id: 203, name: 'Açaí Premium 300ml', category: 'Açaí Promoção', price: 15.00, description: 'Com frutas vermelhas' },
        { id: 204, name: 'Açaí Premium 500ml', category: 'Açaí Promoção', price: 22.00, description: 'Com frutas vermelhas' },
        { id: 205, name: 'Açaí Personalizado 300ml', category: 'Açaí Personalizado', price: 14.00, description: 'Escolha seus toppings' },
        { id: 206, name: 'Açaí Personalizado 500ml', category: 'Açaí Personalizado', price: 20.00, description: 'Escolha seus toppings' },
        { id: 207, name: 'Açaí Família 1L', category: 'Açaí Promoção', price: 35.00, description: 'Para compartilhar' },
        { id: 208, name: 'Açaí Especial', category: 'Açaí Promoção', price: 25.00, description: 'Com extras premium' }
    ],
    
    milkshakes: [
        { id: 301, name: 'Milkshake Morango', category: 'Milkshakes', price: 9.00, description: 'Escolher sabores' },
        { id: 302, name: 'Milkshake Chocolate', category: 'Milkshakes', price: 9.00, description: 'Escolher sabores' },
        { id: 303, name: 'Milkshake Baunilha', category: 'Milkshakes', price: 9.00, description: 'Escolher sabores' },
        { id: 304, name: 'Milkshake Pistache', category: 'Milkshakes', price: 10.00, description: 'Escolher sabores' },
        { id: 305, name: 'Milkshake Doce de Leite', category: 'Milkshakes', price: 10.00, description: 'Escolher sabores' },
        { id: 306, name: 'Milkshake Nutella', category: 'Milkshakes', price: 11.00, description: 'Escolher sabores' }
    ],
    
    tacas: [
        { id: 401, name: 'Taça Simples', category: 'Taças', price: 12.00, description: 'Escolher sabores' },
        { id: 402, name: 'Taça Dupla', category: 'Taças', price: 18.00, description: 'Escolher sabores' },
        { id: 403, name: 'Taça Tripla', category: 'Taças', price: 24.00, description: 'Escolher sabores' },
        { id: 404, name: 'Taça com Calda', category: 'Taças', price: 14.00, description: 'Escolher sabores' },
        { id: 405, name: 'Taça com Granola', category: 'Taças', price: 15.00, description: 'Escolher sabores' },
        { id: 406, name: 'Taça Especial', category: 'Taças', price: 18.00, description: 'Escolher sabores' },
        { id: 407, name: 'Taça Família', category: 'Taças', price: 35.00, description: 'Escolher sabores' },
        { id: 408, name: 'Taça Gelada', category: 'Taças', price: 16.00, description: 'Escolher sabores' }
    ],
    
    tacas_premium: [
        { id: 501, name: 'Taça Premium Chocolate', category: 'Taças Premium', price: 20.00, description: 'Com calda de chocolate' },
        { id: 502, name: 'Taça Premium Morango', category: 'Taças Premium', price: 20.00, description: 'Com calda de morango' },
        { id: 503, name: 'Taça Premium Caramelo', category: 'Taças Premium', price: 22.00, description: 'Com calda de caramelo' },
        { id: 504, name: 'Taça Premium Nutella', category: 'Taças Premium', price: 24.00, description: 'Com Nutella' },
        { id: 505, name: 'Taça Premium Doce de Leite', category: 'Taças Premium', price: 22.00, description: 'Com doce de leite' },
        { id: 506, name: 'Taça Premium Frutas', category: 'Taças Premium', price: 25.00, description: 'Com frutas vermelhas' },
        { id: 507, name: 'Taça Premium Especial', category: 'Taças Premium', price: 28.00, description: 'Combinação premium' }
    ]
};

// Função para obter produtos por categoria
function getProductsByCategory(category) {
    const categoryMap = {
        'sorvetes': products.sorvetes,
        'picoles': products.picoles,
        'acai': products.acai,
        'milkshakes': products.milkshakes,
        'tacas': products.tacas,
        'tacas_premium': products.tacas_premium
    };
    
    return categoryMap[category] || [];
}

// Função para renderizar produtos
function renderProducts(category) {
    const productList = document.getElementById('products');
    const items = getProductsByCategory(category);
    
    productList.innerHTML = '';
    
    items.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product-item';
        productDiv.innerHTML = `
            <div class="product-info">
                <h4>${product.name}</h4>
                <p>${product.description}</p>
            </div>
            <div class="product-price">R$ ${product.price.toFixed(2)}</div>
            <button class="btn-add" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">Adicionar</button>
        `;
        productList.appendChild(productDiv);
    });
}

// Inicializar com primeira categoria
document.addEventListener('DOMContentLoaded', () => {
    // Garantir que a base de dados está inicializada (se admin.js estiver carregado)
    if (typeof initializeDatabase === 'function') {
        initializeDatabase();
    }
    
    renderProducts('sorvetes');
    
    // Listener para mudança de categoria
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            renderProducts(e.target.value);
        });
    }
});
