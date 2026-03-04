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

// Sincronização Automática com GitHub
async function sincronizarComGitHub() {
  const token = localStorage.getItem('github_token');
  const owner = 'missias123';
  const repo = 'itapolitanacajuru';
  const branch = 'main';
  
  // Converter dados para JSON
  const conteudo = JSON.stringify(produtos, null, 2);
  const contentBase64 = btoa(conteudo);
  
  try {
    // Obter SHA do arquivo atual
    const resGet = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/dados/produtos.json?ref=${branch}`,
      { headers: { 'Authorization': `token ${token}` } }
    );
    const fileData = await resGet.json();
    
    // Fazer commit com os novos dados
    const resCommit = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/dados/produtos.json`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Admin: Atualização automática de preços e estoque',
          content: contentBase64,
          sha: fileData.sha,
          branch: branch
        })
      }
    );
    
    if (resCommit.ok) {
      console.log('✅ Sincronização com GitHub realizada com sucesso!');
      // Limpar cache do site para atualização instantânea
      fetch('/', { cache: 'no-store' });
      return true;
    } else {
      console.error('❌ Erro ao sincronizar:', resCommit.statusText);
      return false;
    }
  } catch (erro) {
    console.error('❌ Erro na sincronização:', erro);
    return false;
  }
}

// Modificar função salvarProduto para incluir sincronização
function salvarProdutoComSync(categoria, produto, elemento) {
  const card = elemento.parentElement;
  const preco = card.querySelector("input[type=\"number\"]").value;
  const estoque = card.querySelector("input[type=\"number\"]").value;
  
  produtos[categoria][produto].preco = parseFloat(preco);
  produtos[categoria][produto].estoque = parseInt(estoque);
  
  // Sincronizar com GitHub
  sincronizarComGitHub().then(sucesso => {
    if (sucesso) {
      alert(`✅ ${produto.replace(/_/g, ' ')} salvo e sincronizado!`);
    } else {
      alert(`⚠️ ${produto.replace(/_/g, ' ')} salvo localmente, mas falhou sincronização.`);
    }
  });
}
    alert(`Sabor ${sabor} esgotado!`);
}
