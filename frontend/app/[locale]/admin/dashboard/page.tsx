'use client'

import {
  Package,
  Users,
  DollarSign,
  LayoutGrid,
  CheckCircle,
  Star,
  KeyRound,
  Eye,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { AccountModal } from '@/components/admin/AccountModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface DashboardStats {
  totalProducts: number
  activeProducts: number
  featuredProducts: number
  totalUsers: number
}

export default function DashboardPage() {
  const t = useTranslations('admin')
  const { user: currentUser } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    featuredProducts: 0,
    totalUsers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)

  useDocumentTitle(t('dashboard'), 'Admin - ƯƠM. Archive')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsResult, usersResult] = await Promise.allSettled([
          api.getAdminProductStats(),
          api.getUsers({ limit: 1 }),
        ])

        const statsRes = statsResult.status === 'fulfilled' ? statsResult.value : null
        const usersRes = usersResult.status === 'fulfilled' ? usersResult.value : null

        setStats({
          totalProducts: statsRes?.totalProducts ?? 0,
          activeProducts: statsRes?.activeProducts ?? 0,
          featuredProducts: statsRes?.featuredProducts ?? 0,
          totalUsers: usersRes?.meta?.total ?? 0,
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

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

      <Card className="border bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              {t('accountManagement')}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Thông tin tài khoản đăng nhập và bảo mật quản trị viên.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAccountModalOpen(true)}
            className="text-xs h-8"
          >
            <KeyRound className="mr-1.5 h-3.5 w-3.5" />
            Cập nhật tài khoản & Đổi mật khẩu
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3 pt-2">
            <div className="rounded-lg border bg-card p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Họ và tên</span>
              <p className="text-sm font-semibold text-foreground mt-0.5">{currentUser?.fullName || '—'}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Email đăng nhập</span>
              <p className="text-sm font-semibold text-foreground mt-0.5">{currentUser?.email || '—'}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Quyền hạn</span>
              <p className="text-sm font-semibold text-primary mt-0.5">{currentUser?.role || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AccountModal
        open={isAccountModalOpen}
        onOpenChange={setIsAccountModalOpen}
      />
    </div>
  )
}
