import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';

interface FenceData extends AuthData {
  uri: string;
  clientid: string;
}

class Fence extends AuthProvider implements FenceData {
  uri: string;
  clientid: string;

  constructor(data: FenceData) {
    super(data);
    this.uri = data.uri;
    this.clientid = data.clientid;
  }

  login = async (redirectTo: string): Promise<void> => {
    throw new Error('Method not implemented.');
  };
  logout = async (): Promise<void> => {
    throw new Error('Method not implemented.');
  };
}

export default Fence;
export type { FenceData as AuthType };
