import { CategoryCard } from './category-card'

const categories = [
  {
    title: 'Burn',
    subtitle: 'Ignite your metabolism and shred fat with our cutting-edge thermogenic formulas',
    tagline: 'Get Cut',
    image: '/muscular-athlete-flexing-showing-defined-muscles-f.jpg',
    colorOverlay: 'bg-amber-600',
    href:"collections/pre-workout",
  },
  {
    title: 'Strength',
    subtitle: 'Build lean muscle mass with premium protein and creatine supplements',
    tagline: 'Get Muscles',
    image: '/female-boxer-athlete-in-fighting-stance-fitness-ph.jpg',
    colorOverlay: 'bg-third-50',
    href:"collections/build-muscle",
  },
  {
    title: 'Performance',
    subtitle: 'Unlock your potential with advanced performance enhancing nutrition',
    tagline: 'Get Powerful',
    image: '/athletic-man-celebrating-victory-pose-fitness-phot.jpg',
    colorOverlay: 'bg-zinc-600',
    href:"collections/muscle-recovery",

  },
]

export function FitnessCategories({className}) {
  return (
    <section className={`bg-background ${className}`}>
      <div className="mx-auto ">
        {/* Section Header */}
        <div className="mb-12 text-center">
         
          <h2 className=" uppercase text-[#1B198F] text-5xl mb-4 font-bold tracking-tight font-family-antonio  md:text-5xl">
            Choose Your Path
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            Premium supplements designed for athletes who demand results. Find the perfect stack for your fitness
            journey.
          </p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.title}
              title={category.title}
              subtitle={category.subtitle}
              tagline={category.tagline}
              image={category.image}
              colorOverlay={category.colorOverlay}
              href={category.href}
            />
          ))}
        </div>

      
    
      </div>
    </section>
  )
}
