import { NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import FAQ from '@/models/FAQ';
import FAQCategory from '@/models/FAQCategory';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDb();

    const [categories, faqs] = await Promise.all([
      FAQCategory.find({ isActive: true }).sort({ order: 1 }).lean(),
      FAQ.find({ isActive: true }).populate('category').sort({ order: 1 }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        categories,
        faqs,
      },
    });
  } catch (error: any) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
