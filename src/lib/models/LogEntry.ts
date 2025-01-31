import type { UUID } from 'crypto';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface LogEntry {
  event_id: UUID;
  action: string;
  action_metadata?: Record<string, any>;
  timestamp?: string;
  user?: UserInfo;
  environment?: EnvInfo;
  ip_address?: string;
  other_metadata?: Record<string, any>;
  error_details?: ErrorDetails;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface UserInfo {
  uuid?: UUID;
  email?: string;
  user_id?: string;
  logged_in: boolean;
  type?: string;
  session_id?: UUID;
}

export interface ErrorDetails {
  status_code: number;
  message: string;
}

export interface EnvInfo {
  domain: string; // Ex: .example.com
  platform: string; // Ex: BDC, GIC, demo, etc.
  env: string; // Ex: Production, Dev, Staging, etc.
  source: string; // Ex: Web, Mobile, API, etc.
  user_agent?: string;
}
