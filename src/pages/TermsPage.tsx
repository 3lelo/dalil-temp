import React from 'react';
import { useI18n } from '@/i18n/I18nContext';

export default function TermsPage() {
  const { t, dir } = useI18n();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl font-sans" dir={dir}>
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {t('terms.title')}
        </h1>
        <div className="h-1.5 w-24 bg-primary mx-auto rounded-full"></div>
      </header>

      <div className="space-y-12 text-foreground/80 leading-relaxed">
        {/* Section 1: Introduction */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('terms.intro.title')}
          </h2>
          <p>{t('terms.intro.content')}</p>
        </section>

        {/* Section 2: User Accounts */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('terms.accounts.title')}
          </h2>
          <ul className="list-disc list-inside space-y-2 marker:text-primary">
            <li>{t('terms.accounts.creation')}</li>
            <li>{t('terms.accounts.username')}</li>
            <li>{t('terms.accounts.security')}</li>
          </ul>
        </section>

        {/* Section 3: Acceptable Use */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('terms.use.title')}
          </h2>
          <p className="mb-3">{t('terms.use.educational')}</p>
          <p className="p-4 bg-destructive/10 border-l-4 border-destructive rounded">
            {t('terms.use.prohibited')}
          </p>
        </section>

        {/* Section 4: Content Ownership */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('terms.content.title')}
          </h2>
          <div className="space-y-4">
            <p>{t('terms.content.platform')}</p>
            <p>{t('terms.content.user')}</p>
          </div>
        </section>

        {/* Section 5: Progress Disclaimer */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('terms.gamification.title')}
          </h2>
          <p>{t('terms.gamification.content')}</p>
        </section>

        {/* Section 6: Moderation */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('terms.mod.title')}
          </h2>
          <p>{t('terms.mod.content')}</p>
        </section>

        {/* Section 7: Availability */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('terms.availability.title')}
          </h2>
          <p>{t('terms.availability.content')}</p>
        </section>

        {/* Section 8: Changes */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('terms.changes.title')}
          </h2>
          <p>{t('terms.changes.content')}</p>
        </section>

        {/* Section 9: Contact */}
        <section className="pt-8 border-t">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('terms.contact.title')}
          </h2>
          <p>{t('terms.contact.content')}</p>
        </section>
      </div>
    </div>
  );
}
