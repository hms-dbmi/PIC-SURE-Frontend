import type { HandleClientError } from '@sveltejs/kit';
import { getConfigs } from '$lib/configuration.svelte';

export const init = () => getConfigs();

export const handleError: HandleClientError = async ({ error, event, status, message }) => {
  console.log('Error:', error, event, status, message);
  return {
    message: message || 'An unknown error occurred.',
  };
};
