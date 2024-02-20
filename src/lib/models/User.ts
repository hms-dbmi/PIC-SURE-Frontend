export interface User {
  uuid?: string;
  email?: string;
  privileges?: string[];
  roles?: string[];
  token?: string;
  acceptedTOS?: boolean;
}
