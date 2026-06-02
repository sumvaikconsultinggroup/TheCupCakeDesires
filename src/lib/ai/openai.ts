/**
 * OpenAI client singleton.
 *
 * Required env var:
 *   OPENAI_API_KEY  — sk-... (server-only)
 *
 * Returns `null` if the key isn't set so API routes can serve a clear
 * 503 instead of crashing.
 */
import OpenAI from 'openai'

const API_KEY = process.env.OPENAI_API_KEY

export const openai: OpenAI | null = API_KEY
  ? new OpenAI({
      apiKey: API_KEY,
    })
  : null

export function isOpenAIConfigured(): boolean {
  return Boolean(API_KEY)
}

export function requireOpenAI(): OpenAI {
  if (!openai) {
    throw new Error('OpenAI is not configured. Set OPENAI_API_KEY in .env.local.')
  }
  return openai
}

/** Model to use for the storefront assistant. Fast + cheap, good at tool use. */
export const ASSISTANT_MODEL = process.env.OPENAI_ASSISTANT_MODEL || 'gpt-4o-mini'
