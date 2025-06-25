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
    if (!user?.id) return;

    // Check if user has completed tutorial from server data
    const hasCompleted = user.hasCompletedTutorial || false;
    
    setOnboardingState({
      hasCompletedTutorial: hasCompleted,
      hasSeenWelcome: hasCompleted,
      tutorialStep: 0
    });

    // Show tutorial for first time users
    if (!hasCompleted) {
      setShowTutorial(true);
    }
  }, [user?.id, user?.hasCompletedTutorial]);

  // Save onboarding state to database
  const saveOnboardingState = async (newState: Partial<OnboardingState>) => {
    if (!user?.id) return;

    const updatedState = { ...onboardingState, ...newState };
    setOnboardingState(updatedState);

    // If tutorial is completed, save to database
    if (newState.hasCompletedTutorial) {
      try {
        await apiRequest("/api/users/complete-tutorial", {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to save tutorial completion:", error);
      }
    }
  };

  const startTutorial = () => {
    setShowTutorial(true);
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
    if (!user?.id) return;
    
    // Reset tutorial status in database
    try {
      await apiRequest(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ hasCompletedTutorial: false }),
        headers: { "Content-Type": "application/json" }
      });
      
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