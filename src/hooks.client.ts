import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = async ({ error, event, status, message }) => {
  console.log('Error:', error, event, status, message);
  return {
    message: message || 'An unknown error occurred.',
  };
};
