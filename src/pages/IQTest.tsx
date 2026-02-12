import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type SkillQuestion = {
  id: number;                 // DB row id (bigint serial)
  qcode: string;              // IMPORTANT: used for submitting answers
  section_id: string;         // should be "skill_assessment"
  algorithm_ref: string | null; // algorithms.json id (optional)
  kind: string | null;        // concept/practice (optional)
  order_index: number;
  question_ar: string;
  question_en: string;
  choices_ar: string[];
  choices_en: string[];
  correct_index: number;
};

type AnswerPayload = { qcode: string; selected_index: number };

export default function IQTest() {
  const [questions, setQuestions] = useState<SkillQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // store answers by qcode
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { t, dir, lang } = useI18n();
  const { refreshProfile, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      setError("");

      try {
        const { data, error: fetchError } = await supabase
          .from("iq_questions")
          .select(
            "id,qcode,section_id,algorithm_ref,kind,order_index,question_ar,question_en,choices_ar,choices_en,correct_index"
          )
          .eq("is_active", true)
          .eq("section_id", "skill_assessment")
          .order("order_index");

        if (fetchError) {
          console.error("Error fetching questions:", fetchError);
          setError(t("common.error", "حدث خطأ أثناء تحميل الأسئلة"));
          return;
        }

        const normalized: SkillQuestion[] =
          (data || []).map((q: any) => ({
            ...q,
            choices_ar: Array.isArray(q.choices_ar) ? q.choices_ar : [],
            choices_en: Array.isArray(q.choices_en) ? q.choices_en : [],
          })) || [];

        setQuestions(normalized);
      } catch (err) {
        console.error("Error:", err);
        setError(t("common.error", "حدث خطأ غير متوقع"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [t]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const currentAnswer = useMemo(() => {
    if (!currentQuestion) return undefined;
    return answers.get(currentQuestion.qcode);
  }, [answers, currentQuestion]);

  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSelectChoice = (choiceIndex: number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => new Map(prev).set(currentQuestion.qcode, choiceIndex));
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      if (!user) {
        setError(t("auth.required", "يجب تسجيل الدخول أولاً"));
        return;
      }

      const answersArray: AnswerPayload[] = Array.from(answers.entries()).map(
        ([qcode, selected_index]) => ({ qcode, selected_index })
      );

      // Must answer all questions
      if (answersArray.length < questions.length) {
        setError(t("iq.answerAll", "يرجى الإجابة على كل الأسئلة قبل الإرسال"));
        return;
      }

      // Call the NEW RPC
      const { data, error: rpcError } = await supabase.rpc("submit_skill_assessment", {
        answers: answersArray,
      });

      if (rpcError) {
        console.error("Error submitting assessment:", rpcError);
        setError(t("common.error", "حدث خطأ أثناء إرسال الاختبار"));
        return;
      }

      // refresh profile
      await refreshProfile();

      // go to personal roadmap tab
      navigate("/roadmap?tab=personal", { replace: true });
    } catch (err) {
      console.error("Submit error:", err);
      setError(t("common.error", "حدث خطأ غير متوقع"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Compass className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              {t("iq.noQuestions", "لا توجد أسئلة متاحة حالياً")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress Header */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {t("iq.question", "سؤال")} {currentIndex + 1} {t("iq.of", "من")} {questions.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">
              {lang === 'en' && currentQuestion?.question_en 
                ? currentQuestion.question_en 
                : currentQuestion?.question_ar}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {(lang === 'en' && currentQuestion?.choices_en?.length === currentQuestion?.choices_ar?.length
              ? currentQuestion.choices_en 
              : currentQuestion?.choices_ar
            ).map((choice, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectChoice(index)}
                className={cn(
                  "w-full p-4 rounded-lg border-2 text-start transition-all",
                  currentAnswer === index
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                      currentAnswer === index
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}
                  >
                    {currentAnswer === index && (
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  <span className="text-sm">{choice}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0 || isSubmitting}
          >
            {dir === "rtl" ? (
              <ChevronRight className="h-4 w-4 me-2" />
            ) : (
              <ChevronLeft className="h-4 w-4 me-2" />
            )}
            {t("iq.previous", "السابق")}
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || answers.size < questions.length}
            >
              {isSubmitting && <Compass className="h-4 w-4 me-2 animate-spin" />}
              {t("iq.submit", "إرسال")}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={currentAnswer === undefined}>
              {t("iq.next", "التالي")}
              {dir === "rtl" ? (
                <ChevronLeft className="h-4 w-4 ms-2" />
              ) : (
                <ChevronRight className="h-4 w-4 ms-2" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
