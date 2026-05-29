import { NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import FAQCategory from '@/models/FAQCategory';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDb();
    const categories = await FAQCategory.find().sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDb();
    const body = await request.json();
    const category = await FAQCategory.create(body);
    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDb();
    const body = await request.json();
    const { _id, ...updateData } = body;
    const category = await FAQCategory.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await FAQCategory.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
