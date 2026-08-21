'use client'

import { ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const requiredBackendEnv = [
  ['UPLOAD_PROVIDER', 'r2'],
  ['IMAGE_BASE_URL', 'https://images.uomarchive.com'],
  ['R2_ENDPOINT', 'https://<account-id>.r2.cloudflarestorage.com'],
  ['R2_KEY', '<r2-access-key>'],
  ['R2_SECRET', '<r2-secret-key>'],
  ['R2_BUCKET', 'uom-archive'],
  ['R2_PUBLIC_URL', 'https://images.uomarchive.com'],
  ['R2_PUBLIC_BASE_URL', 'https://images.uomarchive.com'],
]

export default function StorageSettingsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Image Storage</h1>
        <p className="mt-2 text-muted-foreground">
          Production uploads use Cloudflare R2 and must return images.uomarchive.com URLs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>R2 Backend Environment</CardTitle>
          <CardDescription>
            Set these values in Plesk Node.js environment variables for api.uomarchive.com.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
            {requiredBackendEnv.map(([key, value]) => `${key}="${value}"`).join('\n')}
          </pre>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Upload Behavior</CardTitle>
          <CardDescription>
            The backend optimizes images to WebP, uploads them to R2, and stores the returned public
            URL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The frontend only allows the production image domain and the API upload path, so seed and
            uploaded images should stay under images.uomarchive.com.
          </p>
          <a
            href="https://dash.cloudflare.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            Open Cloudflare dashboard
            <ExternalLink className="h-4 w-4" />
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
