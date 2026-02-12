// src/components/layout/Footer.tsx
import React from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const { t, dir } = useI18n();

  const FooterLogoIcon = () => (
    <svg 
      className="footer-logo-icon text-primary" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <footer className={cn("relative pt-16 overflow-hidden", className)} dir={dir}>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FooterLogoIcon />
              <h3 className="text-xl font-semibold">
                {t('nav.home')}
              </h3>
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {t('footer.desc')}
            </p>
            
            <div className="flex gap-4">
               {/* Instagram */}
              <a 
                href="https://www.instagram.com/dalil4cp" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg 
                  className="w-5 h-5" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 1 1-5 5 5 5 0 0 1 5-5m0 2a3 3 0 1 0 3 3 3 3 0 0 0-3-3z" />
                </svg>
              </a>

              {/* Facebook */}
              <a 
                href="https://www.facebook.com/profile.php?id=61587893243942" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg 
                  className="w-5 h-5" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.17 6 13 6c.88 0 1.64.09 1.83.12V8.5h-1.25c-.95 0-1.25.68-1.25 1.48V12h3l-.4 3h-2.6v6.8C18.56 20.87 22 16.84 22 12z" />
                </svg>
              </a>

              {/* Tiktok */}
              <a 
                href="https://www.tiktok.com/@dalil4cp.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg 
                  className="w-5 h-5" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>

              {/* Discord */}
              <a 
                href="https://discord.gg/68u2duwKuu" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg 
                  className="w-5 h-5" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M15.0031,4 C15.74742,4 16.532444,4.2597504 17.2533144,4.5466496 L17.7803,4.76328 L17.7803,4.76328 C19.0402,5.29134 19.7484,6.39876 20.2975,7.61613 C21.1882,9.59078 21.8067,12.2238 22.0209,14.2256 C22.1227,15.1766 22.1483,16.1321 21.9647,16.7747 C21.76838,17.46166 21.0975,17.947788 20.4466008,18.3303128 L20.1251058,18.5133917 L20.1251058,18.5133917 L19.7907,18.6986 C19.61865,18.794725 19.442175,18.8900812 19.2660703,18.9830547 L18.7436625,19.2532125 L18.7436625,19.2532125 L18.0271553,19.610458 L18.0271553,19.610458 L17.4503,19.8944 L17.4503,19.8944 C16.9564,20.1414 16.3557,19.9412 16.1087,19.4472 C15.8617,18.9532 16.0619,18.3526 16.5559,18.1056 L17.3469,17.7158 L17.3469,17.7158 L16.7663,17.1071 C15.3765,17.6777 13.7389,18 12.0001,18 C10.2612,18 8.6236,17.6777 7.23378,17.1071 L6.65415,17.7148 L7.44727,18.1056 L7.44727,18.1056 C7.94124,18.3526 8.14147,18.9532 7.89448,19.4472 C7.64749,19.9412 7.04682,20.1414 6.55284,19.8944 L6.00922,19.6247 C5.60650667,19.4255667 5.20386444,19.2265222 4.80574963,19.0185 L3.87804989,18.5133917 L3.87804989,18.5133917 L3.55657432,18.3303128 C2.9057004,17.947788 2.234774,17.46166 2.03851,16.7747 C1.85493,16.1321 1.88051,15.1766 1.98227,14.2256 C2.19645,12.2238 2.81496,9.59078 3.70567,7.61613 C4.25479,6.39877 4.96296,5.29134 6.22289,4.76328 C7.05903,4.41284 8.07171,4 9.00004,4 C9.60303,4 10.0767,4.55523 9.98927,5.14727 C10.6366,5.05075 11.3099,5 12.0001,5 C12.6914,5 13.3657,5.05091 14.014,5.14774 C13.9263,4.55557 14.4,4 15.0031,4 Z M8.75006,10.5 C7.78356,10.5 7.00006,11.2835 7.00006,12.25 C7.00006,13.2165 7.78356,14 8.75006,14 C9.71656,14 10.5001,13.2165 10.5001,12.25 C10.5001,11.2835 9.71656,10.5 8.75006,10.5 Z M15.2501,10.5 C14.2836,10.5 13.5001,11.2835 13.5001,12.25 C13.5001,13.2165 14.2836,14 15.2501,14 C16.2166,14 17.0001,13.2165 17.0001,12.25 C17.0001,11.2835 16.2166,10.5 15.2501,10.5 Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-medium mb-4 text-foreground">
              {t('footer.quickLinks')}
            </h4>
            <ul>
              <li>
                <button
                  onClick={() => handleNavigation('/docs#why')}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  {t('link.whyProgramming')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/docs#core')}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  {t('link.problemSolving')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/docs#competitions')}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  {t('link.competitions')}
                </button>
              </li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h4 className="text-sm font-medium mb-4 text-foreground">
              {t('footer.creditTitle')}
            </h4>
            <div className="flex flex-col space-y-2.5">
              <a
                href="https://www.linkedin.com/in/aliadnan08"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm w-fit"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                </svg>
                <span>{t('credit.ali')}</span>
              </a>
              <a
                href="https://www.linkedin.com/in/muradhethnawi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm w-fit"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                </svg>
                <span>{t('credit.murad')}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom border-t border-border/50 pt-6 text-center">
          <ul className="flex justify-center gap-4">
            <li>
              <button
                onClick={() => handleNavigation('/terms')}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                {t('footer.terms')}
              </button>
            </li>
            <p className="text-muted-foreground"> | </p>
            <li>
              <button
                onClick={() => handleNavigation('/privacy')}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                {t('footer.privacy')}
              </button>
            </li>
          </ul>
          <p className="text-muted-foreground text-xs mb-4">
            {"© dalil4cp.com - " + new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}