"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encode = encode;
const midi_file_1 = require("midi-file");
const Header_1 = require("./Header");
const array_flatten_1 = require("array-flatten");
function encodeNote(note, channel) {
    return [{
            absoluteTime: note.ticks,
            channel,
            deltaTime: 0,
            noteNumber: note.midi,
            type: "noteOn",
            velocity: Math.floor(note.velocity * 127),
        },
        {
            absoluteTime: note.ticks + note.durationTicks,
            channel,
            deltaTime: 0,
            noteNumber: note.midi,
            type: "noteOff",
            velocity: Math.floor(note.noteOffVelocity * 127),
        }];
}
function encodeNotes(track) {
    return (0, array_flatten_1.flatten)(track.notes.map(note => encodeNote(note, track.channel)));
}
function encodeControlChange(cc, channel) {
    return {
        absoluteTime: cc.ticks,
        channel,
        controllerType: cc.number,
        deltaTime: 0,
        type: "controller",
        value: Math.floor(cc.value * 127),
    };
}
function encodeControlChanges(track) {
    const controlChanges = [];
    for (let i = 0; i < 127; i++) {
        if (track.controlChanges.hasOwnProperty(i)) {
            track.controlChanges[i].forEach((cc) => {
                controlChanges.push(encodeControlChange(cc, track.channel));
            });
        }
    }
    return controlChanges;
}
function encodePitchBend(pb, channel) {
    return {
        absoluteTime: pb.ticks,
        channel,
        deltaTime: 0,
        type: "pitchBend",
        value: pb.value,
    };
}
function encodePitchBends(track) {
    const pitchBends = [];
    track.pitchBends.forEach((pb) => {
        pitchBends.push(encodePitchBend(pb, track.channel));
    });
    return pitchBends;
}
function encodeInstrument(track) {
    return {
        absoluteTime: 0,
        channel: track.channel,
        deltaTime: 0,
        programNumber: track.instrument.number,
        type: "programChange",
    };
}
function encodeTrackName(name) {
    return {
        absoluteTime: 0,
        deltaTime: 0,
        meta: true,
        text: name,
        type: "trackName",
    };
}
function encodeTempo(tempo) {
    return {
        absoluteTime: tempo.ticks,
        deltaTime: 0,
        meta: true,
        microsecondsPerBeat: Math.floor(60000000 / tempo.bpm),
        type: "setTempo",
    };
}
function encodeTimeSignature(timeSig) {
    return {
        absoluteTime: timeSig.ticks,
        deltaTime: 0,
        denominator: timeSig.timeSignature[1],
        meta: true,
        metronome: 24,
        numerator: timeSig.timeSignature[0],
        thirtyseconds: 8,
        type: "timeSignature",
    };
}
// function encodeMeta(event: )
function encodeKeySignature(keySig) {
    const keyIndex = Header_1.keySignatureKeys.indexOf(keySig.key);
    return {
        absoluteTime: keySig.ticks,
        deltaTime: 0,
        key: keyIndex + 7,
        meta: true,
        scale: keySig.scale === "major" ? 0 : 1,
        type: "keySignature",
    };
}
function encodeText(textEvent) {
    return {
        absoluteTime: textEvent.ticks,
        deltaTime: 0,
        meta: true,
        text: textEvent.text,
        type: textEvent.type,
    };
}
/**
 * Convert the MIDI object to an array.
 */
function encode(midi) {
    const midiData = {
        header: {
            format: 1,
            numTracks: midi.tracks.length + 1,
            ticksPerBeat: midi.header.ppq,
        },
        tracks: [
            [
                // The name data.
                {
                    absoluteTime: 0,
                    deltaTime: 0,
                    meta: true,
                    text: midi.header.name,
                    type: "trackName",
                },
                ...midi.header.keySignatures.map(keySig => encodeKeySignature(keySig)),
                // and all the meta events (cloned for safety)
                ...midi.header.meta.map(e => encodeText(e)),
                // the first track is all the tempo data
                ...midi.header.tempos.map(tempo => encodeTempo(tempo)),
                // and the time signature data.
                ...midi.header.timeSignatures.map(timeSig => encodeTimeSignature(timeSig)),
            ],
            // The remaining tracks.
            ...midi.tracks.map((track) => {
                return [
                    // Add the name
                    encodeTrackName(track.name),
                    // the instrument
                    encodeInstrument(track),
                    // add the notes
                    ...encodeNotes(track),
                    // and the control changes
                    ...encodeControlChanges(track),
                    // and the pitch bends.
                    ...encodePitchBends(track)
                ];
            }),
        ],
    };
    // Sort and set `deltaTime` of all of the tracks.
    midiData.tracks = midiData.tracks.map((track) => {
        track = track.sort((a, b) => a.absoluteTime - b.absoluteTime);
        let lastTime = 0;
        track.forEach(note => {
            note.deltaTime = note.absoluteTime - lastTime;
            lastTime = note.absoluteTime;
            delete note.absoluteTime;
        });
        // End of track.
        track.push({
            deltaTime: 0,
            meta: true,
            type: "endOfTrack",
        });
        return track;
    });
    // Rreturn `midiData`.
    return new Uint8Array((0, midi_file_1.writeMidi)(midiData));
}
//# sourceMappingURL=Encode.js.map