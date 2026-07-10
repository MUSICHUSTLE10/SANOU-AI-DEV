import React, { useState, useEffect } from 'react';
import { ProjectFile } from '../types';

interface PreviewProps {
  files: ProjectFile[];
}

// A simple path resolver
const resolvePath = (base: string, relative: string): string => {
  const stack = base.split('/');
  stack.pop(); // Remove filename from base path
  
  if (relative.startsWith('/')) {
    return relative.substring(1);
  }

  const parts = relative.split('/');
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      if (stack.length > 0) {
        stack.pop();
      }
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
};


const Preview: React.FC<PreviewProps> = ({ files }) => {
  const [srcDoc, setSrcDoc] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processFiles = () => {
      setError(null);
      const htmlFile = files.find(f => f.path.endsWith('index.html') || f.path.endsWith('index.htm'));
      if (!htmlFile) {
        setSrcDoc('<div style="color: #999; font-family: sans-serif; padding: 20px;">Aperçu non disponible. Aucun fichier index.html trouvé.</div>');
        return;
      }

      const basePath = htmlFile.path;
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlFile.content, 'text/html');

      // Handle CSS via <link> tags
      const links = doc.querySelectorAll('link[rel="stylesheet"]');
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http')) {
          const path = resolvePath(basePath, href);
          const cssFile = files.find(f => f.path === path);
          if (cssFile) {
            const style = doc.createElement('style');
            style.textContent = cssFile.content;
            link.replaceWith(style);
          } else {
            console.warn(`[Aperçu] Fichier CSS non trouvé : ${path}`);
          }
        }
      });

      // Handle JS via <script> tags with src
      const scripts = doc.querySelectorAll<HTMLScriptElement>('script[src]');
      scripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src && !src.startsWith('http')) {
          const path = resolvePath(basePath, src);
          const jsFile = files.find(f => f.path === path);
          if (jsFile) {
            const newScript = doc.createElement('script');
            if (script.type === 'module') {
              newScript.type = 'module';
            }
            newScript.textContent = jsFile.content;
            script.replaceWith(newScript);
          } else {
             console.warn(`[Aperçu] Fichier JS non trouvé : ${path}`);
          }
        }
      });

      const finalHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      setSrcDoc(finalHtml);
    };

    if (files.length > 0) {
      try {
        processFiles();
      } catch (e) {
        console.error("Erreur lors de la construction de l'aperçu:", e);
        setError("Une erreur est survenue lors de la construction de l'aperçu.");
      }
    } else {
      setSrcDoc('');
      setError(null);
    }
  }, [files]);

  return (
    <div className="bg-bunker-900/50 rounded-lg overflow-hidden h-full flex flex-col">
       <h2 className="text-lg font-bold p-4 border-b border-bunker-800">Aperçu en Direct</h2>
       {error && <div className="p-4 bg-yellow-900/50 text-yellow-200 text-sm">{error}</div>}
      <iframe
        srcDoc={srcDoc}
        title="Aperçu en direct"
        sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
        className="w-full h-full bg-white"
      />
    </div>
  );
};

export default Preview;
