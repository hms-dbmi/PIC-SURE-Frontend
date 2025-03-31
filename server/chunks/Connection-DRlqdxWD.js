function parseFieldsFromJSON(json) {
  if (json === "") return [];
  try {
    const requiredFields = JSON.parse(json);
    return requiredFields;
  } catch (e) {
    console.error("Error parsing JSON required fields object.");
    return [];
  }
}

export { parseFieldsFromJSON as p };
//# sourceMappingURL=Connection-DRlqdxWD.js.map
