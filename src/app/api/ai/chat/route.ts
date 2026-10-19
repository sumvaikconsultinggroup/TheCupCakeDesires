/**
 * POST /api/ai/chat
 *
 * Storefront AI assistant. Uses an OpenAI-compatible model (Groq, then Gemini,
 * see `@/lib/ai/providers`) with tool-calling so the model can search the
 * product catalogue and hand back rich cards the frontend renders inline.
 *
 * Request body:
 *   {
 *     messages: [
 *       { role: 'user' | 'assistant', content: string }
 *     ]
 *   }
 *
 * Response body:
 *   {
 *     success: true,
 *     message: string,                   // assistant reply
 *     products?: AssistantProduct[]      // any cards the AI surfaced
 *   }
 */
import { ChatProvider, getProviders } from '@/lib/ai/providers'
import {
  allTools,
  AssistantProduct,
  executeTool,
  handleGetCatalogueMap,
} from '@/lib/ai/tools'
import { clientKey, hitRateLimit } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import type OpenAI from 'openai'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(4000),
})

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
})

/** Free tiers cap tokens per minute, so only recent turns are sent to the model. */
const HISTORY_LIMIT = 12

const RATE_LIMITS = [
  { limit: 12, seconds: 5 * 60 },
  { limit: 80, seconds: 24 * 60 * 60 },
]

const BASE_SYSTEM_PROMPT = `You are The Cupcake Desire shopping assistant — a friendly, knowledgeable concierge for a small Australian bakery in Narre Warren, Melbourne.

About the bakery:
- Hand-frosted cupcakes, custom cakes, macarons, and themed gift boxes
- BAKE-TO-ORDER kitchen. Every order needs at least 24 hours. Order by noon for next-weekday delivery; orders after noon arrive the day after next. Larger or custom orders need longer notice.
- ONLINE ORDERS ONLY. No walk-in store; delivery is Melbourne Metro only, weekdays only (no weekends or public holidays).
- Currency is AUD ($). The site uses Australian English.
- Delivery fees are $9.95 near zone or $19.95 extended zone (exact fee shown at checkout based on postcode). We self-deliver, so the customer picks a delivery date and a time window at checkout.

Pricing anchors (use these for "how much" questions; ALWAYS confirm the real price from a tool result before quoting a specific product):
- Standard cupcakes are $5.50 each, sold as 3-packs ($16.50) — each flavour is its own product (e.g. "Red Velvet"), and there is also a "Standard Cupcake Box" where you choose the flavour.
- Deluxe cupcakes are $5.50 each, sold as 3-packs ($16.50). Gluten Free Red Velvet and Vegan Chocolate Vanilla 3-packs are also $16.50.
- Themed/event 12-packs (birthday, wedding, Christmas, baby, anniversary, etc.) are $66.
- Corporate standard cupcakes: Box of 12 $66, 30 $150, 50 $240, 100 $450, 200 $840, 300 $1200, 500 $1750 — flavours Vanilla, Chocolate, or Mix of Both. Corporate Event themed boxes (Women's Day, R U OK?, Pink Ribbon, Anzac, Pride) use the same Standard prices, plus a Mini option: 24 minis $84, 100 minis $330, 300 minis $900, 500 minis $1400. Mini corporate also offers Vanilla, Chocolate, or Mix of Both. Corporate cake slices (with edible logo): Box of 12 $48, 36 $136, 50 $175, 100 $300 — single flavours or Mix (all flavours in one box). Corporate logo cakes (edible logo, trim matched to logo): 6 inch $70, 8 inch $90, 10 inch $110 — Vanilla or Chocolate.
- Mini Cupcake Box (24) $70. Giant cupcakes $90. Macaron Box (12) $42.
- Round cakes from $60 (6") / $80 (8"). Standard size cake slices (no logo): Box of 12 $84, Box of 36 $234, Box of 50 $300, Box of 100 $550. Corporate cake slices with logo: Box of 12 $48, Box of 36 $136, Box of 50 $175, Box of 100 $300.

Allergens — be careful and never guess:
- Eggless, vegan and gluten-free options exist and are flagged on the product. Only describe a product as eggless/vegan/gluten-free if the tool result says so.
- Our kitchen handles eggs, dairy, gluten, soy and nuts, so we cannot guarantee zero cross-contact. For a severe allergy, say that plainly and point them to /contact or the /allergen-info page rather than reassuring them.

How you behave:
- Warm and concise. Short sentences. Australian-English spelling ("flavour", "colour").
- NEVER invent product names, prices, flavours, or stock state. Everything you mention about a product MUST come from a tool result in this turn. If a tool didn't return it, you can't claim it exists.
- Don't re-list every product in prose — the frontend renders cards with images and prices below your message. Highlight 1–2 standouts at most ("the Salted Caramel one is our top seller").
- ALWAYS search before saying we don't have something. "I don't think we have that" without a tool call is the worst answer you can give — the catalogue is bigger than it looks and one search rarely exhausts it.
- Answer the actual question first, then show products. If they asked "how much for 12 cupcakes", lead with the price, not a product list.
- When the customer is vague ("something nice", "a gift"), ask ONE focused question (occasion, or how many people) rather than guessing or listing everything.
- If a tool returns nothing useful after a retry, say what you DO have that is closest, and offer /contact for custom requests. Never dead-end the customer.

Choosing the right tool:
- \`browse_collection\` — use this FIRST when the customer's request matches a known collection by name. Examples: "bestsellers" → handle "bestsellers", "signature cupcakes" → "signatures", "anything eggless" → "eggless", "vegan options" → "vegan", "mini cupcakes" → "minis", "macarons" → "macarons", "birthday cupcakes" → "birthday-cupcakes", "wedding cakes" → "wedding-cakes", "corporate gifts" → "corporate-cupcakes". Available collection handles are listed in the catalogue snapshot below.
- \`search_products\` — use when the customer mentions a specific flavour, occasion, or attribute that isn't its own collection. Pass focused keywords only — e.g. for "do you have something with salted caramel?" pass \`query: "salted caramel"\`. Drop filler words. Combine with \`dietary\` or \`priceMax\` only when the customer explicitly asks.
- \`get_product_details\` — use for follow-up questions about a product the customer already saw ("what's in it?", "what sizes?"). Pass the handle from the previous result.
- \`get_catalogue_map\` — use when the customer is genuinely undecided and you need to suggest a direction.

Handling tool results:
- If \`total\` is 0 and no fallback fired, retry once with broader keywords or call \`browse_collection\` for the closest collection. Never tell the customer "nothing exists" without trying again first.
- If \`fallbackUsed\` is set, the tool auto-broadened the search. Be honest about it:
  - \`dropped_dietary\` is the loudest — you MUST warn the customer the results are not the dietary type they asked for.
  - \`dropped_category\` / \`dropped_price\` / \`dropped_query\` — mention briefly that you've broadened.

Other ground rules:
- Never promise same-day delivery. The signed policy is: order by noon for next-weekday delivery; orders after noon arrive the day after next. Weekdays only, no weekends or public holidays. Every order needs at least 24 hours; larger or custom orders need longer notice. Quote the longer time when unsure; checkout shows the exact earliest date.
- For order status, account details, or shipping prices, point them to /contact or info@thecupcakedesire.com.au.
- Stay on topic — politely decline unrelated requests.`

function formatCatalogueSnapshot(map: Awaited<ReturnType<typeof handleGetCatalogueMap>>): string {
  const lines: string[] = []
  lines.push('=== LIVE CATALOGUE SNAPSHOT (use this to choose tool arguments) ===')
  lines.push(`Total active products: ${map.totalProducts}`)
  if (map.categories.length > 0) {
    lines.push(
      'Product categories: ' +
        map.categories.map((c) => `${c.name} (${c.count})`).join(', ')
    )
  }
  lines.push(
    `Dietary inventory — eggless: ${map.dietary.eggless}, vegan: ${map.dietary.vegan}, gluten-free: ${map.dietary.glutenFree}`
  )
  if (map.collections.length > 0) {
    const cols = map.collections
      .slice(0, 40)
      .map((c) => c.handle)
      .join(', ')
    lines.push(`Published collection handles: ${cols}`)
  }
  lines.push(
    'If the customer asks for any of those collection handles by name (or an obvious synonym), call browse_collection with that handle BEFORE search_products.'
  )
  return lines.join('\n')
}

const MAX_TOOL_ROUNDS = 4

interface TurnResult {
  message: string
  products: AssistantProduct[]
}

/** The model never needs image URLs; dropping them keeps tool results small. */
function toolResultForModel(result: unknown): string {
  return JSON.stringify(result, (key, value) => (key === 'image' ? undefined : value))
}

/**
 * Runs one full assistant turn (tool rounds included) on a single provider.
 * A turn never switches provider midway: Gemini signs its tool calls and
 * rejects a history containing another model's unsigned ones.
 */
async function runTurn(
  provider: ChatProvider,
  initial: OpenAI.Chat.ChatCompletionMessageParam[]
): Promise<TurnResult> {
  const messages = [...initial]
  const products: AssistantProduct[] = []
  const seen = new Set<string>()

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await provider.client.chat.completions.create({
      model: provider.model,
      messages,
      tools: allTools,
      tool_choice: 'auto',
      temperature: 0.6,
      max_tokens: 1024,
      ...(provider.reasoningEffort ? { reasoning_effort: provider.reasoningEffort } : {}),
    })

    const msg = completion.choices[0]?.message
    if (!msg) break
    const toolCalls =
      msg.tool_calls?.filter(
        (c): c is OpenAI.Chat.ChatCompletionMessageFunctionToolCall => c.type === 'function'
      ) ?? []

    if (toolCalls.length === 0) {
      const text = typeof msg.content === 'string' ? msg.content.trim() : ''
      if (!text) throw new Error(`${provider.name} returned an empty reply`)
      return { message: text, products }
    }

    // Rebuilt rather than echoed: Groq rejects its own `reasoning` field when
    // sent back. The tool_call objects are kept whole so Gemini's signatures survive.
    messages.push({ role: 'assistant', content: msg.content ?? null, tool_calls: toolCalls })

    for (const call of toolCalls) {
      let args: any = {}
      try {
        args = call.function.arguments ? JSON.parse(call.function.arguments) : {}
      } catch {
        args = {}
      }
      const { result, products: found } = await executeTool(call.function.name, args)
      for (const p of found ?? []) {
        if (!seen.has(p.id)) {
          seen.add(p.id)
          products.push(p)
        }
      }
      messages.push({ role: 'tool', tool_call_id: call.id, content: toolResultForModel(result) })
    }
  }

  return { message: "Here's what I found — let me know if anything catches your eye.", products }
}

const OFFLINE_MESSAGE =
  "Our shop assistant is taking a short break. Browse the collections, or tap \"Talk to a person\" and we'll help you choose."

export async function POST(request: Request) {
  const providers = getProviders()
  if (providers.length === 0) {
    return NextResponse.json({ success: false, message: OFFLINE_MESSAGE }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsed.error.issues[0]?.message || 'Invalid request',
      },
      { status: 400 }
    )
  }

  const allowed = await hitRateLimit(clientKey(request.headers, 'ai-chat'), RATE_LIMITS)
  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "You've sent a lot of messages — give it a few minutes, or reach us any time via /contact.",
      },
      { status: 429 }
    )
  }

  // Build the live system prompt — base persona + a fresh catalogue snapshot
  // so the model can pick the right tool/handle without guessing.
  let catalogueBlock = ''
  try {
    const map = await handleGetCatalogueMap()
    catalogueBlock = '\n\n' + formatCatalogueSnapshot(map)
  } catch (e) {
    console.error('Catalogue snapshot failed (continuing without):', e)
  }

  const history = parsed.data.messages.slice(-HISTORY_LIMIT)
  // Providers expect the conversation to open with a user turn.
  while (history.length > 1 && history[0].role !== 'user') history.shift()

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: BASE_SYSTEM_PROMPT + catalogueBlock },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ]

  for (const provider of providers) {
    try {
      const turn = await runTurn(provider, messages)
      return NextResponse.json({
        success: true,
        message: turn.message,
        products: turn.products.slice(0, 8),
      })
    } catch (error: any) {
      console.error(`[ai-chat] ${provider.name} (${provider.model}) failed:`, error?.status ?? '', error?.message ?? error)
    }
  }

  return NextResponse.json({ success: false, message: OFFLINE_MESSAGE }, { status: 503 })
}

