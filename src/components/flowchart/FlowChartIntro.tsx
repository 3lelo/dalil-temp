import React from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Square, Circle as CircleIcon, Diamond } from 'lucide-react';

export default function FlowChartIntro() {
  const { t, lang } = useI18n();

  const symbols = [
    {
      icon: <div className="w-16 h-10 border-2 border-primary rounded-full flex items-center justify-center text-xs font-medium">Start/End</div>,
      name_ar: 'بداية/نهاية',
      name_en: 'Start/End',
      desc_ar: 'يمثل بداية أو نهاية البرنامج',
      desc_en: 'Represents the start or end of the program'
    },
    {
      icon: <div className="w-16 h-10 border-2 border-primary flex items-center justify-center text-xs font-medium">Process</div>,
      name_ar: 'عملية',
      name_en: 'Process',
      desc_ar: 'يمثل عملية حسابية أو معالجة بيانات',
      desc_en: 'Represents a calculation or data processing'
    },
    {
      icon: <div className="w-16 h-16 border-2 border-primary rotate-45 flex items-center justify-center"><span className="-rotate-45 text-xs">Decision</span></div>,
      name_ar: 'قرار',
      name_en: 'Decision',
      desc_ar: 'يمثل نقطة اتخاذ قرار (شرط)',
      desc_en: 'Represents a decision point (condition)'
    },
    {
      icon: <div className="w-16 h-10 border-2 border-primary transform skew-x-12 flex items-center justify-center text-xs font-medium"><span className="-skew-x-12">I/O</span></div>,
      name_ar: 'إدخال/إخراج',
      name_en: 'Input/Output',
      desc_ar: 'يمثل عمليات القراءة أو الطباعة',
      desc_en: 'Represents read or print operations'
    }
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <CardTitle>{t('flowchart.intro.title')}</CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {t('flowchart.intro.badge')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* What is a Flowchart */}
        <div>
          <h3 className="font-semibold text-lg mb-2">{t('flowchart.intro.whatIs')}</h3>
          <p className="text-muted-foreground leading-relaxed">
            {t('flowchart.intro.whatIsDesc')}
          </p>
        </div>

        {/* Why Learn Flowcharts */}
        <div>
          <h3 className="font-semibold text-lg mb-2">{t('flowchart.intro.whyLearn')}</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t('flowchart.intro.reason1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t('flowchart.intro.reason2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t('flowchart.intro.reason3')}</span>
            </li>
          </ul>
        </div>

        {/* Flowchart Symbols */}
        <div>
          <h3 className="font-semibold text-lg mb-4">{t('flowchart.intro.symbols')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {symbols.map((symbol, index) => (
              <div key={index} className="flex items-start gap-4 p-3 border rounded-lg">
                <div className="flex-shrink-0 flex items-center justify-center">
                  {symbol.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">
                    {lang === 'ar' ? symbol.name_ar : symbol.name_en}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {lang === 'ar' ? symbol.desc_ar : symbol.desc_en}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example */}
        <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            {t('flowchart.intro.example')}
          </h4>
          <p className="text-sm text-muted-foreground">
            {t('flowchart.intro.exampleDesc')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
