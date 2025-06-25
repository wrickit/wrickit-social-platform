import React, { useState, useEffect, forwardRef } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TooltipWrapperProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
  disabled?: boolean;
  mobileContent?: string;
}

export const TooltipWrapper = forwardRef<HTMLDivElement, TooltipWrapperProps>(({ 
  children, 
  content, 
  side = "top", 
  delayDuration = 300,
  disabled = false,
  mobileContent 
}, ref) => {
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
    return <div ref={ref}>{children}</div>;
  }

  const tooltipContent = mobileContent || content;
  const mobileSide = isMobile ? "bottom" : side;
  const mobileDelay = isMobile ? 100 : delayDuration;

  return (
    <TooltipProvider delayDuration={mobileDelay}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div ref={ref}>{children}</div>
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
});

TooltipWrapper.displayName = "TooltipWrapper";