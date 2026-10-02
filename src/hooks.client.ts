import type { HandleClientError } from '@sveltejs/kit/hooks';

export const handleError: HandleClientError = ({ kind, error, event }) => {
  console.log('Error:', kind, error, event);
};
