import { useState, useEffect } from 'react';
import { VideoCameraIcon, MicrophoneIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket, useWebSocketEvent } from '@/lib/websocket';
import { cn, formatDate, generateId } from '@/lib/utils';
import type { Message } from '@/types';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, sendMessage } = useWebSocket();
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  // Handle incoming messages
  useWebSocketEvent<Message>('message', (message) => {
    setMessages((prev) => [...prev, message]);
    setIsLoading(false);
    setError(null);
  });

  // Handle errors
  useWebSocketEvent('error', (error) => {
    setError(error.message);
    setIsLoading(false);
  });

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const newMessage: Message = {
        id: generateId(),
        text: inputValue,
        sender: 'user',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);
      await sendMessage(inputValue);
      setInputValue('');
    } catch (err) {
      setError('Failed to send message. Please try again.');
      setIsLoading(false);
    }
  };

  // Message animations
  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -100 },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div>
            <h2 className="text-lg font-semibold">Annie</h2>
            <div className="flex items-center space-x-2">
              <div className={cn(
                'w-2 h-2 rounded-full transition-colors',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )} />
              <span className="text-sm text-gray-500">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            className={cn(
              'p-2 rounded-full transition-colors',
              isVideoEnabled ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100'
            )}
          >
            <VideoCameraIcon className="w-5 h-5" />
          </button>
          <span className="text-xs text-gray-500">v0.1</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              className={cn(
                'flex',
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[70%] rounded-lg px-4 py-2',
                  message.sender === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                )}
              >
                <p>{message.text}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {formatDate(message.timestamp)}
                </span>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-6 py-2 bg-red-50"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            className={cn(
              'p-2 rounded-full transition-colors',
              'hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            disabled={!isConnected}
          >
            <MicrophoneIcon className="w-5 h-5 text-gray-500" />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className={cn(
              'flex-1 px-4 py-2 border border-gray-300 rounded-full',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-all disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            disabled={!isConnected || isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || !isConnected || isLoading}
            className={cn(
              'p-2 bg-primary-500 text-white rounded-full',
              'hover:bg-primary-600 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        {!isConnected && (
          <p className="text-sm text-red-500 mt-2">
            Disconnected from server. Trying to reconnect...
          </p>
        )}
      </div>
    </div>
  );
} 