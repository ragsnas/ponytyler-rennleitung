let counter = 0;

/**
 * A name that is unique across tests, workers and re-runs on a warm stack:
 * `<prefix> <timestamp>p<worker pid>n<counter>`. The counter keeps names
 * apart within one millisecond; the pid keeps parallel workers apart. The
 * suffix is letters and digits only, since the song file sync mangles
 * hyphens in a "<artist> - <name>.mp3" file name.
 */
export function uniqueName(prefix: string): string {
  counter += 1;
  return `${prefix} ${Date.now()}p${process.pid}n${counter}`;
}
