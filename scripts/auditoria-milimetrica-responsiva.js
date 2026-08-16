const http = require('http');
const handler = require('serve-handler');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PORT = 4174;
const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: path.join(__dirname, '..')
  });
});

server.listen(PORT, async () => {
  console.log(`Servidor de auditoria rodando em http://localhost:${PORT}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const pages = [
    { name: 'index.html', path: '/index.html' },
    { name: 'encomendas.html', path: '/encomendas.html' },
    { name: 'dicas.html', path: '/dicas.html' },
    { name: 'galeria.html', path: '/galeria.html' },
    { name: 'promocao.html', path: '/promocao.html' },
    { name: 'admin-painel.html', path: '/admin-painel.html' }
  ];

  const viewports = [
    { name: 'Android Compact (360x800)', width: 360, height: 800, isMobile: true },
    { name: 'iPhone / App (390x844)', width: 390, height: 844, isMobile: true },
    { name: 'Tablet (768x1024)', width: 768, height: 1024, isMobile: false },
    { name: 'Desktop (1280x800)', width: 1280, height: 800, isMobile: false }
  ];

  let relatorioGeral = `# Laudo de Auditoria Milimétrica Responsiva — Itapolitana Cajuru\n\n`;
  relatorioGeral += `**Data**: ${new Date().toISOString()}\n\n`;

  for (const pageInfo of pages) {
    relatorioGeral += `## Página: ${pageInfo.name}\n\n`;
    for (const vp of viewports) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
      
      try {
        await page.goto(`http://localhost:${PORT}${pageInfo.path}`, { waitUntil: 'networkidle2', timeout: 15000 });
      } catch (e) {
        console.log(`Erro ao carregar ${pageInfo.path} em ${vp.name}: ${e.message}`);
        await page.close();
        continue;
      }

      // Executar medições milimétricas no DOM
      const metricas = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        
        const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth, body.offsetWidth, html.offsetWidth, body.clientWidth, html.clientWidth);
        const clientWidth = html.clientWidth;
        const hasHorizontalOverflow = scrollWidth > clientWidth + 1;

        // Inspecionar todos os elementos visíveis
        const allElements = Array.from(document.querySelectorAll('body *'));
        let elementosFora = 0;
        let botoesPequenos = 0;
        let textosCortados = 0;
        const detalhes = [];

        allElements.forEach((el, idx) => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

          // Verificar overflow lateral de elementos
          if (rect.right > clientWidth + 2 && rect.width > 0) {
            elementosFora++;
            if (elementosFora <= 5) {
              detalhes.push(`Overflow lateral: <${el.tagName.toLowerCase()} class="${el.className}" id="${el.id}"> right=${Math.round(rect.right)}px vs viewport=${clientWidth}px`);
            }
          }

          // Verificar tamanho mínimo de toque para botões em mobile (min 44px)
          if ((el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button') && (vpWidth => vpWidth <= 768)(window.innerWidth)) {
            if (rect.height > 0 && rect.height < 36 || rect.width > 0 && rect.width < 36) {
              botoesPequenos++;
              if (botoesPequenos <= 5) {
                detalhes.push(`Alvo de toque pequeno (<36px): <${el.tagName.toLowerCase()} class="${el.className}"> h=${Math.round(rect.height)}w=${Math.round(rect.width)}`);
              }
            }
          }
        });

        return {
          scrollWidth,
          clientWidth,
          hasHorizontalOverflow,
          elementosFora,
          botoesPequenos,
          detalhes: detalhes.slice(0, 10)
        };
      }, vp.width);

      relatorioGeral += `### Viewport: ${vp.name}\n`;
      relatorioGeral += `- **Largura do Viewport**: ${vp.width}px\n`;
      relatorioGeral += `- **Largura Total Renderizada (scrollWidth)**: ${metricas.scrollWidth}px\n`;
      relatorioGeral += `- **Overflow Horizontal**: ${metricas.hasHorizontalOverflow ? '❌ SIM (Ajuste Necessário)' : '✅ NENHUM (Perfeito)'}\n`;
      relatorioGeral += `- **Elementos Ultrapassando a Lateral**: ${metricas.elementosFora}\n`;
      relatorioGeral += `- **Botões com Toque Reduzido (<36px)**: ${metricas.botoesPequenos}\n`;
      
      if (metricas.detalhes.length > 0) {
        relatorioGeral += `#### Ocorrências Registradas:\n`;
        metricas.detalhes.forEach(d => {
          relatorioGeral += `  - ${d}\n`;
        });
      }
      relatorioGeral += `\n`;

      await page.close();
    }
  }

  await browser.close();
  server.close();

  const relPath = path.join(__dirname, '..', 'relatorios', 'auditoria-milimetrica-resultado.md');
  fs.mkdirSync(path.dirname(relPath), { recursive: true });
  fs.writeFileSync(relPath, relatorioGeral, 'utf-8');
  console.log(`Auditoria concluída! Relatório salvo em ${relPath}`);
});
