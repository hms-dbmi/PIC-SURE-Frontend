import { r as registerProviderData } from './AuthProviderRegistry-DQ6xXw8B.js';

const __vite_import_meta_env__ = { "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SSR": true, "VITE_ALLOW_EXPORT": "true", "VITE_ALLOW_EXPORT_ENABLED": "true", "VITE_API": "true", "VITE_AUTH0_TENANT": "avillachlab", "VITE_AUTH_PROVIDER_MODULE_GOOGLE": "true", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_ALT": "false", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_CLIENTID": "dFvo72bRvFWuUIgaR1hLKjz4I0o8fDcK", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_CONNECTION": "google-oauth2", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_DESCRIPTION": "Login", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_TYPE": "AUTH0", "VITE_AUTH_PROVIDER_MODULE_RAS": "true", "VITE_AUTH_PROVIDER_MODULE_RAS_ALT": "false", "VITE_AUTH_PROVIDER_MODULE_RAS_CLIENTID": "0oaebyndxfwuRDgXQ1d7", "VITE_AUTH_PROVIDER_MODULE_RAS_CONNECTION": "okta-ras", "VITE_AUTH_PROVIDER_MODULE_RAS_DESCRIPTION": "Login with Researcher Auth Service (RAS)", "VITE_AUTH_PROVIDER_MODULE_RAS_IMAGEALT": "NIH 2013 Logo", "VITE_AUTH_PROVIDER_MODULE_RAS_IMAGESRC": "NIH_2013_logo_vertical_text_removed.svg", "VITE_AUTH_PROVIDER_MODULE_RAS_OKTAIDPID": "0oafu2znn12Nn0tQ11d7", "VITE_AUTH_PROVIDER_MODULE_RAS_OKTALOGOUTREDIRECT": "https://hms-srce.oktapreview.com/oauth2/default/v1/logout", "VITE_AUTH_PROVIDER_MODULE_RAS_SESSIONLOGOUTURI": "https://authtest.nih.gov/siteminderagent/smlogoutredirector.asp?TARGET=", "VITE_AUTH_PROVIDER_MODULE_RAS_TYPE": "RAS", "VITE_AUTH_PROVIDER_MODULE_RAS_URI": "https://hms-srce.oktapreview.com/oauth2/default/v1/authorize", "VITE_DASHBOARD_DRAWER": "true", "VITE_DATA_REQUESTS": "true", "VITE_DISCOVER": "true", "VITE_DIST_EXPLORER": "true", "VITE_DOTS_COLORS_CLASS": '["--color-primary-500", "--color-error-500", "--color-surface-400"]', "VITE_ENABLE_GENE_QUERY": "true", "VITE_ENABLE_HIERARCHY": "false", "VITE_ENABLE_SAMPLE_ID_CHECKBOX": "true", "VITE_ENABLE_SNP_QUERY": "true", "VITE_EXPLORE_TOUR": "true", "VITE_EXPLORE_TOUR_SEARCH_TERM": "age", "VITE_OPEN": "true", "VITE_ORIGIN": "https://nhanes-dev.hms.harvard.edu/", "VITE_PROJECT_HOSTNAME": "nhanes-dev.hms.harvard.edu", "VITE_REQUIRE_CONSENTS": "true", "VITE_RESOURCE_APP": "9047203e-76c4-46c3-b5e3-4544b56718d3", "VITE_RESOURCE_HPDS": "bf638674-053b-46c4-96a1-4cd6c8395248", "VITE_RESOURCE_VIZ": "e52efd46-b722-42fd-9dff-f020a92b0dd3", "VITE_USE_QUERY_TEMPLATE": "true", "VITE_VARIANT_EXPLORER": "true" };
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
//# sourceMappingURL=hooks.server-B9QEVt2C.js.map
