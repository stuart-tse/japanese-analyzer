'use client';

import { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaExpand, FaCompress } from 'react-icons/fa';
import { streamChat, ChatMessage as APIMessage } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  userApiKey?: string;
  currentSentence?: string;
}

export default function AIChat({ userApiKey, currentSentence }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 监听 ESC 键来收缩窗口
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isExpanded]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化欢迎消息
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeContent = currentSentence 
        ? `你好！我是你的日语学习助手。我看到你正在分析这个句子：「${currentSentence}」。你可以问我关于这个句子的语法、词汇，或者任何其他日语相关问题。`
        : '你好！我是你的日语学习助手。你可以问我关于日语语法、词汇、文化等任何问题。';
        
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length, currentSentence]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // 创建临时的助手消息用于流式更新
    const assistantMessageId = (Date.now() + 1).toString();
    const tempAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, tempAssistantMessage]);

    try {
      // 准备API消息格式
      const apiMessages: APIMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // 如果有当前分析的句子，并且这是新的句子上下文，添加句子上下文
      if (currentSentence) {
        // 检查是否已经在消息历史中提到过这个句子
        const hasContextAlready = messages.some(msg => 
          msg.content.includes(currentSentence) || 
          msg.content.includes('我正在分析这个日语句子')
        );
        
        if (!hasContextAlready) {
          // 在用户消息之前插入上下文消息
          const contextMessage: APIMessage = {
            role: 'user',
            content: `请注意：我正在分析这个日语句子：「${currentSentence}」。请在后续回答中结合这个句子的语境来解释相关的日语问题。`
          };
          apiMessages.splice(-1, 0, contextMessage);
        }
      }
      
      // 添加当前用户消息
      apiMessages.push({
        role: 'user',
        content: userMessage.content
      });

      // 使用流式聊天API
      streamChat(
        apiMessages,
        (chunk, isDone) => {
          // 实时更新助手消息内容
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: chunk }
              : msg
          ));
          
          if (isDone) {
            setIsLoading(false);
          }
        },
        (error) => {
          console.error('Chat error:', error);
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: `抱歉，聊天时出现错误：${error.message}` }
              : msg
          ));
          setIsLoading(false);
        },
        userApiKey
      );
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: `抱歉，聊天时出现错误：${error instanceof Error ? error.message : '未知错误'}` }
          : msg
      ));
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // 打开时聚焦输入框
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* 展开时的背景遮罩 */}
      {isOpen && isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      {/* 聊天窗口 */}
      {isOpen && (
        <div className={`fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl flex flex-col transition-all duration-300 ${
          isExpanded 
            ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] z-50' 
            : 'bottom-20 right-4 w-96 h-[500px] z-50'
        }`}>
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">AI 日语助手</h3>
            </div>
            <div className="flex items-center space-x-2">
              {/* 展开/收缩按钮 */}
              <button
                onClick={toggleExpand}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title={isExpanded ? "收缩窗口" : "展开窗口"}
              >
                {isExpanded ? <FaCompress /> : <FaExpand />}
              </button>
              {/* 关闭按钮 */}
              <button
                onClick={toggleChat}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="关闭聊天"
              >
                <FaTimes />
              </button>
            </div>
          </div>


          {/* 消息区域 */}
          <div className={`flex-1 overflow-y-auto space-y-3 ${isExpanded ? 'p-6' : 'p-4'}`}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`${isExpanded ? 'max-w-[70%]' : 'max-w-[80%]'} p-3 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {message.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // 自定义代码块样式
                          code: (props) => {
                            const { className, children } = props;
                            const inline = !className;
                            return !inline ? (
                              <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm overflow-x-auto">
                                <code className={className}>
                                  {children}
                                </code>
                              </pre>
                            ) : (
                              <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">
                                {children}
                              </code>
                            );
                          },
                          // 自定义段落样式
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          // 自定义列表样式
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          // 自定义强调样式
                          strong: ({ children }) => <strong className="font-semibold text-blue-600 dark:text-blue-400">{children}</strong>,
                          em: ({ children }) => <em className="italic text-purple-600 dark:text-purple-400">{children}</em>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                      {/* 显示实时生成指示器 */}
                      {isLoading && message.content && !message.content.endsWith('.') && !message.content.endsWith('。') && (
                        <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" title="正在实时生成..."/>
                      )}
                    </div>
                  )}
                  <div className={`text-xs mt-1 opacity-70 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="loading-spinner w-4 h-4"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">AI正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className={`border-t border-gray-200 dark:border-gray-700 ${isExpanded ? 'p-6' : 'p-4'}`}>
            <div className="flex items-end space-x-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入你的日语问题..."
                className={`flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-all ${
                  isExpanded ? 'max-h-32' : 'max-h-20'
                }`}
                rows={isExpanded ? 3 : 1}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaPaperPlane className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 右下角悬浮按钮 */}
      {(!isOpen || !isExpanded) && (
        <button
          onClick={toggleChat}
          className="fixed bottom-4 right-4 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 flex items-center justify-center"
          title="AI 日语助手"
        >
          <FaComments className="w-6 h-6" />
        </button>
      )}
    </>
  );
}