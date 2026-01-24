'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, Eye, EyeOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useToast } from '@/hooks/use-toast'

const cloudinarySchema = z.object({
  cloudName: z.string().min(1, 'Cloud name là bắt buộc'),
  apiKey: z.string().min(1, 'API key là bắt buộc'),
  apiSecret: z.string().min(1, 'API secret là bắt buộc'),
  folder: z.string().min(1, 'Folder name là bắt buộc'),
})

type CloudinaryFormValues = z.infer<typeof cloudinarySchema>

export default function CloudinarySettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showApiSecret, setShowApiSecret] = useState(false)
  const { toast } = useToast()

  const form = useForm<CloudinaryFormValues>({
    resolver: zodResolver(cloudinarySchema),
    defaultValues: {
      cloudName: '',
      apiKey: '',
      apiSecret: '',
      folder: 'uom-archive',
    },
  })

  const onSubmit = async (data: CloudinaryFormValues) => {
    setIsLoading(true)
    try {
      // In a real application, you would send this to your backend
      // which would update the environment variables securely
      console.log('Cloudinary settings:', data)

      // For now, we'll show a warning that these need to be set in .env
      toast({
        title: 'Lưu ý quan trọng',
        description: (
          <div className="space-y-2">
            <p className="font-medium">
              Vui lòng cập nhật các giá trị sau vào file{' '}
              <code className="rounded bg-muted px-1 py-0.5">.env</code> của backend:
            </p>
            <div className="mt-2 space-y-1 rounded-md bg-muted p-3 font-mono text-xs">
              <div>CLOUDINARY_CLOUD_NAME=&quot;{data.cloudName}&quot;</div>
              <div>CLOUDINARY_API_KEY=&quot;{data.apiKey}&quot;</div>
              <div>CLOUDINARY_API_SECRET=&quot;{data.apiSecret}&quot;</div>
              <div>CLOUDINARY_FOLDER=&quot;{data.folder}&quot;</div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Sau khi cập nhật, khởi động lại server backend để áp dụng thay đổi.
            </p>
          </div>
        ),
        duration: 10000,
      })

      // Store in localStorage for reference (NOT for production use!)
      if (typeof window !== 'undefined') {
        localStorage.setItem('cloudinarySettings', JSON.stringify(data))
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể lưu cài đặt',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load saved settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cloudinarySettings')
      if (saved) {
        try {
          const settings = JSON.parse(saved)
          form.reset(settings)
        } catch (error) {
          console.error('Failed to load saved settings:', error)
        }
      }
    }
  }, [form])

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt Cloudinary</h1>
        <p className="mt-2 text-muted-foreground">
          Cấu hình thông tin kết nối đến Cloudinary cho chức năng upload ảnh
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin xác thực Cloudinary</CardTitle>
          <CardDescription>
            Nhập thông tin tài khoản Cloudinary của bạn. Bạn có thể tìm thấy những thông tin này
            trong{' '}
            <a
              href="https://cloudinary.com/console"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Cloudinary Console
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="cloudName"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Cloud Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="my-cloud-name"
                        className={
                          fieldState.error ? 'border-red-500 focus-visible:ring-red-500' : ''
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Tên cloud của bạn trong Cloudinary (ví dụ: my-cloud-name)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apiKey"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123456789012345"
                        className={
                          fieldState.error ? 'border-red-500 focus-visible:ring-red-500' : ''
                        }
                      />
                    </FormControl>
                    <FormDescription>API key từ Cloudinary console</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apiSecret"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>API Secret</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showApiSecret ? 'text' : 'password'}
                          placeholder="••••••••••••••••"
                          className={
                            fieldState.error ? 'border-red-500 focus-visible:ring-red-500' : ''
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowApiSecret(!showApiSecret)}
                        >
                          {showApiSecret ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>API secret từ Cloudinary console (bảo mật)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="folder"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Folder Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="uom-archive"
                        className={
                          fieldState.error ? 'border-red-500 focus-visible:ring-red-500' : ''
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Tên thư mục để lưu trữ file trong Cloudinary (mặc định: uom-archive)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lưu cài đặt
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                <h4 className="mb-2 font-semibold text-yellow-900 dark:text-yellow-200">
                  ⚠️ Lưu ý bảo mật
                </h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
                  <li>API Secret phải được bảo mật tuyệt đối</li>
                  <li>Không chia sẻ thông tin này với bất kỳ ai</li>
                  <li>Các giá trị này phải được cấu hình trong file .env của backend</li>
                  <li>Không hardcode các giá trị này trong code source</li>
                </ul>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Hướng dẫn cài đặt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 font-semibold">1. Lấy thông tin từ Cloudinary</h4>
            <p className="text-sm text-muted-foreground">
              Truy cập{' '}
              <a
                href="https://cloudinary.com/console"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Cloudinary Console
              </a>{' '}
              và sao chép Cloud Name, API Key, và API Secret
            </p>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">2. Cập nhật file .env trong backend</h4>
            <p className="mb-2 text-sm text-muted-foreground">
              Mở file <code className="rounded bg-muted px-1 py-0.5">.env</code> trong thư mục
              backend và thêm/cập nhật:
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
              {`CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_FOLDER="uom-archive"`}
            </pre>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">3. Khởi động lại backend server</h4>
            <p className="text-sm text-muted-foreground">
              Sau khi cập nhật file .env, khởi động lại backend server để các thay đổi có hiệu lực
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
