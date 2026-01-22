/**
 * Remove Vietnamese accents from text for flexible searching
 * Converts: "Bình Hoa" -> "binh hoa"
 */
export function removeVietnameseAccents(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

/**
 * Create flexible search query that works with or without Vietnamese accents
 * Returns array of OR conditions for Prisma
 */
export function createFlexibleSearchConditions(
  searchTerm: string,
  fields: string[]
): any[] {
  const normalizedSearch = removeVietnameseAccents(searchTerm)
  
  const conditions: any[] = []
  
  fields.forEach(field => {
    // Search with original term (case insensitive)
    conditions.push({
      [field]: { contains: searchTerm, mode: 'insensitive' }
    })
    
    // If search term contains Vietnamese characters, also search normalized
    if (normalizedSearch !== searchTerm.toLowerCase()) {
      conditions.push({
        [field]: { contains: normalizedSearch, mode: 'insensitive' }
      })
    }
  })
  
  return conditions
}
