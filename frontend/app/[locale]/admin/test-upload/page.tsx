'use client'

import { useState } from 'react'
import { FileUpload, MultipleFileUpload } from '@/components/FileUpload'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { optimizeAndResizeImage } from '@/lib/image-upload'

export default function FileUploadTestPage() {
  const [uploadedUrl, setUploadedUrl] = useState<string>('')
  const [uploadedPublicId, setUploadedPublicId] = useState<string>('')
  const [multipleUrls, setMultipleUrls] = useState<string[]>([])
  const [multiplePublicIds, setMultiplePublicIds] = useState<string[]>([])
  const { toast } = useToast()

  const handleSingleUploadSuccess = (url: string, publicId: string) => {
    setUploadedUrl(url)
    setUploadedPublicId(publicId)
    toast({
      title: 'Upload thành công!',
      description: `File đã được upload: ${publicId}`,
    })
  }

  const handleMultipleUploadSuccess = (urls: string[], publicIds: string[]) => {
    setMultipleUrls(urls)
    setMultiplePublicIds(publicIds)
    toast({
      title: 'Upload thành công!',
      description: `Đã upload ${urls.length} file`,
    })
  }

  const handleUploadError = (error: string) => {
    toast({
      title: 'Upload thất bại',
      description: error,
      variant: 'destructive',
    })
  }

  const [optimizeStats, setOptimizeStats] = useState<{
    beforeKb: number
    afterKb: number
    ms: number
  } | null>(null)

  const runLocalOptimizeCheck = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const start = performance.now()
    const optimized = await optimizeAndResizeImage(file, {
      maxWidth: 1800,
      maxHeight: 1800,
      quality: 0.86,
      outputType: 'image/webp',
    })
    const end = performance.now()

    setOptimizeStats({
      beforeKb: Math.round(file.size / 1024),
      afterKb: Math.round(optimized.size / 1024),
      ms: Math.round(end - start),
    })
  }

  return (
    <div className="container max-w-4xl space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test File Upload</h1>
        <p className="mt-2 text-muted-foreground">Test FilePond integration với Cloudinary</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Single File Upload</CardTitle>
          <CardDescription>Upload một file ảnh</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUpload
            onUploadSuccess={handleSingleUploadSuccess}
            onUploadError={handleUploadError}
            maxFiles={1}
            allowMultiple={false}
          />

          {uploadedUrl && (
            <div className="mt-4 rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-semibold">Uploaded File:</h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Public ID:</span> {uploadedPublicId}
                </div>
                <div className="break-all text-sm">
                  <span className="font-medium">URL:</span>{' '}
                  <a
                    href={uploadedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {uploadedUrl}
                  </a>
                </div>
                <div className="aspect-product relative mt-2 max-w-md overflow-hidden rounded-lg border">
                  <img src={uploadedUrl} alt="Uploaded" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Local Optimize Check</CardTitle>
          <CardDescription>Kiểm tra tốc độ và mức nén trước khi upload</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input type="file" accept="image/*" onChange={runLocalOptimizeCheck} />
          {optimizeStats && (
            <div className="rounded-md border bg-muted p-3 text-sm">
              <div>Trước: {optimizeStats.beforeKb} KB</div>
              <div>Sau: {optimizeStats.afterKb} KB</div>
              <div>Thời gian optimize: {optimizeStats.ms} ms</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multiple Files Upload</CardTitle>
          <CardDescription>Upload nhiều file ảnh (tối đa 10)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MultipleFileUpload
            onUploadSuccess={handleMultipleUploadSuccess}
            onUploadError={handleUploadError}
            maxFiles={10}
          />

          {multipleUrls.length > 0 && (
            <div className="mt-4 rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-semibold">Uploaded Files ({multipleUrls.length}):</h4>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
                {multipleUrls.map((url, index) => (
                  <div key={index} className="space-y-2">
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="aspect-product w-full rounded-lg border object-cover"
                    />
                    <div className="break-all text-xs">
                      <span className="font-medium">Public ID:</span> {multiplePublicIds[index]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-200">💡 Lưu ý</h4>
        <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-300">
          <li>File sẽ được upload lên Cloudinary</li>
          <li>Hình ảnh sẽ được tự động optimize và convert sang WebP</li>
          <li>Kích thước tối đa: 10MB</li>
          <li>Chỉ chấp nhận các file: JPEG, PNG, WebP, GIF</li>
          <li>Cần có token xác thực để upload (đăng nhập trước)</li>
        </ul>
      </div>
    </div>
  )
}
