const INDEXNOW_KEY = process.env.INDEXNOW_KEY

export const revalidate = 3600

interface Params {
  params: {
    indexnowKey: string
  }
}

export async function GET(_request: Request, { params }: Params): Promise<Response> {
  if (!INDEXNOW_KEY) {
    return new Response('Not Found', { status: 404 })
  }

  if (params.indexnowKey !== INDEXNOW_KEY) {
    return new Response('Not Found', { status: 404 })
  }

  return new Response(INDEXNOW_KEY, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
