'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { MessageSquare, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { type Product } from '@/lib/types'

const formSchema = z.object({
  name: z.string().min(2, { message: 'Required' }),
  contact: z.string().min(5, { message: 'Required' }),
  message: z.string().min(5, { message: 'Required' }),
})

interface ProductInquiryFormProps {
  product: Product
  locale: 'vi' | 'en'
}

export function ProductInquiryForm({ product, locale }: ProductInquiryFormProps) {
  const t = useTranslations('product.inquiryForm')
  const [open, setOpen] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const productName = locale === 'vi' ? product.nameVi : product.nameEn

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      contact: '',
      message: `I'm interested in ${productName}...`,
    },
  })

  // Reset form when opened with new product or closed
  React.useEffect(() => {
    if (open && !isSuccess) {
      form.setValue(
        'message',
        locale === 'vi'
          ? `Tôi quan tâm đến sản phẩm ${productName}, xin vui lòng tư vấn thêm.`
          : `I'm interested in ${productName}, please provide more details.`,
      )
    }
  }, [open, productName, locale, form, isSuccess])

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Here you would typically send the data to your backend
    console.log(values)

    // Simulate API call
    setTimeout(() => {
      setIsSuccess(true)
      form.reset()
    }, 1000)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset success state after closing
      setTimeout(() => setIsSuccess(false), 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="group relative w-full overflow-hidden uppercase tracking-wider md:w-auto"
          variant="outline"
        >
          <span className="relative z-10 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t('button')}
          </span>
          <span className="absolute inset-0 bg-primary/5 transition-colors group-hover:bg-primary/10" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl uppercase tracking-wide">
                {t('title')}
              </DialogTitle>
              <DialogDescription>{t('description')}</DialogDescription>
            </DialogHeader>

            <div className="mb-4 flex items-center gap-4 border-b border-border/50 py-4">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-foreground">{productName}</h4>
                <p className="mt-1 text-xs text-muted-foreground">{product.material}</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                        {t('name')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder=""
                          {...field}
                          className="rounded-none border-x-0 border-b border-t-0 bg-transparent px-0 focus-visible:border-primary focus-visible:ring-0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                        {t('contact')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder=""
                          {...field}
                          className="rounded-none border-x-0 border-b border-t-0 bg-transparent px-0 focus-visible:border-primary focus-visible:ring-0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                        {t('message')}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          className="resize-none rounded-none border-x-0 border-b border-t-0 bg-transparent px-0 focus-visible:border-primary focus-visible:ring-0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full">
                    {t('submit')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-4 py-12 text-center duration-300 animate-in fade-in zoom-in">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="font-serif text-xl">{t('successTitle')}</DialogTitle>
            <DialogDescription className="mx-auto max-w-xs">
              {t('successMessage')}
            </DialogDescription>
            <Button onClick={() => setOpen(false)} variant="outline" className="mt-4">
              {t('close')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
