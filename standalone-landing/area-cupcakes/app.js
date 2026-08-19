(function () {
  const cfg = window.LANDING_CONFIG
  if (!cfg) return

  function withUtm(url) {
    if (!cfg.utm) return url
    try {
      const u = new URL(url)
      if (cfg.utm.source) u.searchParams.set('utm_source', cfg.utm.source)
      if (cfg.utm.medium) u.searchParams.set('utm_medium', cfg.utm.medium)
      if (cfg.utm.campaign) u.searchParams.set('utm_campaign', cfg.utm.campaign)
      if (cfg.areaName) {
        u.searchParams.set('utm_content', cfg.areaName.toLowerCase().replace(/\s+/g, '-'))
      }
      return u.toString()
    } catch {
      return url
    }
  }

  const links = {
    site: cfg.siteUrl,
    shop: withUtm(cfg.shopCtaUrl),
    corporate: withUtm(cfg.corporateCtaUrl),
    phone: `tel:${cfg.phoneTel}`,
  }

  document.querySelectorAll('[data-area-name], [data-area-name-inline]').forEach((el) => {
    el.textContent = cfg.areaName
  })

  document.querySelectorAll('[data-phone-display]').forEach((el) => {
    el.textContent = cfg.phone
  })

  document.querySelectorAll('[data-link]').forEach((el) => {
    const key = el.getAttribute('data-link')
    if (key && links[key]) el.setAttribute('href', links[key])
  })

  const postcodeBadge = document.querySelector('[data-postcode-badge]')
  if (postcodeBadge) {
    if (cfg.postcode) {
      postcodeBadge.textContent = `Postcode ${cfg.postcode}`
    } else {
      postcodeBadge.style.display = 'none'
    }
  }

  const faqDelivery = document.querySelector('[data-faq-delivery]')
  if (faqDelivery) {
    const pc = cfg.postcode ? ` (${cfg.postcode})` : ''
    faqDelivery.textContent = `Yes — we hand-deliver to ${cfg.areaName}${pc} and selected Greater Melbourne postcodes. Enter your postcode at checkout to confirm the fee.`
  }

  document.title = `R U OK? Day Cupcakes in ${cfg.areaName} | The Cupcake Desire`
  const desc = document.querySelector('meta[name="description"]')
  if (desc) {
    desc.setAttribute(
      'content',
      `Order R U OK? Day cupcakes delivered in ${cfg.areaName}. Yellow & white buttercream with edible RU OK? DAY toppers. Boxes from 12 ($66) to 500. The Cupcake Desire.`
    )
  }

  const year = document.querySelector('[data-year]')
  if (year) year.textContent = String(new Date().getFullYear())

  const pricing = document.querySelector('[data-pricing-grid]')
  if (pricing && Array.isArray(cfg.sizes)) {
    pricing.innerHTML = cfg.sizes
      .map(
        (s) => `
      <article class="price-card">
        <div class="qty">${s.qty}</div>
        <div class="label">cupcakes</div>
        <div class="amount">$${s.price}</div>
      </article>`
      )
      .join('')
  }

  const chips = document.querySelector('[data-flavour-chips]')
  if (chips && Array.isArray(cfg.flavours)) {
    chips.innerHTML = cfg.flavours
      .map((f) => `<span class="flavour-chip">${f}</span>`)
      .join('')
  }

  const flavoursLine = document.querySelector('[data-flavours-line]')
  if (flavoursLine && Array.isArray(cfg.flavours)) {
    flavoursLine.textContent = `${cfg.flavours.join(', ')} — perfect for mixed teams.`
  }
})()
