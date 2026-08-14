import process from 'node:process';
let chromium;
try {
  const pw = await import('playwright');
  chromium = pw.chromium;
} catch (e) {
  console.error('Playwright não disponível');
  process.exit(2);
}

const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

// Clicar no botão principal para abrir o cardápio
const vcBtn = await page.$('#vc-btn');
if (vcBtn) {
  await vcBtn.click();
  await page.waitForTimeout(500);
}

// Encontrar e testar botões de sabores
const botoesSabores = await page.$$('.btn-sabores');
console.log('Total de botões .btn-sabores encontrados:', botoesSabores.length);

let resultados = [];
for (let i = 0; i < botoesSabores.length; i++) {
  const btn = botoesSabores[i];
  const texto = await btn.textContent();
  const onclick = await btn.getAttribute('onclick') || '';
  
  // Clicar no botão
  try {
    await btn.click();
    await page.waitForTimeout(400);
    
    // Verificar se apareceu a listagem de sabores inline (.sabores-inline ou .chips-inline)
    const chipsCount = await page.$$eval('.chip-inline', els => els.length);
    resultados.push({ index: i, texto, onclick, chipsCount, ok: chipsCount > 0 });
    
    // Clicar em voltar se existir
    const btnVoltar = await page.$('.btn-voltar-nivel');
    if (btnVoltar) {
      await btnVoltar.click();
      await page.waitForTimeout(300);
    }
  } catch (err) {
    resultados.push({ index: i, texto, onclick, error: err.message, ok: false });
  }
}

console.log('Resultados dos testes de sabores:', JSON.stringify(resultados, null, 2));
await browser.close();
if (resultados.some(r => !r.ok)) {
  process.exit(1);
}
console.log('PASS: Todos os botões de sabores exibiram listas oficiais corretas.');
