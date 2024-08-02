"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PitchBend = void 0;
const privateHeaderMap = new WeakMap();
/**
 * Represents a pitch bend event.
 */
class PitchBend {
    /**
     * @param event
     * @param header
     */
    constructor(event, header) {
        privateHeaderMap.set(this, header);
        this.ticks = event.absoluteTime;
        this.value = event.value;
    }
    /**
     * The time of the event in seconds
     */
    get time() {
        const header = privateHeaderMap.get(this);
        return header.ticksToSeconds(this.ticks);
    }
    set time(t) {
        const header = privateHeaderMap.get(this);
        this.ticks = header.secondsToTicks(t);
    }
    toJSON() {
        return {
            ticks: this.ticks,
            time: this.time,
            value: this.value,
        };
    }
}
exports.PitchBend = PitchBend;
//# sourceMappingURL=PitchBend.js.map