"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { saveChat } from "../services/mentorService";
import { UserProfile } from "../lib/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatWithMentorProps {
  userProfile: UserProfile;
}

const createIntroMessage = (profile: UserProfile): Message => {
  const hobbyText = profile.hobbies?.length
    ? `On the side you enjoy ${profile.hobbies.join(", ")}`
    : "You mentioned you're ready to spin up a side project";
  return {
    id: "intro",
    role: "assistant",
    content: `Hi! I see you're a ${profile.jobStatus.toLowerCase()} aiming to ${profile.learningGoal}. You're learning for "${profile.reason}", love ${profile.captivates.toLowerCase()}, and rated yourself as ${profile.codingExperience}. ${hobbyText}, so feel free to bring that into our chats. How can I help right now?`,
    timestamp: new Date(),
  };
};

const ChatWithMentor: React.FC<ChatWithMentorProps> = ({ userProfile }) => {
  const [messages, setMessages] = useState<Message[]>([createIntroMessage(userProfile)]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([createIntroMessage(userProfile)]);
  }, [userProfile]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const sanitizedHistory = [...messages, userMessage].map(({ role, content }) => ({
        role,
        content,
      }));

      const assistantReply = await saveChat({
        message: inputValue,
        userProfile,
        conversationHistory: sanitizedHistory,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantReply || "Przykładowa odpowiedź mentora.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Fallback response when backend is not working
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I understand your question. As your mentor, I can help you with programming and track your progress. In the future I'll be able to better answer your questions!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="w-full max-w-5xl h-full flex flex-col animate-fade-in">
        {/* Header */}
        <div className="mb-4 pt-2">
          <h1 className="text-3xl font-bold text-white mb-1">
            Mentor Chat
          </h1>
        </div>

        {/* Chat Messages Container */}
        <div className="flex-1 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/60 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="shrink-0 w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                AI
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-gradient-to-br from-cyan-600 to-cyan-700 text-white shadow-lg"
                  : "bg-gray-800/85 backdrop-blur-sm text-gray-100 border border-gray-700/50"
              }`}
            >
              <div className="flex-1">
                  <div className="text-sm prose prose-invert prose-sm max-w-none leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children, className }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-black/40 px-1.5 py-0.5 rounded text-cyan-300 font-mono">
                              {children}
                            </code>
                          ) : (
                            <code className="block bg-black/40 p-2.5 rounded text-cyan-300 font-mono overflow-x-auto my-2 text-xs leading-relaxed">
                              {children}
                            </code>
                          );
                        },
                        ul: ({ children }) => <ul className="list-disc list-outside ml-4 space-y-0.5 my-1.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-outside ml-4 space-y-0.5 my-1.5">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        h1: ({ children }) => <h1 className="text-base font-semibold mb-1.5 text-white">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-semibold mb-1 text-white">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-white">{children}</h3>,
                        a: ({ children, href }) => (
                          <a href={href} className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-400/50" target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-cyan-500/50 pl-2.5 italic my-1.5">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                <p className="text-[10px] mt-2 opacity-50">
                  {message.timestamp.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            {message.role === "user" && (
              <div className="shrink-0 w-9 h-9 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                U
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="shrink-0 w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
              AI
            </div>
            <div className="bg-gray-800/85 backdrop-blur-sm rounded-2xl px-4 py-3 border border-gray-700/50">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800/50 bg-gray-900/40 backdrop-blur-sm p-4">
        <div className="flex gap-3 items-end">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask your mentor anything..."
            className="flex-1 bg-gray-800/60 text-white rounded-xl px-4 pt-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 border border-gray-700/50 resize-none placeholder:text-gray-500 transition-all"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="h-[60px] bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-medium px-5 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-cyan-500/20 disabled:shadow-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-2 ml-1">
          Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 font-mono">Enter</kbd> to send · <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 font-mono">Shift+Enter</kbd> for new line
        </p>
      </div>
      </div>
      </div>
    </div>
  );
};

export default ChatWithMentor;
