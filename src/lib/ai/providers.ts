/**
 * Chat model providers for the storefront assistant, tried in order.
 *
 * All three speak the OpenAI chat-completions format, so one client library
 * covers them; only the base URL, key and model differ.
 *
 * Env vars (server-only):
 *   GROQ_API_KEY      — https://console.groq.com/keys (free tier)
 *   GEMINI_API_KEY    — https://aistudio.google.com/apikey (free tier)
 *   OPENAI_API_KEY    — optional paid fallback
 *   GROQ_MODEL / GEMINI_MODEL / OPENAI_ASSISTANT_MODEL — override the defaults
 *   AI_PROVIDER_ORDER — e.g. "gemini,groq" (default "groq,gemini,openai")
 */
import OpenAI from 'openai'

export type ProviderName = 'groq' | 'gemini' | 'openai'

export interface ChatProvider {
  name: ProviderName
  client: OpenAI
  model: string
  /** Thinking models count reasoning against max_tokens, so keep it short. */
  reasoningEffort?: 'low'
}

function groq(): ChatProvider | null {
  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (!apiKey) return null
  const model = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b'
  return {
    name: 'groq',
    // maxRetries 0: on a 429 we'd rather fall through to the next provider
    // than sit in the SDK's backoff.
    client: new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1', maxRetries: 0, timeout: 15_000 }),
    model,
    reasoningEffort: model.startsWith('openai/gpt-oss') ? 'low' : undefined,
  }
}

function gemini(): ChatProvider | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) return null
  return {
    name: 'gemini',
    client: new OpenAI({
      apiKey,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      maxRetries: 0,
      timeout: 20_000,
    }),
    model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash',
    reasoningEffort: 'low',
  }
}

function openai(): ChatProvider | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return null
  return {
    name: 'openai',
    client: new OpenAI({ apiKey, maxRetries: 0, timeout: 20_000 }),
    model: process.env.OPENAI_ASSISTANT_MODEL?.trim() || 'gpt-4o-mini',
  }
}

const builders: Record<ProviderName, () => ChatProvider | null> = { groq, gemini, openai }

let cached: ChatProvider[] | null = null

export function getProviders(): ChatProvider[] {
  if (cached) return cached
  const order = (process.env.AI_PROVIDER_ORDER || 'groq,gemini,openai')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ProviderName => s in builders)
  cached = [...new Set(order)]
    .map((name) => builders[name]())
    .filter((p): p is ChatProvider => p !== null)
  return cached
}
