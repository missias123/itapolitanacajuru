// ===== SERVIDOR DE SINCRONIZAÇÃO EM TEMPO REAL =====
// Sincroniza dados entre o Admin Panel e o Site em tempo real
// Sem erros, leve e rápido

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configurações
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'sync-data.json');
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Garantir que o diretório de dados existe
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ===== GERENCIAMENTO DE DADOS =====

// Carregar dados do arquivo
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
    }
    return getDefaultData();
}

// Dados padrão
function getDefaultData() {
    return {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        products: {
            sorvetes: {},
            picoles: {},
            acai: {},
            milkshake: {},
            tortas: {},
            complementos: {}
        },
        settings: {
            storeName: 'Sorveteria Itapolitana',
            address: 'Pça Lgo São Bento, 311 - Centro, Cajuru/SP',
            phone: '(16) 99606-2046',
            hours: 'Seg-Dom: 10h às 22h',
            email: 'contato@itapolitana.com.br'
        },
        inventory: {}
    };
}

// Salvar dados no arquivo
function saveData(data) {
    try {
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log('✅ Dados salvos com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar dados:', error);
        return false;
    }
}

// ===== WEBSOCKET - CONEXÕES EM TEMPO REAL =====

const clients = new Set();

wss.on('connection', (ws) => {
    console.log('🔗 Novo cliente conectado');
    clients.add(ws);

    // Enviar dados atuais ao conectar
    ws.send(JSON.stringify({
        type: 'INITIAL_DATA',
        data: loadData(),
        timestamp: new Date().toISOString()
    }));

    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message);
            handleWebSocketMessage(ws, msg);
        } catch (error) {
            console.error('❌ Erro ao processar mensagem WebSocket:', error);
        }
    });

    ws.on('close', () => {
        console.log('🔌 Cliente desconectado');
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('❌ Erro WebSocket:', error);
    });
});

// Processar mensagens WebSocket
function handleWebSocketMessage(ws, msg) {
    const { type, data, key } = msg;

    switch (type) {
        case 'UPDATE_PRODUCT':
            updateProduct(data, key);
            break;
        case 'UPDATE_INVENTORY':
            updateInventory(data, key);
            break;
        case 'UPDATE_SETTINGS':
            updateSettings(data);
            break;
        case 'DELETE_PRODUCT':
            deleteProduct(data, key);
            break;
        case 'SYNC_REQUEST':
            ws.send(JSON.stringify({
                type: 'SYNC_RESPONSE',
                data: loadData(),
                timestamp: new Date().toISOString()
            }));
            break;
        default:
            console.log('⚠️ Tipo de mensagem desconhecido:', type);
    }
}

// Atualizar produto
function updateProduct(productData, category) {
    const data = loadData();
    if (!data.products[category]) {
        data.products[category] = {};
    }
    data.products[category] = { ...data.products[category], ...productData };
    saveData(data);
    broadcastUpdate('PRODUCT_UPDATED', { category, data: productData });
}

// Atualizar inventário
function updateInventory(inventoryData, category) {
    const data = loadData();
    if (!data.inventory[category]) {
        data.inventory[category] = {};
    }
    data.inventory[category] = { ...data.inventory[category], ...inventoryData };
    saveData(data);
    broadcastUpdate('INVENTORY_UPDATED', { category, data: inventoryData });
}

// Atualizar configurações
function updateSettings(settingsData) {
    const data = loadData();
    data.settings = { ...data.settings, ...settingsData };
    saveData(data);
    broadcastUpdate('SETTINGS_UPDATED', settingsData);
}

// Deletar produto
function deleteProduct(productId, category) {
    const data = loadData();
    if (data.products[category] && data.products[category][productId]) {
        delete data.products[category][productId];
        saveData(data);
        broadcastUpdate('PRODUCT_DELETED', { category, productId });
    }
}

// Broadcast para todos os clientes conectados
function broadcastUpdate(type, data) {
    const message = JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
    });

    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// ===== ROTAS REST API =====

// GET - Obter todos os dados
app.get('/api/data', (req, res) => {
    res.json(loadData());
});

// GET - Obter dados de uma categoria
app.get('/api/data/:category', (req, res) => {
    const data = loadData();
    const category = req.params.category;
    
    if (data.products[category]) {
        res.json(data.products[category]);
    } else if (data.inventory[category]) {
        res.json(data.inventory[category]);
    } else {
        res.status(404).json({ error: 'Categoria não encontrada' });
    }
});

// POST - Atualizar dados
app.post('/api/update', (req, res) => {
    const { type, category, data: updateData } = req.body;

    if (!type || !category) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    switch (type) {
        case 'product':
            updateProduct(updateData, category);
            break;
        case 'inventory':
            updateInventory(updateData, category);
            break;
        case 'settings':
            updateSettings(updateData);
            break;
        default:
            return res.status(400).json({ error: 'Tipo de atualização inválido' });
    }

    res.json({ success: true, message: 'Dados atualizados com sucesso' });
});

// POST - Deletar produto
app.post('/api/delete', (req, res) => {
    const { category, productId } = req.body;

    if (!category || !productId) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    deleteProduct(productId, category);
    res.json({ success: true, message: 'Produto deletado com sucesso' });
});

// POST - Upload de imagem
app.post('/api/upload-image', (req, res) => {
    const { filename, base64Data } = req.body;

    if (!filename || !base64Data) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    try {
        const buffer = Buffer.from(base64Data, 'base64');
        const filepath = path.join(__dirname, 'images', filename);
        
        // Garantir que o diretório existe
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filepath, buffer);
        broadcastUpdate('IMAGE_UPLOADED', { filename });
        res.json({ success: true, message: 'Imagem salva com sucesso', url: `/images/${filename}` });
    } catch (error) {
        console.error('❌ Erro ao salvar imagem:', error);
        res.status(500).json({ error: 'Erro ao salvar imagem' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== INICIAR SERVIDOR =====

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║  🚀 SERVIDOR DE SINCRONIZAÇÃO INICIADO    ║
╚════════════════════════════════════════════╝

📍 Servidor rodando em: http://localhost:${PORT}
🔗 WebSocket: ws://localhost:${PORT}
📊 API REST: http://localhost:${PORT}/api

✅ Pronto para sincronizar dados em tempo real!
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor...');
    wss.close();
    server.close(() => {
        console.log('✅ Servidor encerrado');
        process.exit(0);
    });
});

module.exports = server;
