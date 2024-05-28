import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';

interface RasData extends AuthData {
  uri?: string;
  clientid?: string;
}

class RAS extends AuthProvider implements RasData {
  uri?: string;
  clientid?: string;

  constructor(data: RasData) {
    super(data);
    this.uri = data.uri;
    this.clientid = data.clientid;
  }

  login = async (redirectTo: string): Promise<void> => {
    throw new Error('Method not implemented.');
  };
  logout = (): Promise<void> => {
    throw new Error('Method not implemented.');
  };
}

export default RAS;
export type { RasData as AuthType };
