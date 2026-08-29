export const PAGE_REVALIDATE_SECONDS = Number.parseInt(
  process.env.NEXT_PAGE_REVALIDATE_SECONDS || '30',
  10,
)

export const DATA_REVALIDATE_SECONDS = Number.parseInt(
  process.env.NEXT_DATA_REVALIDATE_SECONDS || '15',
  10,
)

export const BRANDING_REVALIDATE_SECONDS = Number.parseInt(
  process.env.NEXT_BRANDING_REVALIDATE_SECONDS || '15',
  10,
)

