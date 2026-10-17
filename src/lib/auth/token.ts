/**
 * The claims of a JWT, read without verifying the signature (the server verifies). Segments are
 * unpadded base64url over UTF-8: atob accepts the missing padding but not `-` or `_`, and returns
 * one character per byte, hence the alphabet translation and the TextDecoder.
 * Throws if the payload is missing or isn't base64url-encoded JSON.
 */
export function decodeJwtPayload(token: string): unknown {
  const payload = token.split('.')[1];
  if (!payload) throw new Error('Token has no payload.');
  const binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
