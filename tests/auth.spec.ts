import { test, expect } from '@playwright/test';

test.describe('Autenticación y Control de Acceso', () => {
  
  test('Inicio de sesión de Administrador exitoso', async ({ page }) => {
    // 1. Navegar al portal de administradores
    await page.goto('/#/admin/login');

    // 2. Esperar a que cargue la interfaz
    await expect(page.locator('text=Portal Administrativo')).toBeVisible();

    // 3. Llenar credenciales
    await page.fill('input[type="email"]', 'workspace_admin@buropanama.com');
    await page.fill('input[type="password"]', 'buro211431*');

    // 4. Hacer clic en "VERIFICAR IDENTIDAD"
    await page.click('button:has-text("VERIFICAR IDENTIDAD")');

    // 5. Verificar que entra al SplashScreen o directamente al Admin Dashboard
    // El SplashScreen redirige luego a /#/admin
    // Playwright esperará a que la URL cambie y el elemento sea visible.
    await expect(page).toHaveURL(/.*#\/admin/);
    
    // 6. Verificar que el header del dashboard dice 'dashboard' o muestra el menú de admin.
    await expect(page.locator('h1.text-xl.font-bold')).toContainText('dashboard', { ignoreCase: true });
  });

  test('Protección de rutas: Redirección al intentar entrar a /admin sin sesión', async ({ page }) => {
    // 1. Navegar directamente al admin dashboard
    await page.goto('/#/admin');

    // 2. Como no hay sesión activa, el AdminRoute debe interceptarlo
    // y mandarlo de vuelta a /#/admin/login
    await expect(page).toHaveURL(/.*#\/admin\/login/);

    // 3. Confirmar que estamos en la pantalla de login
    await expect(page.locator('text=Portal Administrativo')).toBeVisible();
  });

});
