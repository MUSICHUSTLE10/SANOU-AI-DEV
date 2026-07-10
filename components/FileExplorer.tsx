
import React from 'react';
import { ProjectFile } from '../types';
import { FileIcon } from './Icons';

interface FileExplorerProps {
  files: ProjectFile[];
  activeFile: string | null;
  onSelectFile: (path: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeFile, onSelectFile }) => {
  return (
    <div className="bg-bunker-900/50 rounded-lg overflow-hidden h-full flex flex-col">
      <h2 className="text-lg font-bold p-4 border-b border-bunker-800">Explorateur de Fichiers</h2>
      <div className="flex-grow overflow-y-auto p-2">
        {files.length === 0 ? (
          <div className="text-center text-bunker-400 p-4">Aucun fichier généré.</div>
        ) : (
          <ul>
            {files.map((file) => (
              <li key={file.path}>
                <button
                  onClick={() => onSelectFile(file.path)}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-colors duration-150 ${
                    activeFile === file.path
                      ? 'bg-bunker-700 text-white'
                      : 'hover:bg-bunker-800 text-bunker-300'
                  }`}
                >
                  <FileIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate text-sm">{file.path}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
