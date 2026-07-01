import { createClient } from '@supabase/supabase-js'

// Sustituye estos textos por tus datos reales, sin espacios, ni corchetes
const supabaseUrl = "https://uhaqnvcwrnchjpoijoer.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoYXFudmN3cm5jaGpwb2lqb2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTkzMTEsImV4cCI6MjA5ODQ5NTMxMX0.Jn7PWWtJmFVLCcLqC4lDb8bo1MJ99lLmdSQDiHbiEnE"

console.log("DEBUG: URL forzada en archivo:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey)