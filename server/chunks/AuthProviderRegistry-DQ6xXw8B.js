const providerDataRegistry = [];
function registerProviderData(providerModule) {
  if (!providerModule.name) {
    throw new Error("Provider name is required");
  }
  if (!providerModule.enabled) {
    throw new Error("Provider must be enabled");
  }
  const existingProvider = providerDataRegistry.find(
    (provider) => provider.name === providerModule.name
  );
  if (existingProvider && existingProvider.connection && providerModule.connection && existingProvider.connection === providerModule.connection) {
    throw new Error(`Provider "${providerModule.name}" is already registered`);
  }
  console.log("Registering new provider:  \n", providerModule);
  providerDataRegistry.push(providerModule);
}
function getAllProviderData() {
  return providerDataRegistry;
}

export { getAllProviderData as g, registerProviderData as r };
//# sourceMappingURL=AuthProviderRegistry-DQ6xXw8B.js.map
