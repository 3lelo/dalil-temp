import React, { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { FlowChartBuildContent, FlowChartElement } from '@/data/flowchartExercises';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, GripVertical, RotateCcw, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlowChartBuilderProps {
  content: FlowChartBuildContent;
  correctAnswer: string[];
  onCorrect: () => void;
  lang: 'ar' | 'en';
}

interface BranchPath {
  yesBranch: FlowChartElement[];
  noBranch: FlowChartElement[];
}

export default function FlowChartBuilder({
  content,
  correctAnswer,
  onCorrect,
  lang
}: FlowChartBuilderProps) {
  const { t } = useI18n();
  const [arrangedElements, setArrangedElements] = useState<FlowChartElement[]>([]);
  const [branches, setBranches] = useState<{ [key: string]: BranchPath }>({});
  const [availableElements, setAvailableElements] = useState<FlowChartElement[]>(
    [...content.elements].sort(() => Math.random() - 0.5)
  );
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ element: FlowChartElement; source: string } | null>(null);
  const [selectedElement, setSelectedElement] = useState<{ element: FlowChartElement; source: string } | null>(null);

  const instructions = lang === 'ar' ? content.instructions_ar : content.instructions_en;

  const handleDragStart = (element: FlowChartElement, source: string) => {
    setDraggedItem({ element, source });
    setSelectedElement(null); // Clear selection on drag
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // --- Core State Logic (Reusable) ---

  const removeFromAnywhere = (elementId: string) => {
    // 1. Try removing from Available
    setAvailableElements(prev => {
      const found = prev.find(el => el.id === elementId);
      return found ? prev.filter(el => el.id !== elementId) : prev;
    });

    // 2. Try removing from Main Flow
    setArrangedElements(prev => {
      const found = prev.find(el => el.id === elementId);
      return found ? prev.filter(el => el.id !== elementId) : prev;
    });

    // 3. Try removing from all Branches (Deep Search)
    setBranches(prev => {
      let changed = false;
      const newBranches = { ...prev };

      Object.keys(newBranches).forEach(decisionId => {
        const path = newBranches[decisionId];
        const inYes = path.yesBranch.find(el => el.id === elementId);
        const inNo = path.noBranch.find(el => el.id === elementId);

        if (inYes || inNo) {
          changed = true;
          newBranches[decisionId] = {
            ...path,
            yesBranch: inYes ? path.yesBranch.filter(el => el.id !== elementId) : path.yesBranch,
            noBranch: inNo ? path.noBranch.filter(el => el.id !== elementId) : path.noBranch
          };
        }
      });

      return changed ? newBranches : prev;
    });
  };

  const moveElementToMain = (element: FlowChartElement, targetIndex?: number) => {
    removeFromAnywhere(element.id);

    setArrangedElements(prev => {
      const newArranged = [...prev];
      if (targetIndex !== undefined) {
        newArranged.splice(targetIndex, 0, element);
      } else {
        newArranged.push(element);
      }
      return newArranged;
    });

    if (element.type === 'decision') {
      setBranches(prev => {
        if (!prev[element.id]) {
          return { ...prev, [element.id]: { yesBranch: [], noBranch: [] } };
        }
        return prev;
      });
    }
  };

  const moveElementToBranch = (element: FlowChartElement, decisionId: string, branchType: 'yes' | 'no', targetIndex?: number) => {
    if (element.id === decisionId) return; // Prevent self-nesting

    removeFromAnywhere(element.id);

    setBranches(prev => {
      const newBranches = { ...prev };
      const oldBranchPath = newBranches[decisionId] || { yesBranch: [], noBranch: [] };
      const newBranchPath = { ...oldBranchPath };
      
      const activeBranchList = branchType === 'yes' ? [...newBranchPath.yesBranch] : [...newBranchPath.noBranch];

      if (targetIndex !== undefined) {
        activeBranchList.splice(targetIndex, 0, element);
      } else {
        activeBranchList.push(element);
      }

      if (branchType === 'yes') {
        newBranchPath.yesBranch = activeBranchList;
      } else {
        newBranchPath.noBranch = activeBranchList;
      }
      
      newBranches[decisionId] = newBranchPath;

     if (element.type === 'decision' && !newBranches[element.id]) {
        newBranches[element.id] = { yesBranch: [], noBranch: [] };
      }

      return newBranches;
    });
  };

  const moveElementToAvailable = (element: FlowChartElement) => {
    removeFromAnywhere(element.id);
    setAvailableElements(prev => [...prev, element]);
  };

  // --- Interaction Handlers (Drag & Click) ---

  const handleElementClick = (element: FlowChartElement, source: string) => {
    if (selectedElement?.element.id === element.id) {
      setSelectedElement(null); // Deselect if clicked again
    } else {
      setSelectedElement({ element, source });
    }
  };

  const handleZoneClick = (
    type: 'main' | 'branch' | 'available',
    decisionId?: string,
    branchType?: 'yes' | 'no',
    targetIndex?: number
  ) => {
    if (!selectedElement) return;

    const { element } = selectedElement;

    if (type === 'main') {
      moveElementToMain(element, targetIndex);
    } else if (type === 'branch' && decisionId && branchType) {
      moveElementToBranch(element, decisionId, branchType, targetIndex);
    } else if (type === 'available') {
      moveElementToAvailable(element);
    }

    setSelectedElement(null);
  };

  const handleDropToMain = (e: React.DragEvent, targetIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;
    moveElementToMain(draggedItem.element, targetIndex);
    setDraggedItem(null);
  };

  const handleDropToBranch = (e: React.DragEvent, decisionId: string, branchType: 'yes' | 'no', targetIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;
    moveElementToBranch(draggedItem.element, decisionId, branchType, targetIndex);
    setDraggedItem(null);
  };

  const handleDropToAvailable = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;
    moveElementToAvailable(draggedItem.element);
    setDraggedItem(null);
  };

  const flattenFlowchart = (elements: FlowChartElement[]): string[] => {
    const ids: string[] = [];
    elements.forEach(el => {
      ids.push(el.id);
      if (el.type === 'decision' && branches[el.id]) {
        const branch = branches[el.id];
        const yesIds = flattenFlowchart(branch.yesBranch);
        const noIds = flattenFlowchart(branch.noBranch);
        ids.push(...yesIds);
        ids.push(...noIds);
      }
    });
    return ids;
  };

  const handleCheck = () => {
    const userFlatAnswer = flattenFlowchart(arrangedElements);
    const correct = JSON.stringify(userFlatAnswer) === JSON.stringify(correctAnswer);
    setIsCorrect(correct);
    setShowFeedback(true);
    if (correct) onCorrect();
  };

  const handleReset = () => {
    setArrangedElements([]);
    setBranches({});
    setAvailableElements([...content.elements].sort(() => Math.random() - 0.5));
    setShowFeedback(false);
    setIsCorrect(false);
    setSelectedElement(null);
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'start': case 'end': return '⬭';
      case 'process': return '▭';
      case 'decision': return '◆';
      case 'input_output': return '▱';
      case 'connector': return '○';
      default: return '▢';
    }
  };

  const getElementColor = (type: string, isSelected: boolean) => {
    const base = (() => {
      switch (type) {
        case 'start': case 'end': return 'bg-green-500/10 border-green-500 text-green-700 dark:text-green-400';
        case 'process': return 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400';
        case 'decision': return 'bg-yellow-500/10 border-yellow-500 text-yellow-700 dark:text-yellow-400';
        case 'input_output': return 'bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-400';
        default: return 'bg-gray-500/10 border-gray-500 text-gray-700 dark:text-gray-400';
      }
    })();

    if (isSelected) {
      return cn(base, "ring-2 ring-offset-2 ring-primary border-primary shadow-lg scale-105 z-10");
    }
    return cn(base, "hover:bg-opacity-30");
  };

  const renderElement = (element: FlowChartElement, source: string, index?: number) => {
    const text = lang === 'ar' ? element.text_ar : element.text_en;
    const isSelected = selectedElement?.element.id === element.id;
    
    return (
      <div
        key={element.id}
        draggable
        onClick={(e) => { e.stopPropagation(); handleElementClick(element, source); }}
        onDragStart={() => handleDragStart(element, source)}
        onDragOver={handleDragOver}
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-lg border-2 cursor-pointer transition-all w-full select-none",
          getElementColor(element.type, isSelected)
        )}
      >
        <GripVertical className="h-4 w-4 opacity-50" />
        <span className="text-2xl">{getElementIcon(element.type)}</span>
        <span className="font-medium flex-1">{text}</span>
        {isSelected && <MousePointerClick className="h-4 w-4 text-primary animate-pulse" />}
      </div>
    );
  };

  const renderBranch = (decisionId: string, branchType: 'yes' | 'no', branchElements: FlowChartElement[]) => {
    const isYes = branchType === 'yes';
    const label = isYes ? (lang === 'ar' ? 'نعم' : 'Yes') : (lang === 'ar' ? 'لا' : 'No');
    const colorClass = isYes ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5';
    const labelColor = isYes ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const isActiveZone = !!selectedElement;

    return (
      <div className="flex-1 min-w-[200px]">
        <div className="text-center mb-2">
          <span className={cn("text-sm font-semibold", labelColor)}>{label}</span>
          <div className={cn("text-xl", labelColor)}>↓</div>
        </div>
        <div
          className={cn(
            "min-h-32 p-3 border-2 border-dashed rounded-lg transition-all",
            colorClass,
            isActiveZone && "hover:bg-primary/5 cursor-pointer hover:border-primary/50",
            isActiveZone && branchElements.length === 0 && "animate-pulse border-primary/30"
          )}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropToBranch(e, decisionId, branchType)}
          onClick={() => handleZoneClick('branch', decisionId, branchType)}
        >
          <div className="space-y-2">
            {branchElements.map((element, idx) => (
              <React.Fragment key={element.id}>
                {renderElement(element, `${branchType}-${decisionId}`, idx)}
                {idx < branchElements.length - 1 && (
                  <div className="text-center text-muted-foreground">↓</div>
                )}
              </React.Fragment>
            ))}
            {branchElements.length === 0 && (
              <p className={cn(
                "text-xs text-muted-foreground italic text-center py-4",
                isActiveZone && "text-primary font-medium"
              )}>
                {isActiveZone ? t('flowchart.exercise.clickToPlace') || "Click to place here" : t('flowchart.exercise.dragElementsHere')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="p-4 bg-muted/50 rounded-lg border">
        <p className="leading-relaxed">{instructions}</p>
        <p className="text-sm text-muted-foreground mt-2">
            {t('flowchart.exercise.tip')}
        </p>
      </div>

      {/* Available Elements */}
      <div>
        <h3 className="font-semibold mb-3">{t('flowchart.exercise.availableElements')}</h3>
        <div
          className={cn(
             "min-h-24 p-4 border-2 border-dashed rounded-lg bg-muted/20 transition-all",
             selectedElement?.source !== 'available' && selectedElement ? "hover:border-primary/50 cursor-pointer bg-muted/40" : ""
          )}
          onDragOver={handleDragOver}
          onDrop={handleDropToAvailable}
          onClick={() => handleZoneClick('available')}
        >
          <div className="flex flex-wrap gap-2">
            {availableElements.map((element) => {
              const text = lang === 'ar' ? element.text_ar : element.text_en;
              const isSelected = selectedElement?.element.id === element.id;
              return (
                <div
                  key={element.id}
                  draggable
                  onClick={(e) => { e.stopPropagation(); handleElementClick(element, 'available'); }}
                  onDragStart={() => handleDragStart(element, 'available')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all select-none",
                    getElementColor(element.type, isSelected)
                  )}
                >
                  <GripVertical className="h-4 w-4 opacity-50" />
                  <span className="text-2xl">{getElementIcon(element.type)}</span>
                  <span className="font-medium">{text}</span>
                  {isSelected && <MousePointerClick className="h-4 w-4 text-primary" />}
                </div>
              );
            })}
            {availableElements.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                {t('flowchart.exercise.allElementsUsed')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Arranged Flowchart */}
      <div>
        <h3 className="font-semibold mb-3">{t('flowchart.exercise.yourFlowchart')}</h3>
        <div
          className={cn(
             "min-h-48 p-4 border-2 border-primary/30 rounded-lg bg-background transition-all",
             selectedElement ? "hover:border-primary cursor-pointer shadow-sm" : ""
          )}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropToMain(e)}
          onClick={() => handleZoneClick('main')}
        >
          <div className="flex flex-col items-center gap-3">
            {arrangedElements.map((element, index) => {
              const isDecision = element.type === 'decision';
              const hasBranches = isDecision && branches[element.id];
              
              return (
                <React.Fragment key={element.id}>
                  <div className="w-full max-w-md">
                    {renderElement(element, 'main', index)}
                  </div>
                  
                  {/* Show branches for decision nodes */}
                  {hasBranches && (
                    <div className="w-full max-w-3xl">
                      <div className="flex gap-4 justify-center">
                        {renderBranch(element.id, 'yes', branches[element.id].yesBranch)}
                        {renderBranch(element.id, 'no', branches[element.id].noBranch)}
                      </div>
                    </div>
                  )}
                  
                  {/* Arrow between main elements */}
                  {index < arrangedElements.length - 1 && (
                    <div className="text-2xl text-muted-foreground">↓</div>
                  )}
                </React.Fragment>
              );
            })}
            {arrangedElements.length === 0 && (
              <p className={cn(
                "text-sm text-muted-foreground italic py-8",
                 selectedElement && "text-primary font-medium"
              )}>
                {selectedElement ? (t('flowchart.exercise.clickToPlace') || "Click to place here") : t('flowchart.exercise.dragElementsHere')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {!showFeedback && (
        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={arrangedElements.length === 0}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('flowchart.exercise.reset')}
          </Button>
          <Button
            onClick={handleCheck}
            disabled={arrangedElements.length === 0}
          >
            {t('flowchart.exercise.checkAnswer')}
          </Button>
        </div>
      )}

      {/* Feedback */}
      {showFeedback && (
        <div className="space-y-4">
          <Alert variant={isCorrect ? 'default' : 'destructive'}>
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertDescription>
                  {isCorrect
                    ? t('flowchart.exercise.correctFeedback')
                    : t('flowchart.exercise.incorrectFeedback')}
                </AlertDescription>
              </div>
            </div>
          </Alert>

          {!isCorrect && (
            <div className="flex justify-center">
              <Button onClick={handleReset}>
                {t('flowchart.exercise.tryAgain')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
