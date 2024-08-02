"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Instrument = void 0;
const InstrumentMaps_1 = require("./InstrumentMaps");
/**
 * @hidden
 */
const privateTrackMap = new WeakMap();
/**
 * Describes the MIDI instrument of a track.
 */
class Instrument {
    /**
     * @param trackData
     * @param track
     */
    constructor(trackData, track) {
        /**
         * The instrument number. Defaults to 0.
         */
        this.number = 0;
        privateTrackMap.set(this, track);
        this.number = 0;
        if (trackData) {
            const programChange = trackData.find(e => e.type === "programChange");
            // Set 'number' from 'programNumber' if exists.
            if (programChange) {
                this.number = programChange.programNumber;
            }
        }
    }
    /**
     * The common name of the instrument.
     */
    get name() {
        if (this.percussion) {
            return InstrumentMaps_1.DrumKitByPatchID[this.number];
        }
        else {
            return InstrumentMaps_1.instrumentByPatchID[this.number];
        }
    }
    set name(n) {
        const patchNumber = InstrumentMaps_1.instrumentByPatchID.indexOf(n);
        if (patchNumber !== -1) {
            this.number = patchNumber;
        }
    }
    /**
     * The instrument family, e.g. "piano".
     */
    get family() {
        if (this.percussion) {
            return "drums";
        }
        else {
            return InstrumentMaps_1.InstrumentFamilyByID[Math.floor(this.number / 8)];
        }
    }
    /**
     * If the instrument is a percussion instrument.
     */
    get percussion() {
        const track = privateTrackMap.get(this);
        return track.channel === 9;
    }
    /**
     * Convert it to JSON form.
     */
    toJSON() {
        return {
            family: this.family,
            number: this.number,
            name: this.name
        };
    }
    /**
     * Convert from JSON form.
     */
    fromJSON(json) {
        this.number = json.number;
    }
}
exports.Instrument = Instrument;
//# sourceMappingURL=Instrument.js.map