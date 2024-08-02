"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createControlChanges = createControlChanges;
const ControlChange_1 = require("./ControlChange");
/**
 * Automatically creates an alias for named control values using Proxies
 * @hidden
 */
function createControlChanges() {
    return new Proxy({}, {
        // tslint:disable-next-line: typedef
        get(target, handler) {
            if (target[handler]) {
                return target[handler];
            }
            else if (ControlChange_1.controlChangeIds.hasOwnProperty(handler)) {
                return target[ControlChange_1.controlChangeIds[handler]];
            }
        },
        // tslint:disable-next-line: typedef
        set(target, handler, value) {
            if (ControlChange_1.controlChangeIds.hasOwnProperty(handler)) {
                target[ControlChange_1.controlChangeIds[handler]] = value;
            }
            else {
                target[handler] = value;
            }
            return true;
        },
    });
}
//# sourceMappingURL=ControlChanges.js.map