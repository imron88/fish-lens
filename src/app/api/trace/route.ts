import { NextRequest, NextResponse } from 'next/server';
import { traceRedirectChain } from '@/lib/security/tracer';

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url');
  if (!urlParam) {
    return NextResponse.json(
      { success: false, error: 'Query parameter "url" is required.' },
      { status: 400 }
    );
  }

  return handleTrace(urlParam);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url;
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'JSON field "url" is required.' },
        { status: 400 }
      );
    }

    return handleTrace(url);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload.' },
      { status: 400 }
    );
  }
}

async function handleTrace(targetUrl: string) {
  try {
    const cleanUrl = targetUrl.trim();
    const result = await traceRedirectChain(cleanUrl, 5);
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Redirect trace error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
