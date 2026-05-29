'use client'

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import { FC } from 'react'

const DEMO_DATA = {
  default: [
    {
      name: 'Description',
      content:
        'Fashion is a form of self-expression and autonomy at a particular period and place and in a specific context, of clothing, footwear, lifestyle, accessories, makeup, hairstyle, and body posture.',
    },
    {
      name: 'Fabric + Care',
      content: `<ul class="list-disc list-inside leading-7">
        <li>Made from a sheer Belgian power micromesh.</li>
        <li>74% Polyamide (Nylon) 26% Elastane (Spandex)</li>
        <li>Adjustable hook & eye closure and straps</li>
        <li>Hand wash in cold water, dry flat</li>
      </ul>`,
    },
    {
      name: 'How it Fits',
      content:
        "Use this as a guide. Preference is a huge factor — if you're near the top of a size range and/or prefer more coverage, you may want to size up.",
    },
    {
      name: 'FAQ',
      content: `
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold">What is your return policy?</h4>
            <p class="mt-1">All full-priced, unworn items, with tags attached and in their original packaging are eligible for return or exchange within 30 days of placing your order. Please note, packs must be returned in full. We do not accept partial returns of packs.</p>
          </div>
        </div>
      `,
    },
  ],

  'b-arginine': [
    {
      name: 'Description',
      content:
        'B-Arginine is a powerful amino acid supplement that supports blood flow, stamina, and muscle recovery. It plays a vital role in nitric oxide production, helping improve performance and endurance.',
    },
    {
      name: 'Ingredients + Usage',
      content: `<ul class="list-disc list-inside leading-7">
        <li>Each serving contains 500mg of L-Arginine.</li>
        <li>Take 1-2 capsules daily with water or as directed by a healthcare professional.</li>
        <li>Do not exceed the recommended dosage.</li>
      </ul>`,
    },
    {
      name: 'Benefits',
      content: `<ul class="list-disc list-inside leading-7">
        <li>Enhances blood circulation and oxygen delivery.</li>
        <li>Promotes muscle growth and faster recovery.</li>
        <li>Supports cardiovascular health and stamina.</li>
      </ul>`,
    },
    {
      name: 'Safety + Storage',
      content: `<ul class="list-disc list-inside leading-7">
        <li>Store in a cool, dry place away from direct sunlight.</li>
        <li>Keep out of reach of children.</li>
        <li>Consult your doctor before use if pregnant, nursing, or under medical supervision.</li>
      </ul>`,
    },
    {
      name: 'FAQ',
      content: `
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold">What is your return policy?</h4>
            <p class="mt-1">All full-priced, unworn items, with tags attached and in their original packaging are eligible for return or exchange within 30 days of placing your order. Please note, packs must be returned in full. We do not accept partial returns of packs.</p>
          </div>
        </div>
      `,
    },
  ],
}

interface Props {
  panelClassName?: string
  data?: typeof DEMO_DATA.default
  handle?: string
}

const AccordionInfo: FC<Props> = ({
  panelClassName = 'p-4 pt-3 last:pb-0 text-neutral-600 text-sm dark:text-neutral-300 leading-6',
  data,
  handle,
}) => {
  const contentData = handle && DEMO_DATA[handle as keyof typeof DEMO_DATA]
    ? DEMO_DATA[handle as keyof typeof DEMO_DATA]
    : data || DEMO_DATA.default

  return (
    <div className="w-full space-y-2.5 rounded-2xl">
      {contentData.map((item, index) => (
        <Disclosure key={index} defaultOpen={index < 2}>
          {({ open }) => (
            <div>
              <DisclosureButton className="flex w-full items-center justify-between rounded-lg bg-neutral-100/80 px-4 py-2 text-left font-medium hover:bg-neutral-200/60 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-neutral-500/75 dark:bg-neutral-800 dark:hover:bg-neutral-700">
                <span>{item.name}</span>
                {!open ? (
                  <PlusIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                ) : (
                  <MinusIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                )}
              </DisclosureButton>
              <DisclosurePanel className={panelClassName} as="div">
                <div dangerouslySetInnerHTML={{ __html: item.content }}></div>
              </DisclosurePanel>
            </div>
          )}
        </Disclosure>
      ))}
    </div>
  )
}

export default AccordionInfo
