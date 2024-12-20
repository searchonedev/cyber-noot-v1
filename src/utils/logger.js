"use strict";
// src/utils/logger.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Logger.enable = function () {
        this.enabled = true;
    };
    Logger.disable = function () {
        this.enabled = false;
    };
    Logger.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.enabled) {
            console.log.apply(console, args);
        }
    };
    Logger.enabled = false;
    return Logger;
}());
exports.Logger = Logger;
