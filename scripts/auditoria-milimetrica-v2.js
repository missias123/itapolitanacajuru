const http = require('http');
const handler = require('serve-handler');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PORT = 4175;
const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: path.join(__dirname, '..')
  });
});

server.listen(PORT, async () => {
  console.log(`Servidor v2 rodando em http://localhost:${PORT}`);
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

  let relatorio = `# Relatório de Auditoria Técnica Geral e Responsiva — Itapolitana Cajuru\n\n`;
  relatorio += `**Data**: ${new Date().toISOString()}\n\n`;

  for (const p of pages) {
    relatorio += `## Página: ${p.name}\n\n`;
    for (const vp of viewports) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
      try {
        await page.goto(`http://localhost:${PORT}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        
        const res = await page.evaluate(() => {
          const body = document.body;
          const html = document.documentElement;
          const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth, body.offsetWidth, html.offsetWidth);
          const clientWidth = html.clientWidth;
          const overflow = scrollWidth > clientWidth + 2;

          // Verificar botões e elementos interativos
          const buttons = Array.from(document.querySelectorAll('button, .btn, a.btn, input[type="button"], input[type="submit"]'));
          let smallButtons = 0;
          let textOverflows = 0;

          buttons.forEach(btn => {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              if (rect.height < 40 && vp.isMobile) smallButtons++;
              if (rect.right > clientWidth + 2) textOverflows++;
            }
          });

          return {
            scrollWidth,
            clientWidth,
            overflow,
            totalButtons: buttons.length,
            smallButtons,
            textOverflows
          };
        });

        relatorio += `- **Viewport**: ${vp.name}\n`;
        relatorio += `  - Largura Cliente: ${res.clientWidth}px | Largura Scroll: ${res.scrollWidth}px\n`;
        relatorio += `  - Overflow Lateral: ${res.overflow ? '⚠️ SIM' : '✅ NENHUM'}\n`;
        relatorio += `  - Botões Auditados: ${res.totalButtons} | Abaixo de 40px altura (Mobile): ${res.smallButtons} | Estouro lateral: ${res.textOverflows}\n\n`;

      } catch (e) {
        relatorio += `- **Viewport**: ${vp.name} - ❌ Erro ao carregar: ${e.message}\n\n`;
      } finally {
        await page.close();
      }
    }
  }

  fs.writeFileSync(path.join(__dirname, '../relatorios/auditoria-tecnica-geral-2026.md'), relatorio);
  console.log('Auditoria concluída e salva em relatorios/auditoria-tecnica-geral-2026.md');
  await browser.close();
  server.close();
});
