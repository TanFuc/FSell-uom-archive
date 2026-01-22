'use client'

import { useState } from 'react'
import { FileUpload, MultipleFileUpload } from '@/components/FileUpload'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function FileUploadTestPage() {
  const [uploadedUrl, setUploadedUrl] = useState< string>('')
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

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test File Upload</h1>
        <p className="text-muted-foreground mt-2">Test FilePond integration với Cloudinary</p>
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
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Uploaded File:</h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Public ID:</span> {uploadedPublicId}
                </div>
                <div className="text-sm break-all">
                  <span className="font-medium">URL:</span>{' '}
                  <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {uploadedUrl}
                  </a>
                </div>
                <div className="mt-2 max-w-md aspect-product relative rounded-lg border overflow-hidden">
                  <img src={uploadedUrl} alt="Uploaded" className="w-full h-full object-cover" />
                </div>
              </div>
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
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Uploaded Files ({multipleUrls.length}):</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {multipleUrls.map((url, index) => (
                  <div key={index} className="space-y-2">
                    <img src={url} alt={`Upload ${index + 1}`} className="w-full aspect-product object-cover rounded-lg border" />
                    <div className="text-xs break-all">
                      <span className="font-medium">Public ID:</span> {multiplePublicIds[index]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Lưu ý</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
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
