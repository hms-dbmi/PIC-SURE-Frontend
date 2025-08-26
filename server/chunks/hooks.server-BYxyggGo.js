import { r as registerProviderData } from './AuthProviderRegistry-DQ6xXw8B.js';

const __vite_import_meta_env__ = { "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SSR": true, "VITE_ALLOW_EXPORT": "true", "VITE_ALLOW_EXPORT_ENABLED": "true", "VITE_ANALYZE_ANALYSIS": "true", "VITE_ANALYZE_API": "true", "VITE_AUTH0_TENANT": "avillachlab", "VITE_AUTH_PROVIDER_MODULE_BCH": "true", "VITE_AUTH_PROVIDER_MODULE_BCH_CLIENTID": "eK3uec1OFsdTkc4FqUPBhbGxOTsZy5WY", "VITE_AUTH_PROVIDER_MODULE_BCH_CONNECTION": "BCH-AzureEntra", "VITE_AUTH_PROVIDER_MODULE_BCH_DESCRIPTION": "Login With BCH-Common", "VITE_AUTH_PROVIDER_MODULE_BCH_TYPE": "AUTH0", "VITE_AUTH_PROVIDER_MODULE_GOOGLE": "true", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_ALT": "false", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_CLIENTID": "dFvo72bRvFWuUIgaR1hLKjz4I0o8fDcK", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_CONNECTION": "google-oauth2", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_DESCRIPTION": "Login", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_TYPE": "AUTH0", "VITE_COLLABORATE": "true", "VITE_DASHBOARD_DRAWER": "true", "VITE_DATA_REQUESTS": "true", "VITE_DISCOVER": "true", "VITE_DIST_EXPLORER": "true", "VITE_DOTS_COLORS_CLASS": '["--color-primary-500", "--color-error-500", "--color-surface-400"]', "VITE_ENABLE_GENE_QUERY": "true", "VITE_ENABLE_HIERARCHY": "true", "VITE_ENABLE_REDCAP_EXPORT": "true", "VITE_ENABLE_SAMPLE_ID_CHECKBOX": "true", "VITE_ENABLE_SNP_QUERY": "true", "VITE_ENABLE_TOS": "true", "VITE_EXPLORE_TOUR": "true", "VITE_EXPLORE_TOUR_SEARCH_TERM": "age", "VITE_FEDERATED": "true", "VITE_OPEN": "true", "VITE_ORIGIN": "https://nhanes-dev.hms.harvard.edu/", "VITE_PROJECT_HOSTNAME": "nhanes-dev.hms.harvard.edu", "VITE_REQUIRE_CONSENTS": "false", "VITE_RESOURCE_HPDS": "23ec804c-31c1-49eb-bbb0-a0be4eda59fa", "VITE_RESOURCE_OPEN_HPDS": "23ec804c-31c1-49eb-bbb0-a0be4eda59fa", "VITE_RESOURCE_QUERY_ID_GEN": "33656533-6665-3135-2D31-3565312D3131", "VITE_SHOW_TREE_STEP": "true", "VITE_USE_QUERY_TEMPLATE": "false", "VITE_VARIANT_EXPLORER": "true" };
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
//# sourceMappingURL=hooks.server-BYxyggGo.js.map
