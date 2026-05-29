'use client'

import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/solid'
import { ArrangeByLettersAZIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import { FC, Fragment, useEffect, useState } from 'react'

const sortByOptions = [
  { name: 'Newest', value: 'newest' },
  { name: 'Oldest', value: 'oldest' },
  { name: 'Price: low to high', value: 'price-low-to-high' },
  { name: 'Price: high to low', value: 'price-high-to-low' },
  { name: 'A to Z', value: 'a-to-z' },
  { name: 'Z to A', value: 'z-to-a' },
]

type Props = {
  className?: string
  filterOptions?: { name: string; value: string }[]
  onSortChange?: (sort: string) => void
  currentSort?: string
}

export const FilterSortByMenuListBox: FC<Props> = ({ 
  className, 
  filterOptions = sortByOptions,
  onSortChange,
  currentSort = ''
}) => {
  const [selectedOption, setSelectedOption] = useState(currentSort || filterOptions[0].value)

  useEffect(() => {
    if (currentSort) {
      setSelectedOption(currentSort)
    }
  }, [currentSort])

  const handleChange = (value: string) => {
    setSelectedOption(value)
    onSortChange?.(value)
  }

  return (
    <div className={clsx('product-sort-by-list-box flex shrink-0', className)}>
      <Listbox value={selectedOption} onChange={handleChange}>
        <div className="relative">
          <ListboxButton
            className={clsx(
              'flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium select-none ring-inset transition-all duration-200',
              'group-data-open:ring-2 group-data-open:ring-primary-300 group-data-open:bg-primary-50',
              'hover:bg-neutral-50 hover:shadow-md focus:outline-hidden dark:group-data-open:ring-primary-600 dark:hover:bg-neutral-900',
              'ring-1 ring-neutral-300 bg-white shadow-sm dark:bg-neutral-800 dark:ring-neutral-700 dark:text-neutral-200'
            )}
          >
            <HugeiconsIcon icon={ArrangeByLettersAZIcon} size={18} className="text-primary-600 dark:text-primary-400" />
            <span className="ms-2.5 text-neutral-700 dark:text-neutral-300">
              {filterOptions.find((item) => item.value === selectedOption)?.name}
            </span>
            <ChevronDownIcon className="ml-3 size-4 text-neutral-500 transition-transform duration-200 group-data-open:rotate-180" aria-hidden="true" />
          </ListboxButton>
          
          <Transition 
            as={Fragment} 
            leave="transition ease-in duration-150" 
            leaveFrom="opacity-100 scale-100" 
            leaveTo="opacity-0 scale-95"
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
          >
            <ListboxOptions className="absolute right-0 z-50 mt-3 max-h-60 w-56 overflow-auto rounded-xl bg-white py-2 text-sm text-neutral-900 shadow-xl ring-1 ring-black/5 backdrop-blur-sm focus:outline-hidden dark:bg-neutral-900 dark:text-neutral-200 dark:ring-neutral-700 border border-neutral-100 dark:border-neutral-800">
              {filterOptions.map((item) => (
                <ListboxOption
                  key={item.value}
                  className={({ focus: active }) =>
                    clsx(
                      'relative flex cursor-default py-2.5 ps-10 pe-4 select-none mx-1 rounded-lg transition-colors duration-150',
                      active && 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    )
                  }
                  value={item.value}
                >
                  {({ selected }) => (
                    <>
                      <span className={clsx('block truncate', selected && 'font-semibold text-primary-600 dark:text-primary-400')}>
                        {item.name}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-primary-600 dark:text-primary-400">
                          <CheckIcon className="size-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}