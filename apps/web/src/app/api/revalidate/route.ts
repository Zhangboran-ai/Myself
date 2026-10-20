import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest): Promise<Response> {
  const secret = process.env.REVALIDATE_SECRET;
  const provided =
    request.headers.get('x-revalidate-secret') ??
    new URL(request.url).searchParams.get('secret');

  if (!secret || provided !== secret) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const tag = new URL(request.url).searchParams.get('tag');
  if (!tag) {
    return Response.json({ ok: false, error: 'missing tag' }, { status: 400 });
  }

  revalidateTag(tag);
  return Response.json({ ok: true, tag });
}
