const SIGNATURES: Record<string, number[][]> = {
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  // WEBP: "RIFF" .... "WEBP" — the 4 size bytes in between vary per file
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
};

export function matchesImageSignature(bytes: Buffer, mimeType: string): boolean {
  const signatures = SIGNATURES[mimeType];
  if (!signatures) return false;

  if (mimeType === "image/webp") {
    return (
      bytes.length >= 12 &&
      bytes.subarray(0, 4).equals(Buffer.from(SIGNATURES["image/webp"][0])) &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  return signatures.some((sig) => bytes.subarray(0, sig.length).equals(Buffer.from(sig)));
}
