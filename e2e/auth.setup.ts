import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../playwright/.auth/admin.json')

setup('authenticate admin', async ({ page }) => {
  await page.goto('/admin/login')

  await page.getByLabel('Email').fill(
    process.env.TEST_ADMIN_EMAIL ?? 'admin@test.mobelunique.fr'
  )
  await page.getByLabel('Mot de passe').fill(
    process.env.TEST_ADMIN_PASSWORD ?? 'test-admin-secure-2024!'
  )
  await page.getByRole('button', { name: /se connecter/i }).click()

  // Attendre la redirection vers /admin (le layout admin protege)
  await page.waitForURL('**/admin/**', { timeout: 15_000 })

  // Verifier que la redirection a reussi
  await expect(page).not.toHaveURL('**/admin/login**')

  // Sauvegarder les cookies Supabase JWT pour les tests admin
  await page.context().storageState({ path: authFile })
})
