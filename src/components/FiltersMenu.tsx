'use client'

import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { FC, Fragment, useState } from 'react'

type Props = {
  priceRange?: { min: number; max: number }
  onPriceRangeChange?: (min: number, max: number) => void
  selectedFlavors?: string[]
  onFlavorsChange?: (flavors: string[]) => void
  selectedCategories?: string[]
  onCategoriesChange?: (categories: string[]) => void
  availableFlavors?: string[]
  availableCategories?: string[]
}

export const FiltersMenuTabs: FC<Props> = ({
  priceRange = { min: 0, max: 10000 },
  onPriceRangeChange,
  selectedFlavors = [],
  onFlavorsChange,
  selectedCategories = [],
  onCategoriesChange,
  availableFlavors = [],
  availableCategories = []
}) => {
  const [localMinPrice, setLocalMinPrice] = useState(priceRange.min)
  const [localMaxPrice, setLocalMaxPrice] = useState(priceRange.max)

  const handlePriceApply = () => {
    onPriceRangeChange?.(localMinPrice, localMaxPrice)
  }

  const toggleFlavor = (flavor: string) => {
    if (selectedFlavors.includes(flavor)) {
      onFlavorsChange?.(selectedFlavors.filter(f => f !== flavor))
    } else {
      onFlavorsChange?.([...selectedFlavors, flavor])
    }
  }

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange?.(selectedCategories.filter(c => c !== category))
    } else {
      onCategoriesChange?.([...selectedCategories, category])
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* Price Range Filter */}
      <Popover className="relative">
        {({ close }) => (
          <>
            <PopoverButton
              className={clsx(
                'flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium select-none ring-inset transition-all duration-200',
                'group-data-open:ring-2 group-data-open:ring-primary-300 hover:bg-neutral-50 hover:shadow-md focus:outline-hidden dark:group-data-open:ring-primary-600 dark:hover:bg-neutral-900',
                'ring-1 ring-neutral-300 bg-white shadow-sm dark:bg-neutral-800 dark:ring-neutral-700',
                (priceRange.min > 0 || priceRange.max < 10000) 
                  ? 'bg-primary-50 ring-primary-300 text-primary-700 dark:bg-primary-900/30 dark:ring-primary-600 dark:text-primary-300' 
                  : 'text-neutral-700 dark:text-neutral-300'
              )}
            >
              <span>Price Range</span>
              {(priceRange.min > 0 || priceRange.max < 10000) && (
                <span className="ml-2 rounded-full bg-primary-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                  1
                </span>
              )}
              <ChevronDownIcon className="ml-2.5 size-4 transition-transform duration-200 group-data-open:rotate-180" aria-hidden="true" />
            </PopoverButton>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-1 scale-95"
            >
              <PopoverPanel className="absolute left-0 z-50 mt-3 w-80 rounded-xl bg-white p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-sm dark:bg-neutral-900 dark:ring-neutral-700 border border-neutral-100 dark:border-neutral-800">
                <div className="space-y-6">
                  <div>
                    <label className="mb-3 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Min Price: <span className="text-primary-600 dark:text-primary-400 font-bold">${localMinPrice}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={localMinPrice}
                      onChange={(e) => setLocalMinPrice(Number(e.target.value))}
                      className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600 dark:bg-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="mb-3 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Max Price: <span className="text-primary-600 dark:text-primary-400 font-bold">${localMaxPrice}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={localMaxPrice}
                      onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
                      className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600 dark:bg-neutral-700"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        handlePriceApply()
                        close()
                      }}
                      className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-all duration-200 shadow-sm dark:focus:ring-primary-800"
                    >
                      Apply Filter
                    </button>
                    <button
                      onClick={() => {
                        setLocalMinPrice(0)
                        setLocalMaxPrice(10000)
                        onPriceRangeChange?.(0, 10000)
                        close()
                      }}
                      className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus:ring-4 focus:ring-neutral-200 transition-all duration-200 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:ring-neutral-800"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </PopoverPanel>
            </Transition>
          </>
        )}
      </Popover>

      {/* Flavors Filter */}
      {availableFlavors.length > 0 && (
        <Popover className="relative">
          <PopoverButton
            className={clsx(
              'flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium select-none ring-inset transition-all duration-200',
              'group-data-open:ring-2 group-data-open:ring-primary-300 hover:bg-neutral-50 hover:shadow-md focus:outline-hidden dark:group-data-open:ring-primary-600 dark:hover:bg-neutral-900',
              'ring-1 ring-neutral-300 bg-white shadow-sm dark:bg-neutral-800 dark:ring-neutral-700',
              selectedFlavors.length > 0 
                ? 'bg-primary-50 ring-primary-300 text-primary-700 dark:bg-primary-900/30 dark:ring-primary-600 dark:text-primary-300' 
                : 'text-neutral-700 dark:text-neutral-300'
            )}
          >
            <span>Flavors</span>
            {selectedFlavors.length > 0 && (
              <span className="ml-2 rounded-full bg-primary-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                {selectedFlavors.length}
              </span>
            )}
            <ChevronDownIcon className="ml-2.5 size-4 transition-transform duration-200 group-data-open:rotate-180" aria-hidden="true" />
          </PopoverButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-1 scale-95"
          >
            <PopoverPanel className="absolute left-0 z-50 mt-3 max-h-80 w-68 overflow-auto rounded-xl bg-white p-3 shadow-xl ring-1 ring-black/5 backdrop-blur-sm dark:bg-neutral-900 dark:ring-neutral-700 border border-neutral-100 dark:border-neutral-800">
              <div className="space-y-1">
                {availableFlavors.map((flavor) => (
                  <label
                    key={flavor}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-50 hover:shadow-sm transition-all duration-150 dark:hover:bg-neutral-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFlavors.includes(flavor)}
                      onChange={() => toggleFlavor(flavor)}
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2 transition-all duration-150"
                    />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{flavor}</span>
                  </label>
                ))}
              </div>
            </PopoverPanel>
          </Transition>
        </Popover>
      )}

      {/* Categories Filter */}
      {availableCategories.length > 0 && (
        <Popover className="relative">
          <PopoverButton
            className={clsx(
              'flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium select-none ring-inset transition-all duration-200',
              'group-data-open:ring-2 group-data-open:ring-primary-300 hover:bg-neutral-50 hover:shadow-md focus:outline-hidden dark:group-data-open:ring-primary-600 dark:hover:bg-neutral-900',
              'ring-1 ring-neutral-300 bg-white shadow-sm dark:bg-neutral-800 dark:ring-neutral-700',
              selectedCategories.length > 0 
                ? 'bg-primary-50 ring-primary-300 text-primary-700 dark:bg-primary-900/30 dark:ring-primary-600 dark:text-primary-300' 
                : 'text-neutral-700 dark:text-neutral-300'
            )}
          >
            <span>Categories</span>
            {selectedCategories.length > 0 && (
              <span className="ml-2 rounded-full bg-primary-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                {selectedCategories.length}
              </span>
            )}
            <ChevronDownIcon className="ml-2.5 size-4 transition-transform duration-200 group-data-open:rotate-180" aria-hidden="true" />
          </PopoverButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-1 scale-95"
          >
            <PopoverPanel className="absolute left-0 z-50 mt-3 max-h-80 w-68 overflow-auto rounded-xl bg-white p-3 shadow-xl ring-1 ring-black/5 backdrop-blur-sm dark:bg-neutral-900 dark:ring-neutral-700 border border-neutral-100 dark:border-neutral-800">
              <div className="space-y-1">
                {availableCategories.map((category) => (
                  <label
                    key={category}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-50 hover:shadow-sm transition-all duration-150 dark:hover:bg-neutral-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2 transition-all duration-150"
                    />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{category}</span>
                  </label>
                ))}
              </div>
            </PopoverPanel>
          </Transition>
        </Popover>
      )}
    </div>
  )
}