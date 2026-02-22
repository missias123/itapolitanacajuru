// ===== SISTEMA DE BACKUP E SINCRONIZAÇÃO AUTOMÁTICA =====

const BACKUP_KEY = 'itapolitana_backups';
const SYNC_LOG_KEY = 'itapolitana_sync_log';
const AUTO_BACKUP_INTERVAL = 3600000; // 1 hora

// Criar backup automático
function createAutoBackup() {
    const db = getDatabase();
    const backup = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        database: db,
        type: 'auto',
        description: `Backup automático - ${new Date().toLocaleString('pt-BR')}`
    };
    
    addBackup(backup);
    console.log('✅ Backup automático criado');
}

// Adicionar backup à lista
function addBackup(backup) {
    let backups = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]');
    backups.unshift(backup); // Adicionar no início
    
    // Manter apenas os últimos 50 backups
    if (backups.length > 50) {
        backups = backups.slice(0, 50);
    }
    
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
    addSyncLog('Backup criado', backup.description);
}

// Obter lista de backups
function getBackups() {
    return JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]');
}

// Restaurar backup
function restoreBackup(backupId) {
    const backups = getBackups();
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) {
        alert('Backup não encontrado');
        return false;
    }
    
    if (confirm(`Deseja restaurar o backup de ${new Date(backup.timestamp).toLocaleString('pt-BR')}?\n\nIsto sobrescreverá todos os dados atuais.`)) {
        localStorage.setItem(DATABASE_KEY, JSON.stringify(backup.database));
        syncAllData();
        addSyncLog('Backup restaurado', backup.description);
        showNotification('✅ Backup restaurado com sucesso');
        return true;
    }
    
    return false;
}

// Deletar backup
function deleteBackup(backupId) {
    if (confirm('Deseja deletar este backup?')) {
        let backups = getBackups();
        backups = backups.filter(b => b.id !== backupId);
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
        addSyncLog('Backup deletado', `ID: ${backupId}`);
        showNotification('✅ Backup deletado');
        return true;
    }
    return false;
}

// Exportar backup
function exportBackup(backupId) {
    const backups = getBackups();
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) {
        alert('Backup não encontrado');
        return;
    }
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `itapolitana_backup_${backup.id}.json`;
    link.click();
    
    addSyncLog('Backup exportado', `ID: ${backup.id}`);
}

// Importar backup
function importBackup(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const backup = JSON.parse(e.target.result);
            
            if (!backup.database || !backup.database.products) {
                alert('Arquivo de backup inválido');
                return;
            }
            
            backup.id = Date.now();
            backup.timestamp = new Date().toISOString();
            backup.type = 'imported';
            backup.description = `Backup importado - ${new Date().toLocaleString('pt-BR')}`;
            
            addBackup(backup);
            showNotification('✅ Backup importado com sucesso');
        } catch (error) {
            alert('Erro ao importar backup: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

// Adicionar entrada ao log de sincronização
function addSyncLog(action, details) {
    let logs = JSON.parse(localStorage.getItem(SYNC_LOG_KEY) || '[]');
    
    logs.unshift({
        timestamp: new Date().toISOString(),
        action: action,
        details: details,
        user: 'Admin'
    });
    
    // Manter apenas os últimos 100 logs
    if (logs.length > 100) {
        logs = logs.slice(0, 100);
    }
    
    localStorage.setItem(SYNC_LOG_KEY, JSON.stringify(logs));
}

// Obter log de sincronização
function getSyncLog() {
    return JSON.parse(localStorage.getItem(SYNC_LOG_KEY) || '[]');
}

// Renderizar lista de backups no Admin
function renderBackupsList() {
    const backups = getBackups();
    
    if (backups.length === 0) {
        return '<p style="text-align: center; color: #6A0DAD; padding: 20px;">Nenhum backup disponível</p>';
    }
    
    let html = '<div style="display: grid; gap: 12px;">';
    
    backups.forEach(backup => {
        const date = new Date(backup.timestamp);
        html += `
            <div style="padding: 12px; background: #f5f5f5; border-radius: 8px; border-left: 4px solid #2196F3;">
                <p style="margin: 0 0 8px 0;"><strong>${backup.description}</strong></p>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #6A0DAD;">
                    ${date.toLocaleString('pt-BR')}
                </p>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button onclick="restoreBackup(${backup.id})" class="btn-small" style="background: #4CAF50;">Restaurar</button>
                    <button onclick="exportBackup(${backup.id})" class="btn-small" style="background: #2196F3;">Exportar</button>
                    <button onclick="deleteBackup(${backup.id})" class="btn-small" style="background: #f44336;">Deletar</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Renderizar log de sincronização
function renderSyncLog() {
    const logs = getSyncLog();
    
    if (logs.length === 0) {
        return '<p style="text-align: center; color: #6A0DAD; padding: 20px;">Nenhuma atividade registrada</p>';
    }
    
    let html = '<table style="width: 100%; border-collapse: collapse; font-size: 12px;">';
    html += '<tr style="background: #f0f0f0;"><th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Data/Hora</th><th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Ação</th><th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Detalhes</th></tr>';
    
    logs.forEach(log => {
        const date = new Date(log.timestamp);
        html += `<tr style="border: 1px solid #ddd;">
            <td style="padding: 8px;">${date.toLocaleString('pt-BR')}</td>
            <td style="padding: 8px;"><strong>${log.action}</strong></td>
            <td style="padding: 8px;">${log.details}</td>
        </tr>`;
    });
    
    html += '</table>';
    return html;
}

// Iniciar backup automático
function startAutoBackup() {
    // Criar backup imediatamente
    createAutoBackup();
    
    // Criar backup a cada hora
    setInterval(createAutoBackup, AUTO_BACKUP_INTERVAL);
    
    console.log('✅ Sistema de backup automático iniciado');
}

// Estilo para botões pequenos
const backupStyles = `
    .btn-small {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        color: white;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .btn-small:hover {
        transform: scale(1.05);
        opacity: 0.9;
    }
    
    .backup-import {
        display: none;
    }
`;

const backupStyleSheet = document.createElement('style');
backupStyleSheet.textContent = backupStyles;
document.head.appendChild(backupStyleSheet);

// Iniciar sistema de backup ao carregar
document.addEventListener('DOMContentLoaded', () => {
    startAutoBackup();
});
