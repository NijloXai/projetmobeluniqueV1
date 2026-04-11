export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      fabrics: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          is_premium: boolean
          name: string
          reference_image_url: string | null
          slug: string
          swatch_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_premium?: boolean
          name: string
          reference_image_url?: string | null
          slug: string
          swatch_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_premium?: boolean
          name?: string
          reference_image_url?: string | null
          slug?: string
          swatch_url?: string | null
        }
        Relationships: []
      }
      generated_visuals: {
        Row: {
          created_at: string
          fabric_id: string
          generated_image_url: string
          id: string
          is_published: boolean
          is_validated: boolean
          model_id: string
          model_image_id: string
        }
        Insert: {
          created_at?: string
          fabric_id: string
          generated_image_url: string
          id?: string
          is_published?: boolean
          is_validated?: boolean
          model_id: string
          model_image_id: string
        }
        Update: {
          created_at?: string
          fabric_id?: string
          generated_image_url?: string
          id?: string
          is_published?: boolean
          is_validated?: boolean
          model_id?: string
          model_image_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_visuals_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_visuals_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_visuals_model_image_id_fkey"
            columns: ["model_image_id"]
            isOneToOne: false
            referencedRelation: "model_images"
            referencedColumns: ["id"]
          },
        ]
      }
      model_images: {
        Row: {
          id: string
          image_url: string
          model_id: string
          sort_order: number
          view_type: string
        }
        Insert: {
          id?: string
          image_url: string
          model_id: string
          sort_order?: number
          view_type: string
        }
        Update: {
          id?: string
          image_url?: string
          model_id?: string
          sort_order?: number
          view_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_images_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          created_at: string
          description: string | null
          dimensions: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          shopify_url: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          shopify_url?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          shopify_url?: string | null
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Types utilitaires
export type Model = Database['public']['Tables']['models']['Row']
export type ModelInsert = Database['public']['Tables']['models']['Insert']
export type ModelUpdate = Database['public']['Tables']['models']['Update']

export type ModelImage = Database['public']['Tables']['model_images']['Row']
export type ModelImageInsert = Database['public']['Tables']['model_images']['Insert']
export type ModelImageUpdate = Database['public']['Tables']['model_images']['Update']

export type Fabric = Database['public']['Tables']['fabrics']['Row']
export type FabricInsert = Database['public']['Tables']['fabrics']['Insert']
export type FabricUpdate = Database['public']['Tables']['fabrics']['Update']

export type GeneratedVisual = Database['public']['Tables']['generated_visuals']['Row']
export type GeneratedVisualInsert = Database['public']['Tables']['generated_visuals']['Insert']

// Types enrichis (avec relations)
export type ModelWithImages = Model & {
  model_images: ModelImage[]
}

export type VisualWithFabricAndImage = GeneratedVisual & {
  fabric: Fabric
  model_image: ModelImage
}
