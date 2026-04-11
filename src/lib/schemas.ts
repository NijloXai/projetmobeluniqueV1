import { z } from 'zod'

// === Schemas de base ===

export const modelSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  price: z.number().positive(),
  dimensions: z.string().nullable(),
  shopify_url: z.string().url().nullable().or(z.literal('')).nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
})

export const modelImageSchema = z.object({
  id: z.string().uuid(),
  model_id: z.string().uuid(),
  image_url: z.string().url(),
  view_type: z.string().min(1),
  sort_order: z.number().int().min(0),
})

export const fabricSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().nullable(),
  is_premium: z.boolean(),
  swatch_url: z.string().nullable(),
  reference_image_url: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
})

export const generatedVisualSchema = z.object({
  id: z.string().uuid(),
  model_id: z.string().uuid(),
  model_image_id: z.string().uuid(),
  fabric_id: z.string().uuid(),
  generated_image_url: z.string().url(),
  is_validated: z.boolean(),
  is_published: z.boolean(),
  created_at: z.string(),
})

// === Schemas enrichis ===

export const modelWithImagesSchema = modelSchema.extend({
  model_images: z.array(modelImageSchema),
})

export const visualWithFabricSchema = generatedVisualSchema.extend({
  fabric: fabricSchema,
})

// === Schemas d'input (création / modification) ===

export const createModelSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  slug: z.string().min(1, 'Le slug est requis'),
  description: z.string().optional().nullable(),
  price: z.number().positive('Le prix doit être positif'),
  dimensions: z.string().optional().nullable(),
  shopify_url: z.string().url('URL Shopify invalide').optional().nullable().or(z.literal('')),
  is_active: z.boolean().optional(),
})

export const updateModelSchema = createModelSchema.partial()

export const createFabricSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  slug: z.string().min(1, 'Le slug est requis'),
  category: z.string().optional().nullable(),
  is_premium: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

export const updateFabricSchema = createFabricSchema.partial()

// === Types inférés ===

export type ModelInput = z.infer<typeof createModelSchema>
export type ModelUpdateInput = z.infer<typeof updateModelSchema>
export type FabricInput = z.infer<typeof createFabricSchema>
export type FabricUpdateInput = z.infer<typeof updateFabricSchema>
