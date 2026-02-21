// ===== PRODUTOS PADRONIZADOS (VERSÃO FINAL CORRIGIDA - 21/02/2026) =====

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
        { id: 9, name: 'Pote 2L', category: 'Sorvetes', price: 52.00, description: 'Sabor único' }
    ],
    
    picoles: [
        // PICOLÉS DE LEITE COM RECHEIO (R$ 3,00) - LISTA EXATA SOLICITADA
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
        
        // PICOLÉS ESKIMOS (R$ 8,00) - BRIGADEIRO MOVIDO PARA AQUI
        { id: 120, name: 'Picolé Brigadeiro', category: 'Picolés Eskimos', price: 8.00, description: 'Eskimo Premium', flavor: 'Brigadeiro' }
    ],
    
    acai: [
        { id: 201, name: 'Açaí 300ml', category: 'Açaí Promoção', price: 12.00, description: 'Com granola e mel' },
        { id: 202, name: 'Açaí 500ml', category: 'Açaí Promoção', price: 18.00, description: 'Com granola e mel' },
        { id: 207, name: 'Açaí Família 1L', category: 'Açaí Promoção', price: 35.00, description: 'Para compartilhar' }
    ],
    
    milkshakes: [
        { id: 301, name: 'Milkshake Morango', category: 'Milkshakes', price: 9.00, description: 'Escolher sabores' },
        { id: 302, name: 'Milkshake Chocolate', category: 'Milkshakes', price: 9.00, description: 'Escolher sabores' },
        { id: 303, name: 'Milkshake Baunilha', category: 'Milkshakes', price: 9.00, description: 'Escolher sabores' }
    ],
    
    tacas: [
        { id: 401, name: 'Taça Simples', category: 'Taças', price: 12.00, description: 'Escolher sabores' },
        { id: 402, name: 'Taça Dupla', category: 'Taças', price: 18.00, description: 'Escolher sabores' }
    ],
    
    tacas_premium: [
        { id: 501, name: 'Taça Premium Chocolate', category: 'Taças Premium', price: 20.00, description: 'Com calda de chocolate' },
        {{ id: 507, name: 'Taça Premium Especial', category: 'Taças Premium', price: 28.00, description: 'Combinação premium' },
        { id: 508, name: 'Taça Unicórnio', category: 'Taças Premium', price: 28.00, description: 'Mágica e colorida' }
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
    if (!productList) return;
    
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
    if (typeof initializeDatabase === 'function') {
        initializeDatabase();
    }
    renderProducts('sorvetes');
    
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            renderProducts(e.target.value);
        });
    }
});
