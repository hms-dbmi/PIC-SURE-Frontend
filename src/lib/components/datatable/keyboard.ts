// Row element ids are built from the free-form table name (user tables embed
// admin-entered connection labels), so restrict it to characters that are safe
// in both HTML ids and CSS selectors. Unsafe characters are escaped rather than
// dropped so two labels differing only in punctuation cannot claim the same ids.
export function tableIdPrefix(tableName: string): string {
  return tableName.replace(/[^A-Za-z0-9-]/g, (char) => `_${char.codePointAt(0)!.toString(16)}_`);
}

export function isFormField(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
  );
}

// Escape stays reserved only for controls with their own Escape semantics
// (text entry, dropdowns); checkboxes and radios have none.
export function isTextEntryField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || ['SELECT', 'TEXTAREA'].includes(target.tagName)) return true;
  return (
    target instanceof HTMLInputElement &&
    !['checkbox', 'radio', 'button', 'submit', 'reset'].includes(target.type)
  );
}
