import { NextRequest, NextResponse } from 'next/server';
import { getAuditEntries } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));

    const result = await getAuditEntries(page, pageSize);

    return NextResponse.json({
      entries: result.entries,
      total: result.total,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('[audit] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
