export interface CodeBlockProps {
  code?: string;
  copyCode?: string;
  /** Text inside code to hide from screen readers wherever it appears. */
  hiddenText?: string;
  /** Action name logged when the copy button copies, with no metadata. */
  logAction?: string;
  lang?: 'python' | 'r' | 'bash' | 'json' | 'powershell' | 'cmd';
}
