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
      <div className="relative w-3 h-3">
        {isReadAndSeen ? (
          // Whole square filled green - message seen
          <div className="w-3 h-3 bg-green-500 rounded-sm shadow-sm"></div>
        ) : isRead ? (
          // Left half filled green - message delivered/received
          <div className="w-3 h-3 border border-green-500 rounded-sm relative overflow-hidden shadow-sm">
            <div className="absolute left-0 top-0 w-1.5 h-full bg-green-500"></div>
          </div>
        ) : (
          // Outline only - message sent
          <div className="w-3 h-3 border border-green-500 rounded-sm shadow-sm"></div>
        )}
      </div>
    </div>
  );
}