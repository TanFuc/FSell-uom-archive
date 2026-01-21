'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Search, MoreHorizontal, Edit, Trash2, RotateCcw, Shield, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import { User } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/lib/store'

const userSchema = z.object({
  email: z.string().email('Invalid email'),
  fullName: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'MANAGER']),
})

type UserFormValues = z.infer<typeof userSchema>

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
      role: user.role,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: UserFormValues) => {
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
        if (!data.password) {
          toast({ title: t('error'), description: 'Password is required', variant: 'destructive' })
          return
        }
        await api.createUser({
          email: data.email,
          fullName: data.fullName,
          password: data.password,
          role: data.role,
        })
        toast({ title: t('success'), description: 'User created' })
      }
      setDialogOpen(false)
      fetchUsers()
    } catch (error) {
      toast({ title: t('error'), description: 'Failed to save user', variant: 'destructive' })
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

  // Only ADMIN can access this page
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">Access denied. Admin only.</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">{t('users')}</h1>
          <p className="text-muted-foreground">Manage admin users</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={includeDeleted} onCheckedChange={setIncludeDeleted} />
          <span className="text-sm">Show deleted</span>
        </div>
      </div>

      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t('loading')}...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
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
                      <Badge variant="destructive">Deleted</Badge>
                    ) : user.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
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
            <DialogTitle>{editingUser ? t('edit') : t('create')} User</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
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
                    <FormLabel>Email</FormLabel>
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
                    <FormLabel>
                      Password {editingUser && '(leave empty to keep current)'}
                    </FormLabel>
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
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
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
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
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
