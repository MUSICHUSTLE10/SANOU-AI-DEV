import React from 'react';
import Editor, { OnChange } from '@monaco-editor/react';

interface CodeEditorProps {
  content: string;
  language: string;
  onContentChange: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ content, language, onContentChange }) => {
    
    const handleEditorChange: OnChange = (value) => {
        if (value !== undefined) {
            onContentChange(value);
        }
    };

  return (
    <div className="bg-bunker-900/50 rounded-lg overflow-hidden h-full flex flex-col">
       <h2 className="text-lg font-bold p-4 border-b border-bunker-800">Éditeur de Code</h2>
      <div className="flex-grow">
          <Editor
            height="100%"
            language={language}
            value={content}
            theme="vs-dark"
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: false,
            }}
          />
      </div>
    </div>
  );
};

export default CodeEditor;