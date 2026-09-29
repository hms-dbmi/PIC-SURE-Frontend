/**
 * Returns the trimmed MCP server URL when the assistant connection panel should be
 * offered, or an empty string when the feature is off or no URL is configured.
 *
 * @param enabled whether the MCP_CONNECT feature is on
 * @param url the raw MCP_URL setting
 */
export function mcpConnectUrl(enabled: boolean, url: string): string {
  return enabled ? url.trim() : '';
}
