import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const handleGoHome = () => {
    setLocation(isAuthenticated ? "/" : "/");
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background dark:bg-background">
      <Card className="w-full max-w-md mx-4 sparkle-border">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-red-500 animate-pulse" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-2 font-ubuntu-heading">
            404
          </h1>
          
          <h2 className="text-xl font-semibold text-foreground mb-4 font-ubuntu-heading">
            Page Not Found
          </h2>

          <p className="text-muted-foreground mb-6 font-ubuntu-body">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={handleGoBack}
              variant="outline"
              className="flex items-center gap-2 font-ubuntu-body"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            
            <Button 
              onClick={handleGoHome}
              className="flex items-center gap-2 font-ubuntu-body bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Home className="h-4 w-4" />
              {isAuthenticated ? "Dashboard" : "Home"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
