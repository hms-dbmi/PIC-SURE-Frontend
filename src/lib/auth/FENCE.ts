import type { AuthData } from "$lib/models/AuthProvider";

export interface FenceData extends AuthData {
  uri?: string;
  clientid?: string;
}

export default class Fence implements FenceData {
  
  name?: string | undefined;
  description?: string | undefined = "Log in with eRA Commons";
  icon?: string | undefined;
  enabled: boolean = false;
  loginurl?: string | undefined;
  logouturl?: string | undefined;
  callbackurl?: string | undefined;

  getConfig = (): FenceData => {
    return {
      name: this.name,
      description: this.description,
      icon: this.icon,
      enabled: this.enabled,
      loginurl: this.loginurl,
      logouturl: this.logouturl,
      callbackurl: this.callbackurl,
    };
  }

  login(redirectTo: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  logout(): Promise<void> {
    throw new Error("Method not implemented.");
  }

}