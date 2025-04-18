import {lstatSync} from 'fs';

export function isDir(path) {
  try {
    const stat = lstatSync(path);
    return stat.isDirectory();
  } catch (e) {
    // lstatSync throws an error if path doesn't exist
    return false;
  }
}