import React, { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { MultipleChoiceContent } from '@/data/flowchartExercises';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultipleChoiceExerciseProps {
  content: MultipleChoiceContent;
  correctAnswer: number; // Index of correct answer
  onCorrect: () => void;
  lang: 'ar' | 'en';
}

export default function MultipleChoiceExercise({
  content,
  correctAnswer,
  onCorrect,
  lang
}: MultipleChoiceExerciseProps) {
  const { t } = useI18n();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const question = lang === 'ar' ? content.question_ar : content.question_en;
  const choices = lang === 'ar' ? content.choices_ar : content.choices_en;

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    setShowFeedback(true);

    if (index === correctAnswer) {
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
      {/* Question */}
      <div className="p-6 bg-muted/50 rounded-lg border">
        <p className="text-lg leading-relaxed font-medium">{question}</p>
      </div>

      {/* Choices */}
      {!showFeedback && (
        <div className="grid grid-cols-1 gap-3">
          {choices.map((choice, index) => (
            <Button
              key={index}
              variant="outline"
              size="lg"
              onClick={() => handleAnswer(index)}
              className="h-auto py-4 px-6 text-left justify-start whitespace-normal"
            >
              <span className="flex items-start gap-3 w-full">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1">{choice}</span>
              </span>
            </Button>
          ))}
        </div>
      )}

      {/* Selected Answer Display */}
      {showFeedback && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {choices.map((choice, index) => {
              const isSelected = index === selectedAnswer;
              const isCorrectChoice = index === correctAnswer;
              
              // Only show correct answer if the user got it right, or if we want to reveal it (which we don't for now)
              // The user requested: "Don't show the correct answer in the multiple choice when the user's answer is wrong"
              const showAsCorrect = isCorrectChoice && isCorrect;
              const showAsWrong = isSelected && !isCorrect;
              
              const isFaded = !isSelected && !showAsCorrect;

              return (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all",
                    showAsCorrect && "bg-green-500/10 border-green-500",
                    showAsWrong && "bg-red-500/10 border-red-500",
                    isFaded && "border-muted opacity-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium",
                      showAsCorrect && "bg-green-500 text-white",
                      showAsWrong && "bg-red-500 text-white",
                      isFaded && "bg-muted text-muted-foreground"
                    )}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{choice}</span>
                    {showAsCorrect && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                    {showAsWrong && (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feedback Alert */}
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
