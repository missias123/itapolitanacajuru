// ===== CONFIGURAÇÃO MESTRE DO ADMIN (SINCRONIZADA COM GITHUB) =====
// Este ficheiro serve como a "fonte da verdade" para o Manus e para o Painel Admin.

const MASTER_CONFIG = {
    version: "2.1.0",
    lastUpdated: "2026-02-21T14:00:00Z",
    
    // IDENTIDADE VISUAL (LOGOMARCA)
    appearance: {
        primaryColor: "#5D2E17", // Marrom Chocolate Profundo
        secondaryColor: "#D4AF37", // Dourado Metálico
        accentColor: "#8B4513", // Marrom Médio
        backgroundColor: "#FFFBF0", // Creme Suave
        textColor: "#2D1A12" // Texto Marrom Escuro
    },
    
    // CATEGORIAS E PREÇOS PADRONIZADOS (CONFORME PDF)
    pricing: {
        picoleRecheado: 3.00,
        picoleEskimo: 8.00,
        picoleFrutas: 2.50,
        picoleLeite: 2.50
    },
    
    // LISTA OFICIAL DE SABORES (ARQUIVADA NO ADMIN)
    flavors: {
        recheados: [
            "Morango", "Maracujá", "Limão", "Coco", "Amendoim", 
            "Doce de Leite", "Chocolate", "Abacaxi", "Banana", 
            "Uva", "Goiaba", "Blue Ice", "Caraxi", "Coco Branco", 
            "Amarena", "Leite Condensado", "Mamão Papaia", 
            "Menta c/ Choc", "Nata c/ Goiaba"
        ],
        eskimo: [
            "Brigadeiro", "Bombom", "Nutella", "Ovomaltine", 
            "Leite Ninho", "Nata", "Morango", "Prestígio"
        ]
    },
    
    // SEO LOCAL E VISIBILIDADE REGIONAL
    seo: {
        cities: ["Cajuru", "Santa Cruz da Esperança", "Cássia dos Coqueiros"],
        keywords: ["Sorveteria em Cajuru", "Sorvete Artesanal", "Picolés Recheados"],
        footerText: "Sorveteria Itapolitana – atendendo Cajuru, Santa Cruz da Esperança e Cássia dos Coqueiros desde 2007."
    }
};

// Função para o Admin ler esta configuração mestre
function getMasterConfig() {
    return MASTER_CONFIG;
}

// Exportar para uso em outros scripts se necessário
if (typeof module !== 'undefined') {
    module.exports = MASTER_CONFIG;
}
