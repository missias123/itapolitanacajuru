
from bs4 import BeautifulSoup

def fix_seals_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')

    # Novo CSS para os selos de segurança
    new_css = '''
<style>
.security-seals-title { font-size:12px;color:rgba(255,255,255,.7);text-align:center;margin-bottom:12px;font-weight:600; }
.security-seals-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; max-width: 700px; margin: 0 auto; padding: 0 12px; }
.security-seal-item { flex: 1 1 auto; min-width: 100px; max-width: 110px; text-decoration: none; cursor: pointer; }
.security-seal-content { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px; border: 1px solid rgba(255,255,255,.15); border-radius: 8px; background: rgba(255,255,255,.05); transition: all 0.3s; }
.security-seal-content:hover { background: rgba(255,255,255,.15); }
.security-seal-icon { font-size: 32px; line-height: 1; }
.security-seal-text { font-size: 9px; color: #FBD100; font-weight: 700; text-align: center; line-height: 1.2; }
</style>
'''

    # Novo HTML para os selos de segurança
    new_html_content = '''
      <div class="security-seals-title">Certificações e Segurança</div>
      <div class="security-seals-container">
        <a href="https://www.ssllabs.com/ssltest/analyze.html?d=itapolitanacajuru.com.br" target="_blank" rel="noopener noreferrer" title="Verificar Certificado SSL" class="security-seal-item">
          <div class="security-seal-content">
            <div class="security-seal-icon">🔒</div>
            <div class="security-seal-text">HTTPS<br>Seguro</div>
          </div>
        </a>
        <a href="https://www.ssllabs.com/ssltest/analyze.html?d=itapolitanacajuru.com.br" target="_blank" rel="noopener noreferrer" title="Certificado SSL Ativo" class="security-seal-item">
          <div class="security-seal-content">
            <div class="security-seal-icon">✅</div>
            <div class="security-seal-text">SSL<br>Certificado</div>
          </div>
        </a>
        <div class="security-seal-item" title="Seus dados estão protegidos com criptografia">
          <div class="security-seal-content">
            <div class="security-seal-icon">🛡️</div>
            <div class="security-seal-text">Dados<br>Protegidos</div>
          </div>
        </div>
        <div class="security-seal-item" title="Site otimizado para dispositivos móveis">
          <div class="security-seal-content">
            <div class="security-seal-icon">📱</div>
            <div class="security-seal-text">Mobile<br>Friendly</div>
          </div>
        </div>
        <div class="security-seal-item" title="Performance otimizada para carregamento rápido">
          <div class="security-seal-content">
            <div class="security-seal-icon">⚡</div>
            <div class="security-seal-text">Performance<br>Otimizada</div>
          </div>
        </div>
        <div class="security-seal-item" title="Otimizado para mecanismos de busca">
          <div class="security-seal-content">
            <div class="security-seal-icon">🌐</div>
            <div class="security-seal-text">SEO<br>Otimizado</div>
          </div>
        </div>
      </div>
'''

    # Encontrar o div que contém o texto "Certificações e Segurança"
    cert_title_div = soup.find('div', string='Certificações e Segurança')

    if cert_title_div:
        # O pai deste div é o container principal dos selos que precisa ser substituído
        old_seals_container = cert_title_div.find_parent('div', style=lambda value: value and 'background:linear-gradient' in value)
        
        if old_seals_container:
            # Criar um novo elemento div para substituir o antigo
            new_seals_soup = BeautifulSoup(new_html_content, 'html.parser')
            old_seals_container.clear()
            old_seals_container.append(new_seals_soup)

    # Adicionar o novo CSS ao head, se ainda não existir
    head = soup.find('head')
    if head and not soup.find('style', string=lambda text: text and '.security-seals-container' in text):
        head.append(BeautifulSoup(new_css, 'html.parser'))

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(str(soup))

# Lista de arquivos para processar
files_to_fix = [
    '/home/ubuntu/itapolitanacajuru/index.html',
    '/home/ubuntu/itapolitanacajuru/encomendas.html',
    '/home/ubuntu/itapolitanacajuru/dicas.html',
    '/home/ubuntu/itapolitanacajuru/promocao.html',
    '/home/ubuntu/itapolitanacajuru/admin-novo.html'
]

for file_path in files_to_fix:
    fix_seals_html(file_path)

print("Correção dos selos de segurança aplicada a todos os arquivos HTML.")
