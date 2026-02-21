// ===== PAINEL ADMINISTRATIVO =====

const ADMIN_PASSWORD = 'itapolitanacajuru2007';

// Abrir painel de admin
function openAdmin() {
    const password = prompt('Digite a senha do Admin:');
    
    if (password === null) return; // Cancelado
    
    if (password === ADMIN_PASSWORD) {
        showAdminPanel();
    } else {
        alert('Senha incorreta!');
    }
}

// Mostrar painel de admin
function showAdminPanel() {
    const modal = document.createElement('div');
    modal.className = 'admin-modal active';
    modal.id = 'adminModal';
    modal.innerHTML = `
        <div class="admin-modal-content">
            <div class="admin-modal-header">
                <h2>⚙️ Painel Administrativo</h2>
                <button class="btn-close" onclick="closeAdmin()">✕</button>
            </div>
            
            <div class="admin-tabs">
                <button class="tab-btn active" onclick="switchTab('stock')">📦 Stock</button>
                <button class="tab-btn" onclick="switchTab('orders')">📋 Pedidos</button>
                <button class="tab-btn" onclick="switchTab('settings')">⚙️ Configurações</button>
            </div>
            
            <div id="stock-tab" class="tab-content active">
                <h3>Gestão de Stock</h3>
                <div id="stock-list" style="max-height: 400px; overflow-y: auto;"></div>
            </div>
            
            <div id="orders-tab" class="tab-content">
                <h3>Pedidos Recebidos</h3>
                <div id="orders-list" style="max-height: 400px; overflow-y: auto;"></div>
            </div>
            
            <div id="settings-tab" class="tab-content">
                <h3>Configurações</h3>
                <div style="padding: 16px; background: #f5f5f5; border-radius: 8px;">
                    <p><strong>Horário de Funcionamento:</strong> Seg-Dom 10h às 22h</p>
                    <p><strong>Retirada:</strong> Após 3 dias úteis</p>
                    <p><strong>Localização:</strong> Pça Lgo São Bento, 311 - Cajuru/SP</p>
                    <p><strong>Contato:</strong> (16) 99147-2045</p>
                    <p><strong>Regiões Atendidas:</strong> Cajuru, Santa Cruz da Esperança, Cássia dos Coqueiros</p>
                    <hr style="margin: 16px 0;">
                    <button class="btn btn-primary" onclick="exportData()" style="width: 100%;">📥 Exportar Dados</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    loadStockData();
    loadOrdersData();
}

// Fechar painel de admin
function closeAdmin() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.remove();
}

// Alternar abas
function switchTab(tabName) {
    // Ocultar todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover classe active de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Marcar botão como ativo
    event.target.classList.add('active');
}

// Carregar dados de stock
function loadStockData() {
    const stockList = document.getElementById('stock-list');
    
    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr style="background: #f0f0f0;"><th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Produto</th><th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Preço</th><th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Ações</th></tr>';
    
    // Sorvetes
    html += '<tr><td colspan="3" style="padding: 12px; background: #e8f5e9; font-weight: bold; border: 1px solid #ddd;">🍦 Sorvetes</td></tr>';
    products.sorvetes.forEach(p => {
        html += `<tr style="border: 1px solid #ddd;">
            <td style="padding: 8px;">${p.name}</td>
            <td style="padding: 8px;">R$ ${p.price.toFixed(2)}</td>
            <td style="padding: 8px;"><button class="btn-edit" onclick="editProduct(${p.id}, 'sorvetes')">Editar</button></td>
        </tr>`;
    });
    
    // Picolés
    html += '<tr><td colspan="3" style="padding: 12px; background: #e3f2fd; font-weight: bold; border: 1px solid #ddd;">🍭 Picolés</td></tr>';
    products.picoles.forEach(p => {
        html += `<tr style="border: 1px solid #ddd;">
            <td style="padding: 8px;">${p.name}</td>
            <td style="padding: 8px;">R$ ${p.price.toFixed(2)}</td>
            <td style="padding: 8px;"><button class="btn-edit" onclick="editProduct(${p.id}, 'picoles')">Editar</button></td>
        </tr>`;
    });
    
    // Açaí
    html += '<tr><td colspan="3" style="padding: 12px; background: #f3e5f5; font-weight: bold; border: 1px solid #ddd;">🛶 Açaí</td></tr>';
    products.acai.forEach(p => {
        html += `<tr style="border: 1px solid #ddd;">
            <td style="padding: 8px;">${p.name}</td>
            <td style="padding: 8px;">R$ ${p.price.toFixed(2)}</td>
            <td style="padding: 8px;"><button class="btn-edit" onclick="editProduct(${p.id}, 'acai')">Editar</button></td>
        </tr>`;
    });
    
    // Milkshakes
    html += '<tr><td colspan="3" style="padding: 12px; background: #fff3e0; font-weight: bold; border: 1px solid #ddd;">🥤 Milkshakes</td></tr>';
    products.milkshakes.forEach(p => {
        html += `<tr style="border: 1px solid #ddd;">
            <td style="padding: 8px;">${p.name}</td>
            <td style="padding: 8px;">R$ ${p.price.toFixed(2)}</td>
            <td style="padding: 8px;"><button class="btn-edit" onclick="editProduct(${p.id}, 'milkshakes')">Editar</button></td>
        </tr>`;
    });
    
    // Taças
    html += '<tr><td colspan="3" style="padding: 12px; background: #fce4ec; font-weight: bold; border: 1px solid #ddd;">🍨 Taças</td></tr>';
    products.tacas.forEach(p => {
        html += `<tr style="border: 1px solid #ddd;">
            <td style="padding: 8px;">${p.name}</td>
            <td style="padding: 8px;">R$ ${p.price.toFixed(2)}</td>
            <td style="padding: 8px;"><button class="btn-edit" onclick="editProduct(${p.id}, 'tacas')">Editar</button></td>
        </tr>`;
    });
    
    // Taças Premium
    html += '<tr><td colspan="3" style="padding: 12px; background: #ede7f6; font-weight: bold; border: 1px solid #ddd;">🍫 Taças Premium</td></tr>';
    products.tacas_premium.forEach(p => {
        html += `<tr style="border: 1px solid #ddd;">
            <td style="padding: 8px;">${p.name}</td>
            <td style="padding: 8px;">R$ ${p.price.toFixed(2)}</td>
            <td style="padding: 8px;"><button class="btn-edit" onclick="editProduct(${p.id}, 'tacas_premium')">Editar</button></td>
        </tr>`;
    });
    
    html += '</table>';
    
    // Adicionar estilos para botões
    html += `<style>
        .btn-edit {
            padding: 6px 12px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        .btn-edit:hover {
            background: #1976D2;
        }
    </style>`;
    
    stockList.innerHTML = html;
}

// Carregar pedidos
function loadOrdersData() {
    const ordersList = document.getElementById('orders-list');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nenhum pedido recebido ainda.</p>';
        return;
    }
    
    let html = '';
    orders.reverse().forEach((order, index) => {
        html += `<div style="padding: 12px; background: #f5f5f5; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #4CAF50;">
            <p><strong>Pedido #${orders.length - index}</strong></p>
            <p>Data: ${order.date}</p>
            <p>Total: R$ ${order.total.toFixed(2)}</p>
            <p><strong>Itens:</strong></p>
            <ul style="margin: 8px 0; padding-left: 20px;">
        `;
        
        order.items.forEach(item => {
            html += `<li>${item.name} (x${item.quantity}) - R$ ${(item.price * item.quantity).toFixed(2)}</li>`;
        });
        
        html += '</ul></div>';
    });
    
    ordersList.innerHTML = html;
}

// Editar produto
function editProduct(id, category) {
    alert('Função de edição em desenvolvimento. ID: ' + id + ', Categoria: ' + category);
}

// Exportar dados
function exportData() {
    const data = {
        products: products,
        orders: JSON.parse(localStorage.getItem('orders') || '[]'),
        exportDate: new Date().toLocaleString('pt-BR')
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `itapolitana_dados_${Date.now()}.json`;
    link.click();
    
    alert('Dados exportados com sucesso!');
}

// Estilos para o painel admin
const adminStyles = `
    .admin-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 2000;
        align-items: center;
        justify-content: center;
    }
    
    .admin-modal.active {
        display: flex;
    }
    
    .admin-modal-content {
        background: white;
        padding: 24px;
        border-radius: 8px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    }
    
    .admin-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
        border-bottom: 2px solid #ddd;
    }
    
    .tab-btn {
        padding: 10px 16px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        color: #999;
        border-bottom: 3px solid transparent;
        transition: all 0.3s ease;
    }
    
    .tab-btn.active {
        color: #8B4513;
        border-bottom-color: #8B4513;
    }
    
    .tab-content {
        display: none;
    }
    
    .tab-content.active {
        display: block;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = adminStyles;
document.head.appendChild(styleSheet);
