import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'child_process';

// Detecta executável do Chrome/Chromium disponível no sistema.
// Permite override via variável de ambiente PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
function detectChrome() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  for (const bin of ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    try { execSync(`test -x ${bin}`); return bin; } catch { /* continua */ }
  }
  return undefined;
}

const systemChrome = detectChrome();
const chromeLaunch = systemChrome
  ? { launchOptions: { executablePath: systemChrome } }
  : { channel: 'chromium' };

export default defineConfig({
  testDir: './e2e',
  timeout: 50_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../docs/relatorios/playwright-html', open: 'never' }],
    ['json', { outputFile: '../docs/relatorios/playwright-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'off',
    // Ignorar erros de HTTPS em ambiente local
    ignoreHTTPSErrors: true,
    // Aceitar cookies por padrão para não bloquear testes
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    ...chromeLaunch,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  // Servidor local para servir os arquivos estáticos
  webServer: {
    command: 'npx --yes serve .. --listen 8080 --no-clipboard',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});

