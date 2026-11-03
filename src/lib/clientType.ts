// Backend audit logs read this header to tell frontend traffic from direct API calls
export const CLIENT_TYPE_HEADERS = { 'X-Client-Type': 'FRONTEND' } as const;
