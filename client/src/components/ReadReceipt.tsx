import { Check, CheckCheck } from "lucide-react";

interface ReadReceiptProps {
  isRead: boolean;
  readAt?: string;
  isOwnMessage: boolean;
}

export default function ReadReceipt({ isRead, readAt, isOwnMessage }: ReadReceiptProps) {
  // Only show read receipts for own messages
  if (!isOwnMessage) return null;

  const isReadAndSeen = isRead && readAt;

  return (
    <div className="inline-flex items-center ml-2">
      {isReadAndSeen ? (
        // Double green ticks for read/seen
        <CheckCheck className="w-4 h-4 text-green-500 drop-shadow-sm" />
      ) : isRead ? (
        // Double blue ticks for delivered
        <CheckCheck className="w-4 h-4 text-blue-400 drop-shadow-sm" />
      ) : (
        // Single grey tick for sent
        <Check className="w-4 h-4 text-gray-400 drop-shadow-sm" />
      )}
    </div>
  );
}