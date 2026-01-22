'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft, Upload, X, Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { api } from '@/lib/api'
import { Product } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { getImageUrl, slugify } from '@/lib/utils'

const productSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  nameVi: z.string().min(1, 'Vietnamese name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  descriptionVi: z.string().min(1, 'Vietnamese description is required'),
  descriptionEn: z.string().min(1, 'English description is required'),
  priceVND: z.coerce.number().min(0, 'Price must be positive'),
  material: z.string().min(1, 'Material is required'),
  dimensions: z.string().min(1, 'Dimensions required'),
  stock: z.coerce.number().int().min(0, 'Stock must be non-negative'),
  isActive: z.boolean().default(true),
  inquiryEnabled: z.boolean().default(true),
  inquiryMessageVi: z.string().optional(),
  inquiryMessageEn: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function ProductFormPage() {
  const router = useRouter()
  const params = useParams()
  const locale = useLocale()
  const t = useTranslations('admin')
  const { toast } = useToast()

  const id = params.id as string
  const isNew = id === 'new'

  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      slug: '',
      nameVi: '',
      nameEn: '',
      descriptionVi: '',
      descriptionEn: '',
      priceVND: 0,
      material: '',
      dimensions: '',
      stock: 0,
      isActive: true,
      inquiryEnabled: true,
      inquiryMessageVi: '',
      inquiryMessageEn: '',
    },
  })

  const fetchProduct = useCallback(async () => {
    if (isNew) return

    try {
      const product = await api.getProductById(id)
      form.reset({
        slug: product.slug,
        nameVi: product.nameVi,
        nameEn: product.nameEn,
        descriptionVi: product.descriptionVi,
        descriptionEn: product.descriptionEn,
        priceVND: product.priceVND,
        material: product.material,
        dimensions: product.dimensions,
        stock: product.stock,
        isActive: product.isActive,
        inquiryEnabled: product.inquiryEnabled,
        inquiryMessageVi: product.inquiryMessageVi || '',
        inquiryMessageEn: product.inquiryMessageEn || '',
      })
      setImages(product.images)
    } catch (error) {
      console.error('Failed to fetch product:', error)
      toast({ title: t('error'), description: 'Product not found', variant: 'destructive' })
      router.push(`/${locale}/admin/products`)
    } finally {
      setIsLoading(false)
    }
  }, [id, isNew, form, locale, router, t, toast])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const uploadPromises = Array.from(files).map((file) => api.uploadImage(file))
      const results = await Promise.all(uploadPromises)
      setImages((prev) => [...prev, ...results.map((r) => r.url)])
      toast({ title: t('success'), description: 'Images uploaded' })
    } catch (error) {
      toast({ title: t('error'), description: 'Upload failed', variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ProductFormValues) => {
    if (images.length === 0) {
      toast({ title: t('error'), description: 'At least one image is required', variant: 'destructive' })
      return
    }

    setIsSaving(true)
    try {
      const productData = { ...data, images }

      if (isNew) {
        await api.createProduct(productData)
        toast({ title: t('success'), description: 'Product created' })
      } else {
        await api.updateProduct(id, productData)
        toast({ title: t('success'), description: 'Product updated' })
      }

      router.push(`/${locale}/admin/products`)
    } catch (error) {
      toast({ title: t('error'), description: 'Failed to save product', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const generateSlug = () => {
    const nameVi = form.getValues('nameVi')
    if (nameVi) {
      form.setValue('slug', slugify(nameVi))
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
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/admin/products`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-serif">{isNew ? t('create') : t('edit')} Product</h1>
          <p className="text-muted-foreground">
            {isNew ? 'Add a new product' : 'Update product details'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main content - 2 columns */}
            <div className="space-y-6 lg:col-span-2">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="uppercase tracking-wide">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input {...field} placeholder="product-slug" />
                              <Button type="button" variant="outline" onClick={generateSlug}>
                                Generate
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="nameVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vietnamese Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nameEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>English Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="descriptionVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vietnamese Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={5} />
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
                          <FormLabel>English Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={5} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="priceVND"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (VND)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="material"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dimensions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dimensions</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="15cm x 20cm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem className="max-w-xs">
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Inquiry Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="uppercase tracking-wide">{t('inquirySettings')}</CardTitle>
                  <CardDescription>Configure customer inquiry options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="inquiryEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>{t('inquiryEnabled')}</FormLabel>
                          <FormDescription>Allow customers to ask about this product</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="inquiryMessageVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('inquiryMessageVi')}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={4}
                              placeholder={t('autoGenerated')}
                            />
                          </FormControl>
                          <FormDescription>Leave empty for auto-generated message</FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="inquiryMessageEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('inquiryMessageEn')}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={4}
                              placeholder={t('autoGenerated')}
                            />
                          </FormControl>
                          <FormDescription>Leave empty for auto-generated message</FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="uppercase tracking-wide">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Active</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle className="uppercase tracking-wide">Images</CardTitle>
                  <CardDescription>Upload product images (4:5 ratio recommended)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative aspect-product border">
                        <Image
                          src={getImageUrl(image)}
                          alt={`Product ${index + 1}`}
                          fill
                          sizes="150px"
                          className="object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploading}
                    />
                    <Button variant="outline" className="w-full" disabled={isUploading}>
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploading ? 'Uploading...' : 'Upload Images'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t('loading') : t('save')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/${locale}/admin/products`)}
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
