'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Logo from '@/components/Logo'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { ErrorToastContent } from '@/components/ui/error-toast'

type LoginFormValues = {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const t = useTranslations('admin')
  const tAuth = useTranslations('auth')
  const tValidation = useTranslations('validation')
  const { setUser } = useAuthStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const redirect = searchParams.get('redirect') || `/${locale}/admin/dashboard`

  const loginSchema = z.object({
    email: z.string().email(tValidation('emailRequired')),
    password: z.string().min(1, tValidation('passwordRequired')),
  })

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    try {
      const response = await api.login(data.email, data.password)

      // Store token in cookie for middleware
      document.cookie = `accessToken=${response.accessToken}; path=/; secure; samesite=strict`

      // Set user from login response (already includes user info)
      if (response.user) {
        setUser(response.user)
      }

      toast({
        title: t('success'),
        description: tAuth('loginSuccess'),
      })

      // Redirect to dashboard
      router.push(`/${locale}/admin/dashboard`)
    } catch (error: any) {
      console.error('Login failed:', error)

      // Extract detailed error information from API response
      let errorTitle = tAuth('loginError')
      let errorMessage = tAuth('genericError')
      let statusCode: number | undefined
      let path: string | undefined
      let method: string | undefined
      let timestamp: string | undefined

      if (error.response) {
        // API returned an error response
        const errorData = error.response.data
        statusCode = error.response.status

        // Extract error details from backend response
        errorMessage = errorData?.message || error.response.statusText || tAuth('genericError')
        path = errorData?.path
        method = errorData?.method
        timestamp = errorData?.timestamp

        // Customize error title based on status code
        if (statusCode === 401) {
          errorTitle = tAuth('authFailed')
          if (!errorData?.message) {
            errorMessage = tAuth('invalidCredentials')
          }
        } else if (statusCode === 404) {
          errorTitle = tAuth('notFound')
          errorMessage = tAuth('endpointNotFound')
        } else if (statusCode === 500) {
          errorTitle = tAuth('serverError')
          errorMessage = tAuth('serverIssue')
        } else if (statusCode === 429) {
          errorTitle = tAuth('tooManyRequests')
          errorMessage = tAuth('tooManyAttemptsMessage')
        }
      } else if (error.request) {
        // Request was made but no response received
        errorTitle = tAuth('connectionError')
        errorMessage = tAuth('connectionErrorMessage')
      } else {
        // Something else happened
        errorMessage = error.message || tAuth('genericError')
      }


      toast({
        variant: 'destructive',
        duration: 3000,
        description: (
          <ErrorToastContent
            title={errorTitle}
            message={errorMessage}
          />
        ),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo variant="svg" width={120} height={40} />
          </div>
          <CardTitle className="uppercase tracking-widest">{t('login')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="uppercase tracking-wide">{t('email')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="admin@uomarchive.com"
                        disabled={isLoading}
                        className={fieldState.error ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="uppercase tracking-wide">{t('password')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          disabled={isLoading}
                          className={fieldState.error ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full uppercase" disabled={isLoading}>
                {isLoading ? t('loading') : t('login')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
