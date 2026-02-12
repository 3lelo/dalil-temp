import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2, Users, Shield, ShieldCheck, UserPlus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  username: string | null;
  email?: string;
  avatar_url: string | null;
  created_at: string;
  role: string | null;
}

const AVATARS = Array.from({ length: 8 }, (_, i) => `/assets/avatars/avatar${i + 1}.png`);

const USERS_PER_PAGE = 10;

export default function UsersManager() {
  const { t, dir } = useI18n();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [privilegedPage, setPrivilegedPage] = useState(1);
  const [regularPage, setRegularPage] = useState(1);

  // Create user dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    username: '',
    avatar_url: AVATARS[0],
    role: 'none' as string,
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const roleMap = new Map<string, string>();
      roles?.forEach((r) => roleMap.set(r.user_id, r.role));

      const usersWithRoles: UserWithRole[] = (profiles || []).map((p) => ({
        ...p,
        role: roleMap.get(p.id) || null,
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      await supabase.from('user_roles').delete().eq('user_id', userId);

      if (newRole !== 'none') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: newRole === 'none' ? null : newRole } : u
        )
      );
      toast.success(t('admin.saved'));
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(t('common.error'));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.username) {
      toast.error(t('admin.createUserFieldsRequired'));
      return;
    }
    if (newUser.password.length < 6) {
      toast.error(t('auth.error.passwordShort'));
      return;
    }

    setIsCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          username: newUser.username,
          avatar_url: newUser.avatar_url,
          role: newUser.role,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(t('admin.userCreated'));
      setCreateDialogOpen(false);
      setNewUser({ email: '', password: '', username: '', avatar_url: AVATARS[0], role: 'none' });
      await loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      const response = await supabase.functions.invoke('delete-user', {
        body: { user_id: deletingUser.id },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(t('admin.userDeleted'));
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
            <ShieldCheck className="h-3 w-3 me-1" />
            {t('admin.roleAdmin')}
          </Badge>
        );
      case 'algorithm_editor':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            <Shield className="h-3 w-3 me-1" />
            {t('admin.roleAlgorithmEditor')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            {t('admin.roleUser')}
          </Badge>
        );
    }
  };

  // Reset pages on search change
  useEffect(() => {
    setPrivilegedPage(1);
    setRegularPage(1);
  }, [searchQuery]);

  // Filter out current user and separate by role
  const otherUsers = users.filter((u) => u.id !== currentUser?.id);
  const filteredBySearch = searchQuery.trim()
    ? otherUsers.filter(
        (u) =>
          u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : otherUsers;

  const privilegedUsers = filteredBySearch.filter((u) => u.role === 'admin' || u.role === 'algorithm_editor');
  const regularUsers = filteredBySearch.filter((u) => !u.role);

  const privilegedTotalPages = Math.max(1, Math.ceil(privilegedUsers.length / USERS_PER_PAGE));
  const regularTotalPages = Math.max(1, Math.ceil(regularUsers.length / USERS_PER_PAGE));

  const paginatedPrivileged = privilegedUsers.slice((privilegedPage - 1) * USERS_PER_PAGE, privilegedPage * USERS_PER_PAGE);
  const paginatedRegular = regularUsers.slice((regularPage - 1) * USERS_PER_PAGE, regularPage * USERS_PER_PAGE);

  const PaginationControls = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          {dir === 'rtl' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentPage} / {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          {dir === 'rtl' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    );
  };

  const renderUserRow = (user: UserWithRole) => (
    <TableRow key={user.id}>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url || ''} />
            <AvatarFallback className="text-xs">
              {user.username?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{user.username || '-'}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {user.email || '-'}
      </TableCell>
      <TableCell>{getRoleBadge(user.role)}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(user.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Select
            value={user.role || 'none'}
            onValueChange={(value) => handleRoleChange(user.id, value)}
            disabled={updatingUserId === user.id}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className='dash-item'>{t('admin.roleUser')}</SelectItem>
              <SelectItem value="algorithm_editor" className='dash-item'>{t('admin.roleAlgorithmEditor')}</SelectItem>
              <SelectItem value="admin" className='dash-item'>{t('admin.roleAdmin')}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeletingUser(user)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('admin.usersManager')}
            </CardTitle>
            <CardDescription>{t('admin.usersManagerDesc')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{users.length} {t('admin.totalUsers')}</Badge>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4 me-2" />
              {t('admin.createUser')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.searchUsers')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>

          <Tabs defaultValue="privileged" dir={dir}>
            <TabsList className="mb-4">
              <TabsTrigger value="privileged" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                {t('admin.privilegedUsers')} ({privilegedUsers.length})
              </TabsTrigger>
              <TabsTrigger value="regular" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('admin.regularUsers')} ({regularUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="privileged">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.user')}</TableHead>
                    <TableHead>{t('admin.email')}</TableHead>
                    <TableHead>{t('admin.role')}</TableHead>
                    <TableHead>{t('admin.joinDate')}</TableHead>
                    <TableHead>{t('admin.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPrivileged.map(renderUserRow)}
                  {privilegedUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {t('admin.noPrivilegedUsers')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <PaginationControls currentPage={privilegedPage} totalPages={privilegedTotalPages} onPageChange={setPrivilegedPage} />
            </TabsContent>

            <TabsContent value="regular">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.user')}</TableHead>
                    <TableHead>{t('admin.email')}</TableHead>
                    <TableHead>{t('admin.role')}</TableHead>
                    <TableHead>{t('admin.joinDate')}</TableHead>
                    <TableHead>{t('admin.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRegular.map(renderUserRow)}
                  {regularUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {t('dashboard.noResults')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <PaginationControls currentPage={regularPage} totalPages={regularTotalPages} onPageChange={setRegularPage} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader style={{paddingTop: "1rem"}}>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t('admin.createUser')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>{t('admin.selectAvatar')}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setNewUser({ ...newUser, avatar_url: avatar })}
                    className={`rounded-full p-0.5 border-2 transition-colors ${
                      newUser.avatar_url === avatar
                        ? 'border-primary'
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatar} />
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>{t('admin.username')}</Label>
              <Input
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder={t('setup.usernamePlaceholder')}
              />
            </div>

            <div>
              <Label>{t('admin.email')}</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>

            <div>
              <Label>{t('auth.password')}</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div>
              <Label>{t('admin.role')}</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className='dash-item' value="none">{t('admin.roleUser')}</SelectItem>
                  <SelectItem className='dash-item' value="algorithm_editor">{t('admin.roleAlgorithmEditor')}</SelectItem>
                  <SelectItem className='dash-item' value="admin">{t('admin.roleAdmin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t('admin.cancel')}
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t('admin.createUser')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteUser')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteUserConfirm')}
              {deletingUser && (
                <span className="block mt-2 font-medium text-foreground">
                  {deletingUser.username} ({deletingUser.email})
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('admin.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t('admin.deleteUser')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
