export interface CodeBlockProps {
  code?: string;
  lang?: 'python' | 'r' | 'bash';
  /** Runs after a successful copy. */
  oncopy?: () => void;
}
