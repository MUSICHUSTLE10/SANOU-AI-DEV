import React, { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { ProjectFile, ChatMessage } from './types';
import LeftPanel from './components/LeftPanel';
import CodeEditor from './components/CodeEditor';
import Preview from './components/Preview';
import { generateCodeFromPrompt, modifyCodeFromPrompt } from './services/geminiService';
import { DownloadIcon, MagicWandIcon, BrainCircuitIcon } from './components/Icons';

type AppState = 'idle' | 'generating' | 'modifying' | 'success' | 'error';

const languageMapping: { [key: string]: string } = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
  py: 'python',
  java: 'java',
  cpp: 'cpp',
  go: 'go',
  rs: 'rust',
  php: 'php',
  sql: 'sql',
};

const getLanguageFromPath = (path: string): string => {
  const extension = path.split('.').pop()?.toLowerCase() || '';
  return languageMapping[extension] || 'plaintext';
};


const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [status, setStatus] = useState<AppState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleFileContentChange = useCallback((path: string, newContent: string) => {
    setFiles(currentFiles => 
        currentFiles.map(file => 
            file.path === path ? { ...file, content: newContent } : file
        )
    );
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Le prompt ne peut pas être vide.");
      setStatus('error');
      return;
    }
    setStatus('generating');
    setError(null);
    setFiles([]);
    setChatHistory([]);

    try {
      const result = await generateCodeFromPrompt(prompt);
      setFiles(result.files);
      if (result.files.length > 0) {
        const preferredFiles = ['index.html', 'README.md'];
        let foundFile = null;
        for (const preferred of preferredFiles) {
            const file = result.files.find(f => f.path.toLowerCase().endsWith(preferred));
            if(file) {
                foundFile = file.path;
                break;
            }
        }
        setActiveFile(foundFile || result.files[0].path);
      } else {
        setActiveFile(null);
      }
      setChatHistory([{ role: 'model', message: 'Votre projet a été généré ! Vous pouvez maintenant me demander des modifications via le chat.' }]);
      setStatus('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur inconnue est survenue.";
      setError(errorMessage);
      setStatus('error');
    }
  };

  const handleModificationRequest = async (message: string, attachment?: ChatMessage['attachment']) => {
    setStatus('modifying');
    setError(null);
    setChatHistory(prev => [...prev, { role: 'user', message, attachment }]);

    try {
        const result = await modifyCodeFromPrompt(message, files, attachment);
        setFiles(result.files);
        
        // Preserve active file if it still exists, otherwise pick a default
        const activeFileExists = result.files.some(f => f.path === activeFile);
        if (!activeFileExists) {
            setActiveFile(result.files.find(f => f.path.endsWith('index.html'))?.path || result.files[0]?.path || null);
        }

        setChatHistory(prev => [...prev, { role: 'model', message: "J'ai mis à jour le projet selon votre demande. Quels autres changements souhaitez-vous ?" }]);
        setStatus('success');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Une erreur inconnue est survenue.";
        setError(errorMessage);
        setChatHistory(prev => [...prev, { role: 'model', message: `Désolé, une erreur est survenue : ${errorMessage}` }]);
        setStatus('error');
    }
  };


  const handleDownloadZip = useCallback(async () => {
    if (files.length === 0) return;
    const zip = new JSZip();
    files.forEach((file) => {
      zip.file(file.path, file.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'projet-ia-genere.zip');
  }, [files]);
  
  const activeFileContent = files.find(f => f.path === activeFile)?.content || '';
  const activeFileLanguage = activeFile ? getLanguageFromPath(activeFile) : 'plaintext';
  const isLoading = status === 'generating' || status === 'modifying';

  useEffect(() => {
    if (status === 'error' && error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [status, error]);

  const WelcomeScreen: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-bunker-400 p-8">
        <BrainCircuitIcon className="w-24 h-24 mb-6 text-bunker-500" />
        <h1 className="text-4xl font-bold text-white mb-2">Sanou AI Développeur Universel</h1>
        <p className="max-w-2xl">
            Décrivez l'application ou le script que vous souhaitez créer. L'IA générera la structure des fichiers, le code et même un fichier README.
            Pour les projets web, un aperçu en direct sera disponible.
        </p>
         <div className="mt-6 text-xs text-bunker-500">
            Propulsé par Sanou AI
        </div>
    </div>
  );

   const LoadingScreen: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-bunker-400 p-8">
      <svg className="animate-spin h-16 w-16 text-sky-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <h2 className="text-2xl font-semibold text-white">Génération en cours...</h2>
      <p className="mt-2">L'IA réfléchit à votre projet. Veuillez patienter.</p>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-bunker-950 flex flex-col p-4 gap-4">
      {error && status !== 'error' && (
        <div className="absolute top-5 right-5 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            <p className="font-bold">Erreur</p>
            <p>{error}</p>
        </div>
      )}
      <header className="flex-shrink-0 bg-bunker-900/50 p-4 rounded-lg shadow-md flex items-center gap-4">
        <div className="flex items-center gap-2">
            <BrainCircuitIcon className="h-8 w-8 text-sky-400"/>
            <h1 className="text-xl font-bold text-white hidden sm:block">Sanou AI Développeur Universel</h1>
        </div>
        <div className="flex-grow flex items-center gap-2 bg-bunker-950 rounded-lg px-3">
            <MagicWandIcon className="h-5 w-5 text-bunker-500" />
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="Décrivez votre projet... ex: 'une calculatrice en React avec TypeScript'"
                className="w-full bg-transparent p-3 text-bunker-200 placeholder-bunker-500 focus:outline-none"
                disabled={isLoading}
            />
        </div>
        <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-500 transition-colors disabled:bg-bunker-700 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {status === 'generating' ? 'Génération...' : 'Générer'}
        </button>
        {files.length > 0 && (
             <button
                onClick={handleDownloadZip}
                className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
            >
                <DownloadIcon className="h-5 w-5"/>
                <span className="hidden md:inline">Télécharger (.zip)</span>
            </button>
        )}
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-10 gap-4 overflow-hidden">
        {status === 'idle' && <div className="lg:col-span-10"><WelcomeScreen/></div>}
        {status === 'generating' && <div className="lg:col-span-10"><LoadingScreen/></div>}
        {(status === 'success' || status === 'modifying' || (status === 'error' && files.length > 0)) && (
            <>
                <div className="lg:col-span-2">
                    <LeftPanel 
                        files={files}
                        activeFile={activeFile}
                        onSelectFile={setActiveFile}
                        chatHistory={chatHistory}
                        onSendMessage={handleModificationRequest}
                        isModificationLoading={status === 'modifying'}
                    />
                </div>
                <div className="lg:col-span-5">
                    <CodeEditor
                        content={activeFileContent}
                        language={activeFileLanguage}
                        onContentChange={(newContent) => {
                            if (activeFile) {
                                handleFileContentChange(activeFile, newContent);
                            }
                        }}
                    />
                </div>
                <div className="lg:col-span-3">
                    <Preview files={files} />
                </div>
            </>
        )}
        {status === 'error' && files.length === 0 && (
            <div className="lg:col-span-10"><WelcomeScreen/></div>
        )}
      </main>
    </div>
  );
};

export default App;