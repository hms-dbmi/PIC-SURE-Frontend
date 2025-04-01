import { r as registerProviderData } from './AuthProviderRegistry-DQ6xXw8B.js';

const __vite_import_meta_env__ = { "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SSR": true, "VITE_ALLOW_DOWNLOAD": "true", "VITE_ALLOW_EXPORT": "true", "VITE_ALLOW_EXPORT_ENABLED": "null", "VITE_API": "true", "VITE_AUTH0_TENANT": "avillachlab", "VITE_AUTH_PROVIDER_MODULE_GOOGLE": "true", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_CLIENTID": "dFvo72bRvFWuUIgaR1hLKjz4I0o8fDcK", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_CONNECTION": "google-oauth2", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_DESCRIPTION": "Login", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_TYPE": "AUTH0", "VITE_DASHBOARD": "true", "VITE_DATA_REQUESTS": "false", "VITE_DISCOVER": "false", "VITE_DIST_EXPLORER": "true", "VITE_DOWNLOAD_AS_CSV": "true", "VITE_DOWNLOAD_AS_PFB": "true", "VITE_ENABLE_GENE_QUERY": "true", "VITE_ENABLE_SNP_QUERY": "true", "VITE_ENABLE_TOS": "false", "VITE_EXPLORER_MAX_COUNT": "10000", "VITE_GOOGLE_ANALYTICS_ID": "", "VITE_GOOGLE_TAG_MANAGER_ID": "", "VITE_LOGO": "", "VITE_OPEN": "false", "VITE_ORIGIN": "", "VITE_PROJECT_HOSTNAME": "", "VITE_REQUIRE_CONSENTS": "false", "VITE_RESOURCE_BASE_QUERY": "", "VITE_RESOURCE_HPDS": "1ba180cb-b934-487f-89ad-7dc77c1c0238", "VITE_RESOURCE_OPEN_HPDS": "1ba180cb-b934-487f-89ad-7dc77c1c0238", "VITE_RESOURCE_VIZ": "", "VITE_SHOW_VARIABLE_EXPORT": "true", "VITE_SHOW_VARIABLE_HIERARCHY": "true", "VITE_TOUR": "true", "VITE_TOUR_SEARCH_TERM": "age", "VITE_USE_QUERY_TEMPLATE": "false", "VITE_VARIANT_EXPLORER": "false", "VITE_VARIANT_EXPLORER_EXCLUDE_COLUMNS": "", "VITE_VARIANT_EXPLORER_TYPE": "aggregate" };
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
//# sourceMappingURL=hooks.server-BbZBc7-r.js.map
