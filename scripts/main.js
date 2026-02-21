// ===== INICIALIZAÇÃO PRINCIPAL =====

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Verificar se é primeira visita
    const isFirstVisit = !localStorage.getItem('itapolitana_visited');
    if (isFirstVisit) {
        localStorage.setItem('itapolitana_visited', 'true');
        console.log('Bem-vindo à Sorveteria Itapolitana!');
    }
    
    // Inicializar base de dados centralizada
    if (typeof initializeDatabase === 'function') {
        initializeDatabase();
    }
    
    // Sincronizar dados
    if (typeof syncAllData === 'function') {
        syncAllData();
    }
    
    // Inicializar carrinho
    updateCart();
    
    // Configurar listeners
    setupEventListeners();
    
    // Aplicar tema
    applyTheme();
}

function setupEventListeners() {
    // Fechar modal ao clicar fora
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('adminModal');
        if (modal && e.target === modal) {
            closeAdmin();
        }
    });
    
    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('adminModal');
            if (modal) closeAdmin();
        }
    });
}

function applyTheme() {
    // Aplicar tema baseado na hora do dia
    const hour = new Date().getHours();
    const isDark = hour >= 18 || hour < 6;
    
    if (isDark) {
        document.body.style.backgroundColor = '#1a1a1a';
        document.body.style.color = '#f0f0f0';
    }
}

// Função para rastrear eventos (Analytics)
function trackEvent(eventName, eventData) {
    const event = {
        name: eventName,
        data: eventData,
        timestamp: new Date().toISOString()
    };
    
    // Enviar para servidor (se configurado)
    console.log('Event:', event);
}

// Função para verificar conectividade
function checkConnectivity() {
    if (!navigator.onLine) {
        showNotification('⚠️ Sem conexão com a internet');
    }
}

// Monitorar conectividade
window.addEventListener('online', () => {
    showNotification('✅ Conexão restaurada');
});

window.addEventListener('offline', () => {
    showNotification('❌ Sem conexão com a internet');
});

// Função para compartilhar
function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: 'Sorveteria Itapolitana',
            text: 'Confira nossos sorvetes, picolés e açaí artesanais!',
            url: window.location.href
        }).catch(err => console.log('Erro ao compartilhar:', err));
    } else {
        alert('Compartilhamento não suportado neste navegador');
    }
}

// Função para instalar app
function installApp() {
    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then(choiceResult => {
            if (choiceResult.outcome === 'accepted') {
                console.log('App instalado');
            }
            window.deferredPrompt = null;
        });
    }
}

// Detectar possibilidade de instalação
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
});

// Service Worker (se suportado)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('Service Worker não registrado:', err);
    });
}

// Função para enviar feedback
function sendFeedback() {
    const feedback = prompt('Envie seu feedback sobre o site:');
    if (feedback) {
        const feedbackData = {
            message: feedback,
            timestamp: new Date().toLocaleString('pt-BR'),
            userAgent: navigator.userAgent
        };
        
        // Salvar feedback
        let feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
        feedbacks.push(feedbackData);
        localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
        
        showNotification('✅ Obrigado pelo feedback!');
    }
}

// Função para limpar cache
function clearCache() {
    if (confirm('Deseja limpar o cache do site?')) {
        localStorage.clear();
        sessionStorage.clear();
        showNotification('✅ Cache limpo com sucesso');
        location.reload();
    }
}

// Versão do app
const APP_VERSION = '2.0.0';
console.log(`Sorveteria Itapolitana v${APP_VERSION}`);

// Log de performance
window.addEventListener('load', () => {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log(`Tempo de carregamento: ${pageLoadTime}ms`);
});
