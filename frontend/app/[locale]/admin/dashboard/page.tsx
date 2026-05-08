'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Package, Users, DollarSign, Eye, EyeOff, LayoutGrid, CheckCircle, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface DashboardStats {
  totalProducts: number
  activeProducts: number
  featuredProducts: number
  totalUsers: number
}

const accountSchema = z
  .object({
    email: z.string().email('Invalid email'),
    currentPassword: z.string().optional().or(z.literal('')),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .optional()
      .or(z.literal('')),
    confirmNewPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (
      (data.newPassword || data.confirmNewPassword) &&
      data.newPassword !== data.confirmNewPassword
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmNewPassword'],
        message: 'Passwords do not match',
      })
    }

    if (data.newPassword && !data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentPassword'],
        message: 'Current password is required',
      })
    }
  })

type AccountFormValues = z.infer<typeof accountSchema>

function extractBackendMessages(error: unknown): string[] {
  const responseMessage = (error as any)?.response?.data?.message

  if (Array.isArray(responseMessage)) return responseMessage.map((message) => String(message))
  if (typeof responseMessage === 'string') return [responseMessage]
  if (typeof (error as any)?.message === 'string') return [(error as any).message]

  return []
}

export default function DashboardPage() {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const { user: currentUser, setUser } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    featuredProducts: 0,
    totalUsers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  useDocumentTitle(t('dashboard'), 'Admin - ƯƠM. Archive')

  useEffect(() => {
    if (!currentUser?.email) return

    accountForm.reset({
      email: currentUser.email,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    })
  }, [currentUser?.email, accountForm])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          api.getAdminProductStats(),
          api.getUsers({ limit: 1 }),
        ])

        setStats({
          totalProducts: statsRes.totalProducts,
          activeProducts: statsRes.activeProducts,
          featuredProducts: statsRes.featuredProducts,
          totalUsers: usersRes.meta.total,
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const onUpdateAccount = async (data: AccountFormValues) => {
    accountForm.clearErrors(['email', 'currentPassword', 'newPassword', 'confirmNewPassword'])

    const payload: { email?: string; currentPassword?: string; newPassword?: string } = {}

    if (data.email && data.email !== currentUser?.email) {
      payload.email = data.email
    }

    if (data.newPassword) {
      payload.currentPassword = data.currentPassword
      payload.newPassword = data.newPassword
    }

    if (!payload.email && !payload.newPassword) {
      toast({ title: t('error'), description: t('noChangesToUpdate'), variant: 'destructive' })
      return
    }

    try {
      const updatedUser = await api.updateMyProfile(payload)
      setUser({
        ...currentUser,
        ...updatedUser,
      })

      accountForm.reset({
        email: updatedUser.email,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      })

      toast({ title: t('success'), description: t('accountUpdated') })
    } catch (error) {
      const messages = extractBackendMessages(error)
      let hasFieldError = false

      messages.forEach((message) => {
        const normalized = message.toLowerCase()

        if (normalized.includes('email')) {
          accountForm.setError('email', { type: 'server', message })
          hasFieldError = true
          return
        }

        if (normalized.includes('current password')) {
          accountForm.setError('currentPassword', { type: 'server', message })
          hasFieldError = true
          return
        }

        if (normalized.includes('password')) {
          accountForm.setError('newPassword', { type: 'server', message })
          hasFieldError = true
        }
      })

      if (!hasFieldError) {
        toast({
          title: t('error'),
          description: messages[0] || t('failedToUpdateAccount'),
          variant: 'destructive',
        })
      }
    }
  }

  const statCards = [
    {
      title: t('totalProducts'),
      value: stats.totalProducts,
      icon: Package,
      description: t('manageProductsDesc'),
    },
    {
      title: t('active'),
      value: stats.activeProducts,
      icon: CheckCircle,
      description: t('activeProducts'),
    },
    {
      title: t('featured'),
      value: stats.featuredProducts,
      icon: Star,
      description: t('featuredProducts'),
    },
    {
      title: t('totalAdmins'),
      value: stats.totalUsers,
      icon: Users,
      description: t('users'),
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 font-serif text-2xl">{t('dashboard')}</h1>
        <p className="text-muted-foreground">{t('welcomeMessage')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wide">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wide">
            {t('quickActions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <a
            href="./products"
            className="flex items-center gap-3 border p-4 transition-colors hover:bg-stone-100"
          >
            <Package className="h-5 w-5" />
            <div>
              <p className="font-medium">{t('manageProducts')}</p>
              <p className="text-sm text-muted-foreground">{t('manageProductsDesc')}</p>
            </div>
          </a>
          <a
            href="./theme"
            className="flex items-center gap-3 border p-4 transition-colors hover:bg-stone-100"
          >
            <Eye className="h-5 w-5" />
            <div>
              <p className="font-medium">{t('customizeTheme')}</p>
              <p className="text-sm text-muted-foreground">{t('customizeThemeDesc')}</p>
            </div>
          </a>
          <a
            href="./categories"
            className="flex items-center gap-3 border p-4 transition-colors hover:bg-stone-100"
          >
            <LayoutGrid className="h-5 w-5" />
            <div>
              <p className="font-medium">{t('categories')}</p>
              <p className="text-sm text-muted-foreground">{t('manageCategoriesDesc')}</p>
            </div>
          </a>
          <a
            href="./settings"
            className="flex items-center gap-3 border p-4 transition-colors hover:bg-stone-100"
          >
            <DollarSign className="h-5 w-5" />
            <div>
              <p className="font-medium">{t('settings')}</p>
              <p className="text-sm text-muted-foreground">{t('settingsDesc')}</p>
            </div>
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wide">
            {t('accountManagement')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...accountForm}>
            <form onSubmit={accountForm.handleSubmit(onUpdateAccount)} className="space-y-4">
              <FormField
                control={accountForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('loginAccountEmail')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={accountForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('currentPassword')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input {...field} type={showCurrentPassword ? 'text' : 'password'} className="pr-10" />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowCurrentPassword((v) => !v)}
                            tabIndex={-1}
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={accountForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('newPassword')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input {...field} type={showNewPassword ? 'text' : 'password'} className="pr-10" />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowNewPassword((v) => !v)}
                            tabIndex={-1}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={accountForm.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('confirmNewPassword')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} type={showConfirmPassword ? 'text' : 'password'} className="pr-10" />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">{t('updateAccount')}</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
