const advantages = [
  { image: '/advantage_icon_1.webp', label: '10G PROTEIN' },
  { image: '/advantage_icon_2.webp', label: 'NO ADDED SUGAR' },
  { image: '/advantage_icon_3.webp', label: 'NO PALM OIL' },
  { image: '/advantage_icon_4.webp', label: 'PDCAAS 1.0/1.0' },
  { image: '/advantage_icon_5.webp', label: 'BACKED BY SCIENCE' },
]

  export function SuperAdvantage({ lesspadding = false, restriction = false }) {
  return (
    <section className={`mx-auto ${restriction ? '' : 'mt-12 sm:mt-16'} max-w-7xl px-4 sm:px-6 lg:px-8 bg-white ${lesspadding ? 'pt-0 pb-16' : 'py-16'}`}>
      <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl text-center md:text-4xl mb-12 lg:text-[56px] font-black text-[#3086C8] tracking-wide font-family-antonio">
            OUR FEATURED PRODUCTS
          </h2>

        <div className="grid grid-cols-2 gap-y-8 md:flex md:flex-wrap md:justify-center md:items-start">
          {advantages.map((advantage, index) => (
            <div key={advantage.label} className="flex items-start justify-center">
              <div className="flex flex-col items-center px-2 md:px-10">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#E0F2FE] md:h-24 md:w-24">
                  <img src={advantage.image} alt={advantage.label} className="h-12 w-12 object-contain md:h-14 md:w-14" />
                </div>
                <span className="text-sm md:text-base font-semibold text-[#3D3D3D] tracking-wide text-center">
                  {advantage.label}
                </span>
              </div>
              {index < advantages.length - 1 && <div className="hidden md:block w-px h-28 bg-gray-300 self-center" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
