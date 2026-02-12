import React from 'react';
import { useI18n } from '@/i18n/I18nContext';

export default function PrivacyPage() {
  const { t, dir } = useI18n();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl font-sans" dir={dir}>
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {t('privacy.title')}
        </h1>
        <div className="h-1.5 w-24 bg-primary mx-auto rounded-full"></div>
      </header>

      <div className="space-y-12 text-foreground/80 leading-relaxed">
        {/* Section 1: Collect */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('privacy.collect.title')}
          </h2>
          <ul className="list-disc list-inside space-y-2 marker:text-primary">
            <li>{t('privacy.collect.account')}</li>
            <li>{t('privacy.collect.activity')}</li>
          </ul>
        </section>

        {/* Section 2: Use */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('privacy.use.title')}
          </h2>
          <p>{t('privacy.use.content')}</p>
        </section>

        {/* Section 3: Public vs Private */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('privacy.public.title')}
          </h2>
          <p>{t('privacy.public.content')}</p>
        </section>

        {/* Section 4: Cookies */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('privacy.cookies.title')}
          </h2>
          <p>{t('privacy.cookies.content')}</p>
        </section>

        {/* Section 5: Storage */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('privacy.storage.title')}
          </h2>
          <p>{t('privacy.storage.content')}</p>
        </section>

        {/* Section 6: Sharing */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('privacy.sharing.title')}
          </h2>
          <p>{t('privacy.sharing.content')}</p>
        </section>

        {/* Section 7: Deletion */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('privacy.deletion.title')}
          </h2>
          <p>{t('privacy.deletion.content')}</p>
        </section>

        {/* Section 8: Children */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('privacy.children.title')}
          </h2>
          <p>{t('privacy.children.content')}</p>
        </section>

        {/* Section 9: Updates */}
        <section className="pt-8 border-t">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t('privacy.updates.title')}
          </h2>
          <p>{t('privacy.updates.content')}</p>
        </section>
      </div>
    </div>
  );
}
