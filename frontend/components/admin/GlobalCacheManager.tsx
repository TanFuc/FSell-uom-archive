'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
        setLastClearedTime(
          new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        )
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
          title: 'Đã cập nhật giao diện thành công!',
          description: 'Toàn bộ khách hàng sẽ tự động nhận giao diện mới nhất khi truy cập trang web.',
        })
      } else {
        throw new Error(data.message || 'Lỗi khi kích hoạt cập nhật giao diện')
      }
    } catch (err: any) {
      toast({
        title: 'Không thể cập nhật giao diện',
        description: err?.message || 'Vui lòng thử lại sau',
        variant: 'destructive',
      })
    } finally {
      setIsClearing(false)
    }
  }

  const formatVersionDisplay = (ver: string) => {
    if (!ver) return 'Mặc định'
    if (ver.startsWith('v') && ver.length > 8) {
      const ts = Number(ver.slice(1))
      if (!isNaN(ts)) {
        return new Date(ts).toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      }
    }
    return ver
  }

  return (
    <>
      <Card className="border-[#E8E1D5] bg-[#FAF8F5] shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#8C7E6A]/15 flex items-center justify-center shrink-0 text-[#7A6A55] border border-[#8C7E6A]/20">
                <Sparkles className="w-5 h-5 text-[#8C7E6A]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif text-base font-semibold text-[#3D332A]">
                    Cập nhật giao diện cho khách hàng
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Giữ nguyên giỏ hàng & đăng nhập
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Làm mới bộ nhớ và áp dụng ngay giao diện mới nhất cho tất cả người dùng khi họ vào web.
                </p>
                <div className="text-[11px] text-stone-500 pt-0.5 flex items-center gap-2">
                  <span>
                    Bản phát hành: <span className="font-medium text-stone-700">{formatVersionDisplay(currentVersion)}</span>
                  </span>
                  {lastClearedTime && (
                    <span className="text-emerald-700 flex items-center gap-1 font-medium">
                      • <CheckCircle2 className="w-3 h-3 inline" /> Vừa làm mới lúc {lastClearedTime}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="bg-[#4A4238] hover:bg-[#8C7E6A] text-white text-xs uppercase tracking-wider font-medium px-4 py-2.5 gap-2 shrink-0 transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Làm mới giao diện ngay
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-[#3D332A] mb-1">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <DialogTitle className="font-serif text-lg font-semibold text-[#3D332A]">
                Làm mới giao diện toàn hệ thống?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-stone-600 leading-relaxed pt-2">
              Hệ thống sẽ phát hành bản cập nhật mới. Khi khách hàng mở trang web, thiết bị của họ sẽ tự động tải giao diện mới nhất (font chữ, layout, hình ảnh). Giỏ hàng và tài khoản của khách được giữ nguyên 100%.
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
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Xác nhận cập nhật
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
