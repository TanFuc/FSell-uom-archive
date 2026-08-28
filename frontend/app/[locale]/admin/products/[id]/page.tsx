'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState, useCallback } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import * as z from 'zod'
import { SeoSnippetPreview } from '@/components/admin/SeoSnippetPreview'
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
import { useBranding, useExchangeRate } from '@/hooks/use-settings'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { vndToUsd } from '@/lib/currency'
import { optimizeAndResizeImage, optimizeAndResizeImages } from '@/lib/image-upload'
import { type Category } from '@/lib/types'
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
  material: z.string().optional(),
  dimensions: z.string().optional(),
  stock: z.coerce.number().int().min(0, 'Stock must be non-negative'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  inquiryEnabled: z.boolean().default(true),
  inquiryMessageVi: z.string().optional(),
  inquiryMessageEn: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

type VariantGroupPayload = {
  labelVi: string
  labelEn: string
  valuesVi: string[]
  valuesEn: string[]
}

type VariantGroupDraft = {
  id: string
  labelVi: string
  labelEn: string
  valuesVi: string
  valuesEn: string
}

const VARIANT_GROUPS_PREFIX = '[[VARIANT_GROUPS]]'

function parseVariantValues(value?: string): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseLegacyVariantSummary(raw?: string) {
  if (!raw) {
    return { cleanText: '', groups: [] as VariantGroupPayload[] }
  }

  const groups: VariantGroupPayload[] = []
  const cleanParts: string[] = []

  const segments = raw
    .split('\n')
    .flatMap((line) => line.split('|'))
    .map((segment) => segment.trim())
    .filter(Boolean)

  for (const segment of segments) {
    const match = segment.match(/^([A-Za-z\s]+?)(?:\s*\(\d+\))?\s*:\s*(.+)$/)
    if (!match) {
      cleanParts.push(segment)
      continue
    }

    const key = match[1].toLowerCase().trim()
    const values = parseVariantValues(match[2])
    if (values.length === 0) {
      cleanParts.push(segment)
      continue
    }

    if (key === 'types' || key === 'type') {
      groups.push({ labelVi: 'Loai', labelEn: 'Types', valuesVi: values, valuesEn: values })
    } else if (key === 'colors' || key === 'color') {
      groups.push({ labelVi: 'Mau sac', labelEn: 'Colors', valuesVi: values, valuesEn: values })
    } else if (key === 'sizes' || key === 'size') {
      groups.push({ labelVi: 'Kich co', labelEn: 'Sizes', valuesVi: values, valuesEn: values })
    } else {
      cleanParts.push(segment)
    }
  }

  return {
    cleanText: cleanParts.join(' ').trim(),
    groups,
  }
}

function parseVariantGroupsFromShortDescriptions(
  shortDescriptionVi?: string,
  shortDescriptionEn?: string,
) {
  const parseDescription = (raw?: string) => {
    const lines = (raw || '').split('\n')
    let groups: VariantGroupPayload[] = []
    const cleanLines: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith(VARIANT_GROUPS_PREFIX)) {
        try {
          const json = trimmed.slice(VARIANT_GROUPS_PREFIX.length)
          const parsed = JSON.parse(json)
          if (Array.isArray(parsed)) {
            groups = parsed
              .map((item) => ({
                labelVi: String(item?.labelVi || '').trim(),
                labelEn: String(item?.labelEn || '').trim(),
                valuesVi: Array.isArray(item?.valuesVi)
                  ? item.valuesVi.map((v: unknown) => String(v).trim()).filter(Boolean)
                  : [],
                valuesEn: Array.isArray(item?.valuesEn)
                  ? item.valuesEn.map((v: unknown) => String(v).trim()).filter(Boolean)
                  : [],
              }))
              .filter(
                (item) =>
                  Boolean(item.labelVi || item.labelEn) &&
                  (item.valuesVi.length > 0 || item.valuesEn.length > 0),
              )
          }
        } catch {
          cleanLines.push(line)
        }
      } else {
        cleanLines.push(line)
      }
    }

    return {
      cleanText: cleanLines.join('\n').trim(),
      groups,
    }
  }

  const viParsed = parseDescription(shortDescriptionVi)
  const enParsed = parseDescription(shortDescriptionEn)

  if (viParsed.groups.length > 0 || enParsed.groups.length > 0) {
    const groups = viParsed.groups.length > 0 ? viParsed.groups : enParsed.groups
    return {
      shortDescriptionVi: viParsed.cleanText,
      shortDescriptionEn: enParsed.cleanText,
      groups,
    }
  }

  const legacyVi = parseLegacyVariantSummary(shortDescriptionVi)
  const legacyEn = parseLegacyVariantSummary(shortDescriptionEn)
  const legacyGroups = legacyVi.groups.length > 0 ? legacyVi.groups : legacyEn.groups

  return {
    shortDescriptionVi: legacyVi.cleanText || (shortDescriptionVi || '').trim(),
    shortDescriptionEn: legacyEn.cleanText || (shortDescriptionEn || '').trim(),
    groups: legacyGroups,
  }
}

function serializeVariantGroups(groups: VariantGroupPayload[]) {
  if (groups.length === 0) return ''
  return `${VARIANT_GROUPS_PREFIX}${JSON.stringify(groups)}`
}

function toVariantDrafts(groups: VariantGroupPayload[]): VariantGroupDraft[] {
  return groups.map((group, index) => ({
    id: `variant-group-${index}-${Date.now()}`,
    labelVi: group.labelVi,
    labelEn: group.labelEn,
    valuesVi: group.valuesVi.join(', '),
    valuesEn: group.valuesEn.join(', '),
  }))
}

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
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCatNameVi, setNewCatNameVi] = useState('')
  const [newCatNameEn, setNewCatNameEn] = useState('')
  const [variantGroups, setVariantGroups] = useState<VariantGroupDraft[]>([])
  const [isLeftColumnCollapsed, setIsLeftColumnCollapsed] = useState(false)
  const [isRightColumnCollapsed, setIsRightColumnCollapsed] = useState(false)
  const { data: exchangeRateData } = useExchangeRate()
  const { data: branding } = useBranding()
  const exchangeRate = exchangeRateData?.rate

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

  const addVariantGroup = () => {
    setVariantGroups((prev) => [
      ...prev,
      {
        id: `variant-group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        labelVi: '',
        labelEn: '',
        valuesVi: '',
        valuesEn: '',
      },
    ])
  }

  const removeVariantGroup = (id: string) => {
    setVariantGroups((prev) => prev.filter((group) => group.id !== id))
  }

  const updateVariantGroup = (
    id: string,
    field: 'labelVi' | 'labelEn' | 'valuesVi' | 'valuesEn',
    value: string,
  ) => {
    setVariantGroups((prev) =>
      prev.map((group) => (group.id === id ? { ...group, [field]: value } : group)),
    )
  }

  const productName = form.watch('nameVi') || form.watch('nameEn')
  useDocumentTitle(
    isNew ? t('createProduct') : productName || t('updateProduct'),
    'Admin - ƯƠM. Archive',
  )

  const [autoConvertPrice, setAutoConvertPrice] = useState(true)
  const [autoConvertSalePrice, setAutoConvertSalePrice] = useState(true)

  const priceVND = useWatch({ control: form.control, name: 'priceVND' })
  const salePriceVND = useWatch({ control: form.control, name: 'salePriceVND' })
  const nameViWatch = useWatch({ control: form.control, name: 'nameVi' })
  const nameEnWatch = useWatch({ control: form.control, name: 'nameEn' })
  const slugWatch = useWatch({ control: form.control, name: 'slug' })
  const shortDescriptionViWatch = useWatch({ control: form.control, name: 'shortDescriptionVi' })
  const shortDescriptionEnWatch = useWatch({ control: form.control, name: 'shortDescriptionEn' })

  useEffect(() => {
    const nextSlug = slugify(nameViWatch || '')
    form.setValue('slug', nextSlug, { shouldDirty: true })
  }, [form, nameViWatch])

  useEffect(() => {
    if (autoConvertPrice && priceVND) {
      const usdValue = vndToUsd(priceVND, exchangeRate)
      form.setValue('priceUSD', usdValue)
    }
  }, [priceVND, autoConvertPrice, form, exchangeRate])

  useEffect(() => {
    if (autoConvertSalePrice && salePriceVND) {
      const usdValue = vndToUsd(salePriceVND, exchangeRate)
      form.setValue('salePriceUSD', usdValue)
    }
  }, [salePriceVND, autoConvertSalePrice, form, exchangeRate])

  const fetchProduct = useCallback(async () => {
    if (isNew) return

    try {
      const product = await api.getProductById(id)
      const parsedVariants = parseVariantGroupsFromShortDescriptions(
        product.shortDescriptionVi || '',
        product.shortDescriptionEn || '',
      )
      form.reset({
        slug: product.slug,
        nameVi: product.nameVi,
        nameEn: product.nameEn,
        shortDescriptionVi: parsedVariants.shortDescriptionVi,
        shortDescriptionEn: parsedVariants.shortDescriptionEn,
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
      setVariantGroups(toVariantDrafts(parsedVariants.groups))
      setImages(product.images)
      setHoverImage(product.hoverImage || null)

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
      const optimizedFiles = await optimizeAndResizeImages(Array.from(files), {
        maxWidth: 1800,
        maxHeight: 1800,
        quality: 0.86,
        outputType: 'image/webp',
      })
      const uploadPromises = optimizedFiles.map((file) => api.uploadImage(file, 'products'))
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

  const copyImageUrl = async (image: string) => {
    try {
      await navigator.clipboard.writeText(getImageUrl(image))
      toast({ title: t('success'), description: 'Image URL copied' })
    } catch {
      toast({ title: t('error'), description: 'Failed to copy URL', variant: 'destructive' })
    }
  }

  const insertImageIntoDescription = (field: 'descriptionVi' | 'descriptionEn', image: string) => {
    const current = form.getValues(field) || ''
    const imageHtml = `<p><img src="${getImageUrl(image)}" alt="product-image" /></p>`
    const nextValue = current ? `${current}\n${imageHtml}` : imageHtml
    form.setValue(field, nextValue, { shouldDirty: true })
    toast({ title: t('success'), description: `Inserted image into ${field}` })
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
      const normalizedVariantGroups: VariantGroupPayload[] = variantGroups
        .map((group) => {
          const valuesVi = parseVariantValues(group.valuesVi)
          const valuesEn = parseVariantValues(group.valuesEn)
          return {
            labelVi: group.labelVi.trim(),
            labelEn: group.labelEn.trim(),
            valuesVi,
            valuesEn,
          }
        })
        .filter(
          (group) =>
            Boolean(group.labelVi || group.labelEn) &&
            (group.valuesVi.length > 0 || group.valuesEn.length > 0),
        )

      const variantMeta = serializeVariantGroups(normalizedVariantGroups)
      const shortDescriptionVi = [data.shortDescriptionVi?.trim(), variantMeta]
        .filter(Boolean)
        .join('\n')
      const shortDescriptionEn = [data.shortDescriptionEn?.trim(), variantMeta]
        .filter(Boolean)
        .join('\n')

      const restData = data

      const productData = {
        ...restData,
        shortDescriptionVi,
        shortDescriptionEn,
        images,
        hoverImage,
      }

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

      setCategories((prev) => [...prev, newCategory])

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
        <Button asChild variant="ghost" size="icon">
          <Link href={`/${locale}/admin/products`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-serif text-2xl">{isNew ? t('create') : t('edit')} Product</h1>
          <p className="text-muted-foreground">
            {isNew ? 'Add a new product' : 'Update product details'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/20 p-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (isLeftColumnCollapsed && isRightColumnCollapsed) {
                  setIsRightColumnCollapsed(false)
                }
                setIsLeftColumnCollapsed((prev) => !prev)
              }}
            >
              {isLeftColumnCollapsed ? (
                <PanelLeftOpen className="mr-2 h-4 w-4" />
              ) : (
                <PanelLeftClose className="mr-2 h-4 w-4" />
              )}
              {isLeftColumnCollapsed ? 'Hiện cột trái' : 'Ẩn cột trái'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (isRightColumnCollapsed && isLeftColumnCollapsed) {
                  setIsLeftColumnCollapsed(false)
                }
                setIsRightColumnCollapsed((prev) => !prev)
              }}
            >
              {isRightColumnCollapsed ? (
                <PanelRightOpen className="mr-2 h-4 w-4" />
              ) : (
                <PanelRightClose className="mr-2 h-4 w-4" />
              )}
              {isRightColumnCollapsed ? 'Hiện cột phải' : 'Ẩn cột phải'}
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main content - 2 columns */}
            {!isLeftColumnCollapsed && (
              <div
                className={`space-y-6 ${isRightColumnCollapsed ? 'lg:col-span-3' : 'lg:col-span-2'}`}
              >
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="uppercase tracking-wide">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Card className="border-primary/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm uppercase tracking-wide">
                            Vietnamese Content
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="nameVi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('vietnameseName')}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="shortDescriptionVi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mo ta ngan (Tieng Viet)</FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={3} placeholder="Mo ta tom tat..." />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="descriptionVi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('vietnameseDescription')}</FormLabel>
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
                        </CardContent>
                      </Card>

                      <Card className="border-primary/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm uppercase tracking-wide">
                            English Content
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="nameEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('englishName')}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
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
                                  <Textarea
                                    {...field}
                                    rows={3}
                                    placeholder="Summary description..."
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
                                <FormLabel>{t('englishDescription')}</FormLabel>
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
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="bg-muted/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">SEO Preview</CardTitle>
                        <CardDescription>
                          Google snippet auto-generated from product name, summary, and slug.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <SeoSnippetPreview
                          locale="vi"
                          path={`/vi/shop/${slugWatch || 'product-slug'}`}
                          title={nameViWatch || 'Tên sản phẩm'}
                          description={
                            shortDescriptionViWatch || 'Mô tả ngắn của sản phẩm sẽ hiển thị ở đây.'
                          }
                          branding={branding}
                        />
                        <SeoSnippetPreview
                          locale="en"
                          path={`/en/shop/${slugWatch || 'product-slug'}`}
                          title={nameEnWatch || 'Product name'}
                          description={
                            shortDescriptionEnWatch ||
                            'The product summary shown in Google search results appears here.'
                          }
                          branding={branding}
                        />
                      </CardContent>
                    </Card>

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
                                      field.onChange(
                                        e.target.value ? parseInt(e.target.value) : null,
                                      )
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

                    <Card className="bg-muted/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {t('variantClassificationTitle')}
                        </CardTitle>
                        <CardDescription>{t('variantClassificationDesc')}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {variantGroups.length === 0 ? (
                          <p className="text-sm text-muted-foreground">{t('variantNoGroups')}</p>
                        ) : null}

                        {variantGroups.map((group, index) => (
                          <div key={group.id} className="space-y-3 rounded-md border p-4">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t('variantGroupLabel', { index: index + 1 })}
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeVariantGroup(group.id)}
                                className="h-7 px-2 text-xs"
                              >
                                <X className="mr-1 h-3 w-3" />
                                {t('delete')}
                              </Button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor={`${group.id}-label-vi`}>
                                  {t('variantLabelVi')}
                                </Label>
                                <Input
                                  id={`${group.id}-label-vi`}
                                  value={group.labelVi}
                                  onChange={(e) =>
                                    updateVariantGroup(group.id, 'labelVi', e.target.value)
                                  }
                                  placeholder="Loai"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`${group.id}-label-en`}>
                                  {t('variantLabelEn')}
                                </Label>
                                <Input
                                  id={`${group.id}-label-en`}
                                  value={group.labelEn}
                                  onChange={(e) =>
                                    updateVariantGroup(group.id, 'labelEn', e.target.value)
                                  }
                                  placeholder="Types"
                                />
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor={`${group.id}-values-vi`}>
                                  {t('variantValuesVi')}
                                </Label>
                                <Textarea
                                  id={`${group.id}-values-vi`}
                                  rows={2}
                                  value={group.valuesVi}
                                  onChange={(e) =>
                                    updateVariantGroup(group.id, 'valuesVi', e.target.value)
                                  }
                                  placeholder="Thuong, Cao cap"
                                />
                                <FormDescription>
                                  {t('variantValuesCount', {
                                    count: parseVariantValues(group.valuesVi).length,
                                  })}
                                </FormDescription>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`${group.id}-values-en`}>
                                  {t('variantValuesEn')}
                                </Label>
                                <Textarea
                                  id={`${group.id}-values-en`}
                                  rows={2}
                                  value={group.valuesEn}
                                  onChange={(e) =>
                                    updateVariantGroup(group.id, 'valuesEn', e.target.value)
                                  }
                                  placeholder="Classic, Premium"
                                />
                                <FormDescription>
                                  {t('variantValuesCount', {
                                    count: parseVariantValues(group.valuesEn).length,
                                  })}
                                </FormDescription>
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">{t('variantValuesHint')}</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addVariantGroup}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {t('addVariantGroup')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

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
                    <CardTitle className="uppercase tracking-wide">
                      {t('inquirySettings')}
                    </CardTitle>
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
                            <FormDescription>
                              Leave empty for auto-generated message
                            </FormDescription>
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
                            <FormDescription>
                              Leave empty for auto-generated message
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Sidebar - 1 column */}
            {!isRightColumnCollapsed && (
              <div className={`space-y-6 ${isLeftColumnCollapsed ? 'lg:col-span-3' : ''}`}>
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
                          <div className="absolute inset-x-0 bottom-0 grid translate-y-full grid-cols-2 gap-1 bg-black/70 p-2 transition-transform duration-300 group-hover:translate-y-0">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-7 text-[10px]"
                              onClick={() => copyImageUrl(image)}
                            >
                              Copy URL
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-7 text-[10px]"
                              onClick={() => insertImageIntoDescription('descriptionVi', image)}
                            >
                              Insert VI
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-7 text-[10px]"
                              onClick={() => insertImageIntoDescription('descriptionEn', image)}
                            >
                              Insert EN
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="h-7 text-[10px]"
                              onClick={() => removeImage(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tip: Use Insert VI/EN to quickly place selected image into product
                      description.
                    </p>

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
                            const optimizedFile = await optimizeAndResizeImage(file, {
                              maxWidth: 1800,
                              maxHeight: 1800,
                              quality: 0.86,
                              outputType: 'image/webp',
                            })
                            const result = await api.uploadImage(optimizedFile, 'products')
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
            )}
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
