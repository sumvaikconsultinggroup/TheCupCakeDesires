'use client'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

const testimonials = [
  {
    id: 1,
    rating: 5,
    title: 'Amazing Quality!',
    description:
      'The quality of these supplements is outstanding. I have noticed significant improvements in my energy levels and overall fitness. Since I started using these products, my workout performance has increased dramatically and I feel more energized throughout the day. The results are truly remarkable and I highly recommend',
    name: 'Arjun Sharma',
  },
  {
    id: 2,
    rating: 5,
    title: 'Best Purchase Ever',
    description:
      "I am so impressed with the results. The taste is great and the effects are noticeable within days. Highly recommend! The supplement mixes easily and doesn't leave any aftertaste. My recovery time after workouts has improved significantly, and I've noticed better muscle definition. This has been a game-changer for my fitness journey.",
    name: 'Priya Patel',
  },
  {
    id: 3,
    rating: 5,
    title: 'Incredible Results',
    description:
      "After using these supplements for a month, I can see real changes in my muscle growth and recovery time. Worth every penny! My strength has increased noticeably, and I'm able to push harder during my training sessions. The quality is exceptional and I appreciate that it's made with natural ingredients. Definitely worth the investment.",
    name: 'Rohan Mehta',
  },
  {
    id: 4,
    rating: 5,
    title: 'Highly Satisfied',
    description:
      "Great product with no side effects. Perfect for my workout routine and helps me stay energized throughout the day. I've tried many supplements before, but this one stands out for its effectiveness and quality. My endurance has improved, and I'm seeing consistent progress in my fitness goals. The customer service is also excellent.",
    name: 'Ananya Singh',
  },
  {
    id: 5,
    rating: 5,
    title: 'Top Notch!',
    description:
      "Absolutely top-notch supplements. The results speak for themselves. I feel stronger and more focused during my workouts. This has become an essential part of my daily routine and I couldn't be happier with the purchase.",
    name: 'Vikram Rao',
  },
  {
    id: 6,
    rating: 4,
    title: 'Very Effective',
    description:
      'These products are very effective. I have seen a noticeable difference in my performance at the gym. The only reason for 4 stars is the slightly higher price, but the quality justifies it. I would still recommend it to others.',
    name: 'Sunita Gupta',
  },
]

const TestimonialSwipper = () => {
  return (
    <div className="font-family-antonio relative right-1/2 left-1/2 -mx-[50vw] w-screen bg-gray-50 py-16  dark:bg-neutral-900">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <h2 className="mb-12 text-4xl text-center md:text-4xl lg:text-[56px] font-black text-[#1B198F] tracking-wide font-family-antonio uppercase">
          The Cravings Are Real
        </h2>

        {/* Swiper */}
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView={1}
          // navigation
        //   pagination={{ clickable: true }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
            1280: {
              slidesPerView: 4,
            },
          }}
          className="pb-12"
        >
          {testimonials.map((testimonial) => (
            <SwiperSlide key={testimonial.id}>
              <div className="flex h-[500px] flex-col border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                <div className="flex flex-1 flex-col overflow-hidden">
                  {/* Stars */}
                  <div className="mb-6 flex justify-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="h-6 w-6 fill-yellow-400 stroke-gray-600" viewBox="0 0 20 20">
                        <path
                          strokeWidth="0.5"
                          d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
                        />
                      </svg>
                    ))}
                  </div>

                  {/* Title */}
                  <h3 className="mb-4 text-2xl font-bold text-gray-900 font-family-antonio dark:text-white">{testimonial.title}</h3>

                  {/* Description */}
                  <p className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 mt-5 mb-8 flex-1 overflow-y-auto text-gray-600 dark:text-gray-300 dark:scrollbar-thumb-neutral-600 dark:scrollbar-track-neutral-700">{testimonial.description}</p>
                </div>

                {/* User Info */}
                <div className="flex flex-col items-center">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#1B198F]">
                    <span className="text-2xl font-bold text-white">{testimonial.name.split(' ')[0].charAt(0)}</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}

export default TestimonialSwipper
