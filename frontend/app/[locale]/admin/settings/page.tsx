'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api'
import { SocialLinks } from '@/lib/types'
import { DEFAULT_SOCIAL_LINKS, DEFAULT_EXCHANGE_RATE } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'

const socialLinksSchema = z.object({
  facebookPageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  instagramUsername: z.string().min(1, 'Instagram username is required'),
})

const exchangeRateSchema = z.object({
  rate: z.coerce.number().min(1, 'Rate must be positive'),
})

type SocialLinksFormValues = z.infer<typeof socialLinksSchema>
type ExchangeRateFormValues = z.infer<typeof exchangeRateSchema>

export default function SettingsPage() {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingSocial, setIsSavingSocial] = useState(false)
  const [isSavingRate, setIsSavingRate] = useState(false)

  const socialForm = useForm<SocialLinksFormValues>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: DEFAULT_SOCIAL_LINKS,
  })

  const rateForm = useForm<ExchangeRateFormValues>({
    resolver: zodResolver(exchangeRateSchema),
    defaultValues: { rate: DEFAULT_EXCHANGE_RATE },
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [social, rate] = await Promise.all([
          api.getSocialLinks(),
          api.getExchangeRate(),
        ])

        socialForm.reset({
          facebookPageUrl: social.facebookPageUrl || '',
          instagramUsername: social.instagramUsername || '',
        })

        rateForm.reset({ rate: rate.rate })
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [socialForm, rateForm])

  const onSubmitSocial = async (data: SocialLinksFormValues) => {
    setIsSavingSocial(true)
    try {
      await api.updateSocialLinks({
        facebookPageUrl: data.facebookPageUrl || '',
        instagramUsername: data.instagramUsername,
      })
      toast({ title: t('success'), description: 'Social links updated' })
    } catch (error) {
      toast({ title: t('error'), description: 'Failed to update', variant: 'destructive' })
    } finally {
      setIsSavingSocial(false)
    }
  }

  const onSubmitRate = async (data: ExchangeRateFormValues) => {
    setIsSavingRate(true)
    try {
      await api.updateExchangeRate(data.rate)
      toast({ title: t('success'), description: 'Exchange rate updated' })
    } catch (error) {
      toast({ title: t('error'), description: 'Failed to update', variant: 'destructive' })
    } finally {
      setIsSavingRate(false)
    }
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
      <div>
        <h1 className="text-2xl font-serif">{t('settings')}</h1>
        <p className="text-muted-foreground">{t('configureSettings')}</p>
      </div>

      <div className="grid gap-6">
        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="uppercase tracking-wide">{t('socialLinks')}</CardTitle>
            <CardDescription>
              {t('settingsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...socialForm}>
              <form onSubmit={socialForm.handleSubmit(onSubmitSocial)} className="space-y-4">
                <FormField
                  control={socialForm.control}
                  name="facebookPageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('facebookUrl')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://m.me/uomarchive" />
                      </FormControl>
                      <FormDescription>
                        {t('facebookUrlFormat')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={socialForm.control}
                  name="instagramUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('instagramUsername')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="uomarchive" />
                      </FormControl>
                      <FormDescription>
                        {t('instagramUsernameHint')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSavingSocial}>
                  {isSavingSocial ? t('loading') : t('save')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Exchange Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="uppercase tracking-wide">{t('exchangeRate')}</CardTitle>
            <CardDescription>
              {t('exchangeRateDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...rateForm}>
              <form onSubmit={rateForm.handleSubmit(onSubmitRate)} className="space-y-4">
                <FormField
                  control={rateForm.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem className="max-w-xs">
                      <FormLabel>{t('usdToVnd')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormDescription>
                        {t('currentRate', { rate: rateForm.watch('rate').toLocaleString() })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSavingRate}>
                  {isSavingRate ? t('loading') : t('save')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
