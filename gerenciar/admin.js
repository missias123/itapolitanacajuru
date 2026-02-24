document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const passwordInput = document.getElementById("password");
    const loginForm = document.getElementById("login-form");
    const adminPanel = document.getElementById("admin-panel");
    const productManagement = document.getElementById("product-management");

    const ADMIN_PASSWORD = "itapolitana2007";

    loginBtn.addEventListener("click", () => {
        if (passwordInput.value === ADMIN_PASSWORD) {
            loginForm.style.display = "none";
            adminPanel.style.display = "block";
            renderAdminPanel();
        } else {
            alert("Senha incorreta!");
        }
    });

    logoutBtn.addEventListener("click", () => {
        loginForm.style.display = "block";
        adminPanel.style.display = "none";
        passwordInput.value = "";
    });

    function renderAdminPanel() {
        productManagement.innerHTML = "";
        for (const categoria in produtos) {
            const divCategoria = document.createElement("div");
            divCategoria.innerHTML = `<h3>${categoria}</h3>`;
            productManagement.appendChild(divCategoria);

            if (categoria === 'sorvetes' || categoria === 'picoles') {
                const sabores = produtos[categoria].sabores;
                const divSabores = document.createElement('div');
                divSabores.innerHTML = '<h5>Sabores</h5>';
                for (const sabor of sabores) {
                    divSabores.innerHTML += `
                        <div>
                            <span>${sabor}</span>
                            <button onclick="esgotarSabor('${categoria}', '${sabor}', this)">Esgotar</button>
                        </div>
                    `;
                }
                divCategoria.appendChild(divSabores);
            } else {
                for (const produto in produtos[categoria]) {
                const divProduto = document.createElement("div");
                divProduto.className = "product-card-admin";
                divProduto.innerHTML = `
                    <h4>${produto.replace(/_/g, ' ')}</h4>
                    <input type="number" value="${produtos[categoria][produto].preco || 0}" placeholder="Preço">
                    <input type="number" value="${produtos[categoria][produto].estoque || 0}" placeholder="Estoque">
                    <button onclick="salvarProduto('${categoria}', '${produto}', this)">Salvar</button><button onclick="esgotarProduto('${categoria}', '${produto}', this)">Esgotar</button>
                `;
                divCategoria.appendChild(divProduto);
                }
            }
        }
    }
});

function salvarProduto(categoria, produto, elemento) {
    const card = elemento.parentElement;
    const preco = card.querySelector("input[type=\"number\"]").value;
    const estoque = card.querySelector("input[type=\"number\"]").value;

    produtos[categoria][produto].preco = parseFloat(preco);
    produtos[categoria][produto].estoque = parseInt(estoque);

    alert(`${produto.replace(/_/g, ' ')} salvo com sucesso!`);
}

function esgotarProduto(categoria, produto, elemento) {
    produtos[categoria][produto].estoque = 0;
    elemento.parentElement.querySelector("input[type=\"number\"]").value = 0;
    alert(`${produto.replace(/_/g, ' ')} esgotado!`);
}

function esgotarSabor(categoria, sabor, elemento) {
    const index = produtos[categoria].sabores.indexOf(sabor);
    if (index > -1) {
        produtos[categoria].sabores.splice(index, 1);
    }
    elemento.parentElement.style.display = 'none';
    alert(`Sabor ${sabor} esgotado!`);
}
