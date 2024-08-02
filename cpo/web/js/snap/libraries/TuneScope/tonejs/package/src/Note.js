"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Note = void 0;
/**
 * Convert a MIDI note into a pitch.
 */
function midiToPitch(midi) {
    const octave = Math.floor(midi / 12) - 1;
    return midiToPitchClass(midi) + octave.toString();
}
/**
 * Convert a MIDI note to a pitch class (just the pitch no octave).
 */
function midiToPitchClass(midi) {
    const scaleIndexToNote = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const note = midi % 12;
    return scaleIndexToNote[note];
}
/**
 * Convert a pitch class to a MIDI note.
 */
function pitchClassToMidi(pitch) {
    const scaleIndexToNote = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    return scaleIndexToNote.indexOf(pitch);
}
/**
 * Convert a pitch to a MIDI number.
 */
// tslint:disable-next-line: only-arrow-functions typedef
const pitchToMidi = (function () {
    const regexp = /^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i;
    const noteToScaleIndex = {
        // tslint:disable-next-line: object-literal-sort-keys
        cbb: -2, cb: -1, c: 0, "c#": 1, cx: 2,
        dbb: 0, db: 1, d: 2, "d#": 3, dx: 4,
        ebb: 2, eb: 3, e: 4, "e#": 5, ex: 6,
        fbb: 3, fb: 4, f: 5, "f#": 6, fx: 7,
        gbb: 5, gb: 6, g: 7, "g#": 8, gx: 9,
        abb: 7, ab: 8, a: 9, "a#": 10, ax: 11,
        bbb: 9, bb: 10, b: 11, "b#": 12, bx: 13,
    };
    return (note) => {
        const split = regexp.exec(note);
        const pitch = split[1];
        const octave = split[2];
        const index = noteToScaleIndex[pitch.toLowerCase()];
        return index + (parseInt(octave, 10) + 1) * 12;
    };
}());
const privateHeaderMap = new WeakMap();
/**
 * A Note consists of a `noteOn` and `noteOff` event.
 */
class Note {
    constructor(noteOn, noteOff, header) {
        privateHeaderMap.set(this, header);
        this.midi = noteOn.midi;
        this.velocity = noteOn.velocity;
        this.noteOffVelocity = noteOff.velocity;
        this.ticks = noteOn.ticks;
        this.durationTicks = noteOff.ticks - noteOn.ticks;
    }
    /**
     * The note name and octave in scientific pitch notation, e.g. "C4".
     */
    get name() {
        return midiToPitch(this.midi);
    }
    set name(n) {
        this.midi = pitchToMidi(n);
    }
    /**
     * The notes octave number.
     */
    get octave() {
        return Math.floor(this.midi / 12) - 1;
    }
    set octave(o) {
        const diff = o - this.octave;
        this.midi += diff * 12;
    }
    /**
     * The pitch class name. e.g. "A".
     */
    get pitch() {
        return midiToPitchClass(this.midi);
    }
    set pitch(p) {
        this.midi = 12 * (this.octave + 1) + pitchClassToMidi(p);
    }
    /**
     * The duration of the segment in seconds.
     */
    get duration() {
        const header = privateHeaderMap.get(this);
        return header.ticksToSeconds(this.ticks + this.durationTicks) - header.ticksToSeconds(this.ticks);
    }
    set duration(d) {
        const header = privateHeaderMap.get(this);
        const noteEndTicks = header.secondsToTicks(this.time + d);
        this.durationTicks = noteEndTicks - this.ticks;
    }
    /**
     * The time of the event in seconds.
     */
    get time() {
        const header = privateHeaderMap.get(this);
        return header.ticksToSeconds(this.ticks);
    }
    set time(t) {
        const header = privateHeaderMap.get(this);
        this.ticks = header.secondsToTicks(t);
    }
    /**
     * The number of measures (and partial measures) to this beat.
     * Takes into account time signature changes.
     * @readonly
     */
    get bars() {
        const header = privateHeaderMap.get(this);
        return header.ticksToMeasures(this.ticks);
    }
    toJSON() {
        return {
            duration: this.duration,
            durationTicks: this.durationTicks,
            midi: this.midi,
            name: this.name,
            ticks: this.ticks,
            time: this.time,
            velocity: this.velocity,
        };
    }
}
exports.Note = Note;
//# sourceMappingURL=Note.js.map