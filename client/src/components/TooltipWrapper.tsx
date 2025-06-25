import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TooltipWrapperProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
  disabled?: boolean;
  mobileContent?: string;
}

export function TooltipWrapper({ 
  children, 
  content, 
  side = "top", 
  delayDuration = 300,
  disabled = false,
  mobileContent 
}: TooltipWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (disabled || !content) {
    return <>{children}</>;
  }

  const tooltipContent = mobileContent || content;
  const mobileSide = isMobile ? "bottom" : side;
  const mobileDelay = isMobile ? 100 : delayDuration;

  return (
    <TooltipProvider delayDuration={mobileDelay}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={mobileSide} 
          className={`max-w-xs ${isMobile ? 'text-xs px-2 py-1' : ''}`}
          sideOffset={isMobile ? 8 : 4}
        >
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}