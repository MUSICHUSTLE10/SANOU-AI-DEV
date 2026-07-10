import { GoogleGenAI, Type, Part } from "@google/genai";
import { GenerationResult, ProjectFile, ChatMessage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("La variable d'environnement API_KEY n'est pas définie.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileSchema = {
  type: Type.OBJECT,
  description: "Un unique objet fichier.",
  properties: {
    path: {
      type: Type.STRING,
      description: "Le chemin complet du fichier, incluant les répertoires. Ex: 'src/components/Button.tsx'.",
    },
    content: {
      type: Type.STRING,
      description: "Le code source complet ou le contenu du fichier.",
    },
  },
  required: ["path", "content"],
};

const generationSchema = {
    type: Type.OBJECT,
    properties: {
      files: {
        type: Type.ARRAY,
        description: "Un tableau d'objets fichier qui constituent le projet.",
        items: fileSchema,
      },
    },
    required: ["files"],
};

const callGeminiAPI = async (contents: string | Part[], systemInstruction: string): Promise<GenerationResult> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: generationSchema,
            },
        });

        const text = response.text.trim();
        const result = JSON.parse(text) as GenerationResult;

        if (!result || !Array.isArray(result.files)) {
          throw new Error("La réponse de l'API est malformée ou ne contient pas de fichiers.");
        }
        
        return result;

    } catch (error) {
        console.error("Erreur lors de l'appel à l'API Gemini:", error);
        const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
        throw new Error(`Échec de la communication avec l'API Gemini: ${errorMessage}`);
  }
}

export const generateCodeFromPrompt = async (prompt: string): Promise<GenerationResult> => {
    const systemInstruction = `
        Vous êtes un développeur IA expert et un architecte logiciel. Votre rôle est de générer des projets de code complets, structurés et complexes à partir d'une simple instruction en langage naturel.
        RÈGLES STRICTES :
        1.  **Analyse Approfondie** : Analysez la demande de l'utilisateur pour identifier le framework, les langages et les bibliothèques nécessaires.
        2.  **Structure de Fichiers Robuste** : Générez une structure de répertoires et de fichiers qui suit les meilleures pratiques.
        3.  **Point d'Entrée Obligatoire** : TOUS les projets web DOIVENT avoir un fichier \`index.html\`.
        4.  **Dépendances Explicites** : Incluez des fichiers de dépendances (\`package.json\`, \`requirements.txt\`, etc.).
        5.  **Liens Relatifs** : Dans \`index.html\`, tous les liens vers des fichiers CSS/JS doivent utiliser des chemins relatifs qui correspondent EXACTEMENT aux chemins des fichiers générés.
        6.  **Code Complet et Fonctionnel** : Le code généré doit être complet. Pas de placeholders.
        7.  **Documentation Essentielle** : TOUJOURS inclure un fichier \`README.md\` détaillé.
        8.  **Format de Sortie** : Votre réponse DOIT être un unique objet JSON valide qui correspond au schéma fourni.
    `;
    return callGeminiAPI(prompt, systemInstruction);
};

export const modifyCodeFromPrompt = async (prompt: string, existingFiles: ProjectFile[], attachment?: ChatMessage['attachment']): Promise<GenerationResult> => {
    const systemInstruction = `
        Vous êtes un développeur IA expert. L'utilisateur vous a fourni un ensemble de fichiers de projet existants, une demande de modification, et potentiellement une image ou une vidéo en pièce jointe.
        Votre tâche est d'appliquer les changements demandés et de retourner l'ensemble COMPLET et MIS À JOUR de tous les fichiers du projet.

        RÈGLES STRICTES :
        1.  **Analyser la Demande et le Contexte** : Comprenez la demande de l'utilisateur, l'image/vidéo si fournie, et le code existant.
        2.  **Appliquer les Modifications** : Modifiez les fichiers existants, ajoutez-en de nouveaux ou supprimez ceux qui ne sont plus nécessaires. Si une image est fournie (ex: une maquette), utilisez-la comme référence visuelle principale.
        3.  **RETOURNER LE PROJET COMPLET** : Votre réponse DOIT contenir TOUS les fichiers du projet, y compris ceux que vous n'avez pas modifiés.
        4.  **Maintenir la Cohérence** : Assurez-vous que le projet reste cohérent et fonctionnel.
        5.  **Format de Sortie** : Votre réponse DOIT être un unique objet JSON valide qui correspond au schéma fourni.
    `;

    const filesString = existingFiles.map(f => `--- CHEMIN: ${f.path} ---\n${f.content}`).join('\n\n');
    const textPrompt = `
        Voici la demande de modification de l'utilisateur : "${prompt}"
        Voici les fichiers actuels du projet. Appliquez la modification demandée et retournez la structure de fichiers complète.
        ${filesString}
    `;

    const contentParts: Part[] = [{ text: textPrompt }];

    if (attachment) {
      const base64Data = attachment.dataUrl.split(',')[1];
      contentParts.push({
        inlineData: {
          mimeType: attachment.type,
          data: base64Data,
        }
      });
    }

    return callGeminiAPI(contentParts, systemInstruction);
};