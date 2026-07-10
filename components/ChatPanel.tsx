import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { SendIcon, BrainCircuitIcon, PaperclipIcon, CloseIcon } from './Icons';

interface ChatPanelProps {
  history: ChatMessage[];
  onSendMessage: (message: string, attachment?: ChatMessage['attachment']) => void;
  isLoading: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ history, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<ChatMessage['attachment'] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachment) && !isLoading) {
      onSendMessage(input.trim(), attachment);
      setInput('');
      setAttachment(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          dataUrl: reader.result as string,
          name: file.name,
          type: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
    // Reset file input value to allow selecting the same file again
    e.target.value = '';
  };
  
  const triggerFileSelect = () => {
      fileInputRef.current?.click();
  }

  return (
    <div className="bg-bunker-900/50 rounded-lg h-full flex flex-col">
      <h2 className="text-lg font-bold p-4 border-b border-bunker-800">Chat de Modification</h2>
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {history.map((item, index) => (
          <div key={index} className={`flex items-start gap-3 ${item.role === 'user' ? 'justify-end' : ''}`}>
            {item.role === 'model' && <BrainCircuitIcon className="w-6 h-6 text-sky-400 flex-shrink-0 mt-1" />}
            <div className={`rounded-lg px-4 py-2 max-w-sm md:max-w-md ${item.role === 'user' ? 'bg-sky-600 text-white' : 'bg-bunker-800 text-bunker-200'}`}>
               {item.attachment && (
                <div className="mb-2">
                  {item.attachment.type.startsWith('image/') ? (
                    <img src={item.attachment.dataUrl} alt={item.attachment.name} className="rounded-lg max-h-48" />
                  ) : (
                    <video src={item.attachment.dataUrl} controls className="rounded-lg max-h-48" />
                  )}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{item.message}</p>
            </div>
          </div>
        ))}
         {isLoading && history.length > 0 && history[history.length-1].role === 'user' &&(
          <div className="flex items-start gap-3">
            <BrainCircuitIcon className="w-6 h-6 text-sky-400 flex-shrink-0 animate-pulse mt-1" />
            <div className="rounded-lg px-4 py-2 bg-bunker-800 text-bunker-400">
              <p className="text-sm italic">L'IA est en train de modifier le code...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-bunker-800">
        {attachment && (
            <div className="mb-2 p-2 bg-bunker-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                    {attachment.type.startsWith('image/') ? (
                        <img src={attachment.dataUrl} alt={attachment.name} className="w-10 h-10 rounded object-cover" />
                    ) : (
                        <video src={attachment.dataUrl} className="w-10 h-10 rounded object-cover" />
                    )}
                    <span className="text-sm text-bunker-300 truncate">{attachment.name}</span>
                </div>
                <button type="button" onClick={() => setAttachment(null)} className="p-1 text-bunker-400 hover:text-white">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
        )}
        <div className="flex items-center gap-2 bg-bunker-950 rounded-lg px-3">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" className="hidden" />
          <button type="button" onClick={triggerFileSelect} disabled={isLoading} className="p-2 text-bunker-400 disabled:text-bunker-600 disabled:cursor-not-allowed hover:text-sky-300">
            <PaperclipIcon className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "En attente de la réponse de l'IA..." : "Demander une modification..."}
            className="w-full bg-transparent p-3 text-bunker-200 placeholder-bunker-500 focus:outline-none"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || (!input.trim() && !attachment)} className="p-2 text-sky-400 disabled:text-bunker-600 disabled:cursor-not-allowed hover:text-sky-300">
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;