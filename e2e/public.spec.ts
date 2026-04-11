import { test, expect } from './fixtures/axe'

// Viewports pour tests responsive (per D-12)
const viewports = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile', width: 375, height: 667 },
] as const

// --- 1. Page d'accueil — chargement et sections visibles ---

test.describe('Page d\'accueil', () => {
  test('affiche le hero, comment ca marche, et le catalogue', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Titre de la page
    await expect(page).toHaveTitle(/Mobel Unique/i)

    // Hero visible avec H1
    const heroHeading = page.getByRole('heading', { level: 1, name: /visualisez votre canap/i })
    await expect(heroHeading).toBeVisible()

    // Badge IA
    await expect(page.getByText('Visualisation par IA')).toBeVisible()

    // CTA hero
    await expect(page.getByRole('link', { name: /d.couvrir nos canap.s/i })).toBeVisible()

    // Section "Comment ca marche" visible
    const howItWorksHeading = page.getByRole('heading', { name: /comment .a marche/i })
    await expect(howItWorksHeading).toBeVisible()

    // 3 etapes
    await expect(page.getByText('Choisissez votre mod')).toBeVisible()
    await expect(page.getByText('Personnalisez avec votre tissu')).toBeVisible()
    await expect(page.getByText('Visualisez chez vous')).toBeVisible()

    // Section Catalogue visible (id="catalogue")
    const catalogueSection = page.locator('#catalogue')
    await expect(catalogueSection).toBeVisible()
  })
})

// --- 2. Catalogue — affichage produits et recherche ---

test.describe('Catalogue', () => {
  test('affiche les cartes produit et la recherche', async ({ page }) => {
    await page.goto('/')

    // Scroller jusqu'au catalogue
    const catalogueSection = page.locator('#catalogue')
    await catalogueSection.scrollIntoViewIfNeeded()

    // Heading "Nos Canapes"
    await expect(page.getByRole('heading', { name: /nos canap/i })).toBeVisible()

    // Champ de recherche
    const searchInput = page.getByLabel(/rechercher un canap/i)
    await expect(searchInput).toBeVisible()

    // Verifier les cartes produit (article elements)
    const productCards = page.locator('article')
    const cardCount = await productCards.count()

    if (cardCount > 0) {
      // Au moins une carte visible
      await expect(productCards.first()).toBeVisible()

      // Bouton CTA "Configurer ce modele" sur la premiere carte
      const ctaButton = page.getByRole('button', { name: /configurer/i }).first()
      await expect(ctaButton).toBeVisible()
    }

    // Si on a des produits, tester la recherche
    if (cardCount > 0) {
      const firstName = await productCards.first().locator('h3').textContent()
      if (firstName) {
        await searchInput.fill(firstName.slice(0, 3))
        // Le compteur de resultats devrait etre visible
        await expect(page.getByText(/canap/i)).toBeVisible()
      }
      // Tester la recherche sans resultat
      await searchInput.fill('zzz-inexistant-xyz')
      await expect(page.getByText(/aucun canap/i)).toBeVisible()

      // Bouton "Effacer la recherche"
      await expect(page.getByRole('button', { name: /effacer la recherche/i })).toBeVisible()
    }
  })
})

// --- 3. Configurateur — ouverture et navigation ---

test.describe('Configurateur modal', () => {
  test('ouvre le modal, affiche les swatches, et se ferme', async ({ page }) => {
    await page.goto('/')

    // Attendre le catalogue
    const catalogueSection = page.locator('#catalogue')
    await catalogueSection.scrollIntoViewIfNeeded()

    const ctaButtons = page.getByRole('button', { name: /configurer/i })
    const buttonCount = await ctaButtons.count()

    // Skip si pas de produits (DB vide)
    if (buttonCount === 0) {
      test.skip(true, 'Aucun produit dans la base — configurateur non testable')
      return
    }

    // Cliquer sur le premier CTA
    await ctaButtons.first().click()

    // Le dialog doit s'ouvrir
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Le titre du modele doit etre visible dans le modal
    const modalTitle = dialog.locator('#modal-title')
    await expect(modalTitle).toBeVisible()

    // Verifier la presence de swatches tissu OU message "aucun tissu"
    const swatchGrid = dialog.getByRole('radiogroup', { name: /choisissez votre tissu/i })
    const emptySwatches = dialog.getByText(/aucun tissu disponible/i)

    const hasSwatches = (await swatchGrid.count()) > 0
    const hasEmptyMessage = (await emptySwatches.count()) > 0

    // L'un des deux doit etre visible
    expect(hasSwatches || hasEmptyMessage).toBe(true)

    // Si des swatches existent, cliquer sur un
    if (hasSwatches) {
      const swatchButtons = dialog.getByRole('radio')
      const swatchCount = await swatchButtons.count()
      if (swatchCount > 0) {
        await swatchButtons.first().click()
        // Verifier que le swatch est selectionne (aria-checked)
        await expect(swatchButtons.first()).toHaveAttribute('aria-checked', 'true')
      }
    }

    // Fermer le dialog avec le bouton fermer
    const closeButton = dialog.getByRole('button', { name: /fermer/i })
    await closeButton.click()

    // Verifier que le dialog est ferme
    await expect(dialog).not.toBeVisible()
  })

  test('le modal se ferme avec la touche Escape', async ({ page }) => {
    await page.goto('/')

    const ctaButtons = page.getByRole('button', { name: /configurer/i })
    if ((await ctaButtons.count()) === 0) {
      test.skip(true, 'Aucun produit dans la base')
      return
    }

    await ctaButtons.first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Fermer avec Escape
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })
})

// --- 4. Simulation — upload et generation (mock IA) ---

test.describe('Simulation IA', () => {
  test('upload une photo et lance la simulation', async ({ page }) => {
    await page.goto('/')

    const ctaButtons = page.getByRole('button', { name: /configurer/i })
    if ((await ctaButtons.count()) === 0) {
      test.skip(true, 'Aucun produit dans la base — simulation non testable')
      return
    }

    // Ouvrir le configurateur
    await ctaButtons.first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Cliquer sur "Visualiser chez moi" pour passer a l'etape simulation
    const simulationCta = dialog.getByRole('button', { name: /visualiser chez moi/i })
    await simulationCta.click()

    // Zone d'upload doit etre visible
    await expect(dialog.getByText(/glissez votre photo/i)).toBeVisible()

    // Creer un fichier PNG 1x1 en memoire pour l'upload
    const fileInput = dialog.locator('input[type="file"]').first()

    // Buffer PNG 1x1 minimal
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      'base64'
    )

    await fileInput.setInputFiles({
      name: 'test-salon.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    })

    // Apres upload, l'apercu doit apparaitre et le bouton "Lancer la simulation"
    const launchButton = dialog.getByRole('button', { name: /lancer la simulation/i })
    await expect(launchButton).toBeVisible()

    // Lancer la simulation (Mock Sharp ~5ms)
    await launchButton.click()

    // Attendre le resultat — soit le texte "Votre simulation" soit l'image resultat
    const resultArea = dialog.getByText(/votre simulation/i)
    await expect(resultArea).toBeVisible({ timeout: 15_000 })

    // Verifier les boutons d'action (telecharger, partager)
    await expect(dialog.getByRole('button', { name: /t.l.charger/i }).first()).toBeVisible()

    // Bouton "Essayer une autre photo"
    await expect(dialog.getByRole('button', { name: /essayer une autre photo/i }).first()).toBeVisible()
  })
})

// --- 5. Erreur 404 ---

test.describe('Page 404', () => {
  test('affiche une erreur pour une route inexistante', async ({ page }) => {
    const response = await page.goto('/page-inexistante-xyz-404')
    // Next.js retourne un 404
    expect(response?.status()).toBe(404)
  })
})

// --- 6. Responsive — tests sur les deux viewports ---

test.describe('Responsive', () => {
  for (const viewport of viewports) {
    test(`${viewport.name} (${viewport.width}x${viewport.height}) — catalogue et header visibles`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      // Header visible
      const header = page.getByRole('banner')
      await expect(header).toBeVisible()

      // Logo visible
      await expect(page.getByAltText('Mobel Unique')).toBeVisible()

      // Catalogue visible apres scroll
      const catalogueSection = page.locator('#catalogue')
      await catalogueSection.scrollIntoViewIfNeeded()
      await expect(catalogueSection).toBeVisible()

      // Hero H1 visible
      await expect(page.getByRole('heading', { level: 1, name: /visualisez/i })).toBeVisible()
    })
  }
})

// --- 7. Accessibilite — audit WCAG ---

test.describe('Accessibilite WCAG', () => {
  test('page d\'accueil sans violation majeure', async ({ page, makeAxeBuilder }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const results = await makeAxeBuilder()
      // Exclure les faux positifs connus de framer-motion (aria-hidden sur elements animes)
      .disableRules(['aria-hidden-focus'])
      .analyze()

    // Accepter un seuil de 0 violations critiques/serieuses
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(
      criticalViolations,
      `${criticalViolations.length} violation(s) critique(s)/serieuse(s) trouvee(s): ${criticalViolations.map((v) => `${v.id}: ${v.description}`).join(', ')}`
    ).toHaveLength(0)
  })

  test('modal configurateur sans violation majeure', async ({ page, makeAxeBuilder }) => {
    await page.goto('/')

    const ctaButtons = page.getByRole('button', { name: /configurer/i })
    if ((await ctaButtons.count()) === 0) {
      test.skip(true, 'Aucun produit — audit modal non testable')
      return
    }

    await ctaButtons.first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await page.waitForLoadState('networkidle')

    const results = await makeAxeBuilder()
      .disableRules(['aria-hidden-focus'])
      .analyze()

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(
      criticalViolations,
      `${criticalViolations.length} violation(s) critique(s)/serieuse(s) dans le modal: ${criticalViolations.map((v) => `${v.id}: ${v.description}`).join(', ')}`
    ).toHaveLength(0)
  })
})
