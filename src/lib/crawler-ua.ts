/** Shared crawler / SEO-bot user-agent detection (client + server). */

const CRAWLER_UA =
  /Googlebot|Google-InspectionTool|Storebot-Google|AdsBot-Google|bingbot|DuckDuckBot|Baiduspider|YandexBot|Applebot|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|Discordbot|AhrefsBot|SemrushBot|DotBot|MJ12bot|Screaming Frog|SEO Spider|Lighthouse|PageSpeed|Chrome-Lighthouse|GPTBot|ClaudeBot|Bytespider|PetalBot|ia_archiver|archive\.org_bot|CCBot|curl|wget|python-requests|HeadlessChrome|bot|crawler|spider|slurp/i

export function isCrawlerUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return false
  return CRAWLER_UA.test(ua)
}

export function isBrowserCrawler(): boolean {
  if (typeof navigator === 'undefined') return false
  return isCrawlerUserAgent(navigator.userAgent)
}
