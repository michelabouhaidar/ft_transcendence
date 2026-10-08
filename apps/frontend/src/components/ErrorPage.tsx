import React from "react";
import { ShieldAlert, AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { Button } from "./Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./Card";

interface ErrorPageProps {
  code: "403" | "404" | "500";
  title?: string;
  message?: string;
  onNavigateHome: () => void;
  onBack?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  code,
  title,
  message,
  onNavigateHome,
  onBack,
}) => {
  const is403 = code === "403";
  const defaultTitle = is403 ? "403 — Access Forbidden" : "404 — Page Not Found";
  const defaultMessage = is403
    ? "You do not have the required permissions to access this page or resource according to your current role."
    : "The page you are looking for does not exist or has been moved.";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-dark-bg text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <Card variant="default" className="max-w-md w-full border border-zinc-200 dark:border-dark-border shadow-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-none bg-destructive-50 dark:bg-destructive-950/40 text-destructive-600 border border-destructive-200 dark:border-destructive-900/60">
            {is403 ? <ShieldAlert className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold font-sans">
            {title || defaultTitle}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 font-sans">
            {message || defaultMessage}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2 text-center">
          <div className="p-3 bg-zinc-100 dark:bg-dark-card border border-zinc-200/80 dark:border-dark-border text-xs font-sans font-medium text-zinc-600 dark:text-zinc-400">
            HTTP Status: {code} &bull; Access Restricted
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
          {onBack && (
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={onBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Go Back
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={onNavigateHome}
            leftIcon={<Home className="w-4 h-4" />}
          >
            Return to Workspace
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
