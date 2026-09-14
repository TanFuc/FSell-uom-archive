'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, KeyRound, Shield, User as UserIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import type { UpdateMyProfileDto } from '@/lib/types'

const accountSchema = z
  .object({
    email: z.string().email('Email không hợp lệ'),
    currentPassword: z.string().optional().or(z.literal('')),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu mới tối thiểu 8 ký tự')
      .optional()
      .or(z.literal('')),
    confirmNewPassword: z
      .string()
      .min(8, 'Mật khẩu xác nhận tối thiểu 8 ký tự')
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
        message: 'Mật khẩu xác nhận không khớp',
      })
    }

    if (data.newPassword && !data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentPassword'],
        message: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu',
      })
    }
  })

type AccountFormValues = z.infer<typeof accountSchema>

interface AccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountModal({ open, onOpenChange }: AccountModalProps) {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const { user: currentUser, setUser } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: currentUser?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  useEffect(() => {
    if (currentUser?.email) {
      form.setValue('email', currentUser.email)
    }
  }, [currentUser?.email, form, open])

  const onSubmit = async (values: AccountFormValues) => {
    const payload: UpdateMyProfileDto = {}
    if (values.email && values.email !== currentUser?.email) {
      payload.email = values.email
    }
    if (values.newPassword) {
      payload.currentPassword = values.currentPassword
      payload.newPassword = values.newPassword
    }

    if (Object.keys(payload).length === 0) {
      toast({
        title: 'Thông báo',
        description: 'Không có thay đổi nào được thực hiện.',
      })
      onOpenChange(false)
      return
    }

    setIsSubmitting(true)
    try {
      const updatedUser = await api.updateMyProfile(payload)
      setUser(updatedUser)
      toast({
        title: t('success'),
        description: 'Cập nhật tài khoản thành công.',
      })
      form.reset({
        email: updatedUser.email,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      })
      onOpenChange(false)
    } catch (error: any) {
      const serverMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể cập nhật tài khoản. Vui lòng kiểm tra lại thông tin.'
      toast({
        title: t('error'),
        description: Array.isArray(serverMsg) ? serverMsg.join(', ') : serverMsg,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserIcon className="h-5 w-5 text-primary" />
            Quản lý tài khoản cá nhân
          </DialogTitle>
          <DialogDescription>
            Xem thông tin tài khoản và cập nhật email hoặc mật khẩu đăng nhập.
          </DialogDescription>
        </DialogHeader>

        {currentUser && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3 text-xs">
            <div className="space-y-0.5">
              <p className="font-semibold text-foreground">{currentUser.fullName}</p>
              <p className="text-muted-foreground">{currentUser.email}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
              <Shield className="h-3 w-3" />
              {currentUser.role}
            </span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">
                    Email đăng nhập <span className="text-destructive font-bold">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="admin@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2">
                <KeyRound className="h-3.5 w-3.5" />
                Đổi mật khẩu (bỏ trống nếu không đổi)
              </p>

              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Mật khẩu hiện tại</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showCurrentPassword ? 'text' : 'password'}
                            placeholder="Nhập mật khẩu hiện tại"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowCurrentPassword((v) => !v)}
                            tabIndex={-1}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Mật khẩu mới</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="Tối thiểu 8 ký tự"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowNewPassword((v) => !v)}
                            tabIndex={-1}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Xác nhận mật khẩu mới</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Nhập lại mật khẩu mới"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
