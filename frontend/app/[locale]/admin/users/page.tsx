'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  RotateCcw,
  Shield,
  User as UserIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { type User } from '@/lib/types'

const userSchema = z.object({
  email: z.string().email('Invalid email'),
  fullName: z.string().min(1, 'Name is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional()
    .or(z.literal('')),
  confirmPassword: z
    .string()
    .min(8, 'Confirm password must be at least 8 characters')
    .optional()
    .or(z.literal('')),
  role: z.enum(['ADMIN', 'MANAGER']),
})

type UserFormValues = z.infer<typeof userSchema>

function extractBackendMessages(error: unknown): string[] {
  const responseMessage = (error as any)?.response?.data?.message

  if (Array.isArray(responseMessage)) {
    return responseMessage.map((message) => String(message))
  }

  if (typeof responseMessage === 'string') {
    return [responseMessage]
  }

  if (typeof (error as any)?.message === 'string') {
    return [(error as any).message]
  }

  return []
}

export default function UsersPage() {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const { user: currentUser } = useAuthStore()

  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  })

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
      role: 'MANAGER',
    },
  })

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.getUsers({
        search: search || undefined,
        includeDeleted,
        limit: 100,
      })
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast({
        title: t('error'),
        description: 'Failed to load users',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [search, includeDeleted, t, toast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const openCreateDialog = () => {
    setEditingUser(null)
    form.reset({
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
      role: 'MANAGER',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    form.reset({
      email: user.email,
      fullName: user.fullName,
      password: '',
      confirmPassword: '',
      role: user.role,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: UserFormValues) => {
    form.clearErrors(['email', 'fullName', 'password', 'confirmPassword'])

    if (!editingUser && !data.password) {
      form.setError('password', {
        type: 'manual',
        message: 'Password is required',
      })
      return
    }

    if ((data.password || data.confirmPassword) && data.password !== data.confirmPassword) {
      form.setError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match',
      })
      return
    }

    try {
      if (editingUser) {
        const updateData: Partial<User & { password?: string }> = {
          email: data.email,
          fullName: data.fullName,
          role: data.role,
        }
        if (data.password) {
          updateData.password = data.password
        }
        await api.updateUser(editingUser.id, updateData)
        toast({ title: t('success'), description: 'User updated' })
      } else {
        await api.createUser({
          email: data.email,
          fullName: data.fullName,
          password: data.password!,
          role: data.role,
        })
        toast({ title: t('success'), description: 'User created' })
      }
      setDialogOpen(false)
      fetchUsers()
    } catch (error) {
      const messages = extractBackendMessages(error)
      let hasFieldError = false

      messages.forEach((message) => {
        const normalizedMessage = message.toLowerCase()

        if (normalizedMessage.includes('email')) {
          form.setError('email', {
            type: 'server',
            message,
          })
          hasFieldError = true
          return
        }

        if (normalizedMessage.includes('password')) {
          form.setError('password', {
            type: 'server',
            message,
          })
          hasFieldError = true
          return
        }

        if (normalizedMessage.includes('full name') || normalizedMessage.includes('fullname')) {
          form.setError('fullName', {
            type: 'server',
            message,
          })
          hasFieldError = true
        }
      })

      if (!hasFieldError) {
        toast({
          title: t('error'),
          description: messages[0] || 'Failed to save user',
          variant: 'destructive',
        })
      }
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.user) return

    try {
      await api.deleteUser(deleteDialog.user.id)
      toast({ title: t('success'), description: 'User deleted' })
      fetchUsers()
    } catch (error) {
      toast({ title: t('error'), description: 'Failed to delete', variant: 'destructive' })
    } finally {
      setDeleteDialog({ open: false, user: null })
    }
  }

  const handleRestore = async (user: User) => {
    try {
      await api.restoreUser(user.id)
      toast({ title: t('success'), description: 'User restored' })
      fetchUsers()
    } catch (error) {
      toast({ title: t('error'), description: 'Failed to restore', variant: 'destructive' })
    }
  }

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">{t('accessDenied')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl">{t('users')}</h1>
          <p className="text-muted-foreground">{t('manageAdminUsers')}</p>
        </div>
        <Button onClick={openCreateDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('addUser')}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Switch checked={includeDeleted} onCheckedChange={setIncludeDeleted} />
          <span className="text-sm">{t('showDeleted')}</span>
        </div>
      </div>

      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('email')}</TableHead>
              <TableHead>{t('role')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead className="w-12">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">
                  {t('loading')}...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">
                  {t('noResults')}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className={user.deletedAt ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.role === 'ADMIN' ? (
                        <Shield className="h-4 w-4 text-primary" />
                      ) : (
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                      {user.fullName}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.deletedAt ? (
                      <Badge variant="destructive">{t('deleted')}</Badge>
                    ) : user.isActive ? (
                      <Badge variant="default">{t('active')}</Badge>
                    ) : (
                      <Badge variant="secondary">{t('inactive')}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={user.id === currentUser?.id}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!user.deletedAt ? (
                          <>
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog({ open: true, user })}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('delete')}
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => handleRestore(user)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {t('restore')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? t('edit') : t('create')} {t('user')}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fullName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('passwordHint')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('role')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectRole')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADMIN">{t('roleAdmin')}</SelectItem>
                        <SelectItem value="MANAGER">{t('roleManager')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit">{t('save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, user: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmDelete')}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.user?.fullName}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
