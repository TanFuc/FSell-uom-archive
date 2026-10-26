'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle2, Sparkles, HardDrive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface GlobalCacheManagerProps {
  initialVersion?: string
}

export function GlobalCacheManager({ initialVersion = 'v1' }: GlobalCacheManagerProps) {
  const { toast } = useToast()
  const [currentVersion, setCurrentVersion] = useState(initialVersion)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [lastClearedTime, setLastClearedTime] = useState<string | null>(null)

  const handleClearCache = async () => {
    setIsClearing(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const res = await fetch('/api/clear-client-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      const data = await res.json()

      if (data.success) {
        const newVer = data.version || `v${Date.now()}`
        setCurrentVersion(newVer)
        setLastClearedTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
        setIsConfirmOpen(false)

        // Clear local browser's own cache as well
        if (typeof window !== 'undefined') {
          if ('caches' in window) {
            caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
          }
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()))
          }
          localStorage.setItem('uom_ui_cache_version', newVer)
        }

        toast({
          title: 'Đã xóa cache toàn hệ thống thành công!',
          description: 'Mã phiên bản giao diện đã được cập nhật. Tất cả người dùng sẽ tự động làm mới giao diện ngay khi vào trang.',
        })
      } else {
        throw new Error(data.message || 'Lỗi khi kích hoạt xóa cache')
      }
    } catch (err: any) {
      toast({
        title: 'Không thể xóa cache',
        description: err?.message || 'Vui lòng thử lại sau',
        variant: 'destructive',
      })
    } finally {
      setIsClearing(false)
    }
  }

  const formatVersionDisplay = (ver: string) => {
    if (!ver) return 'Mặc định (Chưa đặt)'
    if (ver.startsWith('v') && ver.length > 8) {
      const ts = Number(ver.slice(1))
      if (!isNaN(ts)) {
        return `Phiên bản ${ver} (${new Date(ts).toLocaleString('vi-VN')})`
      }
    }
    return `Phiên bản ${ver}`
  }

  return (
    <>
      <Card className="border-[#E8E1D5] bg-[#FAF8F5]/80 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-[#ECE4D8]/80">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#8C7E6A]/15 flex items-center justify-center text-[#7A6A55]">
                <HardDrive className="w-4 h-4 text-[#8C7E6A]" />
              </div>
              <div>
                <CardTitle className="font-serif text-base font-semibold text-[#3D332A]">
                  Xóa Cache & Reset Giao Diện Cho Tất Cả Người Dùng
                </CardTitle>
                <CardDescription className="text-xs text-stone-500 mt-0.5">
                  Làm mới bộ nhớ đệm (CacheStorage & Service Worker) của tất cả khách hàng và thiết bị cũ
                </CardDescription>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="bg-[#4A4238] hover:bg-[#8C7E6A] text-white text-xs font-medium px-4 py-2 gap-2 shrink-0 transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Xóa cache toàn hệ thống
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-3.5 text-xs text-[#5C5042]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-sm bg-white/70 border border-[#E7E0D4] space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C7E6A]">
                Mã phiên bản giao diện hiện tại
              </span>
              <p className="font-mono text-xs font-semibold text-[#2C241D]">
                {formatVersionDisplay(currentVersion)}
              </p>
              {lastClearedTime && (
                <p className="text-[11px] text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Vừa xóa lúc: {lastClearedTime}
                </p>
              )}
            </div>

            <div className="p-3 rounded-sm bg-white/70 border border-[#E7E0D4] space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C7E6A]">
                Cơ chế hoạt động an toàn
              </span>
              <p className="text-[11px] leading-relaxed text-stone-600">
                Khi kích hoạt, hệ thống sẽ tự động gỡ bỏ Service Worker, xóa CacheStorage và tải lại toàn bộ CSS, JS, ảnh giao diện mới nhất. Giỏ hàng và tài khoản đăng nhập của khách hàng được giữ nguyên 100%.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-[#3D332A] mb-1">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                <RefreshCw className="w-4 h-4" />
              </div>
              <DialogTitle className="font-serif text-lg font-semibold">
                Xác nhận xóa cache toàn bộ người dùng?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-stone-600 leading-relaxed pt-2">
              Hành động này sẽ nâng mã phiên bản giao diện website. Toàn bộ người dùng truy cập (cả khách vãng lai và thành viên) sẽ tự động làm mới bộ nhớ đệm trình duyệt để nhận ngay bản cập nhật mới nhất (font chữ, layout, nút bấm...).
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isClearing}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isClearing}
              onClick={handleClearCache}
              className="bg-[#4A4238] hover:bg-[#8C7E6A] text-white gap-1.5"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Xác nhận & Reset ngay
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
