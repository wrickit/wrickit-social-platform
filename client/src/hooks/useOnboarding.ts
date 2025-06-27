import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingState {
  hasCompletedTutorial: boolean;
  hasSeenWelcome: boolean;
  tutorialStep: number;
}

export function useOnboarding() {
  const { user, isAuthenticated } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasCompletedTutorial: false,
    hasSeenWelcome: false,
    tutorialStep: 0
  });

  // Load onboarding state from database via user object
  useEffect(() => {
    if (!user || !(user as any)?.id) return;

    // Check if user has completed tutorial from server data
    const hasCompleted = (user as any).hasCompletedTutorial || false;
    
    setOnboardingState({
      hasCompletedTutorial: hasCompleted,
      hasSeenWelcome: hasCompleted,
      tutorialStep: 0
    });

    // Only show tutorial automatically for truly first-time users
    // Manual tutorial start will be handled by the startTutorial function
  }, [(user as any)?.id, (user as any)?.hasCompletedTutorial]);

  // Save onboarding state to database
  const saveOnboardingState = async (newState: Partial<OnboardingState>) => {
    if (!user || !(user as any)?.id) return;

    const updatedState = { ...onboardingState, ...newState };
    setOnboardingState(updatedState);

    // If tutorial is completed, save to database
    if (newState.hasCompletedTutorial) {
      try {
        await apiRequest("POST", "/api/users/complete-tutorial");
      } catch (error) {
        console.error("Failed to save tutorial completion:", error);
      }
    }
  };

  const startTutorial = () => {
    setShowTutorial(true);
    setOnboardingState(prev => ({
      ...prev,
      tutorialStep: 0
    }));
  };

  const completeTutorial = async () => {
    setShowTutorial(false);
    await saveOnboardingState({ 
      hasCompletedTutorial: true, 
      hasSeenWelcome: true 
    });
  };

  const skipTutorial = async () => {
    setShowTutorial(false);
    await saveOnboardingState({ 
      hasCompletedTutorial: true, 
      hasSeenWelcome: true 
    });
  };

  const resetOnboarding = async () => {
    if (!user || !(user as any)?.id) return;
    
    // Reset tutorial status in database
    try {
      await apiRequest("PUT", `/api/users/${(user as any).id}`, { hasCompletedTutorial: false });
      
      setOnboardingState({
        hasCompletedTutorial: false,
        hasSeenWelcome: false,
        tutorialStep: 0
      });
    } catch (error) {
      console.error("Failed to reset tutorial:", error);
    }
  };

  return {
    showTutorial,
    onboardingState,
    startTutorial,
    completeTutorial,
    skipTutorial,
    resetOnboarding,
    isFirstTimeUser: !onboardingState.hasSeenWelcome && isAuthenticated
  };
}