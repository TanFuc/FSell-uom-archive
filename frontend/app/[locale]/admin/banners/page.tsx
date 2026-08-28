'use client'

import { Plus, Edit, Trash2, Power, PowerOff, MoveVertical, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUpdateBanner, useDeleteBanner } from '@/hooks/use-banners'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { type Banner } from '@/lib/types'
import { optimizeProductImage } from '@/lib/utils'

export default function BannersPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin')
  const { toast } = useToast()

  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; banner: Banner | null }>({
    open: false,
    banner: null,
  })

  const updateBanner = useUpdateBanner()
  const deleteBanner = useDeleteBanner()

  const fetchBanners = async () => {
    try {
      setIsLoading(true)

      const data = await api.getBanners(false)
      setBanners(data)
    } catch (error) {
      console.error('Failed to fetch banners:', error)
      toast({
        title: t('error'),
        description: t('banners.loadError'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  const handleDelete = async () => {
    if (!deleteDialog.banner) return

    try {
      await deleteBanner.mutateAsync(deleteDialog.banner.id)
      toast({ title: t('success'), description: t('banners.deleteSuccess') })
      fetchBanners() // Re-fetch list
    } catch (error) {
      toast({ title: t('error'), description: t('banners.deleteError'), variant: 'destructive' })
    } finally {
      setDeleteDialog({ open: false, banner: null })
    }
  }

  const handleToggleActive = async (banner: Banner, e: React.MouseEvent) => {
    e.stopPropagation()

    // Optimistic update — flip the status immediately so the UI doesn't flash
    const newIsActive = !banner.isActive
    setBanners((prev) =>
      prev.map((b) => (b.id === banner.id ? { ...b, isActive: newIsActive } : b)),
    )

    try {
      const updated = await updateBanner.mutateAsync({
        id: banner.id,
        data: { isActive: newIsActive },
      })
      // Sync with server response to ensure consistency
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, ...updated } : b)))
      toast({
        title: t('success'),
        description: newIsActive ? t('banners.activated') : t('banners.deactivated'),
      })
    } catch (error) {
      // Rollback on failure
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, isActive: banner.isActive } : b)),
      )
      toast({
        title: t('error'),
        description: t('banners.statusUpdateError'),
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl">{t('banners.pageTitle')}</h1>
          <p className="text-muted-foreground">{t('banners.pageDesc')}</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/${locale}/admin/banners/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {t('banners.create')}
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{t('image')}</TableHead>
              <TableHead>{t('name')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('banners.link')}</TableHead>
              <TableHead className="w-[100px] text-center">{t('banners.order')}</TableHead>
              <TableHead className="w-[100px] text-center">{t('status')}</TableHead>
              <TableHead className="w-[100px] text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('loading')}...
                  </div>
                </TableCell>
              </TableRow>
            ) : banners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {t('banners.empty')}
                </TableCell>
              </TableRow>
            ) : (
              banners.map((banner) => (
                <TableRow
                  key={banner.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/${locale}/admin/banners/${banner.id}`)}
                >
                  <TableCell>
                    <div className="relative aspect-video w-24 overflow-hidden rounded bg-muted">
                      <Image
                        src={optimizeProductImage(banner.imageUrl)}
                        alt={banner.titleVi || 'Banner'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {banner.titleVi || banner.titleEn || t('banners.untitled')}
                    </div>
                    <div className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {banner.subtitleVi || banner.subtitleEn}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {banner.link ? (
                      <span className="font-mono text-xs text-muted-foreground">{banner.link}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs font-medium">
                      <MoveVertical className="h-3 w-3" />
                      {banner.order}
                    </div>
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant={banner.isActive ? 'default' : 'outline'}
                      size="sm"
                      className={banner.isActive ? 'h-7 bg-green-600 hover:bg-green-700' : 'h-7'}
                      onClick={(e) => handleToggleActive(banner, e)}
                    >
                      {banner.isActive ? (
                        <>
                          <Power className="mr-1 h-3 w-3" />
                          {t('active')}
                        </>
                      ) : (
                        <>
                          <PowerOff className="mr-1 h-3 w-3" />
                          {t('inactive')}
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/${locale}/admin/banners/${banner.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteDialog({ open: true, banner })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, banner: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('banners.deleteConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('banners.deleteConfirmDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, banner: null })}
            >
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('banners.deleteAction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
