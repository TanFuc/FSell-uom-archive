'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form'
import { api } from '@/lib/api'
import { ThemeSettings } from '@/lib/types'
import { DEFAULT_THEME } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'

const themeSchema = z.object({
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
})

type ThemeFormValues = z.infer<typeof themeSchema>

export default function ThemePage() {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ThemeFormValues>({
    resolver: zodResolver(themeSchema),
    defaultValues: DEFAULT_THEME,
  })

  const watchedValues = form.watch()

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const theme = await api.getTheme()
        form.reset({
          backgroundColor: theme.backgroundColor,
          textColor: theme.textColor,
          accentColor: theme.accentColor,
        })
      } catch (error) {
        console.error('Failed to fetch theme:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTheme()
  }, [form])

  const onSubmit = async (data: ThemeFormValues) => {
    setIsSaving(true)
    try {
      await api.updateTheme(data)
      toast({ title: t('success'), description: 'Theme updated' })
    } catch (error) {
      toast({ title: t('error'), description: 'Failed to update theme', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const resetToDefault = () => {
    form.reset(DEFAULT_THEME)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">{t('loading')}...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">{t('theme')}</h1>
          <p className="text-muted-foreground">Customize website colors</p>
        </div>
        <Button variant="outline" onClick={resetToDefault}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset to Default
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="uppercase tracking-wide">Color Settings</CardTitle>
            <CardDescription>Click on color boxes to change colors</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="backgroundColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Background Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="h-10 w-14 cursor-pointer border-0 p-0"
                          />
                          <Input {...field} className="flex-1" />
                        </div>
                      </FormControl>
                      <FormDescription>Main background color (default: cream)</FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="textColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Text Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="h-10 w-14 cursor-pointer border-0 p-0"
                          />
                          <Input {...field} className="flex-1" />
                        </div>
                      </FormControl>
                      <FormDescription>Primary text color (default: brown)</FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accentColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accent Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="h-10 w-14 cursor-pointer border-0 p-0"
                          />
                          <Input {...field} className="flex-1" />
                        </div>
                      </FormControl>
                      <FormDescription>Secondary/accent color (default: clay)</FormDescription>
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t('loading') : t('save')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="uppercase tracking-wide">Live Preview</CardTitle>
            <CardDescription>See how your changes will look</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="p-8 min-h-[300px] border"
              style={{ backgroundColor: watchedValues.backgroundColor }}
            >
              <div className="space-y-4">
                <h2
                  className="text-2xl font-serif"
                  style={{ color: watchedValues.textColor }}
                >
                  Ươm Archive
                </h2>
                <p style={{ color: watchedValues.textColor }}>
                  Discover timeless Vietnamese fashion pieces curated with care.
                </p>
                <p style={{ color: watchedValues.accentColor }}>
                  New collection available now
                </p>
                <div className="flex gap-4 pt-4">
                  <button
                    className="uppercase tracking-wide text-sm"
                    style={{ color: watchedValues.textColor }}
                  >
                    Shop Now
                  </button>
                  <button
                    className="uppercase tracking-wide text-sm"
                    style={{ color: watchedValues.accentColor }}
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
