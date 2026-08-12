/**
 * POST /api/ai/chat
 *
 * Storefront AI assistant. Uses OpenAI with tool-calling so the model can
 * search the product catalogue and hand back rich cards the frontend renders
 * inline in the chat.
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
import { ASSISTANT_MODEL, isOpenAIConfigured, requireOpenAI } from '@/lib/ai/openai'
import {
  allTools,
  AssistantProduct,
  executeTool,
  handleGetCatalogueMap,
} from '@/lib/ai/tools'
import { NextResponse } from 'next/server'
import type OpenAI from 'openai'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
})

const BASE_SYSTEM_PROMPT = `You are the Cupcake Desire shopping assistant — a friendly, knowledgeable concierge for a small Australian bakery in Narre Warren, Melbourne.

About the bakery:
- Hand-frosted cupcakes, custom cakes, macarons, and themed gift boxes
- BAKE-TO-ORDER kitchen. Lead time depends on the basket: a SINGLE box on its own can be delivered NEXT DAY; any other order needs 2 days' notice; cakes (including cake slices) need 3 days. A mixed order takes the longest lead time that applies. Orders placed after 2pm Melbourne time count as the next day. Weddings/corporate events usually 5–7 days
- ONLINE ORDERS ONLY — no walk-in store; delivery is Melbourne metro (Victoria-wide for event orders)
- Currency is AUD ($). The site uses Australian English.
- Free delivery on orders $100 or above. We self-deliver, so the customer picks a delivery date and a time window at checkout.

Pricing anchors (use these for "how much" questions; ALWAYS confirm the real price from a tool result before quoting a specific product):
- Standard cupcakes are $5 each, sold as 3-packs at $15 — each flavour is its own product (e.g. "Red Velvet (3 Cupcakes)"), and there is also a "Standard Cupcake Box (3)" where you choose the flavour.
- Deluxe 3-packs $15. Gluten Free Red Velvet and Vegan Chocolate Vanilla 3-packs are $15.
- Themed/event 12-packs (birthday, wedding, Christmas, baby, anniversary, etc.) are $66.
- Mini Cupcake Box (24) $70. Giant cupcakes $90. Macaron Box (12) $42.
- Round cakes from $60 (6") / $80 (8"). Cake slices from $54 for 12, up to $350 for 100.

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
- Never promise same-day delivery. Next-day is only ever possible for a single box ordered before 2pm — if the basket has anything else, or any cake, quote 2 or 3 days instead. When unsure what the customer will order, quote the longer time; the checkout shows the exact earliest date.
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

export async function POST(request: Request) {
  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message:
          'The shop assistant is offline right now. Add OPENAI_API_KEY to .env.local to bring it online.',
      },
      { status: 503 }
    )
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

  const openai = requireOpenAI()

  // Build the live system prompt — base persona + a fresh catalogue snapshot
  // so the model can pick the right tool/handle without guessing.
  let catalogueBlock = ''
  try {
    const map = await handleGetCatalogueMap()
    catalogueBlock = '\n\n' + formatCatalogueSnapshot(map)
  } catch (e) {
    console.error('Catalogue snapshot failed (continuing without):', e)
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: BASE_SYSTEM_PROMPT + catalogueBlock },
    ...parsed.data.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ]

  // Aggregate any products the model surfaced via tool calls so we can render
  // them next to the final reply.
  const surfacedProducts: AssistantProduct[] = []
  const seenProductIds = new Set<string>()

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await openai.chat.completions.create({
        model: ASSISTANT_MODEL,
        messages,
        tools: allTools,
        tool_choice: 'auto',
        temperature: 0.6,
        max_tokens: 600,
      })

      const choice = completion.choices[0]
      if (!choice) break
      const msg = choice.message
      messages.push(msg as OpenAI.Chat.ChatCompletionMessageParam)

      // If the model wants to call tools, execute them and loop.
      const toolCalls = (msg as any).tool_calls as
        | OpenAI.Chat.ChatCompletionMessageToolCall[]
        | undefined

      if (toolCalls && toolCalls.length > 0) {
        for (const call of toolCalls) {
          if (call.type !== 'function') continue
          let args: any = {}
          try {
            args = call.function.arguments ? JSON.parse(call.function.arguments) : {}
          } catch {
            args = {}
          }
          const { result, products } = await executeTool(call.function.name, args)
          if (products) {
            for (const p of products) {
              if (!seenProductIds.has(p.id)) {
                seenProductIds.add(p.id)
                surfacedProducts.push(p)
              }
            }
          }
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(result),
          } as OpenAI.Chat.ChatCompletionMessageParam)
        }
        continue
      }

      // No tool calls — final assistant reply.
      const replyContent =
        typeof msg.content === 'string' ? msg.content : ''
      return NextResponse.json({
        success: true,
        message: replyContent,
        products: surfacedProducts.slice(0, 8),
      })
    }

    // Safety fallback if we hit MAX_TOOL_ROUNDS without a textual reply.
    return NextResponse.json({
      success: true,
      message:
        "Here's what I found — let me know if anything catches your eye.",
      products: surfacedProducts.slice(0, 8),
    })
  } catch (error: any) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          'The shop assistant is having a moment — try again in a bit.',
      },
      { status: 500 }
    )
  }
}
