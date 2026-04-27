'use client';

import { MessageBubble } from './message-bubble';
import { CitationList } from './citation-list';
import type { ChatMessage } from '@/hooks/use-chat';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function ChatMessages({ messages, isStreaming }: ChatMessagesProps) {
  return (
    <>
      {messages.map((msg) => (
        <div key={msg.id}>
          <MessageBubble
            role={msg.role}
            content={msg.content}
            isStreaming={isStreaming && msg.role === 'assistant' && !msg.content}
          />
          {msg.role === 'assistant' &&
            msg.citations &&
            msg.citations.length > 0 &&
            msg.content && <CitationList citations={msg.citations} />}
        </div>
      ))}
    </>
  );
}
