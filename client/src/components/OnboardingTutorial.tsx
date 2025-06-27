import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { X, ArrowLeft, ArrowRight, Check, MessageCircle, Users, Heart, Settings } from "lucide-react";
import { useLocation } from "wouter";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position: "top" | "bottom" | "left" | "right";
  route?: string;
  action?: string;
  skipable?: boolean;
}

interface OnboardingTutorialProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to Wrickit!",
    description: "Let's take a quick tour of your new social platform. This tutorial will show you how to connect with classmates and make new friends.",
    position: "bottom",
    skipable: true
  },
  {
    id: "dashboard",
    title: "Your Dashboard",
    description: "This is your home base! Here you'll see recent posts from your classmates and quick access to all features.",
    position: "bottom",
    route: "/",
    targetSelector: ".dashboard-content"
  },
  {
    id: "profile",
    title: "Your Profile",
    description: "Click on your profile picture to update your bio, change your photo, and manage your account settings.",
    position: "left",
    targetSelector: "img[alt='Profile'], .profile-pic",
    action: "highlight"
  },
  {
    id: "search",
    title: "Find Classmates",
    description: "Use the search button to find your classmates by name or username. Start building your network!",
    position: "bottom",
    targetSelector: "[title='🔍 Find'], button:has(svg[data-icon='search'])"
  },
  {
    id: "messages",
    title: "Messages",
    description: "Chat with your friends and classmates. You can send text messages or even voice messages!",
    position: "bottom",
    route: "/messages",
    targetSelector: "a[href='/messages'], .messages-link"
  },
  {
    id: "posts",
    title: "Share Posts",
    description: "Create posts to share with your class or grade. You can share text, images, or voice messages.",
    position: "top",
    targetSelector: ".post-form, textarea[placeholder*='mind']"
  },
  {
    id: "relationships",
    title: "Build Relationships",
    description: "Add classmates as friends, best friends, acquaintances, or even mark your crushes. The app will notify you of mutual crushes!",
    position: "bottom",
    route: "/relationships",
    targetSelector: "a[href='/relationships']"
  },
  {
    id: "notifications",
    title: "Stay Updated",
    description: "Check your notifications to see new messages, friend requests, and other important updates.",
    position: "left",
    targetSelector: ".notification-dropdown, button:has([data-icon='bell'])"
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "You've completed the tutorial! Start connecting with your classmates and building your social network. Have fun!",
    position: "bottom"
  }
];

export default function OnboardingTutorial({ isOpen, onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [, setLocation] = useLocation();
  const overlayRef = useRef<HTMLDivElement>(null);

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  useEffect(() => {
    if (!isOpen) return;

    // Navigate to required route if specified
    if (step.route) {
      setLocation(step.route);
    }

    // Highlight target element
    if (step.targetSelector) {
      const timer = setTimeout(() => {
        const element = document.querySelector(step.targetSelector!) as HTMLElement;
        if (element) {
          setHighlightedElement(element);
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep, isOpen, step.route, step.targetSelector, setLocation]);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedElement(null);
      setCurrentStep(0); // Reset to first step when closed
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Add highlight overlay effect
    if (highlightedElement) {
      const rect = highlightedElement.getBoundingClientRect();
      const overlay = overlayRef.current;
      
      if (overlay) {
        overlay.style.clipPath = `polygon(
          0% 0%, 
          0% 100%, 
          ${rect.left}px 100%, 
          ${rect.left}px ${rect.top}px, 
          ${rect.right}px ${rect.top}px, 
          ${rect.right}px ${rect.bottom}px, 
          ${rect.left}px ${rect.bottom}px, 
          ${rect.left}px 100%, 
          100% 100%, 
          100% 0%
        )`;
      }
    }
  }, [highlightedElement, isOpen]);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    setHighlightedElement(null);
    onComplete();
  };

  const skipTutorial = () => {
    setHighlightedElement(null);
    onSkip();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 transition-all duration-300 pointer-events-auto"
        style={{
          clipPath: highlightedElement ? undefined : "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
        }}
      />
      
      {/* Tutorial Card */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl pointer-events-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  {step.id === "welcome" && <Heart className="w-4 h-4 text-purple-600" />}
                  {step.id === "dashboard" && <Users className="w-4 h-4 text-purple-600" />}
                  {step.id === "messages" && <MessageCircle className="w-4 h-4 text-purple-600" />}
                  {step.id === "complete" && <Check className="w-4 h-4 text-green-600" />}
                  {!["welcome", "dashboard", "messages", "complete"].includes(step.id) && 
                    <Settings className="w-4 h-4 text-purple-600" />}
                </div>
                <div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    Step {currentStep + 1} of {tutorialSteps.length}
                  </Badge>
                </div>
              </div>
              {step.skipable && (
                <Button variant="ghost" size="sm" onClick={skipTutorial}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Progress value={progress} className="mt-3" />
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              {step.description}
            </p>
            
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex space-x-2">
                {step.id !== "complete" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Skip Tutorial
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
                        <AlertDialogAction onClick={skipTutorial}>Skip Tutorial</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                
                <Button size="sm" onClick={nextStep}>
                  {step.id === "complete" ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}