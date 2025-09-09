export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      application_documents: {
        Row: {
          ai_analysis: Json | null
          application_id: string | null
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          uploaded_at: string
        }
        Insert: {
          ai_analysis?: Json | null
          application_id?: string | null
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          ai_analysis?: Json | null
          application_id?: string | null
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "provider_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          session_id: string
          severity: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type: string
          metadata?: Json | null
          session_id: string
          severity?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          session_id?: string
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          session_name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      doctors: {
        Row: {
          admin_notes: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          bio: string | null
          consultation_fee: number | null
          created_at: string
          full_name: string
          id: string
          is_available: boolean | null
          license_number: string | null
          phone_number: string | null
          specialization: string
          updated_at: string
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          admin_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          full_name: string
          id?: string
          is_available?: boolean | null
          license_number?: string | null
          phone_number?: string | null
          specialization: string
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          admin_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          full_name?: string
          id?: string
          is_available?: boolean | null
          license_number?: string | null
          phone_number?: string | null
          specialization?: string
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      domains: {
        Row: {
          created_at: string
          description: string | null
          domain_name: string
          id: string
          is_active: boolean
          is_default: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain_name: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          domain_name?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          bio: string | null
          created_at: string
          full_name: string
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          license_number: string | null
          phone_number: string | null
          profile_image_url: string | null
          rating: number | null
          service_area: Json | null
          total_reviews: number | null
          updated_at: string
          user_id: string | null
          vehicle_model: string | null
          vehicle_type: string | null
          vehicle_year: number | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          created_at?: string
          full_name: string
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          license_number?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          rating?: number | null
          service_area?: Json | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string | null
          vehicle_model?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          license_number?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          rating?: number | null
          service_area?: Json | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string | null
          vehicle_model?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          user_name: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          user_name: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      image_analysis: {
        Row: {
          analysis_results: Json
          analysis_type: string
          confidence_score: number | null
          created_at: string
          detected_elements: string[] | null
          id: string
          object_detections: Json | null
          operation_id: string | null
          segmentation_masks: Json | null
        }
        Insert: {
          analysis_results?: Json
          analysis_type: string
          confidence_score?: number | null
          created_at?: string
          detected_elements?: string[] | null
          id?: string
          object_detections?: Json | null
          operation_id?: string | null
          segmentation_masks?: Json | null
        }
        Update: {
          analysis_results?: Json
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string
          detected_elements?: string[] | null
          id?: string
          object_detections?: Json | null
          operation_id?: string | null
          segmentation_masks?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "image_analysis_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "image_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      image_operations: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          operation_settings: Json | null
          operation_type: string
          original_image_url: string | null
          processed_image_url: string | null
          processing_time: number | null
          project_id: string | null
          prompt_text: string | null
          status: string
          translated_prompt: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          operation_settings?: Json | null
          operation_type: string
          original_image_url?: string | null
          processed_image_url?: string | null
          processing_time?: number | null
          project_id?: string | null
          prompt_text?: string | null
          status?: string
          translated_prompt?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          operation_settings?: Json | null
          operation_type?: string
          original_image_url?: string | null
          processed_image_url?: string | null
          processing_time?: number | null
          project_id?: string | null
          prompt_text?: string | null
          status?: string
          translated_prompt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_operations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "image_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      image_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          project_type: string
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          project_type: string
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          project_type?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      instagram_comment_replies: {
        Row: {
          comment_id: string
          created_at: string
          domain_name: string | null
          id: string
          post_id: string | null
          replied_at: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          domain_name?: string | null
          id?: string
          post_id?: string | null
          replied_at?: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          domain_name?: string | null
          id?: string
          post_id?: string | null
          replied_at?: string
        }
        Relationships: []
      }
      medical_consultations: {
        Row: {
          ai_diagnosis: string | null
          consultation_type: string | null
          created_at: string
          doctor_notes: string | null
          id: string
          patient_age: number | null
          patient_name: string
          scheduled_at: string | null
          status: string | null
          symptoms: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_diagnosis?: string | null
          consultation_type?: string | null
          created_at?: string
          doctor_notes?: string | null
          id?: string
          patient_age?: number | null
          patient_name: string
          scheduled_at?: string | null
          status?: string | null
          symptoms: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_diagnosis?: string | null
          consultation_type?: string | null
          created_at?: string
          doctor_notes?: string | null
          id?: string
          patient_age?: number | null
          patient_name?: string
          scheduled_at?: string | null
          status?: string | null
          symptoms?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      medical_service_requests: {
        Row: {
          accepted_at: string | null
          assigned_provider_id: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          diagnosis: string | null
          estimated_duration: number | null
          id: string
          notes: string | null
          patient_age: number | null
          patient_id: string | null
          patient_location: Json
          patient_name: string
          patient_phone: string
          payment_method: string | null
          payment_status: string | null
          preferred_time: string | null
          prescription: string | null
          provider_notes: string | null
          provider_type: string
          rating: number | null
          review_comment: string | null
          scheduled_at: string | null
          service_fee: number | null
          service_type: string
          started_at: string | null
          status: string | null
          symptoms: string | null
          total_amount: number | null
          transport_fee: number | null
          updated_at: string
          urgency_level: string | null
        }
        Insert: {
          accepted_at?: string | null
          assigned_provider_id?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          diagnosis?: string | null
          estimated_duration?: number | null
          id?: string
          notes?: string | null
          patient_age?: number | null
          patient_id?: string | null
          patient_location: Json
          patient_name: string
          patient_phone: string
          payment_method?: string | null
          payment_status?: string | null
          preferred_time?: string | null
          prescription?: string | null
          provider_notes?: string | null
          provider_type: string
          rating?: number | null
          review_comment?: string | null
          scheduled_at?: string | null
          service_fee?: number | null
          service_type: string
          started_at?: string | null
          status?: string | null
          symptoms?: string | null
          total_amount?: number | null
          transport_fee?: number | null
          updated_at?: string
          urgency_level?: string | null
        }
        Update: {
          accepted_at?: string | null
          assigned_provider_id?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          diagnosis?: string | null
          estimated_duration?: number | null
          id?: string
          notes?: string | null
          patient_age?: number | null
          patient_id?: string | null
          patient_location?: Json
          patient_name?: string
          patient_phone?: string
          payment_method?: string | null
          payment_status?: string | null
          preferred_time?: string | null
          prescription?: string | null
          provider_notes?: string | null
          provider_type?: string
          rating?: number | null
          review_comment?: string | null
          scheduled_at?: string | null
          service_fee?: number | null
          service_type?: string
          started_at?: string | null
          status?: string | null
          symptoms?: string | null
          total_amount?: number | null
          transport_fee?: number | null
          updated_at?: string
          urgency_level?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          notification_type: string
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          notification_type: string
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          notification_type?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      nurses: {
        Row: {
          admin_notes: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          bio: string | null
          created_at: string
          current_location: Json | null
          full_name: string
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          license_number: string | null
          phone_number: string | null
          profile_image_url: string | null
          rating: number | null
          service_radius: number | null
          specialization: string | null
          total_reviews: number | null
          updated_at: string
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          admin_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          created_at?: string
          current_location?: Json | null
          full_name: string
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          license_number?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          rating?: number | null
          service_radius?: number | null
          specialization?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          admin_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          created_at?: string
          current_location?: Json | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          license_number?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          rating?: number | null
          service_radius?: number | null
          specialization?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          created_at: string
          id: string
          modified_by_name: string | null
          modified_by_username: string | null
          order_id: string
          order_reference: string
          previous_status: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          modified_by_name?: string | null
          modified_by_username?: string | null
          order_id: string
          order_reference: string
          previous_status?: string | null
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          modified_by_name?: string | null
          modified_by_username?: string | null
          order_id?: string
          order_reference?: string
          previous_status?: string | null
          status?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          discount_amount: number | null
          discount_percentage: number | null
          full_address: string | null
          full_name: string
          id: string
          modified_by_name: string | null
          modified_by_username: string | null
          notes: string | null
          order_reference: string | null
          original_amount: number | null
          phone_number: string
          product_id: string
          product_price: string
          product_title: string
          promo_code: string | null
          province: string
          quantity: number
          shipping_cost: number | null
          status: string | null
          telegram_message_id: number | null
          telegram_sent: boolean | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          full_address?: string | null
          full_name: string
          id?: string
          modified_by_name?: string | null
          modified_by_username?: string | null
          notes?: string | null
          order_reference?: string | null
          original_amount?: number | null
          phone_number: string
          product_id: string
          product_price: string
          product_title: string
          promo_code?: string | null
          province: string
          quantity?: number
          shipping_cost?: number | null
          status?: string | null
          telegram_message_id?: number | null
          telegram_sent?: boolean | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          full_address?: string | null
          full_name?: string
          id?: string
          modified_by_name?: string | null
          modified_by_username?: string | null
          notes?: string | null
          order_reference?: string | null
          original_amount?: number | null
          phone_number?: string
          product_id?: string
          product_price?: string
          product_title?: string
          promo_code?: string | null
          province?: string
          quantity?: number
          shipping_cost?: number | null
          status?: string | null
          telegram_message_id?: number | null
          telegram_sent?: boolean | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          allergies: string | null
          blood_type: string | null
          created_at: string
          current_medications: string | null
          date_of_birth: string | null
          default_location: Json | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gender: string | null
          id: string
          insurance_info: Json | null
          medical_history: string | null
          phone_number: string | null
          profile_image_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          allergies?: string | null
          blood_type?: string | null
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          default_location?: Json | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          gender?: string | null
          id?: string
          insurance_info?: Json | null
          medical_history?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          allergies?: string | null
          blood_type?: string | null
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          default_location?: Json | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          insurance_info?: Json | null
          medical_history?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pending_edits: {
        Row: {
          chat_id: number
          created_at: string | null
          edit_message_id: number | null
          field: string
          field_name: string
          id: string
          order_id: string
          order_reference: string
          original_message_id: number | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          chat_id: number
          created_at?: string | null
          edit_message_id?: number | null
          field: string
          field_name: string
          id?: string
          order_id: string
          order_reference: string
          original_message_id?: number | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          chat_id?: number
          created_at?: string | null
          edit_message_id?: number | null
          field?: string
          field_name?: string
          id?: string
          order_id?: string
          order_reference?: string
          original_message_id?: number | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "pending_edits_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active_ingredients: Json | null
          brand: string | null
          category: string | null
          contraindications: string | null
          created_at: string
          description: string | null
          dosage: string | null
          flavor: string | null
          form: string | null
          gallery_images: Json | null
          health_benefits: Json | null
          health_category: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          indications: string | null
          key_benefits: string | null
          long_description: string | null
          main_image_url: string | null
          name: string | null
          nutrient_amounts: Json | null
          nutrients: Json | null
          price: string | null
          product_url: string | null
          scraped_at: string
          seo_keywords: Json | null
          short_description: string | null
          source_url: string | null
          stock: number | null
          sub_category: string | null
          tags: Json | null
          target_age_range: string | null
          target_audience: string | null
          target_gender: string | null
          target_symptoms: Json | null
          title: string
          updated_at: string
          user_id: string
          videos: Json | null
          warnings: string | null
        }
        Insert: {
          active_ingredients?: Json | null
          brand?: string | null
          category?: string | null
          contraindications?: string | null
          created_at?: string
          description?: string | null
          dosage?: string | null
          flavor?: string | null
          form?: string | null
          gallery_images?: Json | null
          health_benefits?: Json | null
          health_category?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          indications?: string | null
          key_benefits?: string | null
          long_description?: string | null
          main_image_url?: string | null
          name?: string | null
          nutrient_amounts?: Json | null
          nutrients?: Json | null
          price?: string | null
          product_url?: string | null
          scraped_at?: string
          seo_keywords?: Json | null
          short_description?: string | null
          source_url?: string | null
          stock?: number | null
          sub_category?: string | null
          tags?: Json | null
          target_age_range?: string | null
          target_audience?: string | null
          target_gender?: string | null
          target_symptoms?: Json | null
          title: string
          updated_at?: string
          user_id: string
          videos?: Json | null
          warnings?: string | null
        }
        Update: {
          active_ingredients?: Json | null
          brand?: string | null
          category?: string | null
          contraindications?: string | null
          created_at?: string
          description?: string | null
          dosage?: string | null
          flavor?: string | null
          form?: string | null
          gallery_images?: Json | null
          health_benefits?: Json | null
          health_category?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          indications?: string | null
          key_benefits?: string | null
          long_description?: string | null
          main_image_url?: string | null
          name?: string | null
          nutrient_amounts?: Json | null
          nutrients?: Json | null
          price?: string | null
          product_url?: string | null
          scraped_at?: string
          seo_keywords?: Json | null
          short_description?: string | null
          source_url?: string | null
          stock?: number | null
          sub_category?: string | null
          tags?: Json | null
          target_age_range?: string | null
          target_audience?: string | null
          target_gender?: string | null
          target_symptoms?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
          videos?: Json | null
          warnings?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          current_users: number
          discount_percentage: number
          expires_at: string
          featured_product_id: string | null
          id: string
          is_active: boolean
          max_users: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_users?: number
          discount_percentage: number
          expires_at: string
          featured_product_id?: string | null
          id?: string
          is_active?: boolean
          max_users?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_users?: number
          discount_percentage?: number
          expires_at?: string
          featured_product_id?: string | null
          id?: string
          is_active?: boolean
          max_users?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_featured_product_id_fkey"
            columns: ["featured_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_products: {
        Row: {
          created_at: string
          id: string
          product_id: string
          promo_code_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          promo_code_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          promo_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_promo_products_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_promo_products_promo_code"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_applications: {
        Row: {
          admin_notes: string | null
          ai_summary: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          license_number: string | null
          phone_number: string
          provider_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          specialization: string | null
          status: string | null
          updated_at: string
          user_id: string | null
          vehicle_info: Json | null
          years_experience: number | null
        }
        Insert: {
          admin_notes?: string | null
          ai_summary?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          license_number?: string | null
          phone_number: string
          provider_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialization?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_info?: Json | null
          years_experience?: number | null
        }
        Update: {
          admin_notes?: string | null
          ai_summary?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          license_number?: string | null
          phone_number?: string
          provider_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialization?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_info?: Json | null
          years_experience?: number | null
        }
        Relationships: []
      }
      provider_earnings: {
        Row: {
          amount: number
          commission_rate: number | null
          earned_at: string
          id: string
          net_amount: number
          paid_at: string | null
          payment_status: string | null
          provider_id: string
          provider_type: string
          service_request_id: string | null
        }
        Insert: {
          amount: number
          commission_rate?: number | null
          earned_at?: string
          id?: string
          net_amount: number
          paid_at?: string | null
          payment_status?: string | null
          provider_id: string
          provider_type: string
          service_request_id?: string | null
        }
        Update: {
          amount?: number
          commission_rate?: number | null
          earned_at?: string
          id?: string
          net_amount?: number
          paid_at?: string | null
          payment_status?: string | null
          provider_id?: string
          provider_type?: string
          service_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_earnings_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "medical_service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_locations: {
        Row: {
          current_location: Json
          id: string
          is_busy: boolean | null
          is_online: boolean | null
          last_update: string
          provider_id: string
          provider_type: string
        }
        Insert: {
          current_location: Json
          id?: string
          is_busy?: boolean | null
          is_online?: boolean | null
          last_update?: string
          provider_id: string
          provider_type: string
        }
        Update: {
          current_location?: Json
          id?: string
          is_busy?: boolean | null
          is_online?: boolean | null
          last_update?: string
          provider_id?: string
          provider_type?: string
        }
        Relationships: []
      }
      request_messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string | null
          request_id: string | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          request_id?: string | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          request_id?: string | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "medical_service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping: {
        Row: {
          assigned_to: string | null
          confirmed_by_name: string | null
          confirmed_by_username: string | null
          created_at: string
          id: string
          order_id: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          confirmed_by_name?: string | null
          confirmed_by_username?: string | null
          created_at?: string
          id?: string
          order_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          confirmed_by_name?: string | null
          confirmed_by_username?: string | null
          created_at?: string
          id?: string
          order_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_brands: {
        Row: {
          category: string | null
          country: string | null
          created_at: string
          description: string | null
          display_order: number | null
          founded_year: number | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          category?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          founded_year?: number | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          category?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          founded_year?: number | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      user_image_preferences: {
        Row: {
          auto_translate: boolean | null
          created_at: string
          default_image_style: string | null
          id: string
          preferred_language: string | null
          quality_settings: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auto_translate?: boolean | null
          created_at?: string
          default_image_style?: string | null
          id?: string
          preferred_language?: string | null
          quality_settings?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auto_translate?: boolean | null
          created_at?: string
          default_image_style?: string | null
          id?: string
          preferred_language?: string | null
          quality_settings?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          instagram_url: string
          is_active: boolean
          likes: number
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          instagram_url: string
          is_active?: boolean
          likes?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          instagram_url?: string
          is_active?: boolean
          likes?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_settings: {
        Row: {
          created_at: string
          description: string | null
          domain_id: string | null
          id: string
          is_active: boolean
          setting_key: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain_id?: string | null
          id?: string
          is_active?: boolean
          setting_key: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          domain_id?: string | null
          id?: string
          is_active?: boolean
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_settings_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_provider_earnings: {
        Args: {
          p_period?: string
          p_provider_id: string
          p_provider_type: string
        }
        Returns: {
          paid_amount: number
          pending_amount: number
          total_earnings: number
          total_services: number
        }[]
      }
      cleanup_old_pending_edits: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_image_project: {
        Args: {
          p_description?: string
          p_project_type?: string
          p_title: string
        }
        Returns: string
      }
      generate_order_reference: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_working_image_editor_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      log_image_operation: {
        Args: {
          p_operation_settings?: Json
          p_operation_type: string
          p_original_image_url?: string
          p_project_id: string
          p_prompt_text?: string
        }
        Returns: string
      }
      save_image_analysis: {
        Args: {
          p_analysis_results: Json
          p_analysis_type: string
          p_confidence_score?: number
          p_detected_elements?: string[]
          p_operation_id: string
        }
        Returns: string
      }
      update_operation_status: {
        Args: {
          p_error_message?: string
          p_operation_id: string
          p_processed_image_url?: string
          p_status: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
