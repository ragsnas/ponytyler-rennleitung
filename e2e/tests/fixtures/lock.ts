import { mkdir, rm, stat } from 'fs/promises';
import os from 'os';
import path from 'path';

export interface LockOptions {
  /** Give up after this long. */
  timeoutMs?: number;
  /** A lock older than this is assumed to belong to a killed worker and is taken over. */
  staleMs?: number;
  pollMs?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A mutex across Playwright workers (separate processes), built on the
 * atomicity of `mkdir`. Resolves to a function that releases the lock.
 */
export async function acquireLock(
  name: string,
  { timeoutMs = 120_000, staleMs = 180_000, pollMs = 50 }: LockOptions = {},
): Promise<() => Promise<void>> {
  const lockDir = path.join(os.tmpdir(), `ponytyler-e2e-${name}.lock`);
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    try {
      await mkdir(lockDir);
      return () => rm(lockDir, { recursive: true, force: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }

    const age = await stat(lockDir).then(
      (info) => Date.now() - info.mtimeMs,
      () => 0, // released in the meantime, so just try again
    );
    if (age > staleMs) {
      await rm(lockDir, { recursive: true, force: true });
      continue;
    }
    if (Date.now() > deadline) {
      throw new Error(`timed out waiting for lock "${name}" after ${timeoutMs}ms`);
    }
    await sleep(pollMs);
  }
}
