import { createHash } from 'node:crypto';

/** Recover only exact recorded bytes, allowing Git checkout newline conversion. */
export function recoverRecordedBytes(
  bytes: Buffer,
  expectedHash: string,
): Buffer | undefined {
  const lf = bytes.toString('utf8').replace(/\r\n/g, '\n');
  const candidates = [
    bytes,
    Buffer.from(lf),
    Buffer.from(lf.replace(/\n/g, '\r\n')),
  ];
  return candidates.find(
    (candidate) =>
      createHash('sha256').update(candidate).digest('hex') === expectedHash,
  );
}
