import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import NavigationItem from '@/models/NavigationItem'

export const dynamic = 'force-dynamic'

// Default navigation structure matching MegaHeader
const defaultNavigation = [
  {
    name: 'Whey Protein',
    href: '/collections/whey-protein',
    slug: 'whey-protein',
    type: 'category',
    order: 1,
    icon: 'dumbbell',
    badge: 'Popular',
    badgeColor: '#1B198F',
    description: 'Premium protein for muscle growth',
    showInHeader: true,
    showInFooter: true,
    showInMobile: true,
    children: [
      { name: 'Whey Protein Isolate', href: '/collections/whey-isolate', slug: 'whey-isolate', badge: 'Pure', badgeColor: '#10b981' },
      { name: 'Whey Protein Concentrate', href: '/collections/whey-concentrate', slug: 'whey-concentrate' },
      { name: 'Whey Protein Blend', href: '/collections/whey-blend', slug: 'whey-blend' },
      { name: 'Plant Protein', href: '/collections/plant-protein', slug: 'plant-protein', badge: 'Vegan', badgeColor: '#22c55e' },
    ]
  },
  {
    name: 'Pre-Workout',
    href: '/collections/pre-workout',
    slug: 'pre-workout',
    type: 'category',
    order: 2,
    icon: 'zap',
    badge: 'Energy',
    badgeColor: '#f59e0b',
    description: 'Explosive energy for intense workouts',
    showInHeader: true,
    showInFooter: true,
    showInMobile: true,
    children: [
      { name: 'Stimulant Pre-Workout', href: '/collections/stimulant-pre', slug: 'stimulant-pre', badge: 'High Caffeine', badgeColor: '#ef4444' },
      { name: 'Non-Stimulant Pre-Workout', href: '/collections/non-stim-pre', slug: 'non-stim-pre' },
      { name: 'Pump Formula', href: '/collections/pump-formula', slug: 'pump-formula' },
    ]
  },
  {
    name: 'Mass Gainer',
    href: '/collections/mass-gainer',
    slug: 'mass-gainer',
    type: 'category',
    order: 3,
    icon: 'trending-up',
    badge: 'Bulk',
    badgeColor: '#8b5cf6',
    description: 'High-calorie formula for mass gain',
    showInHeader: true,
    showInFooter: true,
    showInMobile: true,
    children: [
      { name: 'High Calorie Gainer', href: '/collections/high-calorie-gainer', slug: 'high-calorie-gainer' },
      { name: 'Lean Mass Gainer', href: '/collections/lean-mass-gainer', slug: 'lean-mass-gainer' },
    ]
  },
  {
    name: 'BCAA & Aminos',
    href: '/collections/bcaa',
    slug: 'bcaa-aminos',
    type: 'category',
    order: 4,
    icon: 'activity',
    description: 'Essential amino acids for recovery',
    showInHeader: true,
    showInFooter: true,
    showInMobile: true,
    children: [
      { name: 'BCAA 2:1:1', href: '/collections/bcaa-211', slug: 'bcaa-211' },
      { name: 'BCAA 4:1:1', href: '/collections/bcaa-411', slug: 'bcaa-411' },
      { name: 'EAA', href: '/collections/eaa', slug: 'eaa', badge: 'Complete', badgeColor: '#06b6d4' },
      { name: 'L-Glutamine', href: '/collections/glutamine', slug: 'glutamine' },
    ]
  },
  {
    name: 'Creatine',
    href: '/collections/creatine',
    slug: 'creatine',
    type: 'category',
    order: 5,
    icon: 'zap',
    badge: 'Strength',
    badgeColor: '#ec4899',
    description: 'Power and strength booster',
    showInHeader: true,
    showInFooter: true,
    showInMobile: true,
    children: [
      { name: 'Creatine Monohydrate', href: '/collections/creatine-monohydrate', slug: 'creatine-monohydrate' },
      { name: 'Creatine HCL', href: '/collections/creatine-hcl', slug: 'creatine-hcl' },
      { name: 'Micronized Creatine', href: '/collections/micronized-creatine', slug: 'micronized-creatine' },
    ]
  },
  {
    name: 'Vitamins',
    href: '/collections/vitamins',
    slug: 'vitamins',
    type: 'category',
    order: 6,
    icon: 'heart',
    description: 'Essential vitamins and minerals',
    showInHeader: true,
    showInFooter: true,
    showInMobile: true,
    children: [
      { name: 'Multivitamins', href: '/collections/multivitamins', slug: 'multivitamins' },
      { name: 'Omega-3 Fish Oil', href: '/collections/omega-3', slug: 'omega-3' },
      { name: 'Vitamin D3', href: '/collections/vitamin-d3', slug: 'vitamin-d3' },
      { name: 'Zinc & Magnesium', href: '/collections/zinc-magnesium', slug: 'zinc-magnesium' },
    ]
  },
  {
    name: 'Fat Burners',
    href: '/collections/fat-burners',
    slug: 'fat-burners',
    type: 'category',
    order: 7,
    icon: 'flame',
    badge: 'Hot',
    badgeColor: '#ef4444',
    description: 'Accelerate fat loss',
    showInHeader: true,
    showInFooter: false,
    showInMobile: true,
    children: [
      { name: 'Thermogenic Fat Burners', href: '/collections/thermogenic', slug: 'thermogenic' },
      { name: 'L-Carnitine', href: '/collections/l-carnitine', slug: 'l-carnitine' },
      { name: 'CLA', href: '/collections/cla', slug: 'cla' },
    ]
  },
  {
    name: 'Bestsellers',
    href: '/collections/bestsellers',
    slug: 'bestsellers',
    type: 'link',
    order: 8,
    badge: 'Top Rated',
    badgeColor: '#f59e0b',
    showInHeader: true,
    showInFooter: true,
    showInMobile: true,
  },
  {
    name: 'New Arrivals',
    href: '/collections/new',
    slug: 'new-arrivals',
    type: 'link',
    order: 9,
    badge: 'New',
    badgeColor: '#10b981',
    showInHeader: true,
    showInFooter: true,
    showInMobile: true,
  },
  {
    name: 'Offers',
    href: '/collections/offers',
    slug: 'offers',
    type: 'link',
    order: 10,
    badge: 'Sale',
    badgeColor: '#ef4444',
    showInHeader: true,
    showInFooter: true,
    showInMobile: true,
  },
]

export async function POST() {
  try {
    await connectDb()
    
    // Check if navigation already has items
    const existingCount = await NavigationItem.countDocuments()
    
    if (existingCount > 0) {
      return NextResponse.json({ 
        success: false, 
        message: `Navigation already has ${existingCount} items. Delete them first to re-seed.`,
        count: existingCount
      })
    }
    
    const createdItems: any[] = []
    
    // Create parent items first
    for (const nav of defaultNavigation) {
      const parentItem = await NavigationItem.create({
        name: nav.name,
        href: nav.href,
        slug: nav.slug,
        type: nav.type || 'category',
        order: nav.order,
        icon: nav.icon,
        badge: nav.badge,
        badgeColor: nav.badgeColor,
        description: nav.description,
        showInHeader: nav.showInHeader,
        showInFooter: nav.showInFooter,
        showInMobile: nav.showInMobile,
        parent: null,
        isActive: true,
      })
      
      createdItems.push(parentItem)
      
      // Create children
      if (nav.children && nav.children.length > 0) {
        for (let i = 0; i < nav.children.length; i++) {
          const child = nav.children[i]
          const childItem = await NavigationItem.create({
            name: child.name,
            href: child.href,
            slug: child.slug,
            type: 'subcategory',
            order: i + 1,
            badge: child.badge,
            badgeColor: child.badgeColor,
            showInHeader: true,
            showInFooter: false,
            showInMobile: true,
            parent: parentItem._id,
            isActive: true,
          })
          createdItems.push(childItem)
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully created ${createdItems.length} navigation items`,
      count: createdItems.length
    })
  } catch (error: any) {
    console.error('Error seeding navigation:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed navigation' },
      { status: 500 }
    )
  }
}

// GET - Check navigation status
export async function GET() {
  try {
    await connectDb()
    const count = await NavigationItem.countDocuments()
    const rootCount = await NavigationItem.countDocuments({ parent: null })
    
    return NextResponse.json({
      success: true,
      totalItems: count,
      rootItems: rootCount,
      needsSeeding: count === 0
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
