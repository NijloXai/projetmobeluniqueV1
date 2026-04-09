/**
 * audit-code.ts — Analyse statique ciblée pour Möbel Unique
 *
 * Usage: npx tsx scripts/audit-code.ts
 *
 * Produit un JSON stdout avec les findings pour consolidation en AUDIT.md.
 * Analyse statique uniquement — aucun appel réseau, aucune modification de fichiers.
 *
 * Catégories : Securite, Performance, TypeScript, CSS, Config
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { glob } from 'tinyglobby'

// ─── Interface Finding ──────────────────────────────────────────────────────

interface Finding {
  severity: 'Critical' | 'Warning' | 'Info'
  category: 'Securite' | 'Performance' | 'DeadCode' | 'TypeScript' | 'CSS' | 'Config'
  file: string
  line: number
  description: string
  suggestion: string
}

const results: Finding[] = []

function finding(
  severity: Finding['severity'],
  category: Finding['category'],
  file: string,
  line: number,
  description: string,
  suggestion: string,
) {
  results.push({ severity, category, file, line, description, suggestion })
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function readLines(filePath: string): string[] {
  try {
    return readFileSync(resolve(process.cwd(), filePath), 'utf8').split('\n')
  } catch {
    return []
  }
}

function readFile(filePath: string): string {
  try {
    return readFileSync(resolve(process.cwd(), filePath), 'utf8')
  } catch {
    return ''
  }
}

// ─── 1. SECURITE — Routes admin sans requireAdmin() ─────────────────────────

async function checkRequireAdmin() {
  const adminRoutes = await glob('src/app/api/admin/**/route.ts', {
    cwd: process.cwd(),
  })

  for (const file of adminRoutes) {
    const content = readFile(file)
    const hasRequireAdmin = content.includes('requireAdmin()') || content.includes('requireAdmin(')

    if (!hasRequireAdmin) {
      finding(
        'Critical',
        'Securite',
        file,
        1,
        `Route admin sans requireAdmin() : ${file}`,
        "Ajouter const auth = await requireAdmin() en debut de chaque handler. Retourner NextResponse.json({ error: '...' }, { status: 401 }) si auth echoue.",
      )
    }
  }
}

// ─── 2. SECURITE — Routes API sans validation Zod ──────────────────────────

async function checkZodValidation() {
  const allRoutes = await glob('src/app/api/**/route.ts', { cwd: process.cwd() })

  for (const file of allRoutes) {
    const lines = readLines(file)
    const content = lines.join('\n')

    // Verifier si la route a un handler POST, PUT ou PATCH
    const hasPostPutPatch = /export async function (POST|PUT|PATCH)/.test(content)
    if (!hasPostPutPatch) continue

    // Verifier la presence de validation Zod
    const hasZodValidation =
      content.includes('.parse(') ||
      content.includes('.safeParse(') ||
      content.includes('schema') ||
      content.includes('Schema')

    if (!hasZodValidation) {
      // Trouver la premiere ligne du handler POST/PUT/PATCH
      const handlerLineIdx = lines.findIndex((l) =>
        /export async function (POST|PUT|PATCH)/.test(l),
      )
      finding(
        'Warning',
        'Securite',
        file,
        handlerLineIdx + 1,
        `Route POST/PUT/PATCH sans validation Zod visible : ${file}`,
        'Ajouter schema.parse(body) ou schema.safeParse(body) avant toute utilisation des donnees utilisateur.',
      )
    }
  }
}

// ─── 3. SECURITE — Security headers dans next.config.ts ────────────────────

async function checkSecurityHeaders() {
  const configContent = readFile('next.config.ts')

  if (!configContent) {
    finding(
      'Warning',
      'Config',
      'next.config.ts',
      1,
      'next.config.ts introuvable',
      'Verifier la configuration Next.js',
    )
    return
  }

  const configLines = configContent.split('\n')

  // Verifier la presence de la fonction headers()
  if (!configContent.includes('headers')) {
    finding(
      'Warning',
      'Securite',
      'next.config.ts',
      1,
      "Security headers absents : la fonction async headers() n'est pas configuree dans next.config.ts",
      "Ajouter headers() dans next.config.ts avec X-Frame-Options, X-Content-Type-Options, Referrer-Policy et Content-Security-Policy.",
    )
    return
  }

  // Verifier les headers individuels
  const requiredHeaders = [
    {
      name: 'X-Frame-Options',
      severity: 'Warning' as const,
      description: "Header X-Frame-Options absent — protection clickjacking manquante",
      suggestion: "Ajouter { key: 'X-Frame-Options', value: 'DENY' } dans les headers Next.js",
    },
    {
      name: 'X-Content-Type-Options',
      severity: 'Warning' as const,
      description: "Header X-Content-Type-Options absent — protection MIME sniffing manquante",
      suggestion: "Ajouter { key: 'X-Content-Type-Options', value: 'nosniff' }",
    },
    {
      name: 'Referrer-Policy',
      severity: 'Info' as const,
      description: 'Header Referrer-Policy absent',
      suggestion: "Ajouter { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }",
    },
    {
      name: 'Content-Security-Policy',
      severity: 'Info' as const,
      description: "Header Content-Security-Policy absent — protection XSS renforcee manquante",
      suggestion:
        "Ajouter une CSP restrictive. Exemple minimal : default-src 'self'; script-src 'self' 'unsafe-inline' (affiner pour prod)",
    },
  ]

  for (const header of requiredHeaders) {
    if (!configContent.includes(header.name)) {
      const lineIdx = configLines.findIndex((l) => l.includes('headers'))
      finding(header.severity, 'Securite', 'next.config.ts', lineIdx + 1, header.description, header.suggestion)
    }
  }
}

// ─── 4. SECURITE — Inline styles avec potentiel XSS ────────────────────────

async function checkInlineStyles() {
  const tsxFiles = await glob('src/**/*.tsx', { cwd: process.cwd() })

  for (const file of tsxFiles) {
    const lines = readLines(file)

    lines.forEach((line, i) => {
      // Detecter style={{ ... }}
      if (!line.includes('style={{')) return

      // Detecter si une variable (non-literal) est utilisee
      // Pattern : style={{ someVar }} ou style={{ width: variable }} ou style={{ [computed]: value }}
      // Valeurs literales : chaines entre guillemets, nombres, mots-cles CSS connus
      const stylePart = line.slice(line.indexOf('style={{'))

      // Detecter les variables dynamiques : identifiers sans guillemets autour de la valeur
      // Exclure les patterns comme { objectFit: 'cover' } (literales)
      const hasDynamicValue = /style=\{\{[^}]*:\s*[a-zA-Z_$][a-zA-Z0-9_$]*(?:\s*[,}])/.test(stylePart) &&
        !/style=\{\{[^}]*:\s*['"`]/.test(stylePart.substring(0, 50))

      if (hasDynamicValue) {
        finding(
          'Warning',
          'CSS',
          file,
          i + 1,
          `Inline style avec valeur potentiellement dynamique : ${stylePart.substring(0, 80).trim()}`,
          "Preferer les classes CSS Modules. Si inline style requis, s'assurer que la valeur est sanitisee.",
        )
      } else {
        finding(
          'Info',
          'CSS',
          file,
          i + 1,
          `Inline style avec valeur literale (pattern style={{}}) : ${stylePart.substring(0, 80).trim()}`,
          'Considerer un utilitaire CSS Module ou une variable CSS custom pour respecter la convention du projet.',
        )
      }
    })
  }
}

// ─── 5. PERFORMANCE — await dans boucle (potentiel N+1) ────────────────────

async function checkAwaitInLoop() {
  const tsFiles = await glob('src/**/*.{ts,tsx}', { cwd: process.cwd() })

  for (const file of tsFiles) {
    const lines = readLines(file)

    lines.forEach((line, i) => {
      // Detecter une boucle
      const isLoop = /for\s*\(|for\(|\.forEach\s*\(|\.map\s*\(/.test(line)
      if (!isLoop) return

      // Verifier les 5 lignes suivantes pour un await supabase ou fetch
      const nextLines = lines.slice(i + 1, i + 6)
      const hasAwaitInLoop = nextLines.some((nl) =>
        /await\s+(supabase|fetch|getIAService|service\.)/.test(nl),
      )

      if (hasAwaitInLoop) {
        finding(
          'Warning',
          'Performance',
          file,
          i + 1,
          `Potentiel N+1 : await dans boucle (${line.trim().substring(0, 60)})`,
          "Remplacer par une requete unique avec .in() ou Promise.all() pour les appels paralleles.",
        )
      }
    })
  }
}

// ─── 6. PERFORMANCE — console.log en production ────────────────────────────

async function checkConsoleLogs() {
  const srcFiles = await glob('src/**/*.{ts,tsx}', { cwd: process.cwd() })

  for (const file of srcFiles) {
    const lines = readLines(file)

    lines.forEach((line, i) => {
      // console.log uniquement — console.error et console.warn sont OK (pattern etabli)
      if (/console\.log\s*\(/.test(line)) {
        finding(
          'Info',
          'Performance',
          file,
          i + 1,
          `console.log en production : ${line.trim().substring(0, 80)}`,
          "Remplacer par console.error() pour les erreurs ou supprimer pour les logs de debug.",
        )
      }
    })
  }
}

// ─── 7. TYPESCRIPT — catch sans typage ─────────────────────────────────────

async function checkCatchTyping() {
  const srcFiles = await glob('src/**/*.{ts,tsx}', { cwd: process.cwd() })

  for (const file of srcFiles) {
    const lines = readLines(file)

    lines.forEach((line, i) => {
      // Detecter catch (err) ou catch (error) ou catch (e)
      const catchMatch = /catch\s*\(\s*(err|error|e|ex|exception)\s*\)/.exec(line)
      if (!catchMatch) return

      // Verifier les 3 lignes suivantes pour instanceof Error ou as Error
      const nextLines = lines.slice(i + 1, i + 4)
      const hasErrorTyping = nextLines.some(
        (nl) =>
          nl.includes('instanceof Error') ||
          nl.includes('as Error') ||
          nl.includes('instanceof') ||
          nl.includes('String('),
      )

      if (!hasErrorTyping) {
        finding(
          'Info',
          'TypeScript',
          file,
          i + 1,
          `catch sans typage explicite : ${line.trim().substring(0, 80)}`,
          "Ajouter un type guard : if (err instanceof Error) { ... } ou utiliser String(err) pour le message.",
        )
      }
    })
  }
}

// ─── 8. TYPESCRIPT — Handlers de route async sans try/catch ────────────────

async function checkRouteHandlerTryCatch() {
  const routeFiles = await glob('src/app/api/**/route.ts', { cwd: process.cwd() })

  for (const file of routeFiles) {
    const lines = readLines(file)

    // Detecter chaque handler de route
    lines.forEach((line, i) => {
      const handlerMatch = /export async function (GET|POST|PUT|PATCH|DELETE)/.exec(line)
      if (!handlerMatch) return

      // Chercher le try/catch dans les 10 lignes suivantes (corps du handler)
      const bodyLines = lines.slice(i + 1, i + 10)
      const hasTryCatch = bodyLines.some((bl) => bl.includes('try {') || bl.includes('try{'))

      if (!hasTryCatch) {
        finding(
          'Warning',
          'TypeScript',
          file,
          i + 1,
          `Handler ${handlerMatch[1]} sans try/catch visible dans les 10 premieres lignes : ${file}`,
          "Encapsuler le corps du handler dans try/catch pour eviter les 500 generiques non loggues.",
        )
      }
    })
  }
}

// ─── 9. CSS — Occurrences de style={{}} dans les composants ────────────────
// (couvert par checkInlineStyles avec severity Info)

// ─── 10. CONFIG — next.config.ts remotePatterns trop large ─────────────────

async function checkRemotePatterns() {
  const configContent = readFile('next.config.ts')
  if (!configContent) return

  const configLines = configContent.split('\n')

  // Verifier si remotePatterns utilise hostname: '**' (trop permissif)
  if (configContent.includes("hostname: '**'") || configContent.includes('hostname: "**"')) {
    const lineIdx = configLines.findIndex(
      (l) => l.includes("hostname: '**'") || l.includes('hostname: "**"'),
    )
    finding(
      'Warning',
      'Config',
      'next.config.ts',
      lineIdx + 1,
      "remotePatterns trop permissif : hostname: '**' accepte n'importe quel domaine",
      "Restreindre a '**.supabase.co' ou plus specifique pour eviter le proxy d'images arbitraires.",
    )
  }

  // Verifier si pas de remotePatterns du tout (images non securisees)
  if (!configContent.includes('remotePatterns') && configContent.includes('images')) {
    finding(
      'Warning',
      'Config',
      'next.config.ts',
      1,
      'images configurees sans remotePatterns — toutes les origines sont acceptees',
      'Ajouter remotePatterns avec des regles specifiques pour limiter les origines autorisees.',
    )
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  await checkRequireAdmin()
  await checkZodValidation()
  await checkSecurityHeaders()
  await checkInlineStyles()
  await checkAwaitInLoop()
  await checkConsoleLogs()
  await checkCatchTyping()
  await checkRouteHandlerTryCatch()
  await checkRemotePatterns()

  // Output JSON sur stdout
  console.log(JSON.stringify(results, null, 2))

  // Resume sur stderr
  const criticals = results.filter((r) => r.severity === 'Critical').length
  const warnings = results.filter((r) => r.severity === 'Warning').length
  const infos = results.filter((r) => r.severity === 'Info').length
  console.error(`\nAudit termine: ${criticals} Critical, ${warnings} Warning, ${infos} Info`)

  process.exit(criticals > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Erreur audit-code:', err)
  process.exit(2)
})
