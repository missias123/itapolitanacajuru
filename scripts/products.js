// ========================================
// SORVETERIA ITAPOLITANA - PRODUCT DATA
// ========================================

const produtos = {
    sorvete: [
        { nome: "Abacaxi ao Vinho", preco: 7.50, estoque: 100 },
        { nome: "Abacaxi Suíço", preco: 7.50, estoque: 100 },
        { nome: "Açaí", preco: 8.50, estoque: 100 },
        { nome: "Algodão Doc (Blue Ice)", preco: 7.50, estoque: 100 },
        { nome: "Amarena", preco: 8.00, estoque: 100 },
        { nome: "Ameixa", preco: 7.50, estoque: 100 },
        { nome: "Banana com Nutella", preco: 8.50, estoque: 100 },
        { nome: "Bis e Trufa", preco: 8.50, estoque: 100 },
        { nome: "Cereja Trufada", preco: 8.00, estoque: 100 },
        { nome: "Chocolate", preco: 7.50, estoque: 100 },
        { nome: "Chocolate com Café", preco: 8.00, estoque: 100 },
        { nome: "Coco Queimado", preco: 8.00, estoque: 100 },
        { nome: "Creme Paris", preco: 7.50, estoque: 100 },
        { nome: "Croquer", preco: 8.00, estoque: 100 },
        { nome: "Doce de Leite", preco: 8.00, estoque: 100 },
        { nome: "Ferrero Rocher", preco: 9.00, estoque: 100 },
        { nome: "Flocos", preco: 7.50, estoque: 100 },
        { nome: "Kinder Ovo", preco: 9.00, estoque: 100 },
        { nome: "Leite Condensado", preco: 8.00, estoque: 100 },
        { nome: "Leite Ninho", preco: 8.00, estoque: 100 },
        { nome: "Leite Ninho Folheado", preco: 8.50, estoque: 100 },
        { nome: "Leite Ninho com Pistache", preco: 9.00, estoque: 100 },
        { nome: "Limão", preco: 7.50, estoque: 100 },
        { nome: "Limão Suíço", preco: 7.50, estoque: 100 },
        { nome: "Menta com Chocolate", preco: 8.00, estoque: 100 },
        { nome: "Milho Verde", preco: 7.50, estoque: 100 },
        { nome: "Morango Trufado", preco: 8.00, estoque: 100 },
        { nome: "Mousse de Maracujá", preco: 7.50, estoque: 100 },
        { nome: "Mousse de Uva", preco: 7.50, estoque: 100 },
        { nome: "Ninho com Oreo", preco: 8.50, estoque: 100 },
        { nome: "Nozes", preco: 8.00, estoque: 100 },
        { nome: "Nutella", preco: 9.00, estoque: 100 },
        { nome: "Ovomaltine", preco: 8.50, estoque: 100 },
        { nome: "Pistache", preco: 9.00, estoque: 100 },
        { nome: "Prestígio", preco: 8.00, estoque: 100 },
        { nome: "Sensação", preco: 8.00, estoque: 100 },
        { nome: "Torta de Chocolate", preco: 8.50, estoque: 100 }
    ],
    "picole-leite": [
        { nome: "Açaí", preco: 3.00, estoque: 100 },
        { nome: "Blue Ice", preco: 3.00, estoque: 100 },
        { nome: "Caraxi", preco: 3.00, estoque: 100 },
        { nome: "Coco Branco", preco: 3.00, estoque: 100 },
        { nome: "Chocolate", preco: 3.00, estoque: 100 },
        { nome: "Amarena", preco: 3.00, estoque: 100 },
        { nome: "Leite Condensado", preco: 3.00, estoque: 100 },
        { nome: "Mamão Papaia", preco: 3.00, estoque: 100 },
        { nome: "Maracujá", preco: 3.00, estoque: 100 },
        { nome: "Morango", preco: 3.00, estoque: 100 },
        { nome: "Menta com Chocolate", preco: 3.00, estoque: 100 },
        { nome: "Nata com Goiaba", preco: 3.00, estoque: 100 }
    ],
    "picole-eskimo": [
        { nome: "Brigadeiro", preco: 8.00, estoque: 100 },
        { nome: "Bombom", preco: 8.00, estoque: 100 },
        { nome: "Nutella", preco: 8.00, estoque: 100 },
        { nome: "Ovomaltine", preco: 8.00, estoque: 100 },
        { nome: "Leite Ninho", preco: 8.00, estoque: 100 },
        { nome: "Nata", preco: 8.00, estoque: 100 },
        { nome: "Morango", preco: 8.00, estoque: 100 },
        { nome: "Prestígio", preco: 8.00, estoque: 100 }
    ],
    acai: [
        { nome: "Açaí 300ml", preco: 12.00, estoque: 100 },
        { nome: "Açaí 500ml", preco: 13.00, estoque: 100 },
        { nome: "Açaí 1L", preco: 15.00, estoque: 100 },
        { nome: "Açaí com Granola", preco: 12.00, estoque: 100 },
        { nome: "Açaí com Banana", preco: 12.00, estoque: 100 },
        { nome: "Açaí com Morango", preco: 12.00, estoque: 100 }
    ],
    milkshake: [
        { nome: "Milk Shake Gourmet", preco: 15.00, estoque: 100 },
        { nome: "Milk Shake Tradicional 300ml", preco: 12.00, estoque: 100 }
    ],
    tacas: [
        { nome: "Taça Clássica", preco: 18.00, estoque: 100 }
    ],
    "tacas-premium": [
        { nome: "Taça Premium Especial", preco: 25.00, estoque: 100 }
    ]
};

// Função para renderizar produtos
function renderizarProdutos() {
    // Sorvetes
    const sorveteGrid = document.getElementById("sorvetes-grid");
    if (sorveteGrid) {
        sorveteGrid.innerHTML = produtos.sorvete.map(p => `
            <div class="produto-card" onclick="selecionarProduto('sorvete', '${p.nome}', ${p.preco})">
                <h4>${p.nome}</h4>
                <div class="produto-preco">R$ ${p.preco.toFixed(2)}</div>
                <button class="btn-comprar" onclick="event.stopPropagation(); adicionarAoCarrinho('sorvete', '${p.nome}', ${p.preco})">Comprar</button>
            </div>
        `).join("");
    }

    // Picolés de Leite com Recheio
    const picoleLeiteGrid = document.getElementById("picole-leite-grid");
    if (picoleLeiteGrid) {
        picoleLeiteGrid.innerHTML = produtos["picole-leite"].map(p => `
            <div class="produto-card" onclick="selecionarProduto('picole-leite', '${p.nome}', ${p.preco})">
                <h4>${p.nome}</h4>
                <div class="produto-preco">R$ ${p.preco.toFixed(2)}</div>
                <button class="btn-comprar" onclick="event.stopPropagation(); adicionarAoCarrinho('picole-leite', '${p.nome}', ${p.preco})">Comprar</button>
            </div>
        `).join("");
    }

    // Picolés Eskimo
    const picoleEskimoGrid = document.getElementById("picole-eskimo-grid");
    if (picoleEskimoGrid) {
        picoleEskimoGrid.innerHTML = produtos["picole-eskimo"].map(p => `
            <div class="produto-card" onclick="selecionarProduto('picole-eskimo', '${p.nome}', ${p.preco})">
                <h4>${p.nome}</h4>
                <div class="produto-preco">R$ ${p.preco.toFixed(2)}</div>
                <button class="btn-comprar" onclick="event.stopPropagation(); adicionarAoCarrinho('picole-eskimo', '${p.nome}', ${p.preco})">Comprar</button>
            </div>
        `).join("");
    }

    // Açaí
    const acaiGrid = document.getElementById("acai-grid");
    if (acaiGrid) {
        acaiGrid.innerHTML = produtos.acai.map(p => `
            <div class="produto-card" onclick="selecionarProduto('acai', '${p.nome}', ${p.preco})">
                <h4>${p.nome}</h4>
                <div class="produto-preco">R$ ${p.preco.toFixed(2)}</div>
                <button class="btn-comprar" onclick="event.stopPropagation(); adicionarAoCarrinho('acai', '${p.nome}', ${p.preco})">Comprar</button>
            </div>
        `).join("");
    }
}

// Função para atualizar sabores no formulário
function atualizarSabores() {
    const categoria = document.getElementById("categoria").value;
    const saborSelect = document.getElementById("sabor");
    
    if (!saborSelect) return;
    
    saborSelect.innerHTML = "<option value=\"\">Selecione um sabor</option>";
    
    if (categoria && produtos[categoria]) {
        produtos[categoria].forEach(p => {
            const option = document.createElement("option");
            option.value = p.nome;
            option.textContent = `${p.nome} - R$ ${p.preco.toFixed(2)}`;
            saborSelect.appendChild(option);
        });
    }
}

// Função para selecionar produto
function selecionarProduto(categoria, nome, preco) {
    const catSelect = document.getElementById("categoria");
    if (catSelect) {
        catSelect.value = categoria;
        atualizarSabores();
        const saborSelect = document.getElementById("sabor");
        if (saborSelect) {
            saborSelect.value = nome;
        }
        scrollToSection('encomendas');
    }
}

// Inicializar produtos ao carregar a página
document.addEventListener("DOMContentLoaded", function() {
    renderizarProdutos();
});
