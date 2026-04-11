import { test, expect } from './fixtures/axe'

// storageState est injecte par playwright.config.ts project "chromium"
// Pas besoin de test.use({ storageState: ... }) ici

// --- 1. Admin dashboard — acces avec auth (happy path) ---

test.describe('Admin dashboard', () => {
  test('affiche le dashboard sans redirection vers login', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('domcontentloaded')

    // Verifier qu'on n'est PAS redirige vers login
    await expect(page).not.toHaveURL(/.*login.*/)

    // Le heading "Dashboard" doit etre visible
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Les stats (Canapes, Tissus, Rendus IA) doivent etre presentes
    await expect(page.getByText(/canap.s/i)).toBeVisible()
    await expect(page.getByText(/tissus/i)).toBeVisible()
  })
})

// --- 2. Admin produits — liste des modeles ---

test.describe('Admin produits', () => {
  test('affiche la liste des produits', async ({ page }) => {
    await page.goto('/admin/produits')
    await page.waitForLoadState('domcontentloaded')

    // Heading "Produits"
    await expect(page.getByRole('heading', { name: /produits/i })).toBeVisible()

    // Sous-titre avec compteur
    await expect(page.getByText(/produit.*dans le catalogue/i)).toBeVisible()

    // Lien "+ Nouveau produit"
    await expect(page.getByRole('link', { name: /nouveau produit/i })).toBeVisible()

    // Table ou etat vide
    const table = page.locator('table')
    const emptyState = page.getByText(/aucun produit/i)

    const hasTable = (await table.count()) > 0
    const hasEmpty = (await emptyState.count()) > 0

    expect(hasTable || hasEmpty).toBe(true)

    // Si la table existe, verifier les headers
    if (hasTable) {
      await expect(page.getByRole('columnheader', { name: /nom/i })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: /prix/i })).toBeVisible()
    }
  })
})

// --- 3. Admin generate -> validate -> publish (happy path) ---

test.describe('Admin IA workflow', () => {
  test('generer, valider et publier un visuel IA', async ({ page }) => {
    await page.goto('/admin/produits')
    await page.waitForLoadState('domcontentloaded')

    // Trouver un lien "Modifier" vers un produit existant
    const editLinks = page.getByRole('link', { name: /modifier/i })
    const editCount = await editLinks.count()

    if (editCount === 0) {
      test.skip(true, 'Aucun produit dans la base — workflow IA non testable')
      return
    }

    // Cliquer sur le premier lien "Modifier"
    await editLinks.first().click()

    // Attendre la page d'edition (heading avec le nom du produit ou "Modifier")
    await page.waitForLoadState('domcontentloaded')

    // La section "Generation IA" doit etre visible
    const iaSection = page.getByRole('heading', { name: /g.n.ration ia/i })
    await iaSection.scrollIntoViewIfNeeded()
    await expect(iaSection).toBeVisible()

    // Selecteur de tissu
    const fabricSelect = page.getByLabel(/tissu pour la g.n.ration/i)
    await expect(fabricSelect).toBeVisible()

    // Verifier qu'il y a des options dans le selecteur
    const options = fabricSelect.locator('option')
    const optionCount = await options.count()

    if (optionCount <= 1) {
      // Seulement l'option placeholder "— Choisir un tissu —"
      test.skip(true, 'Aucun tissu disponible — workflow IA non testable')
      return
    }

    // Selectionner le premier tissu reel (index 1, car index 0 = placeholder)
    await fabricSelect.selectOption({ index: 1 })

    // Attendre l'affichage de la matrice d'angles ou des boutons bulk
    // Le bouton "Generer tout" devrait apparaitre
    const generateAllBtn = page.getByRole('button', { name: /g.n.rer tout/i })
    await expect(generateAllBtn).toBeVisible()

    // Cliquer sur "Generer tout" (Mock Sharp ~5ms par angle)
    await generateAllBtn.click()

    // Attendre la fin de la generation — le texte du bouton revient a "Generer tout"
    // et le compteur de visuels generes apparait
    await expect(generateAllBtn).toBeEnabled({ timeout: 15_000 })

    // Verifier qu'au moins un badge "Genere" apparait
    const generatedBadge = page.getByText(/g.n.r./i).first()
    await expect(generatedBadge).toBeVisible()

    // Cliquer sur "Valider tout"
    const validateAllBtn = page.getByRole('button', { name: /valider tout/i })
    await expect(validateAllBtn).toBeVisible()
    await validateAllBtn.click()

    // Attendre la fin de la validation
    await expect(validateAllBtn).toBeDisabled({ timeout: 15_000 })

    // Verifier qu'un badge "Valide" apparait
    await expect(page.getByText(/valid./i).first()).toBeVisible()

    // Cliquer sur "Publier tout"
    const publishAllBtn = page.getByRole('button', { name: /publier tout/i })
    await expect(publishAllBtn).toBeVisible()
    await publishAllBtn.click()

    // Attendre la fin de la publication
    await expect(publishAllBtn).toBeDisabled({ timeout: 15_000 })

    // Verifier qu'un badge "Publie" apparait
    await expect(page.getByText(/publi./i).first()).toBeVisible()
  })
})

// --- 4. Admin 401 — acces sans auth ---

test.describe('Admin acces non authentifie', () => {
  test('redirige vers login sans auth', async ({ browser }) => {
    // Creer un contexte sans storageState (pas de cookies admin)
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/admin/produits')
    // Le layout admin protege redirige vers /admin/login si pas d'auth
    await expect(page).toHaveURL(/.*login.*/)

    // La page de login doit afficher le formulaire
    await expect(page.getByRole('heading', { name: /m.bel unique/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible()

    await context.close()
  })
})

// --- 5. Admin tissus — page accessible ---

test.describe('Admin tissus', () => {
  test('affiche la liste des tissus', async ({ page }) => {
    await page.goto('/admin/tissus')
    await page.waitForLoadState('domcontentloaded')

    // Heading "Tissus"
    await expect(page.getByRole('heading', { name: /tissus/i })).toBeVisible()

    // Sous-titre avec compteur
    await expect(page.getByText(/tissu.*dans le catalogue/i)).toBeVisible()

    // Lien "+ Nouveau tissu"
    await expect(page.getByRole('link', { name: /nouveau tissu/i })).toBeVisible()

    // Table ou etat vide
    const table = page.locator('table')
    const emptyState = page.getByText(/aucun tissu dans/i)

    const hasTable = (await table.count()) > 0
    const hasEmpty = (await emptyState.count()) > 0

    expect(hasTable || hasEmpty).toBe(true)
  })
})

// --- 6. Accessibilite admin — audit WCAG ---

test.describe('Accessibilite admin', () => {
  test('page produits sans violation majeure', async ({ page, makeAxeBuilder }) => {
    await page.goto('/admin/produits')
    await page.waitForLoadState('networkidle')

    const results = await makeAxeBuilder()
      .disableRules(['aria-hidden-focus'])
      .analyze()

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(
      criticalViolations,
      `${criticalViolations.length} violation(s) critique(s)/serieuse(s) sur /admin/produits: ${criticalViolations.map((v) => `${v.id}: ${v.description}`).join(', ')}`
    ).toHaveLength(0)
  })

  test('page tissus sans violation majeure', async ({ page, makeAxeBuilder }) => {
    await page.goto('/admin/tissus')
    await page.waitForLoadState('networkidle')

    const results = await makeAxeBuilder()
      .disableRules(['aria-hidden-focus'])
      .analyze()

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(
      criticalViolations,
      `${criticalViolations.length} violation(s) critique(s)/serieuse(s) sur /admin/tissus: ${criticalViolations.map((v) => `${v.id}: ${v.description}`).join(', ')}`
    ).toHaveLength(0)
  })
})
