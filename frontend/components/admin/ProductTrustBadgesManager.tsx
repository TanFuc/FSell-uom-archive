'use client'

import React, { useState } from 'react'
import {
  PackageCheck,
  Sparkles,
  ShieldCheck,
  Truck,
  Award,
  Heart,
  RotateCcw,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useTrustBadges,
  useCreateTrustBadge,
  useUpdateTrustBadge,
  useDeleteTrustBadge,
  useToggleTrustBadgesGlobal,
  type TrustBadge,
} from '@/hooks/use-settings'

const AVAILABLE_ICONS = [
  { value: 'package', label: 'Hộp đóng gói (Package)', icon: PackageCheck },
  { value: 'sparkles', label: 'Thủ công lấp lánh (Sparkles)', icon: Sparkles },
  { value: 'shield', label: 'Bảo vệ / Đồng kiểm (Shield)', icon: ShieldCheck },
  { value: 'truck', label: 'Vận chuyển an toàn (Truck)', icon: Truck },
  { value: 'award', label: 'Chất lượng nghệ nhân (Award)', icon: Award },
  { value: 'heart', label: 'Tâm huyết / Độc bản (Heart)', icon: Heart },
  { value: 'refresh', label: 'Đổi trả / Cam kết (Refresh)', icon: RotateCcw },
]

export function getBadgeIconComponent(iconName: string) {
  switch (iconName?.toLowerCase()) {
    case 'package':
      return <PackageCheck className="w-5 h-5 text-[#8C7E6A]" />
    case 'sparkles':
      return <Sparkles className="w-5 h-5 text-[#8C7E6A]" />
    case 'shield':
      return <ShieldCheck className="w-5 h-5 text-[#8C7E6A]" />
    case 'truck':
      return <Truck className="w-5 h-5 text-[#8C7E6A]" />
    case 'award':
      return <Award className="w-5 h-5 text-[#8C7E6A]" />
    case 'heart':
      return <Heart className="w-5 h-5 text-[#8C7E6A]" />
    case 'refresh':
      return <RotateCcw className="w-5 h-5 text-[#8C7E6A]" />
    default:
      return <CheckCircle2 className="w-5 h-5 text-[#8C7E6A]" />
  }
}

export function ProductTrustBadgesManager() {
  const { data, isLoading } = useTrustBadges()
  const createMutation = useCreateTrustBadge()
  const updateMutation = useUpdateTrustBadge()
  const deleteMutation = useDeleteTrustBadge()
  const toggleGlobalMutation = useToggleTrustBadgesGlobal()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBadge, setEditingBadge] = useState<TrustBadge | null>(null)

  // Form State
  const [formIcon, setFormIcon] = useState('package')
  const [formTitleVi, setFormTitleVi] = useState('')
  const [formTitleEn, setFormTitleEn] = useState('')
  const [formDescVi, setFormDescVi] = useState('')
  const [formDescEn, setFormDescEn] = useState('')
  const [formIsVisible, setFormIsVisible] = useState(true)

  const isEnabled = data?.enabled ?? true
  const badges = data?.items || []

  const handleOpenCreate = () => {
    setEditingBadge(null)
    setFormIcon('package')
    setFormTitleVi('')
    setFormTitleEn('')
    setFormDescVi('')
    setFormDescEn('')
    setFormIsVisible(true)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (badge: TrustBadge) => {
    setEditingBadge(badge)
    setFormIcon(badge.icon || 'package')
    setFormTitleVi(badge.titleVi)
    setFormTitleEn(badge.titleEn)
    setFormDescVi(badge.descriptionVi || '')
    setFormDescEn(badge.descriptionEn || '')
    setFormIsVisible(badge.isVisible)
    setIsDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitleVi.trim() || !formTitleEn.trim()) {
      toast.error('Vui lòng nhập tiêu đề cả Tiếng Việt và Tiếng Anh')
      return
    }

    if (editingBadge) {
      await updateMutation.mutateAsync({
        id: editingBadge.id,
        data: {
          icon: formIcon,
          titleVi: formTitleVi.trim(),
          titleEn: formTitleEn.trim(),
          descriptionVi: formDescVi.trim(),
          descriptionEn: formDescEn.trim(),
          isVisible: formIsVisible,
        },
      })
    } else {
      await createMutation.mutateAsync({
        icon: formIcon,
        titleVi: formTitleVi.trim(),
        titleEn: formTitleEn.trim(),
        descriptionVi: formDescVi.trim(),
        descriptionEn: formDescEn.trim(),
        isVisible: formIsVisible,
        order: badges.length,
      })
    }

    setIsDialogOpen(false)
  }

  const handleDelete = async (id: string, titleVi: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xoá huy hiệu "${titleVi}"?`)) return
    await deleteMutation.mutateAsync(id)
  }

  const handleToggleVisible = async (badge: TrustBadge) => {
    await updateMutation.mutateAsync({
      id: badge.id,
      data: { isVisible: !badge.isVisible },
    })
  }

  const handleToggleGlobal = async (nextState: boolean) => {
    await toggleGlobalMutation.mutateAsync(nextState)
  }

  return (
    <Card className="border border-stone-200 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base uppercase tracking-wider font-semibold text-[#4A4238]">
              Huy hiệu cam kết chi tiết sản phẩm
            </CardTitle>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
              Storefront Badges
            </span>
          </div>
          <CardDescription className="text-xs text-stone-500 mt-1">
            Quản lý các cam kết hiển thị ở trang chi tiết sản phẩm (Đóng gói chống vỡ, Gốm thủ công nghệ nhân, Đồng kiểm khi nhận).
          </CardDescription>
        </div>

        <div className="flex items-center gap-3">
          {/* Global On/Off Switch */}
          <div className="flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5">
            <span className="text-xs font-medium text-stone-700">
              {isEnabled ? 'Đang bật hiển thị' : 'Đang ẩn toàn bộ'}
            </span>
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggleGlobal}
              disabled={toggleGlobalMutation.isPending}
            />
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreate}
            className="bg-[#4A4238] hover:bg-[#8C7E6A] text-white text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm huy hiệu</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {!isEnabled && (
          <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Mục cam kết hiện đang bị tắt toàn hệ thống. Bật công tắc phía trên nếu muốn hiển thị cho khách hàng trên website.
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="py-8 text-center text-xs text-stone-400">Đang tải danh sách cam kết...</div>
        ) : badges.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            Chưa có huy hiệu cam kết nào. Bấm &quot;Thêm huy hiệu&quot; để tạo mới.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`relative flex flex-col justify-between rounded-sm border p-4 transition-all ${
                  badge.isVisible && isEnabled
                    ? 'border-stone-200 bg-[#FAF9F5] shadow-2xs'
                    : 'border-stone-200/60 bg-stone-50/50 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="p-2 rounded-xs bg-white border border-stone-200/80 shadow-2xs">
                      {getBadgeIconComponent(badge.icon)}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-stone-500">
                        {badge.isVisible ? 'Hiện' : 'Ẩn'}
                      </span>
                      <Switch
                        checked={badge.isVisible}
                        onCheckedChange={() => handleToggleVisible(badge)}
                        disabled={updateMutation.isPending}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-semibold text-xs text-[#2C2620]">{badge.titleVi}</h4>
                    <p className="text-[11px] text-stone-500 font-serif italic">{badge.titleEn}</p>
                    {badge.descriptionVi && (
                      <p className="text-[10px] text-stone-400 pt-1 line-clamp-2">
                        {badge.descriptionVi}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-3 mt-3 border-t border-stone-200/60">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(badge)}
                    className="h-7 px-2 text-xs text-stone-600 hover:text-stone-900"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Sửa
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(badge.id, badge.titleVi)}
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Xoá
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold uppercase tracking-wider text-[#4A4238]">
              {editingBadge ? 'Chỉnh sửa huy hiệu cam kết' : 'Thêm huy hiệu cam kết mới'}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Huy hiệu này sẽ hiển thị ngay dưới nút Thêm vào giỏ hàng trên trang chi tiết sản phẩm.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium">Biểu tượng (Icon)</Label>
              <Select value={formIcon} onValueChange={setFormIcon}>
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue placeholder="Chọn biểu tượng" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ICONS.map((item) => {
                    const IconComp = item.icon
                    return (
                      <SelectItem key={item.value} value={item.value} className="text-xs">
                        <div className="flex items-center gap-2">
                          <IconComp className="w-4 h-4 text-[#8C7E6A]" />
                          <span>{item.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Tiêu đề Tiếng Việt *</Label>
              <Input
                value={formTitleVi}
                onChange={(e) => setFormTitleVi(e.target.value)}
                placeholder="Ví dụ: Đóng gói chống vỡ 100%"
                className="mt-1 h-9 text-xs"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Tiêu đề Tiếng Anh (English) *</Label>
              <Input
                value={formTitleEn}
                onChange={(e) => setFormTitleEn(e.target.value)}
                placeholder="Ví dụ: Breakage-Safe Packing"
                className="mt-1 h-9 text-xs"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Mô tả ngắn Tiếng Việt (Tùy chọn)</Label>
              <Input
                value={formDescVi}
                onChange={(e) => setFormDescVi(e.target.value)}
                placeholder="Ví dụ: Chống va đập đa lớp khi vận chuyển"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Mô tả ngắn Tiếng Anh (Tùy chọn)</Label>
              <Input
                value={formDescEn}
                onChange={(e) => setFormDescEn(e.target.value)}
                placeholder="Ví dụ: Multi-layer protection during transit"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-200">
              <span className="text-xs font-medium text-stone-700">Trạng thái hiển thị</span>
              <Switch checked={formIsVisible} onCheckedChange={setFormIsVisible} />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-[#4A4238] hover:bg-[#8C7E6A] text-white text-xs"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : 'Lưu huy hiệu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
