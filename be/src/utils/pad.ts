export function pad(num: number, size: number = 2) {
  let numAsString = num.toString();
  while (numAsString.length < size) numAsString = "0" + numAsString;
  return numAsString;
}