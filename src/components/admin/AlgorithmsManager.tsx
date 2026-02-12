import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Search, X, Save, Map as MapIcon, GripVertical, History, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Algorithm {
  id: string;
  title_ar: string;
  title_en: string;
  category_ar: string;
  category_en: string;
  difficulty_ar: string;
  difficulty_en: string;
  description_ar: string;
  description_en: string;
  what_ar: string;
  what_en: string;
  why_ar: string;
  why_en: string;
  is_active: boolean;
}

interface AlgorithmWithOrder extends Algorithm {
  sort_order: number;
  has_roadmap: boolean;
}

interface Prerequisite {
  id?: string;
  algorithm_id: string;
  text_ar: string;
  text_en: string;
  sort_order: number;
}

interface Resource {
  id?: string;
  algorithm_id: string;
  title_ar: string;
  title_en: string;
  url: string;
  type: 'video' | 'article' | 'course' | 'other';
  language: 'ar' | 'en';
  difficulty_ar: string;
  difficulty_en: string;
  sort_order: number;
}

interface Problem {
  id?: string;
  algorithm_id: string;
  title: string;
  platform: string;
  difficulty_ar: string;
  difficulty_en: string;
  url: string;
  sort_order: number;
}

interface RelatedAlgorithm {
  algorithm_id: string;
  related_algorithm_id: string;
  sort_order: number;
}

interface RoadmapOrder {
  id?: number;
  algorithm_id: string;
  tier: 'beginner' | 'intermediate' | 'advanced';
  sort_order: number;
  section_ar: string;
  section_en: string;
}

const emptyAlgorithm: Algorithm = {
  id: '',
  title_ar: '',
  title_en: '',
  category_ar: '',
  category_en: '',
  difficulty_ar: 'مبتدئ',
  difficulty_en: 'Beginner',
  description_ar: '',
  description_en: '',
  what_ar: '',
  what_en: '',
  why_ar: '',
  why_en: '',
  is_active: true,
};

const emptyRoadmap: RoadmapOrder = {
  algorithm_id: '',
  tier: 'beginner',
  sort_order: 0,
  section_ar: '',
  section_en: '',
};

// Sortable table row component
function SortableAlgorithmRow({ 
  algo, 
  lang, 
  t, 
  onEdit, 
  onDelete 
}: { 
  algo: AlgorithmWithOrder; 
  lang: string; 
  t: (key: string) => string; 
  onEdit: (algo: Algorithm) => void; 
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: algo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10">
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="font-mono text-sm">{algo.id}</TableCell>
      <TableCell>{lang === 'ar' ? algo.title_ar : algo.title_en}</TableCell>
      <TableCell>{lang === 'ar' ? algo.category_ar : algo.category_en}</TableCell>
      <TableCell>
        <Badge variant="outline">{lang === 'ar' ? algo.difficulty_ar : algo.difficulty_en}</Badge>
      </TableCell>
      <TableCell>
        {algo.has_roadmap ? (
          <Badge variant="secondary" className="gap-1">
            <MapIcon className="h-3 w-3" />
            {t('admin.inRoadmap')}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={algo.is_active ? 'default' : 'secondary'}>
          {algo.is_active ? t('admin.active') : t('admin.inactive')}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(algo)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(algo.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface AuditLogEntry {
  id: string;
  algorithm_id: string;
  action: string;
  changes: any;
  performed_by: string;
  performed_by_username: string;
  created_at: string;
}

export default function AlgorithmsManager() {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  
  const [algorithms, setAlgorithms] = useState<AlgorithmWithOrder[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlgorithm, setEditingAlgorithm] = useState<Algorithm | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Audit log state
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Nested data
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [relatedAlgos, setRelatedAlgos] = useState<RelatedAlgorithm[]>([]);
  const [roadmapOrder, setRoadmapOrder] = useState<RoadmapOrder>(emptyRoadmap);
  const [roadmapEnabled, setRoadmapEnabled] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Load algorithms with roadmap order
  const fetchAlgorithms = async () => {
    try {
      // Fetch algorithms
      const { data: algoData, error: algoError } = await supabase
        .from('algorithms')
        .select('*');
      if (algoError) throw algoError;

      // Fetch all roadmap orders
      const { data: roadmapData } = await supabase
        .from('roadmap_order')
        .select('algorithm_id, sort_order');

      const roadmapMap = new Map(
        (roadmapData || []).map(r => [r.algorithm_id, r.sort_order])
      );

      // Combine and sort: items with roadmap order first (by sort_order), then others by created_at
      const algorithmsWithOrder: AlgorithmWithOrder[] = (algoData || []).map(algo => ({
        ...algo,
        sort_order: roadmapMap.get(algo.id) ?? 999999,
        has_roadmap: roadmapMap.has(algo.id),
      }));

      algorithmsWithOrder.sort((a, b) => a.sort_order - b.sort_order);
      
      setAlgorithms(algorithmsWithOrder);
    } catch (error) {
      console.error('Error fetching algorithms:', error);
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlgorithms();
    fetchAuditLog();
  }, [t]);

  const fetchAuditLog = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('algorithm_audit_log')
        .select('*')
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setAuditLog(data);
      }
    } catch (err) {
      console.error('Error fetching audit log:', err);
    }
  };

  const logAuditAction = async (algorithmId: string, action: string, changes?: any) => {
    try {
      await supabase.from('algorithm_audit_log').insert({
        algorithm_id: algorithmId,
        action,
        changes: changes || null,
        performed_by: user?.id,
        performed_by_username: profile?.username || user?.email || 'Unknown',
      });
      fetchAuditLog();
    } catch (err) {
      console.error('Error logging audit:', err);
    }
  };
  
  // Handle drag end - update sort_order for all items
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = algorithms.findIndex(a => a.id === active.id);
    const newIndex = algorithms.findIndex(a => a.id === over.id);
    
    const newAlgorithms = arrayMove(algorithms, oldIndex, newIndex);
    
    // Update local state immediately
    setAlgorithms(newAlgorithms.map((algo, idx) => ({ ...algo, sort_order: idx })));
    
    // Update roadmap_order in database for all items using upsert
    try {
      // Build upsert data for all algorithms
      const upsertData = newAlgorithms.map((algo, idx) => ({
        algorithm_id: algo.id,
        sort_order: idx,
        // Preserve existing tier/section or use defaults
        tier: 'beginner' as const,
        section_ar: '',
        section_en: '',
      }));

      // First, get existing roadmap data to preserve tier/section values
      const { data: existingData } = await supabase
        .from('roadmap_order')
        .select('algorithm_id, tier, section_ar, section_en');

      const existingMap = new Map(
        (existingData || []).map(r => [r.algorithm_id, r])
      );

      // Merge existing data with new sort orders
      const mergedData = upsertData.map(item => {
        const existing = existingMap.get(item.algorithm_id);
        if (existing) {
          return {
            ...item,
            tier: existing.tier,
            section_ar: existing.section_ar,
            section_en: existing.section_en,
          };
        }
        return item;
      });

      // Upsert all at once
      const { error } = await supabase
        .from('roadmap_order')
        .upsert(mergedData, { onConflict: 'algorithm_id' });

      if (error) throw error;
      
      toast.success(t('admin.orderUpdated'));
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(t('common.error'));
      // Revert on error
      fetchAlgorithms();
    }
  };
  
  // Load nested data when editing
  const loadNestedData = async (algorithmId: string) => {
    try {
      const [prereqRes, resourceRes, problemRes, relatedRes, roadmapRes] = await Promise.all([
        supabase.from('algorithm_prerequisites').select('*').eq('algorithm_id', algorithmId).order('sort_order'),
        supabase.from('algorithm_resources').select('*').eq('algorithm_id', algorithmId).order('sort_order'),
        supabase.from('algorithm_problems').select('*').eq('algorithm_id', algorithmId).order('sort_order'),
        supabase.from('algorithm_related').select('*').eq('algorithm_id', algorithmId).order('sort_order'),
        supabase.from('roadmap_order').select('*').eq('algorithm_id', algorithmId).maybeSingle(),
      ]);
      
      setPrerequisites(prereqRes.data || []);
      setResources(resourceRes.data || []);
      setProblems(problemRes.data || []);
      setRelatedAlgos(relatedRes.data || []);
      
      if (roadmapRes.data) {
        setRoadmapOrder(roadmapRes.data);
        setRoadmapEnabled(true);
      } else {
        setRoadmapOrder({ ...emptyRoadmap, algorithm_id: algorithmId });
        setRoadmapEnabled(false);
      }
    } catch (error) {
      console.error('Error loading nested data:', error);
    }
  };
  
  const handleEdit = async (algo: Algorithm) => {
    setEditingAlgorithm(algo);
    await loadNestedData(algo.id);
    setActiveTab('basic');
    setDialogOpen(true);
  };
  
  const handleCreate = () => {
    setEditingAlgorithm({ ...emptyAlgorithm });
    setPrerequisites([]);
    setResources([]);
    setProblems([]);
    setRelatedAlgos([]);
    setRoadmapOrder({ ...emptyRoadmap });
    setRoadmapEnabled(false);
    setActiveTab('basic');
    setDialogOpen(true);
  };
  
  const handleSave = async () => {
    if (!editingAlgorithm) return;
    
    if (!editingAlgorithm.id.trim()) {
      toast.error(t('admin.algorithmIdRequired'));
      return;
    }
    
    try {
      // Remove frontend-only properties that don't exist in DB
      const { sort_order, has_roadmap, ...algoToSave } = editingAlgorithm as any;

      const isNew = !algorithms.find(a => a.id === editingAlgorithm.id);
      
      if (isNew) {
        const { error } = await supabase.from('algorithms').insert(algoToSave);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('algorithms').update(algoToSave).eq('id', editingAlgorithm.id);
        if (error) throw error;
      }
      
      // Save nested data
      // Prerequisites
      await supabase.from('algorithm_prerequisites').delete().eq('algorithm_id', editingAlgorithm.id);
      if (prerequisites.length > 0) {
        await supabase.from('algorithm_prerequisites').insert(
          prerequisites.map((p, i) => ({ ...p, algorithm_id: editingAlgorithm.id, sort_order: i }))
        );
      }
      
      // Resources
      await supabase.from('algorithm_resources').delete().eq('algorithm_id', editingAlgorithm.id);
      if (resources.length > 0) {
        await supabase.from('algorithm_resources').insert(
          resources.map((r, i) => ({ ...r, algorithm_id: editingAlgorithm.id, sort_order: i }))
        );
      }
      
      // Problems
      await supabase.from('algorithm_problems').delete().eq('algorithm_id', editingAlgorithm.id);
      if (problems.length > 0) {
        await supabase.from('algorithm_problems').insert(
          problems.map((p, i) => ({ ...p, algorithm_id: editingAlgorithm.id, sort_order: i }))
        );
      }
      
      // Related
      await supabase.from('algorithm_related').delete().eq('algorithm_id', editingAlgorithm.id);
      if (relatedAlgos.length > 0) {
        await supabase.from('algorithm_related').insert(
          relatedAlgos.map((r, i) => ({ ...r, algorithm_id: editingAlgorithm.id, sort_order: i }))
        );
      }
      
      // Roadmap order
      if (roadmapEnabled) {
        // Get current position to preserve order
        const currentAlgo = algorithms.find(a => a.id === editingAlgorithm.id);
        const sortOrder = currentAlgo?.sort_order ?? algorithms.length;
        
        await supabase.from('roadmap_order').upsert({
          algorithm_id: editingAlgorithm.id,
          tier: roadmapOrder.tier,
          sort_order: sortOrder,
          section_ar: roadmapOrder.section_ar,
          section_en: roadmapOrder.section_en,
        }, { onConflict: 'algorithm_id' });
      } else {
        // Remove from roadmap if disabled
        await supabase.from('roadmap_order').delete().eq('algorithm_id', editingAlgorithm.id);
      }
      
      // Log audit
      await logAuditAction(
        editingAlgorithm.id,
        isNew ? 'create' : 'update',
        { title_ar: editingAlgorithm.title_ar, title_en: editingAlgorithm.title_en }
      );
      
      // Refresh
      await fetchAlgorithms();
      setDialogOpen(false);
      toast.success(t('admin.saved'));
    } catch (error: any) {
      console.error('Error saving algorithm:', error);
      if (error.code === '23505') {
        toast.error(t('admin.algorithmIdExists'));
      } else {
        toast.error(t('common.error'));
      }
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    
    try {
      const deletedAlgo = algorithms.find(a => a.id === id);
      const { error } = await supabase.from('algorithms').delete().eq('id', id);
      if (error) throw error;
      
      await logAuditAction(id, 'delete', {
        title_ar: deletedAlgo?.title_ar,
        title_en: deletedAlgo?.title_en,
      });
      
      setAlgorithms(prev => prev.filter(a => a.id !== id));
      toast.success(t('admin.deleted'));
    } catch (error) {
      console.error('Error deleting algorithm:', error);
      toast.error(t('common.error'));
    }
  };
  
  const filteredAlgorithms = algorithms.filter(a => 
    a.id.toLowerCase().includes(search.toLowerCase()) ||
    a.title_ar.includes(search) ||
    a.title_en.toLowerCase().includes(search.toLowerCase())
  );

  // Disable drag when searching
  const isDragDisabled = search.length > 0;

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('admin.algorithmsManager')}</CardTitle>
          <CardDescription>{t('admin.algorithmsManagerDesc')}</CardDescription>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 me-2" />
          {t('admin.addAlgorithm')}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.searchAlgorithms')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
          {isDragDisabled && (
            <p className="text-xs text-muted-foreground mt-2">{t('admin.clearSearchToDrag')}</p>
          )}
        </div>
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>{t('admin.algorithmId')}</TableHead>
                <TableHead>{t('admin.title')}</TableHead>
                <TableHead>{t('admin.category')}</TableHead>
                <TableHead>{t('admin.difficulty')}</TableHead>
                <TableHead>{t('admin.roadmap')}</TableHead>
                <TableHead>{t('admin.status')}</TableHead>
                <TableHead>{t('admin.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isDragDisabled ? (
                <SortableContext
                  items={filteredAlgorithms.map(a => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredAlgorithms.map(algo => (
                    <SortableAlgorithmRow
                      key={algo.id}
                      algo={algo}
                      lang={lang}
                      t={t}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              ) : (
                filteredAlgorithms.map(algo => (
                  <TableRow key={algo.id}>
                    <TableCell className="w-10">
                      <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{algo.id}</TableCell>
                    <TableCell>{lang === 'ar' ? algo.title_ar : algo.title_en}</TableCell>
                    <TableCell>{lang === 'ar' ? algo.category_ar : algo.category_en}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lang === 'ar' ? algo.difficulty_ar : algo.difficulty_en}</Badge>
                    </TableCell>
                    <TableCell>
                      {algo.has_roadmap ? (
                        <Badge variant="secondary" className="gap-1">
                          <MapIcon className="h-3 w-3" />
                          {t('admin.inRoadmap')}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={algo.is_active ? 'default' : 'secondary'}>
                        {algo.is_active ? t('admin.active') : t('admin.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(algo)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(algo.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {filteredAlgorithms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {isLoading ? t('common.loading') : t('admin.noAlgorithms')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </CardContent>
      
      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAlgorithm?.id && algorithms.find(a => a.id === editingAlgorithm.id)
                ? t('admin.editAlgorithm')
                : t('admin.addAlgorithm')}
            </DialogTitle>
          </DialogHeader>
          
          {editingAlgorithm && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="basic">{t('admin.basic')}</TabsTrigger>
                <TabsTrigger value="content">{t('admin.content')}</TabsTrigger>
                <TabsTrigger value="roadmap" className="flex items-center gap-1">
                  <MapIcon className="h-3 w-3" />
                  {t('admin.roadmap')}
                </TabsTrigger>
                <TabsTrigger value="prerequisites">{t('algorithm.prerequisites')}</TabsTrigger>
                <TabsTrigger value="resources">{t('algorithm.resources')}</TabsTrigger>
                <TabsTrigger value="problems">{t('algorithm.practiceProblems')}</TabsTrigger>
                <TabsTrigger value="related">{t('algorithm.relatedAlgorithms')}</TabsTrigger>
              </TabsList>
              
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('admin.algorithmId')}</Label>
                    <Input
                      value={editingAlgorithm.id}
                      onChange={(e) => setEditingAlgorithm({ ...editingAlgorithm, id: e.target.value })}
                      placeholder="e.g., binary_search"
                      disabled={!!algorithms.find(a => a.id === editingAlgorithm.id)}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={editingAlgorithm.is_active}
                      onCheckedChange={(checked) => setEditingAlgorithm({ ...editingAlgorithm, is_active: checked })}
                    />
                    <Label>{t('admin.active')}</Label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('admin.titleAr')}</Label>
                    <Input
                      value={editingAlgorithm.title_ar}
                      onChange={(e) => setEditingAlgorithm({ ...editingAlgorithm, title_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label>{t('admin.titleEn')}</Label>
                    <Input
                      value={editingAlgorithm.title_en}
                      onChange={(e) => setEditingAlgorithm({ ...editingAlgorithm, title_en: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('admin.categoryAr')}</Label>
                    <Input
                      value={editingAlgorithm.category_ar}
                      onChange={(e) => setEditingAlgorithm({ ...editingAlgorithm, category_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label>{t('admin.categoryEn')}</Label>
                    <Input
                      value={editingAlgorithm.category_en}
                      onChange={(e) => setEditingAlgorithm({ ...editingAlgorithm, category_en: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('admin.difficultyAr')}</Label>
                    <Select
                      value={editingAlgorithm.difficulty_ar}
                      onValueChange={(v) => setEditingAlgorithm({ ...editingAlgorithm, difficulty_ar: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="مبتدئ">مبتدئ</SelectItem>
                        <SelectItem value="مبتدئ-متوسط">مبتدئ - متوسط</SelectItem>
                        <SelectItem value="متوسط">متوسط</SelectItem>
                        <SelectItem value="متوسط-متقدم">متوسط - متقدم</SelectItem>
                        <SelectItem value="متقدم">متقدم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('admin.difficultyEn')}</Label>
                    <Select
                      value={editingAlgorithm.difficulty_en}
                      onValueChange={(v) => setEditingAlgorithm({ ...editingAlgorithm, difficulty_en: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Beginner-Intermediate">Beginner - Intermediate</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Intermediate-Advanced">Intermediate - Advanced</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('admin.descriptionAr')}</Label>
                    <Textarea
                      value={editingAlgorithm.description_ar}
                      onChange={(e) => setEditingAlgorithm({ ...editingAlgorithm, description_ar: e.target.value })}
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label>{t('admin.descriptionEn')}</Label>
                    <Textarea
                      value={editingAlgorithm.description_en}
                      onChange={(e) => setEditingAlgorithm({ ...editingAlgorithm, description_en: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('admin.whatAr')}</Label>
                    <Textarea
                      value={editingAlgorithm.what_ar}
                      onChange={(e) => setEditingAlgorithm({ ...editingAlgorithm, what_ar: e.target.value })}
                      rows={4}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label>{t('admin.whatEn')}</Label>
                    <Textarea
                      value={editingAlgorithm.what_en}
                      onChange={(e) => setEditingAlgorithm({ ...editingAlgorithm, what_en: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('admin.whyAr')}</Label>
                    <Textarea
                      value={editingAlgorithm.why_ar}
                      onChange={(e) => setEditingAlgorithm({ ...editingAlgorithm, why_ar: e.target.value })}
                      rows={4}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label>{t('admin.whyEn')}</Label>
                    <Textarea
                      value={editingAlgorithm.why_en}
                      onChange={(e) => setEditingAlgorithm({ ...editingAlgorithm, why_en: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Roadmap Tab - Simplified without manual order field */}
              <TabsContent value="roadmap" className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-base font-medium">{t('admin.includeInRoadmap')}</Label>
                    <p className="text-sm text-muted-foreground">{t('admin.includeInRoadmapDesc')}</p>
                  </div>
                  <Switch
                    checked={roadmapEnabled}
                    onCheckedChange={setRoadmapEnabled}
                  />
                </div>
                
                {roadmapEnabled && (
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {t('admin.dragToReorderHint')}
                    </p>
                    
                    <div>
                      <Label>{t('admin.tier')}</Label>
                      <Select
                        value={roadmapOrder.tier}
                        onValueChange={(v) => setRoadmapOrder({ ...roadmapOrder, tier: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">{t('admin.tierBeginner')}</SelectItem>
                          <SelectItem value="intermediate">{t('admin.tierIntermediate')}</SelectItem>
                          <SelectItem value="advanced">{t('admin.tierAdvanced')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t('admin.sectionAr')}</Label>
                        <Input
                          value={roadmapOrder.section_ar}
                          onChange={(e) => setRoadmapOrder({ ...roadmapOrder, section_ar: e.target.value })}
                          placeholder="القسم (عربي)"
                          dir="rtl"
                        />
                      </div>
                      <div>
                        <Label>{t('admin.sectionEn')}</Label>
                        <Input
                          value={roadmapOrder.section_en}
                          onChange={(e) => setRoadmapOrder({ ...roadmapOrder, section_en: e.target.value })}
                          placeholder="Section (English)"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Prerequisites Tab */}
              <TabsContent value="prerequisites" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg">{t('algorithm.prerequisites')}</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPrerequisites([...prerequisites, { algorithm_id: editingAlgorithm.id, text_ar: '', text_en: '', sort_order: prerequisites.length }])}
                  >
                    <Plus className="h-4 w-4 me-2" />
                    {t('admin.add')}
                  </Button>
                </div>
                
                {prerequisites.map((prereq, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <span className="w-6 pt-2 text-center font-bold text-muted-foreground">{idx + 1}</span>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        value={prereq.text_ar}
                        onChange={(e) => {
                          const updated = [...prerequisites];
                          updated[idx].text_ar = e.target.value;
                          setPrerequisites(updated);
                        }}
                        placeholder="المتطلب (عربي)"
                        dir="rtl"
                      />
                      <Input
                        value={prereq.text_en}
                        onChange={(e) => {
                          const updated = [...prerequisites];
                          updated[idx].text_en = e.target.value;
                          setPrerequisites(updated);
                        }}
                        placeholder="Prerequisite (English)"
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setPrerequisites(prerequisites.filter((_, i) => i !== idx))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {prerequisites.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">{t('admin.noPrerequisites')}</p>
                )}
              </TabsContent>
              
              {/* Resources Tab */}
              <TabsContent value="resources" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg">{t('algorithm.resources')}</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setResources([...resources, { 
                      algorithm_id: editingAlgorithm.id, 
                      title_ar: '', 
                      title_en: '', 
                      url: '', 
                      type: 'article', 
                      language: 'ar', 
                      difficulty_ar: 'مبتدئ', 
                      difficulty_en: 'Beginner', 
                      sort_order: resources.length 
                    }])}
                  >
                    <Plus className="h-4 w-4 me-2" />
                    {t('admin.add')}
                  </Button>
                </div>
                
                {resources.map((resource, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline">{resource.type}</Badge>
                      <Button size="icon" variant="ghost" onClick={() => setResources(resources.filter((_, i) => i !== idx))}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Input
                        value={resource.title_ar}
                        onChange={(e) => {
                          const updated = [...resources];
                          updated[idx].title_ar = e.target.value;
                          setResources(updated);
                        }}
                        placeholder="العنوان (عربي)"
                        dir="rtl"
                      />
                      <Input
                        value={resource.title_en}
                        onChange={(e) => {
                          const updated = [...resources];
                          updated[idx].title_en = e.target.value;
                          setResources(updated);
                        }}
                        placeholder="Title (English)"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        value={resource.url}
                        onChange={(e) => {
                          const updated = [...resources];
                          updated[idx].url = e.target.value;
                          setResources(updated);
                        }}
                        placeholder="URL"
                        className="col-span-2"
                      />
                      <Select
                        value={resource.type}
                        onValueChange={(v) => {
                          const updated = [...resources];
                          updated[idx].type = v as any;
                          setResources(updated);
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="course">Course</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Select
                        value={resource.language}
                        onValueChange={(v) => {
                          const updated = [...resources];
                          updated[idx].language = v as any;
                          setResources(updated);
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ar">العربية</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={resource.difficulty_en}
                        onValueChange={(v) => {
                          const updated = [...resources];
                          updated[idx].difficulty_en = v;
                          updated[idx].difficulty_ar = v === 'Beginner' ? 'مبتدئ' : v === 'Intermediate' ? 'متوسط' : 'متقدم';
                          setResources(updated);
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                ))}
                
                {resources.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">{t('admin.noResources')}</p>
                )}
              </TabsContent>
              
              {/* Problems Tab */}
              <TabsContent value="problems" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg">{t('algorithm.practiceProblems')}</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setProblems([...problems, { 
                      algorithm_id: editingAlgorithm.id, 
                      title: '', 
                      platform: 'Codeforces', 
                      difficulty_ar: 'سهل', 
                      difficulty_en: 'Easy', 
                      url: '', 
                      sort_order: problems.length 
                    }])}
                  >
                    <Plus className="h-4 w-4 me-2" />
                    {t('admin.add')}
                  </Button>
                </div>
                
                {problems.map((problem, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline">{problem.platform}</Badge>
                      <Button size="icon" variant="ghost" onClick={() => setProblems(problems.filter((_, i) => i !== idx))}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Input
                        value={problem.title}
                        onChange={(e) => {
                          const updated = [...problems];
                          updated[idx].title = e.target.value;
                          setProblems(updated);
                        }}
                        placeholder="Problem Title"
                      />
                      <Input
                        value={problem.platform}
                        onChange={(e) => {
                          const updated = [...problems];
                          updated[idx].platform = e.target.value;
                          setProblems(updated);
                        }}
                        placeholder="Platform (e.g., Codeforces)"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        value={problem.url}
                        onChange={(e) => {
                          const updated = [...problems];
                          updated[idx].url = e.target.value;
                          setProblems(updated);
                        }}
                        placeholder="Problem URL"
                        className="col-span-2"
                      />
                      <Select
                        value={problem.difficulty_en}
                        onValueChange={(v) => {
                          const updated = [...problems];
                          updated[idx].difficulty_en = v;
                          updated[idx].difficulty_ar = v === 'Easy' ? 'سهل' : v === 'Medium' ? 'متوسط' : 'صعب';
                          setProblems(updated);
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                ))}
                
                {problems.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">{t('admin.noProblems')}</p>
                )}
              </TabsContent>
              
              {/* Related Algorithms Tab */}
              <TabsContent value="related" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg">{t('algorithm.relatedAlgorithms')}</Label>
                  <div className="flex gap-2 w-1/2">
                    <Select
                      onValueChange={(val) => {
                        if (val && !relatedAlgos.find(r => r.related_algorithm_id === val)) {
                          setRelatedAlgos([...relatedAlgos, { 
                            algorithm_id: editingAlgorithm.id, 
                            related_algorithm_id: val, 
                            sort_order: relatedAlgos.length 
                          }]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin.selectAlgorithm') || 'Select Algorithm'} />
                      </SelectTrigger>
                      <SelectContent>
                        {algorithms
                          .filter(a => a.id !== editingAlgorithm.id && !relatedAlgos.find(r => r.related_algorithm_id === a.id))
                          .map(algo => (
                            <SelectItem key={algo.id} value={algo.id}>
                              {lang === 'ar' ? algo.title_ar : algo.title_en} ({algo.id})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.title')}</TableHead>
                      <TableHead>{t('admin.category')}</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedAlgos.map((related, idx) => {
                      const algo = algorithms.find(a => a.id === related.related_algorithm_id);
                      if (!algo) return null;
                      return (
                        <TableRow key={related.related_algorithm_id}>
                          <TableCell>
                            <div className="font-medium">{lang === 'ar' ? algo.title_ar : algo.title_en}</div>
                            <div className="text-xs text-muted-foreground font-mono">{algo.id}</div>
                          </TableCell>
                          <TableCell>{lang === 'ar' ? algo.category_ar : algo.category_en}</TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" onClick={() => setRelatedAlgos(relatedAlgos.filter((_, i) => i !== idx))}>
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {relatedAlgos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          {t('admin.noRelatedAlgorithms') || 'No related algorithms selected'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 me-2" />
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>

      {/* Edit History Section */}
      <Card className="mt-6">
        <CardHeader
          className="flex flex-row items-center justify-between cursor-pointer"
          onClick={() => setShowHistory(!showHistory)}
        >
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              {t('admin.editHistory')}
            </CardTitle>
            <CardDescription>{t('admin.editHistoryDesc')}</CardDescription>
          </div>
          <Badge variant="outline">{auditLog.length} {t('admin.recentChanges')}</Badge>
        </CardHeader>
        {showHistory && (
          <CardContent>
            {auditLog.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">{t('admin.noRecentChanges')}</p>
            ) : (
              <div className="space-y-3">
                {auditLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {entry.performed_by_username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{entry.performed_by_username}</span>
                        <Badge
                          variant={
                            entry.action === 'create' ? 'default' :
                            entry.action === 'delete' ? 'destructive' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {t(`admin.action_${entry.action}`)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {lang === 'ar'
                            ? entry.changes?.title_ar
                            : entry.changes?.title_en || entry.changes?.title_ar}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(entry.created_at).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        ID: {entry.algorithm_id}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}