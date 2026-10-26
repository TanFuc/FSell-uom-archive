'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { DEFAULT_SOCIAL_LINKS, DEFAULT_EXCHANGE_RATE } from '@/lib/constants'
import { FileUpload } from '@/components/FileUpload'
import { QrCode, Building, CreditCard, User, Trash2 } from 'lucide-react'
import { ProductTrustBadgesManager } from '@/components/admin/ProductTrustBadgesManager'

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
  const locale = useLocale()
  const t = useTranslations('admin')
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingSocial, setIsSavingSocial] = useState(false)
  const [isSavingRate, setIsSavingRate] = useState(false)
  const [isRecalculatingUsd, setIsRecalculatingUsd] = useState(false)

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState({
    qrCodeUrl: '',
    bankName: 'MB Bank',
    accountNumber: '',
    accountHolder: '',
    transferInstruction: 'Vui lòng ghi rõ nội dung chuyển khoản là [Mã đơn hàng] để hệ thống xử lý nhanh chóng.',
    transferTemplates: [] as { id: string; name: string; content: string }[],
    activeTemplateId: '',
  })
  const [isSavingPayment, setIsSavingPayment] = useState(false)

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
        const [social, rate, payment] = await Promise.all([
          api.getSocialLinks(),
          api.getExchangeRate(),
          api.getPaymentSettings(),
        ])

        socialForm.reset({
          facebookPageUrl: social.facebookPageUrl || '',
          instagramUsername: social.instagramUsername || '',
        })

        rateForm.reset({ rate: rate.rate })

        if (payment) {
          setPaymentSettings({
            qrCodeUrl: payment.qrCodeUrl || '',
            bankName: payment.bankName || 'MB Bank',
            accountNumber: payment.accountNumber || '',
            accountHolder: payment.accountHolder || '',
            transferInstruction: payment.transferInstruction || '',
            transferTemplates: Array.isArray(payment.transferTemplates) ? payment.transferTemplates : [],
            activeTemplateId: payment.activeTemplateId || '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [socialForm, rateForm])

  const onSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingPayment(true)
    try {
      await api.updatePaymentSettings(paymentSettings)
      toast({
        title: locale === 'vi' ? 'Thành công' : 'Success',
        description: locale === 'vi' ? 'Đã lưu cấu hình thanh toán chuyển khoản' : 'Payment settings saved',
      })
    } catch {
      toast({
        title: locale === 'vi' ? 'Lỗi' : 'Error',
        description: locale === 'vi' ? 'Không thể lưu cấu hình thanh toán' : 'Failed to save payment settings',
        variant: 'destructive',
      })
    } finally {
      setIsSavingPayment(false)
    }
  }

  const onSubmitSocial = async (data: SocialLinksFormValues) => {
    setIsSavingSocial(true)
    try {
      await api.updateSocialLinks({
        facebookPageUrl: data.facebookPageUrl || '',
        instagramUsername: data.instagramUsername,
      })
      toast({ title: t('success'), description: t('socialLinksUpdated') })
    } catch (error) {
      toast({ title: t('error'), description: t('failedToUpdate'), variant: 'destructive' })
    } finally {
      setIsSavingSocial(false)
    }
  }

  const onSubmitRate = async (data: ExchangeRateFormValues) => {
    setIsSavingRate(true)
    try {
      const result = await api.updateExchangeRate(data.rate)
      const updatedCount = result.updatedProducts ?? 0
      toast({
        title: t('success'),
        description:
          locale === 'vi'
            ? `Đã cập nhật tỷ giá. Đã tính toán lại cho ${updatedCount} sản phẩm.`
            : `Exchange rate updated. Recalculated ${updatedCount} products.`,
      })
    } catch (error) {
      toast({ title: t('error'), description: t('failedToUpdate'), variant: 'destructive' })
    } finally {
      setIsSavingRate(false)
    }
  }

  const onRecalculateUsd = async () => {
    setIsRecalculatingUsd(true)
    try {
      const result = await api.recalculateUsdPrices()
      toast({
        title: t('success'),
        description: t('recalculateUsdSuccess', {
          count: result.updatedProducts ?? 0,
          rate: result.rate.toLocaleString(),
        }),
      })
    } catch {
      toast({ title: t('error'), description: t('recalculateUsdFailed'), variant: 'destructive' })
    } finally {
      setIsRecalculatingUsd(false)
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
        <h1 className="font-serif text-2xl">{t('settings')}</h1>
        <p className="text-muted-foreground">{t('configureSettings')}</p>
      </div>

      <div className="grid gap-6">
        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="uppercase tracking-wide">{t('socialLinks')}</CardTitle>
            <CardDescription>{t('settingsDesc')}</CardDescription>
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
                      <FormDescription>{t('facebookUrlFormat')}</FormDescription>
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
                      <FormDescription>{t('instagramUsernameHint')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSavingSocial} className="w-full sm:w-auto">
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
            <CardDescription>{t('exchangeRateDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...rateForm}>
              <form onSubmit={rateForm.handleSubmit(onSubmitRate)} className="space-y-4">
                <FormField
                  control={rateForm.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem className="w-full sm:max-w-xs">
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

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="submit" disabled={isSavingRate} className="w-full sm:w-auto">
                    {isSavingRate ? t('loading') : t('save')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isRecalculatingUsd}
                    onClick={onRecalculateUsd}
                    className="w-full sm:w-auto"
                  >
                    {isRecalculatingUsd ? t('loading') : t('recalculateUsdPrices')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Cài đặt Thanh toán chuyển khoản (Mã QR & Tài khoản ngân hàng) */}
        <Card className="border border-neutral-200 shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#8C7E6A]" />
              <CardTitle className="uppercase tracking-wide text-sm font-semibold">
                {locale === 'vi' ? 'Thanh toán chuyển khoản & Mã QR' : 'Bank Transfer & QR Code'}
              </CardTitle>
            </div>
            <CardDescription>
              {locale === 'vi'
                ? 'Tải lên mã QR của cửa hàng và cấu hình số tài khoản ngân hàng để khách hàng chuyển tiền lúc đặt hàng (Non-COD).'
                : 'Upload shop QR code and configure bank account info for customer bank transfer orders.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmitPayment} className="space-y-6">
              {/* Ảnh Mã QR */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block">
                  {locale === 'vi' ? 'Ảnh Mã QR Chuyển khoản' : 'QR Code Image'}
                </label>

                {paymentSettings.qrCodeUrl ? (
                  <div className="flex items-center gap-4 p-3 bg-neutral-50 border border-neutral-200 max-w-md">
                    <div className="w-24 h-24 bg-white border border-neutral-200 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={paymentSettings.qrCodeUrl}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-neutral-600">
                        {locale === 'vi'
                          ? 'Mã QR đang hoạt động trên trang thanh toán của khách hàng.'
                          : 'Active QR code displayed at checkout.'}
                      </p>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs flex items-center gap-1"
                        onClick={() => setPaymentSettings((prev) => ({ ...prev, qrCodeUrl: '' }))}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{locale === 'vi' ? 'Xóa ảnh' : 'Remove'}</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-md">
                    <FileUpload
                      onUploadSuccess={(url) => {
                        setPaymentSettings((prev) => ({ ...prev, qrCodeUrl: url }))
                        toast({
                          title: locale === 'vi' ? 'Đã tải ảnh lên' : 'Image uploaded',
                          description: locale === 'vi' ? 'Nhấn "Lưu cấu hình thanh toán" để áp dụng.' : 'Click Save to apply.',
                        })
                      }}
                      folder="payments"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">
                      {locale === 'vi'
                        ? 'Nếu không tải ảnh lên, hệ thống sẽ tự động tạo VietQR theo Số tài khoản & Ngân hàng bên dưới.'
                        : 'If no image is uploaded, VietQR will be automatically generated from bank info.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Thông tin tài khoản ngân hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#8C7E6A]" />
                    <span>{locale === 'vi' ? 'Tên ngân hàng' : 'Bank Name'}</span>
                  </label>
                  <Input
                    value={paymentSettings.bankName}
                    onChange={(e) =>
                      setPaymentSettings((prev) => ({ ...prev, bankName: e.target.value }))
                    }
                    placeholder="Ví dụ: MB Bank, Vietcombank, Techcombank..."
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#8C7E6A]" />
                    <span>{locale === 'vi' ? 'Số tài khoản' : 'Account Number'}</span>
                  </label>
                  <Input
                    value={paymentSettings.accountNumber}
                    onChange={(e) =>
                      setPaymentSettings((prev) => ({ ...prev, accountNumber: e.target.value }))
                    }
                    placeholder="Ví dụ: 0987654321..."
                    className="text-xs font-mono font-medium"
                    required
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#8C7E6A]" />
                    <span>{locale === 'vi' ? 'Tên chủ tài khoản' : 'Account Holder Name'}</span>
                  </label>
                  <Input
                    value={paymentSettings.accountHolder}
                    onChange={(e) =>
                      setPaymentSettings((prev) => ({ ...prev, accountHolder: e.target.value }))
                    }
                    placeholder="Ví dụ: NGUYEN VAN A / UOM ARCHIVE..."
                    className="text-xs uppercase font-medium"
                    required
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700">
                    {locale === 'vi' ? 'Hướng dẫn chuyển khoản' : 'Transfer Instructions'}
                  </label>
                  <Textarea
                    value={paymentSettings.transferInstruction}
                    onChange={(e) =>
                      setPaymentSettings((prev) => ({
                        ...prev,
                        transferInstruction: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Vui lòng ghi rõ nội dung chuyển khoản là [Mã đơn hàng] để hệ thống xử lý nhanh chóng."
                    className="text-xs resize-none"
                  />
                </div>
              </div>

              <div className="space-y-4 border-t border-neutral-200 pt-5">
                <div>
                  <h3 className="text-sm font-semibold text-[#4A4238]">Mẫu nội dung chuyển khoản</h3>
                  <p className="text-xs text-neutral-500">Dùng {'{orderNumber}'} cho mã đơn và {'{totalVND}'} cho số tiền. Chọn một mẫu để hiển thị cạnh QR.</p>
                </div>
                {paymentSettings.transferTemplates.map((template, index) => (
                  <div key={template.id} className="grid gap-3 rounded border border-neutral-200 p-3 sm:grid-cols-[1fr_2fr_auto]">
                    <Input aria-label="Tên mẫu" value={template.name} placeholder="Tên mẫu" onChange={(event) => setPaymentSettings((prev) => ({ ...prev, transferTemplates: prev.transferTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) }))} />
                    <Input aria-label="Nội dung mẫu" value={template.content} placeholder="VD: UOM {orderNumber}" onChange={(event) => setPaymentSettings((prev) => ({ ...prev, transferTemplates: prev.transferTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, content: event.target.value } : item) }))} />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs whitespace-nowrap"><input type="radio" name="activeTemplate" checked={paymentSettings.activeTemplateId === template.id} onChange={() => setPaymentSettings((prev) => ({ ...prev, activeTemplateId: template.id }))} /> Đang dùng</label>
                      <Button type="button" size="sm" variant="outline" aria-label="Xóa mẫu" onClick={() => setPaymentSettings((prev) => ({ ...prev, transferTemplates: prev.transferTemplates.filter((item) => item.id !== template.id), activeTemplateId: prev.activeTemplateId === template.id ? '' : prev.activeTemplateId }))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setPaymentSettings((prev) => ({ ...prev, transferTemplates: [...prev.transferTemplates, { id: crypto.randomUUID(), name: '', content: '{orderNumber}' }] }))}>Thêm mẫu</Button>
              </div>

              <Button
                type="submit"
                disabled={isSavingPayment}
                className="w-full sm:w-auto bg-[#4A4238] hover:bg-[#8C7E6A] text-white"
              >
                {isSavingPayment
                  ? locale === 'vi'
                    ? 'Đang lưu...'
                    : 'Saving...'
                  : locale === 'vi'
                  ? 'Lưu cấu hình thanh toán'
                  : 'Save Payment Settings'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Product Trust Badges Manager */}
        <ProductTrustBadgesManager />
      </div>
    </div>
  )
}
