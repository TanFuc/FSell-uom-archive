'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Upload, X, Languages } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { FileUpload } from '@/components/FileUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useSiteContent, useUpdateSiteContent } from '@/hooks/use-settings'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'

// Define the keys we manage on this page
const ABOUT_KEYS = [
  'about.heroTitle',
  'about.heroSubtitle',
  'about.storyTitle',
  'about.storyContent',
  'about.storyImage',
  'about.philosophyTitle',
  'about.philosophyDescription',
  'about.philosophyContent',
  'about.values.craft.title',
  'about.values.craft.description',
  'about.values.sustainability.title',
  'about.values.sustainability.description',
  'about.values.essence.title',
  'about.values.essence.description',
] as const

const formSchema = z.record(z.string())

export default function AdminAboutPage() {
  const t = useTranslations('admin')
  const { toast } = useToast()

  // Use hooks for fetching and updating
  const { data: content, isLoading } = useSiteContent()
  const { mutate: updateContent, isPending: isSaving } = useUpdateSiteContent()

  const [activeTab, setActiveTab] = useState('vi')

  const form = useForm<Record<string, string>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })

  // Initialize form when content loads
  useEffect(() => {
    if (content) {
      const values: Record<string, string> = {}
      ABOUT_KEYS.forEach((baseKey) => {
        values[`${baseKey}.vi`] = content[`${baseKey}.vi`] || ''
        values[`${baseKey}.en`] = content[`${baseKey}.en`] || ''
      })
      // Special case for image which might not have locale suffix or uses .en as fallback?
      // Actually image is usually shared, but structure suggests we might want localized images?
      // For simplicity, let's assume shared image stored in .en or just base key if API supports it.
      // But SiteContent is string->string. Let's use specific key for image without locale if possible,
      // or just default to 'en' key for shared assets.
      // Let's stick to locale keys for consistency:
      values['about.storyImage'] = content['about.storyImage'] || ''

      form.reset(values)
    }
  }, [content, form])

  const onSubmit = (data: Record<string, string>) => {
    updateContent(data)
  }

  if (isLoading) {
    return <div className="p-8 text-center">{t('loading')}...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl">{t('about.pageTitle')}</h1>
          <p className="text-muted-foreground">{t('about.pageDesc')}</p>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? t('loading') : t('save')}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="vi">{t('about.vietnamese')}</TabsTrigger>
              <TabsTrigger value="en">{t('about.english')}</TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-8">
              {/* Hero Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="uppercase tracking-wide">
                    {t('about.heroSection')}
                  </CardTitle>
                  <CardDescription>{t('about.heroSectionDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name={`about.heroTitle.${activeTab}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('about.title')} ({activeTab.toUpperCase()})
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={
                              activeTab === 'vi' ? 'VỀ ƯƠM. ARCHIVE' : 'ABOUT ƯƠM. ARCHIVE'
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`about.heroSubtitle.${activeTab}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('about.subtitle')} ({activeTab.toUpperCase()})
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Story Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="uppercase tracking-wide">
                    {t('about.storySection')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name={`about.storyTitle.${activeTab}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('about.sectionTitle')} ({activeTab.toUpperCase()})
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`about.storyContent.${activeTab}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('about.content')} ({activeTab.toUpperCase()})
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={6} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>{t('about.storyImage')}</FormLabel>
                    <FormField
                      control={form.control}
                      name="about.storyImage"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-end gap-4">
                            {field.value && (
                              <div className="relative h-40 w-32 overflow-hidden rounded border">
                                <Image
                                  src={getImageUrl(field.value)}
                                  alt={t('about.storyImage')}
                                  fill
                                  className="object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute right-1 top-1 h-6 w-6"
                                  onClick={() => field.onChange('')}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            <div className="flex-1">
                              <FileUpload
                                onUploadSuccess={(url) => field.onChange(url)}
                                onUploadError={(err) =>
                                  toast({
                                    title: t('error'),
                                    description: err,
                                    variant: 'destructive',
                                  })
                                }
                                acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
                                maxFileSize="5MB"
                              />
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Philosophy Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="uppercase tracking-wide">
                    {t('about.philosophySection')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name={`about.philosophyTitle.${activeTab}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('about.title')} ({activeTab.toUpperCase()})
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`about.philosophyDescription.${activeTab}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('about.shortDescription')} ({activeTab.toUpperCase()})
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`about.philosophyContent.${activeTab}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('about.fullContent')} ({activeTab.toUpperCase()})
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Values Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="uppercase tracking-wide">
                    {t('about.coreValuesSection')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
                  {['craft', 'sustainability', 'essence'].map((val) => (
                    <div key={val} className="space-y-4 rounded-lg border p-4">
                      <h3 className="font-medium capitalize">{t(`about.${val}`)}</h3>
                      <FormField
                        control={form.control}
                        name={`about.values.${val}.title.${activeTab}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('about.title')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`about.values.${val}.description.${activeTab}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('about.description')}</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </Tabs>
        </form>
      </Form>
    </div>
  )
}
