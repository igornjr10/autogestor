import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('📱 Abrindo http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Aguarda carregamento da página
  await page.waitForSelector('body', { timeout: 5000 });

  // Tira screenshot do login
  await page.screenshot({ path: 'screenshot-login.png' });
  console.log('✅ Screenshot login: screenshot-login.png');

  // Verifica se há elementos Lucide (SVG com data-testid ou class específica)
  const hasLucideIcons = await page.evaluate(() => {
    // Lucide icons têm SVG inline
    const svgs = document.querySelectorAll('svg[aria-hidden="true"], svg[role="img"]');
    return svgs.length > 0;
  });
  console.log(`✅ Ícones Lucide encontrados: ${hasLucideIcons ? 'SIM' : 'NÃO (esperado na página com login)'}`);

  // Faz login (usando credenciais padrão do dev)
  console.log('\n📝 Fazendo login...');
  await page.fill('input[type="email"]', 'admin@gestao.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Aguarda redirecionamento
  await page.waitForURL(/\/(veiculos|dashboard)/, { timeout: 10000 }).catch(() => {
    console.warn('⚠️ Login pode ter falhado ou credenciais incorretas');
  });

  await page.waitForSelector('header', { timeout: 5000 }).catch(() => {
    console.log('❌ Header não encontrado após login');
  });

  // Verifica header
  console.log('\n🔍 Verificando header...');
  const header = await page.locator('header').first();
  if (header) {
    // Tira screenshot do header
    const headerBox = await header.boundingBox();
    if (headerBox) {
      await page.screenshot({
        path: 'screenshot-header.png',
        clip: headerBox
      });
      console.log('✅ Screenshot header: screenshot-header.png');
    }

    // Verifica estrutura do header
    const navLinks = await page.locator('header a[href^="/"]').count();
    console.log(`✅ Links de navegação encontrados: ${navLinks}`);

    // Verifica avatar (div com iniciais)
    const hasAvatar = await page.evaluate(() => {
      const divs = document.querySelectorAll('header div');
      for (let div of divs) {
        const style = window.getComputedStyle(div);
        if (style.borderRadius && style.backgroundColor && style.width === '32px') {
          return true;
        }
      }
      return false;
    });
    console.log(`✅ Avatar com iniciais: ${hasAvatar ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);

    // Verifica ícones (Sun/Moon para dark mode)
    const hasThemeToggle = await page.locator('header button svg').count();
    console.log(`✅ Ícones de tema (Sun/Moon): ${hasThemeToggle > 0 ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
  }

  // Navega para Estoque
  console.log('\n🔍 Navegando para Estoque (Veículos)...');
  await page.click('a:has-text("Estoque")');
  await page.waitForSelector('table', { timeout: 5000 }).catch(() => {
    console.log('⚠️ Tabela não carregada, esperando...');
  });
  await page.waitForTimeout(2000);

  // Screenshot da página de Estoque
  await page.screenshot({ path: 'screenshot-estoque.png' });
  console.log('✅ Screenshot Estoque: screenshot-estoque.png');

  // Verifica tabela e thead
  const hasTable = await page.locator('table').count();
  console.log(`✅ Tabela encontrada: ${hasTable > 0 ? 'SIM' : 'NÃO'}`);

  const tableHead = await page.locator('thead').first();
  const headText = await tableHead.textContent().catch(() => '');
  console.log(`✅ Header da tabela contém: ${headText.slice(0, 50)}...`);

  // Verifica Search icon nos filtros
  const hasSearchIcon = await page.evaluate(() => {
    const svgs = document.querySelectorAll('svg');
    for (let svg of svgs) {
      if (svg.parentElement?.classList.contains('pointer-events-none')) {
        return true;
      }
    }
    return false;
  });
  console.log(`✅ Ícone de busca nos filtros: ${hasSearchIcon ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);

  // Verifica badges
  const badges = await page.locator('[class*="badge"]').count();
  console.log(`✅ Badges de situação: ${badges > 0 ? 'ENCONTRADO' : 'NÃO ENCONTRADO'} (${badges} elementos)`);

  // Navega para Clientes
  console.log('\n🔍 Navegando para Clientes...');
  await page.click('a:has-text("Clientes")');
  await page.waitForSelector('table', { timeout: 5000 }).catch(() => {
    console.log('⚠️ Tabela de clientes não carregada');
  });
  await page.waitForTimeout(1500);

  // Screenshot de Clientes
  await page.screenshot({ path: 'screenshot-clientes.png' });
  console.log('✅ Screenshot Clientes: screenshot-clientes.png');

  // Verifica avatares dos clientes
  const clientAvatars = await page.evaluate(() => {
    const divs = document.querySelectorAll('table div[class*="bg-brand"]');
    return divs.length;
  });
  console.log(`✅ Avatares dos clientes: ${clientAvatars > 0 ? `ENCONTRADOS (${clientAvatars})` : 'NÃO ENCONTRADOS'}`);

  // Testa dark mode toggle
  console.log('\n🔍 Testando dark mode toggle...');
  const themeButton = await page.locator('header button:has(svg)').nth(0);
  if (themeButton) {
    await themeButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot-darkmode.png' });
    console.log('✅ Screenshot modo escuro: screenshot-darkmode.png');

    // Verifica se o tema escuro foi aplicado
    const isDarkMode = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    console.log(`✅ Dark mode ativado: ${isDarkMode ? 'SIM' : 'NÃO'}`);
  }

  // Verifica tipografia Inter
  console.log('\n🔍 Verificando tipografia e cores...');
  const hasInterFont = await page.evaluate(() => {
    const styles = window.getComputedStyle(document.body);
    const fontFamily = styles.fontFamily;
    return fontFamily.includes('Inter');
  });
  console.log(`✅ Tipografia Inter carregada: ${hasInterFont ? 'SIM' : 'NÃO (pode estar falhando de fonts.googleapis.com)'}`);

  // Verifica cores indigo/slate
  const hasIndigo = await page.evaluate(() => {
    const elements = document.querySelectorAll('[class*="brand"], [class*="indigo"], [class*="slate"]');
    return elements.length > 0;
  });
  console.log(`✅ Classes de cor indigo/slate encontradas: ${hasIndigo ? 'SIM' : 'NÃO'}`);

  console.log('\n✅ Verificação completa!');
  console.log('📁 Screenshots salvos no diretório frontend/');

  await browser.close();
}

verify().catch(err => {
  console.error('❌ Erro durante verificação:', err.message);
  process.exit(1);
});
