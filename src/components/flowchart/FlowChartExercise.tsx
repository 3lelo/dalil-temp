import React from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { FlowChartExercise as FlowChartExerciseType } from '@/data/flowchartExercises';
import FlowChartBuilder from './exercises/FlowChartBuilder.tsx';
import TrueFalseExercise from './exercises/TrueFalseExercise.tsx';
import MultipleChoiceExercise from './exercises/MultipleChoiceExercise.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlowChartExerciseProps {
  exercise: FlowChartExerciseType;
  isCompleted: boolean;
  onComplete: () => void;
  onBack: () => void;
}

export default function FlowChartExercise({
  exercise,
  isCompleted,
  onComplete,
  onBack
}: FlowChartExerciseProps) {
  const { t, lang, dir } = useI18n();

  const title = lang === 'ar' ? exercise.title_ar : exercise.title_en;
  const description = lang === 'ar' ? exercise.description_ar : exercise.description_en;

  const renderExercise = () => {
    switch (exercise.type) {
      case 'flowchart_build':
        return (
          <FlowChartBuilder
            content={exercise.content as any}
            correctAnswer={exercise.correctAnswer}
            onCorrect={onComplete}
            lang={lang}
          />
        );
      case 'true_false':
        return (
          <TrueFalseExercise
            content={exercise.content as any}
            correctAnswer={exercise.correctAnswer}
            onCorrect={onComplete}
            lang={lang}
          />
        );
      case 'multiple_choice':
        return (
          <MultipleChoiceExercise
            content={exercise.content as any}
            correctAnswer={exercise.correctAnswer}
            onCorrect={onComplete}
            lang={lang}
          />
        );
      default:
        return <div>Unknown exercise type</div>;
    }
  };

  return (
    <div>
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className={cn("h-4 w-4", dir === 'rtl' ? 'rotate-180' : '')} />
        <span className={dir === 'rtl' ? 'mr-2' : 'ml-2'}>{t('common.back')}</span>
      </Button>

      {/* Exercise Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle>{title}</CardTitle>
                {isCompleted && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {t('flowchart.exercise.completed')}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Badge variant="outline">
              {exercise.type === 'flowchart_build' && t('flowchart.type.build')}
              {exercise.type === 'true_false' && t('flowchart.type.trueFalse')}
              {exercise.type === 'multiple_choice' && t('flowchart.type.multipleChoice')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {renderExercise()}
        </CardContent>
      </Card>
    </div>
  );
}
