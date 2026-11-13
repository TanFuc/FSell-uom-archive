import manifest from '../manifest'

export const revalidate = 3600

export function GET(): Response {
  return Response.json(manifest(), {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
