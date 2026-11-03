// Backend audit logs read this header to tell frontend traffic from direct API calls; the Python
// and R adapters send PYTHON_ADAPTER and R_ADAPTER.
export const CLIENT_TYPE_HEADERS = { 'X-Client-Type': 'FRONTEND' } as const;
