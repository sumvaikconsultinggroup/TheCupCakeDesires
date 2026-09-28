import { readFile } from 'fs/promises'
import { ImageResponse } from 'next/og'
import path from 'path'

export const OG_SIZE = { width: 1200, height: 630 }

/** Default social / Open Graph image (1200×630), rendered from the real logo. */
export async function renderDefaultOgImage() {
  const logo = await readFile(path.join(process.cwd(), 'public/images/Cupcake-Logo.png'))
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #fbf3e8 0%, #f6e3d3 100%)',
          padding: '0 80px',
          gap: 56,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={380} height={380} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column', color: '#2e1f15' }}>
          <div style={{ fontSize: 30, letterSpacing: 6, textTransform: 'uppercase', color: '#b5476b' }}>
            The Cupcake Desire
          </div>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.08, marginTop: 18, maxWidth: 620 }}>
            Cupcakes delivered across Melbourne
          </div>
          <div style={{ fontSize: 30, marginTop: 26, color: '#5a4634', maxWidth: 620 }}>
            Hand-frosted to order · Eggless, vegan &amp; gluten-free options
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  )
}
