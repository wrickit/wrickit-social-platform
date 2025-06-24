import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";

interface TutorialButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export default function TutorialButton({ 
  variant = "outline", 
  size = "sm", 
  className = "" 
}: TutorialButtonProps) {
  const { startTutorial } = useOnboarding();

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={startTutorial}
      className={className}
    >
      <Play className="w-4 h-4 mr-2" />
      Take Tutorial
    </Button>
  );
}