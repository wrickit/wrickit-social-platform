import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { X, Play, SkipForward } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";

interface WelcomeBannerProps {
  user: any;
}

export default function WelcomeBanner({ user }: WelcomeBannerProps) {
  const { isFirstTimeUser, startTutorial, completeTutorial } = useOnboarding();
  const [isVisible, setIsVisible] = useState(true);

  if (!isFirstTimeUser || !isVisible) return null;

  const handleStartTutorial = () => {
    startTutorial();
    setIsVisible(false);
  };

  const handleSkip = () => {
    completeTutorial();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 font-bold">👋</span>
              </div>
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                Welcome to Wrickit, {user.firstName || user.name}!
              </h3>
            </div>
            
            <p className="text-purple-700 dark:text-purple-300 text-sm mb-4">
              You're all set to connect with your classmates! Would you like a quick tour to see what you can do?
            </p>
            
            <div className="flex items-center space-x-3">
              <Button 
                size="sm" 
                onClick={handleStartTutorial}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Play className="w-4 h-4 mr-1" />
                Start Tutorial
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300"
                  >
                    <SkipForward className="w-4 h-4 mr-1" />
                    Skip for Now
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Skip Tutorial?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to skip the tutorial? You won't be able to see this guided tour again. You can still explore the features on your own.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Continue Tutorial</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSkip}>Skip Tutorial</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="text-purple-600 hover:text-purple-800 dark:text-purple-400"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}