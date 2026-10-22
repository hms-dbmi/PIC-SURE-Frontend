export interface CodeBlockProps {
  code?: string;
  lang?: 'python' | 'r' | 'bash';
  logAction?: string;
  logMetadata?: Record<string, unknown>;
}
