'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useBranding, useUpdateBranding } from '@/hooks/use-settings'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { optimizeAndResizeImage } from '@/lib/image-upload'

const brandingSchema = z.object({
  brandNameVi: z.string().min(1, 'Brand name (VI) is required'),
  brandNameEn: z.string().min(1, 'Brand name (EN) is required'),
  brandTaglineVi: z.string().optional(),
  brandTaglineEn: z.string().optional(),
  siteTitleVi: z.string().min(1, 'Site title (VI) is required'),
  siteTitleEn: z.string().min(1, 'Site title (EN) is required'),
  siteDescriptionVi: z.string().optional(),
  siteDescriptionEn: z.string().optional(),
  logoUrl: z.string().optional(),
  loadingText: z.string().min(1, 'Loading text is required'),
})

type BrandingFormValues = z.infer<typeof brandingSchema>

export default function BrandingPage() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const { toast } = useToast()
  const { data: branding, isLoading } = useBranding()
  const updateBranding = useUpdateBranding()
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      brandNameVi: 'ƯƠM. Archive',
      brandNameEn: 'ƯƠM. Archive',
      brandTaglineVi: '',
      brandTaglineEn: '',
      siteTitleVi: 'ƯƠM. Archive - Gốm sứ thủ công Việt Nam',
      siteTitleEn: 'ƯƠM. Archive - Handcrafted Ceramics from Vietnam',
      siteDescriptionVi: '',
      siteDescriptionEn: '',
      logoUrl: '',
      loadingText: 'ƯƠM.',
    },
  })

  useEffect(() => {
    if (branding) {
      form.reset({
        brandNameVi: branding.brandNameVi,
        brandNameEn: branding.brandNameEn,
        brandTaglineVi: branding.brandTaglineVi,
        brandTaglineEn: branding.brandTaglineEn,
        siteTitleVi: branding.siteTitleVi,
        siteTitleEn: branding.siteTitleEn,
        siteDescriptionVi: branding.siteDescriptionVi,
        siteDescriptionEn: branding.siteDescriptionEn,
        logoUrl: branding.logoUrl,
        loadingText: branding.loadingText,
      })
    }
  }, [branding, form])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    try {
      const optimizedFile = await optimizeAndResizeImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.9,
        outputType: 'image/webp',
      })
      const { url } = await api.uploadImage(optimizedFile, 'branding')
      form.setValue('logoUrl', url)
      toast({ title: t('success'), description: t('branding.logoUploaded') })
    } catch {
      toast({
        title: t('error'),
        description: t('branding.logoUploadFailed'),
        variant: 'destructive',
      })
    } finally {
      setIsUploadingLogo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: BrandingFormValues) => {
    updateBranding.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">{t('loading')}...</span>
      </div>
    )
  }

  const logoUrl = form.watch('logoUrl')
  const loadingText = form.watch('loadingText')
  const brandNameVi = form.watch('brandNameVi')
  const brandNameEn = form.watch('brandNameEn')
  const brandTaglineVi = form.watch('brandTaglineVi')
  const brandTaglineEn = form.watch('brandTaglineEn')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">{t('branding.title')}</h1>
        <p className="text-muted-foreground">{t('branding.description')}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="uppercase tracking-wide">{t('branding.logoSection')}</CardTitle>
              <CardDescription>{t('branding.logoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {logoUrl && (
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <Image
                    src={logoUrl}
                    alt="Logo preview"
                    width={160}
                    height={60}
                    className="h-14 w-auto object-contain"
                    unoptimized
                  />
                  <span className="text-sm text-muted-foreground">{t('branding.currentLogo')}</span>
                </div>
              )}

              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? t('loading') : t('branding.uploadLogo')}
                </Button>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => form.setValue('logoUrl', '')}
                  >
                    {t('branding.removeLogo')}
                  </Button>
                )}
              </div>

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('branding.logoUrl')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
                    </FormControl>
                    <FormDescription>{t('branding.logoUrlHint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Brand Name */}
          <Card>
            <CardHeader>
              <CardTitle className="uppercase tracking-wide">
                {t('branding.brandNameSection')}
              </CardTitle>
              <CardDescription>{t('branding.brandNameDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="brandNameVi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('branding.brandNameVi')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ƯƠM. Archive" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brandNameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('branding.brandNameEn')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ƯƠM. Archive" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brandTaglineVi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('branding.brandTaglineVi')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Gốm sứ thủ công Việt Nam" />
                    </FormControl>
                    <FormDescription>{t('branding.brandTaglineDesc')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brandTaglineEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('branding.brandTaglineEn')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Handcrafted Ceramics from Vietnam" />
                    </FormControl>
                    <FormDescription>{t('branding.brandTaglineDesc')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="uppercase tracking-wide">
                {t('branding.previewTitle')}
              </CardTitle>
              <CardDescription>{t('branding.previewDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="rounded-lg border bg-background p-6 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                {locale === 'vi' ? brandNameVi || 'ƯƠM. Archive' : brandNameEn || 'ƯƠM. Archive'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {locale === 'vi'
                  ? brandTaglineVi || t('branding.taglinePlaceholder')
                  : brandTaglineEn || t('branding.taglinePlaceholder')}
              </p>
            </CardContent>
          </Card>

          {/* SEO Titles */}
          <Card>
            <CardHeader>
              <CardTitle className="uppercase tracking-wide">{t('branding.seoSection')}</CardTitle>
              <CardDescription>{t('branding.seoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="siteTitleVi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('branding.siteTitleVi')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ƯƠM. Archive - Gốm sứ thủ công Việt Nam" />
                      </FormControl>
                      <FormDescription>{t('branding.siteTitleHint')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="siteTitleEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('branding.siteTitleEn')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ƯƠM. Archive - Handcrafted Ceramics" />
                      </FormControl>
                      <FormDescription>{t('branding.siteTitleHint')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="siteDescriptionVi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('branding.siteDescVi')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mô tả ngắn về website..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="siteDescriptionEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('branding.siteDescEn')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Short description of the website..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Loading Screen */}
          <Card>
            <CardHeader>
              <CardTitle className="uppercase tracking-wide">
                {t('branding.loadingSection')}
              </CardTitle>
              <CardDescription>{t('branding.loadingDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="loadingText"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>{t('branding.loadingText')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ƯƠM." />
                    </FormControl>
                    <FormDescription>{t('branding.loadingTextHint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Live preview */}
              <div className="rounded-lg border bg-background p-6 text-center">
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  {t('branding.loadingPreview')}
                </p>
                <h2 className="animate-pulse font-playfair text-4xl font-bold tracking-widest text-foreground">
                  {loadingText || 'ƯƠM.'}
                </h2>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={updateBranding.isPending}>
            {updateBranding.isPending ? t('loading') : t('save')}
          </Button>
        </form>
      </Form>
    </div>
  )
}
