'use client';

import { useState, useRef, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';

export default function ChatPage() {
  const [username, setUsername] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isConnected,
    messages,
    users,
    typingUsers,
    joinChat,
    sendMessage,
    setTyping,
  } = useSocket();

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      joinChat(username);
      setHasJoined(true);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage('');
      setTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    setTyping(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing to false after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  };

  const activeTypers = Object.entries(typingUsers)
    .filter(([, isTyping]) => isTyping)
    .map(([name]) => name);

  // Join screen
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Socket.IO Chat</h1>
            <p className="text-purple-200">Real-time messaging demo</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                  }`}
              />
              <span className="text-white/70 text-sm">
                {isConnected ? 'Connected to server' : 'Connecting...'}
              </span>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!isConnected || !username.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Chat screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex">
      {/* Users sidebar */}
      <div className="w-64 bg-black/20 backdrop-blur-lg border-r border-white/10 p-4">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span className="text-purple-400">👥</span>
          Online Users ({users.length})
        </h2>
        <ul className="space-y-2">
          {users.map((user, index) => (
            <li
              key={index}
              className="flex items-center gap-2 text-white/80 text-sm"
            >
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              {user}
              {user === username && (
                <span className="text-xs text-purple-300">(you)</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 p-4">
          <h1 className="text-2xl font-bold text-white">💬 Chat Room</h1>
          <p className="text-purple-200 text-sm">
            Connected as <span className="font-semibold">{username}</span>
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-white/50 mt-20">
              <p className="text-6xl mb-4">💬</p>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.username === username ? 'items-end' : 'items-start'
                  }`}
              >
                <div
                  className={`max-w-md px-4 py-3 rounded-2xl ${message.username === username
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white/10 backdrop-blur-lg text-white border border-white/20'
                    }`}
                >
                  <p className="text-xs opacity-70 mb-1">{message.username}</p>
                  <p>{message.text}</p>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {activeTypers.length > 0 && (
          <div className="px-4 py-2 text-white/50 text-sm">
            <span className="inline-flex items-center gap-1">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
              </span>
              {activeTypers.join(', ')} {activeTypers.length === 1 ? 'is' : 'are'}{' '}
              typing...
            </span>
          </div>
        )}

        {/* Message input */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-black/20 backdrop-blur-lg border-t border-white/10"
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Send 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
