'use client'

import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useEffect } from 'react'

const categories = [
    {
        id: 1,
        name: 'Health & Wellness',
        color: '#893B07',
        image: '/purposeImg-1.png',
    },
    {
        id: 2,
        name: 'Build Muscle',
        color: '#629859',
        image: '/purposeImg-2.png',
    },
    {
        id: 3,
        name: 'Weight Management',
        color: '#CC9213',
        image: '/purposeImg-3.png',
    },
    {
        id: 4,
        name: 'Pre workout',
        color: '#F2C349',
        image: '/purposeImg-4.png',
    },
    {
        id: 5,
        name: 'Post Workout',
        color: '#893B07',
        image: '/purposeImg-1.png',
    },
    {
        id: 6,
        name: 'Energy Boost',
        color: '#629859',
        image: '/purposeImg-2.png',
    },
]

export function PowerPurposeSection() {
    const scrollContainerRef = useRef(null)
    
    // Create infinite array by repeating categories multiple times
    const infiniteCategories = [...categories, ...categories, ...categories, ...categories]

    useEffect(() => {
        // Initialize scroll position to the middle
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth / 4
        }
    }, [])

    const handlePrevious = () => {
        if (scrollContainerRef.current) {
            const cardWidth = 276 // card width + gap
            scrollContainerRef.current.scrollBy({
                left: -cardWidth,
                behavior: 'smooth'
            })
        }
    }

    const handleNext = () => {
        if (scrollContainerRef.current) {
            const cardWidth = 276 // card width + gap
            scrollContainerRef.current.scrollBy({
                left: cardWidth,
                behavior: 'smooth'
            })
        }
    }

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current
            const maxScroll = container.scrollWidth - container.clientWidth
            const currentScroll = container.scrollLeft

            // Reset to middle when reaching near the end
            if (currentScroll >= maxScroll - 100) {
                container.scrollLeft = container.scrollWidth / 4
            }
            // Reset to middle when reaching near the start
            if (currentScroll <= 100) {
                container.scrollLeft = container.scrollWidth 
            }
        }
    }

    return (
        <section className="w-full px-6  lg:px-12 [font-family:var(--font-antonio)]" >
            <div className="mx-auto max-w-[1800px]">
                {/* Navigation arrows - top right */}
                <div className="my-6 flex justify-end gap-2">
                    <button
                        onClick={handlePrevious}
                        className="relative flex h-[50px] w-[50px] cursor-pointer items-center justify-center overflow-hidden border-black bg-[#3086C8] font-medium text-white shadow-[4px_6px_0px_black] transition-[box-shadow_250ms,transform_250ms,filter_50ms] before:absolute before:inset-0 before:z-[-1] before:-translate-x-full before:bg-[#2a75b3] before:transition-transform before:duration-250 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_3px_0px_black] hover:before:translate-x-0"
                        aria-label="Previous products"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="relative flex h-[50px] w-[50px] cursor-pointer items-center justify-center overflow-hidden border-black bg-[#3086C8] font-medium text-white shadow-[4px_6px_0px_black] transition-[box-shadow_250ms,transform_250ms,filter_50ms] before:absolute before:inset-0 before:z-[-1] before:-translate-x-full before:bg-[#2a75b3] before:transition-transform before:duration-250 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_3px_0px_black] hover:before:translate-x-0"
                        aria-label="Next products"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </div>

                {/* Main content */}
                <div className="flex font-family-antonio flex-col gap-8 lg:flex-row lg:justify-between lg:gap-16">
                    {/* Left side - Text content */}
                    <div className="shrink-0 lg:w-auto">
                        <h2 className="mb-6 text-5xl font-light italic leading-tight text-[#2B9BD8] lg:text-6xl xl:text-7xl">
                            Power your
                            <br />
                            purpose
                        </h2>
                        <p className="mb-2 text-base font-semibold text-[#8B5A2B]">We Make Real Nutrition</p>
                        <p className="text-base leading-relaxed text-gray-700">
                            Clean enough to declare
                            <br />
                            every ingredient, proudly,
                            <br />
                            upfront.
                        </p>
                    </div>

                    {/* Right side - Product cards with infinite swiper */}
                    <div className="flex-1 overflow-hidden">
                        <div 
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className="flex gap-6 overflow-x-auto scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {infiniteCategories.map((category, index) => (
                                <div 
                                    key={`${category.id}-${index}`} 
                                    className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg shadow-md transition-shadow hover:shadow-xl min-w-[220px] md:min-w-[260px]"
                                >
                                    {/* Product image area - 70% */}
                                    <div className="relative flex h-[280px] items-center justify-center bg-white">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <img
                                                src={category.image || 'https://via.placeholder.com/280x280?text=Product'}
                                                alt={category.name}
                                                className="h-[280px] w-auto object-contain transition-transform duration-300 group-hover:scale-125"
                                            />
                                        </div>
                                    </div>

                                    {/* Category label - 30% */}
                                    <div
                                        className="flex h-[120px] flex-col justify-between p-5"
                                        style={{ backgroundColor: category.color }}
                                    >
                                        <span className="text-xl font-semibold text-white leading-tight">{category.name}</span>
                                        <div className="flex justify-end">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 transition-colors group-hover:bg-white/30">
                                                <ArrowRight className="h-5 w-5 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </section>
    )
}