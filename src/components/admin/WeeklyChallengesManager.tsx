import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Calendar, Trophy, X } from 'lucide-react';
import { toast } from 'sonner';

interface WeeklyChallenge {
  id?: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  start_date: string;
  end_date: string;
  rules: Record<string, any>;
  is_active: boolean;
  problems_count?: number;
}

interface ChallengeProblem {
  challenge_id: number;
  problem_url: string;
  title: string;
  topic: string;
  sort_order: number;
}

interface Problem {
  id: string;
  title: string;
  platform: string;
  url: string;
  algorithm_id: string;
}

const emptyChallenge: WeeklyChallenge = {
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  rules: {},
  is_active: true,
};

export default function WeeklyChallengesManager() {
  const { t, lang } = useI18n();
  
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<WeeklyChallenge | null>(null);
  const [challengeProblems, setChallengeProblems] = useState<ChallengeProblem[]>([]);
  const [newProblemTitle, setNewProblemTitle] = useState('');
  const [newProblemUrl, setNewProblemUrl] = useState('');
  const [newProblemTopic, setNewProblemTopic] = useState('');
  
  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [challengesRes, problemsRes, challengeProbsRes] = await Promise.all([
          supabase.from('weekly_challenges').select('*').order('start_date', { ascending: false }),
          supabase.from('algorithm_problems').select('*').order('title'),
          supabase.from('weekly_challenge_problems').select('challenge_id'),
        ]);
        
        if (challengesRes.error) throw challengesRes.error;
        if (problemsRes.error) throw problemsRes.error;
        if (challengeProbsRes.error) throw challengeProbsRes.error;
        
        // Count problems per challenge
        const problemCounts: Record<number, number> = {};
        challengeProbsRes.data?.forEach(p => {
          problemCounts[p.challenge_id] = (problemCounts[p.challenge_id] || 0) + 1;
        });

        const normalizedChallenges = (challengesRes.data || []).map(c => ({
          ...c,
          problems_count: problemCounts[c.id!] || 0
        }));

        setChallenges(normalizedChallenges);
        setProblems(problemsRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(t('common.error'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [t]);
  
  const loadChallengeProblems = async (challengeId: number) => {
    try {
      const { data, error } = await supabase
        .from('weekly_challenge_problems')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('sort_order');
      
      if (error) throw error;
      setChallengeProblems(data || []);
    } catch (error) {
      console.error('Error loading challenge problems:', error);
      setChallengeProblems([]);
    }
  };
  
  const handleEdit = async (challenge: WeeklyChallenge) => {
    setEditingChallenge(challenge);
    if (challenge.id) {
      await loadChallengeProblems(challenge.id);
    }
    setDialogOpen(true);
  };
  
  const handleCreate = () => {
    setEditingChallenge({ ...emptyChallenge });
    setChallengeProblems([]);
    setDialogOpen(true);
  };
  
  const handleSave = async () => {
    if (!editingChallenge) return;
    
    if (!editingChallenge.title_ar.trim() || !editingChallenge.title_en.trim()) {
      toast.error(t('admin.challengeTitleRequired'));
      return;
    }
    
    try {
      let challengeId = editingChallenge.id;
      
      if (challengeId) {
        // Update existing
        const { error } = await supabase
          .from('weekly_challenges')
          .update({
            title_ar: editingChallenge.title_ar,
            title_en: editingChallenge.title_en,
            description_ar: editingChallenge.description_ar,
            description_en: editingChallenge.description_en,
            start_date: editingChallenge.start_date,
            end_date: editingChallenge.end_date,
            rules: editingChallenge.rules,
            is_active: editingChallenge.is_active,
          })
          .eq('id', challengeId);
        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('weekly_challenges')
          .insert({
            title_ar: editingChallenge.title_ar,
            title_en: editingChallenge.title_en,
            description_ar: editingChallenge.description_ar,
            description_en: editingChallenge.description_en,
            start_date: editingChallenge.start_date,
            end_date: editingChallenge.end_date,
            rules: editingChallenge.rules,
            is_active: editingChallenge.is_active,
          })
          .select()
          .single();
        if (error) throw error;
        challengeId = data.id;
      }
      
      // Save challenge problems
      if (challengeId) {
        await supabase.from('weekly_challenge_problems').delete().eq('challenge_id', challengeId);
        if (challengeProblems.length > 0) {
          await supabase.from('weekly_challenge_problems').insert(
            challengeProblems.map((p, i) => ({
              challenge_id: challengeId,
              problem_url: p.problem_url,
              title: p.title,
              topic: p.topic,
              sort_order: i,
            }))
          );
        }
      }
      
      // Refresh
      const { data } = await supabase.from('weekly_challenges').select('*').order('start_date', { ascending: false });
      const { data: probs } = await supabase.from('weekly_challenge_problems').select('challenge_id');
      
      const problemCounts: Record<number, number> = {};
      probs?.forEach(p => {
        problemCounts[p.challenge_id] = (problemCounts[p.challenge_id] || 0) + 1;
      });

      const normalizedChallenges = (data || []).map(c => ({
        ...c,
        problems_count: problemCounts[c.id!] || 0
      }));

      setChallenges(normalizedChallenges);
      setDialogOpen(false);
      toast.success(t('admin.saved'));
    } catch (error) {
      console.error('Error saving challenge:', error);
      toast.error(t('common.error'));
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    
    try {
      const { error } = await supabase.from('weekly_challenges').delete().eq('id', id);
      if (error) throw error;
      setChallenges(prev => prev.filter(c => c.id !== id));
      toast.success(t('admin.deleted'));
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast.error(t('common.error'));
    }
  };
  
  const addProblemToChallenge = () => {
    if (!newProblemTitle || !newProblemUrl || !editingChallenge) return;
    
    if (challengeProblems.some(p => p.problem_url === newProblemUrl)) {
      toast.error(t('admin.problemAlreadyAdded'));
      return;
    }
    
    setChallengeProblems([
      ...challengeProblems,
      {
        challenge_id: editingChallenge.id || 0,
        problem_url: newProblemUrl,
        title: newProblemTitle,
        topic: newProblemTopic,
        sort_order: challengeProblems.length,
      },
    ]);
    setNewProblemTitle('');
    setNewProblemUrl('');
    setNewProblemTopic('');
  };
  
  const removeProblemFromChallenge = (url: string) => {
    setChallengeProblems(challengeProblems.filter(p => p.problem_url !== url));
  };
  
  const getProblemByUrl = (url: string) => problems.find(p => p.url === url);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t('admin.weeklyChallengesManager')}
          </CardTitle>
          <CardDescription>{t('admin.weeklyChallengesManagerDesc')}</CardDescription>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 me-2" />
          {t('admin.addChallenge')}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.title')}</TableHead>
              <TableHead>{t('admin.dateRange')}</TableHead>
              <TableHead>{t('admin.problemsCount')}</TableHead>
              <TableHead>{t('admin.status')}</TableHead>
              <TableHead>{t('admin.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {challenges.map(challenge => (
              <TableRow key={challenge.id}>
                <TableCell>{lang === 'ar' ? challenge.title_ar : challenge.title_en}</TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {challenge.start_date} → {challenge.end_date}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{challenge.problems_count || 0}</Badge>
                </TableCell>
                <TableCell>
                  {new Date(challenge.end_date) < new Date() ? (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      {t('admin.expired')}
                    </Badge>
                  ) : (
                    <Badge variant={challenge.is_active ? 'default' : 'secondary'}>
                      {challenge.is_active ? t('admin.active') : t('admin.inactive')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(challenge)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => challenge.id && handleDelete(challenge.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {challenges.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {isLoading ? t('common.loading') : t('admin.noChallenges')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      
      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingChallenge?.id ? t('admin.editChallenge') : t('admin.addChallenge')}
            </DialogTitle>
          </DialogHeader>
          
          {editingChallenge && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('admin.titleAr')}</Label>
                    <Input
                      value={editingChallenge.title_ar}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, title_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label>{t('admin.titleEn')}</Label>
                    <Input
                      value={editingChallenge.title_en}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, title_en: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('admin.descriptionAr')}</Label>
                    <Textarea
                      value={editingChallenge.description_ar}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, description_ar: e.target.value })}
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label>{t('admin.descriptionEn')}</Label>
                    <Textarea
                      value={editingChallenge.description_en}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, description_en: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>{t('admin.startDate')}</Label>
                    <Input
                      type="date"
                      value={editingChallenge.start_date}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('admin.endDate')}</Label>
                    <Input
                      type="date"
                      value={editingChallenge.end_date}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, end_date: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={editingChallenge.is_active}
                      onCheckedChange={(checked) => setEditingChallenge({ ...editingChallenge, is_active: checked })}
                    />
                    <Label>{t('admin.active')}</Label>
                  </div>
                </div>
              </div>
              
              {/* Challenge Problems */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-lg">{t('admin.challengeProblems')}</Label>
                </div>
                
                <div className="space-y-4 mb-4 bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('admin.problemTitle')}</Label>
                      <Input 
                        placeholder={t('admin.problemTitle')} 
                        value={newProblemTitle}
                        onChange={(e) => setNewProblemTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('admin.problemTopic')}</Label>
                      <Input 
                        placeholder={t('admin.problemTopic')} 
                        value={newProblemTopic}
                        onChange={(e) => setNewProblemTopic(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">{t('admin.problemUrl')}</Label>
                      <Input 
                        placeholder={t('admin.problemUrl')} 
                        value={newProblemUrl}
                        onChange={(e) => setNewProblemUrl(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addProblemToChallenge} disabled={!newProblemTitle || !newProblemUrl}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {challengeProblems.map((cp, idx) => {
                    return (
                      <div key={cp.problem_url} className="flex items-center gap-2 p-2 bg-background border rounded-md">
                        <span className="w-6 text-center font-bold text-muted-foreground">{idx + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium">{cp.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">{cp.topic}</span>
                            <span className="truncate max-w-[200px]">{cp.problem_url}</span>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => removeProblemFromChallenge(cp.problem_url)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                  
                  {challengeProblems.length === 0 && (
                    <p className="text-center py-4 text-muted-foreground">{t('admin.noProblemsInChallenge')}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
