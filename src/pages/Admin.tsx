import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  FileQuestion, 
  Loader2, 
  Plus, 
  Trash2, 
  Code,
  Trophy,
  X,
  Edit,
  Database
} from 'lucide-react';
import { toast } from 'sonner';
import AlgorithmsManager from '@/components/admin/AlgorithmsManager';
import WeeklyChallengesManager from '@/components/admin/WeeklyChallengesManager';
import UsersManager from '@/components/admin/UsersManager';

// Types
interface Algorithm {
  id: string;
  title_ar: string;
  title_en: string;
}

interface IQQuestion {
  id?: number;
  qcode: string;
  section_id: string;
  algorithm_ref: string | null;
  kind: string | null;
  order_index: number;
  question_ar: string;
  question_en: string;
  choices_ar: string[];
  choices_en: string[];
  correct_index: number;
  is_active: boolean;
}

interface AdminStats {
  algorithms: number;
  roadmapEntries: number;
  questions: number;
  problems: number;
  challenges: number;
}

export default function Admin() {
  const { t, lang, dir } = useI18n();
  const { profile, userRole } = useAuth();
  const isFullAdmin = userRole === 'admin';
  
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({ algorithms: 0, roadmapEntries: 0, questions: 0, problems: 0, challenges: 0 });
  
  // Questions Manager state
  const [questions, setQuestions] = useState<IQQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<IQQuestion | null>(null);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch algorithms from Supabase
        const { data: algoData, count: algoCount } = await supabase
          .from('algorithms')
          .select('id, title_ar, title_en', { count: 'exact' })
          .eq('is_active', true);
        setAlgorithms(algoData || []);

        // Fetch roadmap entries count
        const { count: roadmapCount } = await supabase
          .from('roadmap_order')
          .select('*', { count: 'exact', head: true });

        // Fetch questions
        const { data: questionsData } = await supabase
          .from('iq_questions')
          .select('*')
          .eq('section_id', 'skill_assessment')
          .order('order_index');
        
        const normalizedQuestions = (questionsData || []).map(q => ({
          ...q,
          question_en: q.question_en || '',
          choices_en: Array.isArray(q.choices_en) ? q.choices_en : q.choices_ar.map(() => '')
        }));
        setQuestions(normalizedQuestions);

        // Calculate stats
        const { count: problemCount } = await supabase
          .from('algorithm_problems')
          .select('*', { count: 'exact', head: true });
          
        const { count: challengeCount } = await supabase
          .from('weekly_challenges')
          .select('*', { count: 'exact', head: true });

        setStats({
          algorithms: algoCount || 0,
          roadmapEntries: roadmapCount || 0,
          questions: questionsData?.length || 0,
          problems: problemCount || 0,
          challenges: challengeCount || 0
        });

      } catch (error) {
        console.error('Error loading admin data:', error);
        toast.error(t('common.error'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [t]);

  // Question handlers
  const handleSaveQuestion = async (question: IQQuestion) => {
    try {
      // Validate correct_index
      if (question.correct_index < 0 || question.correct_index >= question.choices_ar.length) {
        toast.error(t('admin.invalidCorrectIndex'));
        return;
      }

      if (question.id) {
        const { error } = await supabase
          .from('iq_questions')
          .update({
            qcode: question.qcode,
            algorithm_ref: question.algorithm_ref,
            kind: question.kind,
            order_index: question.order_index,
            question_ar: question.question_ar,
            question_en: question.question_en,
            choices_ar: question.choices_ar,
            choices_en: question.choices_en,
            correct_index: question.correct_index,
            is_active: question.is_active
          })
          .eq('id', question.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('iq_questions')
          .insert({
            qcode: question.qcode,
            section_id: 'skill_assessment',
            algorithm_ref: question.algorithm_ref,
            kind: question.kind,
            order_index: question.order_index,
            question_ar: question.question_ar,
            question_en: question.question_en,
            choices_ar: question.choices_ar,
            choices_en: question.choices_en,
            correct_index: question.correct_index,
            is_active: question.is_active
          });
        if (error) throw error;
      }

      const { data } = await supabase
        .from('iq_questions')
        .select('*')
        .eq('section_id', 'skill_assessment')
        .order('order_index');
      
      const normalizedQuestions = (data || []).map(q => ({
        ...q,
        question_en: q.question_en || '',
        choices_en: Array.isArray(q.choices_en) ? q.choices_en : q.choices_ar.map(() => '')
      }));
      setQuestions(normalizedQuestions);
      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      toast.success(t('admin.saved'));
    } catch (error: any) {
      console.error('Error saving question:', error);
      if (error.code === '23505') {
        toast.error(t('admin.qcodeExists'));
      } else {
        toast.error(t('common.error'));
      }
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      const { error } = await supabase
        .from('iq_questions')
        .delete()
        .eq('id', id);
      if (error) throw error;

      setQuestions(prev => prev.filter(q => q.id !== id));
      toast.success(t('admin.deleted'));
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl" dir={dir}>
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
          <p className="text-muted-foreground">{t('admin.subtitle')}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className={`grid gap-4 ${isFullAdmin ? 'md:grid-cols-4' : 'md:grid-cols-2'} mb-8`}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Code className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.algorithms}</p>
                <p className="text-sm text-muted-foreground">{t('admin.algorithmsCount')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {isFullAdmin && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <FileQuestion className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.questions}</p>
                    <p className="text-sm text-muted-foreground">{t('admin.questionsCount')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.challenges}</p>
                    <p className="text-sm text-muted-foreground">{t('admin.challengesCount')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.problems}</p>
                <p className="text-sm text-muted-foreground">{t('admin.problemsCount')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="algorithms" dir={dir}>
        <TabsList className="mb-6 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="algorithms" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            {t('admin.algorithmsManager')}
          </TabsTrigger>
          {isFullAdmin && (
            <>
              <TabsTrigger value="questions" className="flex items-center gap-2">
                <FileQuestion className="h-4 w-4" />
                {t('admin.assessmentManager')}
              </TabsTrigger>
              <TabsTrigger value="challenges" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                {t('admin.weeklyChallenges')}
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t('admin.usersManager')}
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Algorithms Manager Tab */}
        <TabsContent value="algorithms">
          <AlgorithmsManager />
        </TabsContent>

        {/* Questions Manager Tab */}
        <TabsContent value="questions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('admin.assessmentManager')}</CardTitle>
                <CardDescription>{t('admin.assessmentManagerDesc')}</CardDescription>
              </div>
              <Button onClick={() => {
                setEditingQuestion({
                  qcode: '',
                  section_id: 'skill_assessment',
                  algorithm_ref: null,
                  kind: 'concept',
                  order_index: questions.length + 1,
                  question_ar: '',
                  question_en: '',
                  choices_ar: ['', '', '', ''],
                  choices_en: ['', '', '', ''],
                  correct_index: 0,
                  is_active: true
                });
                setQuestionDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 me-2" />
                {t('admin.addQuestion')}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.qcode')}</TableHead>
                    <TableHead>{t('admin.questionAr')}</TableHead>
                    <TableHead>{t('admin.questionEn')}</TableHead>
                    <TableHead>{t('admin.algorithmRef')}</TableHead>
                    <TableHead>{t('admin.order')}</TableHead>
                    <TableHead>{t('admin.status')}</TableHead>
                    <TableHead>{t('admin.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono text-sm">{q.qcode}</TableCell>
                      <TableCell className="max-w-xs truncate">{q.question_ar}</TableCell>
                      <TableCell className="max-w-xs truncate">{q.question_en}</TableCell>
                      <TableCell>{q.algorithm_ref || '-'}</TableCell>
                      <TableCell>{q.order_index}</TableCell>
                      <TableCell>
                        <Badge variant={q.is_active ? 'default' : 'secondary'}>
                          {q.is_active ? t('admin.active') : t('admin.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingQuestion(q);
                              setQuestionDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm(t('admin.confirmDelete'))) {
                                q.id && handleDeleteQuestion(q.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {questions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t('admin.noQuestions')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Question Edit Dialog */}
          <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion?.id ? t('admin.editQuestion') : t('admin.addQuestion')}
                </DialogTitle>
              </DialogHeader>
              
              {editingQuestion && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t('admin.qcode')}</Label>
                      <Input
                        value={editingQuestion.qcode}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, qcode: e.target.value })}
                        placeholder="e.g., big_o_q1"
                      />
                    </div>
                    <div>
                      <Label>{t('admin.algorithmRef')}</Label>
                      <Select
                        value={editingQuestion.algorithm_ref || '__none__'}
                        onValueChange={(v) => setEditingQuestion({ ...editingQuestion, algorithm_ref: v === '__none__' ? null : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.selectAlgorithm')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{t('admin.none')}</SelectItem>
                          {algorithms.map((a) => (
                            <SelectItem key={a.id} value={a.id}>{lang === 'ar' ? a.title_ar : a.title_en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t('admin.questionAr')}</Label>
                      <Textarea
                        value={editingQuestion.question_ar}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, question_ar: e.target.value })}
                        rows={3}
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <Label>{t('admin.questionEn')}</Label>
                      <Textarea
                        value={editingQuestion.question_en}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, question_en: e.target.value })}
                        rows={3}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>{t('admin.choices')}</Label>
                    <div className="space-y-4">
                      {editingQuestion.choices_ar.map((_, idx) => (
                        <div key={idx} className="space-y-2 p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{t('admin.choice')} {idx + 1}</span>
                            {editingQuestion.choices_ar.length > 2 && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                onClick={() => {
                                  const newChoicesAr = editingQuestion.choices_ar.filter((_, i) => i !== idx);
                                  const newChoicesEn = editingQuestion.choices_en.filter((_, i) => i !== idx);
                                  setEditingQuestion({ 
                                    ...editingQuestion, 
                                    choices_ar: newChoicesAr,
                                    choices_en: newChoicesEn,
                                    correct_index: editingQuestion.correct_index >= newChoicesAr.length ? 0 : editingQuestion.correct_index
                                  });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder={t('admin.choiceAr')}
                              value={editingQuestion.choices_ar[idx]}
                              onChange={(e) => {
                                const newChoicesAr = [...editingQuestion.choices_ar];
                                newChoicesAr[idx] = e.target.value;
                                setEditingQuestion({ ...editingQuestion, choices_ar: newChoicesAr });
                              }}
                              dir="rtl"
                            />
                            <Input
                              placeholder={t('admin.choiceEn')}
                              value={editingQuestion.choices_en[idx]}
                              onChange={(e) => {
                                const newChoicesEn = [...editingQuestion.choices_en];
                                newChoicesEn[idx] = e.target.value;
                                setEditingQuestion({ ...editingQuestion, choices_en: newChoicesEn });
                              }}
                              dir="ltr"
                            />
                          </div>
                        </div>
                      ))}
                      {editingQuestion.choices_ar.length < 6 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingQuestion({
                            ...editingQuestion,
                            choices_ar: [...editingQuestion.choices_ar, ''],
                            choices_en: [...editingQuestion.choices_en, '']
                          })}
                        >
                          <Plus className="h-4 w-4 me-2" />
                          {t('admin.addChoice')}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>{t('admin.correctAnswer')}</Label>
                      <Select
                        value={String(editingQuestion.correct_index)}
                        onValueChange={(v) => setEditingQuestion({ ...editingQuestion, correct_index: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {editingQuestion.choices_ar.map((_, idx) => (
                            <SelectItem key={idx} value={String(idx)}>
                              {t('admin.choice')} {idx + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t('admin.order')}</Label>
                      <Input
                        type="number"
                        value={editingQuestion.order_index}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, order_index: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={editingQuestion.is_active}
                        onCheckedChange={(checked) => setEditingQuestion({ ...editingQuestion, is_active: checked })}
                      />
                      <Label>{t('admin.active')}</Label>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={() => editingQuestion && handleSaveQuestion(editingQuestion)}>
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Weekly Challenges Tab */}
        {isFullAdmin && (
          <TabsContent value="challenges">
            <WeeklyChallengesManager />
          </TabsContent>
        )}

        {/* Users Manager Tab */}
        {isFullAdmin && (
          <TabsContent value="users">
            <UsersManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
