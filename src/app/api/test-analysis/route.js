import { NextResponse } from 'next/server';
import { getPeriodSpendingAnalysis } from '@/lib/analysis';

export async function GET() {
    try {
        const analysis = await getPeriodSpendingAnalysis(3);
        return NextResponse.json({ success: true, analysis });
    } catch (error) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
