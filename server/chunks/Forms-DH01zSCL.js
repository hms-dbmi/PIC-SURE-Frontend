const uuidInput = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";
function debounce(func, timeout = 1e3) {
  let timer;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(func, timeout);
  };
}

export { debounce as d, uuidInput as u };
//# sourceMappingURL=Forms-DH01zSCL.js.map
