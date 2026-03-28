const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // removed ambiguous 0/O, 1/I

export function generateRoomCode(): string {
  let code = "";
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  for (const byte of array) {
    code += CHARS[byte % CHARS.length];
  }
  return code;
}
