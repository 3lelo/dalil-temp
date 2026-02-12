import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { t, dir } = useI18n();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md text-center">
        {/* Icon - Broken Compass SVG */}
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center">
          <img src="/assets/images/not-found.png" alt="404" />
        </div>

        {/* Error Code */}
        <h1 className="mb-3 text-6xl font-bold tracking-tight text-foreground">404</h1>

        {/* Title */}
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          {t('notFound.title')}
        </h2>

        {/* Message */}
        <p className="mb-8 text-muted-foreground">
          {t('notFound.message')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            variant="default"
            size="lg"
            className="gap-2"
          >
            <Link to="/">
              <Home className="h-4 w-4" />
              {t('notFound.backHome')}
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="dash-item gap-2"
            onClick={() => window.history.back()}
          >
            <button type="button">
              <ArrowLeft className="h-4 w-4" />
              {t('notFound.goBack')}
            </button>
          </Button>
        </div>

        {/* Additional Help */}
        <p className="mt-8 text-sm text-muted-foreground">
          {t('notFound.needHelp')}{' '}
          <Link
            to="https://discord.gg/68u2duwKuu"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t('notFound.contactSupport')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default NotFound;