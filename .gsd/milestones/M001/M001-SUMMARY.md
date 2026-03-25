# M001: Foundation — Summary

**Completed:** 2026-03-23

## What Was Built

Next.js 16.2.1 project initialized with TypeScript strict, App Router, Turbopack. Supabase fully configured: 4 tables (models, model_images, fabrics, generated_visuals) with FK, indexes, UNIQUE constraint. 8 RLS policies (public read filtered + admin write). 4 storage buckets (3 public, 1 private). 3 public API routes with slug fallback. Types generated from Supabase, Zod schemas, utility functions (slugify, pricing).

## Key Files

- `src/lib/supabase/client.ts` — Browser Supabase client
- `src/lib/supabase/server.ts` — Server Supabase client (cookies)
- `src/types/database.ts` — Generated TypeScript types + utility types
- `src/lib/schemas.ts` — Zod schemas (models, fabrics, visuals, input schemas)
- `src/lib/utils.ts` — slugify(), calculatePrice(), formatPrice()
- `src/app/api/models/route.ts` — GET /api/models
- `src/app/api/models/[slug]/route.ts` — GET /api/models/[slug] with fallback
- `src/app/api/models/[slug]/visuals/route.ts` — GET /api/models/[slug]/visuals
- `src/app/globals.css` — Design tokens (CSS variables)
- `src/app/layout.tsx` — Root layout (Montserrat, lang=fr)

## Patterns Established

- Supabase server client via `@supabase/ssr` with cookie handling
- Design tokens as CSS custom properties in globals.css
- Zod schemas in `src/lib/schemas.ts` shared between API validation and frontend
- API error responses in French with structured JSON
- Slug fallback pattern: 404 returns { error, fallback: true, catalogue }
