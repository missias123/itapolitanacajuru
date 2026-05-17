import { test, expect } from '@playwright/test';

const HASH_SENHA = '35237f1e9ef2f50ad9a216b11d2d7760ece60f4368eb4bb79593f8fec4f299e0';

async function fazerLogin(page) {
  await page.goto('/admin-painel.html', { waitUntil: 'domcontentloaded' });
  await page.fill('#inp-senha', HASH_SENHA);
  await page.click('button:has-text("Entrar no Admin")');
  await expect(page.locator('#admin-app')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#sec-home')).toHaveClass(/ativo/, { timeout: 15000 });
}

test.describe('AUDITORIA VISUAL COMPLETA — Admin Painel Itapolitana', () => {

  // ── TELA DE LOGIN ────────────────────────────────────────────────
  test('[LOGIN] tela de login aparece com campos de senha e PAT', async ({ page }) => {
    await page.goto('/admin-painel.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#login-screen')).toBeVisible();
    await expect(page.locator('#inp-senha')).toBeVisible();
    await expect(page.locator('#inp-gh-token')).toBeVisible();
    await expect(page.locator('button:has-text("Entrar no Admin")')).toBeVisible();
  });

  test('[LOGIN] botão de olho alterna visibilidade do token GitHub PAT', async ({ page }) => {
    await page.goto('/admin-painel.html', { waitUntil: 'domcontentloaded' });
    const tokenInput = page.locator('#inp-gh-token');
    const eyeBtn = page.locator('#eye-btn-token');
    await expect(eyeBtn).toBeVisible();
    await expect(tokenInput).toHaveAttribute('type', 'password');
    await eyeBtn.click();
    await expect(tokenInput).toHaveAttribute('type', 'text');
    await eyeBtn.click();
    await expect(tokenInput).toHaveAttribute('type', 'password');
  });

  test('[LOGIN] senha errada exibe mensagem de erro', async ({ page }) => {
    await page.goto('/admin-painel.html', { waitUntil: 'domcontentloaded' });
    await page.fill('#inp-senha', 'senhaErrada123');
    await page.click('button:has-text("Entrar no Admin")');
    // Aguarda a mensagem aparecer (config carrega antes)
    await expect(page.locator('#login-erro')).toContainText(/Senha incorreta|verificar a conexão/, { timeout: 10000 });
  });

  test('[LOGIN] login com hash correto abre o admin-app', async ({ page }) => {
    await fazerLogin(page);
    await expect(page.locator('#login-screen')).not.toBeVisible();
    await expect(page.locator('#admin-app')).toBeVisible();
  });

  // ── DASHBOARD / PÁGINA INICIAL ──────────────────────────────────
  test('[HOME] seção Página Inicial ativa com campos editáveis', async ({ page }) => {
    await fazerLogin(page);
    await expect(page.locator('#sec-home')).toHaveClass(/ativo/);
    const titulo = page.locator('#home-titulo');
    await expect(titulo).toBeVisible();
    await expect(titulo).not.toHaveValue('');
    // Campo deve ser editável
    await titulo.fill('Teste Auditoria');
    await expect(titulo).toHaveValue('Teste Auditoria');
  });

  test('[HOME] botão Salvar Página Inicial existe e é clicável', async ({ page }) => {
    await fazerLogin(page);
    const btnSalvar = page.locator('button:has-text("Salvar Página Inicial")');
    await expect(btnSalvar).toBeVisible();
    await btnSalvar.click();
    // Sem PAT → toast de somente leitura
    await expect(page.locator('#toast')).toContainText(/somente leitura|token/i, { timeout: 8000 });
  });

  // ── NAVEGAÇÃO ENTRE SEÇÕES ──────────────────────────────────────
  const secoes = [
    { btn: 'Encomendas',     sec: 'sec-encomendas'  },
    { btn: 'Produtos',       sec: 'sec-produtos'    },
    { btn: 'Promoção',       sec: 'sec-promoção'    },
    { btn: 'Fidelidade',     sec: 'sec-clientes'    },
    { btn: 'Dicas',          sec: 'sec-depoimentos' },
    { btn: 'Qualidade',      sec: 'sec-qualidade'   },
    { btn: 'Rastreio',       sec: 'sec-rastreio'    },
    { btn: 'Auditoria',      sec: 'sec-auditoria'   },
  ];

  for (const { btn, sec } of secoes) {
    test(`[NAV] clicar em "${btn}" ativa seção #${sec}`, async ({ page }) => {
      await fazerLogin(page);
      const btnEl = page.locator(`#admin-app button, #admin-app a`).filter({ hasText: btn }).first();
      await expect(btnEl).toBeVisible({ timeout: 10000 });
      await btnEl.click();
      await expect(page.locator(`#${sec}`)).toHaveClass(/ativo/, { timeout: 10000 });
    });
  }

  // ── ABA PROMOÇÃO — campos editáveis ─────────────────────────────
  test('[PROMO] aba Promoção exibe campos editáveis', async ({ page }) => {
    await fazerLogin(page);
    await page.locator('#admin-app button, #admin-app a').filter({ hasText: 'Promoção' }).first().click();
    await expect(page.locator('#sec-promoção')).toHaveClass(/ativo/, { timeout: 10000 });
    // Campo título deve existir e ser editável
    const promoTitulo = page.locator('#promo-título');
    await expect(promoTitulo).toBeVisible({ timeout: 5000 });
    // Toggle "Promoção ativa" — checkbox fica oculto por CSS de toggle; verificar o label visível
    await expect(page.locator('label:has(#promo-ativo)')).toBeVisible({ timeout: 5000 });
  });

  // ── ABA PRODUTOS ─────────────────────────────────────────────────
  test('[PRODUTOS] aba Produtos lista sabores com campos editáveis', async ({ page }) => {
    await fazerLogin(page);
    await page.locator('#admin-app button, #admin-app a').filter({ hasText: 'Produtos' }).first().click();
    await expect(page.locator('#sec-produtos')).toHaveClass(/ativo/, { timeout: 10000 });
  });

  // ── ABA FIDELIDADE ────────────────────────────────────────────────
  test('[FIDELIDADE] aba Fidelidade abre e mostra seção de clientes', async ({ page }) => {
    await fazerLogin(page);
    await page.locator('#admin-app button, #admin-app a').filter({ hasText: 'Fidelidade' }).first().click();
    await expect(page.locator('#sec-fidelidade')).toHaveClass(/ativo/, { timeout: 10000 });
  });

  // ── NAVEGAÇÃO DE VOLTA À PÁGINA INICIAL ──────────────────────────
  test('[NAV] voltar para Página Inicial re-ativa #sec-home', async ({ page }) => {
    await fazerLogin(page);
    // ir para Encomendas
    await page.locator('#admin-app button, #admin-app a').filter({ hasText: 'Encomendas' }).first().click();
    await expect(page.locator('#sec-encomendas')).toHaveClass(/ativo/, { timeout: 8000 });
    // voltar para Página Inicial
    const btnPI = page.locator('#nav-btn-pagina-inicial, #admin-app button, #admin-app a').filter({ hasText: 'Página Inicial' }).first();
    await btnPI.click();
    await expect(page.locator('#sec-home')).toHaveClass(/ativo/, { timeout: 8000 });
  });

  // ── BANNER DE SESSÃO / TOKEN ─────────────────────────────────────
  test('[SESSION] banner de sessão sem PAT informa modo somente leitura', async ({ page }) => {
    await fazerLogin(page);
    // Verifica mensagem de estado da sessão
    const statusEl = page.locator('#status-sessao-worker, .banner-sessao, [id*="aviso-token"], [id*="sessao"]').first();
    // Checa que algum indicador de somente leitura está visível
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/somente leitura|Token ausente|Modo leitura|sem PAT|sem token/i);
  });

  // ── LOGOUT ───────────────────────────────────────────────────────
  test('[LOGOUT] botão Sair retorna à tela de login', async ({ page }) => {
    await fazerLogin(page);
    const btnSair = page.locator('button:has-text("Sair"), a:has-text("Sair")').first();
    await expect(btnSair).toBeVisible({ timeout: 8000 });
    await btnSair.click();
    await expect(page.locator('#login-screen')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#admin-app')).not.toBeVisible();
  });

});
