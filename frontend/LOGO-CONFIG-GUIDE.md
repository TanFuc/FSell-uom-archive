# LOGO & FAVICON CONFIGURATION GUIDE

## 📁 Logo Files Installed

The following logo files have been copied to `/public/assets/`:

- **logo.svg** - Vector logo (scalable, use for web)
- **logo-remove.png** - Logo with transparent background (header, UI)
- **logo.png** - Logo with background (social sharing, OG image)

---

## 🎨 Logo Usage in Components

### 1. Website Header/Navigation

```tsx
// components/layout/Header.tsx
import Image from 'next/image'
import Logo from '@/public/assets/logo.svg'

export function Header() {
  return (
    <header className="fixed top-0 left-0 p-4 z-10">
      <Link href="/">
        <Image 
          src={Logo}
          alt="Ươm Archive"
          width={120}
          height={40}
          priority
          className="object-contain"
        />
      </Link>
    </header>
  )
}
```

### 2. Smaller Logo (Product Pages)

```tsx
<Image 
  src={Logo}
  alt="Ươm"
  width={80}
  height={24}
  className="object-contain"
/>
```

### 3. Admin Dashboard

```tsx
<Image 
  src={Logo}
  alt="Ươm Archive Admin"
  width={160}
  height={48}
  className="object-contain"
/>
```

---

## 🌐 HTML Metadata Configuration

### Update `app/layout.tsx`

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Ươm Archive - Curated Vietnamese Fashion',
    template: '%s | Ươm Archive'
  },
  description: 'Discover timeless Vietnamese fashion pieces curated with care.',
  keywords: ['fashion', 'vietnamese', 'archive', 'minimalist', 'clothing'],
  authors: [{ name: 'Ươm Archive' }],
  creator: 'Ươm Archive',
  publisher: 'Ươm Archive',
  
  // Open Graph (Facebook, LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://uomarchive.com',
    title: 'Ươm Archive - Curated Vietnamese Fashion',
    description: 'Discover timeless Vietnamese fashion pieces curated with care.',
    siteName: 'Ươm Archive',
    images: [
      {
        url: '/assets/logo.png', // Use logo.png with background
        width: 1200,
        height: 630,
        alt: 'Ươm Archive Logo',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Ươm Archive',
    description: 'Discover timeless Vietnamese fashion pieces curated with care.',
    images: ['/assets/logo.png'],
    creator: '@uomarchive',
  },
  
  // Icons & Favicons
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  
  // Manifest for PWA
  manifest: '/manifest.json',
}
```

---

## 🖼️ Generate Favicons

### Option 1: Online Tool (Recommended)

1. Visit **[RealFaviconGenerator](https://realfavicongenerator.net/)**
2. Upload `logo.svg` or `logo-remove.png`
3. Configure settings:
   - **iOS:** Use logo on white background
   - **Android Chrome:** Use logo-remove.png (transparent)
   - **Windows Metro:** Use brand color (#4A4238)
4. Download and extract to `/public/` folder

### Option 2: Manual ImageMagick Commands

```bash
# Install ImageMagick first
# Windows: choco install imagemagick
# macOS: brew install imagemagick

cd frontend/public/assets

# Generate favicon.ico (16x16, 32x32, 48x48)
magick logo-remove.png -resize 48x48 -define icon:auto-resize="48,32,16" ../favicon.ico

# Generate PNG icons for web
magick logo-remove.png -resize 192x192 ../icon-192.png
magick logo-remove.png -resize 512x512 ../icon-512.png

# Generate Apple Touch Icon (180x180)
magick logo-remove.png -resize 180x180 ../apple-touch-icon.png

# Generate OG Image (1200x630) - use logo.png with background
magick logo.png -resize 1200x630 -gravity center -extent 1200x630 ../og-image.png
```

---

## 📱 PWA Manifest Configuration

Create `/public/manifest.json`:

```json
{
  "name": "Ươm Archive",
  "short_name": "Ươm",
  "description": "Curated Vietnamese Fashion Archive",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F9F7F1",
  "theme_color": "#4A4238",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

## ✅ Final Checklist

- [ ] Copy logo files to `/public/assets/` ✅ (Already done)
- [ ] Generate favicons using RealFaviconGenerator or ImageMagick
- [ ] Place favicons in `/public/` directory:
  - [ ] favicon.ico
  - [ ] icon-192.png
  - [ ] icon-512.png
  - [ ] apple-touch-icon.png
  - [ ] og-image.png (1200x630 for social sharing)
- [ ] Update `app/layout.tsx` with metadata
- [ ] Create `/public/manifest.json` for PWA
- [ ] Test favicons on:
  - [ ] Chrome (desktop & mobile)
  - [ ] Safari (iOS)
  - [ ] Firefox
  - [ ] Edge
- [ ] Test Open Graph preview:
  - [ ] Facebook Sharing Debugger
  - [ ] Twitter Card Validator
  - [ ] LinkedIn Post Inspector

---

## 🎯 Quick Start Commands

```bash
# Navigate to frontend directory
cd frontend

# Install ImageMagick (if needed)
# Windows PowerShell (Admin):
choco install imagemagick

# macOS:
brew install imagemagick

# Generate all icons (run from frontend/public/assets/)
magick logo-remove.png -resize 48x48 -define icon:auto-resize="48,32,16" ../favicon.ico
magick logo-remove.png -resize 192x192 ../icon-192.png
magick logo-remove.png -resize 512x512 ../icon-512.png
magick logo-remove.png -resize 180x180 ../apple-touch-icon.png
magick logo.png -resize 1200x630 -gravity center -extent 1200x630 ../og-image.png

# Test the site
npm run dev
```

---

## 📚 Resources

- [RealFaviconGenerator](https://realfavicongenerator.net/) - Generate all favicons
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Next.js Metadata Docs](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [PWA Manifest Generator](https://www.simicart.com/manifest-generator.html/)

---

## 🚨 Important Notes

1. **DO NOT use logo images for loading screen** - Use custom "Ươm." text animation instead
2. **SVG for web header** - Best quality, scalable
3. **PNG for social sharing** - Better compatibility with OG/Twitter cards
4. **Transparent background** - Use logo-remove.png for UI components
5. **Brand color** - Use #4A4238 (earthy brown) for theme color in manifest
6. **File size** - Optimize all PNGs using TinyPNG or ImageOptim before deployment
