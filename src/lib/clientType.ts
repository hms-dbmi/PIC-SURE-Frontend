// The backend audit log records this header as the event's caller, the same way the Python and R
// adapters identify themselves, so a request without it reads as a direct API call.
export const CLIENT_TYPE_HEADERS = { 'X-Client-Type': 'FRONTEND' } as const;
