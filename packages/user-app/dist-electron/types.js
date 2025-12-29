"use strict";
// Global state for tracking if app is quitting
// This is used to differentiate between close-to-tray and actual quit
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAppQuitting = setAppQuitting;
exports.getAppQuitting = getAppQuitting;
let isAppQuitting = false;
function setAppQuitting(value) {
    isAppQuitting = value;
}
function getAppQuitting() {
    return isAppQuitting;
}
//# sourceMappingURL=types.js.map