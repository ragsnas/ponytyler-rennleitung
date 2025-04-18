"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDir = isDir;
const fs_1 = require("fs");
function isDir(path) {
    try {
        const stat = (0, fs_1.lstatSync)(path);
        return stat.isDirectory();
    }
    catch (e) {
        return false;
    }
}
//# sourceMappingURL=isDir.js.map