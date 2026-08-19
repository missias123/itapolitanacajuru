const puppeteer = require('puppeteer');

const REQUIRED = [
  'mais de 1.400',
  'torta de sorvete',
  'inscrições já estão abertas',
  'janeiro de 2027',
  'itapolitanacajuru.com.br',
  '2027'
];
const STALE = [
  'Temos promoções semanais e mensais para clientes e seguidores.',
  'comente nos posts oficiais do Instagram e cadastre-se na aba Promoção do site.',
  'Caixa de 5L (2026) e à Torta de Sorvete (2027)'
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const checks = [];
  try {
    const promo = await browser.newPage();
    await promo.setViewport({ width: 360, height: 800, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    await promo.goto('http://127.0.0.1:4173/promocao.html', { waitUntil: 'networkidle0', timeout: 20000 });
    const promoText = await promo.evaluate(() => document.body.innerText);
    checks.push({ page: 'promocao.html', required: REQUIRED.map(text => ({ text, present: promoText.toLowerCase().includes(text.toLowerCase()) })), stale: STALE.filter(text => promoText.includes(text)) });

    const home = await browser.newPage();
    await home.setViewport({ width: 360, height: 800, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    await home.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(resolve => setTimeout(resolve, 700));
    const launcher = await home.$('#itabot-launcher');
    if (!launcher) throw new Error('Launcher do itaBot não encontrado');
    await launcher.click();
    await home.waitForSelector('.itabot-fullscreen-mode', { timeout: 5000 });
    const themeButton = await home.$('button.fale-tema-btn');
    if (!themeButton) throw new Error('Botão de Promoções e Sorteios não encontrado no itaBot');
    await themeButton.click();
    await home.waitForSelector('#fale-resposta-conteudo', { timeout: 5000 });
    const botText = await home.$eval('#fale-resposta-conteudo', el => el.innerText);
    checks.push({ page: 'itaBot', required: REQUIRED.map(text => ({ text, present: botText.toLowerCase().includes(text.toLowerCase()) })), stale: STALE.filter(text => botText.includes(text)) });

    const failed = checks.some(check => check.required.some(item => !item.present) || check.stale.length > 0);
    console.log(JSON.stringify({ passed: !failed, checks }, null, 2));
    process.exitCode = failed ? 1 : 0;
  } finally {
    await browser.close();
  }
})();
