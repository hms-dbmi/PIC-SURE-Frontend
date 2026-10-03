export interface CodeBlockProps {
  code?: string;
  copyCode?: string;
  /** Text inside code to hide from screen readers wherever it appears. */
  hiddenText?: string;
  lang?: 'python' | 'r' | 'bash' | 'json' | 'powershell' | 'cmd';
}
