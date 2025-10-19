'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Paperclip, X, FileText } from 'lucide-react';
import { ChatMessage, wsClient } from '@/lib/api-adapter';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your travel planning assistant. Tell me about your trip - where do you want to go, what's your budget, and any preferences?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Add a message showing the uploaded files
    const fileNames = newFiles.map((f) => f.name).join(', ');
    const fileMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: `📎 Uploaded: ${fileNames}`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, fileMessage]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSend = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;

    let content = input;
    if (uploadedFiles.length > 0) {
      const fileList = uploadedFiles.map((f) => f.name).join(', ');
      content = input ? `${input}\n📎 Attached: ${fileList}` : `📎 Attached: ${fileList}`;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setUploadedFiles([]);
    setIsLoading(true);

    // Check if this is an itinerary request and trigger fast polling
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('itinerary') || lowerContent.includes('plan') || lowerContent.includes('trip')) {
      console.log('Itinerary request detected, triggering fast polling');
      // Dispatch custom event to notify DetailsPane to start fast polling
      window.dispatchEvent(new CustomEvent('itinerary-request', { detail: { timestamp: Date.now() } }));
    }

    try {
      const response = await wsClient.sendMessage(content);
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b-2 border-border">
        <h3 className="font-semibold text-lg text-primary">Trip Assistant</h3>
        <p className="text-xs text-muted-foreground">Chat to plan your itinerary</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 shadow-lg transition-all hover:shadow-xl ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground border-2 border-primary shadow-primary/30'
                  : 'bg-card border-2 border-border'
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card rounded-lg px-4 py-3 border border-border">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        {/* Auto-scroll target */}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t-2 border-border bg-card">
        {/* Uploaded Files Preview */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 pt-3 pb-2">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 bg-secondary border-2 border-border rounded-lg px-3 py-1.5 shadow-md"
                >
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-foreground max-w-[120px] truncate">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="ml-1 hover:bg-destructive/20 rounded p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              size="icon"
              variant="outline"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <Button 
              onClick={handleSend} 
              disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)} 
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

