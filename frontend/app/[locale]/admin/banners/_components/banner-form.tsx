'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { Banner } from '@/lib/types'
import { optimizeProductImage } from '@/lib/utils'

const bannerSchema = z.object({
  titleVi: z.string().optional(),
  titleEn: z.string().optional(),
  subtitleVi: z.string().optional(),
  subtitleEn: z.string().optional(),
  descriptionVi: z.string().optional(),
  descriptionEn: z.string().optional(),
  imageUrl: z.string().min(1, 'Image is required'),
  mobileImageUrl: z.string().optional(),
  link: z.string().optional(),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  textColor: z.string().default('#FFFFFF'),
  textPosition: z.enum(['center', 'left', 'right']).default('center'),
})

type BannerFormValues = z.infer<typeof bannerSchema>

interface BannerFormProps {
  initialData?: Banner | null
}

import { useCreateBanner, useUpdateBanner } from '@/hooks/use-banners'
// ... (keep other imports)

export default function BannerForm({ initialData }: BannerFormProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin')
  const { toast } = useToast()
  
  const [isUploading, setIsUploading] = useState(false)
  
  const createBanner = useCreateBanner()
  const updateBanner = useUpdateBanner()
  
  const isSaving = createBanner.isPending || updateBanner.isPending

  const defaultValues: BannerFormValues = {
    // ... (keep defaults)
    titleVi: initialData?.titleVi || '',
    titleEn: initialData?.titleEn || '',
    subtitleVi: initialData?.subtitleVi || '',
    subtitleEn: initialData?.subtitleEn || '',
    descriptionVi: initialData?.descriptionVi || '',
    descriptionEn: initialData?.descriptionEn || '',
    imageUrl: initialData?.imageUrl || '',
    mobileImageUrl: initialData?.mobileImageUrl || '',
    link: initialData?.link || '',
    order: initialData?.order || 0,
    isActive: initialData?.isActive ?? true,
    textColor: initialData?.textColor || '#FFFFFF',
    textPosition: initialData?.textPosition || 'center',
  }

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues,
  })

  // Watch image URLs for preview
  const imageUrl = form.watch('imageUrl')
  const mobileImageUrl = form.watch('mobileImageUrl')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'imageUrl' | 'mobileImageUrl') => {
    // ... (keep upload logic, it uses api directly which is fine for simple upload, or use upload hook)
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const { url } = await api.uploadImage(file, 'banners')
      form.setValue(fieldName, url)
      toast({ title: t('success'), description: 'Image uploaded' })
    } catch (error) {
      toast({ title: t('error'), description: 'Upload failed', variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (data: BannerFormValues) => {
    try {
      if (initialData) {
        await updateBanner.mutateAsync({ id: initialData.id, data })
        toast({ title: t('success'), description: 'Banner updated' })
      } else {
        await createBanner.mutateAsync(data)
        toast({ title: t('success'), description: 'Banner created' })
      }
      router.push(`/${locale}/admin/banners`)
      router.refresh()
    } catch (error) {
      toast({ title: t('error'), description: 'Failed to save banner', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/admin/banners`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl">
            {initialData ? 'Edit Banner' : 'Create Banner'}
          </h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Banner Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Titles */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="titleVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiêu đề (Tiếng Việt)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Tiêu đề chính" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="titleEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiêu đề (Tiếng Anh)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Main title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Subtitles */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="subtitleVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phụ đề (Tiếng Việt)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Tiêu đề phụ" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subtitleEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phụ đề (Tiếng Anh)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Subtitle" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Link */}
                  <FormField
                    control={form.control}
                    name="link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Đường dẫn liên kết</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="/shop" />
                        </FormControl>
                        <FormDescription>
                          Đích đến khi nhấp vào (ví dụ: /shop hoặc https://...)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Descriptions */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="descriptionVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mô tả (Tiếng Việt)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Mô tả chi tiết" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="descriptionEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mô tả (Tiếng Anh)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Detailed description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cài đặt hiển thị</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="textColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Màu chữ</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input {...field} placeholder="#FFFFFF" type="color" className="w-12 h-10 p-1" />
                            </FormControl>
                            <FormControl>
                              <Input {...field} placeholder="#FFFFFF" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="textPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vị trí chữ</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn vị trí" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="left">Trái</SelectItem>
                              <SelectItem value="center">Giữa</SelectItem>
                              <SelectItem value="right">Phải</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thứ tự hiển thị</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Trạng thái hoạt động</FormLabel>
                            <FormDescription>
                              Hiển thị banner này trên trang chủ
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hình ảnh</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Desktop Image */}
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hình ảnh (Desktop) *</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {field.value ? (
                              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                                <Image
                                  src={optimizeProductImage(field.value)}
                                  alt="Banner preview"
                                  fill
                                  className="object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute right-2 top-2 h-8 w-8"
                                  onClick={() => field.onChange('')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                onClick={() => document.getElementById('desktop-upload')?.click()}
                                className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed hover:bg-muted/50"
                              >
                                {isUploading ? (
                                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                ) : (
                                  <>
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                      Nhấp để tải lên
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                            <Input
                              id="desktop-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, 'imageUrl')}
                              disabled={isUploading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Mobile Image */}
                  <FormField
                    control={form.control}
                    name="mobileImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hình ảnh (Mobile) (Tùy chọn)</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {field.value ? (
                              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border bg-muted">
                                <Image
                                  src={optimizeProductImage(field.value)}
                                  alt="Mobile banner preview"
                                  fill
                                  className="object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute right-2 top-2 h-8 w-8"
                                  onClick={() => field.onChange('')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                onClick={() => document.getElementById('mobile-upload')?.click()}
                                className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed hover:bg-muted/50"
                              >
                                {isUploading ? (
                                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                ) : (
                                  <>
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                      Nhấp để tải lên
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                            <Input
                              id="mobile-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, 'mobileImageUrl')}
                              disabled={isUploading}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Nếu không có, sẽ sử dụng ảnh desktop.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/${locale}/admin/banners`)}
                >
                  Hủy
                </Button>
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {initialData ? 'Cập nhật Banner' : 'Tạo Banner'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
