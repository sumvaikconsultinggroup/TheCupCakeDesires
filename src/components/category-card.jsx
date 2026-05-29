"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"


export function CategoryCard({ title, subtitle, tagline, image, colorOverlay, href = "/collections/all-items" }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group relative h-[500px] overflow-hidden rounded-xl cursor-pointer"
      style={{ fontFamily: "var(--font-antonio)" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
        style={{ backgroundImage: `url(${image})` }}
      />

      {/* Color Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${colorOverlay}`}
        style={{ opacity: isHovered ? 0.85 : 0.6 }}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-end p-6">
        <span className="mb-2 text-md font-medium uppercase tracking-widest text-white font-family-antonio">{tagline}</span>
        <h3 className="mb-2 font-family-antonio text-3xl font-bold uppercase tracking-tight text-white">{title}</h3>
        <p className="mb-6 font-family-roboto text-xl text-white">{subtitle}</p>

        <Link
          href={href}
          className="inline-flex h-10 w-fit items-center justify-center rounded-md border border-foreground/20 bg-foreground/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white   cursor-pointer ring-offset-background transition-all duration-300 hover:border-primary hover:bg-primary hover:text-black focus-visible:outline-none focus-visible:ring-2 hover:text-primary focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          View Products
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Badge */}
      <div className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-primary-foreground">
        Shop Now
      </div>
    </div>
  )
}
