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
    <div className="inline-flex items-center ml-1">
      {isReadAndSeen ? (
        // Double green ticks for read/seen
        <div className="relative">
          <CheckCheck className="w-3 h-3 text-green-500" />
        </div>
      ) : (
        // Double grey ticks for delivered (sent to recipient)
        <div className="relative">
          <CheckCheck className="w-3 h-3 text-gray-400" />
        </div>
      )}
    </div>
  );
}