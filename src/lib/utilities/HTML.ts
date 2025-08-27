import DOMPurify from 'dompurify';

const config = {
  ADD_ATTR: ['target', 'title'],
};

export const initSanitizeConfig = () => DOMPurify.setConfig(config);
export const sanitizeHTML = DOMPurify.sanitize;
