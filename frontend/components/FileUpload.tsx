'use client'

import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import React, { useState } from 'react'
import { FilePond, registerPlugin } from 'react-filepond'
import { getEffectiveApiBaseUrl } from '@/lib/api'

import 'filepond/dist/filepond.min.css'
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css'

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
  folder: _folder,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxFileSize = '10MB',
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<any[]>([])

  const API_URL = getEffectiveApiBaseUrl()

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
            ondata: (formData: any) => {
              if (_folder) {
                formData.append('folder', _folder)
              }
              return formData
            },
            onload: (response: any) => {
              try {
                const data = typeof response === "string" ? JSON.parse(response) : response
                const fileUrl = data?.data?.url || data?.url
                const publicId = data?.data?.publicId || data?.publicId || ""
                if (fileUrl) {
                  onUploadSuccess?.(fileUrl, publicId)
                }
                return publicId || response
              } catch {
                return response
              }
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
  folder: _folder,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxFileSize = '10MB',
  className,
}: MultipleFileUploadProps) {
  const [files, setFiles] = useState<any[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [uploadedPublicIds, setUploadedPublicIds] = useState<string[]>([])

  const API_URL = getEffectiveApiBaseUrl()

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
            ondata: (formData: any) => {
              if (_folder) {
                formData.append('folder', _folder)
              }
              return formData
            },
            onload: (response: any) => {
              try {
                const data = typeof response === "string" ? JSON.parse(response) : response
                const fileUrl = data?.data?.url || data?.url
                const publicId = data?.data?.publicId || data?.publicId || ""
                if (fileUrl) {
                  const newUrls = [...uploadedUrls, fileUrl]
                  const newPublicIds = [...uploadedPublicIds, publicId]
                  setUploadedUrls(newUrls)
                  setUploadedPublicIds(newPublicIds)
                  onUploadSuccess?.(newUrls, newPublicIds)
                }
                return publicId || response
              } catch {
                return response
              }
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
