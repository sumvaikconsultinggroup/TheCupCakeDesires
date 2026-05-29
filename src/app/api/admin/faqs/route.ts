import { NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import FAQ from '@/models/FAQ';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDb();
    const faqs = await FAQ.find().populate('category').sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, data: faqs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDb();
    const body = await request.json();
    const faq = await FAQ.create(body);
    return NextResponse.json({ success: true, data: faq });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDb();
    const body = await request.json();
    const { _id, ...updateData } = body;
    const faq = await FAQ.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ success: true, data: faq });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await FAQ.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'FAQ deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
