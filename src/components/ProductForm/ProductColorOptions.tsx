'use client'

import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import { useState } from 'react'

interface ProductOption {
  name: string
  values: string[]
  _id?: string
}

interface ProductOptionSelectorProps {
  options: ProductOption
  defaultColor?: string
  className?: string
  onColorChange?: (color: string) => void
}

// 🎨 Define your color mapping for each flavor
const flavorColorMap: Record<string, string> = {
  'green apple': '#84cc16',
  'raw mango': '#f97316',
  'musk melon': '#f59e0b',
  'blue raspberry': '#3b82f6',
  mango: '#ffc107',
  orange: '#f97316',
  'fruit punch': '#ef4444',
  cola: '#3E2723',
  pinacolada: '#fefce8',
  guava: '#ec4899',
  'water melon': '#f43f5e',
  'bubble gum': '#d946ef',
  unflavored: '#a3a3a3',
  'mocha chino': '#A56A44',
  'vanilla caramel': '#D2691E',
  saffron: '#F4C430',
  'double chocolate': '#3D2B1F',
  'pina colada': '#fefce8',
  'kiwi strawberry': '#FC819E',
  'green mango': '#90EE90',
  grape: '#6F2DA8',
  watermelon: '#f43f5e',
  blueberry: '#464196',
  bubblegum: '#d946ef',
  chocolate: '#7B3F00',
  'cookies cream': '#F5F5DC',
  vanilla: '#F3E5AB',
  'rich chocolate': '#5C3317',
  'cookies n cream': '#F5F5DC',
  'saffron milk': '#FFD700',
  'irish chocolate': '#622A0F',
  'coffee mocha': '#4A2C2A',
  banana: '#FFE135',
  'butter scotch': '#E3963E',
  'creamy vanilla': '#F3E5AB',
  'real chocolate': '#5D4037',
  'dutch chocolate': '#4B3621',
  'saffron milk shake': '#FFD700',
  coffee: '#6F4E37',
  'mango shake': '#FFBF00',
  'banana shake': '#FAE392',
  'mango mangifera': '#FFBF00',
  'chocolate creme': '#D2691E',
  'malai kulfi': '#FFFDD0',
  'vanilla elite': '#F3E5AB',
  'straw & berries': '#E0115F',
  'saffron mix': '#F4C430',
  'pineapple twist': '#FFEC8B',
  'chocolate peanuts': '#4a2c2a',
  'cookies confection': '#F5F5DC',
  'rose macarron': '#F4C2C2',
  'vanilla shake': '#F3E5AB',
  'mango maza': '#FFBF00',
  'silk chocolate': '#C4A484',
  'chocolate peanut': '#4a2c2a',
}

const ProductOptionSelector = ({
  options,
  defaultColor = '',
  className,
  onColorChange,
}: ProductOptionSelectorProps) => {
  const [selectedValue, setSelectedValue] = useState(defaultColor || options.values[0] || '')

  const handleColorChange = (value: string) => {
    setSelectedValue(value)
    if (onColorChange) {
      onColorChange(value)
    }
  }

  if (!options?.values?.length) return null

  return (
    <Headless.Field className={clsx(className)}>
      <Headless.RadioGroup
        value={selectedValue}
        name={options.name.toLowerCase()}
        onChange={handleColorChange}
        aria-label={options.name}
      >
        <Headless.Label className="block font-family-roboto text-sm font-semibold rtl:text-right">
          {options.name}
        </Headless.Label>

        <div className="mt-3 flex flex-wrap gap-3">
          {options.values.map((value) => {
            const isActive = value === selectedValue
            const color = flavorColorMap[value.toLowerCase()] || '#ccc' // fallback if not mapped

            return (
              <Headless.Radio
                key={value}
                value={value}
                as="div"
                className={clsx(
                  'flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-neutral-200 dark:text-neutral-900 ring-2 ring-neutral-900 dark:ring-neutral-300'
                    : 'bg-white text-neutral-900 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                )}
              >
                {/* Color Swatch */}
                <span
                  className="size-4 font-family-roboto rounded-full border border-neutral-400 dark:border-neutral-600"
                  style={{ backgroundColor: color }}
                />
                {/* Flavor Name */}
                <span>{value}</span>
              </Headless.Radio>
            )
          })}
        </div>
      </Headless.RadioGroup>
    </Headless.Field>
  )
}

export default ProductOptionSelector
