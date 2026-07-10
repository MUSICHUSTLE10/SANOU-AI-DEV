import React, { useState } from 'react';
import FileExplorer from './FileExplorer';
import ChatPanel from './ChatPanel';
import { ProjectFile, ChatMessage } from '../types';
import { FileIcon, ChatIcon } from './Icons';

interface LeftPanelProps {
  files: ProjectFile[];
  activeFile: string | null;
  onSelectFile: (path: string) => void;
  chatHistory: ChatMessage[];
  onSendMessage: (message: string, attachment?: ChatMessage['attachment']) => void;
  isModificationLoading: boolean;
}

type Tab = 'files' | 'chat';

const LeftPanel: React.FC<LeftPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<Tab>('files');

  return (
    <div className="bg-bunker-900/50 rounded-lg h-full flex flex-col">
      <div className="flex-shrink-0 border-b border-bunker-800">
        <nav className="flex space-x-2 p-2">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'files'
                ? 'bg-bunker-700 text-white'
                : 'text-bunker-300 hover:bg-bunker-800'
            }`}
          >
            <FileIcon className="w-4 h-4" />
            Fichiers
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'chat'
                ? 'bg-bunker-700 text-white'
                : 'text-bunker-300 hover:bg-bunker-800'
            }`}
          >
            <ChatIcon className="w-4 h-4" />
            Chat
          </button>
        </nav>
      </div>
      <div className="flex-grow overflow-hidden">
        {activeTab === 'files' && (
          <FileExplorer
            files={props.files}
            activeFile={props.activeFile}
            onSelectFile={props.onSelectFile}
          />
        )}
        {activeTab === 'chat' && (
          <ChatPanel
            history={props.chatHistory}
            onSendMessage={props.onSendMessage}
            isLoading={props.isModificationLoading}
          />
        )}
      </div>
    </div>
  );
};

export default LeftPanel;