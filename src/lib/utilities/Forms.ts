export const textInput = '[\\w\\d\\s\\-_\\[\\]\\(\\)\\/\\\\\\,\\.]+';
export const uuidInput = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
export const snp = '\\w+, ?\\d+, ?(A|T|C|G)+, ?(A|T|C|G)+';

export function debounce(func: () => void, timeout: number = 1000) {
  let timer: NodeJS.Timeout;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(func, timeout);
  };
}
