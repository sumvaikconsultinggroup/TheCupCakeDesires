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
    corporate: withUtm(cfg.corporateUrl),
    mini: withUtm(cfg.miniUrl),
    slices: withUtm(cfg.slicesUrl),
    quote: withUtm(cfg.quoteUrl),
    phone: `tel:${cfg.phoneTel}`,
  }

  document.querySelectorAll('[data-phone-display]').forEach((el) => {
    el.textContent = cfg.phone
  })

  document.querySelectorAll('[data-link]').forEach((el) => {
    const key = el.getAttribute('data-link')
    if (key && links[key]) el.setAttribute('href', links[key])
  })

  const topbar = document.querySelector('.topbar')
  const hero = document.querySelector('.hero-full')
  if (topbar && hero) {
    const syncTopbar = () => {
      const heroBottom = hero.getBoundingClientRect().bottom
      topbar.classList.toggle('topbar--hero', heroBottom > 72)
    }
    syncTopbar()
    window.addEventListener('scroll', syncTopbar, { passive: true })
    window.addEventListener('resize', syncTopbar)
  }

  document.title = `Corporate Cupcakes ${cfg.areaName} | The Cupcake Desire`
  const desc = document.querySelector('meta[name="description"]')
  if (desc) {
    desc.setAttribute(
      'content',
      `Corporate cupcakes, branded minis & cake slices for ${cfg.areaName}. Edible logos, boxes from 12 to 500. Quote in 24 hours — The Cupcake Desire.`
    )
  }

  const year = document.querySelector('[data-year]')
  if (year) year.textContent = String(new Date().getFullYear())

  const stats = document.querySelector('[data-stats]')
  if (stats && Array.isArray(cfg.stats)) {
    stats.innerHTML = cfg.stats
      .map(
        (s) => `
      <div class="trust-item">
        <strong>${s.value}</strong>
        <span>${s.label}</span>
      </div>`
      )
      .join('')
  }

  const lines = document.querySelector('[data-product-lines]')
  if (lines && cfg.products) {
    const order = [
      { key: 'standard', featured: false },
      { key: 'mini', featured: true },
      { key: 'slices', featured: false },
    ]

    lines.innerHTML = order
      .map(({ key, featured }, i) => {
        const p = cfg.products[key]
        if (!p) return ''
        const href = links[p.hrefKey] || links.quote
        const from = p.sizes && p.sizes[0] ? p.sizes[0].price : ''
        const num = String(i + 1).padStart(2, '0')

        return `
        <a class="format-card ${featured ? 'featured' : ''}" href="${href}">
          <div class="format-media">
            <span class="format-num">${num}</span>
            <img src="${p.image}" alt="${p.title}" loading="${i === 0 ? 'eager' : 'lazy'}" />
            <span class="format-occasion">${p.occasion || p.tagline}</span>
          </div>
          <div class="format-body">
            <span class="tag">${p.tagline}</span>
            <h3>${p.title}</h3>
            <p class="blurb">${p.blurb || ''}</p>
            <p class="format-from"><span>From</span>$${from}</p>
            <span class="format-cta">Explore this format →</span>
          </div>
        </a>`
      })
      .join('')
  }
})()
