"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Track = void 0;
const BinarySearch_1 = require("./BinarySearch");
const ControlChange_1 = require("./ControlChange");
const ControlChanges_1 = require("./ControlChanges");
const PitchBend_1 = require("./PitchBend");
const Instrument_1 = require("./Instrument");
const Note_1 = require("./Note");
const privateHeaderMap = new WeakMap();
/**
 * A Track is a collection of 'notes' and 'controlChanges'.
 */
class Track {
    constructor(trackData, header) {
        /**
         * The name of the track.
         */
        this.name = "";
        /**
         * The track's note events.
         */
        this.notes = [];
        /**
         * The control change events.
         */
        this.controlChanges = (0, ControlChanges_1.createControlChanges)();
        /**
         * The pitch bend events.
         */
        this.pitchBends = [];
        privateHeaderMap.set(this, header);
        if (trackData) {
            // Get the name of the track.
            const nameEvent = trackData.find((e) => e.type === "trackName");
            // Set empty name if 'trackName' event isn't found.
            this.name = nameEvent ? nameEvent.text : "";
        }
        this.instrument = new Instrument_1.Instrument(trackData, this);
        // Defaults to 0.
        this.channel = 0;
        if (trackData) {
            const noteOns = trackData.filter((event) => event.type === "noteOn");
            const noteOffs = trackData.filter((event) => event.type === "noteOff");
            while (noteOns.length) {
                const currentNote = noteOns.shift();
                // Set the channel based on the note.
                this.channel = currentNote.channel;
                // Find the corresponding note off.
                const offIndex = noteOffs.findIndex((note) => note.noteNumber === currentNote.noteNumber &&
                    note.absoluteTime >= currentNote.absoluteTime);
                if (offIndex !== -1) {
                    // Once it's got the note off, add it.
                    const noteOff = noteOffs.splice(offIndex, 1)[0];
                    this.addNote({
                        durationTicks: noteOff.absoluteTime - currentNote.absoluteTime,
                        midi: currentNote.noteNumber,
                        noteOffVelocity: noteOff.velocity / 127,
                        ticks: currentNote.absoluteTime,
                        velocity: currentNote.velocity / 127,
                    });
                }
            }
            const controlChanges = trackData.filter((event) => event.type === "controller");
            controlChanges.forEach((event) => {
                this.addCC({
                    number: event.controllerType,
                    ticks: event.absoluteTime,
                    value: event.value / 127,
                });
            });
            const pitchBends = trackData.filter((event) => event.type === "pitchBend");
            pitchBends.forEach((event) => {
                this.addPitchBend({
                    ticks: event.absoluteTime,
                    // Scale the value between -2^13 to 2^13 to -2 to 2.
                    value: event.value / Math.pow(2, 13),
                });
            });
            const endOfTrackEvent = trackData.find((event) => event.type === "endOfTrack");
            this.endOfTrackTicks =
                endOfTrackEvent !== undefined
                    ? endOfTrackEvent.absoluteTime
                    : undefined;
        }
    }
    /**
     * Add a note to the notes array.
     * @param props The note properties to add.
     */
    addNote(props) {
        const header = privateHeaderMap.get(this);
        const note = new Note_1.Note({
            midi: 0,
            ticks: 0,
            velocity: 1,
        }, {
            ticks: 0,
            velocity: 0,
        }, header);
        Object.assign(note, props);
        (0, BinarySearch_1.insert)(this.notes, note, "ticks");
        return this;
    }
    /**
     * Add a control change to the track.
     * @param props
     */
    addCC(props) {
        const header = privateHeaderMap.get(this);
        const cc = new ControlChange_1.ControlChange({
            controllerType: props.number,
        }, header);
        delete props.number;
        Object.assign(cc, props);
        if (!Array.isArray(this.controlChanges[cc.number])) {
            this.controlChanges[cc.number] = [];
        }
        (0, BinarySearch_1.insert)(this.controlChanges[cc.number], cc, "ticks");
        return this;
    }
    /**
     * Add a control change to the track.
     */
    addPitchBend(props) {
        const header = privateHeaderMap.get(this);
        const pb = new PitchBend_1.PitchBend({}, header);
        Object.assign(pb, props);
        (0, BinarySearch_1.insert)(this.pitchBends, pb, "ticks");
        return this;
    }
    /**
     * The end time of the last event in the track.
     */
    get duration() {
        if (!this.notes.length) {
            return 0;
        }
        let maxDuration = this.notes[this.notes.length - 1].time +
            this.notes[this.notes.length - 1].duration;
        for (let i = 0; i < this.notes.length - 1; i++) {
            const duration = this.notes[i].time + this.notes[i].duration;
            if (maxDuration < duration) {
                maxDuration = duration;
            }
        }
        return maxDuration;
    }
    /**
     * The end time of the last event in the track in ticks.
     */
    get durationTicks() {
        if (!this.notes.length) {
            return 0;
        }
        let maxDuration = this.notes[this.notes.length - 1].ticks +
            this.notes[this.notes.length - 1].durationTicks;
        for (let i = 0; i < this.notes.length - 1; i++) {
            const duration = this.notes[i].ticks + this.notes[i].durationTicks;
            if (maxDuration < duration) {
                maxDuration = duration;
            }
        }
        return maxDuration;
    }
    /**
     * Assign the JSON values to this track.
     */
    fromJSON(json) {
        this.name = json.name;
        this.channel = json.channel;
        this.instrument = new Instrument_1.Instrument(undefined, this);
        this.instrument.fromJSON(json.instrument);
        if (json.endOfTrackTicks !== undefined) {
            this.endOfTrackTicks = json.endOfTrackTicks;
        }
        for (const number in json.controlChanges) {
            if (json.controlChanges[number]) {
                json.controlChanges[number].forEach((cc) => {
                    this.addCC({
                        number: cc.number,
                        ticks: cc.ticks,
                        value: cc.value,
                    });
                });
            }
        }
        json.notes.forEach((n) => {
            this.addNote({
                durationTicks: n.durationTicks,
                midi: n.midi,
                ticks: n.ticks,
                velocity: n.velocity,
            });
        });
    }
    /**
     * Convert the track into a JSON format.
     */
    toJSON() {
        // Convert all the CCs to JSON.
        const controlChanges = {};
        for (let i = 0; i < 127; i++) {
            if (this.controlChanges.hasOwnProperty(i)) {
                controlChanges[i] = this.controlChanges[i].map((c) => c.toJSON());
            }
        }
        const json = {
            channel: this.channel,
            controlChanges,
            pitchBends: this.pitchBends.map((pb) => pb.toJSON()),
            instrument: this.instrument.toJSON(),
            name: this.name,
            notes: this.notes.map((n) => n.toJSON()),
        };
        if (this.endOfTrackTicks !== undefined) {
            json.endOfTrackTicks = this.endOfTrackTicks;
        }
        return json;
    }
}
exports.Track = Track;
//# sourceMappingURL=Track.js.map