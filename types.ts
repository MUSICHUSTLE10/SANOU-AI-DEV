export interface ProjectFile {
  path: string;
  content: string;
}

export interface GenerationResult {
  files: ProjectFile[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  message: string;
  attachment?: {
    dataUrl: string; // data:image/png;base64,iVBORw0KGgo...
    name: string;
    type: string; // MIME type
  }
}