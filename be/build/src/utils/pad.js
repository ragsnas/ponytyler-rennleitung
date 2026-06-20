"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pad = pad;
function pad(num, size = 2) {
    let numAsString = num.toString();
    while (numAsString.length < size)
        numAsString = "0" + numAsString;
    return numAsString;
}
//# sourceMappingURL=pad.js.map