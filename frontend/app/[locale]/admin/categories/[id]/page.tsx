'use client'

import { ArrowLeft, Upload, X } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { optimizeAndResizeImage } from '@/lib/image-upload'
import { type CreateCategoryDto, type UpdateCategoryDto } from '@/lib/types'

export default function CategoryFormPage() {
  const router = useRouter()
  const params = useParams()
  const locale = useLocale()
  const t = useTranslations('admin')
  const { toast } = useToast()

  const isNew = params.id === 'new'
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const form = useForm<CreateCategoryDto | UpdateCategoryDto>({
    defaultValues: {
      slug: '',
      nameVi: '',
      nameEn: '',
      descriptionVi: '',
      descriptionEn: '',
      image: '',
      order: 0,
      isActive: true,
    },
  })

  const categoryName = form.watch('nameVi') || form.watch('nameEn') || t('category')
  useDocumentTitle(isNew ? t('createCategory') : categoryName, 'Admin - ƯƠM. Archive')

  // Load category data if editing
  useEffect(() => {
    if (!isNew && params.id) {
      loadCategory(params.id as string)
    }
  }, [params.id, isNew])

  const loadCategory = async (id: string) => {
    try {
      setIsLoading(true)
      const category = await api.getCategoryById(id)
      form.reset({
        slug: category.slug,
        nameVi: category.nameVi,
        nameEn: category.nameEn,
        descriptionVi: category.descriptionVi || '',
        descriptionEn: category.descriptionEn || '',
        image: category.image || '',
        order: category.order || 0,
        isActive: category.isActive,
      })
      if (category.image) {
        setImagePreview(category.image)
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToUpdate'),
        variant: 'destructive',
      })
      router.push(`/${locale}/admin/categories`)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSlug = () => {
    const nameVi = form.getValues('nameVi')
    if (!nameVi) return

    const slug = nameVi
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    form.setValue('slug', slug)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const optimizedFile = await optimizeAndResizeImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.88,
        outputType: 'image/webp',
      })
      setImageFile(optimizedFile)
      setImagePreview(URL.createObjectURL(optimizedFile))
    } catch {
      toast({
        title: t('error'),
        description: 'Không thể tối ưu ảnh trước khi upload',
        variant: 'destructive',
      })
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    form.setValue('image', '')
  }

  const onSubmit = async (data: CreateCategoryDto | UpdateCategoryDto) => {
    try {
      setIsSaving(true)

      // Upload image if new file selected
      let imageUrl = data.image
      if (imageFile) {
        const uploadResult = await api.uploadImage(imageFile, 'categories')
        imageUrl = uploadResult.url
      }

      const categoryData = {
        ...data,
        image: imageUrl || null,
      }

      if (isNew) {
        await api.createCategory(categoryData as CreateCategoryDto)
        toast({
          title: t('success'),
          description: t('categoryCreated'),
        })
      } else {
        await api.updateCategory(params.id as string, categoryData as UpdateCategoryDto)
        toast({
          title: t('success'),
          description: t('categoryUpdated'),
        })
      }

      router.push(`/${locale}/admin/categories`)
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToUpdate'),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">{t('loading')}...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/${locale}/admin/categories`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-serif text-2xl">
            {isNew ? t('createCategory') : t('updateCategory')}
          </h1>
          <p className="text-muted-foreground">
            {isNew ? t('manageCategoriesDesc') : categoryName}
          </p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4 rounded-lg border p-6">
            <h2 className="text-lg font-medium">{t('basicInfo')}</h2>

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('categorySlug')}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} placeholder="category-slug" />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={generateSlug}>
                      {t('generate')}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vietnamese Name */}
            <FormField
              control={form.control}
              name="nameVi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('vietnameseName')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Tên danh mục" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* English Name */}
            <FormField
              control={form.control}
              name="nameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('englishName')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Category Name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vietnamese Description */}
            <FormField
              control={form.control}
              name="descriptionVi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('vietnameseDescription')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Mô tả danh mục..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* English Description */}
            <FormField
              control={form.control}
              name="descriptionEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('englishDescription')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Category description..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Order */}
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('categoryOrder')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>Lower numbers appear first</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('active')}</FormLabel>
                    <FormDescription>Show this category on the website</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Category Image */}
          <div className="space-y-4 rounded-lg border p-6">
            <h2 className="text-lg font-medium">{t('categoryImage')}</h2>

            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Category preview"
                  className="h-48 w-48 rounded-lg object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Click to upload category image</p>
                <Input type="file" accept="image/*" onChange={handleImageChange} className="mt-4" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('loading') : t('save')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${locale}/admin/categories`)}
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
