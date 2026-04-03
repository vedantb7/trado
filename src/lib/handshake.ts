export function generateHandshakeCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function verifyHandshake(inputCode: string, actualCode: string) {
  return inputCode.toUpperCase() === actualCode.toUpperCase();
}
