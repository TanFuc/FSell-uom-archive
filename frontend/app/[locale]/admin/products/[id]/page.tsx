'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Upload, X, Plus, Languages, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState, useCallback } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import * as z from 'zod'
import { RichTextEditor } from '@/components/RichTextEditor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { DEFAULT_EXCHANGE_RATE } from '@/lib/constants'
import { vndToUsd, usdToVnd } from '@/lib/currency'
import { Product, type Category } from '@/lib/types'
import { getImageUrl, slugify } from '@/lib/utils'

const productSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  nameVi: z.string().min(1, 'Vietnamese name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  shortDescriptionVi: z.string().optional(),
  shortDescriptionEn: z.string().optional(),
  descriptionVi: z.string().min(1, 'Vietnamese description is required'),
  descriptionEn: z.string().min(1, 'English description is required'),
  priceVND: z.coerce.number().min(0, 'Price must be positive'),
  priceUSD: z.coerce.number().min(0).optional(),
  salePriceVND: z.coerce.number().min(0).optional().nullable(),
  salePriceUSD: z.coerce.number().min(0).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  material: z.string().min(1, 'Material is required'),
  dimensions: z.string().min(1, 'Dimensions required'),
  stock: z.coerce.number().int().min(0, 'Stock must be non-negative'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
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
  const [hoverImage, setHoverImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCatNameVi, setNewCatNameVi] = useState('')
  const [newCatNameEn, setNewCatNameEn] = useState('')

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      slug: '',
      nameVi: '',
      nameEn: '',
      shortDescriptionVi: '',
      shortDescriptionEn: '',
      descriptionVi: '',
      descriptionEn: '',
      priceVND: 0,
      priceUSD: undefined,
      salePriceVND: null,
      salePriceUSD: null,
      categoryId: null,
      material: '',
      dimensions: '',
      stock: 0,
      isActive: true,
      isFeatured: false,
      inquiryEnabled: true,
      inquiryMessageVi: '',
      inquiryMessageEn: '',
    },
  })

  // Update document title based on product name or "Create Product"
  const productName = form.watch('nameVi') || form.watch('nameEn')
  useDocumentTitle(
    isNew ? t('createProduct') : productName || t('updateProduct'),
    'Admin - ƯƠM. Archive',
  )

  // Auto-convert prices
  const [autoConvertPrice, setAutoConvertPrice] = useState(true)
  const [autoConvertSalePrice, setAutoConvertSalePrice] = useState(true)
  const [isTranslating, setIsTranslating] = useState(false)

  const priceVND = useWatch({ control: form.control, name: 'priceVND' })
  const salePriceVND = useWatch({ control: form.control, name: 'salePriceVND' })

  // Auto-convert VND to USD when VND changes
  useEffect(() => {
    if (autoConvertPrice && priceVND) {
      const usdValue = vndToUsd(priceVND)
      form.setValue('priceUSD', usdValue)
    }
  }, [priceVND, autoConvertPrice, form])

  useEffect(() => {
    if (autoConvertSalePrice && salePriceVND) {
      const usdValue = vndToUsd(salePriceVND)
      form.setValue('salePriceUSD', usdValue)
    }
  }, [salePriceVND, autoConvertSalePrice, form])

  // Simple mock translation function
  const translateText = async (
    text: string,
    from: 'vi' | 'en',
    to: 'vi' | 'en',
  ): Promise<string> => {
    // In a real implementation, this would call a translation API (e.g. Google Translate)
    // Currently, we'll just return the original text so the user can edit it
    // This acts as a "Copy" or "Fill" feature when API is not available
    if (from === to || !text.trim()) return text

    // Mock translation - just return text
    return text
  }

  const handleTranslate = async (
    field: 'name' | 'description',
    direction: 'vi-to-en' | 'en-to-vi',
  ) => {
    setIsTranslating(true)
    try {
      if (field === 'name') {
        if (direction === 'vi-to-en') {
          const translated = await translateText(form.getValues('nameVi'), 'vi', 'en')
          form.setValue('nameEn', translated)
        } else {
          const translated = await translateText(form.getValues('nameEn'), 'en', 'vi')
          form.setValue('nameVi', translated)
        }
      } else {
        if (direction === 'vi-to-en') {
          const translated = await translateText(form.getValues('descriptionVi'), 'vi', 'en')
          form.setValue('descriptionEn', translated)
        } else {
          const translated = await translateText(form.getValues('descriptionEn'), 'en', 'vi')
          form.setValue('descriptionVi', translated)
        }
      }
      toast({ title: t('success'), description: 'Translation completed' })
    } catch (error) {
      toast({ title: t('error'), description: 'Translation failed', variant: 'destructive' })
    } finally {
      setIsTranslating(false)
    }
  }

  const fetchProduct = useCallback(async () => {
    if (isNew) return

    try {
      const product = await api.getProductById(id)
      form.reset({
        slug: product.slug,
        nameVi: product.nameVi,
        nameEn: product.nameEn,
        shortDescriptionVi: product.shortDescriptionVi || '',
        shortDescriptionEn: product.shortDescriptionEn || '',
        descriptionVi: product.descriptionVi,
        descriptionEn: product.descriptionEn,
        priceVND: product.priceVND,
        priceUSD: product.priceUSD || undefined,
        salePriceVND: product.salePriceVND || null,
        salePriceUSD: product.salePriceUSD || null,
        categoryId: product.categoryId || null,
        material: product.material,
        dimensions: product.dimensions,
        stock: product.stock,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        inquiryEnabled: product.inquiryEnabled,
        inquiryMessageVi: product.inquiryMessageVi || '',
        inquiryMessageEn: product.inquiryMessageEn || '',
      })
      setImages(product.images)
      setHoverImage(product.hoverImage || null)
      setSelectedCategoryId(product.categoryId || null)
      // Disable auto-convert when loading existing product with custom USD prices
      if (product.priceUSD) {
        setAutoConvertPrice(false)
      }
      if (product.salePriceUSD) {
        setAutoConvertSalePrice(false)
      }
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

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await api.getCategories({ includeInactive: true })
        setCategories(data)
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    loadCategories()
  }, [])

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
      toast({
        title: t('error'),
        description: 'At least one image is required',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const productData = { ...data, images, hoverImage }

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

  const handleQuickCreateCategory = async () => {
    if (!newCatNameVi || !newCatNameEn) {
      toast({
        title: t('error'),
        description: 'Vui lòng nhập tên danh mục cả tiếng Việt và tiếng Anh',
        variant: 'destructive',
      })
      return
    }

    setIsCreatingCategory(true)
    try {
      const slug = slugify(newCatNameVi)
      const newCategory = await api.createCategory({
        nameVi: newCatNameVi,
        nameEn: newCatNameEn,
        slug,
        isActive: true,
        order: categories.length,
      })

      // Update categories list
      setCategories((prev) => [...prev, newCategory])

      // Select the new category
      form.setValue('categoryId', newCategory.id)

      toast({ title: t('success'), description: t('categoryCreated') })
      setIsCategoryDialogOpen(false)
      setNewCatNameVi('')
      setNewCatNameEn('')
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || 'Không thể tạo danh mục',
        variant: 'destructive',
      })
    } finally {
      setIsCreatingCategory(false)
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
          <h1 className="font-serif text-2xl">{isNew ? t('create') : t('edit')} Product</h1>
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

                  {/* Name Fields with Translation */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="nameVi"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>{t('vietnameseName')}</FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTranslate('name', 'en-to-vi')}
                              disabled={isTranslating}
                              className="h-6 text-xs"
                            >
                              <Languages className="mr-1 h-3 w-3" />
                              EN → VI
                            </Button>
                          </div>
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
                          <div className="flex items-center justify-between">
                            <FormLabel>{t('englishName')}</FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTranslate('name', 'vi-to-en')}
                              disabled={isTranslating}
                              className="h-6 text-xs"
                            >
                              <Languages className="mr-1 h-3 w-3" />
                              VI → EN
                            </Button>
                          </div>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Short Description Fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="shortDescriptionVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mô tả ngắn (Tiếng Việt)</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Mô tả tóm tắt..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shortDescriptionEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description (English)</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Summary description..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Description Fields with Rich Text Editor and Translation */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="descriptionVi"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>{t('vietnameseDescription')}</FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTranslate('description', 'en-to-vi')}
                              disabled={isTranslating}
                              className="h-6 text-xs"
                            >
                              <Languages className="mr-1 h-3 w-3" />
                              EN → VI
                            </Button>
                          </div>
                          <FormControl>
                            <RichTextEditor
                              content={field.value}
                              onChange={field.onChange}
                              placeholder={t('enterDescription')}
                            />
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
                          <div className="flex items-center justify-between">
                            <FormLabel>{t('englishDescription')}</FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTranslate('description', 'vi-to-en')}
                              disabled={isTranslating}
                              className="h-6 text-xs"
                            >
                              <Languages className="mr-1 h-3 w-3" />
                              VI → EN
                            </Button>
                          </div>
                          <FormControl>
                            <RichTextEditor
                              content={field.value}
                              onChange={field.onChange}
                              placeholder={t('enterDescription')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Price Fields */}
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{t('pricing')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Original Price */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="priceVND"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('priceVND')} *</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" placeholder="1,000,000" />
                              </FormControl>
                              <FormDescription>{t('originalPrice')}</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="priceUSD"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel>{t('priceUSD')}</FormLabel>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setAutoConvertPrice(!autoConvertPrice)}
                                  className="h-6 text-xs"
                                >
                                  <RefreshCw
                                    className={`mr-1 h-3 w-3 ${autoConvertPrice ? 'text-green-500' : ''}`}
                                  />
                                  {autoConvertPrice ? t('autoOn') : t('autoOff')}
                                </Button>
                              </div>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    setAutoConvertPrice(false)
                                    field.onChange(
                                      e.target.value ? parseFloat(e.target.value) : undefined,
                                    )
                                  }}
                                />
                              </FormControl>
                              <FormDescription>{t('autoCalculated')}</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Sale Price */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="salePriceVND"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('salePriceVND')}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  placeholder={t('optional')}
                                  value={field.value || ''}
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? parseInt(e.target.value) : null)
                                  }
                                />
                              </FormControl>
                              <FormDescription>{t('discountPrice')}</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="salePriceUSD"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel>{t('salePriceUSD')}</FormLabel>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setAutoConvertSalePrice(!autoConvertSalePrice)}
                                  className="h-6 text-xs"
                                >
                                  <RefreshCw
                                    className={`mr-1 h-3 w-3 ${autoConvertSalePrice ? 'text-green-500' : ''}`}
                                  />
                                  {autoConvertSalePrice ? t('autoOn') : t('autoOff')}
                                </Button>
                              </div>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  placeholder={t('optional')}
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    setAutoConvertSalePrice(false)
                                    field.onChange(
                                      e.target.value ? parseFloat(e.target.value) : null,
                                    )
                                  }}
                                />
                              </FormControl>
                              <FormDescription>{t('autoCalculated')}</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Material and Dimensions */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="material"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('material')}</FormLabel>
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
                          <FormLabel>{t('dimensions')}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="15cm x 20cm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Category and Stock */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>{t('category')}</FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setIsCategoryDialogOpen(true)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Thêm mới
                            </Button>
                          </div>
                          <Select
                            onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                            value={field.value || 'none'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('selectCategory')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">{t('noCategory')}</SelectItem>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {locale === 'vi' ? category.nameVi : category.nameEn}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('stockLabelForm')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                          <FormDescription>
                            Allow customers to ask about this product
                          </FormDescription>
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
                            <Textarea {...field} rows={4} placeholder={t('autoGenerated')} />
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
                            <Textarea {...field} rows={4} placeholder={t('autoGenerated')} />
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
                  <CardTitle className="uppercase tracking-wide">{t('status')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>{t('active')}</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>{t('featured')}</FormLabel>
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
                  <div className="grid grid-cols-2 gap-4">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className="aspect-product group relative cursor-move overflow-hidden rounded-md border"
                      >
                        <Image
                          src={getImageUrl(image)}
                          alt={`Product ${index + 1}`}
                          fill
                          sizes="150px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {index === 0 && (
                          <div className="absolute left-2 top-2 z-10 rounded-sm bg-primary/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm backdrop-blur-sm">
                            Main Display
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 flex translate-y-full justify-center bg-black/60 p-2 transition-transform duration-300 group-hover:translate-y-0">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-7 w-7 rounded-full p-0"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      disabled={isUploading}
                    />
                    <Button variant="outline" className="w-full" disabled={isUploading}>
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploading ? 'Uploading...' : 'Upload Images'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Hover Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="uppercase tracking-wide">Hover Image</CardTitle>
                  <CardDescription>Image shown when user hovers over product</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hoverImage && (
                    <div className="aspect-product relative border">
                      <Image
                        src={getImageUrl(hoverImage)}
                        alt="Hover image"
                        fill
                        sizes="300px"
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-1 top-1 h-6 w-6"
                        onClick={() => setHoverImage(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setIsUploading(true)
                        try {
                          const result = await api.uploadImage(file)
                          setHoverImage(result.url)
                          toast({ title: t('success'), description: 'Hover image uploaded' })
                        } catch (error) {
                          toast({
                            title: t('error'),
                            description: 'Upload failed',
                            variant: 'destructive',
                          })
                        } finally {
                          setIsUploading(false)
                        }
                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      disabled={isUploading}
                    />
                    <Button variant="outline" className="w-full" disabled={isUploading}>
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploading
                        ? 'Uploading...'
                        : hoverImage
                          ? 'Change Hover Image'
                          : 'Upload Hover Image'}
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

      {/* Quick Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createCategory')}</DialogTitle>
            <DialogDescription>Tạo nhanh danh mục mới để gán cho sản phẩm này.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('vietnameseName')}</Label>
              <Input
                value={newCatNameVi}
                onChange={(e) => setNewCatNameVi(e.target.value)}
                placeholder="Ví dụ: Gốm sứ"
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('englishName')}</Label>
              <Input
                value={newCatNameEn}
                onChange={(e) => setNewCatNameEn(e.target.value)}
                placeholder="Example: Ceramics"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCategoryDialogOpen(false)}
              disabled={isCreatingCategory}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleQuickCreateCategory} disabled={isCreatingCategory}>
              {isCreatingCategory ? t('loading') : t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
