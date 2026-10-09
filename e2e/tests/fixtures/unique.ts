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

/**
 * Like {@link uniqueName}, but also far apart from every other name in edit
 * distance (a random 16-letter word precedes the unique suffix). `uniqueName`
 * values differ in a few characters only, which is enough for the duplicates
 * page to pair songs of two parallel tests as near-duplicates.
 */
export function distinctName(prefix: string): string {
  const word = Array.from({ length: 16 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
  return uniqueName(`${prefix} ${word}`);
}
