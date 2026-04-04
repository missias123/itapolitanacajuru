// ===== CLIENTE DE SINCRONIZAÇÃO EM TEMPO REAL =====
// Conecta ao servidor de sincronização e atualiza o site instantaneamente

class SyncClient {
    constructor(serverUrl = 'ws://localhost:3000') {
        this.serverUrl = serverUrl;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.listeners = new Map();
        this.isConnected = false;
        
        // Inicializar conexão
        this.connect();
    }

    // Conectar ao servidor WebSocket
    connect() {
        try {
            this.ws = new WebSocket(this.serverUrl);

            this.ws.onopen = () => {
                console.log('✅ Conectado ao servidor de sincronização');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('connected');
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('❌ Erro ao processar mensagem:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ Erro WebSocket:', error);
                this.emit('error', error);
            };

            this.ws.onclose = () => {
                console.log('🔌 Desconectado do servidor');
                this.isConnected = false;
                this.emit('disconnected');
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('❌ Erro ao conectar:', error);
            this.attemptReconnect();
        }
    }

    // Tentar reconectar
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Tentando reconectar em ${this.reconnectDelay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        } else {
            console.error('❌ Falha ao reconectar após múltiplas tentativas');
        }
    }

    // Processar mensagens recebidas
    handleMessage(message) {
        const { type, data, timestamp } = message;

        console.log(`📨 Mensagem recebida: ${type} às ${new Date(timestamp).toLocaleTimeString()}`);

        switch (type) {
            case 'INITIAL_DATA':
                this.handleInitialData(data);
                break;
            case 'PRODUCT_UPDATED':
                this.handleProductUpdate(data);
                break;
            case 'INVENTORY_UPDATED':
                this.handleInventoryUpdate(data);
                break;
            case 'SETTINGS_UPDATED':
                this.handleSettingsUpdate(data);
                break;
            case 'PRODUCT_DELETED':
                this.handleProductDelete(data);
                break;
            case 'IMAGE_UPLOADED':
                this.handleImageUpload(data);
                break;
            default:
                console.log('⚠️ Tipo de mensagem desconhecido:', type);
        }

        this.emit(type, data);
    }

    // Dados iniciais
    handleInitialData(data) {
        console.log('📦 Dados iniciais recebidos');
        localStorage.setItem('itap_sync_data', JSON.stringify(data));
        this.emit('data-loaded', data);
    }

    // Atualização de produto
    handleProductUpdate(data) {
        const { category, data: productData } = data;
        console.log(`🔄 Produto atualizado em ${category}:`, productData);
        
        // Atualizar localStorage
        const syncData = JSON.parse(localStorage.getItem('itap_sync_data') || '{}');
        if (!syncData.products) syncData.products = {};
        if (!syncData.products[category]) syncData.products[category] = {};
        
        syncData.products[category] = { ...syncData.products[category], ...productData };
        localStorage.setItem('itap_sync_data', JSON.stringify(syncData));

        // Atualizar DOM
        this.updateDOM(category, productData);
    }

    // Atualização de inventário
    handleInventoryUpdate(data) {
        const { category, data: inventoryData } = data;
        console.log(`📊 Inventário atualizado em ${category}:`, inventoryData);

        // Atualizar localStorage
        const syncData = JSON.parse(localStorage.getItem('itap_sync_data') || '{}');
        if (!syncData.inventory) syncData.inventory = {};
        if (!syncData.inventory[category]) syncData.inventory[category] = {};

        syncData.inventory[category] = { ...syncData.inventory[category], ...inventoryData };
        localStorage.setItem('itap_sync_data', JSON.stringify(syncData));

        // Atualizar DOM
        this.updateInventoryDOM(category, inventoryData);
    }

    // Atualização de configurações
    handleSettingsUpdate(data) {
        console.log('⚙️ Configurações atualizadas:', data);
        
        // Atualizar localStorage
        const syncData = JSON.parse(localStorage.getItem('itap_sync_data') || '{}');
        syncData.settings = { ...syncData.settings, ...data };
        localStorage.setItem('itap_sync_data', JSON.stringify(syncData));

        // Atualizar elementos do DOM
        if (data.storeName) {
            document.querySelectorAll('[data-setting="storeName"]').forEach(el => {
                el.textContent = data.storeName;
            });
        }
        if (data.phone) {
            document.querySelectorAll('[data-setting="phone"]').forEach(el => {
                el.textContent = data.phone;
            });
        }
        if (data.address) {
            document.querySelectorAll('[data-setting="address"]').forEach(el => {
                el.textContent = data.address;
            });
        }
    }

    // Produto deletado
    handleProductDelete(data) {
        const { category, productId } = data;
        console.log(`🗑️ Produto deletado: ${productId} em ${category}`);

        // Remover do localStorage
        const syncData = JSON.parse(localStorage.getItem('itap_sync_data') || '{}');
        if (syncData.products && syncData.products[category]) {
            delete syncData.products[category][productId];
            localStorage.setItem('itap_sync_data', JSON.stringify(syncData));
        }

        // Remover do DOM
        const element = document.querySelector(`[data-product-id="${productId}"]`);
        if (element) {
            element.style.opacity = '0';
            setTimeout(() => element.remove(), 300);
        }
    }

    // Imagem enviada
    handleImageUpload(data) {
        const { filename } = data;
        console.log(`🖼️ Imagem enviada: ${filename}`);
        this.emit('image-uploaded', data);
    }

    // Atualizar DOM com dados de produto
    updateDOM(category, productData) {
        // Atualizar elementos com data-category e data-product
        Object.entries(productData).forEach(([productId, product]) => {
            const elements = document.querySelectorAll(`[data-category="${category}"][data-product="${productId}"]`);
            
            elements.forEach(el => {
                // Atualizar preço
                const priceEl = el.querySelector('[data-field="price"]');
                if (priceEl && product.price) {
                    priceEl.textContent = `R$ ${product.price.toFixed(2).replace('.', ',')}`;
                }

                // Atualizar descrição
                const descEl = el.querySelector('[data-field="description"]');
                if (descEl && product.description) {
                    descEl.textContent = product.description;
                }

                // Atualizar imagem
                const imgEl = el.querySelector('[data-field="image"]');
                if (imgEl && product.image) {
                    imgEl.src = product.image;
                    imgEl.alt = product.name || 'Produto';
                }

                // Atualizar disponibilidade
                if (product.available === false) {
                    el.classList.add('unavailable');
                    el.classList.remove('available');
                } else {
                    el.classList.add('available');
                    el.classList.remove('unavailable');
                }
            });
        });
    }

    // Atualizar DOM com dados de inventário
    updateInventoryDOM(category, inventoryData) {
        Object.entries(inventoryData).forEach(([productId, inventory]) => {
            const elements = document.querySelectorAll(`[data-category="${category}"][data-product="${productId}"]`);
            
            elements.forEach(el => {
                // Atualizar quantidade
                const quantityEl = el.querySelector('[data-field="quantity"]');
                if (quantityEl) {
                    quantityEl.textContent = inventory.quantity || 0;
                }

                // Mostrar/esconder "Esgotado"
                const outOfStockEl = el.querySelector('[data-field="out-of-stock"]');
                if (outOfStockEl) {
                    if (inventory.quantity <= 0) {
                        outOfStockEl.style.display = 'block';
                        el.classList.add('out-of-stock');
                    } else {
                        outOfStockEl.style.display = 'none';
                        el.classList.remove('out-of-stock');
                    }
                }
            });
        });
    }

    // Enviar mensagem para o servidor
    send(message) {
        if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('⚠️ Não conectado ao servidor');
        }
    }

    // Atualizar produto
    updateProduct(category, productData) {
        this.send({
            type: 'UPDATE_PRODUCT',
            category,
            data: productData
        });
    }

    // Atualizar inventário
    updateInventory(category, inventoryData) {
        this.send({
            type: 'UPDATE_INVENTORY',
            category,
            data: inventoryData
        });
    }

    // Atualizar configurações
    updateSettings(settingsData) {
        this.send({
            type: 'UPDATE_SETTINGS',
            data: settingsData
        });
    }

    // Deletar produto
    deleteProduct(category, productId) {
        this.send({
            type: 'DELETE_PRODUCT',
            key: category,
            data: productId
        });
    }

    // Solicitar sincronização
    requestSync() {
        this.send({
            type: 'SYNC_REQUEST'
        });
    }

    // Adicionar listener de evento
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    // Remover listener de evento
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // Emitir evento
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Erro ao executar listener para ${event}:`, error);
                }
            });
        }
    }

    // Obter dados sincronizados
    getData() {
        return JSON.parse(localStorage.getItem('itap_sync_data') || '{}');
    }

    // Verificar se está conectado
    isOnline() {
        return this.isConnected;
    }

    // Desconectar
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Inicializar cliente de sincronização globalmente
let syncClient = null;

document.addEventListener('DOMContentLoaded', () => {
    // Detectar URL do servidor (local ou remoto)
    const serverUrl = window.location.hostname === 'localhost' 
        ? 'ws://localhost:3000' 
        : `wss://${window.location.host}`;

    syncClient = new SyncClient(serverUrl);

    // Listeners de exemplo
    syncClient.on('connected', () => {
        console.log('🎉 Sincronização conectada!');
        document.body.classList.add('sync-connected');
    });

    syncClient.on('disconnected', () => {
        console.log('⚠️ Sincronização desconectada');
        document.body.classList.remove('sync-connected');
    });

    syncClient.on('data-loaded', (data) => {
        console.log('📦 Dados carregados:', data);
    });

    // Expor globalmente
    window.syncClient = syncClient;
});

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyncClient;
}
