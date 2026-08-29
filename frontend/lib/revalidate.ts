const SITEMAP_REVALIDATE_SECRET =
  process.env.NEXT_PUBLIC_SITEMAP_REVALIDATE_SECRET ||
  process.env.SITEMAP_REVALIDATE_SECRET ||
  '7f97bbe5e41cb9bf455a5d123bb2f4567a8717d456da6e92b5810a2b6b4039b5'

export async function triggerPublicRevalidation(
  paths: string[] = ['/', '/shop', '/journal', '/about'],
) {
  if (typeof window === 'undefined') return
  try {
    void fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paths,
        secret: SITEMAP_REVALIDATE_SECRET,
      }),
    }).catch(() => {})
  } catch {}
}
