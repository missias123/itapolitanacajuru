// ========================================
// SORVETERIA ITAPOLITANA - PRODUCT DATA
// ========================================

const produtos = {
    sorvete: [
        { nome: "Baunilha", preco: 7.50 },
        { nome: "Chocolate", preco: 7.50 },
        { nome: "Morango", preco: 7.50 },
        { nome: "Pistache", preco: 8.00 },
        { nome: "Café", preco: 7.50 },
        { nome: "Coco", preco: 7.50 },
        { nome: "Flocos", preco: 7.50 },
        { nome: "Goiaba", preco: 7.50 },
        { nome: "Manga", preco: 7.50 },
        { nome: "Maracujá", preco: 7.50 },
        { nome: "Melancia", preco: 7.50 },
        { nome: "Menta", preco: 7.50 },
        { nome: "Nata", preco: 7.50 },
        { nome: "Açaí", preco: 8.50 },
        { nome: "Abacaxi", preco: 7.50 },
        { nome: "Amêndoa", preco: 8.00 },
        { nome: "Avelã", preco: 8.00 },
        { nome: "Banana", preco: 7.50 },
        { nome: "Blueberry", preco: 8.00 },
        { nome: "Brigadeiro", preco: 8.00 },
        { nome: "Caramelo", preco: 7.50 },
        { nome: "Cereja", preco: 7.50 },
        { nome: "Chocolate Branco", preco: 8.00 },
        { nome: "Chocolate com Avelã", preco: 8.50 },
        { nome: "Chocolate com Menta", preco: 8.00 },
        { nome: "Creme", preco: 7.50 },
        { nome: "Doce de Leite", preco: 8.00 },
        { nome: "Framboesa", preco: 8.00 },
        { nome: "Gengibre", preco: 7.50 },
        { nome: "Hortelã", preco: 7.50 },
        { nome: "Kiwi", preco: 7.50 },
        { nome: "Leite Condensado", preco: 8.00 },
        { nome: "Limão", preco: 7.50 },
        { nome: "Mel", preco: 8.00 },
        { nome: "Mirtilo", preco: 8.00 },
        { nome: "Morango com Chocolate", preco: 8.50 },
        { nome: "Nutella", preco: 9.00 }
    ],
    "picole-leite": [
        { nome: "Morango", preco: 3.00 },
        { nome: "Maracujá", preco: 3.00 },
        { nome: "Limão", preco: 3.00 },
        { nome: "Coco", preco: 3.00 },
        { nome: "Amendoim", preco: 3.00 },
        { nome: "Doce de Leite", preco: 3.00 },
        { nome: "Chocolate", preco: 3.00 },
        { nome: "Abacaxi", preco: 3.00 },
        { nome: "Banana", preco: 3.00 },
        { nome: "Uva", preco: 3.00 },
        { nome: "Goiaba", preco: 3.00 },
        { nome: "Blue Ice", preco: 3.00 },
        { nome: "Caraxi", preco: 3.00 },
        { nome: "Coco Branco", preco: 3.00 },
        { nome: "Amarena", preco: 3.00 },
        { nome: "Leite Condensado", preco: 3.00 },
        { nome: "Mamão Papaia", preco: 3.00 },
        { nome: "Menta com Chocolate", preco: 3.00 },
        { nome: "Nata com Goiaba", preco: 3.00 }
    ],
    "picole-eskimo": [
        { nome: "Brigadeiro", preco: 8.00 },
        { nome: "Bombom", preco: 8.00 },
        { nome: "Nutella", preco: 8.00 },
        { nome: "Ovomaltine", preco: 8.00 },
        { nome: "Leite Ninho", preco: 8.00 },
        { nome: "Nata", preco: 8.00 },
        { nome: "Morango", preco: 8.00 },
        { nome: "Prestígio", preco: 8.00 }
    ],
    acai: [
        { nome: "Açaí com Granola", preco: 12.00 },
        { nome: "Açaí com Banana", preco: 12.00 },
        { nome: "Açaí com Morango", preco: 12.00 },
        { nome: "Açaí com Mel", preco: 12.00 },
        { nome: "Açaí com Granola e Mel", preco: 13.00 },
        { nome: "Açaí Especial", preco: 15.00 }
    ]
};

// Função para renderizar produtos
function renderizarProdutos() {
    // Sorvetes
    const sorveteGrid = document.getElementById('sorvetes-grid');
    if (sorveteGrid) {
        sorveteGrid.innerHTML = produtos.sorvete.map(p => `
            <div class="produto-card" onclick="selecionarProduto('sorvete', '${p.nome}', ${p.preco})">
                <h4>${p.nome}</h4>
                <div class="produto-preco">R$ ${p.preco.toFixed(2)}</div>
                <button class="btn-comprar" onclick="event.stopPropagation(); adicionarAoCarrinho('sorvete', '${p.nome}', ${p.preco})">Comprar</button>
            </div>
        `).join('');
    }

    // Picolés de Leite com Recheio
    const picoleLeiteGrid = document.getElementById('picole-leite-grid');
    if (picoleLeiteGrid) {
        picoleLeiteGrid.innerHTML = produtos["picole-leite"].map(p => `
            <div class="produto-card" onclick="selecionarProduto('picole-leite', '${p.nome}', ${p.preco})">
                <h4>${p.nome}</h4>
                <div class="produto-preco">R$ ${p.preco.toFixed(2)}</div>
                <button class="btn-comprar" onclick="event.stopPropagation(); adicionarAoCarrinho('picole-leite', '${p.nome}', ${p.preco})">Comprar</button>
            </div>
        `).join('');
    }

    // Picolés Eskimo
    const picoleEskimoGrid = document.getElementById('picole-eskimo-grid');
    if (picoleEskimoGrid) {
        picoleEskimoGrid.innerHTML = produtos["picole-eskimo"].map(p => `
            <div class="produto-card" onclick="selecionarProduto('picole-eskimo', '${p.nome}', ${p.preco})">
                <h4>${p.nome}</h4>
                <div class="produto-preco">R$ ${p.preco.toFixed(2)}</div>
                <button class="btn-comprar" onclick="event.stopPropagation(); adicionarAoCarrinho('picole-eskimo', '${p.nome}', ${p.preco})">Comprar</button>
            </div>
        `).join('');
    }

    // Açaí
    const acaiGrid = document.getElementById('acai-grid');
    if (acaiGrid) {
        acaiGrid.innerHTML = produtos.acai.map(p => `
            <div class="produto-card" onclick="selecionarProduto('acai', '${p.nome}', ${p.preco})">
                <h4>${p.nome}</h4>
                <div class="produto-preco">R$ ${p.preco.toFixed(2)}</div>
                <button class="btn-comprar" onclick="event.stopPropagation(); adicionarAoCarrinho('acai', '${p.nome}', ${p.preco})">Comprar</button>
            </div>
        `).join('');
    }
}

// Função para atualizar sabores no formulário
function atualizarSabores() {
    const categoria = document.getElementById('categoria').value;
    const saborSelect = document.getElementById('sabor');
    
    saborSelect.innerHTML = '<option value="">Selecione um sabor</option>';
    
    if (categoria && produtos[categoria]) {
        produtos[categoria].forEach(p => {
            const option = document.createElement('option');
            option.value = p.nome;
            option.textContent = `${p.nome} - R$ ${p.preco.toFixed(2)}`;
            saborSelect.appendChild(option);
        });
    }
}

// Função para selecionar produto
function selecionarProduto(categoria, nome, preco) {
    document.getElementById('categoria').value = categoria;
    atualizarSabores();
    document.getElementById('sabor').value = nome;
}

// Inicializar produtos ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    renderizarProdutos();
});
