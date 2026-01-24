# Product Section Layout Update Summary

## Overview
Updated the visual layout configuration for product carousels to display fewer items per viewport, making product images larger and more prominent. **This is a CSS-only change** - no data fetching logic was modified.

---

## Changes Made

### 1. Home Page - "Suggested for You" (NEW COLLECTIONS)

**Layout Update**: 3 items visible per viewport (previously 4)

**Files Modified**: `frontend/app/[locale]/page.tsx`

**CSS Changes**:
```tsx
// Before
className="w-[85vw] shrink-0 md:w-[40vw] lg:w-[23vw]"

// After
className="w-[85vw] shrink-0 md:w-[45vw] lg:w-[31vw]"
```

**Responsive Breakdown**:
- **Mobile** (`w-[85vw]`): 85% viewport width - 1 item visible + peek of next
- **Tablet** (`md:w-[45vw]`): 45% viewport width - ~2 items visible
- **Desktop** (`lg:w-[31vw]`): 31% viewport width - **3 items visible** (31% × 3 = 93%)

**Skeleton Loaders**: Updated to match (3 placeholders, same widths)

**Data Fetching**: Still fetches `limit: 3` products (unchanged)

---

### 2. Home Page - "Stories & Journal" (JOURNAL)

**Layout Update**: 2 items visible per viewport (previously 4)

**Files Modified**: `frontend/app/[locale]/page.tsx`

**CSS Changes**:
```tsx
// Before
className="w-[85vw] shrink-0 md:w-[40vw] lg:w-[23vw]"

// After
className="w-[85vw] shrink-0 md:w-[45vw] lg:w-[48vw]"
```

**Responsive Breakdown**:
- **Mobile** (`w-[85vw]`): 85% viewport width - 1 item visible + peek
- **Tablet** (`md:w-[45vw]`): 45% viewport width - ~2 items visible
- **Desktop** (`lg:w-[48vw]`): 48% viewport width - **2 large items visible** (48% × 2 = 96%)

**Skeleton Loaders**: Updated to match (2 placeholders, same widths)

**Data Fetching**: Still fetches `limit: 2` products (unchanged)

**Impact**: Large, featured-style product images - perfect for editorial/journal aesthetic

---

### 3. Product Detail Page - "Related Pieces" (YOU MAY ALSO LIKE)

**Layout Update**: 4 items visible per viewport (optimized)

**Files Modified**: `frontend/app/[locale]/shop/[slug]/page.tsx`

**CSS Changes**:
```tsx
// Before
className="w-[85vw] shrink-0 md:w-[40vw] lg:w-[22vw]"

// After
className="w-[85vw] shrink-0 md:w-[45vw] lg:w-[23vw]"
```

**Responsive Breakdown**:
- **Mobile** (`w-[85vw]`): 85% viewport width - 1 item visible + peek
- **Tablet** (`md:w-[45vw]`): 45% viewport width - ~2 items visible
- **Desktop** (`lg:w-[23vw]`): 23% viewport width - **4 items visible** (23% × 4 = 92%)

**Data Fetching**: Still fetches `limit: 4` products (unchanged)

---

## What Was NOT Changed

✅ **Data Fetching Logic**: All API calls remain identical
- NEW COLLECTIONS: `limit: 3`
- JOURNAL: `limit: 2`
- Related Pieces: `limit: 4`

✅ **Carousel Functionality**: Fully preserved
- Horizontal smooth scrolling
- Mouse drag interaction
- Touch/swipe gestures on mobile
- Momentum scrolling
- Premium animations (framer-motion)
- Progress tracking

✅ **Component Architecture**: No structural changes
- Separate scroll handlers for each section (`latestDrag`, `featuredDrag`)
- Independent sections with different configurations
- Same ProductCard component used throughout

---

## Technical Implementation

### Approach: CSS Viewport Width (vw) Units

Used Tailwind's arbitrary values with viewport width units to control how many items fit in the visible area:

**Formula**: `Item Width × Items Per Row ≈ 90-96%`

| Items Per Row | Desktop Width | Calculation |
|---------------|---------------|-------------|
| 2 items       | `lg:w-[48vw]` | 48% × 2 = 96% |
| 3 items       | `lg:w-[31vw]` | 31% × 3 = 93% |
| 4 items       | `lg:w-[23vw]` | 23% × 4 = 92% |

The remaining 4-8% accounts for gaps between items (`gap-6` = 1.5rem).

### Responsive Strategy

- **Mobile**: Always show ~1 item (85vw) with a peek of the next item to indicate scrollability
- **Tablet**: Show ~2 items (45vw) for better use of medium screens
- **Desktop**: Show the target number (2, 3, or 4) based on section purpose

---

## Visual Impact

### Before:
- NEW COLLECTIONS: 4 smaller items per row
- JOURNAL: 4 smaller items per row
- Related Pieces: ~4 items per row

### After:
- NEW COLLECTIONS: **3 larger items per row** (+33% image size)
- JOURNAL: **2 much larger items per row** (+100% image size)
- Related Pieces: **4 optimized items per row** (maintained)

---

## Build Verification

✅ **Build Status**: All 37 routes compile successfully
✅ **TypeScript**: No type errors
✅ **Bundle Size**: Optimized (no increase - CSS-only change)

---

## Future Enhancements (Optional)

If you need more flexibility in the future, consider creating a reusable `ProductCarousel` component:

```tsx
interface ProductCarouselProps {
  products: Product[]
  itemsPerRow: 2 | 3 | 4
  locale: 'vi' | 'en'
  // ... other props
}

export function ProductCarousel({ products, itemsPerRow, locale }: ProductCarouselProps) {
  const widthMap = {
    2: 'lg:w-[48vw]',
    3: 'lg:w-[31vw]',
    4: 'lg:w-[23vw]',
  }

  const itemWidth = widthMap[itemsPerRow]

  // ... rest of implementation
}
```

This would centralize the carousel logic and make future layout adjustments even easier.

---

## Testing Checklist

- [ ] Verify NEW COLLECTIONS shows 3 items on desktop
- [ ] Verify JOURNAL shows 2 large items on desktop
- [ ] Verify Related Pieces shows 4 items on desktop
- [ ] Test horizontal scrolling works on all sections
- [ ] Test drag/swipe interactions on desktop/mobile
- [ ] Verify responsive behavior on tablet (768px-1024px)
- [ ] Verify mobile view shows 1 item + peek
- [ ] Check skeleton loaders match item count and widths

---

**Date**: 2026-01-25
**Status**: ✅ Complete - Build verified
