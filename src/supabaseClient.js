import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL || "https://rhpjlzqndxzpbodjvgcc.supabase.co"
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_Wg1U9Nzm7KfKEDH84rb2gw_kgV17kCr"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)