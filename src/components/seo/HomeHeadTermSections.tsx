import {
  HOME_HEAD_TERM_SECTIONS,
  type HeadTermSegment,
} from '@/data/home-head-term'
import Link from 'next/link'

function renderSegments(segments: HeadTermSegment[]) {
  return segments.map((seg, i) => {
    if (typeof seg === 'string') {
      return <span key={i}>{seg}</span>
    }
    return (
      <Link
        key={i}
        href={seg.href}
        className="underline decoration-rose-accent underline-offset-4"
      >
        {seg.text}
      </Link>
    )
  })
}

/** Server-rendered homepage head-term sections (cupcakes melbourne). No images, no motion. */
export default function HomeHeadTermSections() {
  return (
    <section className="border-t border-line bg-cream py-14 md:py-16">
      <div className="mx-auto max-w-[1320px] space-y-12 px-6 md:space-y-14 md:px-10">
        {HOME_HEAD_TERM_SECTIONS.map((block) => (
          <div key={block.h2}>
            <h2 className="bake-display-lg max-w-[28ch]">{block.h2}</h2>
            {block.segments.length > 0 ? (
              <p className="bake-body mt-4 max-w-[68ch] text-cocoa-soft">
                {renderSegments(block.segments)}
              </p>
            ) : null}
            {block.steps && block.steps.length > 0 ? (
              <ol className="bake-body mt-4 max-w-[68ch] list-decimal space-y-3 pl-5 text-cocoa-soft">
                {block.steps.map((step) => (
                  <li key={step.lead}>
                    <strong>{step.lead}</strong>
                    {renderSegments(step.segments)}
                  </li>
                ))}
              </ol>
            ) : null}
            {block.afterSteps && block.afterSteps.length > 0 ? (
              <p className="bake-body mt-4 max-w-[68ch] text-cocoa-soft">
                {renderSegments(block.afterSteps)}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
