import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { flowchartExercises, FlowChartExercise } from '@/data/flowchartExercises';
import FlowChartIntro from '@/components/flowchart/FlowChartIntro';
import FlowChartExerciseComponent from '@/components/flowchart/FlowChartExercise.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExerciseProgress {
  [exerciseId: string]: boolean; // true if completed correctly
}

export default function FlowChart() {
  const { t, lang, dir } = useI18n();
  const [progress, setProgress] = useState<ExerciseProgress>({});
  const [selectedExercise, setSelectedExercise] = useState<FlowChartExercise | null>(null);

  // Load progress from session storage on mount
  useEffect(() => {
    const savedProgress = sessionStorage.getItem('flowchart-progress');
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress));
      } catch (e) {
        console.error('Failed to parse flowchart progress:', e);
      }
    }
  }, []);

  // Save progress to session storage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('flowchart-progress', JSON.stringify(progress));
  }, [progress]);

  const handleExerciseComplete = (exerciseId: string) => {
    setProgress(prev => ({
      ...prev,
      [exerciseId]: true
    }));
  };

  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalCount = flowchartExercises.length;

  if (selectedExercise) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl" dir={dir}>
        <FlowChartExerciseComponent
          exercise={selectedExercise}
          isCompleted={progress[selectedExercise.id] || false}
          onComplete={() => handleExerciseComplete(selectedExercise.id)}
          onBack={() => setSelectedExercise(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" dir={dir}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('flowchart.title')}</h1>
        <p className="text-muted-foreground">{t('flowchart.subtitle')}</p>
      </div>

      {/* Introduction Section */}
      <FlowChartIntro />

      {/* Progress Card */}
      <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="font-medium">{t('flowchart.progress')}</span>
            </div>
            <Badge variant="secondary">
              {completedCount} / {totalCount}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Exercises List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('flowchart.exercises')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {flowchartExercises.map((exercise) => {
              const isCompleted = progress[exercise.id] || false;
              const title = lang === 'ar' ? exercise.title_ar : exercise.title_en;
              const description = lang === 'ar' ? exercise.description_ar : exercise.description_en;

              return (
                <button
                  key={exercise.id}
                  onClick={() => setSelectedExercise(exercise)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-lg border transition-all hover:shadow-md group text-left",
                    isCompleted
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-card hover:bg-muted hover:border-primary/30"
                  )}
                >
                  {/* Completion Indicator */}
                  <div
                    className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                      isCompleted
                        ? "bg-green-500 text-white"
                        : "border-2 border-muted-foreground/30"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>

                  {/* Exercise Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "font-medium transition-colors",
                          isCompleted
                            ? "text-green-600 dark:text-green-400"
                            : "group-hover:text-primary"
                        )}
                      >
                        {title}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {description}
                    </p>
                  </div>

                  {/* Exercise Type Badge */}
                  <Badge variant="outline" className="flex-shrink-0">
                    {exercise.type === 'flowchart_build' && t('flowchart.type.build')}
                    {exercise.type === 'true_false' && t('flowchart.type.trueFalse')}
                    {exercise.type === 'multiple_choice' && t('flowchart.type.multipleChoice')}
                  </Badge>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
