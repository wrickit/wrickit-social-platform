import { useState } from "react";
import { X, Info } from "lucide-react";

interface BannerProps {
  message: string;
  type?: "info" | "warning" | "success";
  dismissible?: boolean;
}

export default function Banner({ message, type = "info", dismissible = true }: BannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const bgColor = {
    info: "bg-blue-50 border-blue-200",
    warning: "bg-yellow-50 border-yellow-200", 
    success: "bg-green-50 border-green-200"
  }[type];

  const textColor = {
    info: "text-blue-800",
    warning: "text-yellow-800",
    success: "text-green-800"
  }[type];

  const iconColor = {
    info: "text-blue-600",
    warning: "text-yellow-600",
    success: "text-green-600"
  }[type];

  return (
    <div className={`${bgColor} border-l-4 p-4 mb-4 ${textColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Info className={`w-5 h-5 mr-2 ${iconColor}`} />
          <p className="font-medium">{message}</p>
        </div>
        {dismissible && (
          <button
            onClick={() => setIsVisible(false)}
            className={`${textColor} hover:opacity-75 transition-opacity`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}