'use client'
import BackgroundSection from '@/components/BackgroundSection/BackgroundSection'
import { Divider } from '@/components/Divider'
import Heading from '@/components/Heading/Heading'
import SectionClientSay from '@/components/SectionClientSay'
import SectionCollectionSlider from '@/components/SectionCollectionSlider'
import SectionCollectionSlider2 from '@/components/SectionCollectionSlider2'
import SectionGridFeatureItems from '@/components/SectionGridFeatureItems'
import SectionGridMoreExplore from '@/components/SectionGridMoreExplore/SectionGridMoreExplore'
import SectionHero2 from '@/components/SectionHero/SectionHero2'
import {StrengthAdvantage} from '@/components/SectionHowItWork/SectionHowItWork'
import SectionPromo1 from '@/components/SectionPromo1'
import SectionPromo2 from '@/components/SectionPromo2'
import SectionSliderLargeProduct from '@/components/SectionSliderLargeProduct'
import SectionSliderProductCard from '@/components/SectionSliderProductCard'
import SectionMagazine5 from '@/components/blog/SectionMagazine5'
import { Button } from '@/shared/Button/Button'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import useSWR from 'swr'
import axios from 'axios'

// Fetcher function for SWR
const fetcher = (url: string) => axios.get(url).then(res => res.data)

// Accept data as props from server component
interface PageHomeProps {
  allCollections: any[]
  groupCollections: any[]
  products: any[]
  blogPosts: any[]
}

function PageHome({ allCollections, groupCollections, products, blogPosts }: PageHomeProps) {
  const departmentCollections = allCollections.slice(11, 15)
  const featuredCollections = allCollections.slice(7, 11)
  const carouselProducts1 = products.slice(0, 5)
  const carouselProducts2 = products.slice(3, 10)
  const carouselProducts3 = products.slice(1, 5)

  // Now useSWR works because this is NOT an async function
  const { data: fetchProducts, error, isLoading } = useSWR('/api/products', fetcher)

  if (error) {
    console.error('Error fetching products:', error)
  }

  return (
    <div className="nc-PageHome relative overflow-hidden">
      <SectionHero2 />
      <SectionCollectionSlider className="mt-24 lg:mt-32" collections={featuredCollections} />

      <div className="relative container my-24 flex flex-col gap-y-24 lg:my-32 lg:gap-y-32">
        <SectionSliderProductCard data={carouselProducts1} />
        <Divider />
        <div className="pb-16">
          <StrengthAdvantage />
        </div>
        <SectionPromo1 />
        <div className="relative  pb-20 ">
          <BackgroundSection />
          <SectionGridMoreExplore groupCollections={groupCollections} />
        </div>
        <SectionSliderProductCard
          data={carouselProducts2}
          heading="Best Sellers"
          subHeading="Best selling of the month"
        />
        <SectionPromo2 />
        <SectionSliderLargeProduct products={carouselProducts3} />
        <SectionGridFeatureItems  />
        <Divider />
        <SectionCollectionSlider2 collections={departmentCollections} />
        <Divider />
        <div>
          <Heading headingDim="From the Gibbon blog">The latest news</Heading>
          <SectionMagazine5 posts={blogPosts} />
          <div className="mt-20 flex justify-center">
            <Button href="/blogs" outline>
              Show all blog articles
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Divider />
        <SectionClientSay />
      </div>
    </div>
  )
}

export default PageHome