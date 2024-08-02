"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = search;
exports.insert = insert;
/**
 * Return the index of the element at or before the given property
 * @hidden
 */
function search(array, value, prop = "ticks") {
    let beginning = 0;
    const len = array.length;
    let end = len;
    if (len > 0 && array[len - 1][prop] <= value) {
        return len - 1;
    }
    while (beginning < end) {
        // calculate the midpoint for roughly equal partition
        let midPoint = Math.floor(beginning + (end - beginning) / 2);
        const event = array[midPoint];
        const nextEvent = array[midPoint + 1];
        if (event[prop] === value) {
            // choose the last one that has the same value
            for (let i = midPoint; i < array.length; i++) {
                const testEvent = array[i];
                if (testEvent[prop] === value) {
                    midPoint = i;
                }
            }
            return midPoint;
        }
        else if (event[prop] < value && nextEvent[prop] > value) {
            return midPoint;
        }
        else if (event[prop] > value) {
            // search lower
            end = midPoint;
        }
        else if (event[prop] < value) {
            // search upper
            beginning = midPoint + 1;
        }
    }
    return -1;
}
/**
 * Does a binary search to insert the note
 * in the correct spot in the array
 * @hidden
 */
function insert(array, event, prop = "ticks") {
    if (array.length) {
        const index = search(array, event[prop], prop);
        array.splice(index + 1, 0, event);
    }
    else {
        array.push(event);
    }
}
//# sourceMappingURL=BinarySearch.js.map