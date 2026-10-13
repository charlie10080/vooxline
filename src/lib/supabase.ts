import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Cliente de Supabase, o null si faltan las variables de entorno.
 * Con null la app sigue 100% en localStorage: ningún store debe asumir que existe.
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

/** Dónde vive cada dominio. Se migra uno a uno (Fases A–E); los que no estén encendidos siguen locales */
export type RemoteDomain = 'identity' | 'workforce' | 'client'

// Se encienden por .env, sin tocar código: VITE_REMOTE_DOMAINS=identity,workforce
const REMOTE_DOMAINS = ((import.meta.env.VITE_REMOTE_DOMAINS as string | undefined) ?? '')
  .split(',')
  .map((d) => d.trim())

export const isRemote = (domain: RemoteDomain): boolean => supabase !== null && REMOTE_DOMAINS.includes(domain)
