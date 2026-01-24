'use client'

import { Package, Users, DollarSign, Eye, LayoutGrid, CheckCircle, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { api } from '@/lib/api'

interface DashboardStats {
  totalProducts: number
  activeProducts: number
  featuredProducts: number
  totalUsers: number
}

export default function DashboardPage() {
  const t = useTranslations('admin')
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    featuredProducts: 0,
    totalUsers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Update document title
  useDocumentTitle(t('dashboard'), 'Admin - Ươm Archive')

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
            className="flex items-center gap-3 border p-4 transition-colors hover:bg-accent"
          >
            <Package className="h-5 w-5" />
            <div>
              <p className="font-medium">{t('manageProducts')}</p>
              <p className="text-sm text-muted-foreground">{t('manageProductsDesc')}</p>
            </div>
          </a>
          <a
            href="./theme"
            className="flex items-center gap-3 border p-4 transition-colors hover:bg-accent"
          >
            <Eye className="h-5 w-5" />
            <div>
              <p className="font-medium">{t('customizeTheme')}</p>
              <p className="text-sm text-muted-foreground">{t('customizeThemeDesc')}</p>
            </div>
          </a>
          <a
            href="./categories"
            className="flex items-center gap-3 border p-4 transition-colors hover:bg-accent"
          >
            <LayoutGrid className="h-5 w-5" />
            <div>
              <p className="font-medium">{t('categories')}</p>
              <p className="text-sm text-muted-foreground">{t('manageCategoriesDesc')}</p>
            </div>
          </a>
          <a
            href="./settings"
            className="flex items-center gap-3 border p-4 transition-colors hover:bg-accent"
          >
            <DollarSign className="h-5 w-5" />
            <div>
              <p className="font-medium">{t('settings')}</p>
              <p className="text-sm text-muted-foreground">{t('settingsDesc')}</p>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
