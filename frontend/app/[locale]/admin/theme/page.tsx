'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ThemePage() {
  const t = useTranslations('admin')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">{t('theme')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="uppercase tracking-wide">Feature Temporarily Disabled</CardTitle>
          <CardDescription>
            Giao diện thay doi mau sac website tam thoi duoc an de dam bao on dinh he thong.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ban van co the quan ly san pham, danh muc, banner, branding va cac cai dat khac trong
            admin.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
