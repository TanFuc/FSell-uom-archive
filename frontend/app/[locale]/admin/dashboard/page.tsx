'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Package, Users, DollarSign, Eye, LayoutGrid } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { api } from '@/lib/api'

interface DashboardStats {
  totalProducts: number
  activeProducts: number
  totalUsers: number
}

export default function DashboardPage() {
  const t = useTranslations('admin')
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalUsers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Update document title
  useDocumentTitle(t('dashboard'), 'Admin - Ươm Archive')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, usersRes] = await Promise.all([
          api.getAdminProducts({ limit: 1, includeDeleted: true }),
          api.getUsers({ limit: 1 }),
        ])

        setStats({
          totalProducts: productsRes.meta.total,
          activeProducts: productsRes.data.filter((p) => p.isActive && !p.deletedAt).length,
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
      description: `${stats.activeProducts} ${t('activeProducts')}`,
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
        <h1 className="text-2xl font-serif mb-2">{t('dashboard')}</h1>
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
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : card.value}
                </div>
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
            className="flex items-center gap-3 p-4 border hover:bg-accent transition-colors"
          >
            <Package className="h-5 w-5" />
            <div>
              <p className="font-medium">{t('manageProducts')}</p>
              <p className="text-sm text-muted-foreground">{t('manageProductsDesc')}</p>
            </div>
          </a>
          <a
            href="./theme"
            className="flex items-center gap-3 p-4 border hover:bg-accent transition-colors"
          >
            <Eye className="h-5 w-5" />
            <div>
              <p className="font-medium">{t('customizeTheme')}</p>
              <p className="text-sm text-muted-foreground">{t('customizeThemeDesc')}</p>
            </div>
          </a>
          <a
            href="./categories"
            className="flex items-center gap-3 p-4 border hover:bg-accent transition-colors"
          >
            <LayoutGrid className="h-5 w-5" />
            <div>
              <p className="font-medium">{t('categories')}</p>
              <p className="text-sm text-muted-foreground">{t('manageCategoriesDesc')}</p>
            </div>
          </a>
          <a
            href="./settings"
            className="flex items-center gap-3 p-4 border hover:bg-accent transition-colors"
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
