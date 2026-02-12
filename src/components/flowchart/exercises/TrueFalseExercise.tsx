import React, { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { TrueFalseContent } from '@/data/flowchartExercises';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

interface TrueFalseExerciseProps {
  content: TrueFalseContent;
  correctAnswer: boolean;
  onCorrect: () => void;
  lang: 'ar' | 'en';
}

export default function TrueFalseExercise({
  content,
  correctAnswer,
  onCorrect,
  lang
}: TrueFalseExerciseProps) {
  const { t } = useI18n();
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const statement = lang === 'ar' ? content.statement_ar : content.statement_en;

  const handleAnswer = (answer: boolean) => {
    setSelectedAnswer(answer);
    setShowFeedback(true);

    if (answer === correctAnswer) {
      onCorrect();
    }
  };

  const handleTryAgain = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const isCorrect = selectedAnswer === correctAnswer;

  return (
    <div className="space-y-6">
      {/* Statement */}
      <div className="p-6 bg-muted/50 rounded-lg border">
        <p className="text-lg leading-relaxed">{statement}</p>
      </div>

      {/* Answer Buttons */}
      {!showFeedback && (
        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleAnswer(true)}
            className="min-w-32"
          >
            {t('flowchart.exercise.true')}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleAnswer(false)}
            className="min-w-32"
          >
            {t('flowchart.exercise.false')}
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
              <Button onClick={handleTryAgain}>
                {t('flowchart.exercise.tryAgain')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
