'use client'

import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import React, { useState } from 'react'
import { FilePond, registerPlugin } from 'react-filepond'

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
  folder = 'products',
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxFileSize = '10MB',
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<any[]>([])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api'

  const processUpload = (
    _fieldName: string,
    file: Blob,
    _metadata: Record<string, unknown>,
    load: (serverFileReference: string) => void,
    error: (errorText: string) => void,
    progress: (computable: boolean, current: number, total: number) => void,
    abort: () => void,
  ) => {
    const request = new XMLHttpRequest()
    const formData = new FormData()

    formData.append('file', file)
    formData.append('folder', folder)

    request.open('POST', `${API_URL}/upload/product-image`)

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (token) {
      request.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    request.upload.onprogress = (event) => {
      progress(event.lengthComputable, event.loaded, event.total)
    }

    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        const errorMessage = request.responseText || 'Upload failed'
        onUploadError?.(errorMessage)
        error(errorMessage)
        return
      }

      const data = JSON.parse(request.responseText)
      if (data.success && data.data) {
        onUploadSuccess?.(data.data.url, data.data.publicId)
      }
      load(data.data?.publicId || data.data?.url || request.responseText)
    }

    request.onerror = () => {
      const errorMessage = 'Upload failed'
      onUploadError?.(errorMessage)
      error(errorMessage)
    }

    request.send(formData)

    return {
      abort: () => {
        request.abort()
        abort()
      },
    }
  }

  return (
    <div className={className}>
      <FilePond
        files={files}
        onupdatefiles={setFiles}
        allowMultiple={allowMultiple}
        maxFiles={maxFiles}
        server={{
          process: processUpload,
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
  folder = 'products',
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxFileSize = '10MB',
  className,
}: MultipleFileUploadProps) {
  const [files, setFiles] = useState<any[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [uploadedPublicIds, setUploadedPublicIds] = useState<string[]>([])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api'

  const processUpload = (
    _fieldName: string,
    file: Blob,
    _metadata: Record<string, unknown>,
    load: (serverFileReference: string) => void,
    error: (errorText: string) => void,
    progress: (computable: boolean, current: number, total: number) => void,
    abort: () => void,
  ) => {
    const request = new XMLHttpRequest()
    const formData = new FormData()

    formData.append('file', file)
    formData.append('folder', folder)

    request.open('POST', `${API_URL}/upload/product-image`)

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (token) {
      request.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    request.upload.onprogress = (event) => {
      progress(event.lengthComputable, event.loaded, event.total)
    }

    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        const errorMessage = request.responseText || 'Upload failed'
        onUploadError?.(errorMessage)
        error(errorMessage)
        return
      }

      const data = JSON.parse(request.responseText)
      if (data.success && data.data) {
        const newUrls = [...uploadedUrls, data.data.url]
        const newPublicIds = [...uploadedPublicIds, data.data.publicId]

        setUploadedUrls(newUrls)
        setUploadedPublicIds(newPublicIds)

        onUploadSuccess?.(newUrls, newPublicIds)
      }
      load(data.data?.publicId || data.data?.url || request.responseText)
    }

    request.onerror = () => {
      const errorMessage = 'Upload failed'
      onUploadError?.(errorMessage)
      error(errorMessage)
    }

    request.send(formData)

    return {
      abort: () => {
        request.abort()
        abort()
      },
    }
  }

  return (
    <div className={className}>
      <FilePond
        files={files}
        onupdatefiles={setFiles}
        allowMultiple={true}
        maxFiles={maxFiles}
        server={{
          process: processUpload,
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
