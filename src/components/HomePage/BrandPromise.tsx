'use client'

import { motion } from 'framer-motion'
import { Truck, Shield, RotateCcw, Award, HeartHandshake, Leaf } from 'lucide-react'

const promises = [
  {
    icon: Shield,
    title: '100% Authentic',
    description: 'QR verified products',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders $999+',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: RotateCcw,
    title: '7 Day Returns',
    description: 'Easy return policy',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Award,
    title: 'Lab Tested',
    description: 'Third-party verified',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Leaf,
    title: '100% Natural',
    description: 'No harmful additives',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: HeartHandshake,
    title: '24/7 Support',
    description: 'We\'re here to help',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
]

export default function BrandPromise() {
  return (
    <section className="py-8 bg-neutral-900 dark:bg-black">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {promises.map((promise, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center text-center p-4"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${promise.bg} mb-3`}>
                <promise.icon className={`h-6 w-6 ${promise.color}`} />
              </div>
              <h3 className="font-bold text-white text-sm">{promise.title}</h3>
              <p className="text-xs text-neutral-400 mt-1">{promise.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
