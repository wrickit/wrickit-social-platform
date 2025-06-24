import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

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

  // Load onboarding state from localStorage
  useEffect(() => {
    if (!user?.id) return;

    const storageKey = `wrickit-onboarding-${user.id}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const state = JSON.parse(stored);
        setOnboardingState(state);
      } catch (error) {
        console.warn("Failed to parse onboarding state:", error);
      }
    } else {
      // First time user - show tutorial
      setShowTutorial(true);
    }
  }, [user?.id]);

  // Save onboarding state to localStorage
  const saveOnboardingState = (newState: Partial<OnboardingState>) => {
    if (!user?.id) return;

    const storageKey = `wrickit-onboarding-${user.id}`;
    const updatedState = { ...onboardingState, ...newState };
    
    setOnboardingState(updatedState);
    localStorage.setItem(storageKey, JSON.stringify(updatedState));
  };

  const startTutorial = () => {
    setShowTutorial(true);
  };

  const completeTutorial = () => {
    setShowTutorial(false);
    saveOnboardingState({ 
      hasCompletedTutorial: true, 
      hasSeenWelcome: true 
    });
  };

  const skipTutorial = () => {
    setShowTutorial(false);
    saveOnboardingState({ 
      hasCompletedTutorial: true, 
      hasSeenWelcome: true 
    });
  };

  const resetOnboarding = () => {
    if (!user?.id) return;
    
    const storageKey = `wrickit-onboarding-${user.id}`;
    localStorage.removeItem(storageKey);
    setOnboardingState({
      hasCompletedTutorial: false,
      hasSeenWelcome: false,
      tutorialStep: 0
    });
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