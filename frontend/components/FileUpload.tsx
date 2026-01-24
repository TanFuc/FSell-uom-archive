'use client'

import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import React, { useState } from 'react'
import { FilePond, registerPlugin } from 'react-filepond'

// Import FilePond styles
import 'filepond/dist/filepond.min.css'
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css'

// Register plugins
registerPlugin(
  FilePondPluginImagePreview,
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize,
)

interface FileUploadProps {
  onUploadSuccess?: (url: string, publicId: string) => void
  onUploadError?: (error: string) => void
  maxFiles?: number
  allowMultiple?: boolean
  folder?: string
  acceptedFileTypes?: string[]
  maxFileSize?: string
  className?: string
}

export function FileUpload({
  onUploadSuccess,
  onUploadError,
  maxFiles = 1,
  allowMultiple = false,
  folder,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxFileSize = '10MB',
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<any[]>([])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  return (
    <div className={className}>
      <FilePond
        files={files}
        onupdatefiles={setFiles}
        allowMultiple={allowMultiple}
        maxFiles={maxFiles}
        server={{
          process: {
            url: `${API_URL}/upload/product-image`,
            method: 'POST',
            headers: {
              Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''}`,
            },
            onload: (response) => {
              const data = JSON.parse(response)
              if (data.success && data.data) {
                onUploadSuccess?.(data.data.url, data.data.publicId)
              }
              return data.data?.publicId || response
            },
            onerror: (response) => {
              const errorMessage = response || 'Upload failed'
              onUploadError?.(errorMessage)
              return errorMessage
            },
          },
        }}
        name="file"
        labelIdle='Kéo thả file hoặc <span class="filepond--label-action">Chọn file</span>'
        acceptedFileTypes={acceptedFileTypes}
        maxFileSize={maxFileSize}
        labelMaxFileSizeExceeded="File quá lớn"
        labelMaxFileSize={`Kích thước tối đa: ${maxFileSize}`}
        labelFileTypeNotAllowed="Loại file không hợp lệ"
        fileValidateTypeLabelExpectedTypes="Chỉ chấp nhận file ảnh"
        credits={false}
      />
    </div>
  )
}

interface MultipleFileUploadProps {
  onUploadSuccess?: (urls: string[], publicIds: string[]) => void
  onUploadError?: (error: string) => void
  maxFiles?: number
  folder?: string
  acceptedFileTypes?: string[]
  maxFileSize?: string
  className?: string
}

export function MultipleFileUpload({
  onUploadSuccess,
  onUploadError,
  maxFiles = 10,
  folder,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxFileSize = '10MB',
  className,
}: MultipleFileUploadProps) {
  const [files, setFiles] = useState<any[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [uploadedPublicIds, setUploadedPublicIds] = useState<string[]>([])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  return (
    <div className={className}>
      <FilePond
        files={files}
        onupdatefiles={setFiles}
        allowMultiple={true}
        maxFiles={maxFiles}
        server={{
          process: {
            url: `${API_URL}/upload/product-image`,
            method: 'POST',
            headers: {
              Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''}`,
            },
            onload: (response) => {
              const data = JSON.parse(response)
              if (data.success && data.data) {
                const newUrls = [...uploadedUrls, data.data.url]
                const newPublicIds = [...uploadedPublicIds, data.data.publicId]

                setUploadedUrls(newUrls)
                setUploadedPublicIds(newPublicIds)

                // Call success callback with all uploaded files
                onUploadSuccess?.(newUrls, newPublicIds)
              }
              return data.data?.publicId || response
            },
            onerror: (response) => {
              const errorMessage = response || 'Upload failed'
              onUploadError?.(errorMessage)
              return errorMessage
            },
          },
        }}
        name="file"
        labelIdle='Kéo thả file hoặc <span class="filepond--label-action">Chọn file</span>'
        acceptedFileTypes={acceptedFileTypes}
        maxFileSize={maxFileSize}
        labelMaxFileSizeExceeded="File quá lớn"
        labelMaxFileSize={`Kích thước tối đa: ${maxFileSize}`}
        labelFileTypeNotAllowed="Loại file không hợp lệ"
        fileValidateTypeLabelExpectedTypes="Chỉ chấp nhận file ảnh"
        credits={false}
      />
    </div>
  )
}
