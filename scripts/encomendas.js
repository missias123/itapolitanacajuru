document.addEventListener('DOMContentLoaded', () => {
    const categoriasContainer = document.getElementById('categorias-container');

    const categorias = {
        'Sorvete em Caixa': {
            cor: 'purple',
            opcoes: {
                'Caixa 10L - 2 Sabores': { preco: 150.00, desc: 'Escolha 2 sabores deliciosos' },
                'Caixa 10L - 3 Sabores': { preco: 165.00, desc: 'Escolha 3 sabores deliciosos' },
                'Caixa 5L - 2 Sabores': { preco: 100.00, desc: 'Escolha 2 sabores deliciosos' },
                'Caixa 5L - 3 Sabores': { preco: 115.00, desc: 'Escolha 3 sabores deliciosos' },
            }
        },
        'Torta de Sorvete': {
            cor: 'pink',
            opcoes: {
                'Torta de Sorvete': { preco: 100.00, desc: 'Perfeita para festas - 3 sabores' }
            }
        },
        'Picolés (Atacado)': {
            cor: 'orange',
            opcoes: {
                'Picolés (Atacado)': { preco: 0, desc: 'Mínimo 100 unidades' }
            }
        }
    };

    for (const nomeCategoria in categorias) {
        const categoria = categorias[nomeCategoria];
        const categoriaDiv = document.createElement('div');
        categoriaDiv.className = 'categoria-encomenda';

        const header = document.createElement('div');
        header.className = 'categoria-encomenda-header';
        header.style.backgroundColor = `var(--${categoria.cor});`;
        header.innerHTML = `<span>${nomeCategoria}</span><span>▼</span>`;
        header.onclick = () => {
            content.style.display = content.style.display === 'grid' ? 'none' : 'grid';
        };

        const content = document.createElement('div');
        content.className = 'categoria-encomenda-content';
        content.style.display = 'none';

        if (nomeCategoria === 'Picolés (Atacado)') {
            const tiposPicole = {
                'PICOLÉ DE FRUTA/BASE ÁGUA': { varejo: 2.50, atacado: 1.80, sabores: 'picole_frutas_agua' },
                'PICOLÉ DE LEITE': { varejo: 2.50, atacado: 2.00, sabores: 'picole_leite_sem_recheio' },
                'PICOLÉ DE LEITE RECHEADOS': { varejo: 3.00, atacado: 2.00, sabores: 'picole_leite_com_recheio' },
                'PICOLÉ DE LEITE NINHO': { varejo: 4.00, atacado: 3.00, sabores: 'picole_leite_ninho' },
                'PICOLÉS ESQUIMÓS': { varejo: 8.00, atacado: 6.00, sabores: 'picole_eskimo' },
            };

            for(const tipo in tiposPicole) {
                const info = tiposPicole[tipo];
                const picoleCard = document.createElement('div');
                picoleCard.className = 'picole-card';
                picoleCard.innerHTML = `
                    <h5>${tipo}</h5>
                    <p>Varejo: R$ ${info.varejo.toFixed(2)} | Atacado: R$ ${info.atacado.toFixed(2)}</p>
                    <button class='btn-ver-sabores' onclick='abrirModalSabores("${info.sabores}")'>Ver Sabores</button>
                `;
                content.appendChild(picoleCard);
            }
        } else {
            for (const nomeOpcao in categoria.opcoes) {
                const opcao = categoria.opcoes[nomeOpcao];
                const card = document.createElement('div');
                card.className = 'produto-encomenda-card';
                card.innerHTML = `
                    <h4>${nomeOpcao}</h4>
                    <p>${opcao.desc}</p>
                    <div class="produto-preco">R$ ${opcao.preco.toFixed(2)}</div>
                `;
                card.onclick = () => {
                    let maxSabores = 0;
                    if (nomeOpcao.includes("2 Sabores")) maxSabores = 2;
                    if (nomeOpcao.includes("3 Sabores")) maxSabores = 3;
                    if (nomeCategoria === "Torta de Sorvete") maxSabores = 3;

                    if (maxSabores > 0) {
                        abrirModalSaboresEncomenda(maxSabores, nomeOpcao, opcao.preco);
                    } else {
                        adicionarAoCarrinho("encomenda", nomeOpcao, opcao.preco);
                    }
                };
                content.appendChild(card);
            }
        }

        categoriaDiv.appendChild(header);
        categoriaDiv.appendChild(content);
        categoriasContainer.appendChild(categoriaDiv);
    }
});
let selecaoSaboresAtual = {};

function abrirModalSaboresEncomenda(maxSabores, produtoNome, preco) {
    const modal = document.getElementById('modal-sabores-encomenda');
    const titulo = document.getElementById('modal-sabores-titulo');
    const subtitulo = document.getElementById('modal-sabores-subtitulo');
    const saboresGrid = document.getElementById('sabores-grid');

    titulo.textContent = `Escolha seus Sabores - ${maxSabores} DE SABOR`;
    subtitulo.textContent = `Selecione até ${maxSabores} sabores (0/${maxSabores})`;
    saboresGrid.innerHTML = '';
    selecaoSaboresAtual = { max: maxSabores, sabores: [], produto: produtoNome, preco: preco };

    produtos.sorvetes.sabores.forEach(sabor => {
        saboresGrid.innerHTML += `
            <div class="opcao-item" onclick="selecionarSabor(this, '${sabor}')">
                ${sabor}
            </div>
        `;
    });

    modal.style.display = 'block';
}

function selecionarSabor(elemento, sabor) {
    const index = selecaoSaboresAtual.sabores.indexOf(sabor);

    if (index > -1) {
        selecaoSaboresAtual.sabores.splice(index, 1);
        elemento.classList.remove('selecionado');
    } else {
        if (selecaoSaboresAtual.sabores.length < selecaoSaboresAtual.max) {
            selecaoSaboresAtual.sabores.push(sabor);
            elemento.classList.add('selecionado');
        } else {
            alert(`Você pode selecionar no máximo ${selecaoSaboresAtual.max} sabores.`);
        }
    }

    document.getElementById('modal-sabores-subtitulo').textContent = `Selecione até ${selecaoSaboresAtual.max} sabores (${selecaoSaboresAtual.sabores.length}/${selecaoSaboresAtual.max})`;
}

function confirmarSelecaoSabores() {
    if (selecaoSaboresAtual.sabores.length === 0) {
        alert("Selecione pelo menos um sabor.");
        return;
    }

    const nomeFinal = `${selecaoSaboresAtual.produto} (${selecaoSaboresAtual.sabores.join(', ')})`;
    adicionarAoCarrinho('encomenda', nomeFinal, selecaoSaboresAtual.preco);
    fecharModal('modal-sabores-encomenda');
}

function fecharModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Adicionar ao carrinho (placeholder)
function adicionarAoCarrinho(categoria, nome, preco) {
    console.log("Adicionado ao carrinho:", { categoria, nome, preco });
}
