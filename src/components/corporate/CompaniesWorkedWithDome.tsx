'use client'

import DomeGallery from '@/components/DomeGallery'
import { COMPANIES_WORKED_WITH } from '@/data/companiesWorkedWith'

/** Cream from the bakery palette so the dome fades into this section. */
const CREAM = '#fbf3e8'

export default function CompaniesWorkedWithDome() {
  return (
    <div className="relative mt-8 h-[480px] w-full sm:h-[560px] md:mt-10 md:h-[640px]">
      <DomeGallery
        images={COMPANIES_WORKED_WITH}
        overlayBlurColor={CREAM}
        grayscale={false}
        minRadius={480}
        fit={0.58}
        imageBorderRadius="28px"
        openedImageBorderRadius="28px"
        openedImageWidth="280px"
        openedImageHeight="280px"
      />
    </div>
  )
}
