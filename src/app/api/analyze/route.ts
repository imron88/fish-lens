import { NextRequest, NextResponse } from 'next/server';
import { runAnalysis } from '@/lib/engine';
import { traceRedirectChain } from '@/lib/security/tracer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input, type, traceRedirects } = body;

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Input is required for security analysis.' },
        { status: 400 }
      );
    }

    const report = runAnalysis(input.trim(), type);

    // If target is a URL and redirect tracing was requested
    if (report.inputType === 'url' && traceRedirects && report.target) {
      try {
        const trace = await traceRedirectChain(report.target, 5);
        report.redirectHops = trace.hops;
      } catch (err: unknown) {
        console.error('Redirect trace failed:', err);
      }
    }

    return NextResponse.json({ success: true, data: report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal analysis error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
