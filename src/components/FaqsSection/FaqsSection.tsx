"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, Minus } from "lucide-react"

const faqs = [
  {
    question: "WHAT IS WHEY PROTEIN AND WHERE DOES IT COME FROM?",
    answer:
      "Whey protein is a high-quality protein derived from milk during the cheesemaking process. It contains all nine essential amino acids, making it a complete protein source that's excellent for muscle repair and growth.",
  },
  {
    question: "WHEN IS THE BEST TIME TO TAKE A PROTEIN SUPPLEMENT?",
    answer:
      "For muscle recovery, the best time is within 30-60 minutes after your workout. However, you can take our protein supplements any time of day to help you meet your daily protein goals, whether it's in a morning smoothie, as a midday snack, or before bed.",
  },
  {
    question: "IS WHEY PROTEIN SUITABLE FOR LACTOSE INTOLERANCE?",
    answer:
      "It depends. Whey protein isolate undergoes a filtering process to remove most of the lactose, making it a great option for many people with lactose sensitivities. Whey concentrate contains more lactose. We recommend starting with an isolate if you are sensitive.",
  },
]

export default function FaqSocialSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="relative w-screen -mx-[50vw] left-1/2 right-1/2">
      <div className="flex flex-col-reverse lg:flex-row">
        {/* Left Side - FAQ */}
        <div className="w-full lg:w-1/2 bg-[#F5E6D3] px-8 py-16 lg:px-16">
          <h2 className="font-family-antonio text-[#1B198F] text-3xl md:text-4xl lg:text-5xl leading-tight mb-12">
            FREQUENTLY
            <br />
            ASKED QUESTIONS
          </h2>

          <div className="space-y-4 mb-8">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-300">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="font-family-antonio font-bold text-sm md:text-base text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <div className="shrink-0 w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    {openIndex === index ? (
                      <Minus className="w-4 h-4 text-white" />
                    ) : (
                      <Plus className="w-4 h-4 text-white" />
                    )}
                  </div>
                </button>
                {openIndex === index && (
                  <div className="font-roboto pb-4 text-gray-700 text-sm">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>

          <button className="font-roboto bg-[#1B198F] cursor-pointer text-white font-bold text-sm px-6 py-3 hover:bg-blue-700 transition-colors">
            EXPLORE ALL FAQS
          </button>
        </div>

        {/* Right Side - Social Proof */}
        <div className="w-full lg:w-1/2 relative h-[500px] lg:h-[980px]">
          <Image
            src="/faqs-image.png"
            alt="Social proof"
            layout="fill"
            objectFit="cover"
          />
        </div>
      </div>
    </section>
  )
}