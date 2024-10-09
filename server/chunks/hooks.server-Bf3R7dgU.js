import { r as registerProviderData } from './AuthProviderRegistry-DQ6xXw8B.js';

const __vite_import_meta_env__ = { "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SSR": true };
const PROVIDER_PREFIX = "VITE_AUTH_PROVIDER_MODULE_";
const enabledProviders = Object.keys(__vite_import_meta_env__).filter((key) => key.startsWith(PROVIDER_PREFIX) && __vite_import_meta_env__[key] === "true").map((key) => key.replace(PROVIDER_PREFIX, "").toUpperCase()).filter((key) => !key.includes("_"));
async function registerEnabledProviders(enabledProviders2, viteProviderPrefix) {
  for (const providerName of enabledProviders2) {
    const uppercaseProviderName = providerName.toUpperCase();
    const providerConfigPrefix = `${viteProviderPrefix}${uppercaseProviderName}_`;
    try {
      const authProviderConfigInterface = {};
      Object.keys(__vite_import_meta_env__).filter((key) => key.startsWith(providerConfigPrefix)).map((key) => {
        const configKey = key.replace(providerConfigPrefix, "")?.toLowerCase();
        const value = __vite_import_meta_env__[key] === "true" ? true : __vite_import_meta_env__[key] === "false" ? false : __vite_import_meta_env__[key];
        authProviderConfigInterface[configKey] = value;
      });
      authProviderConfigInterface.enabled = true;
      authProviderConfigInterface.name = uppercaseProviderName;
      registerProviderData(authProviderConfigInterface);
    } catch (error) {
      console.error(`Error registering auth provider "${uppercaseProviderName}":`, error);
    }
  }
}
registerEnabledProviders(enabledProviders, PROVIDER_PREFIX);
const handleError = async ({ error, event, status, message }) => {
  console.error("Server error: ", error, event, status, message);
  return {
    message: message || "An unknown server error occurred."
  };
};

export { handleError };
//# sourceMappingURL=hooks.server-Bf3R7dgU.js.map
