

import JsonLd from '@/components/SE0/JsonLd'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <JsonLd />
      {/* Breadcrumb */}
      <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 py-3 dark:from-neutral-900 dark:to-neutral-900">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-neutral-500 transition-colors hover:text-[#1B198F]">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-neutral-400" />
            <span className="font-medium text-neutral-900 dark:text-white">Shipping Policy</span>
          </nav>
        </div>
      </div>

      {/* Content */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-8 font-[family-name:var(--font-family-antonio)] text-3xl font-black uppercase text-neutral-900 sm:text-4xl lg:text-5xl dark:text-white">
              Shipping Policy
            </h1>
            <div className="prose max-w-none prose-neutral dark:prose-invert prose-headings:font-bold prose-p:text-neutral-600 prose-p:dark:text-neutral-400 prose-li:text-neutral-600 prose-li:dark:text-neutral-400">
              <h3>Shipment processing time</h3>
              <p>
                All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays.
                If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery. If there will be a significant delay in shipment of your order, we will contact you via email or telephone.
              </p>

              <h3>Shipping rates & delivery estimates</h3>
              <p>
                Shipping charges for your order will be calculated and displayed at checkout.
                We offer free shipping on all orders above $999. For orders below $999, a standard shipping fee applies.
              </p>

              <h3>Shipment confirmation & Order tracking</h3>
              <p>
                You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.
              </p>

              <h3>Customs, Duties and Taxes</h3>
              <p>
                Gibbon Nutrition is not responsible for any customs and taxes applied to your order. All fees imposed during or after shipping are the responsibility of the customer (tariffs, taxes, etc.).
              </p>

              <h3>Damages</h3>
              <p>
                Gibbon Nutrition is not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim.
                Please save all packaging materials and damaged goods before filing a claim.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
