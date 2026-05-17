import { test, expect } from '@playwright/test';

test('visual audit - admin after login', async ({ page }) => {
  const errors = [];
  page.on('console', msg => { if(msg.type()==='error') errors.push(msg.text()); });
  
  await page.goto('/admin-painel.html', { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: '/tmp/admin-01-login.png', fullPage: false });
  
  // Check eye button for PAT token
  const eyeToken = await page.locator('#eye-btn-token').isVisible();
  console.log('Eye button for token visible:', eyeToken);
  
  // Fill password hash
  await page.fill('#inp-senha', '35237f1e9ef2f50ad9a216b11d2d7760ece60f4368eb4bb79593f8fec4f299e0');
  await page.screenshot({ path: '/tmp/admin-02-senha.png', fullPage: false });
  
  // Click login
  await page.click('button:has-text("Entrar no Admin")');
  
  // Wait for admin-app
  await expect(page.locator('#admin-app')).toBeVisible({ timeout: 20000 });
  await page.screenshot({ path: '/tmp/admin-03-pos-login.png', fullPage: true });
  
  // Check what's active
  const activeSection = await page.evaluate(() => {
    const sections = document.querySelectorAll('.seção');
    const active = [];
    sections.forEach(s => { if(s.classList.contains('ativo')) active.push(s.id); });
    return active;
  });
  console.log('Active sections after login:', activeSection);
  console.log('Console errors:', errors);
  
  // Wait for data load
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/admin-04-carregado.png', fullPage: true });
  
  // Check home section content
  const homeTitle = await page.locator('#home-titulo').inputValue().catch(() => '(not found)');
  console.log('Home title value:', homeTitle);
  
  expect(activeSection.length).toBeGreaterThan(0);
});
