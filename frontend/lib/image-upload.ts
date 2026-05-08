export interface ImageOptimizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  outputType?: 'image/webp' | 'image/jpeg' | 'image/png'
  keepGif?: boolean
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to decode image file'))
    }

    image.src = objectUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create optimized image blob'))
          return
        }
        resolve(blob)
      },
      type,
      quality,
    )
  })
}

export async function optimizeAndResizeImage(
  file: File,
  options: ImageOptimizeOptions = {},
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.86,
    outputType = 'image/webp',
    keepGif = true,
  } = options

  if (keepGif && file.type === 'image/gif') {
    return file
  }

  const image = await loadImageFromFile(file)
  const width = image.naturalWidth
  const height = image.naturalHeight
  const scale = Math.min(maxWidth / width, maxHeight / height, 1)

  const targetWidth = Math.max(1, Math.round(width * scale))
  const targetHeight = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) {
    throw new Error('Canvas context is not available')
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight)

  const blob = await canvasToBlob(canvas, outputType, quality)
  const outputExtension = outputType === 'image/jpeg' ? 'jpg' : outputType.split('/')[1]
  const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
  const optimizedFileName = `${fileNameWithoutExt}.${outputExtension}`

  return new File([blob], optimizedFileName, {
    type: outputType,
    lastModified: Date.now(),
  })
}

export async function optimizeAndResizeImages(
  files: File[],
  options: ImageOptimizeOptions = {},
): Promise<File[]> {
  return Promise.all(files.map((file) => optimizeAndResizeImage(file, options)))
}
