
import Image from 'next/image'
import { FC } from 'react'

export interface SectionPromo2Props {
	className?: string
}

const SectionPromo2: FC<SectionPromo2Props> = ({ className }) => {
	return (
		<div className={`nc-SectionPromo2 ${className}`}>
			<div className="relative flex flex-col lg:flex-row lg:justify-end bg-yellow-50 dark:bg-neutral-800 rounded-2xl sm:rounded-[40px] p-4 pb-0 sm:p-5 sm:pb-0 lg:p-24">
				<Image alt="section promo 2" fill src='/banner-1.png' />
			</div>
		</div>
	)
}

export default SectionPromo2