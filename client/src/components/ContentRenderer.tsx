import React from 'react';

interface ContentRendererProps {
  content: string;
  className?: string;
}

export default function ContentRenderer({ content, className = "" }: ContentRendererProps) {
  const renderContent = (text: string) => {
    const parts = [];
    let lastIndex = 0;
    
    // Combined regex to match hashtags and mentions
    const regex = /(#\w+|@\w+)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      const matchedText = match[0];
      const isHashtag = matchedText.startsWith('#');
      const isMention = matchedText.startsWith('@');
      
      if (isHashtag) {
        parts.push(
          <span
            key={match.index}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
            onClick={() => {
              // TODO: Implement hashtag search
              console.log('Search hashtag:', matchedText);
            }}
          >
            {matchedText}
          </span>
        );
      } else if (isMention) {
        parts.push(
          <span
            key={match.index}
            className="text-purple-600 dark:text-purple-400 font-medium hover:underline cursor-pointer"
            onClick={() => {
              // TODO: Implement user profile view or mention search
              console.log('View user:', matchedText);
            }}
          >
            {matchedText}
          </span>
        );
      }
      
      lastIndex = regex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts;
  };

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {renderContent(content)}
    </div>
  );
}