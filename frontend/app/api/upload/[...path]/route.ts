import { NextResponse, type NextRequest } from 'next/server'

const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL || process.env.SITEMAP_API_URL || 'http://localhost:8888/api'

const ALLOWED_UPLOAD_PATHS = new Set(['product-image', 'product-images', 'file'])

function getTargetUrl(path: string[]) {
  const uploadPath = path.join('/')

  if (!ALLOWED_UPLOAD_PATHS.has(uploadPath)) {
    return null
  }

  return `${INTERNAL_API_URL.replace(/\/$/, '')}/upload/${uploadPath}`
}

function proxyHeaders(request: NextRequest, contentType?: string) {
  const headers = new Headers()
  const authorization = request.headers.get('authorization')
  const acceptLanguage = request.headers.get('accept-language')

  if (authorization) {
    headers.set('authorization', authorization)
  }

  if (acceptLanguage) {
    headers.set('accept-language', acceptLanguage)
  }

  if (contentType) {
    headers.set('content-type', contentType)
  }

  headers.set('ngrok-skip-browser-warning', 'true')
  return headers
}

async function toClientResponse(response: Response) {
  const headers = new Headers()
  const contentType = response.headers.get('content-type')

  if (contentType) {
    headers.set('content-type', contentType)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  const targetUrl = getTargetUrl(context.params.path)

  if (!targetUrl || !request.headers.get('content-type')?.includes('multipart/form-data')) {
    return NextResponse.json(
      { success: false, message: 'Upload endpoint not found' },
      { status: 404 },
    )
  }

  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid or incomplete multipart form data' },
      { status: 400 },
    )
  }

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: proxyHeaders(request),
    body: formData,
  })

  return toClientResponse(response)
}

export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  const targetUrl = getTargetUrl(context.params.path)

  if (!targetUrl) {
    return NextResponse.json(
      { success: false, message: 'Upload endpoint not found' },
      { status: 404 },
    )
  }

  const body = await request.text()
  const response = await fetch(targetUrl, {
    method: 'DELETE',
    headers: proxyHeaders(request, request.headers.get('content-type') ?? 'application/json'),
    body,
  })

  return toClientResponse(response)
}
