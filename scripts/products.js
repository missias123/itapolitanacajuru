// ===== PRODUTOS PADRONIZADOS (VERSÃO FINAL CORRIGIDA - 21/02/2026) =====

const products = {
    sorvetes: [
        // SORVETES ARTESANAIS (37 SABORES OFICIAIS LISTADOS NO CARDÁPIO)
        { id: 1, name: 'Abacaxi ao Vinho', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 2, name: 'Doce de Leite', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 3, name: 'Abacaxi Suíço', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 4, name: 'Açaí', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 5, name: 'Ninho com Oreo', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 6, name: 'Algodão Doce (Blue Ice)', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 7, name: 'Amarena', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 8, name: 'Ameixa', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 9, name: 'Banana com Nutella', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 10, name: 'Bis e Trufa', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 11, name: 'Cereja Trufada', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 12, name: 'Chocolate', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 13, name: 'Chocolate com Café', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 14, name: 'Coco Queimado', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 15, name: 'Creme Paris', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 16, name: 'Croquer', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 17, name: 'Ferrero Rocher', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 18, name: 'Flocos', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 19, name: 'Kinder Ovo', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 20, name: 'Leite Condensado', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 21, name: 'Leite Ninho', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 22, name: 'Leite Ninho Folheado', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 23, name: 'Leite Ninho com Pistache', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 24, name: 'Limão', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 25, name: 'Limão Suíço', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 26, name: 'Menta com Chocolate', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 27, name: 'Milho Verde', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 28, name: 'Morango Trufado', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 29, name: 'Mousse de Maracujá', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 30, name: 'Mousse de Uva', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 31, name: 'Nozes', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 32, name: 'Nutella', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 33, name: 'Ovomaltine', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 34, name: 'Pistache', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 35, name: 'Prestígio', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 36, name: 'Sensação', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' },
        { id: 37, name: 'Torta de Chocolate', category: 'Sorvetes', price: 0, description: 'Sorvete Artesanal' }
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
        { id: 502, name: 'Taça Premium Morango', category: 'Taças Premium', price: 20.00, description: 'Com calda de morango' },
        { id: 503, name: 'Taça Premium Caramelo', category: 'Taças Premium', price: 22.00, description: 'Com calda de caramelo' },
        { id: 504, name: 'Taça Premium Nutella', category: 'Taças Premium', price: 24.00, description: 'Com Nutella' },
        { id: 505, name: 'Taça Premium Doce de Leite', category: 'Taças Premium', price: 22.00, description: 'Com doce de leite' },
        { id: 506, name: 'Taça Premium Frutas', category: 'Taças Premium', price: 25.00, description: 'Com frutas vermelhas' },
        { id: 507, name: 'Taça Premium Especial', category: 'Taças Premium', price: 28.00, description: 'Combinação premium' },
        { id: 508, name: 'Taça Unicórnio', category: 'Taças Premium', price: 28.00, description: 'Mágica e colorida (Edição Especial)' }
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
        
        // Se o preço for 0 (como nos sabores de sorvete do cardápio), não mostrar o preço nem o botão de adicionar
        const priceDisplay = product.price > 0 ? `<div class="product-price">R$ ${product.price.toFixed(2)}</div>` : '';
        const buttonDisplay = product.price > 0 ? `<button class="btn-add" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">Adicionar</button>` : '';
        
        productDiv.innerHTML = `
            <div class="product-info">
                <h4>${product.name}</h4>
                <p>${product.description}</p>
            </div>
            ${priceDisplay}
            ${buttonDisplay}
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
