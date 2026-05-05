import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
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
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    // Ignorar erros de HTTPS em ambiente local
    ignoreHTTPSErrors: true,
    // Aceitar cookies por padrão para não bloquear testes
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
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
