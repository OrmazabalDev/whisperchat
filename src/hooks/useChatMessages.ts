import { useChatContext } from '../contexts/ChatContext';

export function useChatMessages() {
  const { messages, loading, error, sendMessage, addReaction } = useChatContext();

  return {
    messages,
    loading,
    error,
    sendMessage,
    addReaction
  };
}
