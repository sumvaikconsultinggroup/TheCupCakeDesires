'use client'

import ButtonPrimary from '@/shared/Button/ButtonPrimary'
import Nav from '@/shared/Nav/Nav'
import NavItem from '@/shared/Nav/NavItem'
import { Transition } from '@headlessui/react'
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FilterIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import { FC, useState } from 'react'
import { Divider } from './Divider'
import { FilterSortByMenuListBox } from './FilterSortByMenu'
import { FiltersMenuTabs } from './FiltersMenu'

export interface HeaderFilterSectionProps {
  className?: string
  heading?: string
  onCategoryChange?: (category: string) => void
  onSortChange?: (sort: string) => void
  onPriceRangeChange?: (min: number, max: number) => void
  onFlavorsChange?: (flavors: string[]) => void
  onCategoriesChange?: (categories: string[]) => void
  currentCategory?: string
  currentSort?: string
  priceRange?: { min: number; max: number }
  selectedFlavors?: string[]
  selectedCategories?: string[]
  availableFlavors?: string[]
  availableCategories?: string[]
}

const HeaderFilterSection: FC<HeaderFilterSectionProps> = ({
  className = 'mb-12',
  heading,
  onCategoryChange,
  onSortChange,
  onPriceRangeChange,
  onFlavorsChange,
  onCategoriesChange,
  currentCategory = 'All items',
  currentSort = '',
  priceRange = { min: 0, max: 10000 },
  selectedFlavors = [],
  selectedCategories = [],
  availableFlavors = [],
  availableCategories = [],
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const categories = ['All items', 'Protein', 'Whey', 'Creatine', 'Pre-Workout', 'BCAA']

  const clearAllFilters = () => {
    onCategoryChange?.('All items')
    onPriceRangeChange?.(0, 10000)
    onFlavorsChange?.([])
    onCategoriesChange?.([])
  }

  const hasActiveFilters =
    currentCategory !== 'All items' ||
    priceRange.min > 0 ||
    priceRange.max < 10000 ||
    selectedFlavors.length > 0 ||
    selectedCategories.length > 0

  const activeFiltersCount =
    (currentCategory !== 'All items' ? 1 : 0) +
    (priceRange.min > 0 || priceRange.max < 10000 ? 1 : 0) +
    selectedFlavors.length +
    selectedCategories.length

  return (
    <div className={`relative flex flex-col ${className}`}>
      {heading && <h2 className="mb-12 text-4xl text-center md:text-4xl lg:text-[56px] font-black text-[#1B198F] tracking-wide font-family-antonio uppercase">{heading}</h2>}
      
      <div className="flex flex-col justify-between gap-y-6 lg:flex-row lg:items-center lg:gap-x-2 lg:gap-y-0">
        <Nav className="sm:gap-x-2">
          {categories.map((item, index) => (
            <NavItem key={index} isActive={currentCategory === item} onClick={() => onCategoryChange?.(item)}>
              {item}
            </NavItem>
          ))}
        </Nav>

        <div className="w-full lg:w-auto shrink-0">
          <ButtonPrimary
            size="smaller"
            onClick={() => {
              setIsOpen(!isOpen)
            }}
            className={clsx(
              'w-full lg:w-auto relative transition-all duration-200 justify-center',
              hasActiveFilters && 'ring-2 ring-primary-300 dark:ring-primary-600'
            )}
          >
            <HugeiconsIcon icon={FilterIcon} size={22} className="-ml-1" color="currentColor" strokeWidth={1.5} />
            <span className="ml-2.5">Filter</span>
            {activeFiltersCount > 0 && (
              <span className="ml-2 rounded-full bg-white px-1.5 py-0.5 text-xs font-bold text-primary-600 shadow-sm">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDownIcon
              className={`ml-1 size-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </ButtonPrimary>
        </div>
      </div>

      <Transition
        as={'div'}
        show={isOpen}
        enter="transition-all duration-300 ease-out"
        enterFrom="opacity-0 max-h-0"
        enterTo="opacity-100 max-h-96"
        leave="transition-all duration-300 ease-in"
        leaveFrom="opacity-100 max-h-96"
        leaveTo="opacity-0 max-h-0"
        className=""
      >
        <Divider className="my-8" />
        <div className="flex flex-row gap-4 lg:flex-row lg:flex-wrap lg:items-start lg:justify-center">
          <FiltersMenuTabs
            priceRange={priceRange}
            onPriceRangeChange={onPriceRangeChange}
            selectedFlavors={selectedFlavors}
            onFlavorsChange={onFlavorsChange}
            selectedCategories={selectedCategories}
            onCategoriesChange={onCategoriesChange}
            availableFlavors={availableFlavors}
            availableCategories={availableCategories}
          />
          <FilterSortByMenuListBox onSortChange={onSortChange} currentSort={currentSort} />
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Active filters:</span>

              <div className="flex flex-wrap gap-2">
                {currentCategory !== 'All items' && (
                  <span className="inline-flex items-center gap-2 rounded-lg bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-800 shadow-sm dark:bg-primary-900/30 dark:text-primary-200">
                    {currentCategory}
                    <button
                      onClick={() => onCategoryChange?.('All items')}
                      className="rounded-full p-0.5 transition-colors duration-150 hover:bg-primary-200 dark:hover:bg-primary-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {(priceRange.min > 0 || priceRange.max < 10000) && (
                  <span className="inline-flex items-center gap-2 rounded-lg bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-800 shadow-sm dark:bg-primary-900/30 dark:text-primary-200">
                    ${priceRange.min} - ${priceRange.max}
                    <button
                      onClick={() => onPriceRangeChange?.(0, 10000)}
                      className="rounded-full p-0.5 transition-colors duration-150 hover:bg-primary-200 dark:hover:bg-primary-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {selectedFlavors.map((flavor) => (
                  <span
                    key={flavor}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-800 shadow-sm dark:bg-primary-900/30 dark:text-primary-200"
                  >
                    {flavor}
                    <button
                      onClick={() => onFlavorsChange?.(selectedFlavors.filter((f) => f !== flavor))}
                      className="rounded-full p-0.5 transition-colors duration-150 hover:bg-primary-200 dark:hover:bg-primary-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {selectedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-800 shadow-sm dark:bg-primary-900/30 dark:text-primary-200"
                  >
                    {cat}
                    <button
                      onClick={() => onCategoriesChange?.(selectedCategories.filter((c) => c !== cat))}
                      className="rounded-full p-0.5 transition-colors duration-150 hover:bg-primary-200 dark:hover:bg-primary-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              <button
                onClick={clearAllFilters}
                className="ml-auto rounded-lg px-4 py-1.5 text-sm font-semibold text-red-600 transition-all duration-150 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </Transition>
    </div>
  )
}

export default HeaderFilterSection
