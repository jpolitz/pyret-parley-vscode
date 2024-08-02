/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/web/js/modal-prompt.js":
/*!************************************!*\
  !*** ./src/web/js/modal-prompt.js ***!
  \************************************/
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
 * Module for managing modal prompt instances.
 * NOTE: This module is currently limited in a number
 *       of ways. For one, it only allows radio
 *       input options. Additionally, it hard-codes in
 *       a number of other behaviors which are specific
 *       to the image import style prompt (for which
 *       this module was written).
 *       If desired, this module may be made more
 *       general-purpose in the future, but, for now,
 *       be aware of these limitations.
 */
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! q */ "./node_modules/q/q.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (Q) {
  function autoHighlightBox(text) {
    var textBox = $("<input type='text'>").addClass("auto-highlight");
    textBox.attr("readonly", "readonly");
    textBox.on("focus", function () {
      $(this).select();
    });
    textBox.on("mouseup", function () {
      $(this).select();
    });
    textBox.val(text);
    return textBox;
  }

  // Allows asynchronous requesting of prompts
  var promptQueue = Q();
  var styles = ["radio", "tiles", "text", "copyText", "confirm"];
  window.modals = [];

  /**
   * Represents an option to present the user
   * @typedef {Object} ModalOption
   * @property {string} message - The message to show the user which
               describes this option
   * @property {string} value - The value to return if this option is chosen
   * @property {string} [example] - A code snippet to show with this option
   */

  /**
   * Constructor for modal prompts.
   * @param {ModalOption[]} options - The options to present the user
   */
  function Prompt(options) {
    window.modals.push(this);
    if (!options || styles.indexOf(options.style) === -1 || !options.options || typeof options.options.length !== "number" || options.options.length === 0) {
      throw new Error("Invalid Prompt Options", options);
    }
    this.options = options;
    this.modal = $("#promptModal");
    if (this.options.style === "radio") {
      this.elts = $($.parseHTML("<table></table>")).addClass("choiceContainer");
    } else if (this.options.style === "text") {
      this.elts = $("<div>").addClass("choiceContainer");
    } else if (this.options.style === "copyText") {
      this.elts = $("<div>").addClass("choiceContainer");
    } else if (this.options.style === "confirm") {
      this.elts = $("<div>").addClass("choiceContainer");
    } else {
      this.elts = $($.parseHTML("<div></div>")).addClass("choiceContainer");
    }
    this.title = $(".modal-header > h3", this.modal);
    this.modalContent = $(".modal-content", this.modal);
    this.closeButton = $(".close", this.modal);
    this.submitButton = $(".submit", this.modal);
    if (this.options.submitText) {
      this.submitButton.text(this.options.submitText);
    } else {
      this.submitButton.text("Submit");
    }
    if (this.options.cancelText) {
      this.closeButton.text(this.options.cancelText);
    } else {
      this.closeButton.text("Cancel");
    }
    this.modalContent.toggleClass("narrow", !!this.options.narrow);
    this.isCompiled = false;
    this.deferred = Q.defer();
    this.promise = this.deferred.promise;
  }

  /**
   * Type for handlers of responses from modal prompts
   * @callback promptCallback
   * @param {string} resp - The response from the user
   */

  /**
   * Shows this prompt to the user (will wait until any active
   * prompts have finished)
   * @param {promptCallback} [callback] - Optional callback which is passed the
   *        result of the prompt
   * @returns A promise resolving to either the result of `callback`, if provided,
   *          or the result of the prompt, otherwise.
   */
  Prompt.prototype.show = function (callback) {
    // Use the promise queue to make sure there's no other
    // prompt being shown currently
    if (this.options.hideSubmit) {
      this.submitButton.hide();
    } else {
      this.submitButton.show();
    }
    this.closeButton.click(this.onClose.bind(this));
    this.modal.keypress(function (e) {
      if (e.which == 13) {
        this.submitButton.click();
        return false;
      }
    }.bind(this));
    this.submitButton.click(this.onSubmit.bind(this));
    var docClick = function (e) {
      // If the prompt is active and the background is clicked,
      // then close.
      if ($(e.target).is(this.modal) && this.deferred) {
        this.onClose(e);
        $(document).off("click", docClick);
      }
    }.bind(this);
    $(document).click(docClick);
    var docKeydown = function (e) {
      if (e.key === "Escape") {
        this.onClose(e);
        $(document).off("keydown", docKeydown);
      }
    }.bind(this);
    $(document).keydown(docKeydown);
    this.title.text(this.options.title);
    this.populateModal();
    this.modal.css('display', 'block');
    $(":input:enabled:visible:first", this.modal).focus().select();
    if (callback) {
      return this.promise.then(callback);
    } else {
      return this.promise;
    }
  };

  /**
   * Clears the contents of the modal prompt.
   */
  Prompt.prototype.clearModal = function () {
    this.submitButton.off();
    this.closeButton.off();
    this.elts.empty();
  };

  /**
   * Populates the contents of the modal prompt with the
   * options in this prompt.
   */
  Prompt.prototype.populateModal = function () {
    function createRadioElt(option, idx) {
      var elt = $($.parseHTML("<input name=\"pyret-modal\" type=\"radio\">"));
      var id = "r" + idx.toString();
      var label = $($.parseHTML("<label for=\"" + id + "\"></label>"));
      elt.attr("id", id);
      elt.attr("value", option.value);
      label.text(option.message);
      var eltContainer = $($.parseHTML("<td class=\"pyret-modal-option-radio\"></td>"));
      eltContainer.append(elt);
      var labelContainer = $($.parseHTML("<td class=\"pyret-modal-option-message\"></td>"));
      labelContainer.append(label);
      var container = $($.parseHTML("<tr class=\"pyret-modal-option\"></tr>"));
      container.append(eltContainer);
      container.append(labelContainer);
      if (option.example) {
        var example = $($.parseHTML("<div></div>"));
        var cm = CodeMirror(example[0], {
          value: option.example,
          mode: 'pyret',
          lineNumbers: false,
          readOnly: "nocursor" // this makes it readOnly & not focusable as a form input
        });
        setTimeout(function () {
          cm.refresh();
        }, 1);
        var exampleContainer = $($.parseHTML("<td class=\"pyret-modal-option-example\"></td>"));
        exampleContainer.append(example);
        container.append(exampleContainer);
      }
      return container;
    }
    function createTileElt(option, idx) {
      var elt = $($.parseHTML("<button name=\"pyret-modal\" class=\"tile\"></button>"));
      elt.attr("id", "t" + idx.toString());
      elt.append($("<b>").text(option.message)).append($("<p>").text(option.details));
      for (var evt in option.on) elt.on(evt, option.on[evt]);
      return elt;
    }
    function createTextElt(option) {
      var elt = $("<div class=\"pyret-modal-text\">");
      var input = $("<input id='modal-prompt-text' type='text'>").val(option.defaultValue);
      if (option.drawElement) {
        elt.append(option.drawElement(input));
      } else {
        elt.append($("<label for='modal-prompt-text'>").addClass("textLabel").text(option.message));
        elt.append(input);
      }
      return elt;
    }
    function createCopyTextElt(option) {
      var elt = $("<div>");
      elt.append($("<p>").addClass("textLabel").text(option.message));
      if (option.text) {
        var box = autoHighlightBox(option.text);
        //      elt.append($("<span>").text("(" + option.details + ")"));
        elt.append(box);
        box.focus();
      }
      return elt;
    }
    function createConfirmElt(option) {
      return $("<p>").text(option.message);
    }
    var that = this;
    function createElt(option, i) {
      if (that.options.style === "radio") {
        return createRadioElt(option, i);
      } else if (that.options.style === "tiles") {
        return createTileElt(option, i);
      } else if (that.options.style === "text") {
        return createTextElt(option);
      } else if (that.options.style === "copyText") {
        return createCopyTextElt(option);
      } else if (that.options.style === "confirm") {
        return createConfirmElt(option);
      }
    }
    var optionElts;
    // Cache results
    //    if (true) {
    optionElts = this.options.options.map(createElt);
    //      this.compiledElts = optionElts;
    //      this.isCompiled = true;
    //    } else {
    //      optionElts = this.compiledElts;
    //    }
    $("input[type='radio']", optionElts[0]).attr('checked', true);
    this.elts.append(optionElts);
    $(".modal-body", this.modal).empty().append(this.elts);
  };

  /**
   * Handler which is called when the user does not select anything
   */
  Prompt.prototype.onClose = function (e) {
    this.modal.css('display', 'none');
    this.clearModal();
    this.deferred.resolve(null);
    delete this.deferred;
    delete this.promise;
  };

  /**
   * Handler which is called when the user presses "submit"
   */
  Prompt.prototype.onSubmit = function (e) {
    if (this.options.style === "radio") {
      var retval = $("input[type='radio']:checked", this.modal).val();
    } else if (this.options.style === "text") {
      var retval = $("input[type='text']", this.modal).val();
    } else if (this.options.style === "copyText") {
      var retval = true;
    } else if (this.options.style === "confirm") {
      var retval = true;
    } else {
      var retval = true; // Just return true if they clicked submit
    }
    this.modal.css('display', 'none');
    this.clearModal();
    this.deferred.resolve(retval);
    delete this.deferred;
    delete this.promise;
  };
  return Prompt;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),

/***/ "./node_modules/q/q.js":
/*!*****************************!*\
  !*** ./node_modules/q/q.js ***!
  \*****************************/
/***/ ((module) => {

// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    "use strict";

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (true) {
        module.exports = definition();

    // RequireJS
    } else { var previousQ, global; }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;
    // queue for late tasks, used by unhandled rejection tracking
    var laterQueue = [];

    function flush() {
        /* jshint loopfunc: true */
        var task, domain;

        while (head.next) {
            head = head.next;
            task = head.task;
            head.task = void 0;
            domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }
            runSingle(task, domain);

        }
        while (laterQueue.length) {
            task = laterQueue.pop();
            runSingle(task);
        }
        flushing = false;
    }
    // runs a single function in the async queue
    function runSingle(task, domain) {
        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function () {
                    throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process === "object" &&
        process.toString() === "[object process]" && process.nextTick) {
        // Ensure Q is in a real Node environment, with a `process.nextTick`.
        // To see through fake Node environments:
        // * Mocha test runner - exposes a `process` global without a `nextTick`
        // * Browserify - exposes a `process.nexTick` function that uses
        //   `setTimeout`. In this case `setImmediate` is preferred because
        //    it is faster. Browserify's `process.toString()` yields
        //   "[object Object]", while in a real Node environment
        //   `process.nextTick()` yields "[object process]".
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }
    // runs a task after all other tasks have been run
    // this is useful for unhandled rejection tracking that needs to happen
    // after all `then`d tasks have been run.
    nextTick.runAfter = function (task) {
        laterQueue.push(task);
        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };
    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (value instanceof Promise) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

// enable long stacks if Q_DEBUG is set
if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
    Q.longStackSupport = true;
}

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            Q.nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            Q.nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            Q.nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.Promise = promise; // ES6
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

promise.race = race; // ES6
promise.all = all; // ES6
promise.reject = reject; // ES6
promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become settled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be settled
 */
Q.race = race;
function race(answerPs) {
    return promise(function (resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function (answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    Q.nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

Q.tap = function (promise, callback) {
    return Q(promise).tap(callback);
};

/**
 * Works almost like "finally", but not called for rejections.
 * Original resolution value is passed through callback unaffected.
 * Callback may return a promise that will be awaited for.
 * @param {Function} callback
 * @returns {Q.Promise}
 * @example
 * doSomething()
 *   .then(...)
 *   .tap(console.log)
 *   .then(...);
 */
Promise.prototype.tap = function (callback) {
    callback = Q(callback);

    return this.then(function (value) {
        return callback.fcall(value).thenResolve(value);
    });
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return object instanceof Promise;
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var reportedUnhandledRejections = [];
var trackUnhandledRejections = true;

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }
    if (typeof process === "object" && typeof process.emit === "function") {
        Q.nextTick.runAfter(function () {
            if (array_indexOf(unhandledRejections, promise) !== -1) {
                process.emit("unhandledRejection", reason, promise);
                reportedUnhandledRejections.push(promise);
            }
        });
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        if (typeof process === "object" && typeof process.emit === "function") {
            Q.nextTick.runAfter(function () {
                var atReport = array_indexOf(reportedUnhandledRejections, promise);
                if (atReport !== -1) {
                    process.emit("rejectionHandled", unhandledReasons[at], promise);
                    reportedUnhandledRejections.splice(atReport, 1);
                }
            });
        }
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    Q.nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
            // engine that has a deployed base of browsers that support generators.
            // However, SM's generators use the Python-inspired semantics of
            // outdated ES6 drafts.  We would like to support ES6, but we'd also
            // like to make it possible to use generators in deployed browsers, so
            // we also support Python-style generators.  At some point we can remove
            // this block.

            if (typeof StopIteration === "undefined") {
                // ES6 Generators
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return Q(result.value);
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // SpiderMonkey Generators
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return Q(exception.value);
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    Q.nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var pendingCount = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++pendingCount;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--pendingCount === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (pendingCount === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Returns the first resolved promise of an array. Prior rejected promises are
 * ignored.  Rejects only if all promises are rejected.
 * @param {Array*} an array containing values or promises for values
 * @returns a promise fulfilled with the value of the first resolved promise,
 * or a rejected promise if all promises are rejected.
 */
Q.any = any;

function any(promises) {
    if (promises.length === 0) {
        return Q.resolve();
    }

    var deferred = Q.defer();
    var pendingCount = 0;
    array_reduce(promises, function (prev, current, index) {
        var promise = promises[index];

        pendingCount++;

        when(promise, onFulfilled, onRejected, onProgress);
        function onFulfilled(result) {
            deferred.resolve(result);
        }
        function onRejected() {
            pendingCount--;
            if (pendingCount === 0) {
                deferred.reject(new Error(
                    "Can't get fulfillment value from any promise, all " +
                    "promises were rejected."
                ));
            }
        }
        function onProgress(progress) {
            deferred.notify({
                index: index,
                value: progress
            });
        }
    }, undefined);

    return deferred.promise;
}

Promise.prototype.any = function () {
    return any(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        Q.nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {Any*} custom error message or Error object (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, error) {
    return Q(object).timeout(ms, error);
};

Promise.prototype.timeout = function (ms, error) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        if (!error || "string" === typeof error) {
            error = new Error(error || "Timed out after " + ms + " ms");
            error.code = "ETIMEDOUT";
        }
        deferred.reject(error);
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            Q.nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            Q.nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

Q.noConflict = function() {
    throw new Error("Q.noConflict only works when Q is used as a global");
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});


/***/ }),

/***/ "./node_modules/url.js/url.js":
/*!************************************!*\
  !*** ./node_modules/url.js/url.js ***!
  \************************************/
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;// Copyright 2013-2014 Kevin Cox

/*******************************************************************************
*                                                                              *
*  This software is provided 'as-is', without any express or implied           *
*  warranty. In no event will the authors be held liable for any damages       *
*  arising from the use of this software.                                      *
*                                                                              *
*  Permission is granted to anyone to use this software for any purpose,       *
*  including commercial applications, and to alter it and redistribute it      *
*  freely, subject to the following restrictions:                              *
*                                                                              *
*  1. The origin of this software must not be misrepresented; you must not     *
*     claim that you wrote the original software. If you use this software in  *
*     a product, an acknowledgment in the product documentation would be       *
*     appreciated but is not required.                                         *
*                                                                              *
*  2. Altered source versions must be plainly marked as such, and must not be  *
*     misrepresented as being the original software.                           *
*                                                                              *
*  3. This notice may not be removed or altered from any source distribution.  *
*                                                                              *
*******************************************************************************/

+function(){
"use strict";

var array = /\[([^\[]*)\]$/;

/// URL Regex.
/**
 * This regex splits the URL into parts.  The capture groups catch the important
 * bits.
 * 
 * Each section is optional, so to work on any part find the correct top level
 * `(...)?` and mess around with it.
 */
var regex = /^(?:([a-z]*):)?(?:\/\/)?(?:([^:@]*)(?::([^@]*))?@)?([a-z-._]+)?(?::([0-9]*))?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/i;
//               1 - scheme                2 - user    3 = pass 4 - host        5 - port  6 - path        7 - query    8 - hash

var noslash = ["mailto","bitcoin"];

var self = {
	/** Parse a query string.
	 *
	 * This function parses a query string (sometimes called the search
	 * string).  It takes a query string and returns a map of the results.
	 *
	 * Keys are considered to be everything up to the first '=' and values are
	 * everything afterwords.  Since URL-decoding is done after parsing, keys
	 * and values can have any values, however, '=' have to be encoded in keys
	 * while '?' and '&' have to be encoded anywhere (as they delimit the
	 * kv-pairs).
	 *
	 * Keys and values will always be strings, except if there is a key with no
	 * '=' in which case it will be considered a flag and will be set to true.
	 * Later values will override earlier values.
	 *
	 * Array keys are also supported.  By default keys in the form of `name[i]`
	 * will be returned like that as strings.  However, if you set the `array`
	 * flag in the options object they will be parsed into arrays.  Note that
	 * although the object returned is an `Array` object all keys will be
	 * written to it.  This means that if you have a key such as `k[forEach]`
	 * it will overwrite the `forEach` function on that array.  Also note that
	 * string properties always take precedence over array properties,
	 * irrespective of where they are in the query string.
	 *
	 *   url.get("array[1]=test&array[foo]=bar",{array:true}).array[1]  === "test"
	 *   url.get("array[1]=test&array[foo]=bar",{array:true}).array.foo === "bar"
	 *   url.get("array=notanarray&array[0]=1",{array:true}).array      === "notanarray"
	 *
	 * If array parsing is enabled keys in the form of `name[]` will
	 * automatically be given the next available index.  Note that this can be
	 * overwritten with later values in the query string.  For this reason is
	 * is best not to mix the two formats, although it is safe (and often
	 * useful) to add an automatic index argument to the end of a query string.
	 *
	 *   url.get("a[]=0&a[]=1&a[0]=2", {array:true})  -> {a:["2","1"]};
	 *   url.get("a[0]=0&a[1]=1&a[]=2", {array:true}) -> {a:["0","1","2"]};
	 *
	 * @param{string} q The query string (the part after the '?').
	 * @param{{full:boolean,array:boolean}=} opt Options.
	 *
	 * - full: If set `q` will be treated as a full url and `q` will be built.
	 *   by calling #parse to retrieve the query portion.
	 * - array: If set keys in the form of `key[i]` will be treated
	 *   as arrays/maps.
	 *
	 * @return{!Object.<string, string|Array>} The parsed result.
	 */
	"get": function(q, opt){
		q = q || "";
		if ( typeof opt          == "undefined" ) opt = {};
		if ( typeof opt["full"]  == "undefined" ) opt["full"] = false;
		if ( typeof opt["array"] == "undefined" ) opt["array"] = false;
		
		if ( opt["full"] === true )
		{
			q = self["parse"](q, {"get":false})["query"] || "";
		}
		
		var o = {};
		
		var c = q.split("&");
		for (var i = 0; i < c.length; i++)
		{
			if (!c[i].length) continue;
			
			var d = c[i].indexOf("=");
			var k = c[i], v = true;
			if ( d >= 0 )
			{
				k = c[i].substr(0, d);
				v = c[i].substr(d+1);
				
				v = decodeURIComponent(v);
			}
			
			if (opt["array"])
			{
				var inds = [];
				var ind;
				var curo = o;
				var curk = k;
				while (ind = curk.match(array)) // Array!
				{
					curk = curk.substr(0, ind.index);
					inds.unshift(decodeURIComponent(ind[1]));
				}
				curk = decodeURIComponent(curk);
				if (inds.some(function(i)
				{
					if ( typeof curo[curk] == "undefined" ) curo[curk] = [];
					if (!Array.isArray(curo[curk]))
					{
						//console.log("url.get: Array property "+curk+" already exists as string!");
						return true;
					}
					
					curo = curo[curk];
					
					if ( i === "" ) i = curo.length;
					
					curk = i;
				})) continue;
				curo[curk] = v;
				continue;
			}
			
			k = decodeURIComponent(k);
			
			//typeof o[k] == "undefined" || console.log("Property "+k+" already exists!");
			o[k] = v;
		}
		
		return o;
	},
	
	/** Build a get query from an object.
	 *
	 * This constructs a query string from the kv pairs in `data`.  Calling
	 * #get on the string returned should return an object identical to the one
	 * passed in except all non-boolean scalar types become strings and all
	 * object types become arrays (non-integer keys are still present, see
	 * #get's documentation for more details).
	 *
	 * This always uses array syntax for describing arrays.  If you want to
	 * serialize them differently (like having the value be a JSON array and
	 * have a plain key) you will need to do that before passing it in.
	 *
	 * All keys and values are supported (binary data anyone?) as they are
	 * properly URL-encoded and #get properly decodes.
	 *
	 * @param{Object} data The kv pairs.
	 * @param{string} prefix The properly encoded array key to put the
	 *   properties.  Mainly intended for internal use.
	 * @return{string} A URL-safe string.
	 */
	"buildget": function(data, prefix){
		var itms = [];
		for ( var k in data )
		{
			var ek = encodeURIComponent(k);
			if ( typeof prefix != "undefined" )
				ek = prefix+"["+ek+"]";
			
			var v = data[k];
			
			switch (typeof v)
			{
				case 'boolean':
					if(v) itms.push(ek);
					break;
				case 'number':
					v = v.toString();
				case 'string':
					itms.push(ek+"="+encodeURIComponent(v));
					break;
				case 'object':
					itms.push(self["buildget"](v, ek));
					break;
			}
		}
		return itms.join("&");
	},
	
	/** Parse a URL
	 * 
	 * This breaks up a URL into components.  It attempts to be very liberal
	 * and returns the best result in most cases.  This means that you can
	 * often pass in part of a URL and get correct categories back.  Notably,
	 * this works for emails and Jabber IDs, as well as adding a '?' to the
	 * beginning of a string will parse the whole thing as a query string.  If
	 * an item is not found the property will be undefined.  In some cases an
	 * empty string will be returned if the surrounding syntax but the actual
	 * value is empty (example: "://example.com" will give a empty string for
	 * scheme.)  Notably the host name will always be set to something.
	 * 
	 * Returned properties.
	 * 
	 * - **scheme:** The url scheme. (ex: "mailto" or "https")
	 * - **user:** The username.
	 * - **pass:** The password.
	 * - **host:** The hostname. (ex: "localhost", "123.456.7.8" or "example.com")
	 * - **port:** The port, as a number. (ex: 1337)
	 * - **path:** The path. (ex: "/" or "/about.html")
	 * - **query:** "The query string. (ex: "foo=bar&v=17&format=json")
	 * - **get:** The query string parsed with get.  If `opt.get` is `false` this
	 *   will be absent
	 * - **hash:** The value after the hash. (ex: "myanchor")
	 *   be undefined even if `query` is set.
	 *
	 * @param{string} url The URL to parse.
	 * @param{{get:Object}=} opt Options:
	 *
	 * - get: An options argument to be passed to #get or false to not call #get.
	 *    **DO NOT** set `full`.
	 *
	 * @return{!Object} An object with the parsed values.
	 */
	"parse": function(url, opt) {
		
		if ( typeof opt == "undefined" ) opt = {};
		
		var md = url.match(regex) || [];
		
		var r = {
			"url":    url,
			
			"scheme": md[1],
			"user":   md[2],
			"pass":   md[3],
			"host":   md[4],
			"port":   md[5] && +md[5],
			"path":   md[6],
			"query":  md[7],
			"hash":   md[8],
		};
		
		if ( opt.get !== false )
			r["get"] = r["query"] && self["get"](r["query"], opt.get);
		
		return r;
	},
	
	/** Build a URL from components.
	 * 
	 * This pieces together a url from the properties of the passed in object.
	 * In general passing the result of `parse()` should return the URL.  There
	 * may differences in the get string as the keys and values might be more
	 * encoded then they were originally were.  However, calling `get()` on the
	 * two values should yield the same result.
	 * 
	 * Here is how the parameters are used.
	 * 
	 *  - url: Used only if no other values are provided.  If that is the case
	 *     `url` will be returned verbatim.
	 *  - scheme: Used if defined.
	 *  - user: Used if defined.
	 *  - pass: Used if defined.
	 *  - host: Used if defined.
	 *  - path: Used if defined.
	 *  - query: Used only if `get` is not provided and non-empty.
	 *  - get: Used if non-empty.  Passed to #buildget and the result is used
	 *    as the query string.
	 *  - hash: Used if defined.
	 * 
	 * These are the options that are valid on the options object.
	 * 
	 *  - useemptyget: If truthy, a question mark will be appended for empty get
	 *    strings.  This notably makes `build()` and `parse()` fully symmetric.
	 *
	 * @param{Object} data The pieces of the URL.
	 * @param{Object} opt Options for building the url.
	 * @return{string} The URL.
	 */
	"build": function(data, opt){
		opt = opt || {};
		
		var r = "";
		
		if ( typeof data["scheme"] != "undefined" )
		{
			r += data["scheme"];
			r += (noslash.indexOf(data["scheme"])>=0)?":":"://";
		}
		if ( typeof data["user"] != "undefined" )
		{
			r += data["user"];
			if ( typeof data["pass"] == "undefined" )
			{
				r += "@";
			}
		}
		if ( typeof data["pass"] != "undefined" ) r += ":" + data["pass"] + "@";
		if ( typeof data["host"] != "undefined" ) r += data["host"];
		if ( typeof data["port"] != "undefined" ) r += ":" + data["port"];
		if ( typeof data["path"] != "undefined" ) r += data["path"];
		
		if (opt["useemptyget"])
		{
			if      ( typeof data["get"]   != "undefined" ) r += "?" + self["buildget"](data["get"]);
			else if ( typeof data["query"] != "undefined" ) r += "?" + data["query"];
		}
		else
		{
			// If .get use it.  If .get leads to empty, use .query.
			var q = data["get"] && self["buildget"](data["get"]) || data["query"];
			if (q) r += "?" + q;
		}
		
		if ( typeof data["hash"] != "undefined" ) r += "#" + data["hash"];
		
		return r || data["url"] || "";
	},
};

if ( true ) !(__WEBPACK_AMD_DEFINE_FACTORY__ = (self),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) :
		__WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
else {}

}();


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!***********************************!*\
  !*** ./src/web/js/beforePyret.js ***!
  \***********************************/
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/* global $ jQuery CPO CodeMirror storageAPI Q createProgramCollectionAPI makeShareAPI */

var originalPageLoad = Date.now();
console.log("originalPageLoad: ", originalPageLoad);
var shareAPI = makeShareAPI("");
var url = window.url = __webpack_require__(/*! url.js */ "./node_modules/url.js/url.js");
var modalPrompt = __webpack_require__(/*! ./modal-prompt.js */ "./src/web/js/modal-prompt.js");
window.modalPrompt = modalPrompt;
var LOG = true;
window.ct_log = function /* varargs */
() {
  if (window.console && LOG) {
    console.log.apply(console, arguments);
  }
};
window.ct_error = function /* varargs */
() {
  if (window.console && LOG) {
    console.error.apply(console, arguments);
  }
};
var initialParams = url.parse(document.location.href);
var params = url.parse("/?" + initialParams["hash"]);
window.highlightMode = "mcmh"; // what is this for?
window.clearFlash = function () {
  $(".notificationArea").empty();
};
window.whiteToBlackNotification = function () {
  /*
  $(".notificationArea .active").css("background-color", "white");
  $(".notificationArea .active").animate({backgroundColor: "#111111" }, 1000);
  */
};
window.stickError = function (message, more) {
  CPO.sayAndForget(message);
  clearFlash();
  var err = $("<span>").addClass("error").text(message);
  if (more) {
    err.attr("title", more);
  }
  err.tooltip();
  $(".notificationArea").prepend(err);
  whiteToBlackNotification();
};
window.flashError = function (message) {
  CPO.sayAndForget(message);
  clearFlash();
  var err = $("<span>").addClass("error").text(message);
  $(".notificationArea").prepend(err);
  whiteToBlackNotification();
  err.fadeOut(7000);
};
window.flashMessage = function (message) {
  CPO.sayAndForget(message);
  clearFlash();
  var msg = $("<span>").addClass("active").text(message);
  $(".notificationArea").prepend(msg);
  whiteToBlackNotification();
  msg.fadeOut(7000);
};
window.stickMessage = function (message) {
  CPO.sayAndForget(message);
  clearFlash();
  var msg = $("<span>").addClass("active").text(message);
  $(".notificationArea").prepend(msg);
  whiteToBlackNotification();
};
window.stickRichMessage = function (content) {
  CPO.sayAndForget(content.text());
  clearFlash();
  $(".notificationArea").prepend($("<span>").addClass("active").append(content));
  whiteToBlackNotification();
};
window.mkWarningUpper = function () {
  return $("<div class='warning-upper'>");
};
window.mkWarningLower = function () {
  return $("<div class='warning-lower'>");
};
var Documents = function () {
  function Documents() {
    this.documents = new Map();
  }
  Documents.prototype.has = function (name) {
    return this.documents.has(name);
  };
  Documents.prototype.get = function (name) {
    return this.documents.get(name);
  };
  Documents.prototype.set = function (name, doc) {
    if (logger.isDetailed) logger.log("doc.set", {
      name: name,
      value: doc.getValue()
    });
    return this.documents.set(name, doc);
  };
  Documents.prototype["delete"] = function (name) {
    if (logger.isDetailed) logger.log("doc.del", {
      name: name
    });
    return this.documents["delete"](name);
  };
  Documents.prototype.forEach = function (f) {
    return this.documents.forEach(f);
  };
  return Documents;
}();
var VERSION_CHECK_INTERVAL = 120000 + 30000 * Math.random();
function checkVersion() {
  $.get("/current-version").then(function (resp) {
    resp = JSON.parse(resp);
    if (resp.version && resp.version !== "") {
      window.flashMessage("A new version of Pyret is available. Save and reload the page to get the newest version.");
    }
  });
}
window.setInterval(checkVersion, VERSION_CHECK_INTERVAL);
window.CPO = {
  save: function save() {},
  autoSave: function autoSave() {},
  documents: new Documents()
};
$(function () {
  var CONTEXT_FOR_NEW_FILES = "use context starter2024\n";
  var CONTEXT_PREFIX = /^use context\s+/;
  function merge(obj, extension) {
    var newobj = {};
    Object.keys(obj).forEach(function (k) {
      newobj[k] = obj[k];
    });
    Object.keys(extension).forEach(function (k) {
      newobj[k] = extension[k];
    });
    return newobj;
  }
  var animationDiv = null;
  function closeAnimationIfOpen() {
    if (animationDiv) {
      animationDiv.empty();
      animationDiv.dialog("destroy");
      animationDiv = null;
    }
  }
  CPO.makeEditor = function (container, options) {
    var initial = "";
    if (options.hasOwnProperty("initial")) {
      initial = options.initial;
    }
    var textarea = jQuery("<textarea aria-hidden='true'>");
    textarea.val(initial);
    container.append(textarea);
    var runFun = function runFun(code, replOptions) {
      options.run(code, {
        cm: CM
      }, replOptions);
    };
    var useLineNumbers = !options.simpleEditor;
    var useFolding = !options.simpleEditor;
    var gutters = !options.simpleEditor ? ["help-gutter", "CodeMirror-linenumbers", "CodeMirror-foldgutter"] : [];
    function reindentAllLines(cm) {
      var last = cm.lineCount();
      cm.operation(function () {
        for (var i = 0; i < last; ++i) cm.indentLine(i);
      });
    }
    var CODE_LINE_WIDTH = 100;
    var rulers, rulersMinCol;

    // place a vertical line in code editor, and not repl
    if (options.simpleEditor) {
      rulers = [];
    } else {
      rulers = [{
        color: "#317BCF",
        column: CODE_LINE_WIDTH,
        lineStyle: "dashed",
        className: "hidden"
      }];
      rulersMinCol = CODE_LINE_WIDTH;
    }
    var mac = CodeMirror.keyMap["default"] === CodeMirror.keyMap.macDefault;
    var modifier = mac ? "Cmd" : "Ctrl";
    var cmOptions = {
      extraKeys: CodeMirror.normalizeKeyMap(_defineProperty({
        "Shift-Enter": function ShiftEnter(cm) {
          runFun(cm.getValue());
        },
        "Shift-Ctrl-Enter": function ShiftCtrlEnter(cm) {
          runFun(cm.getValue());
        },
        "Tab": "indentAuto",
        "Ctrl-I": reindentAllLines,
        "Esc Left": "goBackwardSexp",
        "Alt-Left": "goBackwardSexp",
        "Esc Right": "goForwardSexp",
        "Alt-Right": "goForwardSexp",
        "Ctrl-Left": "goBackwardToken",
        "Ctrl-Right": "goForwardToken"
      }, "".concat(modifier, "-/"), "toggleComment")),
      indentUnit: 2,
      tabSize: 2,
      viewportMargin: Infinity,
      lineNumbers: useLineNumbers,
      matchKeywords: true,
      matchBrackets: true,
      styleSelectedText: true,
      foldGutter: useFolding,
      gutters: gutters,
      lineWrapping: true,
      logging: true,
      rulers: rulers,
      rulersMinCol: rulersMinCol,
      scrollPastEnd: true
    };
    cmOptions = merge(cmOptions, options.cmOptions || {});
    var CM = CodeMirror.fromTextArea(textarea[0], cmOptions);
    function firstLineIsNamespace() {
      var firstline = CM.getLine(0);
      var match = firstline.match(CONTEXT_PREFIX);
      return match !== null;
    }
    var namespacemark = null;
    function setContextLine(newContextLine) {
      var hasNamespace = firstLineIsNamespace();
      if (!hasNamespace && namespacemark !== null) {
        namespacemark.clear();
      }
      if (!hasNamespace) {
        CM.replaceRange(newContextLine, {
          line: 0,
          ch: 0
        }, {
          line: 0,
          ch: 0
        });
      } else {
        CM.replaceRange(newContextLine, {
          line: 0,
          ch: 0
        }, {
          line: 1,
          ch: 0
        });
      }
    }
    if (!options.simpleEditor) {
      var gutterQuestionWrapper = document.createElement("div");
      gutterQuestionWrapper.className = "gutter-question-wrapper";
      var gutterTooltip = document.createElement("span");
      gutterTooltip.className = "gutter-question-tooltip";
      gutterTooltip.innerText = "The use context line tells Pyret to load tools for a specific class context. It can be changed through the main Pyret menu. Most of the time you won't need to change this at all.";
      var gutterQuestion = document.createElement("img");
      gutterQuestion.src = "/img/question.png";
      gutterQuestion.className = "gutter-question";
      gutterQuestionWrapper.appendChild(gutterQuestion);
      gutterQuestionWrapper.appendChild(gutterTooltip);
      CM.setGutterMarker(0, "help-gutter", gutterQuestionWrapper);
      CM.getWrapperElement().onmouseleave = function (e) {
        CM.clearGutter("help-gutter");
      };

      // NOTE(joe): This seems to be the best way to get a hover on a mark: https://github.com/codemirror/CodeMirror/issues/3529
      CM.getWrapperElement().onmousemove = function (e) {
        var lineCh = CM.coordsChar({
          left: e.clientX,
          top: e.clientY
        });
        var markers = CM.findMarksAt(lineCh);
        if (markers.length === 0) {
          CM.clearGutter("help-gutter");
        }
        if (lineCh.line === 0 && markers[0] === namespacemark) {
          CM.setGutterMarker(0, "help-gutter", gutterQuestionWrapper);
        } else {
          CM.clearGutter("help-gutter");
        }
      };
      CM.on("change", function (change) {
        function doesNotChangeFirstLine(c) {
          return c.from.line !== 0;
        }
        if (change.curOp.changeObjs && change.curOp.changeObjs.every(doesNotChangeFirstLine)) {
          return;
        }
        var hasNamespace = firstLineIsNamespace();
        if (hasNamespace) {
          if (namespacemark) {
            namespacemark.clear();
          }
          namespacemark = CM.markText({
            line: 0,
            ch: 0
          }, {
            line: 1,
            ch: 0
          }, {
            attributes: {
              useline: true
            },
            className: "useline",
            atomic: true,
            inclusiveLeft: true,
            inclusiveRight: false
          });
        }
      });
    }
    if (useLineNumbers) {
      CM.display.wrapper.appendChild(mkWarningUpper()[0]);
      CM.display.wrapper.appendChild(mkWarningLower()[0]);
    }
    getTopTierMenuitems();
    return {
      cm: CM,
      setContextLine: setContextLine,
      refresh: function refresh() {
        CM.refresh();
      },
      run: function run() {
        runFun(CM.getValue());
      },
      focus: function focus() {
        CM.focus();
      },
      focusCarousel: null //initFocusCarousel
    };
  };
  CPO.RUN_CODE = function () {
    console.log("Running before ready", arguments);
  };
  function setUsername(target) {
    return gwrap.load({
      name: 'plus',
      version: 'v1'
    }).then(function (api) {
      api.people.get({
        userId: "me"
      }).then(function (user) {
        var name = user.displayName;
        if (user.emails && user.emails[0] && user.emails[0].value) {
          name = user.emails[0].value;
        }
        target.text(name);
      });
    });
  }
  storageAPI.then(function (api) {
    api.collection.then(function () {
      $(".loginOnly").show();
      $(".logoutOnly").hide();
      setUsername($("#username"));
    });
    api.collection.fail(function () {
      $(".loginOnly").hide();
      $(".logoutOnly").show();
    });
  });
  storageAPI = storageAPI.then(function (api) {
    return api.api;
  });
  $("#fullConnectButton").click(function () {
    reauth(false,
    // Don't do an immediate load (this will require login)
    true // Use the full set of scopes for this login
    );
  });
  $("#connectButton").click(function () {
    $("#connectButton").text("Connecting...");
    $("#connectButton").attr("disabled", "disabled");
    $('#connectButtonli').attr('disabled', 'disabled');
    $("#connectButton").attr("tabIndex", "-1");
    //$("#topTierUl").attr("tabIndex", "0");
    getTopTierMenuitems();
    storageAPI = createProgramCollectionAPI("code.pyret.org", false);
    storageAPI.then(function (api) {
      api.collection.then(function () {
        $(".loginOnly").show();
        $(".logoutOnly").hide();
        document.activeElement.blur();
        $("#bonniemenubutton").focus();
        setUsername($("#username"));
        if (params["get"] && params["get"]["program"]) {
          var toLoad = api.api.getFileById(params["get"]["program"]);
          console.log("Logged in and has program to load: ", toLoad);
          loadProgram(toLoad);
          programToSave = toLoad;
        } else {
          programToSave = Q.fcall(function () {
            return null;
          });
        }
      });
      api.collection.fail(function () {
        $("#connectButton").text("Connect to Google Drive");
        $("#connectButton").attr("disabled", false);
        $('#connectButtonli').attr('disabled', false);
        //$("#connectButton").attr("tabIndex", "0");
        document.activeElement.blur();
        $("#connectButton").focus();
        //$("#topTierUl").attr("tabIndex", "-1");
      });
    });
    storageAPI = storageAPI.then(function (api) {
      return api.api;
    });
  });

  /*
    initialProgram holds a promise for a Drive File object or null
     It's null if the page doesn't have a #share or #program url
     If the url does have a #program or #share, the promise is for the
    corresponding object.
  */
  var initialProgram = storageAPI.then(function (api) {
    var programLoad = null;
    if (params["get"] && params["get"]["program"]) {
      enableFileOptions();
      programLoad = api.getFileById(params["get"]["program"]);
      programLoad.then(function (p) {
        showShareContainer(p);
      });
    } else if (params["get"] && params["get"]["share"]) {
      logger.log('shared-program-load', {
        id: params["get"]["share"]
      });
      programLoad = api.getSharedFileById(params["get"]["share"]);
      programLoad.then(function (file) {
        // NOTE(joe): If the current user doesn't own or have access to this file
        // (or isn't logged in) this will simply fail with a 401, so we don't do
        // any further permission checking before showing the link.
        file.getOriginal().then(function (response) {
          console.log("Response for original: ", response);
          var original = $("#open-original").show().off("click");
          var id = response.result.value;
          original.removeClass("hidden");
          original.click(function () {
            window.open(window.APP_BASE_URL + "/editor#program=" + id, "_blank");
          });
        });
      });
    } else {
      programLoad = null;
    }
    if (programLoad) {
      programLoad.fail(function (err) {
        console.error(err);
        window.stickError("The program failed to load.");
      });
      return programLoad;
    } else {
      return null;
    }
  });
  function setTitle(progName) {
    document.title = progName + " - code.pyret.org";
    $("#showFilename").text("File: " + progName);
  }
  CPO.setTitle = setTitle;
  var filename = false;
  $("#download a").click(function () {
    var downloadElt = $("#download a");
    var contents = CPO.editor.cm.getValue();
    var downloadBlob = window.URL.createObjectURL(new Blob([contents], {
      type: 'text/plain'
    }));
    if (!filename) {
      filename = 'untitled_program.arr';
    }
    if (filename.indexOf(".arr") !== filename.length - 4) {
      filename += ".arr";
    }
    downloadElt.attr({
      download: filename,
      href: downloadBlob
    });
    $("#download").append(downloadElt);
  });
  function showModal(currentContext) {
    function drawElement(input) {
      var element = $("<div>");
      var greeting = $("<p>");
      var shared = $("<tt>shared-gdrive(...)</tt>");
      var currentContextElt = $("<tt>" + currentContext + "</tt>");
      greeting.append("Enter the context to use for the program, or choose “Cancel” to keep the current context of ", currentContextElt, ".");
      var essentials = $("<tt>starter2024</tt>");
      var list = $("<ul>").append($("<li>").append("The default is ", essentials, ".")).append($("<li>").append("You might use something like ", shared, " if one was provided as part of a course."));
      element.append(greeting);
      element.append($("<p>").append(list));
      var useContext = $("<tt>use context</tt>").css({
        'flex-grow': '0',
        'padding-right': '1em'
      });
      var inputWrapper = $("<div>").append(input).css({
        'flex-grow': '1'
      });
      var entry = $("<div>").css({
        display: 'flex',
        'flex-direction': 'row',
        'justify-content': 'flex-start',
        'align-items': 'baseline'
      });
      entry.append(useContext).append(inputWrapper);
      element.append(entry);
      return element;
    }
    var namespaceResult = new modalPrompt({
      title: "Choose a Context",
      style: "text",
      options: [{
        drawElement: drawElement,
        submitText: "Change Namespace",
        defaultValue: currentContext
      }]
    });
    namespaceResult.show(function (result) {
      if (!result) {
        return;
      }
      CPO.editor.setContextLine("use context " + result.trim() + "\n");
    });
  }
  $("#choose-context").on("click", function () {
    var firstLine = CPO.editor.cm.getLine(0);
    var contextLen = firstLine.match(CONTEXT_PREFIX);
    showModal(contextLen === null ? "" : firstLine.slice(contextLen[0].length));
  });
  var TRUNCATE_LENGTH = 20;
  function truncateName(name) {
    if (name.length <= TRUNCATE_LENGTH + 1) {
      return name;
    }
    return name.slice(0, TRUNCATE_LENGTH / 2) + "…" + name.slice(name.length - TRUNCATE_LENGTH / 2, name.length);
  }
  function updateName(p) {
    filename = p.getName();
    $("#filename").text(" (" + truncateName(filename) + ")");
    setTitle(filename);
    showShareContainer(p);
  }
  function loadProgram(p) {
    programToSave = p;
    return p.then(function (prog) {
      if (prog !== null) {
        updateName(prog);
        if (prog.shared) {
          window.stickMessage("You are viewing a shared program. Any changes you make will not be saved. You can use File -> Save a copy to save your own version with any edits you make.");
        }
        return prog.getContents();
      } else {
        if (params["get"]["editorContents"] && !(params["get"]["program"] || params["get"]["share"])) {
          return params["get"]["editorContents"];
        } else {
          return CONTEXT_FOR_NEW_FILES;
        }
      }
    });
  }
  function say(msg, forget) {
    if (msg === "") return;
    var announcements = document.getElementById("announcementlist");
    var li = document.createElement("LI");
    li.appendChild(document.createTextNode(msg));
    announcements.insertBefore(li, announcements.firstChild);
    if (forget) {
      setTimeout(function () {
        announcements.removeChild(li);
      }, 1000);
    }
  }
  function sayAndForget(msg) {
    console.log('doing sayAndForget', msg);
    say(msg, true);
  }
  function cycleAdvance(currIndex, maxIndex, reverseP) {
    var nextIndex = currIndex + (reverseP ? -1 : +1);
    nextIndex = (nextIndex % maxIndex + maxIndex) % maxIndex;
    return nextIndex;
  }
  function populateFocusCarousel(editor) {
    if (!editor.focusCarousel) {
      editor.focusCarousel = [];
    }
    var fc = editor.focusCarousel;
    var docmain = document.getElementById("main");
    if (!fc[0]) {
      var toolbar = document.getElementById('Toolbar');
      fc[0] = toolbar;
      //fc[0] = document.getElementById("headeronelegend");
      //getTopTierMenuitems();
      //fc[0] = document.getElementById('bonniemenubutton');
    }
    if (!fc[1]) {
      var docreplMain = docmain.getElementsByClassName("replMain");
      var docreplMain0;
      if (docreplMain.length === 0) {
        docreplMain0 = undefined;
      } else if (docreplMain.length === 1) {
        docreplMain0 = docreplMain[0];
      } else {
        for (var i = 0; i < docreplMain.length; i++) {
          if (docreplMain[i].innerText !== "") {
            docreplMain0 = docreplMain[i];
          }
        }
      }
      fc[1] = docreplMain0;
    }
    if (!fc[2]) {
      var docrepl = docmain.getElementsByClassName("repl");
      var docreplcode = docrepl[0].getElementsByClassName("prompt-container")[0].getElementsByClassName("CodeMirror")[0];
      fc[2] = docreplcode;
    }
    if (!fc[3]) {
      fc[3] = document.getElementById("announcements");
    }
  }
  function cycleFocus(reverseP) {
    //console.log('doing cycleFocus', reverseP);
    var editor = this.editor;
    populateFocusCarousel(editor);
    var fCarousel = editor.focusCarousel;
    var maxIndex = fCarousel.length;
    var currentFocusedElt = fCarousel.find(function (node) {
      if (!node) {
        return false;
      } else {
        return node.contains(document.activeElement);
      }
    });
    var currentFocusIndex = fCarousel.indexOf(currentFocusedElt);
    var nextFocusIndex = currentFocusIndex;
    var focusElt;
    do {
      nextFocusIndex = cycleAdvance(nextFocusIndex, maxIndex, reverseP);
      focusElt = fCarousel[nextFocusIndex];
      //console.log('trying focusElt', focusElt);
    } while (!focusElt);
    var focusElt0;
    if (focusElt.classList.contains('toolbarregion')) {
      //console.log('settling on toolbar region')
      getTopTierMenuitems();
      focusElt0 = document.getElementById('bonniemenubutton');
    } else if (focusElt.classList.contains("replMain") || focusElt.classList.contains("CodeMirror")) {
      //console.log('settling on defn window')
      var textareas = focusElt.getElementsByTagName("textarea");
      //console.log('txtareas=', textareas)
      //console.log('txtarea len=', textareas.length)
      if (textareas.length === 0) {
        //console.log('I')
        focusElt0 = focusElt;
      } else if (textareas.length === 1) {
        //console.log('settling on inter window')
        focusElt0 = textareas[0];
      } else {
        //console.log('settling on defn window')
        /*
        for (var i = 0; i < textareas.length; i++) {
          if (textareas[i].getAttribute('tabIndex')) {
            focusElt0 = textareas[i];
          }
        }
        */
        focusElt0 = textareas[textareas.length - 1];
        focusElt0.removeAttribute('tabIndex');
      }
    } else {
      //console.log('settling on announcement region', focusElt)
      focusElt0 = focusElt;
    }
    document.activeElement.blur();
    focusElt0.click();
    focusElt0.focus();
    //console.log('(cf)docactelt=', document.activeElement);
  }
  var programLoaded = loadProgram(initialProgram);
  var programToSave = initialProgram;
  function showShareContainer(p) {
    //console.log('called showShareContainer');
    if (!p.shared) {
      $("#shareContainer").empty();
      $('#publishli').show();
      $("#shareContainer").append(shareAPI.makeShareLink(p));
      getTopTierMenuitems();
    }
  }
  function nameOrUntitled() {
    return filename || "Untitled";
  }
  function autoSave() {
    programToSave.then(function (p) {
      if (p !== null && !p.shared) {
        save();
      }
    });
  }
  function enableFileOptions() {
    $("#filemenuContents *").removeClass("disabled");
  }
  function menuItemDisabled(id) {
    return $("#" + id).hasClass("disabled");
  }
  function newEvent(e) {
    window.open(window.APP_BASE_URL + "/editor");
  }
  function saveEvent(e) {
    if (menuItemDisabled("save")) {
      return;
    }
    return save();
  }

  /*
    save : string (optional) -> undef
     If a string argument is provided, create a new file with that name and save
    the editor contents in that file.
     If no filename is provided, save the existing file referenced by the editor
    with the current editor contents.  If no filename has been set yet, just
    set the name to "Untitled".
   */
  function save(newFilename) {
    var useName, create;
    if (newFilename !== undefined) {
      useName = newFilename;
      create = true;
    } else if (filename === false) {
      filename = "Untitled";
      create = true;
    } else {
      useName = filename; // A closed-over variable
      create = false;
    }
    window.stickMessage("Saving...");
    var savedProgram = programToSave.then(function (p) {
      if (p !== null && p.shared && !create) {
        return p; // Don't try to save shared files
      }
      if (create) {
        programToSave = storageAPI.then(function (api) {
          return api.createFile(useName);
        }).then(function (p) {
          // showShareContainer(p); TODO(joe): figure out where to put this
          history.pushState(null, null, "#program=" + p.getUniqueId());
          updateName(p); // sets filename
          enableFileOptions();
          return p;
        });
        return programToSave.then(function (p) {
          return save();
        });
      } else {
        return programToSave.then(function (p) {
          if (p === null) {
            return null;
          } else {
            return p.save(CPO.editor.cm.getValue(), false);
          }
        }).then(function (p) {
          if (p !== null) {
            window.flashMessage("Program saved as " + p.getName());
          }
          return p;
        });
      }
    });
    savedProgram.fail(function (err) {
      window.stickError("Unable to save", "Your internet connection may be down, or something else might be wrong with this site or saving to Google.  You should back up any changes to this program somewhere else.  You can try saving again to see if the problem was temporary, as well.");
      console.error(err);
    });
    return savedProgram;
  }
  function saveAs() {
    if (menuItemDisabled("saveas")) {
      return;
    }
    programToSave.then(function (p) {
      var name = p === null ? "Untitled" : p.getName();
      var saveAsPrompt = new modalPrompt({
        title: "Save a copy",
        style: "text",
        submitText: "Save",
        narrow: true,
        options: [{
          message: "The name for the copy:",
          defaultValue: name
        }]
      });
      return saveAsPrompt.show().then(function (newName) {
        if (newName === null) {
          return null;
        }
        window.stickMessage("Saving...");
        return save(newName);
      }).fail(function (err) {
        console.error("Failed to rename: ", err);
        window.flashError("Failed to rename file");
      });
    });
  }
  function rename() {
    programToSave.then(function (p) {
      var renamePrompt = new modalPrompt({
        title: "Rename this file",
        style: "text",
        narrow: true,
        submitText: "Rename",
        options: [{
          message: "The new name for the file:",
          defaultValue: p.getName()
        }]
      });
      // null return values are for the "cancel" path
      return renamePrompt.show().then(function (newName) {
        if (newName === null) {
          return null;
        }
        window.stickMessage("Renaming...");
        programToSave = p.rename(newName);
        return programToSave;
      }).then(function (p) {
        if (p === null) {
          return null;
        }
        updateName(p);
        window.flashMessage("Program saved as " + p.getName());
      }).fail(function (err) {
        console.error("Failed to rename: ", err);
        window.flashError("Failed to rename file");
      });
    }).fail(function (err) {
      console.error("Unable to rename: ", err);
    });
  }
  $("#runButton").click(function () {
    CPO.autoSave();
  });
  $("#new").click(newEvent);
  $("#save").click(saveEvent);
  $("#rename").click(rename);
  $("#saveas").click(saveAs);
  var focusableElts = $(document).find('#header .focusable');
  //console.log('focusableElts=', focusableElts)
  var theToolbar = $(document).find('#Toolbar');
  function getTopTierMenuitems() {
    //console.log('doing getTopTierMenuitems')
    var topTierMenuitems = $(document).find('#header ul li.topTier').toArray();
    topTierMenuitems = topTierMenuitems.filter(function (elt) {
      return !(elt.style.display === 'none' || elt.getAttribute('disabled') === 'disabled');
    });
    var numTopTierMenuitems = topTierMenuitems.length;
    for (var i = 0; i < numTopTierMenuitems; i++) {
      var ithTopTierMenuitem = topTierMenuitems[i];
      var iChild = $(ithTopTierMenuitem).children().first();
      //console.log('iChild=', iChild);
      iChild.find('.focusable').attr('aria-setsize', numTopTierMenuitems.toString()).attr('aria-posinset', (i + 1).toString());
    }
    return topTierMenuitems;
  }
  function updateEditorHeight() {
    var toolbarHeight = document.getElementById('topTierUl').offsetHeight;
    // gets bumped to 67 on initial resize perturbation, but actual value is indeed 40
    if (toolbarHeight < 80) toolbarHeight = 40;
    toolbarHeight += 'px';
    document.getElementById('REPL').style.paddingTop = toolbarHeight;
    var docMain = document.getElementById('main');
    var docReplMain = docMain.getElementsByClassName('replMain');
    if (docReplMain.length !== 0) {
      docReplMain[0].style.paddingTop = toolbarHeight;
    }
  }
  $(window).on('resize', updateEditorHeight);
  function insertAriaPos(submenu) {
    //console.log('doing insertAriaPos', submenu)
    var arr = submenu.toArray();
    //console.log('arr=', arr);
    var len = arr.length;
    for (var i = 0; i < len; i++) {
      var elt = arr[i];
      //console.log('elt', i, '=', elt);
      elt.setAttribute('aria-setsize', len.toString());
      elt.setAttribute('aria-posinset', (i + 1).toString());
    }
  }
  document.addEventListener('click', function () {
    hideAllTopMenuitems();
  });
  theToolbar.click(function (e) {
    e.stopPropagation();
  });
  theToolbar.keydown(function (e) {
    //console.log('toolbar keydown', e);
    //most any key at all
    var kc = e.keyCode;
    if (kc === 27) {
      // escape
      hideAllTopMenuitems();
      //console.log('calling cycleFocus from toolbar')
      CPO.cycleFocus();
      e.stopPropagation();
    } else if (kc === 9 || kc === 37 || kc === 38 || kc === 39 || kc === 40) {
      // an arrow
      var target = $(this).find('[tabIndex=-1]');
      getTopTierMenuitems();
      document.activeElement.blur(); //needed?
      target.first().focus(); //needed?
      //console.log('docactelt=', document.activeElement);
      e.stopPropagation();
    } else {
      hideAllTopMenuitems();
    }
  });
  function clickTopMenuitem(e) {
    hideAllTopMenuitems();
    var thisElt = $(this);
    //console.log('doing clickTopMenuitem on', thisElt);
    var topTierUl = thisElt.closest('ul[id=topTierUl]');
    if (thisElt[0].hasAttribute('aria-hidden')) {
      return;
    }
    if (thisElt[0].getAttribute('disabled') === 'disabled') {
      return;
    }
    //var hiddenP = (thisElt[0].getAttribute('aria-expanded') === 'false');
    //hiddenP always false?
    var thisTopMenuitem = thisElt.closest('li.topTier');
    //console.log('thisTopMenuitem=', thisTopMenuitem);
    var t1 = thisTopMenuitem[0];
    var submenuOpen = thisElt[0].getAttribute('aria-expanded') === 'true';
    if (!submenuOpen) {
      //console.log('hiddenp true branch');
      hideAllTopMenuitems();
      thisTopMenuitem.children('ul.submenu').attr('aria-hidden', 'false').show();
      thisTopMenuitem.children().first().find('[aria-expanded]').attr('aria-expanded', 'true');
    } else {
      //console.log('hiddenp false branch');
      thisTopMenuitem.children('ul.submenu').attr('aria-hidden', 'true').hide();
      thisTopMenuitem.children().first().find('[aria-expanded]').attr('aria-expanded', 'false');
    }
    e.stopPropagation();
  }
  var expandableElts = $(document).find('#header [aria-expanded]');
  expandableElts.click(clickTopMenuitem);
  function hideAllTopMenuitems() {
    //console.log('doing hideAllTopMenuitems');
    var topTierUl = $(document).find('#header ul[id=topTierUl]');
    topTierUl.find('[aria-expanded]').attr('aria-expanded', 'false');
    topTierUl.find('ul.submenu').attr('aria-hidden', 'true').hide();
  }
  var nonexpandableElts = $(document).find('#header .topTier > div > button:not([aria-expanded])');
  nonexpandableElts.click(hideAllTopMenuitems);
  function switchTopMenuitem(destTopMenuitem, destElt) {
    //console.log('doing switchTopMenuitem', destTopMenuitem, destElt);
    //console.log('dtmil=', destTopMenuitem.length);
    hideAllTopMenuitems();
    if (destTopMenuitem && destTopMenuitem.length !== 0) {
      var elt = destTopMenuitem[0];
      var eltId = elt.getAttribute('id');
      destTopMenuitem.children('ul.submenu').attr('aria-hidden', 'false').show();
      destTopMenuitem.children().first().find('[aria-expanded]').attr('aria-expanded', 'true');
    }
    if (destElt) {
      //destElt.attr('tabIndex', '0').focus();
      destElt.focus();
    }
  }
  var showingHelpKeys = false;
  function showHelpKeys() {
    showingHelpKeys = true;
    $('#help-keys').fadeIn(100);
    reciteHelp();
  }
  focusableElts.keydown(function (e) {
    //console.log('focusable elt keydown', e);
    var kc = e.keyCode;
    //$(this).blur(); // Delete?
    var withinSecondTierUl = true;
    var topTierUl = $(this).closest('ul[id=topTierUl]');
    var secondTierUl = $(this).closest('ul.submenu');
    if (secondTierUl.length === 0) {
      withinSecondTierUl = false;
    }
    if (kc === 27) {
      //console.log('escape pressed i')
      $('#help-keys').fadeOut(500);
    }
    if (kc === 27 && withinSecondTierUl) {
      // escape
      var destTopMenuitem = $(this).closest('li.topTier');
      var possElts = destTopMenuitem.find('.focusable:not([disabled])').filter(':visible');
      switchTopMenuitem(destTopMenuitem, possElts.first());
      e.stopPropagation();
    } else if (kc === 39) {
      // rightarrow
      //console.log('rightarrow pressed');
      var srcTopMenuitem = $(this).closest('li.topTier');
      //console.log('srcTopMenuitem=', srcTopMenuitem);
      srcTopMenuitem.children().first().find('.focusable').attr('tabIndex', '-1');
      var topTierMenuitems = getTopTierMenuitems();
      //console.log('ttmi* =', topTierMenuitems);
      var ttmiN = topTierMenuitems.length;
      var j = topTierMenuitems.indexOf(srcTopMenuitem[0]);
      //console.log('j initial=', j);
      for (var i = (j + 1) % ttmiN; i !== j; i = (i + 1) % ttmiN) {
        var destTopMenuitem = $(topTierMenuitems[i]);
        //console.log('destTopMenuitem(a)=', destTopMenuitem);
        var possElts = destTopMenuitem.find('.focusable:not([disabled])').filter(':visible');
        //console.log('possElts=', possElts)
        if (possElts.length > 0) {
          //console.log('final i=', i);
          //console.log('landing on', possElts.first());
          switchTopMenuitem(destTopMenuitem, possElts.first());
          e.stopPropagation();
          break;
        }
      }
    } else if (kc === 37) {
      // leftarrow
      //console.log('leftarrow pressed');
      var srcTopMenuitem = $(this).closest('li.topTier');
      //console.log('srcTopMenuitem=', srcTopMenuitem);
      srcTopMenuitem.children().first().find('.focusable').attr('tabIndex', '-1');
      var topTierMenuitems = getTopTierMenuitems();
      //console.log('ttmi* =', topTierMenuitems);
      var ttmiN = topTierMenuitems.length;
      var j = topTierMenuitems.indexOf(srcTopMenuitem[0]);
      //console.log('j initial=', j);
      for (var i = (j + ttmiN - 1) % ttmiN; i !== j; i = (i + ttmiN - 1) % ttmiN) {
        var destTopMenuitem = $(topTierMenuitems[i]);
        //console.log('destTopMenuitem(b)=', destTopMenuitem);
        //console.log('i=', i)
        var possElts = destTopMenuitem.find('.focusable:not([disabled])').filter(':visible');
        //console.log('possElts=', possElts)
        if (possElts.length > 0) {
          //console.log('final i=', i);
          //console.log('landing on', possElts.first());
          switchTopMenuitem(destTopMenuitem, possElts.first());
          e.stopPropagation();
          break;
        }
      }
    } else if (kc === 38) {
      // uparrow
      //console.log('uparrow pressed');
      var submenu;
      if (withinSecondTierUl) {
        var nearSibs = $(this).closest('div').find('.focusable').filter(':visible');
        //console.log('nearSibs=', nearSibs);
        var myId = $(this)[0].getAttribute('id');
        //console.log('myId=', myId);
        submenu = $([]);
        var thisEncountered = false;
        for (var i = nearSibs.length - 1; i >= 0; i--) {
          if (thisEncountered) {
            //console.log('adding', nearSibs[i]);
            submenu = submenu.add($(nearSibs[i]));
          } else if (nearSibs[i].getAttribute('id') === myId) {
            thisEncountered = true;
          }
        }
        //console.log('submenu so far=', submenu);
        var farSibs = $(this).closest('li').prevAll().find('div:not(.disabled)').find('.focusable').filter(':visible');
        submenu = submenu.add(farSibs);
        if (submenu.length === 0) {
          submenu = $(this).closest('li').closest('ul').find('div:not(.disabled)').find('.focusable').filter(':visible').last();
        }
        if (submenu.length > 0) {
          submenu.last().focus();
        } else {
          /*
          //console.log('no actionable submenu found')
          var topmenuItem = $(this).closest('ul.submenu').closest('li')
          .children().first().find('.focusable:not([disabled])').filter(':visible');
          if (topmenuItem.length > 0) {
            topmenuItem.first().focus();
          } else {
            //console.log('no actionable topmenuitem found either')
          }
          */
        }
      }
      e.stopPropagation();
    } else if (kc === 40) {
      // downarrow
      //console.log('downarrow pressed');
      var submenuDivs;
      var submenu;
      if (!withinSecondTierUl) {
        //console.log('1st tier')
        submenuDivs = $(this).closest('li').children('ul').find('div:not(.disabled)');
        submenu = submenuDivs.find('.focusable').filter(':visible');
        insertAriaPos(submenu);
      } else {
        //console.log('2nd tier')
        var nearSibs = $(this).closest('div').find('.focusable').filter(':visible');
        //console.log('nearSibs=', nearSibs);
        var myId = $(this)[0].getAttribute('id');
        //console.log('myId=', myId);
        submenu = $([]);
        var thisEncountered = false;
        for (var i = 0; i < nearSibs.length; i++) {
          if (thisEncountered) {
            //console.log('adding', nearSibs[i]);
            submenu = submenu.add($(nearSibs[i]));
          } else if (nearSibs[i].getAttribute('id') === myId) {
            thisEncountered = true;
          }
        }
        //console.log('submenu so far=', submenu);
        var farSibs = $(this).closest('li').nextAll().find('div:not(.disabled)').find('.focusable').filter(':visible');
        submenu = submenu.add(farSibs);
        if (submenu.length === 0) {
          submenu = $(this).closest('li').closest('ul').find('div:not(.disabled)').find('.focusable').filter(':visible');
        }
      }
      //console.log('submenu=', submenu)
      if (submenu.length > 0) {
        submenu.first().focus();
      } else {
        //console.log('no actionable submenu found')
      }
      e.stopPropagation();
    } else if (kc === 27) {
      //console.log('esc pressed');
      hideAllTopMenuitems();
      if (showingHelpKeys) {
        showingHelpKeys = false;
      } else {
        //console.log('calling cycleFocus ii')
        CPO.cycleFocus();
      }
      e.stopPropagation();
      e.preventDefault();
      //$(this).closest('nav').closest('main').focus();
    } else if (kc === 9) {
      if (e.shiftKey) {
        hideAllTopMenuitems();
        CPO.cycleFocus(true);
      }
      e.stopPropagation();
      e.preventDefault();
    } else if (kc === 13 || kc === 17 || kc === 20 || kc === 32) {
      // 13=enter 17=ctrl 20=capslock 32=space
      //console.log('stopprop 1')
      e.stopPropagation();
    } else if (kc >= 112 && kc <= 123) {
      //console.log('doprop 1')
      // fn keys
      // go ahead, propagate
    } else if (e.ctrlKey && kc === 191) {
      //console.log('C-? pressed')
      showHelpKeys();
      e.stopPropagation();
    } else {
      //console.log('stopprop 2')
      e.stopPropagation();
    }
    //e.stopPropagation();
  });

  // shareAPI.makeHoverMenu($("#filemenu"), $("#filemenuContents"), false, function(){});
  // shareAPI.makeHoverMenu($("#bonniemenu"), $("#bonniemenuContents"), false, function(){});

  var codeContainer = $("<div>").addClass("replMain");
  codeContainer.attr("role", "region").attr("aria-label", "Definitions");
  //attr("tabIndex", "-1");
  $("#main").prepend(codeContainer);
  if (params["get"]["hideDefinitions"]) {
    $(".replMain").attr("aria-hidden", true).attr("tabindex", '-1');
  }
  if (!("warnOnExit" in params["get"]) || params["get"]["warnOnExit"] !== "false") {
    $(window).bind("beforeunload", function () {
      return "Because this page can load slowly, and you may have outstanding changes, we ask that you confirm before leaving the editor in case closing was an accident.";
    });
  }
  CPO.editor = CPO.makeEditor(codeContainer, {
    runButton: $("#runButton"),
    simpleEditor: false,
    run: CPO.RUN_CODE,
    initialGas: 100,
    scrollPastEnd: true
  });
  CPO.editor.cm.setOption("readOnly", "nocursor");
  CPO.editor.cm.setOption("longLines", new Map());
  function removeShortenedLine(lineHandle) {
    var rulers = CPO.editor.cm.getOption("rulers");
    var rulersMinCol = CPO.editor.cm.getOption("rulersMinCol");
    var longLines = CPO.editor.cm.getOption("longLines");
    if (lineHandle.text.length <= rulersMinCol) {
      lineHandle.rulerListeners.forEach(function (f, evt) {
        return lineHandle.off(evt, f);
      });
      longLines["delete"](lineHandle);
      // console.log("Removed ", lineHandle);
      refreshRulers();
    }
  }
  function deleteLine(lineHandle) {
    var longLines = CPO.editor.cm.getOption("longLines");
    lineHandle.rulerListeners.forEach(function (f, evt) {
      return lineHandle.off(evt, f);
    });
    longLines["delete"](lineHandle);
    // console.log("Removed ", lineHandle);
    refreshRulers();
  }
  function refreshRulers() {
    var rulers = CPO.editor.cm.getOption("rulers");
    var longLines = CPO.editor.cm.getOption("longLines");
    var minLength;
    if (longLines.size === 0) {
      minLength = 0; // if there are no long lines, then we don't care about showing any rulers
    } else {
      minLength = Number.MAX_VALUE;
      longLines.forEach(function (lineNo, lineHandle) {
        if (lineHandle.text.length < minLength) {
          minLength = lineHandle.text.length;
        }
      });
    }
    for (var i = 0; i < rulers.length; i++) {
      if (rulers[i].column >= minLength) {
        rulers[i].className = "hidden";
      } else {
        rulers[i].className = undefined;
      }
    }
    // gotta set the option twice, or else CM short-circuits and ignores it
    CPO.editor.cm.setOption("rulers", undefined);
    CPO.editor.cm.setOption("rulers", rulers);
  }
  CPO.editor.cm.on('changes', function (instance, changeObjs) {
    var minLine = instance.lastLine(),
      maxLine = 0;
    var rulersMinCol = instance.getOption("rulersMinCol");
    var longLines = instance.getOption("longLines");
    changeObjs.forEach(function (change) {
      if (minLine > change.from.line) {
        minLine = change.from.line;
      }
      if (maxLine < change.from.line + change.text.length) {
        maxLine = change.from.line + change.text.length;
      }
    });
    var changed = false;
    instance.eachLine(minLine, maxLine, function (lineHandle) {
      if (lineHandle.text.length > rulersMinCol) {
        if (!longLines.has(lineHandle)) {
          changed = true;
          longLines.set(lineHandle, lineHandle.lineNo());
          lineHandle.rulerListeners = new Map([["change", removeShortenedLine], ["delete", function () {
            // needed because the delete handler gets no arguments at all
            deleteLine(lineHandle);
          }]]);
          lineHandle.rulerListeners.forEach(function (f, evt) {
            return lineHandle.on(evt, f);
          });
          // console.log("Added ", lineHandle);
        }
      } else {
        if (longLines.has(lineHandle)) {
          changed = true;
          longLines["delete"](lineHandle);
          // console.log("Removed ", lineHandle);
        }
      }
    });
    if (changed) {
      refreshRulers();
    }
  });
  programLoaded.then(function (c) {
    CPO.documents.set("definitions://", CPO.editor.cm.getDoc());
    if (c === "") {
      c = CONTEXT_FOR_NEW_FILES;
    }
    if (c.startsWith("<scriptsonly")) {
      // this is blocks file. Open it with /blocks
      window.location.href = window.location.href.replace('editor', 'blocks');
    }
    if (!params["get"]["controlled"]) {
      // NOTE(joe): Clearing history to address https://github.com/brownplt/pyret-lang/issues/386,
      // in which undo can revert the program back to empty
      CPO.editor.cm.setValue(c);
      CPO.editor.cm.clearHistory();
    }
  });
  programLoaded.fail(function () {
    CPO.documents.set("definitions://", CPO.editor.cm.getDoc());
  });
  console.log("About to load Pyret: ", originalPageLoad, Date.now());
  var pyretLoad = document.createElement('script');
  console.log(window.PYRET);
  pyretLoad.src = window.PYRET;
  pyretLoad.type = "text/javascript";
  document.body.appendChild(pyretLoad);
  var pyretLoad2 = document.createElement('script');
  function logFailureAndManualFetch(url, e) {
    // NOTE(joe): The error reported by the "error" event has essentially no
    // information on it; it's just a notification that _something_ went wrong.
    // So, we log that something happened, then immediately do an AJAX request
    // call for the same URL, to see if we can get more information. This
    // doesn't perfectly tell us about the original failure, but it's
    // something.

    // In addition, if someone is seeing the Pyret failed to load error, but we
    // don't get these logging events, we have a strong hint that something is
    // up with their network.
    logger.log('pyret-load-failure', {
      event: 'initial-failure',
      url: url,
      // The timestamp appears to count from the beginning of page load,
      // which may approximate download time if, say, requests are timing out
      // or getting cut off.

      timeStamp: e.timeStamp
    });
    var manualFetch = $.ajax(url);
    manualFetch.then(function (res) {
      // Here, we log the first 100 characters of the response to make sure
      // they resemble the Pyret blob
      logger.log('pyret-load-failure', {
        event: 'success-with-ajax',
        contentsPrefix: res.slice(0, 100)
      });
    });
    manualFetch.fail(function (res) {
      logger.log('pyret-load-failure', {
        event: 'failure-with-ajax',
        status: res.status,
        statusText: res.statusText,
        // Since responseText could be a long error page, and we don't want to
        // log huge pages, we slice it to 100 characters, which is enough to
        // tell us what's going on (e.g. AWS failure, network outage).
        responseText: res.responseText.slice(0, 100)
      });
    });
  }
  $(pyretLoad).on("error", function (e) {
    logFailureAndManualFetch("http://localhost:4999/js/cpo-main.jarr", e);
    console.log(process.env);
    pyretLoad2.src = undefined;
    pyretLoad2.type = "text/javascript";
    document.body.appendChild(pyretLoad2);
  });
  $(pyretLoad2).on("error", function (e) {
    $("#loader").hide();
    $("#runPart").hide();
    $("#breakButton").hide();
    window.stickError("Pyret failed to load; check your connection or try refreshing the page.  If this happens repeatedly, please report it as a bug.");
    logFailureAndManualFetch(undefined, e);
  });
  var onRunHandlers = [];
  function onRun(handler) {
    onRunHandlers.push(handler);
  }
  function triggerOnRun() {
    onRunHandlers.forEach(function (h) {
      return h();
    });
  }
  var onInteractionHandlers = [];
  function onInteraction(handler) {
    onInteractionHandlers.push(handler);
  }
  function triggerOnInteraction(interaction) {
    onInteractionHandlers.forEach(function (h) {
      return h(interaction);
    });
  }
  var onLoadHandlers = [];
  function onLoad(handler) {
    onLoadHandlers.push(handler);
  }
  function triggerOnLoad() {
    onLoadHandlers.forEach(function (h) {
      return h();
    });
  }
  programLoaded.fin(function () {
    CPO.editor.focus();
    CPO.editor.cm.setOption("readOnly", false);
  });
  CPO.autoSave = autoSave;
  CPO.save = save;
  CPO.updateName = updateName;
  CPO.showShareContainer = showShareContainer;
  CPO.loadProgram = loadProgram;
  CPO.storageAPI = storageAPI;
  CPO.cycleFocus = cycleFocus;
  CPO.say = say;
  CPO.sayAndForget = sayAndForget;
  CPO.onRun = onRun;
  CPO.onLoad = onLoad;
  CPO.triggerOnRun = triggerOnRun;
  CPO.onInteraction = onInteraction;
  CPO.triggerOnInteraction = triggerOnInteraction;
  CPO.triggerOnLoad = triggerOnLoad;
  if (localSettings.getItem("sawSummer2021Message") !== "saw-summer-2021-message") {
    var message = $("<span>");
    var notes = $("<a target='_blank' style='color: white'>").attr("href", "https://www.pyret.org/release-notes/summer-2021.html").text("release notes");
    message.append("Things may look a little different! Check out the ", notes, " for more details.");
    window.stickRichMessage(message);
    localSettings.setItem("sawSummer2021Message", "saw-summer-2021-message");
  }
  var initialState = params["get"]["initialState"];
  if (typeof acquireVsCodeApi === "function") {
    makeEvents({
      CPO: CPO,
      sendPort: acquireVsCodeApi(),
      receivePort: window,
      initialState: initialState
    });
  } else if (window.parent && window.parent !== window || "development" === "development") {
    makeEvents({
      CPO: CPO,
      sendPort: window.parent,
      receivePort: window,
      initialState: initialState
    });
  }
});
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsTUFBTSxTQUFTLElBQXlEO0FBQ3hFOztBQUVBO0FBQ0EsTUFBTSxLQUFLLDBCQStCTjs7QUFFTCxDQUFDO0FBQ0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsRUFBRTtBQUNGO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUEsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxtQ0FBbUMsZUFBZTtBQUNsRDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxtQ0FBbUMsZUFBZTtBQUNsRDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0EsS0FBSztBQUNMLGlCQUFpQjtBQUNqQixLQUFLOztBQUVMO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLGlCQUFpQjtBQUNqQixLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0EsS0FBSztBQUNMO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQSxXQUFXLFVBQVU7QUFDckIsYUFBYSxVQUFVO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsU0FBUztBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsUUFBUTtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBLDBDQUEwQywrQkFBK0I7QUFDekU7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFFBQVE7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLEtBQUs7O0FBRUw7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0EsU0FBUztBQUNULEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxhQUFhO0FBQ3hCO0FBQ0EsYUFBYSxjQUFjO0FBQzNCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE1BQU07QUFDakIsV0FBVyxVQUFVO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxNQUFNO0FBQ2pCLFdBQVcsVUFBVTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE1BQU07QUFDakIsV0FBVyxVQUFVO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsTUFBTTtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBLFNBQVM7QUFDVDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7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Q1IrWSxRQUFRLEVBQUVGLGdCQUFnQixDQUFDLENBQUM7TUFDNUJHLFdBQVcsRUFBRXRnQixNQUFNO01BQ25Ca2dCLFlBQVksRUFBWkE7SUFDRixDQUFDLENBQUM7RUFDSixDQUFDLE1BQ0ksSUFBSWxnQixNQUFNLENBQUN1Z0IsTUFBTSxJQUFLdmdCLE1BQU0sQ0FBQ3VnQixNQUFNLEtBQUt2Z0IsTUFBTyxJQUFLZ0csYUFBb0IsS0FBSyxhQUFhLEVBQUU7SUFDL0ZvYSxVQUFVLENBQUM7TUFBRTlZLEdBQUcsRUFBRUEsR0FBRztNQUFFK1ksUUFBUSxFQUFFcmdCLE1BQU0sQ0FBQ3VnQixNQUFNO01BQUVELFdBQVcsRUFBRXRnQixNQUFNO01BQUVrZ0IsWUFBWSxFQUFaQTtJQUFhLENBQUMsQ0FBQztFQUN0RjtBQUNGLENBQUMsQ0FBQyxDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY29kZS5weXJldC5vcmcvLi9zcmMvd2ViL2pzL21vZGFsLXByb21wdC5qcyIsIndlYnBhY2s6Ly9jb2RlLnB5cmV0Lm9yZy8uL25vZGVfbW9kdWxlcy9xL3EuanMiLCJ3ZWJwYWNrOi8vY29kZS5weXJldC5vcmcvLi9ub2RlX21vZHVsZXMvdXJsLmpzL3VybC5qcyIsIndlYnBhY2s6Ly9jb2RlLnB5cmV0Lm9yZy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9jb2RlLnB5cmV0Lm9yZy8uL3NyYy93ZWIvanMvYmVmb3JlUHlyZXQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNb2R1bGUgZm9yIG1hbmFnaW5nIG1vZGFsIHByb21wdCBpbnN0YW5jZXMuXG4gKiBOT1RFOiBUaGlzIG1vZHVsZSBpcyBjdXJyZW50bHkgbGltaXRlZCBpbiBhIG51bWJlclxuICogICAgICAgb2Ygd2F5cy4gRm9yIG9uZSwgaXQgb25seSBhbGxvd3MgcmFkaW9cbiAqICAgICAgIGlucHV0IG9wdGlvbnMuIEFkZGl0aW9uYWxseSwgaXQgaGFyZC1jb2RlcyBpblxuICogICAgICAgYSBudW1iZXIgb2Ygb3RoZXIgYmVoYXZpb3JzIHdoaWNoIGFyZSBzcGVjaWZpY1xuICogICAgICAgdG8gdGhlIGltYWdlIGltcG9ydCBzdHlsZSBwcm9tcHQgKGZvciB3aGljaFxuICogICAgICAgdGhpcyBtb2R1bGUgd2FzIHdyaXR0ZW4pLlxuICogICAgICAgSWYgZGVzaXJlZCwgdGhpcyBtb2R1bGUgbWF5IGJlIG1hZGUgbW9yZVxuICogICAgICAgZ2VuZXJhbC1wdXJwb3NlIGluIHRoZSBmdXR1cmUsIGJ1dCwgZm9yIG5vdyxcbiAqICAgICAgIGJlIGF3YXJlIG9mIHRoZXNlIGxpbWl0YXRpb25zLlxuICovXG5kZWZpbmUoXCJjcG8vbW9kYWwtcHJvbXB0XCIsIFtcInFcIl0sIGZ1bmN0aW9uKFEpIHtcblxuICBmdW5jdGlvbiBhdXRvSGlnaGxpZ2h0Qm94KHRleHQpIHtcbiAgICB2YXIgdGV4dEJveCA9ICQoXCI8aW5wdXQgdHlwZT0ndGV4dCc+XCIpLmFkZENsYXNzKFwiYXV0by1oaWdobGlnaHRcIik7XG4gICAgdGV4dEJveC5hdHRyKFwicmVhZG9ubHlcIiwgXCJyZWFkb25seVwiKTtcbiAgICB0ZXh0Qm94Lm9uKFwiZm9jdXNcIiwgZnVuY3Rpb24oKSB7ICQodGhpcykuc2VsZWN0KCk7IH0pO1xuICAgIHRleHRCb3gub24oXCJtb3VzZXVwXCIsIGZ1bmN0aW9uKCkgeyAkKHRoaXMpLnNlbGVjdCgpOyB9KTtcbiAgICB0ZXh0Qm94LnZhbCh0ZXh0KTtcbiAgICByZXR1cm4gdGV4dEJveDtcblxuXG4gIH1cblxuICAvLyBBbGxvd3MgYXN5bmNocm9ub3VzIHJlcXVlc3Rpbmcgb2YgcHJvbXB0c1xuICB2YXIgcHJvbXB0UXVldWUgPSBRKCk7XG4gIHZhciBzdHlsZXMgPSBbXG4gICAgXCJyYWRpb1wiLCBcInRpbGVzXCIsIFwidGV4dFwiLCBcImNvcHlUZXh0XCIsIFwiY29uZmlybVwiXG4gIF07XG5cbiAgd2luZG93Lm1vZGFscyA9IFtdO1xuXG4gIC8qKlxuICAgKiBSZXByZXNlbnRzIGFuIG9wdGlvbiB0byBwcmVzZW50IHRoZSB1c2VyXG4gICAqIEB0eXBlZGVmIHtPYmplY3R9IE1vZGFsT3B0aW9uXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdG8gc2hvdyB0aGUgdXNlciB3aGljaFxuICAgICAgICAgICAgICAgZGVzY3JpYmVzIHRoaXMgb3B0aW9uXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB2YWx1ZSAtIFRoZSB2YWx1ZSB0byByZXR1cm4gaWYgdGhpcyBvcHRpb24gaXMgY2hvc2VuXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbZXhhbXBsZV0gLSBBIGNvZGUgc25pcHBldCB0byBzaG93IHdpdGggdGhpcyBvcHRpb25cbiAgICovXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIGZvciBtb2RhbCBwcm9tcHRzLlxuICAgKiBAcGFyYW0ge01vZGFsT3B0aW9uW119IG9wdGlvbnMgLSBUaGUgb3B0aW9ucyB0byBwcmVzZW50IHRoZSB1c2VyXG4gICAqL1xuICBmdW5jdGlvbiBQcm9tcHQob3B0aW9ucykge1xuICAgIHdpbmRvdy5tb2RhbHMucHVzaCh0aGlzKTtcbiAgICBpZiAoIW9wdGlvbnMgfHxcbiAgICAgICAgKHN0eWxlcy5pbmRleE9mKG9wdGlvbnMuc3R5bGUpID09PSAtMSkgfHxcbiAgICAgICAgIW9wdGlvbnMub3B0aW9ucyB8fFxuICAgICAgICAodHlwZW9mIG9wdGlvbnMub3B0aW9ucy5sZW5ndGggIT09IFwibnVtYmVyXCIpIHx8IChvcHRpb25zLm9wdGlvbnMubGVuZ3RoID09PSAwKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBQcm9tcHQgT3B0aW9uc1wiLCBvcHRpb25zKTtcbiAgICB9XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLm1vZGFsID0gJChcIiNwcm9tcHRNb2RhbFwiKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnN0eWxlID09PSBcInJhZGlvXCIpIHtcbiAgICAgIHRoaXMuZWx0cyA9ICQoJC5wYXJzZUhUTUwoXCI8dGFibGU+PC90YWJsZT5cIikpLmFkZENsYXNzKFwiY2hvaWNlQ29udGFpbmVyXCIpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnN0eWxlID09PSBcInRleHRcIikge1xuICAgICAgdGhpcy5lbHRzID0gJChcIjxkaXY+XCIpLmFkZENsYXNzKFwiY2hvaWNlQ29udGFpbmVyXCIpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnN0eWxlID09PSBcImNvcHlUZXh0XCIpIHtcbiAgICAgIHRoaXMuZWx0cyA9ICQoXCI8ZGl2PlwiKS5hZGRDbGFzcyhcImNob2ljZUNvbnRhaW5lclwiKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJjb25maXJtXCIpIHtcbiAgICAgIHRoaXMuZWx0cyA9ICQoXCI8ZGl2PlwiKS5hZGRDbGFzcyhcImNob2ljZUNvbnRhaW5lclwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbHRzID0gJCgkLnBhcnNlSFRNTChcIjxkaXY+PC9kaXY+XCIpKS5hZGRDbGFzcyhcImNob2ljZUNvbnRhaW5lclwiKTtcbiAgICB9XG4gICAgdGhpcy50aXRsZSA9ICQoXCIubW9kYWwtaGVhZGVyID4gaDNcIiwgdGhpcy5tb2RhbCk7XG4gICAgdGhpcy5tb2RhbENvbnRlbnQgPSAkKFwiLm1vZGFsLWNvbnRlbnRcIiwgdGhpcy5tb2RhbCk7XG4gICAgdGhpcy5jbG9zZUJ1dHRvbiA9ICQoXCIuY2xvc2VcIiwgdGhpcy5tb2RhbCk7XG4gICAgdGhpcy5zdWJtaXRCdXR0b24gPSAkKFwiLnN1Ym1pdFwiLCB0aGlzLm1vZGFsKTtcbiAgICBpZih0aGlzLm9wdGlvbnMuc3VibWl0VGV4dCkge1xuICAgICAgdGhpcy5zdWJtaXRCdXR0b24udGV4dCh0aGlzLm9wdGlvbnMuc3VibWl0VGV4dCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5zdWJtaXRCdXR0b24udGV4dChcIlN1Ym1pdFwiKTtcbiAgICB9XG4gICAgaWYodGhpcy5vcHRpb25zLmNhbmNlbFRleHQpIHtcbiAgICAgIHRoaXMuY2xvc2VCdXR0b24udGV4dCh0aGlzLm9wdGlvbnMuY2FuY2VsVGV4dCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5jbG9zZUJ1dHRvbi50ZXh0KFwiQ2FuY2VsXCIpO1xuICAgIH1cbiAgICB0aGlzLm1vZGFsQ29udGVudC50b2dnbGVDbGFzcyhcIm5hcnJvd1wiLCAhIXRoaXMub3B0aW9ucy5uYXJyb3cpO1xuXG4gICAgdGhpcy5pc0NvbXBpbGVkID0gZmFsc2U7XG4gICAgdGhpcy5kZWZlcnJlZCA9IFEuZGVmZXIoKTtcbiAgICB0aGlzLnByb21pc2UgPSB0aGlzLmRlZmVycmVkLnByb21pc2U7XG4gIH1cblxuICAvKipcbiAgICogVHlwZSBmb3IgaGFuZGxlcnMgb2YgcmVzcG9uc2VzIGZyb20gbW9kYWwgcHJvbXB0c1xuICAgKiBAY2FsbGJhY2sgcHJvbXB0Q2FsbGJhY2tcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlc3AgLSBUaGUgcmVzcG9uc2UgZnJvbSB0aGUgdXNlclxuICAgKi9cblxuICAvKipcbiAgICogU2hvd3MgdGhpcyBwcm9tcHQgdG8gdGhlIHVzZXIgKHdpbGwgd2FpdCB1bnRpbCBhbnkgYWN0aXZlXG4gICAqIHByb21wdHMgaGF2ZSBmaW5pc2hlZClcbiAgICogQHBhcmFtIHtwcm9tcHRDYWxsYmFja30gW2NhbGxiYWNrXSAtIE9wdGlvbmFsIGNhbGxiYWNrIHdoaWNoIGlzIHBhc3NlZCB0aGVcbiAgICogICAgICAgIHJlc3VsdCBvZiB0aGUgcHJvbXB0XG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSByZXNvbHZpbmcgdG8gZWl0aGVyIHRoZSByZXN1bHQgb2YgYGNhbGxiYWNrYCwgaWYgcHJvdmlkZWQsXG4gICAqICAgICAgICAgIG9yIHRoZSByZXN1bHQgb2YgdGhlIHByb21wdCwgb3RoZXJ3aXNlLlxuICAgKi9cbiAgUHJvbXB0LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAvLyBVc2UgdGhlIHByb21pc2UgcXVldWUgdG8gbWFrZSBzdXJlIHRoZXJlJ3Mgbm8gb3RoZXJcbiAgICAvLyBwcm9tcHQgYmVpbmcgc2hvd24gY3VycmVudGx5XG4gICAgaWYgKHRoaXMub3B0aW9ucy5oaWRlU3VibWl0KSB7XG4gICAgICB0aGlzLnN1Ym1pdEJ1dHRvbi5oaWRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3VibWl0QnV0dG9uLnNob3coKTtcbiAgICB9XG4gICAgdGhpcy5jbG9zZUJ1dHRvbi5jbGljayh0aGlzLm9uQ2xvc2UuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5tb2RhbC5rZXlwcmVzcyhmdW5jdGlvbihlKSB7XG4gICAgICBpZihlLndoaWNoID09IDEzKSB7XG4gICAgICAgIHRoaXMuc3VibWl0QnV0dG9uLmNsaWNrKCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICAgIHRoaXMuc3VibWl0QnV0dG9uLmNsaWNrKHRoaXMub25TdWJtaXQuYmluZCh0aGlzKSk7XG4gICAgdmFyIGRvY0NsaWNrID0gKGZ1bmN0aW9uKGUpIHtcbiAgICAgIC8vIElmIHRoZSBwcm9tcHQgaXMgYWN0aXZlIGFuZCB0aGUgYmFja2dyb3VuZCBpcyBjbGlja2VkLFxuICAgICAgLy8gdGhlbiBjbG9zZS5cbiAgICAgIGlmICgkKGUudGFyZ2V0KS5pcyh0aGlzLm1vZGFsKSAmJiB0aGlzLmRlZmVycmVkKSB7XG4gICAgICAgIHRoaXMub25DbG9zZShlKTtcbiAgICAgICAgJChkb2N1bWVudCkub2ZmKFwiY2xpY2tcIiwgZG9jQ2xpY2spO1xuICAgICAgfVxuICAgIH0pLmJpbmQodGhpcyk7XG4gICAgJChkb2N1bWVudCkuY2xpY2soZG9jQ2xpY2spO1xuICAgIHZhciBkb2NLZXlkb3duID0gKGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFc2NhcGVcIikge1xuICAgICAgICB0aGlzLm9uQ2xvc2UoZSk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9mZihcImtleWRvd25cIiwgZG9jS2V5ZG93bik7XG4gICAgICB9XG4gICAgfSkuYmluZCh0aGlzKTtcbiAgICAkKGRvY3VtZW50KS5rZXlkb3duKGRvY0tleWRvd24pO1xuICAgIHRoaXMudGl0bGUudGV4dCh0aGlzLm9wdGlvbnMudGl0bGUpO1xuICAgIHRoaXMucG9wdWxhdGVNb2RhbCgpO1xuICAgIHRoaXMubW9kYWwuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gICAgJChcIjppbnB1dDplbmFibGVkOnZpc2libGU6Zmlyc3RcIiwgdGhpcy5tb2RhbCkuZm9jdXMoKS5zZWxlY3QoKVxuXG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm9taXNlLnRoZW4oY2FsbGJhY2spO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm9taXNlO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDbGVhcnMgdGhlIGNvbnRlbnRzIG9mIHRoZSBtb2RhbCBwcm9tcHQuXG4gICAqL1xuICBQcm9tcHQucHJvdG90eXBlLmNsZWFyTW9kYWwgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN1Ym1pdEJ1dHRvbi5vZmYoKTtcbiAgICB0aGlzLmNsb3NlQnV0dG9uLm9mZigpO1xuICAgIHRoaXMuZWx0cy5lbXB0eSgpO1xuICB9O1xuICBcbiAgLyoqXG4gICAqIFBvcHVsYXRlcyB0aGUgY29udGVudHMgb2YgdGhlIG1vZGFsIHByb21wdCB3aXRoIHRoZVxuICAgKiBvcHRpb25zIGluIHRoaXMgcHJvbXB0LlxuICAgKi9cbiAgUHJvbXB0LnByb3RvdHlwZS5wb3B1bGF0ZU1vZGFsID0gZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gY3JlYXRlUmFkaW9FbHQob3B0aW9uLCBpZHgpIHtcbiAgICAgIHZhciBlbHQgPSAkKCQucGFyc2VIVE1MKFwiPGlucHV0IG5hbWU9XFxcInB5cmV0LW1vZGFsXFxcIiB0eXBlPVxcXCJyYWRpb1xcXCI+XCIpKTtcbiAgICAgIHZhciBpZCA9IFwiclwiICsgaWR4LnRvU3RyaW5nKCk7XG4gICAgICB2YXIgbGFiZWwgPSAkKCQucGFyc2VIVE1MKFwiPGxhYmVsIGZvcj1cXFwiXCIgKyBpZCArIFwiXFxcIj48L2xhYmVsPlwiKSk7XG4gICAgICBlbHQuYXR0cihcImlkXCIsIGlkKTtcbiAgICAgIGVsdC5hdHRyKFwidmFsdWVcIiwgb3B0aW9uLnZhbHVlKTtcbiAgICAgIGxhYmVsLnRleHQob3B0aW9uLm1lc3NhZ2UpO1xuICAgICAgdmFyIGVsdENvbnRhaW5lciA9ICQoJC5wYXJzZUhUTUwoXCI8dGQgY2xhc3M9XFxcInB5cmV0LW1vZGFsLW9wdGlvbi1yYWRpb1xcXCI+PC90ZD5cIikpO1xuICAgICAgZWx0Q29udGFpbmVyLmFwcGVuZChlbHQpO1xuICAgICAgdmFyIGxhYmVsQ29udGFpbmVyID0gJCgkLnBhcnNlSFRNTChcIjx0ZCBjbGFzcz1cXFwicHlyZXQtbW9kYWwtb3B0aW9uLW1lc3NhZ2VcXFwiPjwvdGQ+XCIpKTtcbiAgICAgIGxhYmVsQ29udGFpbmVyLmFwcGVuZChsYWJlbCk7XG4gICAgICB2YXIgY29udGFpbmVyID0gJCgkLnBhcnNlSFRNTChcIjx0ciBjbGFzcz1cXFwicHlyZXQtbW9kYWwtb3B0aW9uXFxcIj48L3RyPlwiKSk7XG4gICAgICBjb250YWluZXIuYXBwZW5kKGVsdENvbnRhaW5lcik7XG4gICAgICBjb250YWluZXIuYXBwZW5kKGxhYmVsQ29udGFpbmVyKTtcbiAgICAgIGlmIChvcHRpb24uZXhhbXBsZSkge1xuICAgICAgICB2YXIgZXhhbXBsZSA9ICQoJC5wYXJzZUhUTUwoXCI8ZGl2PjwvZGl2PlwiKSk7XG4gICAgICAgIHZhciBjbSA9IENvZGVNaXJyb3IoZXhhbXBsZVswXSwge1xuICAgICAgICAgIHZhbHVlOiBvcHRpb24uZXhhbXBsZSxcbiAgICAgICAgICBtb2RlOiAncHlyZXQnLFxuICAgICAgICAgIGxpbmVOdW1iZXJzOiBmYWxzZSxcbiAgICAgICAgICByZWFkT25seTogXCJub2N1cnNvclwiIC8vIHRoaXMgbWFrZXMgaXQgcmVhZE9ubHkgJiBub3QgZm9jdXNhYmxlIGFzIGEgZm9ybSBpbnB1dFxuICAgICAgICB9KTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgIGNtLnJlZnJlc2goKTtcbiAgICAgICAgfSwgMSk7XG4gICAgICAgIHZhciBleGFtcGxlQ29udGFpbmVyID0gJCgkLnBhcnNlSFRNTChcIjx0ZCBjbGFzcz1cXFwicHlyZXQtbW9kYWwtb3B0aW9uLWV4YW1wbGVcXFwiPjwvdGQ+XCIpKTtcbiAgICAgICAgZXhhbXBsZUNvbnRhaW5lci5hcHBlbmQoZXhhbXBsZSk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmQoZXhhbXBsZUNvbnRhaW5lcik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZVRpbGVFbHQob3B0aW9uLCBpZHgpIHtcbiAgICAgIHZhciBlbHQgPSAkKCQucGFyc2VIVE1MKFwiPGJ1dHRvbiBuYW1lPVxcXCJweXJldC1tb2RhbFxcXCIgY2xhc3M9XFxcInRpbGVcXFwiPjwvYnV0dG9uPlwiKSk7XG4gICAgICBlbHQuYXR0cihcImlkXCIsIFwidFwiICsgaWR4LnRvU3RyaW5nKCkpO1xuICAgICAgZWx0LmFwcGVuZCgkKFwiPGI+XCIpLnRleHQob3B0aW9uLm1lc3NhZ2UpKVxuICAgICAgICAuYXBwZW5kKCQoXCI8cD5cIikudGV4dChvcHRpb24uZGV0YWlscykpO1xuICAgICAgZm9yICh2YXIgZXZ0IGluIG9wdGlvbi5vbilcbiAgICAgICAgZWx0Lm9uKGV2dCwgb3B0aW9uLm9uW2V2dF0pO1xuICAgICAgcmV0dXJuIGVsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVUZXh0RWx0KG9wdGlvbikge1xuICAgICAgdmFyIGVsdCA9ICQoXCI8ZGl2IGNsYXNzPVxcXCJweXJldC1tb2RhbC10ZXh0XFxcIj5cIik7XG4gICAgICBjb25zdCBpbnB1dCA9ICQoXCI8aW5wdXQgaWQ9J21vZGFsLXByb21wdC10ZXh0JyB0eXBlPSd0ZXh0Jz5cIikudmFsKG9wdGlvbi5kZWZhdWx0VmFsdWUpO1xuICAgICAgaWYob3B0aW9uLmRyYXdFbGVtZW50KSB7XG4gICAgICAgIGVsdC5hcHBlbmQob3B0aW9uLmRyYXdFbGVtZW50KGlucHV0KSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgZWx0LmFwcGVuZCgkKFwiPGxhYmVsIGZvcj0nbW9kYWwtcHJvbXB0LXRleHQnPlwiKS5hZGRDbGFzcyhcInRleHRMYWJlbFwiKS50ZXh0KG9wdGlvbi5tZXNzYWdlKSk7XG4gICAgICAgIGVsdC5hcHBlbmQoaW5wdXQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDb3B5VGV4dEVsdChvcHRpb24pIHtcbiAgICAgIHZhciBlbHQgPSAkKFwiPGRpdj5cIik7XG4gICAgICBlbHQuYXBwZW5kKCQoXCI8cD5cIikuYWRkQ2xhc3MoXCJ0ZXh0TGFiZWxcIikudGV4dChvcHRpb24ubWVzc2FnZSkpO1xuICAgICAgaWYob3B0aW9uLnRleHQpIHtcbiAgICAgICAgdmFyIGJveCA9IGF1dG9IaWdobGlnaHRCb3gob3B0aW9uLnRleHQpO1xuICAvLyAgICAgIGVsdC5hcHBlbmQoJChcIjxzcGFuPlwiKS50ZXh0KFwiKFwiICsgb3B0aW9uLmRldGFpbHMgKyBcIilcIikpO1xuICAgICAgICBlbHQuYXBwZW5kKGJveCk7XG4gICAgICAgIGJveC5mb2N1cygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDb25maXJtRWx0KG9wdGlvbikge1xuICAgICAgcmV0dXJuICQoXCI8cD5cIikudGV4dChvcHRpb24ubWVzc2FnZSk7XG4gICAgfVxuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlRWx0KG9wdGlvbiwgaSkge1xuICAgICAgaWYodGhhdC5vcHRpb25zLnN0eWxlID09PSBcInJhZGlvXCIpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVJhZGlvRWx0KG9wdGlvbiwgaSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKHRoYXQub3B0aW9ucy5zdHlsZSA9PT0gXCJ0aWxlc1wiKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVUaWxlRWx0KG9wdGlvbiwgaSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKHRoYXQub3B0aW9ucy5zdHlsZSA9PT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVRleHRFbHQob3B0aW9uKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYodGhhdC5vcHRpb25zLnN0eWxlID09PSBcImNvcHlUZXh0XCIpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUNvcHlUZXh0RWx0KG9wdGlvbik7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKHRoYXQub3B0aW9ucy5zdHlsZSA9PT0gXCJjb25maXJtXCIpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUNvbmZpcm1FbHQob3B0aW9uKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgb3B0aW9uRWx0cztcbiAgICAvLyBDYWNoZSByZXN1bHRzXG4vLyAgICBpZiAodHJ1ZSkge1xuICAgICAgb3B0aW9uRWx0cyA9IHRoaXMub3B0aW9ucy5vcHRpb25zLm1hcChjcmVhdGVFbHQpO1xuLy8gICAgICB0aGlzLmNvbXBpbGVkRWx0cyA9IG9wdGlvbkVsdHM7XG4vLyAgICAgIHRoaXMuaXNDb21waWxlZCA9IHRydWU7XG4vLyAgICB9IGVsc2Uge1xuLy8gICAgICBvcHRpb25FbHRzID0gdGhpcy5jb21waWxlZEVsdHM7XG4vLyAgICB9XG4gICAgJChcImlucHV0W3R5cGU9J3JhZGlvJ11cIiwgb3B0aW9uRWx0c1swXSkuYXR0cignY2hlY2tlZCcsIHRydWUpO1xuICAgIHRoaXMuZWx0cy5hcHBlbmQob3B0aW9uRWx0cyk7XG4gICAgJChcIi5tb2RhbC1ib2R5XCIsIHRoaXMubW9kYWwpLmVtcHR5KCkuYXBwZW5kKHRoaXMuZWx0cyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEhhbmRsZXIgd2hpY2ggaXMgY2FsbGVkIHdoZW4gdGhlIHVzZXIgZG9lcyBub3Qgc2VsZWN0IGFueXRoaW5nXG4gICAqL1xuICBQcm9tcHQucHJvdG90eXBlLm9uQ2xvc2UgPSBmdW5jdGlvbihlKSB7XG4gICAgdGhpcy5tb2RhbC5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgIHRoaXMuY2xlYXJNb2RhbCgpO1xuICAgIHRoaXMuZGVmZXJyZWQucmVzb2x2ZShudWxsKTtcbiAgICBkZWxldGUgdGhpcy5kZWZlcnJlZDtcbiAgICBkZWxldGUgdGhpcy5wcm9taXNlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBIYW5kbGVyIHdoaWNoIGlzIGNhbGxlZCB3aGVuIHRoZSB1c2VyIHByZXNzZXMgXCJzdWJtaXRcIlxuICAgKi9cbiAgUHJvbXB0LnByb3RvdHlwZS5vblN1Ym1pdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICBpZih0aGlzLm9wdGlvbnMuc3R5bGUgPT09IFwicmFkaW9cIikge1xuICAgICAgdmFyIHJldHZhbCA9ICQoXCJpbnB1dFt0eXBlPSdyYWRpbyddOmNoZWNrZWRcIiwgdGhpcy5tb2RhbCkudmFsKCk7XG4gICAgfVxuICAgIGVsc2UgaWYodGhpcy5vcHRpb25zLnN0eWxlID09PSBcInRleHRcIikge1xuICAgICAgdmFyIHJldHZhbCA9ICQoXCJpbnB1dFt0eXBlPSd0ZXh0J11cIiwgdGhpcy5tb2RhbCkudmFsKCk7XG4gICAgfVxuICAgIGVsc2UgaWYodGhpcy5vcHRpb25zLnN0eWxlID09PSBcImNvcHlUZXh0XCIpIHtcbiAgICAgIHZhciByZXR2YWwgPSB0cnVlO1xuICAgIH1cbiAgICBlbHNlIGlmKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJjb25maXJtXCIpIHtcbiAgICAgIHZhciByZXR2YWwgPSB0cnVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHZhciByZXR2YWwgPSB0cnVlOyAvLyBKdXN0IHJldHVybiB0cnVlIGlmIHRoZXkgY2xpY2tlZCBzdWJtaXRcbiAgICB9XG4gICAgdGhpcy5tb2RhbC5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgIHRoaXMuY2xlYXJNb2RhbCgpO1xuICAgIHRoaXMuZGVmZXJyZWQucmVzb2x2ZShyZXR2YWwpO1xuICAgIGRlbGV0ZSB0aGlzLmRlZmVycmVkO1xuICAgIGRlbGV0ZSB0aGlzLnByb21pc2U7XG4gIH07XG5cbiAgcmV0dXJuIFByb21wdDtcblxufSk7XG5cbiIsIi8vIHZpbTp0cz00OnN0cz00OnN3PTQ6XG4vKiFcbiAqXG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEyIEtyaXMgS293YWwgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNSVRcbiAqIGxpY2Vuc2UgZm91bmQgYXQgaHR0cDovL2dpdGh1Yi5jb20va3Jpc2tvd2FsL3EvcmF3L21hc3Rlci9MSUNFTlNFXG4gKlxuICogV2l0aCBwYXJ0cyBieSBUeWxlciBDbG9zZVxuICogQ29weXJpZ2h0IDIwMDctMjAwOSBUeWxlciBDbG9zZSB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVCBYIGxpY2Vuc2UgZm91bmRcbiAqIGF0IGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UuaHRtbFxuICogRm9ya2VkIGF0IHJlZl9zZW5kLmpzIHZlcnNpb246IDIwMDktMDUtMTFcbiAqXG4gKiBXaXRoIHBhcnRzIGJ5IE1hcmsgTWlsbGVyXG4gKiBDb3B5cmlnaHQgKEMpIDIwMTEgR29vZ2xlIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqXG4gKi9cblxuKGZ1bmN0aW9uIChkZWZpbml0aW9uKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAvLyBUaGlzIGZpbGUgd2lsbCBmdW5jdGlvbiBwcm9wZXJseSBhcyBhIDxzY3JpcHQ+IHRhZywgb3IgYSBtb2R1bGVcbiAgICAvLyB1c2luZyBDb21tb25KUyBhbmQgTm9kZUpTIG9yIFJlcXVpcmVKUyBtb2R1bGUgZm9ybWF0cy4gIEluXG4gICAgLy8gQ29tbW9uL05vZGUvUmVxdWlyZUpTLCB0aGUgbW9kdWxlIGV4cG9ydHMgdGhlIFEgQVBJIGFuZCB3aGVuXG4gICAgLy8gZXhlY3V0ZWQgYXMgYSBzaW1wbGUgPHNjcmlwdD4sIGl0IGNyZWF0ZXMgYSBRIGdsb2JhbCBpbnN0ZWFkLlxuXG4gICAgLy8gTW9udGFnZSBSZXF1aXJlXG4gICAgaWYgKHR5cGVvZiBib290c3RyYXAgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBib290c3RyYXAoXCJwcm9taXNlXCIsIGRlZmluaXRpb24pO1xuXG4gICAgLy8gQ29tbW9uSlNcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKCk7XG5cbiAgICAvLyBSZXF1aXJlSlNcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShkZWZpbml0aW9uKTtcblxuICAgIC8vIFNFUyAoU2VjdXJlIEVjbWFTY3JpcHQpXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlmICghc2VzLm9rKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlcy5tYWtlUSA9IGRlZmluaXRpb247XG4gICAgICAgIH1cblxuICAgIC8vIDxzY3JpcHQ+XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIFByZWZlciB3aW5kb3cgb3ZlciBzZWxmIGZvciBhZGQtb24gc2NyaXB0cy4gVXNlIHNlbGYgZm9yXG4gICAgICAgIC8vIG5vbi13aW5kb3dlZCBjb250ZXh0cy5cbiAgICAgICAgdmFyIGdsb2JhbCA9IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiBzZWxmO1xuXG4gICAgICAgIC8vIEdldCB0aGUgYHdpbmRvd2Agb2JqZWN0LCBzYXZlIHRoZSBwcmV2aW91cyBRIGdsb2JhbFxuICAgICAgICAvLyBhbmQgaW5pdGlhbGl6ZSBRIGFzIGEgZ2xvYmFsLlxuICAgICAgICB2YXIgcHJldmlvdXNRID0gZ2xvYmFsLlE7XG4gICAgICAgIGdsb2JhbC5RID0gZGVmaW5pdGlvbigpO1xuXG4gICAgICAgIC8vIEFkZCBhIG5vQ29uZmxpY3QgZnVuY3Rpb24gc28gUSBjYW4gYmUgcmVtb3ZlZCBmcm9tIHRoZVxuICAgICAgICAvLyBnbG9iYWwgbmFtZXNwYWNlLlxuICAgICAgICBnbG9iYWwuUS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZ2xvYmFsLlEgPSBwcmV2aW91c1E7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoaXMgZW52aXJvbm1lbnQgd2FzIG5vdCBhbnRpY2lwYXRlZCBieSBRLiBQbGVhc2UgZmlsZSBhIGJ1Zy5cIik7XG4gICAgfVxuXG59KShmdW5jdGlvbiAoKSB7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGhhc1N0YWNrcyA9IGZhbHNlO1xudHJ5IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbn0gY2F0Y2ggKGUpIHtcbiAgICBoYXNTdGFja3MgPSAhIWUuc3RhY2s7XG59XG5cbi8vIEFsbCBjb2RlIGFmdGVyIHRoaXMgcG9pbnQgd2lsbCBiZSBmaWx0ZXJlZCBmcm9tIHN0YWNrIHRyYWNlcyByZXBvcnRlZFxuLy8gYnkgUS5cbnZhciBxU3RhcnRpbmdMaW5lID0gY2FwdHVyZUxpbmUoKTtcbnZhciBxRmlsZU5hbWU7XG5cbi8vIHNoaW1zXG5cbi8vIHVzZWQgZm9yIGZhbGxiYWNrIGluIFwiYWxsUmVzb2x2ZWRcIlxudmFyIG5vb3AgPSBmdW5jdGlvbiAoKSB7fTtcblxuLy8gVXNlIHRoZSBmYXN0ZXN0IHBvc3NpYmxlIG1lYW5zIHRvIGV4ZWN1dGUgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm5cbi8vIG9mIHRoZSBldmVudCBsb29wLlxudmFyIG5leHRUaWNrID0oZnVuY3Rpb24gKCkge1xuICAgIC8vIGxpbmtlZCBsaXN0IG9mIHRhc2tzIChzaW5nbGUsIHdpdGggaGVhZCBub2RlKVxuICAgIHZhciBoZWFkID0ge3Rhc2s6IHZvaWQgMCwgbmV4dDogbnVsbH07XG4gICAgdmFyIHRhaWwgPSBoZWFkO1xuICAgIHZhciBmbHVzaGluZyA9IGZhbHNlO1xuICAgIHZhciByZXF1ZXN0VGljayA9IHZvaWQgMDtcbiAgICB2YXIgaXNOb2RlSlMgPSBmYWxzZTtcbiAgICAvLyBxdWV1ZSBmb3IgbGF0ZSB0YXNrcywgdXNlZCBieSB1bmhhbmRsZWQgcmVqZWN0aW9uIHRyYWNraW5nXG4gICAgdmFyIGxhdGVyUXVldWUgPSBbXTtcblxuICAgIGZ1bmN0aW9uIGZsdXNoKCkge1xuICAgICAgICAvKiBqc2hpbnQgbG9vcGZ1bmM6IHRydWUgKi9cbiAgICAgICAgdmFyIHRhc2ssIGRvbWFpbjtcblxuICAgICAgICB3aGlsZSAoaGVhZC5uZXh0KSB7XG4gICAgICAgICAgICBoZWFkID0gaGVhZC5uZXh0O1xuICAgICAgICAgICAgdGFzayA9IGhlYWQudGFzaztcbiAgICAgICAgICAgIGhlYWQudGFzayA9IHZvaWQgMDtcbiAgICAgICAgICAgIGRvbWFpbiA9IGhlYWQuZG9tYWluO1xuXG4gICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgaGVhZC5kb21haW4gPSB2b2lkIDA7XG4gICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBydW5TaW5nbGUodGFzaywgZG9tYWluKTtcblxuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChsYXRlclF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgdGFzayA9IGxhdGVyUXVldWUucG9wKCk7XG4gICAgICAgICAgICBydW5TaW5nbGUodGFzayk7XG4gICAgICAgIH1cbiAgICAgICAgZmx1c2hpbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgLy8gcnVucyBhIHNpbmdsZSBmdW5jdGlvbiBpbiB0aGUgYXN5bmMgcXVldWVcbiAgICBmdW5jdGlvbiBydW5TaW5nbGUodGFzaywgZG9tYWluKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0YXNrKCk7XG5cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGlzTm9kZUpTKSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gbm9kZSwgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgY29uc2lkZXJlZCBmYXRhbCBlcnJvcnMuXG4gICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBzeW5jaHJvbm91c2x5IHRvIGludGVycnVwdCBmbHVzaGluZyFcblxuICAgICAgICAgICAgICAgIC8vIEVuc3VyZSBjb250aW51YXRpb24gaWYgdGhlIHVuY2F1Z2h0IGV4Y2VwdGlvbiBpcyBzdXBwcmVzc2VkXG4gICAgICAgICAgICAgICAgLy8gbGlzdGVuaW5nIFwidW5jYXVnaHRFeGNlcHRpb25cIiBldmVudHMgKGFzIGRvbWFpbnMgZG9lcykuXG4gICAgICAgICAgICAgICAgLy8gQ29udGludWUgaW4gbmV4dCBldmVudCB0byBhdm9pZCB0aWNrIHJlY3Vyc2lvbi5cbiAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBJbiBicm93c2VycywgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgbm90IGZhdGFsLlxuICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gYXN5bmNocm9ub3VzbHkgdG8gYXZvaWQgc2xvdy1kb3ducy5cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZXh0VGljayA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRhaWwgPSB0YWlsLm5leHQgPSB7XG4gICAgICAgICAgICB0YXNrOiB0YXNrLFxuICAgICAgICAgICAgZG9tYWluOiBpc05vZGVKUyAmJiBwcm9jZXNzLmRvbWFpbixcbiAgICAgICAgICAgIG5leHQ6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIWZsdXNoaW5nKSB7XG4gICAgICAgICAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgICAgICAgICByZXF1ZXN0VGljaygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBwcm9jZXNzLnRvU3RyaW5nKCkgPT09IFwiW29iamVjdCBwcm9jZXNzXVwiICYmIHByb2Nlc3MubmV4dFRpY2spIHtcbiAgICAgICAgLy8gRW5zdXJlIFEgaXMgaW4gYSByZWFsIE5vZGUgZW52aXJvbm1lbnQsIHdpdGggYSBgcHJvY2Vzcy5uZXh0VGlja2AuXG4gICAgICAgIC8vIFRvIHNlZSB0aHJvdWdoIGZha2UgTm9kZSBlbnZpcm9ubWVudHM6XG4gICAgICAgIC8vICogTW9jaGEgdGVzdCBydW5uZXIgLSBleHBvc2VzIGEgYHByb2Nlc3NgIGdsb2JhbCB3aXRob3V0IGEgYG5leHRUaWNrYFxuICAgICAgICAvLyAqIEJyb3dzZXJpZnkgLSBleHBvc2VzIGEgYHByb2Nlc3MubmV4VGlja2AgZnVuY3Rpb24gdGhhdCB1c2VzXG4gICAgICAgIC8vICAgYHNldFRpbWVvdXRgLiBJbiB0aGlzIGNhc2UgYHNldEltbWVkaWF0ZWAgaXMgcHJlZmVycmVkIGJlY2F1c2VcbiAgICAgICAgLy8gICAgaXQgaXMgZmFzdGVyLiBCcm93c2VyaWZ5J3MgYHByb2Nlc3MudG9TdHJpbmcoKWAgeWllbGRzXG4gICAgICAgIC8vICAgXCJbb2JqZWN0IE9iamVjdF1cIiwgd2hpbGUgaW4gYSByZWFsIE5vZGUgZW52aXJvbm1lbnRcbiAgICAgICAgLy8gICBgcHJvY2Vzcy5uZXh0VGljaygpYCB5aWVsZHMgXCJbb2JqZWN0IHByb2Nlc3NdXCIuXG4gICAgICAgIGlzTm9kZUpTID0gdHJ1ZTtcblxuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHByb2Nlc3MubmV4dFRpY2soZmx1c2gpO1xuICAgICAgICB9O1xuXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgLy8gSW4gSUUxMCwgTm9kZS5qcyAwLjkrLCBvciBodHRwczovL2dpdGh1Yi5jb20vTm9ibGVKUy9zZXRJbW1lZGlhdGVcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrID0gc2V0SW1tZWRpYXRlLmJpbmQod2luZG93LCBmbHVzaCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZXRJbW1lZGlhdGUoZmx1c2gpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gbW9kZXJuIGJyb3dzZXJzXG4gICAgICAgIC8vIGh0dHA6Ly93d3cubm9uYmxvY2tpbmcuaW8vMjAxMS8wNi93aW5kb3duZXh0dGljay5odG1sXG4gICAgICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgICAgIC8vIEF0IGxlYXN0IFNhZmFyaSBWZXJzaW9uIDYuMC41ICg4NTM2LjMwLjEpIGludGVybWl0dGVudGx5IGNhbm5vdCBjcmVhdGVcbiAgICAgICAgLy8gd29ya2luZyBtZXNzYWdlIHBvcnRzIHRoZSBmaXJzdCB0aW1lIGEgcGFnZSBsb2Fkcy5cbiAgICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IHJlcXVlc3RQb3J0VGljaztcbiAgICAgICAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZmx1c2g7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVxdWVzdFBvcnRUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gT3BlcmEgcmVxdWlyZXMgdXMgdG8gcHJvdmlkZSBhIG1lc3NhZ2UgcGF5bG9hZCwgcmVnYXJkbGVzcyBvZlxuICAgICAgICAgICAgLy8gd2hldGhlciB3ZSB1c2UgaXQuXG4gICAgICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgcmVxdWVzdFBvcnRUaWNrKCk7XG4gICAgICAgIH07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBvbGQgYnJvd3NlcnNcbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLy8gcnVucyBhIHRhc2sgYWZ0ZXIgYWxsIG90aGVyIHRhc2tzIGhhdmUgYmVlbiBydW5cbiAgICAvLyB0aGlzIGlzIHVzZWZ1bCBmb3IgdW5oYW5kbGVkIHJlamVjdGlvbiB0cmFja2luZyB0aGF0IG5lZWRzIHRvIGhhcHBlblxuICAgIC8vIGFmdGVyIGFsbCBgdGhlbmBkIHRhc2tzIGhhdmUgYmVlbiBydW4uXG4gICAgbmV4dFRpY2sucnVuQWZ0ZXIgPSBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICBsYXRlclF1ZXVlLnB1c2godGFzayk7XG4gICAgICAgIGlmICghZmx1c2hpbmcpIHtcbiAgICAgICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBuZXh0VGljaztcbn0pKCk7XG5cbi8vIEF0dGVtcHQgdG8gbWFrZSBnZW5lcmljcyBzYWZlIGluIHRoZSBmYWNlIG9mIGRvd25zdHJlYW1cbi8vIG1vZGlmaWNhdGlvbnMuXG4vLyBUaGVyZSBpcyBubyBzaXR1YXRpb24gd2hlcmUgdGhpcyBpcyBuZWNlc3NhcnkuXG4vLyBJZiB5b3UgbmVlZCBhIHNlY3VyaXR5IGd1YXJhbnRlZSwgdGhlc2UgcHJpbW9yZGlhbHMgbmVlZCB0byBiZVxuLy8gZGVlcGx5IGZyb3plbiBhbnl3YXksIGFuZCBpZiB5b3UgZG9u4oCZdCBuZWVkIGEgc2VjdXJpdHkgZ3VhcmFudGVlLFxuLy8gdGhpcyBpcyBqdXN0IHBsYWluIHBhcmFub2lkLlxuLy8gSG93ZXZlciwgdGhpcyAqKm1pZ2h0KiogaGF2ZSB0aGUgbmljZSBzaWRlLWVmZmVjdCBvZiByZWR1Y2luZyB0aGUgc2l6ZSBvZlxuLy8gdGhlIG1pbmlmaWVkIGNvZGUgYnkgcmVkdWNpbmcgeC5jYWxsKCkgdG8gbWVyZWx5IHgoKVxuLy8gU2VlIE1hcmsgTWlsbGVy4oCZcyBleHBsYW5hdGlvbiBvZiB3aGF0IHRoaXMgZG9lcy5cbi8vIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWNvbnZlbnRpb25zOnNhZmVfbWV0YV9wcm9ncmFtbWluZ1xudmFyIGNhbGwgPSBGdW5jdGlvbi5jYWxsO1xuZnVuY3Rpb24gdW5jdXJyeVRoaXMoZikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjYWxsLmFwcGx5KGYsIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cbi8vIFRoaXMgaXMgZXF1aXZhbGVudCwgYnV0IHNsb3dlcjpcbi8vIHVuY3VycnlUaGlzID0gRnVuY3Rpb25fYmluZC5iaW5kKEZ1bmN0aW9uX2JpbmQuY2FsbCk7XG4vLyBodHRwOi8vanNwZXJmLmNvbS91bmN1cnJ5dGhpc1xuXG52YXIgYXJyYXlfc2xpY2UgPSB1bmN1cnJ5VGhpcyhBcnJheS5wcm90b3R5cGUuc2xpY2UpO1xuXG52YXIgYXJyYXlfcmVkdWNlID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLnJlZHVjZSB8fCBmdW5jdGlvbiAoY2FsbGJhY2ssIGJhc2lzKSB7XG4gICAgICAgIHZhciBpbmRleCA9IDAsXG4gICAgICAgICAgICBsZW5ndGggPSB0aGlzLmxlbmd0aDtcbiAgICAgICAgLy8gY29uY2VybmluZyB0aGUgaW5pdGlhbCB2YWx1ZSwgaWYgb25lIGlzIG5vdCBwcm92aWRlZFxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgLy8gc2VlayB0byB0aGUgZmlyc3QgdmFsdWUgaW4gdGhlIGFycmF5LCBhY2NvdW50aW5nXG4gICAgICAgICAgICAvLyBmb3IgdGhlIHBvc3NpYmlsaXR5IHRoYXQgaXMgaXMgYSBzcGFyc2UgYXJyYXlcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggaW4gdGhpcykge1xuICAgICAgICAgICAgICAgICAgICBiYXNpcyA9IHRoaXNbaW5kZXgrK107XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoKytpbmRleCA+PSBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUgKDEpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlZHVjZVxuICAgICAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIC8vIGFjY291bnQgZm9yIHRoZSBwb3NzaWJpbGl0eSB0aGF0IHRoZSBhcnJheSBpcyBzcGFyc2VcbiAgICAgICAgICAgIGlmIChpbmRleCBpbiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgYmFzaXMgPSBjYWxsYmFjayhiYXNpcywgdGhpc1tpbmRleF0sIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmFzaXM7XG4gICAgfVxuKTtcblxudmFyIGFycmF5X2luZGV4T2YgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiB8fCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbm90IGEgdmVyeSBnb29kIHNoaW0sIGJ1dCBnb29kIGVub3VnaCBmb3Igb3VyIG9uZSB1c2Ugb2YgaXRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpc1tpXSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuKTtcblxudmFyIGFycmF5X21hcCA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5tYXAgfHwgZnVuY3Rpb24gKGNhbGxiYWNrLCB0aGlzcCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBjb2xsZWN0ID0gW107XG4gICAgICAgIGFycmF5X3JlZHVjZShzZWxmLCBmdW5jdGlvbiAodW5kZWZpbmVkLCB2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGNvbGxlY3QucHVzaChjYWxsYmFjay5jYWxsKHRoaXNwLCB2YWx1ZSwgaW5kZXgsIHNlbGYpKTtcbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Q7XG4gICAgfVxuKTtcblxudmFyIG9iamVjdF9jcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IGZ1bmN0aW9uIChwcm90b3R5cGUpIHtcbiAgICBmdW5jdGlvbiBUeXBlKCkgeyB9XG4gICAgVHlwZS5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG4gICAgcmV0dXJuIG5ldyBUeXBlKCk7XG59O1xuXG52YXIgb2JqZWN0X2hhc093blByb3BlcnR5ID0gdW5jdXJyeVRoaXMoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSk7XG5cbnZhciBvYmplY3Rfa2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgaWYgKG9iamVjdF9oYXNPd25Qcm9wZXJ0eShvYmplY3QsIGtleSkpIHtcbiAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBrZXlzO1xufTtcblxudmFyIG9iamVjdF90b1N0cmluZyA9IHVuY3VycnlUaGlzKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcpO1xuXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gT2JqZWN0KHZhbHVlKTtcbn1cblxuLy8gZ2VuZXJhdG9yIHJlbGF0ZWQgc2hpbXNcblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGZ1bmN0aW9uIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluIFNwaWRlck1vbmtleS5cbmZ1bmN0aW9uIGlzU3RvcEl0ZXJhdGlvbihleGNlcHRpb24pIHtcbiAgICByZXR1cm4gKFxuICAgICAgICBvYmplY3RfdG9TdHJpbmcoZXhjZXB0aW9uKSA9PT0gXCJbb2JqZWN0IFN0b3BJdGVyYXRpb25dXCIgfHxcbiAgICAgICAgZXhjZXB0aW9uIGluc3RhbmNlb2YgUVJldHVyblZhbHVlXG4gICAgKTtcbn1cblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGhlbHBlciBhbmQgUS5yZXR1cm4gb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW5cbi8vIFNwaWRlck1vbmtleS5cbnZhciBRUmV0dXJuVmFsdWU7XG5pZiAodHlwZW9mIFJldHVyblZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgUVJldHVyblZhbHVlID0gUmV0dXJuVmFsdWU7XG59IGVsc2Uge1xuICAgIFFSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgfTtcbn1cblxuLy8gbG9uZyBzdGFjayB0cmFjZXNcblxudmFyIFNUQUNLX0pVTVBfU0VQQVJBVE9SID0gXCJGcm9tIHByZXZpb3VzIGV2ZW50OlwiO1xuXG5mdW5jdGlvbiBtYWtlU3RhY2tUcmFjZUxvbmcoZXJyb3IsIHByb21pc2UpIHtcbiAgICAvLyBJZiBwb3NzaWJsZSwgdHJhbnNmb3JtIHRoZSBlcnJvciBzdGFjayB0cmFjZSBieSByZW1vdmluZyBOb2RlIGFuZCBRXG4gICAgLy8gY3J1ZnQsIHRoZW4gY29uY2F0ZW5hdGluZyB3aXRoIHRoZSBzdGFjayB0cmFjZSBvZiBgcHJvbWlzZWAuIFNlZSAjNTcuXG4gICAgaWYgKGhhc1N0YWNrcyAmJlxuICAgICAgICBwcm9taXNlLnN0YWNrICYmXG4gICAgICAgIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBlcnJvciAhPT0gbnVsbCAmJlxuICAgICAgICBlcnJvci5zdGFjayAmJlxuICAgICAgICBlcnJvci5zdGFjay5pbmRleE9mKFNUQUNLX0pVTVBfU0VQQVJBVE9SKSA9PT0gLTFcbiAgICApIHtcbiAgICAgICAgdmFyIHN0YWNrcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBwID0gcHJvbWlzZTsgISFwOyBwID0gcC5zb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChwLnN0YWNrKSB7XG4gICAgICAgICAgICAgICAgc3RhY2tzLnVuc2hpZnQocC5zdGFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2tzLnVuc2hpZnQoZXJyb3Iuc3RhY2spO1xuXG4gICAgICAgIHZhciBjb25jYXRlZFN0YWNrcyA9IHN0YWNrcy5qb2luKFwiXFxuXCIgKyBTVEFDS19KVU1QX1NFUEFSQVRPUiArIFwiXFxuXCIpO1xuICAgICAgICBlcnJvci5zdGFjayA9IGZpbHRlclN0YWNrU3RyaW5nKGNvbmNhdGVkU3RhY2tzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZpbHRlclN0YWNrU3RyaW5nKHN0YWNrU3RyaW5nKSB7XG4gICAgdmFyIGxpbmVzID0gc3RhY2tTdHJpbmcuc3BsaXQoXCJcXG5cIik7XG4gICAgdmFyIGRlc2lyZWRMaW5lcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXTtcblxuICAgICAgICBpZiAoIWlzSW50ZXJuYWxGcmFtZShsaW5lKSAmJiAhaXNOb2RlRnJhbWUobGluZSkgJiYgbGluZSkge1xuICAgICAgICAgICAgZGVzaXJlZExpbmVzLnB1c2gobGluZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRlc2lyZWRMaW5lcy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBpc05vZGVGcmFtZShzdGFja0xpbmUpIHtcbiAgICByZXR1cm4gc3RhY2tMaW5lLmluZGV4T2YoXCIobW9kdWxlLmpzOlwiKSAhPT0gLTEgfHxcbiAgICAgICAgICAgc3RhY2tMaW5lLmluZGV4T2YoXCIobm9kZS5qczpcIikgIT09IC0xO1xufVxuXG5mdW5jdGlvbiBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoc3RhY2tMaW5lKSB7XG4gICAgLy8gTmFtZWQgZnVuY3Rpb25zOiBcImF0IGZ1bmN0aW9uTmFtZSAoZmlsZW5hbWU6bGluZU51bWJlcjpjb2x1bW5OdW1iZXIpXCJcbiAgICAvLyBJbiBJRTEwIGZ1bmN0aW9uIG5hbWUgY2FuIGhhdmUgc3BhY2VzIChcIkFub255bW91cyBmdW5jdGlvblwiKSBPX29cbiAgICB2YXIgYXR0ZW1wdDEgPSAvYXQgLisgXFwoKC4rKTooXFxkKyk6KD86XFxkKylcXCkkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQxKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDFbMV0sIE51bWJlcihhdHRlbXB0MVsyXSldO1xuICAgIH1cblxuICAgIC8vIEFub255bW91cyBmdW5jdGlvbnM6IFwiYXQgZmlsZW5hbWU6bGluZU51bWJlcjpjb2x1bW5OdW1iZXJcIlxuICAgIHZhciBhdHRlbXB0MiA9IC9hdCAoW14gXSspOihcXGQrKTooPzpcXGQrKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDIpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0MlsxXSwgTnVtYmVyKGF0dGVtcHQyWzJdKV07XG4gICAgfVxuXG4gICAgLy8gRmlyZWZveCBzdHlsZTogXCJmdW5jdGlvbkBmaWxlbmFtZTpsaW5lTnVtYmVyIG9yIEBmaWxlbmFtZTpsaW5lTnVtYmVyXCJcbiAgICB2YXIgYXR0ZW1wdDMgPSAvLipAKC4rKTooXFxkKykkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQzKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDNbMV0sIE51bWJlcihhdHRlbXB0M1syXSldO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNJbnRlcm5hbEZyYW1lKHN0YWNrTGluZSkge1xuICAgIHZhciBmaWxlTmFtZUFuZExpbmVOdW1iZXIgPSBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoc3RhY2tMaW5lKTtcblxuICAgIGlmICghZmlsZU5hbWVBbmRMaW5lTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgZmlsZU5hbWUgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMF07XG4gICAgdmFyIGxpbmVOdW1iZXIgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMV07XG5cbiAgICByZXR1cm4gZmlsZU5hbWUgPT09IHFGaWxlTmFtZSAmJlxuICAgICAgICBsaW5lTnVtYmVyID49IHFTdGFydGluZ0xpbmUgJiZcbiAgICAgICAgbGluZU51bWJlciA8PSBxRW5kaW5nTGluZTtcbn1cblxuLy8gZGlzY292ZXIgb3duIGZpbGUgbmFtZSBhbmQgbGluZSBudW1iZXIgcmFuZ2UgZm9yIGZpbHRlcmluZyBzdGFja1xuLy8gdHJhY2VzXG5mdW5jdGlvbiBjYXB0dXJlTGluZSgpIHtcbiAgICBpZiAoIWhhc1N0YWNrcykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB2YXIgbGluZXMgPSBlLnN0YWNrLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICB2YXIgZmlyc3RMaW5lID0gbGluZXNbMF0uaW5kZXhPZihcIkBcIikgPiAwID8gbGluZXNbMV0gOiBsaW5lc1syXTtcbiAgICAgICAgdmFyIGZpbGVOYW1lQW5kTGluZU51bWJlciA9IGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihmaXJzdExpbmUpO1xuICAgICAgICBpZiAoIWZpbGVOYW1lQW5kTGluZU51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcUZpbGVOYW1lID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzBdO1xuICAgICAgICByZXR1cm4gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzFdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVwcmVjYXRlKGNhbGxiYWNrLCBuYW1lLCBhbHRlcm5hdGl2ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICAgICAgdHlwZW9mIGNvbnNvbGUud2FybiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4obmFtZSArIFwiIGlzIGRlcHJlY2F0ZWQsIHVzZSBcIiArIGFsdGVybmF0aXZlICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBcIiBpbnN0ZWFkLlwiLCBuZXcgRXJyb3IoXCJcIikuc3RhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseShjYWxsYmFjaywgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vLyBlbmQgb2Ygc2hpbXNcbi8vIGJlZ2lubmluZyBvZiByZWFsIHdvcmtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcHJvbWlzZSBmb3IgYW4gaW1tZWRpYXRlIHJlZmVyZW5jZSwgcGFzc2VzIHByb21pc2VzIHRocm91Z2gsIG9yXG4gKiBjb2VyY2VzIHByb21pc2VzIGZyb20gZGlmZmVyZW50IHN5c3RlbXMuXG4gKiBAcGFyYW0gdmFsdWUgaW1tZWRpYXRlIHJlZmVyZW5jZSBvciBwcm9taXNlXG4gKi9cbmZ1bmN0aW9uIFEodmFsdWUpIHtcbiAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGFscmVhZHkgYSBQcm9taXNlLCByZXR1cm4gaXQgZGlyZWN0bHkuICBUaGlzIGVuYWJsZXNcbiAgICAvLyB0aGUgcmVzb2x2ZSBmdW5jdGlvbiB0byBib3RoIGJlIHVzZWQgdG8gY3JlYXRlZCByZWZlcmVuY2VzIGZyb20gb2JqZWN0cyxcbiAgICAvLyBidXQgdG8gdG9sZXJhYmx5IGNvZXJjZSBub24tcHJvbWlzZXMgdG8gcHJvbWlzZXMuXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgLy8gYXNzaW1pbGF0ZSB0aGVuYWJsZXNcbiAgICBpZiAoaXNQcm9taXNlQWxpa2UodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBjb2VyY2UodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmdWxmaWxsKHZhbHVlKTtcbiAgICB9XG59XG5RLnJlc29sdmUgPSBRO1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgdGFzayBpbiBhIGZ1dHVyZSB0dXJuIG9mIHRoZSBldmVudCBsb29wLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gdGFza1xuICovXG5RLm5leHRUaWNrID0gbmV4dFRpY2s7XG5cbi8qKlxuICogQ29udHJvbHMgd2hldGhlciBvciBub3QgbG9uZyBzdGFjayB0cmFjZXMgd2lsbCBiZSBvblxuICovXG5RLmxvbmdTdGFja1N1cHBvcnQgPSBmYWxzZTtcblxuLy8gZW5hYmxlIGxvbmcgc3RhY2tzIGlmIFFfREVCVUcgaXMgc2V0XG5pZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgcHJvY2VzcyAmJiBwcm9jZXNzLmVudiAmJiBwcm9jZXNzLmVudi5RX0RFQlVHKSB7XG4gICAgUS5sb25nU3RhY2tTdXBwb3J0ID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEge3Byb21pc2UsIHJlc29sdmUsIHJlamVjdH0gb2JqZWN0LlxuICpcbiAqIGByZXNvbHZlYCBpcyBhIGNhbGxiYWNrIHRvIGludm9rZSB3aXRoIGEgbW9yZSByZXNvbHZlZCB2YWx1ZSBmb3IgdGhlXG4gKiBwcm9taXNlLiBUbyBmdWxmaWxsIHRoZSBwcm9taXNlLCBpbnZva2UgYHJlc29sdmVgIHdpdGggYW55IHZhbHVlIHRoYXQgaXNcbiAqIG5vdCBhIHRoZW5hYmxlLiBUbyByZWplY3QgdGhlIHByb21pc2UsIGludm9rZSBgcmVzb2x2ZWAgd2l0aCBhIHJlamVjdGVkXG4gKiB0aGVuYWJsZSwgb3IgaW52b2tlIGByZWplY3RgIHdpdGggdGhlIHJlYXNvbiBkaXJlY3RseS4gVG8gcmVzb2x2ZSB0aGVcbiAqIHByb21pc2UgdG8gYW5vdGhlciB0aGVuYWJsZSwgdGh1cyBwdXR0aW5nIGl0IGluIHRoZSBzYW1lIHN0YXRlLCBpbnZva2VcbiAqIGByZXNvbHZlYCB3aXRoIHRoYXQgb3RoZXIgdGhlbmFibGUuXG4gKi9cblEuZGVmZXIgPSBkZWZlcjtcbmZ1bmN0aW9uIGRlZmVyKCkge1xuICAgIC8vIGlmIFwibWVzc2FnZXNcIiBpcyBhbiBcIkFycmF5XCIsIHRoYXQgaW5kaWNhdGVzIHRoYXQgdGhlIHByb21pc2UgaGFzIG5vdCB5ZXRcbiAgICAvLyBiZWVuIHJlc29sdmVkLiAgSWYgaXQgaXMgXCJ1bmRlZmluZWRcIiwgaXQgaGFzIGJlZW4gcmVzb2x2ZWQuICBFYWNoXG4gICAgLy8gZWxlbWVudCBvZiB0aGUgbWVzc2FnZXMgYXJyYXkgaXMgaXRzZWxmIGFuIGFycmF5IG9mIGNvbXBsZXRlIGFyZ3VtZW50cyB0b1xuICAgIC8vIGZvcndhcmQgdG8gdGhlIHJlc29sdmVkIHByb21pc2UuICBXZSBjb2VyY2UgdGhlIHJlc29sdXRpb24gdmFsdWUgdG8gYVxuICAgIC8vIHByb21pc2UgdXNpbmcgdGhlIGByZXNvbHZlYCBmdW5jdGlvbiBiZWNhdXNlIGl0IGhhbmRsZXMgYm90aCBmdWxseVxuICAgIC8vIG5vbi10aGVuYWJsZSB2YWx1ZXMgYW5kIG90aGVyIHRoZW5hYmxlcyBncmFjZWZ1bGx5LlxuICAgIHZhciBtZXNzYWdlcyA9IFtdLCBwcm9ncmVzc0xpc3RlbmVycyA9IFtdLCByZXNvbHZlZFByb21pc2U7XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBvYmplY3RfY3JlYXRlKGRlZmVyLnByb3RvdHlwZSk7XG4gICAgdmFyIHByb21pc2UgPSBvYmplY3RfY3JlYXRlKFByb21pc2UucHJvdG90eXBlKTtcblxuICAgIHByb21pc2UucHJvbWlzZURpc3BhdGNoID0gZnVuY3Rpb24gKHJlc29sdmUsIG9wLCBvcGVyYW5kcykge1xuICAgICAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgICAgIGlmIChtZXNzYWdlcykge1xuICAgICAgICAgICAgbWVzc2FnZXMucHVzaChhcmdzKTtcbiAgICAgICAgICAgIGlmIChvcCA9PT0gXCJ3aGVuXCIgJiYgb3BlcmFuZHNbMV0pIHsgLy8gcHJvZ3Jlc3Mgb3BlcmFuZFxuICAgICAgICAgICAgICAgIHByb2dyZXNzTGlzdGVuZXJzLnB1c2gob3BlcmFuZHNbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZWRQcm9taXNlLnByb21pc2VEaXNwYXRjaC5hcHBseShyZXNvbHZlZFByb21pc2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gWFhYIGRlcHJlY2F0ZWRcbiAgICBwcm9taXNlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChtZXNzYWdlcykge1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5lYXJlclZhbHVlID0gbmVhcmVyKHJlc29sdmVkUHJvbWlzZSk7XG4gICAgICAgIGlmIChpc1Byb21pc2UobmVhcmVyVmFsdWUpKSB7XG4gICAgICAgICAgICByZXNvbHZlZFByb21pc2UgPSBuZWFyZXJWYWx1ZTsgLy8gc2hvcnRlbiBjaGFpblxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZWFyZXJWYWx1ZTtcbiAgICB9O1xuXG4gICAgcHJvbWlzZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwicGVuZGluZ1wiIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc29sdmVkUHJvbWlzZS5pbnNwZWN0KCk7XG4gICAgfTtcblxuICAgIGlmIChRLmxvbmdTdGFja1N1cHBvcnQgJiYgaGFzU3RhY2tzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gTk9URTogZG9uJ3QgdHJ5IHRvIHVzZSBgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2VgIG9yIHRyYW5zZmVyIHRoZVxuICAgICAgICAgICAgLy8gYWNjZXNzb3IgYXJvdW5kOyB0aGF0IGNhdXNlcyBtZW1vcnkgbGVha3MgYXMgcGVyIEdILTExMS4gSnVzdFxuICAgICAgICAgICAgLy8gcmVpZnkgdGhlIHN0YWNrIHRyYWNlIGFzIGEgc3RyaW5nIEFTQVAuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gQXQgdGhlIHNhbWUgdGltZSwgY3V0IG9mZiB0aGUgZmlyc3QgbGluZTsgaXQncyBhbHdheXMganVzdFxuICAgICAgICAgICAgLy8gXCJbb2JqZWN0IFByb21pc2VdXFxuXCIsIGFzIHBlciB0aGUgYHRvU3RyaW5nYC5cbiAgICAgICAgICAgIHByb21pc2Uuc3RhY2sgPSBlLnN0YWNrLnN1YnN0cmluZyhlLnN0YWNrLmluZGV4T2YoXCJcXG5cIikgKyAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5PVEU6IHdlIGRvIHRoZSBjaGVja3MgZm9yIGByZXNvbHZlZFByb21pc2VgIGluIGVhY2ggbWV0aG9kLCBpbnN0ZWFkIG9mXG4gICAgLy8gY29uc29saWRhdGluZyB0aGVtIGludG8gYGJlY29tZWAsIHNpbmNlIG90aGVyd2lzZSB3ZSdkIGNyZWF0ZSBuZXdcbiAgICAvLyBwcm9taXNlcyB3aXRoIHRoZSBsaW5lcyBgYmVjb21lKHdoYXRldmVyKHZhbHVlKSlgLiBTZWUgZS5nLiBHSC0yNTIuXG5cbiAgICBmdW5jdGlvbiBiZWNvbWUobmV3UHJvbWlzZSkge1xuICAgICAgICByZXNvbHZlZFByb21pc2UgPSBuZXdQcm9taXNlO1xuICAgICAgICBwcm9taXNlLnNvdXJjZSA9IG5ld1Byb21pc2U7XG5cbiAgICAgICAgYXJyYXlfcmVkdWNlKG1lc3NhZ2VzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBuZXdQcm9taXNlLnByb21pc2VEaXNwYXRjaC5hcHBseShuZXdQcm9taXNlLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB2b2lkIDApO1xuXG4gICAgICAgIG1lc3NhZ2VzID0gdm9pZCAwO1xuICAgICAgICBwcm9ncmVzc0xpc3RlbmVycyA9IHZvaWQgMDtcbiAgICB9XG5cbiAgICBkZWZlcnJlZC5wcm9taXNlID0gcHJvbWlzZTtcbiAgICBkZWZlcnJlZC5yZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShRKHZhbHVlKSk7XG4gICAgfTtcblxuICAgIGRlZmVycmVkLmZ1bGZpbGwgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKGZ1bGZpbGwodmFsdWUpKTtcbiAgICB9O1xuICAgIGRlZmVycmVkLnJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKHJlamVjdChyZWFzb24pKTtcbiAgICB9O1xuICAgIGRlZmVycmVkLm5vdGlmeSA9IGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhcnJheV9yZWR1Y2UocHJvZ3Jlc3NMaXN0ZW5lcnMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHByb2dyZXNzTGlzdGVuZXIpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHByb2dyZXNzTGlzdGVuZXIocHJvZ3Jlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgfTtcblxuICAgIHJldHVybiBkZWZlcnJlZDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgTm9kZS1zdHlsZSBjYWxsYmFjayB0aGF0IHdpbGwgcmVzb2x2ZSBvciByZWplY3QgdGhlIGRlZmVycmVkXG4gKiBwcm9taXNlLlxuICogQHJldHVybnMgYSBub2RlYmFja1xuICovXG5kZWZlci5wcm90b3R5cGUubWFrZU5vZGVSZXNvbHZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlcnJvciwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICBzZWxmLnJlamVjdChlcnJvcik7XG4gICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgIHNlbGYucmVzb2x2ZShhcnJheV9zbGljZShhcmd1bWVudHMsIDEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYucmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuLyoqXG4gKiBAcGFyYW0gcmVzb2x2ZXIge0Z1bmN0aW9ufSBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBub3RoaW5nIGFuZCBhY2NlcHRzXG4gKiB0aGUgcmVzb2x2ZSwgcmVqZWN0LCBhbmQgbm90aWZ5IGZ1bmN0aW9ucyBmb3IgYSBkZWZlcnJlZC5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IG1heSBiZSByZXNvbHZlZCB3aXRoIHRoZSBnaXZlbiByZXNvbHZlIGFuZCByZWplY3RcbiAqIGZ1bmN0aW9ucywgb3IgcmVqZWN0ZWQgYnkgYSB0aHJvd24gZXhjZXB0aW9uIGluIHJlc29sdmVyXG4gKi9cblEuUHJvbWlzZSA9IHByb21pc2U7IC8vIEVTNlxuUS5wcm9taXNlID0gcHJvbWlzZTtcbmZ1bmN0aW9uIHByb21pc2UocmVzb2x2ZXIpIHtcbiAgICBpZiAodHlwZW9mIHJlc29sdmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInJlc29sdmVyIG11c3QgYmUgYSBmdW5jdGlvbi5cIik7XG4gICAgfVxuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZXIoZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0LCBkZWZlcnJlZC5ub3RpZnkpO1xuICAgIH0gY2F0Y2ggKHJlYXNvbikge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVhc29uKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbnByb21pc2UucmFjZSA9IHJhY2U7IC8vIEVTNlxucHJvbWlzZS5hbGwgPSBhbGw7IC8vIEVTNlxucHJvbWlzZS5yZWplY3QgPSByZWplY3Q7IC8vIEVTNlxucHJvbWlzZS5yZXNvbHZlID0gUTsgLy8gRVM2XG5cbi8vIFhYWCBleHBlcmltZW50YWwuICBUaGlzIG1ldGhvZCBpcyBhIHdheSB0byBkZW5vdGUgdGhhdCBhIGxvY2FsIHZhbHVlIGlzXG4vLyBzZXJpYWxpemFibGUgYW5kIHNob3VsZCBiZSBpbW1lZGlhdGVseSBkaXNwYXRjaGVkIHRvIGEgcmVtb3RlIHVwb24gcmVxdWVzdCxcbi8vIGluc3RlYWQgb2YgcGFzc2luZyBhIHJlZmVyZW5jZS5cblEucGFzc0J5Q29weSA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAvL2ZyZWV6ZShvYmplY3QpO1xuICAgIC8vcGFzc0J5Q29waWVzLnNldChvYmplY3QsIHRydWUpO1xuICAgIHJldHVybiBvYmplY3Q7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5wYXNzQnlDb3B5ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vZnJlZXplKG9iamVjdCk7XG4gICAgLy9wYXNzQnlDb3BpZXMuc2V0KG9iamVjdCwgdHJ1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIElmIHR3byBwcm9taXNlcyBldmVudHVhbGx5IGZ1bGZpbGwgdG8gdGhlIHNhbWUgdmFsdWUsIHByb21pc2VzIHRoYXQgdmFsdWUsXG4gKiBidXQgb3RoZXJ3aXNlIHJlamVjdHMuXG4gKiBAcGFyYW0geCB7QW55Kn1cbiAqIEBwYXJhbSB5IHtBbnkqfVxuICogQHJldHVybnMge0FueSp9IGEgcHJvbWlzZSBmb3IgeCBhbmQgeSBpZiB0aGV5IGFyZSB0aGUgc2FtZSwgYnV0IGEgcmVqZWN0aW9uXG4gKiBvdGhlcndpc2UuXG4gKlxuICovXG5RLmpvaW4gPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHJldHVybiBRKHgpLmpvaW4oeSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5qb2luID0gZnVuY3Rpb24gKHRoYXQpIHtcbiAgICByZXR1cm4gUShbdGhpcywgdGhhdF0pLnNwcmVhZChmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICBpZiAoeCA9PT0geSkge1xuICAgICAgICAgICAgLy8gVE9ETzogXCI9PT1cIiBzaG91bGQgYmUgT2JqZWN0LmlzIG9yIGVxdWl2XG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IGpvaW46IG5vdCB0aGUgc2FtZTogXCIgKyB4ICsgXCIgXCIgKyB5KTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIGZpcnN0IG9mIGFuIGFycmF5IG9mIHByb21pc2VzIHRvIGJlY29tZSBzZXR0bGVkLlxuICogQHBhcmFtIGFuc3dlcnMge0FycmF5W0FueSpdfSBwcm9taXNlcyB0byByYWNlXG4gKiBAcmV0dXJucyB7QW55Kn0gdGhlIGZpcnN0IHByb21pc2UgdG8gYmUgc2V0dGxlZFxuICovXG5RLnJhY2UgPSByYWNlO1xuZnVuY3Rpb24gcmFjZShhbnN3ZXJQcykge1xuICAgIHJldHVybiBwcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgLy8gU3dpdGNoIHRvIHRoaXMgb25jZSB3ZSBjYW4gYXNzdW1lIGF0IGxlYXN0IEVTNVxuICAgICAgICAvLyBhbnN3ZXJQcy5mb3JFYWNoKGZ1bmN0aW9uIChhbnN3ZXJQKSB7XG4gICAgICAgIC8vICAgICBRKGFuc3dlclApLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIFVzZSB0aGlzIGluIHRoZSBtZWFudGltZVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYW5zd2VyUHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIFEoYW5zd2VyUHNbaV0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5yYWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oUS5yYWNlKTtcbn07XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFByb21pc2Ugd2l0aCBhIHByb21pc2UgZGVzY3JpcHRvciBvYmplY3QgYW5kIG9wdGlvbmFsIGZhbGxiYWNrXG4gKiBmdW5jdGlvbi4gIFRoZSBkZXNjcmlwdG9yIGNvbnRhaW5zIG1ldGhvZHMgbGlrZSB3aGVuKHJlamVjdGVkKSwgZ2V0KG5hbWUpLFxuICogc2V0KG5hbWUsIHZhbHVlKSwgcG9zdChuYW1lLCBhcmdzKSwgYW5kIGRlbGV0ZShuYW1lKSwgd2hpY2ggYWxsXG4gKiByZXR1cm4gZWl0aGVyIGEgdmFsdWUsIGEgcHJvbWlzZSBmb3IgYSB2YWx1ZSwgb3IgYSByZWplY3Rpb24uICBUaGUgZmFsbGJhY2tcbiAqIGFjY2VwdHMgdGhlIG9wZXJhdGlvbiBuYW1lLCBhIHJlc29sdmVyLCBhbmQgYW55IGZ1cnRoZXIgYXJndW1lbnRzIHRoYXQgd291bGRcbiAqIGhhdmUgYmVlbiBmb3J3YXJkZWQgdG8gdGhlIGFwcHJvcHJpYXRlIG1ldGhvZCBhYm92ZSBoYWQgYSBtZXRob2QgYmVlblxuICogcHJvdmlkZWQgd2l0aCB0aGUgcHJvcGVyIG5hbWUuICBUaGUgQVBJIG1ha2VzIG5vIGd1YXJhbnRlZXMgYWJvdXQgdGhlIG5hdHVyZVxuICogb2YgdGhlIHJldHVybmVkIG9iamVjdCwgYXBhcnQgZnJvbSB0aGF0IGl0IGlzIHVzYWJsZSB3aGVyZWV2ZXIgcHJvbWlzZXMgYXJlXG4gKiBib3VnaHQgYW5kIHNvbGQuXG4gKi9cblEubWFrZVByb21pc2UgPSBQcm9taXNlO1xuZnVuY3Rpb24gUHJvbWlzZShkZXNjcmlwdG9yLCBmYWxsYmFjaywgaW5zcGVjdCkge1xuICAgIGlmIChmYWxsYmFjayA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZhbGxiYWNrID0gZnVuY3Rpb24gKG9wKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIlByb21pc2UgZG9lcyBub3Qgc3VwcG9ydCBvcGVyYXRpb246IFwiICsgb3BcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAoaW5zcGVjdCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3N0YXRlOiBcInVua25vd25cIn07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIHByb21pc2UgPSBvYmplY3RfY3JlYXRlKFByb21pc2UucHJvdG90eXBlKTtcblxuICAgIHByb21pc2UucHJvbWlzZURpc3BhdGNoID0gZnVuY3Rpb24gKHJlc29sdmUsIG9wLCBhcmdzKSB7XG4gICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZGVzY3JpcHRvcltvcF0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBkZXNjcmlwdG9yW29wXS5hcHBseShwcm9taXNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2suY2FsbChwcm9taXNlLCBvcCwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBpbnNwZWN0O1xuXG4gICAgLy8gWFhYIGRlcHJlY2F0ZWQgYHZhbHVlT2ZgIGFuZCBgZXhjZXB0aW9uYCBzdXBwb3J0XG4gICAgaWYgKGluc3BlY3QpIHtcbiAgICAgICAgdmFyIGluc3BlY3RlZCA9IGluc3BlY3QoKTtcbiAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiKSB7XG4gICAgICAgICAgICBwcm9taXNlLmV4Y2VwdGlvbiA9IGluc3BlY3RlZC5yZWFzb247XG4gICAgICAgIH1cblxuICAgICAgICBwcm9taXNlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJwZW5kaW5nXCIgfHxcbiAgICAgICAgICAgICAgICBpbnNwZWN0ZWQuc3RhdGUgPT09IFwicmVqZWN0ZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFwiW29iamVjdCBQcm9taXNlXVwiO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIGRvbmUgPSBmYWxzZTsgICAvLyBlbnN1cmUgdGhlIHVudHJ1c3RlZCBwcm9taXNlIG1ha2VzIGF0IG1vc3QgYVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2luZ2xlIGNhbGwgdG8gb25lIG9mIHRoZSBjYWxsYmFja3NcblxuICAgIGZ1bmN0aW9uIF9mdWxmaWxsZWQodmFsdWUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgZnVsZmlsbGVkID09PSBcImZ1bmN0aW9uXCIgPyBmdWxmaWxsZWQodmFsdWUpIDogdmFsdWU7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JlamVjdGVkKGV4Y2VwdGlvbikge1xuICAgICAgICBpZiAodHlwZW9mIHJlamVjdGVkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhleGNlcHRpb24sIHNlbGYpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKG5ld0V4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3RXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3Byb2dyZXNzZWQodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBwcm9ncmVzc2VkID09PSBcImZ1bmN0aW9uXCIgPyBwcm9ncmVzc2VkKHZhbHVlKSA6IHZhbHVlO1xuICAgIH1cblxuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnByb21pc2VEaXNwYXRjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX2Z1bGZpbGxlZCh2YWx1ZSkpO1xuICAgICAgICB9LCBcIndoZW5cIiwgW2Z1bmN0aW9uIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX3JlamVjdGVkKGV4Y2VwdGlvbikpO1xuICAgICAgICB9XSk7XG4gICAgfSk7XG5cbiAgICAvLyBQcm9ncmVzcyBwcm9wYWdhdG9yIG5lZWQgdG8gYmUgYXR0YWNoZWQgaW4gdGhlIGN1cnJlbnQgdGljay5cbiAgICBzZWxmLnByb21pc2VEaXNwYXRjaCh2b2lkIDAsIFwid2hlblwiLCBbdm9pZCAwLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG5ld1ZhbHVlO1xuICAgICAgICB2YXIgdGhyZXcgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG5ld1ZhbHVlID0gX3Byb2dyZXNzZWQodmFsdWUpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJldyA9IHRydWU7XG4gICAgICAgICAgICBpZiAoUS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgUS5vbmVycm9yKGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aHJldykge1xuICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KG5ld1ZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuUS50YXAgPSBmdW5jdGlvbiAocHJvbWlzZSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50YXAoY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBXb3JrcyBhbG1vc3QgbGlrZSBcImZpbmFsbHlcIiwgYnV0IG5vdCBjYWxsZWQgZm9yIHJlamVjdGlvbnMuXG4gKiBPcmlnaW5hbCByZXNvbHV0aW9uIHZhbHVlIGlzIHBhc3NlZCB0aHJvdWdoIGNhbGxiYWNrIHVuYWZmZWN0ZWQuXG4gKiBDYWxsYmFjayBtYXkgcmV0dXJuIGEgcHJvbWlzZSB0aGF0IHdpbGwgYmUgYXdhaXRlZCBmb3IuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybnMge1EuUHJvbWlzZX1cbiAqIEBleGFtcGxlXG4gKiBkb1NvbWV0aGluZygpXG4gKiAgIC50aGVuKC4uLilcbiAqICAgLnRhcChjb25zb2xlLmxvZylcbiAqICAgLnRoZW4oLi4uKTtcbiAqL1xuUHJvbWlzZS5wcm90b3R5cGUudGFwID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBRKGNhbGxiYWNrKTtcblxuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCh2YWx1ZSkudGhlblJlc29sdmUodmFsdWUpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gb2JzZXJ2ZXIgb24gYSBwcm9taXNlLlxuICpcbiAqIEd1YXJhbnRlZXM6XG4gKlxuICogMS4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgYmUgY2FsbGVkIG9ubHkgb25jZS5cbiAqIDIuIHRoYXQgZWl0aGVyIHRoZSBmdWxmaWxsZWQgY2FsbGJhY2sgb3IgdGhlIHJlamVjdGVkIGNhbGxiYWNrIHdpbGwgYmVcbiAqICAgIGNhbGxlZCwgYnV0IG5vdCBib3RoLlxuICogMy4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgbm90IGJlIGNhbGxlZCBpbiB0aGlzIHR1cm4uXG4gKlxuICogQHBhcmFtIHZhbHVlICAgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIHRvIG9ic2VydmVcbiAqIEBwYXJhbSBmdWxmaWxsZWQgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSBmdWxmaWxsZWQgdmFsdWVcbiAqIEBwYXJhbSByZWplY3RlZCAgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSByZWplY3Rpb24gZXhjZXB0aW9uXG4gKiBAcGFyYW0gcHJvZ3Jlc3NlZCBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBmcm9tIHRoZSBpbnZva2VkIGNhbGxiYWNrXG4gKi9cblEud2hlbiA9IHdoZW47XG5mdW5jdGlvbiB3aGVuKHZhbHVlLCBmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEodmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiB2YWx1ZTsgfSk7XG59O1xuXG5RLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHByb21pc2UsIHZhbHVlKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZSkudGhlblJlc29sdmUodmFsdWUpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlblJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICgpIHsgdGhyb3cgcmVhc29uOyB9KTtcbn07XG5cblEudGhlblJlamVjdCA9IGZ1bmN0aW9uIChwcm9taXNlLCByZWFzb24pIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50aGVuUmVqZWN0KHJlYXNvbik7XG59O1xuXG4vKipcbiAqIElmIGFuIG9iamVjdCBpcyBub3QgYSBwcm9taXNlLCBpdCBpcyBhcyBcIm5lYXJcIiBhcyBwb3NzaWJsZS5cbiAqIElmIGEgcHJvbWlzZSBpcyByZWplY3RlZCwgaXQgaXMgYXMgXCJuZWFyXCIgYXMgcG9zc2libGUgdG9vLlxuICogSWYgaXTigJlzIGEgZnVsZmlsbGVkIHByb21pc2UsIHRoZSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZWFyZXIuXG4gKiBJZiBpdOKAmXMgYSBkZWZlcnJlZCBwcm9taXNlIGFuZCB0aGUgZGVmZXJyZWQgaGFzIGJlZW4gcmVzb2x2ZWQsIHRoZVxuICogcmVzb2x1dGlvbiBpcyBcIm5lYXJlclwiLlxuICogQHBhcmFtIG9iamVjdFxuICogQHJldHVybnMgbW9zdCByZXNvbHZlZCAobmVhcmVzdCkgZm9ybSBvZiB0aGUgb2JqZWN0XG4gKi9cblxuLy8gWFhYIHNob3VsZCB3ZSByZS1kbyB0aGlzP1xuUS5uZWFyZXIgPSBuZWFyZXI7XG5mdW5jdGlvbiBuZWFyZXIodmFsdWUpIHtcbiAgICBpZiAoaXNQcm9taXNlKHZhbHVlKSkge1xuICAgICAgICB2YXIgaW5zcGVjdGVkID0gdmFsdWUuaW5zcGVjdCgpO1xuICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zcGVjdGVkLnZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSBwcm9taXNlLlxuICogT3RoZXJ3aXNlIGl0IGlzIGEgZnVsZmlsbGVkIHZhbHVlLlxuICovXG5RLmlzUHJvbWlzZSA9IGlzUHJvbWlzZTtcbmZ1bmN0aW9uIGlzUHJvbWlzZShvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgUHJvbWlzZTtcbn1cblxuUS5pc1Byb21pc2VBbGlrZSA9IGlzUHJvbWlzZUFsaWtlO1xuZnVuY3Rpb24gaXNQcm9taXNlQWxpa2Uob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzT2JqZWN0KG9iamVjdCkgJiYgdHlwZW9mIG9iamVjdC50aGVuID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcGVuZGluZyBwcm9taXNlLCBtZWFuaW5nIG5vdFxuICogZnVsZmlsbGVkIG9yIHJlamVjdGVkLlxuICovXG5RLmlzUGVuZGluZyA9IGlzUGVuZGluZztcbmZ1bmN0aW9uIGlzUGVuZGluZyhvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJwZW5kaW5nXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzUGVuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwicGVuZGluZ1wiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSB2YWx1ZSBvciBmdWxmaWxsZWRcbiAqIHByb21pc2UuXG4gKi9cblEuaXNGdWxmaWxsZWQgPSBpc0Z1bGZpbGxlZDtcbmZ1bmN0aW9uIGlzRnVsZmlsbGVkKG9iamVjdCkge1xuICAgIHJldHVybiAhaXNQcm9taXNlKG9iamVjdCkgfHwgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNGdWxmaWxsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSByZWplY3RlZCBwcm9taXNlLlxuICovXG5RLmlzUmVqZWN0ZWQgPSBpc1JlamVjdGVkO1xuZnVuY3Rpb24gaXNSZWplY3RlZChvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1JlamVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufTtcblxuLy8vLyBCRUdJTiBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8vIFRoaXMgcHJvbWlzZSBsaWJyYXJ5IGNvbnN1bWVzIGV4Y2VwdGlvbnMgdGhyb3duIGluIGhhbmRsZXJzIHNvIHRoZXkgY2FuIGJlXG4vLyBoYW5kbGVkIGJ5IGEgc3Vic2VxdWVudCBwcm9taXNlLiAgVGhlIGV4Y2VwdGlvbnMgZ2V0IGFkZGVkIHRvIHRoaXMgYXJyYXkgd2hlblxuLy8gdGhleSBhcmUgY3JlYXRlZCwgYW5kIHJlbW92ZWQgd2hlbiB0aGV5IGFyZSBoYW5kbGVkLiAgTm90ZSB0aGF0IGluIEVTNiBvclxuLy8gc2hpbW1lZCBlbnZpcm9ubWVudHMsIHRoaXMgd291bGQgbmF0dXJhbGx5IGJlIGEgYFNldGAuXG52YXIgdW5oYW5kbGVkUmVhc29ucyA9IFtdO1xudmFyIHVuaGFuZGxlZFJlamVjdGlvbnMgPSBbXTtcbnZhciByZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMgPSBbXTtcbnZhciB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSB0cnVlO1xuXG5mdW5jdGlvbiByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKSB7XG4gICAgdW5oYW5kbGVkUmVhc29ucy5sZW5ndGggPSAwO1xuICAgIHVuaGFuZGxlZFJlamVjdGlvbnMubGVuZ3RoID0gMDtcblxuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IHRydWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cmFja1JlamVjdGlvbihwcm9taXNlLCByZWFzb24pIHtcbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcHJvY2Vzcy5lbWl0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgUS5uZXh0VGljay5ydW5BZnRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoYXJyYXlfaW5kZXhPZih1bmhhbmRsZWRSZWplY3Rpb25zLCBwcm9taXNlKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmVtaXQoXCJ1bmhhbmRsZWRSZWplY3Rpb25cIiwgcmVhc29uLCBwcm9taXNlKTtcbiAgICAgICAgICAgICAgICByZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMucHVzaChwcm9taXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5wdXNoKHByb21pc2UpO1xuICAgIGlmIChyZWFzb24gJiYgdHlwZW9mIHJlYXNvbi5zdGFjayAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2gocmVhc29uLnN0YWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2goXCIobm8gc3RhY2spIFwiICsgcmVhc29uKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVudHJhY2tSZWplY3Rpb24ocHJvbWlzZSkge1xuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYXQgPSBhcnJheV9pbmRleE9mKHVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpO1xuICAgIGlmIChhdCAhPT0gLTEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBwcm9jZXNzLmVtaXQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgUS5uZXh0VGljay5ydW5BZnRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF0UmVwb3J0ID0gYXJyYXlfaW5kZXhPZihyZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpO1xuICAgICAgICAgICAgICAgIGlmIChhdFJlcG9ydCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbWl0KFwicmVqZWN0aW9uSGFuZGxlZFwiLCB1bmhhbmRsZWRSZWFzb25zW2F0XSwgcHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydGVkVW5oYW5kbGVkUmVqZWN0aW9ucy5zcGxpY2UoYXRSZXBvcnQsIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHVuaGFuZGxlZFJlamVjdGlvbnMuc3BsaWNlKGF0LCAxKTtcbiAgICAgICAgdW5oYW5kbGVkUmVhc29ucy5zcGxpY2UoYXQsIDEpO1xuICAgIH1cbn1cblxuUS5yZXNldFVuaGFuZGxlZFJlamVjdGlvbnMgPSByZXNldFVuaGFuZGxlZFJlamVjdGlvbnM7XG5cblEuZ2V0VW5oYW5kbGVkUmVhc29ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBNYWtlIGEgY29weSBzbyB0aGF0IGNvbnN1bWVycyBjYW4ndCBpbnRlcmZlcmUgd2l0aCBvdXIgaW50ZXJuYWwgc3RhdGUuXG4gICAgcmV0dXJuIHVuaGFuZGxlZFJlYXNvbnMuc2xpY2UoKTtcbn07XG5cblEuc3RvcFVuaGFuZGxlZFJlamVjdGlvblRyYWNraW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpO1xuICAgIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IGZhbHNlO1xufTtcblxucmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zKCk7XG5cbi8vLy8gRU5EIFVOSEFORExFRCBSRUpFQ1RJT04gVFJBQ0tJTkdcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcmVqZWN0ZWQgcHJvbWlzZS5cbiAqIEBwYXJhbSByZWFzb24gdmFsdWUgZGVzY3JpYmluZyB0aGUgZmFpbHVyZVxuICovXG5RLnJlamVjdCA9IHJlamVjdDtcbmZ1bmN0aW9uIHJlamVjdChyZWFzb24pIHtcbiAgICB2YXIgcmVqZWN0aW9uID0gUHJvbWlzZSh7XG4gICAgICAgIFwid2hlblwiOiBmdW5jdGlvbiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICAgIC8vIG5vdGUgdGhhdCB0aGUgZXJyb3IgaGFzIGJlZW4gaGFuZGxlZFxuICAgICAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgdW50cmFja1JlamVjdGlvbih0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3RlZCA/IHJlamVjdGVkKHJlYXNvbikgOiB0aGlzO1xuICAgICAgICB9XG4gICAgfSwgZnVuY3Rpb24gZmFsbGJhY2soKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sIGZ1bmN0aW9uIGluc3BlY3QoKSB7XG4gICAgICAgIHJldHVybiB7IHN0YXRlOiBcInJlamVjdGVkXCIsIHJlYXNvbjogcmVhc29uIH07XG4gICAgfSk7XG5cbiAgICAvLyBOb3RlIHRoYXQgdGhlIHJlYXNvbiBoYXMgbm90IGJlZW4gaGFuZGxlZC5cbiAgICB0cmFja1JlamVjdGlvbihyZWplY3Rpb24sIHJlYXNvbik7XG5cbiAgICByZXR1cm4gcmVqZWN0aW9uO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBmdWxmaWxsZWQgcHJvbWlzZSBmb3IgYW4gaW1tZWRpYXRlIHJlZmVyZW5jZS5cbiAqIEBwYXJhbSB2YWx1ZSBpbW1lZGlhdGUgcmVmZXJlbmNlXG4gKi9cblEuZnVsZmlsbCA9IGZ1bGZpbGw7XG5mdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7XG4gICAgcmV0dXJuIFByb21pc2Uoe1xuICAgICAgICBcIndoZW5cIjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBcImdldFwiOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlW25hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBcInNldFwiOiBmdW5jdGlvbiAobmFtZSwgcmhzKSB7XG4gICAgICAgICAgICB2YWx1ZVtuYW1lXSA9IHJocztcbiAgICAgICAgfSxcbiAgICAgICAgXCJkZWxldGVcIjogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB2YWx1ZVtuYW1lXTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJwb3N0XCI6IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgICAgICAgICAvLyBNYXJrIE1pbGxlciBwcm9wb3NlcyB0aGF0IHBvc3Qgd2l0aCBubyBuYW1lIHNob3VsZCBhcHBseSBhXG4gICAgICAgICAgICAvLyBwcm9taXNlZCBmdW5jdGlvbi5cbiAgICAgICAgICAgIGlmIChuYW1lID09PSBudWxsIHx8IG5hbWUgPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5hcHBseSh2b2lkIDAsIGFyZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVbbmFtZV0uYXBwbHkodmFsdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImFwcGx5XCI6IGZ1bmN0aW9uICh0aGlzcCwgYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmFwcGx5KHRoaXNwLCBhcmdzKTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJrZXlzXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3Rfa2V5cyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9LCB2b2lkIDAsIGZ1bmN0aW9uIGluc3BlY3QoKSB7XG4gICAgICAgIHJldHVybiB7IHN0YXRlOiBcImZ1bGZpbGxlZFwiLCB2YWx1ZTogdmFsdWUgfTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyB0aGVuYWJsZXMgdG8gUSBwcm9taXNlcy5cbiAqIEBwYXJhbSBwcm9taXNlIHRoZW5hYmxlIHByb21pc2VcbiAqIEByZXR1cm5zIGEgUSBwcm9taXNlXG4gKi9cbmZ1bmN0aW9uIGNvZXJjZShwcm9taXNlKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHByb21pc2UudGhlbihkZWZlcnJlZC5yZXNvbHZlLCBkZWZlcnJlZC5yZWplY3QsIGRlZmVycmVkLm5vdGlmeSk7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgYW4gb2JqZWN0IHN1Y2ggdGhhdCBpdCB3aWxsIG5ldmVyIGJlXG4gKiB0cmFuc2ZlcnJlZCBhd2F5IGZyb20gdGhpcyBwcm9jZXNzIG92ZXIgYW55IHByb21pc2VcbiAqIGNvbW11bmljYXRpb24gY2hhbm5lbC5cbiAqIEBwYXJhbSBvYmplY3RcbiAqIEByZXR1cm5zIHByb21pc2UgYSB3cmFwcGluZyBvZiB0aGF0IG9iamVjdCB0aGF0XG4gKiBhZGRpdGlvbmFsbHkgcmVzcG9uZHMgdG8gdGhlIFwiaXNEZWZcIiBtZXNzYWdlXG4gKiB3aXRob3V0IGEgcmVqZWN0aW9uLlxuICovXG5RLm1hc3RlciA9IG1hc3RlcjtcbmZ1bmN0aW9uIG1hc3RlcihvYmplY3QpIHtcbiAgICByZXR1cm4gUHJvbWlzZSh7XG4gICAgICAgIFwiaXNEZWZcIjogZnVuY3Rpb24gKCkge31cbiAgICB9LCBmdW5jdGlvbiBmYWxsYmFjayhvcCwgYXJncykge1xuICAgICAgICByZXR1cm4gZGlzcGF0Y2gob2JqZWN0LCBvcCwgYXJncyk7XG4gICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gUShvYmplY3QpLmluc3BlY3QoKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBTcHJlYWRzIHRoZSB2YWx1ZXMgb2YgYSBwcm9taXNlZCBhcnJheSBvZiBhcmd1bWVudHMgaW50byB0aGVcbiAqIGZ1bGZpbGxtZW50IGNhbGxiYWNrLlxuICogQHBhcmFtIGZ1bGZpbGxlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHZhcmlhZGljIGFyZ3VtZW50cyBmcm9tIHRoZVxuICogcHJvbWlzZWQgYXJyYXlcbiAqIEBwYXJhbSByZWplY3RlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHRoZSBleGNlcHRpb24gaWYgdGhlIHByb21pc2VcbiAqIGlzIHJlamVjdGVkLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIG9yIHRocm93biBleGNlcHRpb24gb2ZcbiAqIGVpdGhlciBjYWxsYmFjay5cbiAqL1xuUS5zcHJlYWQgPSBzcHJlYWQ7XG5mdW5jdGlvbiBzcHJlYWQodmFsdWUsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUSh2YWx1ZSkuc3ByZWFkKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5zcHJlYWQgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLmFsbCgpLnRoZW4oZnVuY3Rpb24gKGFycmF5KSB7XG4gICAgICAgIHJldHVybiBmdWxmaWxsZWQuYXBwbHkodm9pZCAwLCBhcnJheSk7XG4gICAgfSwgcmVqZWN0ZWQpO1xufTtcblxuLyoqXG4gKiBUaGUgYXN5bmMgZnVuY3Rpb24gaXMgYSBkZWNvcmF0b3IgZm9yIGdlbmVyYXRvciBmdW5jdGlvbnMsIHR1cm5pbmdcbiAqIHRoZW0gaW50byBhc3luY2hyb25vdXMgZ2VuZXJhdG9ycy4gIEFsdGhvdWdoIGdlbmVyYXRvcnMgYXJlIG9ubHkgcGFydFxuICogb2YgdGhlIG5ld2VzdCBFQ01BU2NyaXB0IDYgZHJhZnRzLCB0aGlzIGNvZGUgZG9lcyBub3QgY2F1c2Ugc3ludGF4XG4gKiBlcnJvcnMgaW4gb2xkZXIgZW5naW5lcy4gIFRoaXMgY29kZSBzaG91bGQgY29udGludWUgdG8gd29yayBhbmQgd2lsbFxuICogaW4gZmFjdCBpbXByb3ZlIG92ZXIgdGltZSBhcyB0aGUgbGFuZ3VhZ2UgaW1wcm92ZXMuXG4gKlxuICogRVM2IGdlbmVyYXRvcnMgYXJlIGN1cnJlbnRseSBwYXJ0IG9mIFY4IHZlcnNpb24gMy4xOSB3aXRoIHRoZVxuICogLS1oYXJtb255LWdlbmVyYXRvcnMgcnVudGltZSBmbGFnIGVuYWJsZWQuICBTcGlkZXJNb25rZXkgaGFzIGhhZCB0aGVtXG4gKiBmb3IgbG9uZ2VyLCBidXQgdW5kZXIgYW4gb2xkZXIgUHl0aG9uLWluc3BpcmVkIGZvcm0uICBUaGlzIGZ1bmN0aW9uXG4gKiB3b3JrcyBvbiBib3RoIGtpbmRzIG9mIGdlbmVyYXRvcnMuXG4gKlxuICogRGVjb3JhdGVzIGEgZ2VuZXJhdG9yIGZ1bmN0aW9uIHN1Y2ggdGhhdDpcbiAqICAtIGl0IG1heSB5aWVsZCBwcm9taXNlc1xuICogIC0gZXhlY3V0aW9uIHdpbGwgY29udGludWUgd2hlbiB0aGF0IHByb21pc2UgaXMgZnVsZmlsbGVkXG4gKiAgLSB0aGUgdmFsdWUgb2YgdGhlIHlpZWxkIGV4cHJlc3Npb24gd2lsbCBiZSB0aGUgZnVsZmlsbGVkIHZhbHVlXG4gKiAgLSBpdCByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSAod2hlbiB0aGUgZ2VuZXJhdG9yXG4gKiAgICBzdG9wcyBpdGVyYXRpbmcpXG4gKiAgLSB0aGUgZGVjb3JhdGVkIGZ1bmN0aW9uIHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKiAgICBvZiB0aGUgZ2VuZXJhdG9yIG9yIHRoZSBmaXJzdCByZWplY3RlZCBwcm9taXNlIGFtb25nIHRob3NlXG4gKiAgICB5aWVsZGVkLlxuICogIC0gaWYgYW4gZXJyb3IgaXMgdGhyb3duIGluIHRoZSBnZW5lcmF0b3IsIGl0IHByb3BhZ2F0ZXMgdGhyb3VnaFxuICogICAgZXZlcnkgZm9sbG93aW5nIHlpZWxkIHVudGlsIGl0IGlzIGNhdWdodCwgb3IgdW50aWwgaXQgZXNjYXBlc1xuICogICAgdGhlIGdlbmVyYXRvciBmdW5jdGlvbiBhbHRvZ2V0aGVyLCBhbmQgaXMgdHJhbnNsYXRlZCBpbnRvIGFcbiAqICAgIHJlamVjdGlvbiBmb3IgdGhlIHByb21pc2UgcmV0dXJuZWQgYnkgdGhlIGRlY29yYXRlZCBnZW5lcmF0b3IuXG4gKi9cblEuYXN5bmMgPSBhc3luYztcbmZ1bmN0aW9uIGFzeW5jKG1ha2VHZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyB3aGVuIHZlcmIgaXMgXCJzZW5kXCIsIGFyZyBpcyBhIHZhbHVlXG4gICAgICAgIC8vIHdoZW4gdmVyYiBpcyBcInRocm93XCIsIGFyZyBpcyBhbiBleGNlcHRpb25cbiAgICAgICAgZnVuY3Rpb24gY29udGludWVyKHZlcmIsIGFyZykge1xuICAgICAgICAgICAgdmFyIHJlc3VsdDtcblxuICAgICAgICAgICAgLy8gVW50aWwgVjggMy4xOSAvIENocm9taXVtIDI5IGlzIHJlbGVhc2VkLCBTcGlkZXJNb25rZXkgaXMgdGhlIG9ubHlcbiAgICAgICAgICAgIC8vIGVuZ2luZSB0aGF0IGhhcyBhIGRlcGxveWVkIGJhc2Ugb2YgYnJvd3NlcnMgdGhhdCBzdXBwb3J0IGdlbmVyYXRvcnMuXG4gICAgICAgICAgICAvLyBIb3dldmVyLCBTTSdzIGdlbmVyYXRvcnMgdXNlIHRoZSBQeXRob24taW5zcGlyZWQgc2VtYW50aWNzIG9mXG4gICAgICAgICAgICAvLyBvdXRkYXRlZCBFUzYgZHJhZnRzLiAgV2Ugd291bGQgbGlrZSB0byBzdXBwb3J0IEVTNiwgYnV0IHdlJ2QgYWxzb1xuICAgICAgICAgICAgLy8gbGlrZSB0byBtYWtlIGl0IHBvc3NpYmxlIHRvIHVzZSBnZW5lcmF0b3JzIGluIGRlcGxveWVkIGJyb3dzZXJzLCBzb1xuICAgICAgICAgICAgLy8gd2UgYWxzbyBzdXBwb3J0IFB5dGhvbi1zdHlsZSBnZW5lcmF0b3JzLiAgQXQgc29tZSBwb2ludCB3ZSBjYW4gcmVtb3ZlXG4gICAgICAgICAgICAvLyB0aGlzIGJsb2NrLlxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIFN0b3BJdGVyYXRpb24gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAvLyBFUzYgR2VuZXJhdG9yc1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXShhcmcpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZG9uZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUShyZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3aGVuKHJlc3VsdC52YWx1ZSwgY2FsbGJhY2ssIGVycmJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gU3BpZGVyTW9ua2V5IEdlbmVyYXRvcnNcbiAgICAgICAgICAgICAgICAvLyBGSVhNRTogUmVtb3ZlIHRoaXMgY2FzZSB3aGVuIFNNIGRvZXMgRVM2IGdlbmVyYXRvcnMuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKGFyZyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1N0b3BJdGVyYXRpb24oZXhjZXB0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFEoZXhjZXB0aW9uLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gd2hlbihyZXN1bHQsIGNhbGxiYWNrLCBlcnJiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZ2VuZXJhdG9yID0gbWFrZUdlbmVyYXRvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwibmV4dFwiKTtcbiAgICAgICAgdmFyIGVycmJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwidGhyb3dcIik7XG4gICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgIH07XG59XG5cbi8qKlxuICogVGhlIHNwYXduIGZ1bmN0aW9uIGlzIGEgc21hbGwgd3JhcHBlciBhcm91bmQgYXN5bmMgdGhhdCBpbW1lZGlhdGVseVxuICogY2FsbHMgdGhlIGdlbmVyYXRvciBhbmQgYWxzbyBlbmRzIHRoZSBwcm9taXNlIGNoYWluLCBzbyB0aGF0IGFueVxuICogdW5oYW5kbGVkIGVycm9ycyBhcmUgdGhyb3duIGluc3RlYWQgb2YgZm9yd2FyZGVkIHRvIHRoZSBlcnJvclxuICogaGFuZGxlci4gVGhpcyBpcyB1c2VmdWwgYmVjYXVzZSBpdCdzIGV4dHJlbWVseSBjb21tb24gdG8gcnVuXG4gKiBnZW5lcmF0b3JzIGF0IHRoZSB0b3AtbGV2ZWwgdG8gd29yayB3aXRoIGxpYnJhcmllcy5cbiAqL1xuUS5zcGF3biA9IHNwYXduO1xuZnVuY3Rpb24gc3Bhd24obWFrZUdlbmVyYXRvcikge1xuICAgIFEuZG9uZShRLmFzeW5jKG1ha2VHZW5lcmF0b3IpKCkpO1xufVxuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgaW50ZXJmYWNlIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluIFNwaWRlck1vbmtleS5cbi8qKlxuICogVGhyb3dzIGEgUmV0dXJuVmFsdWUgZXhjZXB0aW9uIHRvIHN0b3AgYW4gYXN5bmNocm9ub3VzIGdlbmVyYXRvci5cbiAqXG4gKiBUaGlzIGludGVyZmFjZSBpcyBhIHN0b3AtZ2FwIG1lYXN1cmUgdG8gc3VwcG9ydCBnZW5lcmF0b3IgcmV0dXJuXG4gKiB2YWx1ZXMgaW4gb2xkZXIgRmlyZWZveC9TcGlkZXJNb25rZXkuICBJbiBicm93c2VycyB0aGF0IHN1cHBvcnQgRVM2XG4gKiBnZW5lcmF0b3JzIGxpa2UgQ2hyb21pdW0gMjksIGp1c3QgdXNlIFwicmV0dXJuXCIgaW4geW91ciBnZW5lcmF0b3JcbiAqIGZ1bmN0aW9ucy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgdGhlIHJldHVybiB2YWx1ZSBmb3IgdGhlIHN1cnJvdW5kaW5nIGdlbmVyYXRvclxuICogQHRocm93cyBSZXR1cm5WYWx1ZSBleGNlcHRpb24gd2l0aCB0aGUgdmFsdWUuXG4gKiBAZXhhbXBsZVxuICogLy8gRVM2IHN0eWxlXG4gKiBRLmFzeW5jKGZ1bmN0aW9uKiAoKSB7XG4gKiAgICAgIHZhciBmb28gPSB5aWVsZCBnZXRGb29Qcm9taXNlKCk7XG4gKiAgICAgIHZhciBiYXIgPSB5aWVsZCBnZXRCYXJQcm9taXNlKCk7XG4gKiAgICAgIHJldHVybiBmb28gKyBiYXI7XG4gKiB9KVxuICogLy8gT2xkZXIgU3BpZGVyTW9ua2V5IHN0eWxlXG4gKiBRLmFzeW5jKGZ1bmN0aW9uICgpIHtcbiAqICAgICAgdmFyIGZvbyA9IHlpZWxkIGdldEZvb1Byb21pc2UoKTtcbiAqICAgICAgdmFyIGJhciA9IHlpZWxkIGdldEJhclByb21pc2UoKTtcbiAqICAgICAgUS5yZXR1cm4oZm9vICsgYmFyKTtcbiAqIH0pXG4gKi9cblFbXCJyZXR1cm5cIl0gPSBfcmV0dXJuO1xuZnVuY3Rpb24gX3JldHVybih2YWx1ZSkge1xuICAgIHRocm93IG5ldyBRUmV0dXJuVmFsdWUodmFsdWUpO1xufVxuXG4vKipcbiAqIFRoZSBwcm9taXNlZCBmdW5jdGlvbiBkZWNvcmF0b3IgZW5zdXJlcyB0aGF0IGFueSBwcm9taXNlIGFyZ3VtZW50c1xuICogYXJlIHNldHRsZWQgYW5kIHBhc3NlZCBhcyB2YWx1ZXMgKGB0aGlzYCBpcyBhbHNvIHNldHRsZWQgYW5kIHBhc3NlZFxuICogYXMgYSB2YWx1ZSkuICBJdCB3aWxsIGFsc28gZW5zdXJlIHRoYXQgdGhlIHJlc3VsdCBvZiBhIGZ1bmN0aW9uIGlzXG4gKiBhbHdheXMgYSBwcm9taXNlLlxuICpcbiAqIEBleGFtcGxlXG4gKiB2YXIgYWRkID0gUS5wcm9taXNlZChmdW5jdGlvbiAoYSwgYikge1xuICogICAgIHJldHVybiBhICsgYjtcbiAqIH0pO1xuICogYWRkKFEoYSksIFEoQikpO1xuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0byBkZWNvcmF0ZVxuICogQHJldHVybnMge2Z1bmN0aW9ufSBhIGZ1bmN0aW9uIHRoYXQgaGFzIGJlZW4gZGVjb3JhdGVkLlxuICovXG5RLnByb21pc2VkID0gcHJvbWlzZWQ7XG5mdW5jdGlvbiBwcm9taXNlZChjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzcHJlYWQoW3RoaXMsIGFsbChhcmd1bWVudHMpXSwgZnVuY3Rpb24gKHNlbGYsIGFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseShzZWxmLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBzZW5kcyBhIG1lc3NhZ2UgdG8gYSB2YWx1ZSBpbiBhIGZ1dHVyZSB0dXJuXG4gKiBAcGFyYW0gb2JqZWN0KiB0aGUgcmVjaXBpZW50XG4gKiBAcGFyYW0gb3AgdGhlIG5hbWUgb2YgdGhlIG1lc3NhZ2Ugb3BlcmF0aW9uLCBlLmcuLCBcIndoZW5cIixcbiAqIEBwYXJhbSBhcmdzIGZ1cnRoZXIgYXJndW1lbnRzIHRvIGJlIGZvcndhcmRlZCB0byB0aGUgb3BlcmF0aW9uXG4gKiBAcmV0dXJucyByZXN1bHQge1Byb21pc2V9IGEgcHJvbWlzZSBmb3IgdGhlIHJlc3VsdCBvZiB0aGUgb3BlcmF0aW9uXG4gKi9cblEuZGlzcGF0Y2ggPSBkaXNwYXRjaDtcbmZ1bmN0aW9uIGRpc3BhdGNoKG9iamVjdCwgb3AsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKG9wLCBhcmdzKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuZGlzcGF0Y2ggPSBmdW5jdGlvbiAob3AsIGFyZ3MpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5wcm9taXNlRGlzcGF0Y2goZGVmZXJyZWQucmVzb2x2ZSwgb3AsIGFyZ3MpO1xuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIGdldFxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcHJvcGVydHkgdmFsdWVcbiAqL1xuUS5nZXQgPSBmdW5jdGlvbiAob2JqZWN0LCBrZXkpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiZ2V0XCIsIFtrZXldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImdldFwiLCBba2V5XSk7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciBvYmplY3Qgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gc2V0XG4gKiBAcGFyYW0gdmFsdWUgICAgIG5ldyB2YWx1ZSBvZiBwcm9wZXJ0eVxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuc2V0ID0gZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJzZXRcIiwgW2tleSwgdmFsdWVdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJzZXRcIiwgW2tleSwgdmFsdWVdKTtcbn07XG5cbi8qKlxuICogRGVsZXRlcyBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIGRlbGV0ZVxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuZGVsID0gLy8gWFhYIGxlZ2FjeVxuUVtcImRlbGV0ZVwiXSA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJkZWxldGVcIiwgW2tleV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZGVsID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJkZWxldGVcIl0gPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJkZWxldGVcIiwgW2tleV0pO1xufTtcblxuLyoqXG4gKiBJbnZva2VzIGEgbWV0aG9kIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIG1ldGhvZCB0byBpbnZva2VcbiAqIEBwYXJhbSB2YWx1ZSAgICAgYSB2YWx1ZSB0byBwb3N0LCB0eXBpY2FsbHkgYW4gYXJyYXkgb2ZcbiAqICAgICAgICAgICAgICAgICAgaW52b2NhdGlvbiBhcmd1bWVudHMgZm9yIHByb21pc2VzIHRoYXRcbiAqICAgICAgICAgICAgICAgICAgYXJlIHVsdGltYXRlbHkgYmFja2VkIHdpdGggYHJlc29sdmVgIHZhbHVlcyxcbiAqICAgICAgICAgICAgICAgICAgYXMgb3Bwb3NlZCB0byB0aG9zZSBiYWNrZWQgd2l0aCBVUkxzXG4gKiAgICAgICAgICAgICAgICAgIHdoZXJlaW4gdGhlIHBvc3RlZCB2YWx1ZSBjYW4gYmUgYW55XG4gKiAgICAgICAgICAgICAgICAgIEpTT04gc2VyaWFsaXphYmxlIG9iamVjdC5cbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG4vLyBib3VuZCBsb2NhbGx5IGJlY2F1c2UgaXQgaXMgdXNlZCBieSBvdGhlciBtZXRob2RzXG5RLm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLnBvc3QgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFyZ3NdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5wb3N0ID0gZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFyZ3NdKTtcbn07XG5cbi8qKlxuICogSW52b2tlcyBhIG1ldGhvZCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBtZXRob2QgdG8gaW52b2tlXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGludm9jYXRpb24gYXJndW1lbnRzXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5zZW5kID0gLy8gWFhYIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgcGFybGFuY2VcblEubWNhbGwgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5pbnZva2UgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMildKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnNlbmQgPSAvLyBYWFggTWFyayBNaWxsZXIncyBwcm9wb3NlZCBwYXJsYW5jZVxuUHJvbWlzZS5wcm90b3R5cGUubWNhbGwgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUuaW52b2tlID0gZnVuY3Rpb24gKG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSldKTtcbn07XG5cbi8qKlxuICogQXBwbGllcyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24gaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSBhcmdzICAgICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblEuZmFwcGx5ID0gZnVuY3Rpb24gKG9iamVjdCwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcmdzXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mYXBwbHkgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJnc10pO1xufTtcblxuLyoqXG4gKiBDYWxscyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24gaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblFbXCJ0cnlcIl0gPVxuUS5mY2FsbCA9IGZ1bmN0aW9uIChvYmplY3QgLyogLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZjYWxsID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcnJheV9zbGljZShhcmd1bWVudHMpXSk7XG59O1xuXG4vKipcbiAqIEJpbmRzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiwgdHJhbnNmb3JtaW5nIHJldHVybiB2YWx1ZXMgaW50byBhIGZ1bGZpbGxlZFxuICogcHJvbWlzZSBhbmQgdGhyb3duIGVycm9ycyBpbnRvIGEgcmVqZWN0ZWQgb25lLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUS5mYmluZCA9IGZ1bmN0aW9uIChvYmplY3QgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgcHJvbWlzZSA9IFEob2JqZWN0KTtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZib3VuZCgpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UuZGlzcGF0Y2goXCJhcHBseVwiLCBbXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgYXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSlcbiAgICAgICAgXSk7XG4gICAgfTtcbn07XG5Qcm9taXNlLnByb3RvdHlwZS5mYmluZCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBwcm9taXNlID0gdGhpcztcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZib3VuZCgpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UuZGlzcGF0Y2goXCJhcHBseVwiLCBbXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgYXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSlcbiAgICAgICAgXSk7XG4gICAgfTtcbn07XG5cbi8qKlxuICogUmVxdWVzdHMgdGhlIG5hbWVzIG9mIHRoZSBvd25lZCBwcm9wZXJ0aWVzIG9mIGEgcHJvbWlzZWRcbiAqIG9iamVjdCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIGtleXMgb2YgdGhlIGV2ZW50dWFsbHkgc2V0dGxlZCBvYmplY3RcbiAqL1xuUS5rZXlzID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJrZXlzXCIsIFtdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJrZXlzXCIsIFtdKTtcbn07XG5cbi8qKlxuICogVHVybnMgYW4gYXJyYXkgb2YgcHJvbWlzZXMgaW50byBhIHByb21pc2UgZm9yIGFuIGFycmF5LiAgSWYgYW55IG9mXG4gKiB0aGUgcHJvbWlzZXMgZ2V0cyByZWplY3RlZCwgdGhlIHdob2xlIGFycmF5IGlzIHJlamVjdGVkIGltbWVkaWF0ZWx5LlxuICogQHBhcmFtIHtBcnJheSp9IGFuIGFycmF5IChvciBwcm9taXNlIGZvciBhbiBhcnJheSkgb2YgdmFsdWVzIChvclxuICogcHJvbWlzZXMgZm9yIHZhbHVlcylcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzXG4gKi9cbi8vIEJ5IE1hcmsgTWlsbGVyXG4vLyBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1zdHJhd21hbjpjb25jdXJyZW5jeSZyZXY9MTMwODc3NjUyMSNhbGxmdWxmaWxsZWRcblEuYWxsID0gYWxsO1xuZnVuY3Rpb24gYWxsKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIHdoZW4ocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgICAgICB2YXIgcGVuZGluZ0NvdW50ID0gMDtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgYXJyYXlfcmVkdWNlKHByb21pc2VzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBwcm9taXNlLCBpbmRleCkge1xuICAgICAgICAgICAgdmFyIHNuYXBzaG90O1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGlzUHJvbWlzZShwcm9taXNlKSAmJlxuICAgICAgICAgICAgICAgIChzbmFwc2hvdCA9IHByb21pc2UuaW5zcGVjdCgpKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIlxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZXNbaW5kZXhdID0gc25hcHNob3QudmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICsrcGVuZGluZ0NvdW50O1xuICAgICAgICAgICAgICAgIHdoZW4oXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXNbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoLS1wZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0LFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLm5vdGlmeSh7IGluZGV4OiBpbmRleCwgdmFsdWU6IHByb2dyZXNzIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICAgICAgaWYgKHBlbmRpbmdDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gYWxsKHRoaXMpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBmaXJzdCByZXNvbHZlZCBwcm9taXNlIG9mIGFuIGFycmF5LiBQcmlvciByZWplY3RlZCBwcm9taXNlcyBhcmVcbiAqIGlnbm9yZWQuICBSZWplY3RzIG9ubHkgaWYgYWxsIHByb21pc2VzIGFyZSByZWplY3RlZC5cbiAqIEBwYXJhbSB7QXJyYXkqfSBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyBvciBwcm9taXNlcyBmb3IgdmFsdWVzXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZnVsZmlsbGVkIHdpdGggdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCByZXNvbHZlZCBwcm9taXNlLFxuICogb3IgYSByZWplY3RlZCBwcm9taXNlIGlmIGFsbCBwcm9taXNlcyBhcmUgcmVqZWN0ZWQuXG4gKi9cblEuYW55ID0gYW55O1xuXG5mdW5jdGlvbiBhbnkocHJvbWlzZXMpIHtcbiAgICBpZiAocHJvbWlzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBRLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG4gICAgdmFyIHBlbmRpbmdDb3VudCA9IDA7XG4gICAgYXJyYXlfcmVkdWNlKHByb21pc2VzLCBmdW5jdGlvbiAocHJldiwgY3VycmVudCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSBwcm9taXNlc1tpbmRleF07XG5cbiAgICAgICAgcGVuZGluZ0NvdW50Kys7XG5cbiAgICAgICAgd2hlbihwcm9taXNlLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgb25Qcm9ncmVzcyk7XG4gICAgICAgIGZ1bmN0aW9uIG9uRnVsZmlsbGVkKHJlc3VsdCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uUmVqZWN0ZWQoKSB7XG4gICAgICAgICAgICBwZW5kaW5nQ291bnQtLTtcbiAgICAgICAgICAgIGlmIChwZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QobmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICBcIkNhbid0IGdldCBmdWxmaWxsbWVudCB2YWx1ZSBmcm9tIGFueSBwcm9taXNlLCBhbGwgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcInByb21pc2VzIHdlcmUgcmVqZWN0ZWQuXCJcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvblByb2dyZXNzKHByb2dyZXNzKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkoe1xuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcHJvZ3Jlc3NcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSwgdW5kZWZpbmVkKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFueSh0aGlzKTtcbn07XG5cbi8qKlxuICogV2FpdHMgZm9yIGFsbCBwcm9taXNlcyB0byBiZSBzZXR0bGVkLCBlaXRoZXIgZnVsZmlsbGVkIG9yXG4gKiByZWplY3RlZC4gIFRoaXMgaXMgZGlzdGluY3QgZnJvbSBgYWxsYCBzaW5jZSB0aGF0IHdvdWxkIHN0b3BcbiAqIHdhaXRpbmcgYXQgdGhlIGZpcnN0IHJlamVjdGlvbi4gIFRoZSBwcm9taXNlIHJldHVybmVkIGJ5XG4gKiBgYWxsUmVzb2x2ZWRgIHdpbGwgbmV2ZXIgYmUgcmVqZWN0ZWQuXG4gKiBAcGFyYW0gcHJvbWlzZXMgYSBwcm9taXNlIGZvciBhbiBhcnJheSAob3IgYW4gYXJyYXkpIG9mIHByb21pc2VzXG4gKiAob3IgdmFsdWVzKVxuICogQHJldHVybiBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHByb21pc2VzXG4gKi9cblEuYWxsUmVzb2x2ZWQgPSBkZXByZWNhdGUoYWxsUmVzb2x2ZWQsIFwiYWxsUmVzb2x2ZWRcIiwgXCJhbGxTZXR0bGVkXCIpO1xuZnVuY3Rpb24gYWxsUmVzb2x2ZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHByb21pc2VzID0gYXJyYXlfbWFwKHByb21pc2VzLCBRKTtcbiAgICAgICAgcmV0dXJuIHdoZW4oYWxsKGFycmF5X21hcChwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB3aGVuKHByb21pc2UsIG5vb3AsIG5vb3ApO1xuICAgICAgICB9KSksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlcztcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFsbFJlc29sdmVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbGxSZXNvbHZlZCh0aGlzKTtcbn07XG5cbi8qKlxuICogQHNlZSBQcm9taXNlI2FsbFNldHRsZWRcbiAqL1xuUS5hbGxTZXR0bGVkID0gYWxsU2V0dGxlZDtcbmZ1bmN0aW9uIGFsbFNldHRsZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gUShwcm9taXNlcykuYWxsU2V0dGxlZCgpO1xufVxuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiB0aGVpciBzdGF0ZXMgKGFzXG4gKiByZXR1cm5lZCBieSBgaW5zcGVjdGApIHdoZW4gdGhleSBoYXZlIGFsbCBzZXR0bGVkLlxuICogQHBhcmFtIHtBcnJheVtBbnkqXX0gdmFsdWVzIGFuIGFycmF5IChvciBwcm9taXNlIGZvciBhbiBhcnJheSkgb2YgdmFsdWVzIChvclxuICogcHJvbWlzZXMgZm9yIHZhbHVlcylcbiAqIEByZXR1cm5zIHtBcnJheVtTdGF0ZV19IGFuIGFycmF5IG9mIHN0YXRlcyBmb3IgdGhlIHJlc3BlY3RpdmUgdmFsdWVzLlxuICovXG5Qcm9taXNlLnByb3RvdHlwZS5hbGxTZXR0bGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHJldHVybiBhbGwoYXJyYXlfbWFwKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICAgICAgcHJvbWlzZSA9IFEocHJvbWlzZSk7XG4gICAgICAgICAgICBmdW5jdGlvbiByZWdhcmRsZXNzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlLmluc3BlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4ocmVnYXJkbGVzcywgcmVnYXJkbGVzcyk7XG4gICAgICAgIH0pKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogQ2FwdHVyZXMgdGhlIGZhaWx1cmUgb2YgYSBwcm9taXNlLCBnaXZpbmcgYW4gb3BvcnR1bml0eSB0byByZWNvdmVyXG4gKiB3aXRoIGEgY2FsbGJhY2suICBJZiB0aGUgZ2l2ZW4gcHJvbWlzZSBpcyBmdWxmaWxsZWQsIHRoZSByZXR1cm5lZFxuICogcHJvbWlzZSBpcyBmdWxmaWxsZWQuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgZm9yIHNvbWV0aGluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gZnVsZmlsbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpZiB0aGVcbiAqIGdpdmVuIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgY2FsbGJhY2tcbiAqL1xuUS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUVtcImNhdGNoXCJdID0gZnVuY3Rpb24gKG9iamVjdCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG4vKipcbiAqIEF0dGFjaGVzIGEgbGlzdGVuZXIgdGhhdCBjYW4gcmVzcG9uZCB0byBwcm9ncmVzcyBub3RpZmljYXRpb25zIGZyb20gYVxuICogcHJvbWlzZSdzIG9yaWdpbmF0aW5nIGRlZmVycmVkLiBUaGlzIGxpc3RlbmVyIHJlY2VpdmVzIHRoZSBleGFjdCBhcmd1bWVudHNcbiAqIHBhc3NlZCB0byBgYGRlZmVycmVkLm5vdGlmeWBgLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGZvciBzb21ldGhpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIHJlY2VpdmUgYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm5zIHRoZSBnaXZlbiBwcm9taXNlLCB1bmNoYW5nZWRcbiAqL1xuUS5wcm9ncmVzcyA9IHByb2dyZXNzO1xuZnVuY3Rpb24gcHJvZ3Jlc3Mob2JqZWN0LCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aGVuKHZvaWQgMCwgdm9pZCAwLCBwcm9ncmVzc2VkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiAocHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCB2b2lkIDAsIHByb2dyZXNzZWQpO1xufTtcblxuLyoqXG4gKiBQcm92aWRlcyBhbiBvcHBvcnR1bml0eSB0byBvYnNlcnZlIHRoZSBzZXR0bGluZyBvZiBhIHByb21pc2UsXG4gKiByZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhlIHByb21pc2UgaXMgZnVsZmlsbGVkIG9yIHJlamVjdGVkLiAgRm9yd2FyZHNcbiAqIHRoZSByZXNvbHV0aW9uIHRvIHRoZSByZXR1cm5lZCBwcm9taXNlIHdoZW4gdGhlIGNhbGxiYWNrIGlzIGRvbmUuXG4gKiBUaGUgY2FsbGJhY2sgY2FuIHJldHVybiBhIHByb21pc2UgdG8gZGVmZXIgY29tcGxldGlvbi5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gb2JzZXJ2ZSB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW5cbiAqIHByb21pc2UsIHRha2VzIG5vIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2Ugd2hlblxuICogYGBmaW5gYCBpcyBkb25lLlxuICovXG5RLmZpbiA9IC8vIFhYWCBsZWdhY3lcblFbXCJmaW5hbGx5XCJdID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShvYmplY3QpW1wiZmluYWxseVwiXShjYWxsYmFjayk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5maW4gPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImZpbmFsbHlcIl0gPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayA9IFEoY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIFRPRE8gYXR0ZW1wdCB0byByZWN5Y2xlIHRoZSByZWplY3Rpb24gd2l0aCBcInRoaXNcIi5cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyByZWFzb247XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBUZXJtaW5hdGVzIGEgY2hhaW4gb2YgcHJvbWlzZXMsIGZvcmNpbmcgcmVqZWN0aW9ucyB0byBiZVxuICogdGhyb3duIGFzIGV4Y2VwdGlvbnMuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgYXQgdGhlIGVuZCBvZiBhIGNoYWluIG9mIHByb21pc2VzXG4gKiBAcmV0dXJucyBub3RoaW5nXG4gKi9cblEuZG9uZSA9IGZ1bmN0aW9uIChvYmplY3QsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kb25lKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIHtcbiAgICB2YXIgb25VbmhhbmRsZWRFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAvLyBmb3J3YXJkIHRvIGEgZnV0dXJlIHR1cm4gc28gdGhhdCBgYHdoZW5gYFxuICAgICAgICAvLyBkb2VzIG5vdCBjYXRjaCBpdCBhbmQgdHVybiBpdCBpbnRvIGEgcmVqZWN0aW9uLlxuICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhlcnJvciwgcHJvbWlzZSk7XG4gICAgICAgICAgICBpZiAoUS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgUS5vbmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBBdm9pZCB1bm5lY2Vzc2FyeSBgbmV4dFRpY2tgaW5nIHZpYSBhbiB1bm5lY2Vzc2FyeSBgd2hlbmAuXG4gICAgdmFyIHByb21pc2UgPSBmdWxmaWxsZWQgfHwgcmVqZWN0ZWQgfHwgcHJvZ3Jlc3MgP1xuICAgICAgICB0aGlzLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIDpcbiAgICAgICAgdGhpcztcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiBwcm9jZXNzICYmIHByb2Nlc3MuZG9tYWluKSB7XG4gICAgICAgIG9uVW5oYW5kbGVkRXJyb3IgPSBwcm9jZXNzLmRvbWFpbi5iaW5kKG9uVW5oYW5kbGVkRXJyb3IpO1xuICAgIH1cblxuICAgIHByb21pc2UudGhlbih2b2lkIDAsIG9uVW5oYW5kbGVkRXJyb3IpO1xufTtcblxuLyoqXG4gKiBDYXVzZXMgYSBwcm9taXNlIHRvIGJlIHJlamVjdGVkIGlmIGl0IGRvZXMgbm90IGdldCBmdWxmaWxsZWQgYmVmb3JlXG4gKiBzb21lIG1pbGxpc2Vjb25kcyB0aW1lIG91dC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbGxpc2Vjb25kcyB0aW1lb3V0XG4gKiBAcGFyYW0ge0FueSp9IGN1c3RvbSBlcnJvciBtZXNzYWdlIG9yIEVycm9yIG9iamVjdCAob3B0aW9uYWwpXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIGlmIGl0IGlzXG4gKiBmdWxmaWxsZWQgYmVmb3JlIHRoZSB0aW1lb3V0LCBvdGhlcndpc2UgcmVqZWN0ZWQuXG4gKi9cblEudGltZW91dCA9IGZ1bmN0aW9uIChvYmplY3QsIG1zLCBlcnJvcikge1xuICAgIHJldHVybiBRKG9iamVjdCkudGltZW91dChtcywgZXJyb3IpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGltZW91dCA9IGZ1bmN0aW9uIChtcywgZXJyb3IpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFlcnJvciB8fCBcInN0cmluZ1wiID09PSB0eXBlb2YgZXJyb3IpIHtcbiAgICAgICAgICAgIGVycm9yID0gbmV3IEVycm9yKGVycm9yIHx8IFwiVGltZWQgb3V0IGFmdGVyIFwiICsgbXMgKyBcIiBtc1wiKTtcbiAgICAgICAgICAgIGVycm9yLmNvZGUgPSBcIkVUSU1FRE9VVFwiO1xuICAgICAgICB9XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgfSwgbXMpO1xuXG4gICAgdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh2YWx1ZSk7XG4gICAgfSwgZnVuY3Rpb24gKGV4Y2VwdGlvbikge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfSwgZGVmZXJyZWQubm90aWZ5KTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIGdpdmVuIHZhbHVlIChvciBwcm9taXNlZCB2YWx1ZSksIHNvbWVcbiAqIG1pbGxpc2Vjb25kcyBhZnRlciBpdCByZXNvbHZlZC4gUGFzc2VzIHJlamVjdGlvbnMgaW1tZWRpYXRlbHkuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7TnVtYmVyfSBtaWxsaXNlY29uZHNcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UgYWZ0ZXIgbWlsbGlzZWNvbmRzXG4gKiB0aW1lIGhhcyBlbGFwc2VkIHNpbmNlIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlLlxuICogSWYgdGhlIGdpdmVuIHByb21pc2UgcmVqZWN0cywgdGhhdCBpcyBwYXNzZWQgaW1tZWRpYXRlbHkuXG4gKi9cblEuZGVsYXkgPSBmdW5jdGlvbiAob2JqZWN0LCB0aW1lb3V0KSB7XG4gICAgaWYgKHRpbWVvdXQgPT09IHZvaWQgMCkge1xuICAgICAgICB0aW1lb3V0ID0gb2JqZWN0O1xuICAgICAgICBvYmplY3QgPSB2b2lkIDA7XG4gICAgfVxuICAgIHJldHVybiBRKG9iamVjdCkuZGVsYXkodGltZW91dCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kZWxheSA9IGZ1bmN0aW9uICh0aW1lb3V0KSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBQYXNzZXMgYSBjb250aW51YXRpb24gdG8gYSBOb2RlIGZ1bmN0aW9uLCB3aGljaCBpcyBjYWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAqIGFyZ3VtZW50cyBwcm92aWRlZCBhcyBhbiBhcnJheSwgYW5kIHJldHVybnMgYSBwcm9taXNlLlxuICpcbiAqICAgICAgUS5uZmFwcGx5KEZTLnJlYWRGaWxlLCBbX19maWxlbmFtZV0pXG4gKiAgICAgIC50aGVuKGZ1bmN0aW9uIChjb250ZW50KSB7XG4gKiAgICAgIH0pXG4gKlxuICovXG5RLm5mYXBwbHkgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGFyZ3MpIHtcbiAgICByZXR1cm4gUShjYWxsYmFjaykubmZhcHBseShhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mYXBwbHkgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJncyk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFBhc3NlcyBhIGNvbnRpbnVhdGlvbiB0byBhIE5vZGUgZnVuY3Rpb24sIHdoaWNoIGlzIGNhbGxlZCB3aXRoIHRoZSBnaXZlblxuICogYXJndW1lbnRzIHByb3ZpZGVkIGluZGl2aWR1YWxseSwgYW5kIHJldHVybnMgYSBwcm9taXNlLlxuICogQGV4YW1wbGVcbiAqIFEubmZjYWxsKEZTLnJlYWRGaWxlLCBfX2ZpbGVuYW1lKVxuICogLnRoZW4oZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAqIH0pXG4gKlxuICovXG5RLm5mY2FsbCA9IGZ1bmN0aW9uIChjYWxsYmFjayAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gUShjYWxsYmFjaykubmZhcHBseShhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mY2FsbCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogV3JhcHMgYSBOb2RlSlMgY29udGludWF0aW9uIHBhc3NpbmcgZnVuY3Rpb24gYW5kIHJldHVybnMgYW4gZXF1aXZhbGVudFxuICogdmVyc2lvbiB0aGF0IHJldHVybnMgYSBwcm9taXNlLlxuICogQGV4YW1wbGVcbiAqIFEubmZiaW5kKEZTLnJlYWRGaWxlLCBfX2ZpbGVuYW1lKShcInV0Zi04XCIpXG4gKiAudGhlbihjb25zb2xlLmxvZylcbiAqIC5kb25lKClcbiAqL1xuUS5uZmJpbmQgPVxuUS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoY2FsbGJhY2sgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYmFzZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlQXJncyA9IGJhc2VBcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgICAgICBRKGNhbGxiYWNrKS5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mYmluZCA9XG5Qcm9taXNlLnByb3RvdHlwZS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgIHJldHVybiBRLmRlbm9kZWlmeS5hcHBseSh2b2lkIDAsIGFyZ3MpO1xufTtcblxuUS5uYmluZCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc3AgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYmFzZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlQXJncyA9IGJhc2VBcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgICAgICBmdW5jdGlvbiBib3VuZCgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseSh0aGlzcCwgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgICAgICBRKGJvdW5kKS5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5iaW5kID0gZnVuY3Rpb24gKC8qdGhpc3AsIC4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAwKTtcbiAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgcmV0dXJuIFEubmJpbmQuYXBwbHkodm9pZCAwLCBhcmdzKTtcbn07XG5cbi8qKlxuICogQ2FsbHMgYSBtZXRob2Qgb2YgYSBOb2RlLXN0eWxlIG9iamVjdCB0aGF0IGFjY2VwdHMgYSBOb2RlLXN0eWxlXG4gKiBjYWxsYmFjayB3aXRoIGEgZ2l2ZW4gYXJyYXkgb2YgYXJndW1lbnRzLCBwbHVzIGEgcHJvdmlkZWQgY2FsbGJhY2suXG4gKiBAcGFyYW0gb2JqZWN0IGFuIG9iamVjdCB0aGF0IGhhcyB0aGUgbmFtZWQgbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBtZXRob2Qgb2Ygb2JqZWN0XG4gKiBAcGFyYW0ge0FycmF5fSBhcmdzIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBtZXRob2Q7IHRoZSBjYWxsYmFja1xuICogd2lsbCBiZSBwcm92aWRlZCBieSBRIGFuZCBhcHBlbmRlZCB0byB0aGVzZSBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSB2YWx1ZSBvciBlcnJvclxuICovXG5RLm5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5ucG9zdCA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLm5wb3N0KG5hbWUsIGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5ucG9zdCA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJncyB8fCBbXSk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBDYWxscyBhIG1ldGhvZCBvZiBhIE5vZGUtc3R5bGUgb2JqZWN0IHRoYXQgYWNjZXB0cyBhIE5vZGUtc3R5bGVcbiAqIGNhbGxiYWNrLCBmb3J3YXJkaW5nIHRoZSBnaXZlbiB2YXJpYWRpYyBhcmd1bWVudHMsIHBsdXMgYSBwcm92aWRlZFxuICogY2FsbGJhY2sgYXJndW1lbnQuXG4gKiBAcGFyYW0gb2JqZWN0IGFuIG9iamVjdCB0aGF0IGhhcyB0aGUgbmFtZWQgbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBtZXRob2Qgb2Ygb2JqZWN0XG4gKiBAcGFyYW0gLi4uYXJncyBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgbWV0aG9kOyB0aGUgY2FsbGJhY2sgd2lsbFxuICogYmUgcHJvdmlkZWQgYnkgUSBhbmQgYXBwZW5kZWQgdG8gdGhlc2UgYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgdmFsdWUgb3IgZXJyb3JcbiAqL1xuUS5uc2VuZCA9IC8vIFhYWCBCYXNlZCBvbiBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIFwic2VuZFwiXG5RLm5tY2FsbCA9IC8vIFhYWCBCYXNlZCBvbiBcIlJlZHNhbmRybydzXCIgcHJvcG9zYWxcblEubmludm9rZSA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubnNlbmQgPSAvLyBYWFggQmFzZWQgb24gTWFyayBNaWxsZXIncyBwcm9wb3NlZCBcInNlbmRcIlxuUHJvbWlzZS5wcm90b3R5cGUubm1jYWxsID0gLy8gWFhYIEJhc2VkIG9uIFwiUmVkc2FuZHJvJ3NcIiBwcm9wb3NhbFxuUHJvbWlzZS5wcm90b3R5cGUubmludm9rZSA9IGZ1bmN0aW9uIChuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIElmIGEgZnVuY3Rpb24gd291bGQgbGlrZSB0byBzdXBwb3J0IGJvdGggTm9kZSBjb250aW51YXRpb24tcGFzc2luZy1zdHlsZSBhbmRcbiAqIHByb21pc2UtcmV0dXJuaW5nLXN0eWxlLCBpdCBjYW4gZW5kIGl0cyBpbnRlcm5hbCBwcm9taXNlIGNoYWluIHdpdGhcbiAqIGBub2RlaWZ5KG5vZGViYWNrKWAsIGZvcndhcmRpbmcgdGhlIG9wdGlvbmFsIG5vZGViYWNrIGFyZ3VtZW50LiAgSWYgdGhlIHVzZXJcbiAqIGVsZWN0cyB0byB1c2UgYSBub2RlYmFjaywgdGhlIHJlc3VsdCB3aWxsIGJlIHNlbnQgdGhlcmUuICBJZiB0aGV5IGRvIG5vdFxuICogcGFzcyBhIG5vZGViYWNrLCB0aGV5IHdpbGwgcmVjZWl2ZSB0aGUgcmVzdWx0IHByb21pc2UuXG4gKiBAcGFyYW0gb2JqZWN0IGEgcmVzdWx0IChvciBhIHByb21pc2UgZm9yIGEgcmVzdWx0KVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbm9kZWJhY2sgYSBOb2RlLmpzLXN0eWxlIGNhbGxiYWNrXG4gKiBAcmV0dXJucyBlaXRoZXIgdGhlIHByb21pc2Ugb3Igbm90aGluZ1xuICovXG5RLm5vZGVpZnkgPSBub2RlaWZ5O1xuZnVuY3Rpb24gbm9kZWlmeShvYmplY3QsIG5vZGViYWNrKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5ub2RlaWZ5KG5vZGViYWNrKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUubm9kZWlmeSA9IGZ1bmN0aW9uIChub2RlYmFjaykge1xuICAgIGlmIChub2RlYmFjaykge1xuICAgICAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhudWxsLCB2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufTtcblxuUS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiUS5ub0NvbmZsaWN0IG9ubHkgd29ya3Mgd2hlbiBRIGlzIHVzZWQgYXMgYSBnbG9iYWxcIik7XG59O1xuXG4vLyBBbGwgY29kZSBiZWZvcmUgdGhpcyBwb2ludCB3aWxsIGJlIGZpbHRlcmVkIGZyb20gc3RhY2sgdHJhY2VzLlxudmFyIHFFbmRpbmdMaW5lID0gY2FwdHVyZUxpbmUoKTtcblxucmV0dXJuIFE7XG5cbn0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTMtMjAxNCBLZXZpbiBDb3hcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qICBUaGlzIHNvZnR3YXJlIGlzIHByb3ZpZGVkICdhcy1pcycsIHdpdGhvdXQgYW55IGV4cHJlc3Mgb3IgaW1wbGllZCAgICAgICAgICAgKlxuKiAgd2FycmFudHkuIEluIG5vIGV2ZW50IHdpbGwgdGhlIGF1dGhvcnMgYmUgaGVsZCBsaWFibGUgZm9yIGFueSBkYW1hZ2VzICAgICAgICpcbiogIGFyaXNpbmcgZnJvbSB0aGUgdXNlIG9mIHRoaXMgc29mdHdhcmUuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgUGVybWlzc2lvbiBpcyBncmFudGVkIHRvIGFueW9uZSB0byB1c2UgdGhpcyBzb2Z0d2FyZSBmb3IgYW55IHB1cnBvc2UsICAgICAgICpcbiogIGluY2x1ZGluZyBjb21tZXJjaWFsIGFwcGxpY2F0aW9ucywgYW5kIHRvIGFsdGVyIGl0IGFuZCByZWRpc3RyaWJ1dGUgaXQgICAgICAqXG4qICBmcmVlbHksIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyByZXN0cmljdGlvbnM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiogIDEuIFRoZSBvcmlnaW4gb2YgdGhpcyBzb2Z0d2FyZSBtdXN0IG5vdCBiZSBtaXNyZXByZXNlbnRlZDsgeW91IG11c3Qgbm90ICAgICAqXG4qICAgICBjbGFpbSB0aGF0IHlvdSB3cm90ZSB0aGUgb3JpZ2luYWwgc29mdHdhcmUuIElmIHlvdSB1c2UgdGhpcyBzb2Z0d2FyZSBpbiAgKlxuKiAgICAgYSBwcm9kdWN0LCBhbiBhY2tub3dsZWRnbWVudCBpbiB0aGUgcHJvZHVjdCBkb2N1bWVudGF0aW9uIHdvdWxkIGJlICAgICAgICpcbiogICAgIGFwcHJlY2lhdGVkIGJ1dCBpcyBub3QgcmVxdWlyZWQuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgMi4gQWx0ZXJlZCBzb3VyY2UgdmVyc2lvbnMgbXVzdCBiZSBwbGFpbmx5IG1hcmtlZCBhcyBzdWNoLCBhbmQgbXVzdCBub3QgYmUgICpcbiogICAgIG1pc3JlcHJlc2VudGVkIGFzIGJlaW5nIHRoZSBvcmlnaW5hbCBzb2Z0d2FyZS4gICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgMy4gVGhpcyBub3RpY2UgbWF5IG5vdCBiZSByZW1vdmVkIG9yIGFsdGVyZWQgZnJvbSBhbnkgc291cmNlIGRpc3RyaWJ1dGlvbi4gICpcbiogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4rZnVuY3Rpb24oKXtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgYXJyYXkgPSAvXFxbKFteXFxbXSopXFxdJC87XG5cbi8vLyBVUkwgUmVnZXguXG4vKipcbiAqIFRoaXMgcmVnZXggc3BsaXRzIHRoZSBVUkwgaW50byBwYXJ0cy4gIFRoZSBjYXB0dXJlIGdyb3VwcyBjYXRjaCB0aGUgaW1wb3J0YW50XG4gKiBiaXRzLlxuICogXG4gKiBFYWNoIHNlY3Rpb24gaXMgb3B0aW9uYWwsIHNvIHRvIHdvcmsgb24gYW55IHBhcnQgZmluZCB0aGUgY29ycmVjdCB0b3AgbGV2ZWxcbiAqIGAoLi4uKT9gIGFuZCBtZXNzIGFyb3VuZCB3aXRoIGl0LlxuICovXG52YXIgcmVnZXggPSAvXig/OihbYS16XSopOik/KD86XFwvXFwvKT8oPzooW146QF0qKSg/OjooW15AXSopKT9AKT8oW2Etei0uX10rKT8oPzo6KFswLTldKikpPyhcXC9bXj8jXSopPyg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8kL2k7XG4vLyAgICAgICAgICAgICAgIDEgLSBzY2hlbWUgICAgICAgICAgICAgICAgMiAtIHVzZXIgICAgMyA9IHBhc3MgNCAtIGhvc3QgICAgICAgIDUgLSBwb3J0ICA2IC0gcGF0aCAgICAgICAgNyAtIHF1ZXJ5ICAgIDggLSBoYXNoXG5cbnZhciBub3NsYXNoID0gW1wibWFpbHRvXCIsXCJiaXRjb2luXCJdO1xuXG52YXIgc2VsZiA9IHtcblx0LyoqIFBhcnNlIGEgcXVlcnkgc3RyaW5nLlxuXHQgKlxuXHQgKiBUaGlzIGZ1bmN0aW9uIHBhcnNlcyBhIHF1ZXJ5IHN0cmluZyAoc29tZXRpbWVzIGNhbGxlZCB0aGUgc2VhcmNoXG5cdCAqIHN0cmluZykuICBJdCB0YWtlcyBhIHF1ZXJ5IHN0cmluZyBhbmQgcmV0dXJucyBhIG1hcCBvZiB0aGUgcmVzdWx0cy5cblx0ICpcblx0ICogS2V5cyBhcmUgY29uc2lkZXJlZCB0byBiZSBldmVyeXRoaW5nIHVwIHRvIHRoZSBmaXJzdCAnPScgYW5kIHZhbHVlcyBhcmVcblx0ICogZXZlcnl0aGluZyBhZnRlcndvcmRzLiAgU2luY2UgVVJMLWRlY29kaW5nIGlzIGRvbmUgYWZ0ZXIgcGFyc2luZywga2V5c1xuXHQgKiBhbmQgdmFsdWVzIGNhbiBoYXZlIGFueSB2YWx1ZXMsIGhvd2V2ZXIsICc9JyBoYXZlIHRvIGJlIGVuY29kZWQgaW4ga2V5c1xuXHQgKiB3aGlsZSAnPycgYW5kICcmJyBoYXZlIHRvIGJlIGVuY29kZWQgYW55d2hlcmUgKGFzIHRoZXkgZGVsaW1pdCB0aGVcblx0ICoga3YtcGFpcnMpLlxuXHQgKlxuXHQgKiBLZXlzIGFuZCB2YWx1ZXMgd2lsbCBhbHdheXMgYmUgc3RyaW5ncywgZXhjZXB0IGlmIHRoZXJlIGlzIGEga2V5IHdpdGggbm9cblx0ICogJz0nIGluIHdoaWNoIGNhc2UgaXQgd2lsbCBiZSBjb25zaWRlcmVkIGEgZmxhZyBhbmQgd2lsbCBiZSBzZXQgdG8gdHJ1ZS5cblx0ICogTGF0ZXIgdmFsdWVzIHdpbGwgb3ZlcnJpZGUgZWFybGllciB2YWx1ZXMuXG5cdCAqXG5cdCAqIEFycmF5IGtleXMgYXJlIGFsc28gc3VwcG9ydGVkLiAgQnkgZGVmYXVsdCBrZXlzIGluIHRoZSBmb3JtIG9mIGBuYW1lW2ldYFxuXHQgKiB3aWxsIGJlIHJldHVybmVkIGxpa2UgdGhhdCBhcyBzdHJpbmdzLiAgSG93ZXZlciwgaWYgeW91IHNldCB0aGUgYGFycmF5YFxuXHQgKiBmbGFnIGluIHRoZSBvcHRpb25zIG9iamVjdCB0aGV5IHdpbGwgYmUgcGFyc2VkIGludG8gYXJyYXlzLiAgTm90ZSB0aGF0XG5cdCAqIGFsdGhvdWdoIHRoZSBvYmplY3QgcmV0dXJuZWQgaXMgYW4gYEFycmF5YCBvYmplY3QgYWxsIGtleXMgd2lsbCBiZVxuXHQgKiB3cml0dGVuIHRvIGl0LiAgVGhpcyBtZWFucyB0aGF0IGlmIHlvdSBoYXZlIGEga2V5IHN1Y2ggYXMgYGtbZm9yRWFjaF1gXG5cdCAqIGl0IHdpbGwgb3ZlcndyaXRlIHRoZSBgZm9yRWFjaGAgZnVuY3Rpb24gb24gdGhhdCBhcnJheS4gIEFsc28gbm90ZSB0aGF0XG5cdCAqIHN0cmluZyBwcm9wZXJ0aWVzIGFsd2F5cyB0YWtlIHByZWNlZGVuY2Ugb3ZlciBhcnJheSBwcm9wZXJ0aWVzLFxuXHQgKiBpcnJlc3BlY3RpdmUgb2Ygd2hlcmUgdGhleSBhcmUgaW4gdGhlIHF1ZXJ5IHN0cmluZy5cblx0ICpcblx0ICogICB1cmwuZ2V0KFwiYXJyYXlbMV09dGVzdCZhcnJheVtmb29dPWJhclwiLHthcnJheTp0cnVlfSkuYXJyYXlbMV0gID09PSBcInRlc3RcIlxuXHQgKiAgIHVybC5nZXQoXCJhcnJheVsxXT10ZXN0JmFycmF5W2Zvb109YmFyXCIse2FycmF5OnRydWV9KS5hcnJheS5mb28gPT09IFwiYmFyXCJcblx0ICogICB1cmwuZ2V0KFwiYXJyYXk9bm90YW5hcnJheSZhcnJheVswXT0xXCIse2FycmF5OnRydWV9KS5hcnJheSAgICAgID09PSBcIm5vdGFuYXJyYXlcIlxuXHQgKlxuXHQgKiBJZiBhcnJheSBwYXJzaW5nIGlzIGVuYWJsZWQga2V5cyBpbiB0aGUgZm9ybSBvZiBgbmFtZVtdYCB3aWxsXG5cdCAqIGF1dG9tYXRpY2FsbHkgYmUgZ2l2ZW4gdGhlIG5leHQgYXZhaWxhYmxlIGluZGV4LiAgTm90ZSB0aGF0IHRoaXMgY2FuIGJlXG5cdCAqIG92ZXJ3cml0dGVuIHdpdGggbGF0ZXIgdmFsdWVzIGluIHRoZSBxdWVyeSBzdHJpbmcuICBGb3IgdGhpcyByZWFzb24gaXNcblx0ICogaXMgYmVzdCBub3QgdG8gbWl4IHRoZSB0d28gZm9ybWF0cywgYWx0aG91Z2ggaXQgaXMgc2FmZSAoYW5kIG9mdGVuXG5cdCAqIHVzZWZ1bCkgdG8gYWRkIGFuIGF1dG9tYXRpYyBpbmRleCBhcmd1bWVudCB0byB0aGUgZW5kIG9mIGEgcXVlcnkgc3RyaW5nLlxuXHQgKlxuXHQgKiAgIHVybC5nZXQoXCJhW109MCZhW109MSZhWzBdPTJcIiwge2FycmF5OnRydWV9KSAgLT4ge2E6W1wiMlwiLFwiMVwiXX07XG5cdCAqICAgdXJsLmdldChcImFbMF09MCZhWzFdPTEmYVtdPTJcIiwge2FycmF5OnRydWV9KSAtPiB7YTpbXCIwXCIsXCIxXCIsXCIyXCJdfTtcblx0ICpcblx0ICogQHBhcmFte3N0cmluZ30gcSBUaGUgcXVlcnkgc3RyaW5nICh0aGUgcGFydCBhZnRlciB0aGUgJz8nKS5cblx0ICogQHBhcmFte3tmdWxsOmJvb2xlYW4sYXJyYXk6Ym9vbGVhbn09fSBvcHQgT3B0aW9ucy5cblx0ICpcblx0ICogLSBmdWxsOiBJZiBzZXQgYHFgIHdpbGwgYmUgdHJlYXRlZCBhcyBhIGZ1bGwgdXJsIGFuZCBgcWAgd2lsbCBiZSBidWlsdC5cblx0ICogICBieSBjYWxsaW5nICNwYXJzZSB0byByZXRyaWV2ZSB0aGUgcXVlcnkgcG9ydGlvbi5cblx0ICogLSBhcnJheTogSWYgc2V0IGtleXMgaW4gdGhlIGZvcm0gb2YgYGtleVtpXWAgd2lsbCBiZSB0cmVhdGVkXG5cdCAqICAgYXMgYXJyYXlzL21hcHMuXG5cdCAqXG5cdCAqIEByZXR1cm57IU9iamVjdC48c3RyaW5nLCBzdHJpbmd8QXJyYXk+fSBUaGUgcGFyc2VkIHJlc3VsdC5cblx0ICovXG5cdFwiZ2V0XCI6IGZ1bmN0aW9uKHEsIG9wdCl7XG5cdFx0cSA9IHEgfHwgXCJcIjtcblx0XHRpZiAoIHR5cGVvZiBvcHQgICAgICAgICAgPT0gXCJ1bmRlZmluZWRcIiApIG9wdCA9IHt9O1xuXHRcdGlmICggdHlwZW9mIG9wdFtcImZ1bGxcIl0gID09IFwidW5kZWZpbmVkXCIgKSBvcHRbXCJmdWxsXCJdID0gZmFsc2U7XG5cdFx0aWYgKCB0eXBlb2Ygb3B0W1wiYXJyYXlcIl0gPT0gXCJ1bmRlZmluZWRcIiApIG9wdFtcImFycmF5XCJdID0gZmFsc2U7XG5cdFx0XG5cdFx0aWYgKCBvcHRbXCJmdWxsXCJdID09PSB0cnVlIClcblx0XHR7XG5cdFx0XHRxID0gc2VsZltcInBhcnNlXCJdKHEsIHtcImdldFwiOmZhbHNlfSlbXCJxdWVyeVwiXSB8fCBcIlwiO1xuXHRcdH1cblx0XHRcblx0XHR2YXIgbyA9IHt9O1xuXHRcdFxuXHRcdHZhciBjID0gcS5zcGxpdChcIiZcIik7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjLmxlbmd0aDsgaSsrKVxuXHRcdHtcblx0XHRcdGlmICghY1tpXS5sZW5ndGgpIGNvbnRpbnVlO1xuXHRcdFx0XG5cdFx0XHR2YXIgZCA9IGNbaV0uaW5kZXhPZihcIj1cIik7XG5cdFx0XHR2YXIgayA9IGNbaV0sIHYgPSB0cnVlO1xuXHRcdFx0aWYgKCBkID49IDAgKVxuXHRcdFx0e1xuXHRcdFx0XHRrID0gY1tpXS5zdWJzdHIoMCwgZCk7XG5cdFx0XHRcdHYgPSBjW2ldLnN1YnN0cihkKzEpO1xuXHRcdFx0XHRcblx0XHRcdFx0diA9IGRlY29kZVVSSUNvbXBvbmVudCh2KTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aWYgKG9wdFtcImFycmF5XCJdKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgaW5kcyA9IFtdO1xuXHRcdFx0XHR2YXIgaW5kO1xuXHRcdFx0XHR2YXIgY3VybyA9IG87XG5cdFx0XHRcdHZhciBjdXJrID0gaztcblx0XHRcdFx0d2hpbGUgKGluZCA9IGN1cmsubWF0Y2goYXJyYXkpKSAvLyBBcnJheSFcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGN1cmsgPSBjdXJrLnN1YnN0cigwLCBpbmQuaW5kZXgpO1xuXHRcdFx0XHRcdGluZHMudW5zaGlmdChkZWNvZGVVUklDb21wb25lbnQoaW5kWzFdKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y3VyayA9IGRlY29kZVVSSUNvbXBvbmVudChjdXJrKTtcblx0XHRcdFx0aWYgKGluZHMuc29tZShmdW5jdGlvbihpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKCB0eXBlb2YgY3Vyb1tjdXJrXSA9PSBcInVuZGVmaW5lZFwiICkgY3Vyb1tjdXJrXSA9IFtdO1xuXHRcdFx0XHRcdGlmICghQXJyYXkuaXNBcnJheShjdXJvW2N1cmtdKSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKFwidXJsLmdldDogQXJyYXkgcHJvcGVydHkgXCIrY3VyaytcIiBhbHJlYWR5IGV4aXN0cyBhcyBzdHJpbmchXCIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGN1cm8gPSBjdXJvW2N1cmtdO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmICggaSA9PT0gXCJcIiApIGkgPSBjdXJvLmxlbmd0aDtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRjdXJrID0gaTtcblx0XHRcdFx0fSkpIGNvbnRpbnVlO1xuXHRcdFx0XHRjdXJvW2N1cmtdID0gdjtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGsgPSBkZWNvZGVVUklDb21wb25lbnQoayk7XG5cdFx0XHRcblx0XHRcdC8vdHlwZW9mIG9ba10gPT0gXCJ1bmRlZmluZWRcIiB8fCBjb25zb2xlLmxvZyhcIlByb3BlcnR5IFwiK2srXCIgYWxyZWFkeSBleGlzdHMhXCIpO1xuXHRcdFx0b1trXSA9IHY7XG5cdFx0fVxuXHRcdFxuXHRcdHJldHVybiBvO1xuXHR9LFxuXHRcblx0LyoqIEJ1aWxkIGEgZ2V0IHF1ZXJ5IGZyb20gYW4gb2JqZWN0LlxuXHQgKlxuXHQgKiBUaGlzIGNvbnN0cnVjdHMgYSBxdWVyeSBzdHJpbmcgZnJvbSB0aGUga3YgcGFpcnMgaW4gYGRhdGFgLiAgQ2FsbGluZ1xuXHQgKiAjZ2V0IG9uIHRoZSBzdHJpbmcgcmV0dXJuZWQgc2hvdWxkIHJldHVybiBhbiBvYmplY3QgaWRlbnRpY2FsIHRvIHRoZSBvbmVcblx0ICogcGFzc2VkIGluIGV4Y2VwdCBhbGwgbm9uLWJvb2xlYW4gc2NhbGFyIHR5cGVzIGJlY29tZSBzdHJpbmdzIGFuZCBhbGxcblx0ICogb2JqZWN0IHR5cGVzIGJlY29tZSBhcnJheXMgKG5vbi1pbnRlZ2VyIGtleXMgYXJlIHN0aWxsIHByZXNlbnQsIHNlZVxuXHQgKiAjZ2V0J3MgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBkZXRhaWxzKS5cblx0ICpcblx0ICogVGhpcyBhbHdheXMgdXNlcyBhcnJheSBzeW50YXggZm9yIGRlc2NyaWJpbmcgYXJyYXlzLiAgSWYgeW91IHdhbnQgdG9cblx0ICogc2VyaWFsaXplIHRoZW0gZGlmZmVyZW50bHkgKGxpa2UgaGF2aW5nIHRoZSB2YWx1ZSBiZSBhIEpTT04gYXJyYXkgYW5kXG5cdCAqIGhhdmUgYSBwbGFpbiBrZXkpIHlvdSB3aWxsIG5lZWQgdG8gZG8gdGhhdCBiZWZvcmUgcGFzc2luZyBpdCBpbi5cblx0ICpcblx0ICogQWxsIGtleXMgYW5kIHZhbHVlcyBhcmUgc3VwcG9ydGVkIChiaW5hcnkgZGF0YSBhbnlvbmU/KSBhcyB0aGV5IGFyZVxuXHQgKiBwcm9wZXJseSBVUkwtZW5jb2RlZCBhbmQgI2dldCBwcm9wZXJseSBkZWNvZGVzLlxuXHQgKlxuXHQgKiBAcGFyYW17T2JqZWN0fSBkYXRhIFRoZSBrdiBwYWlycy5cblx0ICogQHBhcmFte3N0cmluZ30gcHJlZml4IFRoZSBwcm9wZXJseSBlbmNvZGVkIGFycmF5IGtleSB0byBwdXQgdGhlXG5cdCAqICAgcHJvcGVydGllcy4gIE1haW5seSBpbnRlbmRlZCBmb3IgaW50ZXJuYWwgdXNlLlxuXHQgKiBAcmV0dXJue3N0cmluZ30gQSBVUkwtc2FmZSBzdHJpbmcuXG5cdCAqL1xuXHRcImJ1aWxkZ2V0XCI6IGZ1bmN0aW9uKGRhdGEsIHByZWZpeCl7XG5cdFx0dmFyIGl0bXMgPSBbXTtcblx0XHRmb3IgKCB2YXIgayBpbiBkYXRhIClcblx0XHR7XG5cdFx0XHR2YXIgZWsgPSBlbmNvZGVVUklDb21wb25lbnQoayk7XG5cdFx0XHRpZiAoIHR5cGVvZiBwcmVmaXggIT0gXCJ1bmRlZmluZWRcIiApXG5cdFx0XHRcdGVrID0gcHJlZml4K1wiW1wiK2VrK1wiXVwiO1xuXHRcdFx0XG5cdFx0XHR2YXIgdiA9IGRhdGFba107XG5cdFx0XHRcblx0XHRcdHN3aXRjaCAodHlwZW9mIHYpXG5cdFx0XHR7XG5cdFx0XHRcdGNhc2UgJ2Jvb2xlYW4nOlxuXHRcdFx0XHRcdGlmKHYpIGl0bXMucHVzaChlayk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ251bWJlcic6XG5cdFx0XHRcdFx0diA9IHYudG9TdHJpbmcoKTtcblx0XHRcdFx0Y2FzZSAnc3RyaW5nJzpcblx0XHRcdFx0XHRpdG1zLnB1c2goZWsrXCI9XCIrZW5jb2RlVVJJQ29tcG9uZW50KHYpKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnb2JqZWN0Jzpcblx0XHRcdFx0XHRpdG1zLnB1c2goc2VsZltcImJ1aWxkZ2V0XCJdKHYsIGVrKSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBpdG1zLmpvaW4oXCImXCIpO1xuXHR9LFxuXHRcblx0LyoqIFBhcnNlIGEgVVJMXG5cdCAqIFxuXHQgKiBUaGlzIGJyZWFrcyB1cCBhIFVSTCBpbnRvIGNvbXBvbmVudHMuICBJdCBhdHRlbXB0cyB0byBiZSB2ZXJ5IGxpYmVyYWxcblx0ICogYW5kIHJldHVybnMgdGhlIGJlc3QgcmVzdWx0IGluIG1vc3QgY2FzZXMuICBUaGlzIG1lYW5zIHRoYXQgeW91IGNhblxuXHQgKiBvZnRlbiBwYXNzIGluIHBhcnQgb2YgYSBVUkwgYW5kIGdldCBjb3JyZWN0IGNhdGVnb3JpZXMgYmFjay4gIE5vdGFibHksXG5cdCAqIHRoaXMgd29ya3MgZm9yIGVtYWlscyBhbmQgSmFiYmVyIElEcywgYXMgd2VsbCBhcyBhZGRpbmcgYSAnPycgdG8gdGhlXG5cdCAqIGJlZ2lubmluZyBvZiBhIHN0cmluZyB3aWxsIHBhcnNlIHRoZSB3aG9sZSB0aGluZyBhcyBhIHF1ZXJ5IHN0cmluZy4gIElmXG5cdCAqIGFuIGl0ZW0gaXMgbm90IGZvdW5kIHRoZSBwcm9wZXJ0eSB3aWxsIGJlIHVuZGVmaW5lZC4gIEluIHNvbWUgY2FzZXMgYW5cblx0ICogZW1wdHkgc3RyaW5nIHdpbGwgYmUgcmV0dXJuZWQgaWYgdGhlIHN1cnJvdW5kaW5nIHN5bnRheCBidXQgdGhlIGFjdHVhbFxuXHQgKiB2YWx1ZSBpcyBlbXB0eSAoZXhhbXBsZTogXCI6Ly9leGFtcGxlLmNvbVwiIHdpbGwgZ2l2ZSBhIGVtcHR5IHN0cmluZyBmb3Jcblx0ICogc2NoZW1lLikgIE5vdGFibHkgdGhlIGhvc3QgbmFtZSB3aWxsIGFsd2F5cyBiZSBzZXQgdG8gc29tZXRoaW5nLlxuXHQgKiBcblx0ICogUmV0dXJuZWQgcHJvcGVydGllcy5cblx0ICogXG5cdCAqIC0gKipzY2hlbWU6KiogVGhlIHVybCBzY2hlbWUuIChleDogXCJtYWlsdG9cIiBvciBcImh0dHBzXCIpXG5cdCAqIC0gKip1c2VyOioqIFRoZSB1c2VybmFtZS5cblx0ICogLSAqKnBhc3M6KiogVGhlIHBhc3N3b3JkLlxuXHQgKiAtICoqaG9zdDoqKiBUaGUgaG9zdG5hbWUuIChleDogXCJsb2NhbGhvc3RcIiwgXCIxMjMuNDU2LjcuOFwiIG9yIFwiZXhhbXBsZS5jb21cIilcblx0ICogLSAqKnBvcnQ6KiogVGhlIHBvcnQsIGFzIGEgbnVtYmVyLiAoZXg6IDEzMzcpXG5cdCAqIC0gKipwYXRoOioqIFRoZSBwYXRoLiAoZXg6IFwiL1wiIG9yIFwiL2Fib3V0Lmh0bWxcIilcblx0ICogLSAqKnF1ZXJ5OioqIFwiVGhlIHF1ZXJ5IHN0cmluZy4gKGV4OiBcImZvbz1iYXImdj0xNyZmb3JtYXQ9anNvblwiKVxuXHQgKiAtICoqZ2V0OioqIFRoZSBxdWVyeSBzdHJpbmcgcGFyc2VkIHdpdGggZ2V0LiAgSWYgYG9wdC5nZXRgIGlzIGBmYWxzZWAgdGhpc1xuXHQgKiAgIHdpbGwgYmUgYWJzZW50XG5cdCAqIC0gKipoYXNoOioqIFRoZSB2YWx1ZSBhZnRlciB0aGUgaGFzaC4gKGV4OiBcIm15YW5jaG9yXCIpXG5cdCAqICAgYmUgdW5kZWZpbmVkIGV2ZW4gaWYgYHF1ZXJ5YCBpcyBzZXQuXG5cdCAqXG5cdCAqIEBwYXJhbXtzdHJpbmd9IHVybCBUaGUgVVJMIHRvIHBhcnNlLlxuXHQgKiBAcGFyYW17e2dldDpPYmplY3R9PX0gb3B0IE9wdGlvbnM6XG5cdCAqXG5cdCAqIC0gZ2V0OiBBbiBvcHRpb25zIGFyZ3VtZW50IHRvIGJlIHBhc3NlZCB0byAjZ2V0IG9yIGZhbHNlIHRvIG5vdCBjYWxsICNnZXQuXG5cdCAqICAgICoqRE8gTk9UKiogc2V0IGBmdWxsYC5cblx0ICpcblx0ICogQHJldHVybnshT2JqZWN0fSBBbiBvYmplY3Qgd2l0aCB0aGUgcGFyc2VkIHZhbHVlcy5cblx0ICovXG5cdFwicGFyc2VcIjogZnVuY3Rpb24odXJsLCBvcHQpIHtcblx0XHRcblx0XHRpZiAoIHR5cGVvZiBvcHQgPT0gXCJ1bmRlZmluZWRcIiApIG9wdCA9IHt9O1xuXHRcdFxuXHRcdHZhciBtZCA9IHVybC5tYXRjaChyZWdleCkgfHwgW107XG5cdFx0XG5cdFx0dmFyIHIgPSB7XG5cdFx0XHRcInVybFwiOiAgICB1cmwsXG5cdFx0XHRcblx0XHRcdFwic2NoZW1lXCI6IG1kWzFdLFxuXHRcdFx0XCJ1c2VyXCI6ICAgbWRbMl0sXG5cdFx0XHRcInBhc3NcIjogICBtZFszXSxcblx0XHRcdFwiaG9zdFwiOiAgIG1kWzRdLFxuXHRcdFx0XCJwb3J0XCI6ICAgbWRbNV0gJiYgK21kWzVdLFxuXHRcdFx0XCJwYXRoXCI6ICAgbWRbNl0sXG5cdFx0XHRcInF1ZXJ5XCI6ICBtZFs3XSxcblx0XHRcdFwiaGFzaFwiOiAgIG1kWzhdLFxuXHRcdH07XG5cdFx0XG5cdFx0aWYgKCBvcHQuZ2V0ICE9PSBmYWxzZSApXG5cdFx0XHRyW1wiZ2V0XCJdID0gcltcInF1ZXJ5XCJdICYmIHNlbGZbXCJnZXRcIl0ocltcInF1ZXJ5XCJdLCBvcHQuZ2V0KTtcblx0XHRcblx0XHRyZXR1cm4gcjtcblx0fSxcblx0XG5cdC8qKiBCdWlsZCBhIFVSTCBmcm9tIGNvbXBvbmVudHMuXG5cdCAqIFxuXHQgKiBUaGlzIHBpZWNlcyB0b2dldGhlciBhIHVybCBmcm9tIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBwYXNzZWQgaW4gb2JqZWN0LlxuXHQgKiBJbiBnZW5lcmFsIHBhc3NpbmcgdGhlIHJlc3VsdCBvZiBgcGFyc2UoKWAgc2hvdWxkIHJldHVybiB0aGUgVVJMLiAgVGhlcmVcblx0ICogbWF5IGRpZmZlcmVuY2VzIGluIHRoZSBnZXQgc3RyaW5nIGFzIHRoZSBrZXlzIGFuZCB2YWx1ZXMgbWlnaHQgYmUgbW9yZVxuXHQgKiBlbmNvZGVkIHRoZW4gdGhleSB3ZXJlIG9yaWdpbmFsbHkgd2VyZS4gIEhvd2V2ZXIsIGNhbGxpbmcgYGdldCgpYCBvbiB0aGVcblx0ICogdHdvIHZhbHVlcyBzaG91bGQgeWllbGQgdGhlIHNhbWUgcmVzdWx0LlxuXHQgKiBcblx0ICogSGVyZSBpcyBob3cgdGhlIHBhcmFtZXRlcnMgYXJlIHVzZWQuXG5cdCAqIFxuXHQgKiAgLSB1cmw6IFVzZWQgb25seSBpZiBubyBvdGhlciB2YWx1ZXMgYXJlIHByb3ZpZGVkLiAgSWYgdGhhdCBpcyB0aGUgY2FzZVxuXHQgKiAgICAgYHVybGAgd2lsbCBiZSByZXR1cm5lZCB2ZXJiYXRpbS5cblx0ICogIC0gc2NoZW1lOiBVc2VkIGlmIGRlZmluZWQuXG5cdCAqICAtIHVzZXI6IFVzZWQgaWYgZGVmaW5lZC5cblx0ICogIC0gcGFzczogVXNlZCBpZiBkZWZpbmVkLlxuXHQgKiAgLSBob3N0OiBVc2VkIGlmIGRlZmluZWQuXG5cdCAqICAtIHBhdGg6IFVzZWQgaWYgZGVmaW5lZC5cblx0ICogIC0gcXVlcnk6IFVzZWQgb25seSBpZiBgZ2V0YCBpcyBub3QgcHJvdmlkZWQgYW5kIG5vbi1lbXB0eS5cblx0ICogIC0gZ2V0OiBVc2VkIGlmIG5vbi1lbXB0eS4gIFBhc3NlZCB0byAjYnVpbGRnZXQgYW5kIHRoZSByZXN1bHQgaXMgdXNlZFxuXHQgKiAgICBhcyB0aGUgcXVlcnkgc3RyaW5nLlxuXHQgKiAgLSBoYXNoOiBVc2VkIGlmIGRlZmluZWQuXG5cdCAqIFxuXHQgKiBUaGVzZSBhcmUgdGhlIG9wdGlvbnMgdGhhdCBhcmUgdmFsaWQgb24gdGhlIG9wdGlvbnMgb2JqZWN0LlxuXHQgKiBcblx0ICogIC0gdXNlZW1wdHlnZXQ6IElmIHRydXRoeSwgYSBxdWVzdGlvbiBtYXJrIHdpbGwgYmUgYXBwZW5kZWQgZm9yIGVtcHR5IGdldFxuXHQgKiAgICBzdHJpbmdzLiAgVGhpcyBub3RhYmx5IG1ha2VzIGBidWlsZCgpYCBhbmQgYHBhcnNlKClgIGZ1bGx5IHN5bW1ldHJpYy5cblx0ICpcblx0ICogQHBhcmFte09iamVjdH0gZGF0YSBUaGUgcGllY2VzIG9mIHRoZSBVUkwuXG5cdCAqIEBwYXJhbXtPYmplY3R9IG9wdCBPcHRpb25zIGZvciBidWlsZGluZyB0aGUgdXJsLlxuXHQgKiBAcmV0dXJue3N0cmluZ30gVGhlIFVSTC5cblx0ICovXG5cdFwiYnVpbGRcIjogZnVuY3Rpb24oZGF0YSwgb3B0KXtcblx0XHRvcHQgPSBvcHQgfHwge307XG5cdFx0XG5cdFx0dmFyIHIgPSBcIlwiO1xuXHRcdFxuXHRcdGlmICggdHlwZW9mIGRhdGFbXCJzY2hlbWVcIl0gIT0gXCJ1bmRlZmluZWRcIiApXG5cdFx0e1xuXHRcdFx0ciArPSBkYXRhW1wic2NoZW1lXCJdO1xuXHRcdFx0ciArPSAobm9zbGFzaC5pbmRleE9mKGRhdGFbXCJzY2hlbWVcIl0pPj0wKT9cIjpcIjpcIjovL1wiO1xuXHRcdH1cblx0XHRpZiAoIHR5cGVvZiBkYXRhW1widXNlclwiXSAhPSBcInVuZGVmaW5lZFwiIClcblx0XHR7XG5cdFx0XHRyICs9IGRhdGFbXCJ1c2VyXCJdO1xuXHRcdFx0aWYgKCB0eXBlb2YgZGF0YVtcInBhc3NcIl0gPT0gXCJ1bmRlZmluZWRcIiApXG5cdFx0XHR7XG5cdFx0XHRcdHIgKz0gXCJAXCI7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICggdHlwZW9mIGRhdGFbXCJwYXNzXCJdICE9IFwidW5kZWZpbmVkXCIgKSByICs9IFwiOlwiICsgZGF0YVtcInBhc3NcIl0gKyBcIkBcIjtcblx0XHRpZiAoIHR5cGVvZiBkYXRhW1wiaG9zdFwiXSAhPSBcInVuZGVmaW5lZFwiICkgciArPSBkYXRhW1wiaG9zdFwiXTtcblx0XHRpZiAoIHR5cGVvZiBkYXRhW1wicG9ydFwiXSAhPSBcInVuZGVmaW5lZFwiICkgciArPSBcIjpcIiArIGRhdGFbXCJwb3J0XCJdO1xuXHRcdGlmICggdHlwZW9mIGRhdGFbXCJwYXRoXCJdICE9IFwidW5kZWZpbmVkXCIgKSByICs9IGRhdGFbXCJwYXRoXCJdO1xuXHRcdFxuXHRcdGlmIChvcHRbXCJ1c2VlbXB0eWdldFwiXSlcblx0XHR7XG5cdFx0XHRpZiAgICAgICggdHlwZW9mIGRhdGFbXCJnZXRcIl0gICAhPSBcInVuZGVmaW5lZFwiICkgciArPSBcIj9cIiArIHNlbGZbXCJidWlsZGdldFwiXShkYXRhW1wiZ2V0XCJdKTtcblx0XHRcdGVsc2UgaWYgKCB0eXBlb2YgZGF0YVtcInF1ZXJ5XCJdICE9IFwidW5kZWZpbmVkXCIgKSByICs9IFwiP1wiICsgZGF0YVtcInF1ZXJ5XCJdO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0Ly8gSWYgLmdldCB1c2UgaXQuICBJZiAuZ2V0IGxlYWRzIHRvIGVtcHR5LCB1c2UgLnF1ZXJ5LlxuXHRcdFx0dmFyIHEgPSBkYXRhW1wiZ2V0XCJdICYmIHNlbGZbXCJidWlsZGdldFwiXShkYXRhW1wiZ2V0XCJdKSB8fCBkYXRhW1wicXVlcnlcIl07XG5cdFx0XHRpZiAocSkgciArPSBcIj9cIiArIHE7XG5cdFx0fVxuXHRcdFxuXHRcdGlmICggdHlwZW9mIGRhdGFbXCJoYXNoXCJdICE9IFwidW5kZWZpbmVkXCIgKSByICs9IFwiI1wiICsgZGF0YVtcImhhc2hcIl07XG5cdFx0XG5cdFx0cmV0dXJuIHIgfHwgZGF0YVtcInVybFwiXSB8fCBcIlwiO1xuXHR9LFxufTtcblxuaWYgKCB0eXBlb2YgZGVmaW5lICE9IFwidW5kZWZpbmVkXCIgJiYgZGVmaW5lW1wiYW1kXCJdICkgZGVmaW5lKHNlbGYpO1xuZWxzZSBpZiAoIHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiApIG1vZHVsZVsnZXhwb3J0cyddID0gc2VsZjtcbmVsc2Ugd2luZG93W1widXJsXCJdID0gc2VsZjtcblxufSgpO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8qIGdsb2JhbCAkIGpRdWVyeSBDUE8gQ29kZU1pcnJvciBzdG9yYWdlQVBJIFEgY3JlYXRlUHJvZ3JhbUNvbGxlY3Rpb25BUEkgbWFrZVNoYXJlQVBJICovXG5cbnZhciBvcmlnaW5hbFBhZ2VMb2FkID0gRGF0ZS5ub3coKTtcbmNvbnNvbGUubG9nKFwib3JpZ2luYWxQYWdlTG9hZDogXCIsIG9yaWdpbmFsUGFnZUxvYWQpO1xuXG52YXIgc2hhcmVBUEkgPSBtYWtlU2hhcmVBUEkocHJvY2Vzcy5lbnYuQ1VSUkVOVF9QWVJFVF9SRUxFQVNFKTtcblxudmFyIHVybCA9IHdpbmRvdy51cmwgPSByZXF1aXJlKCd1cmwuanMnKTtcbnZhciBtb2RhbFByb21wdCA9IHJlcXVpcmUoJy4vbW9kYWwtcHJvbXB0LmpzJyk7XG53aW5kb3cubW9kYWxQcm9tcHQgPSBtb2RhbFByb21wdDtcblxuY29uc3QgTE9HID0gdHJ1ZTtcbndpbmRvdy5jdF9sb2cgPSBmdW5jdGlvbigvKiB2YXJhcmdzICovKSB7XG4gIGlmICh3aW5kb3cuY29uc29sZSAmJiBMT0cpIHtcbiAgICBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpO1xuICB9XG59O1xuXG53aW5kb3cuY3RfZXJyb3IgPSBmdW5jdGlvbigvKiB2YXJhcmdzICovKSB7XG4gIGlmICh3aW5kb3cuY29uc29sZSAmJiBMT0cpIHtcbiAgICBjb25zb2xlLmVycm9yLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyk7XG4gIH1cbn07XG52YXIgaW5pdGlhbFBhcmFtcyA9IHVybC5wYXJzZShkb2N1bWVudC5sb2NhdGlvbi5ocmVmKTtcbnZhciBwYXJhbXMgPSB1cmwucGFyc2UoXCIvP1wiICsgaW5pdGlhbFBhcmFtc1tcImhhc2hcIl0pO1xud2luZG93LmhpZ2hsaWdodE1vZGUgPSBcIm1jbWhcIjsgLy8gd2hhdCBpcyB0aGlzIGZvcj9cbndpbmRvdy5jbGVhckZsYXNoID0gZnVuY3Rpb24oKSB7XG4gICQoXCIubm90aWZpY2F0aW9uQXJlYVwiKS5lbXB0eSgpO1xufVxud2luZG93LndoaXRlVG9CbGFja05vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAvKlxuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWEgLmFjdGl2ZVwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIFwid2hpdGVcIik7XG4gICQoXCIubm90aWZpY2F0aW9uQXJlYSAuYWN0aXZlXCIpLmFuaW1hdGUoe2JhY2tncm91bmRDb2xvcjogXCIjMTExMTExXCIgfSwgMTAwMCk7XG4gICovXG59O1xud2luZG93LnN0aWNrRXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlLCBtb3JlKSB7XG4gIENQTy5zYXlBbmRGb3JnZXQobWVzc2FnZSk7XG4gIGNsZWFyRmxhc2goKTtcbiAgdmFyIGVyciA9ICQoXCI8c3Bhbj5cIikuYWRkQ2xhc3MoXCJlcnJvclwiKS50ZXh0KG1lc3NhZ2UpO1xuICBpZihtb3JlKSB7XG4gICAgZXJyLmF0dHIoXCJ0aXRsZVwiLCBtb3JlKTtcbiAgfVxuICBlcnIudG9vbHRpcCgpO1xuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWFcIikucHJlcGVuZChlcnIpO1xuICB3aGl0ZVRvQmxhY2tOb3RpZmljYXRpb24oKTtcbn07XG53aW5kb3cuZmxhc2hFcnJvciA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgQ1BPLnNheUFuZEZvcmdldChtZXNzYWdlKTtcbiAgY2xlYXJGbGFzaCgpO1xuICB2YXIgZXJyID0gJChcIjxzcGFuPlwiKS5hZGRDbGFzcyhcImVycm9yXCIpLnRleHQobWVzc2FnZSk7XG4gICQoXCIubm90aWZpY2F0aW9uQXJlYVwiKS5wcmVwZW5kKGVycik7XG4gIHdoaXRlVG9CbGFja05vdGlmaWNhdGlvbigpO1xuICBlcnIuZmFkZU91dCg3MDAwKTtcbn07XG53aW5kb3cuZmxhc2hNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICBDUE8uc2F5QW5kRm9yZ2V0KG1lc3NhZ2UpO1xuICBjbGVhckZsYXNoKCk7XG4gIHZhciBtc2cgPSAkKFwiPHNwYW4+XCIpLmFkZENsYXNzKFwiYWN0aXZlXCIpLnRleHQobWVzc2FnZSk7XG4gICQoXCIubm90aWZpY2F0aW9uQXJlYVwiKS5wcmVwZW5kKG1zZyk7XG4gIHdoaXRlVG9CbGFja05vdGlmaWNhdGlvbigpO1xuICBtc2cuZmFkZU91dCg3MDAwKTtcbn07XG53aW5kb3cuc3RpY2tNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICBDUE8uc2F5QW5kRm9yZ2V0KG1lc3NhZ2UpO1xuICBjbGVhckZsYXNoKCk7XG4gIHZhciBtc2cgPSAkKFwiPHNwYW4+XCIpLmFkZENsYXNzKFwiYWN0aXZlXCIpLnRleHQobWVzc2FnZSk7XG4gICQoXCIubm90aWZpY2F0aW9uQXJlYVwiKS5wcmVwZW5kKG1zZyk7XG4gIHdoaXRlVG9CbGFja05vdGlmaWNhdGlvbigpO1xufTtcbndpbmRvdy5zdGlja1JpY2hNZXNzYWdlID0gZnVuY3Rpb24oY29udGVudCkge1xuICBDUE8uc2F5QW5kRm9yZ2V0KGNvbnRlbnQudGV4dCgpKTtcbiAgY2xlYXJGbGFzaCgpO1xuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWFcIikucHJlcGVuZCgkKFwiPHNwYW4+XCIpLmFkZENsYXNzKFwiYWN0aXZlXCIpLmFwcGVuZChjb250ZW50KSk7XG4gIHdoaXRlVG9CbGFja05vdGlmaWNhdGlvbigpO1xufTtcbndpbmRvdy5ta1dhcm5pbmdVcHBlciA9IGZ1bmN0aW9uKCl7cmV0dXJuICQoXCI8ZGl2IGNsYXNzPSd3YXJuaW5nLXVwcGVyJz5cIik7fVxud2luZG93Lm1rV2FybmluZ0xvd2VyID0gZnVuY3Rpb24oKXtyZXR1cm4gJChcIjxkaXYgY2xhc3M9J3dhcm5pbmctbG93ZXInPlwiKTt9XG5cbnZhciBEb2N1bWVudHMgPSBmdW5jdGlvbigpIHtcblxuICBmdW5jdGlvbiBEb2N1bWVudHMoKSB7XG4gICAgdGhpcy5kb2N1bWVudHMgPSBuZXcgTWFwKCk7XG4gIH1cblxuICBEb2N1bWVudHMucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuZG9jdW1lbnRzLmhhcyhuYW1lKTtcbiAgfTtcblxuICBEb2N1bWVudHMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuZG9jdW1lbnRzLmdldChuYW1lKTtcbiAgfTtcblxuICBEb2N1bWVudHMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChuYW1lLCBkb2MpIHtcbiAgICBpZihsb2dnZXIuaXNEZXRhaWxlZClcbiAgICAgIGxvZ2dlci5sb2coXCJkb2Muc2V0XCIsIHtuYW1lOiBuYW1lLCB2YWx1ZTogZG9jLmdldFZhbHVlKCl9KTtcbiAgICByZXR1cm4gdGhpcy5kb2N1bWVudHMuc2V0KG5hbWUsIGRvYyk7XG4gIH07XG5cbiAgRG9jdW1lbnRzLnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIGlmKGxvZ2dlci5pc0RldGFpbGVkKVxuICAgICAgbG9nZ2VyLmxvZyhcImRvYy5kZWxcIiwge25hbWU6IG5hbWV9KTtcbiAgICByZXR1cm4gdGhpcy5kb2N1bWVudHMuZGVsZXRlKG5hbWUpO1xuICB9O1xuXG4gIERvY3VtZW50cy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgcmV0dXJuIHRoaXMuZG9jdW1lbnRzLmZvckVhY2goZik7XG4gIH07XG5cbiAgcmV0dXJuIERvY3VtZW50cztcbn0oKTtcblxudmFyIFZFUlNJT05fQ0hFQ0tfSU5URVJWQUwgPSAxMjAwMDAgKyAoMzAwMDAgKiBNYXRoLnJhbmRvbSgpKTtcblxuZnVuY3Rpb24gY2hlY2tWZXJzaW9uKCkge1xuICAkLmdldChcIi9jdXJyZW50LXZlcnNpb25cIikudGhlbihmdW5jdGlvbihyZXNwKSB7XG4gICAgcmVzcCA9IEpTT04ucGFyc2UocmVzcCk7XG4gICAgaWYocmVzcC52ZXJzaW9uICYmIHJlc3AudmVyc2lvbiAhPT0gcHJvY2Vzcy5lbnYuQ1VSUkVOVF9QWVJFVF9SRUxFQVNFKSB7XG4gICAgICB3aW5kb3cuZmxhc2hNZXNzYWdlKFwiQSBuZXcgdmVyc2lvbiBvZiBQeXJldCBpcyBhdmFpbGFibGUuIFNhdmUgYW5kIHJlbG9hZCB0aGUgcGFnZSB0byBnZXQgdGhlIG5ld2VzdCB2ZXJzaW9uLlwiKTtcbiAgICB9XG4gIH0pO1xufVxud2luZG93LnNldEludGVydmFsKGNoZWNrVmVyc2lvbiwgVkVSU0lPTl9DSEVDS19JTlRFUlZBTCk7XG5cbndpbmRvdy5DUE8gPSB7XG4gIHNhdmU6IGZ1bmN0aW9uKCkge30sXG4gIGF1dG9TYXZlOiBmdW5jdGlvbigpIHt9LFxuICBkb2N1bWVudHMgOiBuZXcgRG9jdW1lbnRzKClcbn07XG4kKGZ1bmN0aW9uKCkge1xuICBjb25zdCBDT05URVhUX0ZPUl9ORVdfRklMRVMgPSBcInVzZSBjb250ZXh0IHN0YXJ0ZXIyMDI0XFxuXCI7XG4gIGNvbnN0IENPTlRFWFRfUFJFRklYID0gL151c2UgY29udGV4dFxccysvO1xuXG4gIGZ1bmN0aW9uIG1lcmdlKG9iaiwgZXh0ZW5zaW9uKSB7XG4gICAgdmFyIG5ld29iaiA9IHt9O1xuICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICBuZXdvYmpba10gPSBvYmpba107XG4gICAgfSk7XG4gICAgT2JqZWN0LmtleXMoZXh0ZW5zaW9uKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgIG5ld29ialtrXSA9IGV4dGVuc2lvbltrXTtcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3b2JqO1xuICB9XG4gIHZhciBhbmltYXRpb25EaXYgPSBudWxsO1xuICBmdW5jdGlvbiBjbG9zZUFuaW1hdGlvbklmT3BlbigpIHtcbiAgICBpZihhbmltYXRpb25EaXYpIHtcbiAgICAgIGFuaW1hdGlvbkRpdi5lbXB0eSgpO1xuICAgICAgYW5pbWF0aW9uRGl2LmRpYWxvZyhcImRlc3Ryb3lcIik7XG4gICAgICBhbmltYXRpb25EaXYgPSBudWxsO1xuICAgIH1cbiAgfVxuICBDUE8ubWFrZUVkaXRvciA9IGZ1bmN0aW9uKGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgIHZhciBpbml0aWFsID0gXCJcIjtcbiAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcImluaXRpYWxcIikpIHtcbiAgICAgIGluaXRpYWwgPSBvcHRpb25zLmluaXRpYWw7XG4gICAgfVxuXG4gICAgdmFyIHRleHRhcmVhID0galF1ZXJ5KFwiPHRleHRhcmVhIGFyaWEtaGlkZGVuPSd0cnVlJz5cIik7XG4gICAgdGV4dGFyZWEudmFsKGluaXRpYWwpO1xuICAgIGNvbnRhaW5lci5hcHBlbmQodGV4dGFyZWEpO1xuXG4gICAgdmFyIHJ1bkZ1biA9IGZ1bmN0aW9uIChjb2RlLCByZXBsT3B0aW9ucykge1xuICAgICAgb3B0aW9ucy5ydW4oY29kZSwge2NtOiBDTX0sIHJlcGxPcHRpb25zKTtcbiAgICB9O1xuXG4gICAgdmFyIHVzZUxpbmVOdW1iZXJzID0gIW9wdGlvbnMuc2ltcGxlRWRpdG9yO1xuICAgIHZhciB1c2VGb2xkaW5nID0gIW9wdGlvbnMuc2ltcGxlRWRpdG9yO1xuXG4gICAgdmFyIGd1dHRlcnMgPSAhb3B0aW9ucy5zaW1wbGVFZGl0b3IgP1xuICAgICAgW1wiaGVscC1ndXR0ZXJcIiwgXCJDb2RlTWlycm9yLWxpbmVudW1iZXJzXCIsIFwiQ29kZU1pcnJvci1mb2xkZ3V0dGVyXCJdIDpcbiAgICAgIFtdO1xuXG4gICAgZnVuY3Rpb24gcmVpbmRlbnRBbGxMaW5lcyhjbSkge1xuICAgICAgdmFyIGxhc3QgPSBjbS5saW5lQ291bnQoKTtcbiAgICAgIGNtLm9wZXJhdGlvbihmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXN0OyArK2kpIGNtLmluZGVudExpbmUoaSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgQ09ERV9MSU5FX1dJRFRIID0gMTAwO1xuXG4gICAgdmFyIHJ1bGVycywgcnVsZXJzTWluQ29sO1xuXG4gICAgLy8gcGxhY2UgYSB2ZXJ0aWNhbCBsaW5lIGluIGNvZGUgZWRpdG9yLCBhbmQgbm90IHJlcGxcbiAgICBpZiAob3B0aW9ucy5zaW1wbGVFZGl0b3IpIHtcbiAgICAgIHJ1bGVycyA9IFtdO1xuICAgIH0gZWxzZXtcbiAgICAgIHJ1bGVycyA9IFt7Y29sb3I6IFwiIzMxN0JDRlwiLCBjb2x1bW46IENPREVfTElORV9XSURUSCwgbGluZVN0eWxlOiBcImRhc2hlZFwiLCBjbGFzc05hbWU6IFwiaGlkZGVuXCJ9XTtcbiAgICAgIHJ1bGVyc01pbkNvbCA9IENPREVfTElORV9XSURUSDtcbiAgICB9XG5cbiAgICBjb25zdCBtYWMgPSBDb2RlTWlycm9yLmtleU1hcC5kZWZhdWx0ID09PSBDb2RlTWlycm9yLmtleU1hcC5tYWNEZWZhdWx0O1xuICAgIGNvbnN0IG1vZGlmaWVyID0gbWFjID8gXCJDbWRcIiA6IFwiQ3RybFwiO1xuXG4gICAgdmFyIGNtT3B0aW9ucyA9IHtcbiAgICAgIGV4dHJhS2V5czogQ29kZU1pcnJvci5ub3JtYWxpemVLZXlNYXAoe1xuICAgICAgICBcIlNoaWZ0LUVudGVyXCI6IGZ1bmN0aW9uKGNtKSB7IHJ1bkZ1bihjbS5nZXRWYWx1ZSgpKTsgfSxcbiAgICAgICAgXCJTaGlmdC1DdHJsLUVudGVyXCI6IGZ1bmN0aW9uKGNtKSB7IHJ1bkZ1bihjbS5nZXRWYWx1ZSgpKTsgfSxcbiAgICAgICAgXCJUYWJcIjogXCJpbmRlbnRBdXRvXCIsXG4gICAgICAgIFwiQ3RybC1JXCI6IHJlaW5kZW50QWxsTGluZXMsXG4gICAgICAgIFwiRXNjIExlZnRcIjogXCJnb0JhY2t3YXJkU2V4cFwiLFxuICAgICAgICBcIkFsdC1MZWZ0XCI6IFwiZ29CYWNrd2FyZFNleHBcIixcbiAgICAgICAgXCJFc2MgUmlnaHRcIjogXCJnb0ZvcndhcmRTZXhwXCIsXG4gICAgICAgIFwiQWx0LVJpZ2h0XCI6IFwiZ29Gb3J3YXJkU2V4cFwiLFxuICAgICAgICBcIkN0cmwtTGVmdFwiOiBcImdvQmFja3dhcmRUb2tlblwiLFxuICAgICAgICBcIkN0cmwtUmlnaHRcIjogXCJnb0ZvcndhcmRUb2tlblwiLFxuICAgICAgICBbYCR7bW9kaWZpZXJ9LS9gXTogXCJ0b2dnbGVDb21tZW50XCIsXG4gICAgICB9KSxcbiAgICAgIGluZGVudFVuaXQ6IDIsXG4gICAgICB0YWJTaXplOiAyLFxuICAgICAgdmlld3BvcnRNYXJnaW46IEluZmluaXR5LFxuICAgICAgbGluZU51bWJlcnM6IHVzZUxpbmVOdW1iZXJzLFxuICAgICAgbWF0Y2hLZXl3b3JkczogdHJ1ZSxcbiAgICAgIG1hdGNoQnJhY2tldHM6IHRydWUsXG4gICAgICBzdHlsZVNlbGVjdGVkVGV4dDogdHJ1ZSxcbiAgICAgIGZvbGRHdXR0ZXI6IHVzZUZvbGRpbmcsXG4gICAgICBndXR0ZXJzOiBndXR0ZXJzLFxuICAgICAgbGluZVdyYXBwaW5nOiB0cnVlLFxuICAgICAgbG9nZ2luZzogdHJ1ZSxcbiAgICAgIHJ1bGVyczogcnVsZXJzLFxuICAgICAgcnVsZXJzTWluQ29sOiBydWxlcnNNaW5Db2wsXG4gICAgICBzY3JvbGxQYXN0RW5kOiB0cnVlLFxuICAgIH07XG5cbiAgICBjbU9wdGlvbnMgPSBtZXJnZShjbU9wdGlvbnMsIG9wdGlvbnMuY21PcHRpb25zIHx8IHt9KTtcblxuICAgIHZhciBDTSA9IENvZGVNaXJyb3IuZnJvbVRleHRBcmVhKHRleHRhcmVhWzBdLCBjbU9wdGlvbnMpO1xuXG4gICAgZnVuY3Rpb24gZmlyc3RMaW5lSXNOYW1lc3BhY2UoKSB7XG4gICAgICBjb25zdCBmaXJzdGxpbmUgPSBDTS5nZXRMaW5lKDApO1xuICAgICAgY29uc3QgbWF0Y2ggPSBmaXJzdGxpbmUubWF0Y2goQ09OVEVYVF9QUkVGSVgpO1xuICAgICAgcmV0dXJuIG1hdGNoICE9PSBudWxsO1xuICAgIH1cblxuICAgIGxldCBuYW1lc3BhY2VtYXJrID0gbnVsbDtcbiAgICBmdW5jdGlvbiBzZXRDb250ZXh0TGluZShuZXdDb250ZXh0TGluZSkge1xuICAgICAgdmFyIGhhc05hbWVzcGFjZSA9IGZpcnN0TGluZUlzTmFtZXNwYWNlKCk7XG4gICAgICBpZighaGFzTmFtZXNwYWNlICYmIG5hbWVzcGFjZW1hcmsgIT09IG51bGwpIHtcbiAgICAgICAgbmFtZXNwYWNlbWFyay5jbGVhcigpO1xuICAgICAgfVxuICAgICAgaWYoIWhhc05hbWVzcGFjZSkge1xuICAgICAgICBDTS5yZXBsYWNlUmFuZ2UobmV3Q29udGV4dExpbmUsIHsgbGluZTowLCBjaDogMH0sIHtsaW5lOiAwLCBjaDogMH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIENNLnJlcGxhY2VSYW5nZShuZXdDb250ZXh0TGluZSwgeyBsaW5lOjAsIGNoOiAwfSwge2xpbmU6IDEsIGNoOiAwfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYoIW9wdGlvbnMuc2ltcGxlRWRpdG9yKSB7XG5cbiAgICAgIGNvbnN0IGd1dHRlclF1ZXN0aW9uV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBndXR0ZXJRdWVzdGlvbldyYXBwZXIuY2xhc3NOYW1lID0gXCJndXR0ZXItcXVlc3Rpb24td3JhcHBlclwiO1xuICAgICAgY29uc3QgZ3V0dGVyVG9vbHRpcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgZ3V0dGVyVG9vbHRpcC5jbGFzc05hbWUgPSBcImd1dHRlci1xdWVzdGlvbi10b29sdGlwXCI7XG4gICAgICBndXR0ZXJUb29sdGlwLmlubmVyVGV4dCA9IFwiVGhlIHVzZSBjb250ZXh0IGxpbmUgdGVsbHMgUHlyZXQgdG8gbG9hZCB0b29scyBmb3IgYSBzcGVjaWZpYyBjbGFzcyBjb250ZXh0LiBJdCBjYW4gYmUgY2hhbmdlZCB0aHJvdWdoIHRoZSBtYWluIFB5cmV0IG1lbnUuIE1vc3Qgb2YgdGhlIHRpbWUgeW91IHdvbid0IG5lZWQgdG8gY2hhbmdlIHRoaXMgYXQgYWxsLlwiO1xuICAgICAgY29uc3QgZ3V0dGVyUXVlc3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICAgICAgZ3V0dGVyUXVlc3Rpb24uc3JjID0gXCIvaW1nL3F1ZXN0aW9uLnBuZ1wiO1xuICAgICAgZ3V0dGVyUXVlc3Rpb24uY2xhc3NOYW1lID0gXCJndXR0ZXItcXVlc3Rpb25cIjtcbiAgICAgIGd1dHRlclF1ZXN0aW9uV3JhcHBlci5hcHBlbmRDaGlsZChndXR0ZXJRdWVzdGlvbik7XG4gICAgICBndXR0ZXJRdWVzdGlvbldyYXBwZXIuYXBwZW5kQ2hpbGQoZ3V0dGVyVG9vbHRpcCk7XG4gICAgICBDTS5zZXRHdXR0ZXJNYXJrZXIoMCwgXCJoZWxwLWd1dHRlclwiLCBndXR0ZXJRdWVzdGlvbldyYXBwZXIpO1xuXG4gICAgICBDTS5nZXRXcmFwcGVyRWxlbWVudCgpLm9ubW91c2VsZWF2ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgQ00uY2xlYXJHdXR0ZXIoXCJoZWxwLWd1dHRlclwiKTtcbiAgICAgIH1cblxuICAgICAgLy8gTk9URShqb2UpOiBUaGlzIHNlZW1zIHRvIGJlIHRoZSBiZXN0IHdheSB0byBnZXQgYSBob3ZlciBvbiBhIG1hcms6IGh0dHBzOi8vZ2l0aHViLmNvbS9jb2RlbWlycm9yL0NvZGVNaXJyb3IvaXNzdWVzLzM1MjlcbiAgICAgIENNLmdldFdyYXBwZXJFbGVtZW50KCkub25tb3VzZW1vdmUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBsaW5lQ2ggPSBDTS5jb29yZHNDaGFyKHsgbGVmdDogZS5jbGllbnRYLCB0b3A6IGUuY2xpZW50WSB9KTtcbiAgICAgICAgdmFyIG1hcmtlcnMgPSBDTS5maW5kTWFya3NBdChsaW5lQ2gpO1xuICAgICAgICBpZiAobWFya2Vycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBDTS5jbGVhckd1dHRlcihcImhlbHAtZ3V0dGVyXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaW5lQ2gubGluZSA9PT0gMCAmJiBtYXJrZXJzWzBdID09PSBuYW1lc3BhY2VtYXJrKSB7XG4gICAgICAgICAgQ00uc2V0R3V0dGVyTWFya2VyKDAsIFwiaGVscC1ndXR0ZXJcIiwgZ3V0dGVyUXVlc3Rpb25XcmFwcGVyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBDTS5jbGVhckd1dHRlcihcImhlbHAtZ3V0dGVyXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBDTS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbihjaGFuZ2UpIHtcbiAgICAgICAgZnVuY3Rpb24gZG9lc05vdENoYW5nZUZpcnN0TGluZShjKSB7IHJldHVybiBjLmZyb20ubGluZSAhPT0gMDsgfVxuICAgICAgICBpZihjaGFuZ2UuY3VyT3AuY2hhbmdlT2JqcyAmJiBjaGFuZ2UuY3VyT3AuY2hhbmdlT2Jqcy5ldmVyeShkb2VzTm90Q2hhbmdlRmlyc3RMaW5lKSkgeyByZXR1cm47IH1cbiAgICAgICAgdmFyIGhhc05hbWVzcGFjZSA9IGZpcnN0TGluZUlzTmFtZXNwYWNlKCk7XG4gICAgICAgIGlmKGhhc05hbWVzcGFjZSkge1xuICAgICAgICAgIGlmKG5hbWVzcGFjZW1hcmspIHsgbmFtZXNwYWNlbWFyay5jbGVhcigpOyB9XG4gICAgICAgICAgbmFtZXNwYWNlbWFyayA9IENNLm1hcmtUZXh0KHtsaW5lOiAwLCBjaDogMH0sIHtsaW5lOiAxLCBjaDogMH0sIHsgYXR0cmlidXRlczogeyB1c2VsaW5lOiB0cnVlIH0sIGNsYXNzTmFtZTogXCJ1c2VsaW5lXCIsIGF0b21pYzogdHJ1ZSwgaW5jbHVzaXZlTGVmdDogdHJ1ZSwgaW5jbHVzaXZlUmlnaHQ6IGZhbHNlIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHVzZUxpbmVOdW1iZXJzKSB7XG4gICAgICBDTS5kaXNwbGF5LndyYXBwZXIuYXBwZW5kQ2hpbGQobWtXYXJuaW5nVXBwZXIoKVswXSk7XG4gICAgICBDTS5kaXNwbGF5LndyYXBwZXIuYXBwZW5kQ2hpbGQobWtXYXJuaW5nTG93ZXIoKVswXSk7XG4gICAgfVxuXG4gICAgZ2V0VG9wVGllck1lbnVpdGVtcygpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNtOiBDTSxcbiAgICAgIHNldENvbnRleHRMaW5lOiBzZXRDb250ZXh0TGluZSxcbiAgICAgIHJlZnJlc2g6IGZ1bmN0aW9uKCkgeyBDTS5yZWZyZXNoKCk7IH0sXG4gICAgICBydW46IGZ1bmN0aW9uKCkge1xuICAgICAgICBydW5GdW4oQ00uZ2V0VmFsdWUoKSk7XG4gICAgICB9LFxuICAgICAgZm9jdXM6IGZ1bmN0aW9uKCkgeyBDTS5mb2N1cygpOyB9LFxuICAgICAgZm9jdXNDYXJvdXNlbDogbnVsbCAvL2luaXRGb2N1c0Nhcm91c2VsXG4gICAgfTtcbiAgfTtcbiAgQ1BPLlJVTl9DT0RFID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coXCJSdW5uaW5nIGJlZm9yZSByZWFkeVwiLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHNldFVzZXJuYW1lKHRhcmdldCkge1xuICAgIHJldHVybiBnd3JhcC5sb2FkKHtuYW1lOiAncGx1cycsXG4gICAgICB2ZXJzaW9uOiAndjEnLFxuICAgIH0pLnRoZW4oKGFwaSkgPT4ge1xuICAgICAgYXBpLnBlb3BsZS5nZXQoeyB1c2VySWQ6IFwibWVcIiB9KS50aGVuKGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgdmFyIG5hbWUgPSB1c2VyLmRpc3BsYXlOYW1lO1xuICAgICAgICBpZiAodXNlci5lbWFpbHMgJiYgdXNlci5lbWFpbHNbMF0gJiYgdXNlci5lbWFpbHNbMF0udmFsdWUpIHtcbiAgICAgICAgICBuYW1lID0gdXNlci5lbWFpbHNbMF0udmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0LnRleHQobmFtZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0b3JhZ2VBUEkudGhlbihmdW5jdGlvbihhcGkpIHtcbiAgICBhcGkuY29sbGVjdGlvbi50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgJChcIi5sb2dpbk9ubHlcIikuc2hvdygpO1xuICAgICAgJChcIi5sb2dvdXRPbmx5XCIpLmhpZGUoKTtcbiAgICAgIHNldFVzZXJuYW1lKCQoXCIjdXNlcm5hbWVcIikpO1xuICAgIH0pO1xuICAgIGFwaS5jb2xsZWN0aW9uLmZhaWwoZnVuY3Rpb24oKSB7XG4gICAgICAkKFwiLmxvZ2luT25seVwiKS5oaWRlKCk7XG4gICAgICAkKFwiLmxvZ291dE9ubHlcIikuc2hvdygpO1xuICAgIH0pO1xuICB9KTtcblxuICBzdG9yYWdlQVBJID0gc3RvcmFnZUFQSS50aGVuKGZ1bmN0aW9uKGFwaSkgeyByZXR1cm4gYXBpLmFwaTsgfSk7XG4gICQoXCIjZnVsbENvbm5lY3RCdXR0b25cIikuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgcmVhdXRoKFxuICAgICAgZmFsc2UsICAvLyBEb24ndCBkbyBhbiBpbW1lZGlhdGUgbG9hZCAodGhpcyB3aWxsIHJlcXVpcmUgbG9naW4pXG4gICAgICB0cnVlICAgIC8vIFVzZSB0aGUgZnVsbCBzZXQgb2Ygc2NvcGVzIGZvciB0aGlzIGxvZ2luXG4gICAgKTtcbiAgfSk7XG4gICQoXCIjY29ubmVjdEJ1dHRvblwiKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAkKFwiI2Nvbm5lY3RCdXR0b25cIikudGV4dChcIkNvbm5lY3RpbmcuLi5cIik7XG4gICAgJChcIiNjb25uZWN0QnV0dG9uXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICQoJyNjb25uZWN0QnV0dG9ubGknKS5hdHRyKCdkaXNhYmxlZCcsICdkaXNhYmxlZCcpO1xuICAgICQoXCIjY29ubmVjdEJ1dHRvblwiKS5hdHRyKFwidGFiSW5kZXhcIiwgXCItMVwiKTtcbiAgICAvLyQoXCIjdG9wVGllclVsXCIpLmF0dHIoXCJ0YWJJbmRleFwiLCBcIjBcIik7XG4gICAgZ2V0VG9wVGllck1lbnVpdGVtcygpO1xuICAgIHN0b3JhZ2VBUEkgPSBjcmVhdGVQcm9ncmFtQ29sbGVjdGlvbkFQSShcImNvZGUucHlyZXQub3JnXCIsIGZhbHNlKTtcbiAgICBzdG9yYWdlQVBJLnRoZW4oZnVuY3Rpb24oYXBpKSB7XG4gICAgICBhcGkuY29sbGVjdGlvbi50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiLmxvZ2luT25seVwiKS5zaG93KCk7XG4gICAgICAgICQoXCIubG9nb3V0T25seVwiKS5oaWRlKCk7XG4gICAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuICAgICAgICAkKFwiI2Jvbm5pZW1lbnVidXR0b25cIikuZm9jdXMoKTtcbiAgICAgICAgc2V0VXNlcm5hbWUoJChcIiN1c2VybmFtZVwiKSk7XG4gICAgICAgIGlmKHBhcmFtc1tcImdldFwiXSAmJiBwYXJhbXNbXCJnZXRcIl1bXCJwcm9ncmFtXCJdKSB7XG4gICAgICAgICAgdmFyIHRvTG9hZCA9IGFwaS5hcGkuZ2V0RmlsZUJ5SWQocGFyYW1zW1wiZ2V0XCJdW1wicHJvZ3JhbVwiXSk7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJMb2dnZWQgaW4gYW5kIGhhcyBwcm9ncmFtIHRvIGxvYWQ6IFwiLCB0b0xvYWQpO1xuICAgICAgICAgIGxvYWRQcm9ncmFtKHRvTG9hZCk7XG4gICAgICAgICAgcHJvZ3JhbVRvU2F2ZSA9IHRvTG9hZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9ncmFtVG9TYXZlID0gUS5mY2FsbChmdW5jdGlvbigpIHsgcmV0dXJuIG51bGw7IH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGFwaS5jb2xsZWN0aW9uLmZhaWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICQoXCIjY29ubmVjdEJ1dHRvblwiKS50ZXh0KFwiQ29ubmVjdCB0byBHb29nbGUgRHJpdmVcIik7XG4gICAgICAgICQoXCIjY29ubmVjdEJ1dHRvblwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAkKCcjY29ubmVjdEJ1dHRvbmxpJykuYXR0cignZGlzYWJsZWQnLCBmYWxzZSk7XG4gICAgICAgIC8vJChcIiNjb25uZWN0QnV0dG9uXCIpLmF0dHIoXCJ0YWJJbmRleFwiLCBcIjBcIik7XG4gICAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuICAgICAgICAkKFwiI2Nvbm5lY3RCdXR0b25cIikuZm9jdXMoKTtcbiAgICAgICAgLy8kKFwiI3RvcFRpZXJVbFwiKS5hdHRyKFwidGFiSW5kZXhcIiwgXCItMVwiKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN0b3JhZ2VBUEkgPSBzdG9yYWdlQVBJLnRoZW4oZnVuY3Rpb24oYXBpKSB7IHJldHVybiBhcGkuYXBpOyB9KTtcbiAgfSk7XG5cbiAgLypcbiAgICBpbml0aWFsUHJvZ3JhbSBob2xkcyBhIHByb21pc2UgZm9yIGEgRHJpdmUgRmlsZSBvYmplY3Qgb3IgbnVsbFxuXG4gICAgSXQncyBudWxsIGlmIHRoZSBwYWdlIGRvZXNuJ3QgaGF2ZSBhICNzaGFyZSBvciAjcHJvZ3JhbSB1cmxcblxuICAgIElmIHRoZSB1cmwgZG9lcyBoYXZlIGEgI3Byb2dyYW0gb3IgI3NoYXJlLCB0aGUgcHJvbWlzZSBpcyBmb3IgdGhlXG4gICAgY29ycmVzcG9uZGluZyBvYmplY3QuXG4gICovXG4gIHZhciBpbml0aWFsUHJvZ3JhbSA9IHN0b3JhZ2VBUEkudGhlbihmdW5jdGlvbihhcGkpIHtcbiAgICB2YXIgcHJvZ3JhbUxvYWQgPSBudWxsO1xuICAgIGlmKHBhcmFtc1tcImdldFwiXSAmJiBwYXJhbXNbXCJnZXRcIl1bXCJwcm9ncmFtXCJdKSB7XG4gICAgICBlbmFibGVGaWxlT3B0aW9ucygpO1xuICAgICAgcHJvZ3JhbUxvYWQgPSBhcGkuZ2V0RmlsZUJ5SWQocGFyYW1zW1wiZ2V0XCJdW1wicHJvZ3JhbVwiXSk7XG4gICAgICBwcm9ncmFtTG9hZC50aGVuKGZ1bmN0aW9uKHApIHsgc2hvd1NoYXJlQ29udGFpbmVyKHApOyB9KTtcbiAgICB9XG4gICAgZWxzZSBpZihwYXJhbXNbXCJnZXRcIl0gJiYgcGFyYW1zW1wiZ2V0XCJdW1wic2hhcmVcIl0pIHtcbiAgICAgIGxvZ2dlci5sb2coJ3NoYXJlZC1wcm9ncmFtLWxvYWQnLFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IHBhcmFtc1tcImdldFwiXVtcInNoYXJlXCJdXG4gICAgICAgIH0pO1xuICAgICAgcHJvZ3JhbUxvYWQgPSBhcGkuZ2V0U2hhcmVkRmlsZUJ5SWQocGFyYW1zW1wiZ2V0XCJdW1wic2hhcmVcIl0pO1xuICAgICAgcHJvZ3JhbUxvYWQudGhlbihmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgIC8vIE5PVEUoam9lKTogSWYgdGhlIGN1cnJlbnQgdXNlciBkb2Vzbid0IG93biBvciBoYXZlIGFjY2VzcyB0byB0aGlzIGZpbGVcbiAgICAgICAgLy8gKG9yIGlzbid0IGxvZ2dlZCBpbikgdGhpcyB3aWxsIHNpbXBseSBmYWlsIHdpdGggYSA0MDEsIHNvIHdlIGRvbid0IGRvXG4gICAgICAgIC8vIGFueSBmdXJ0aGVyIHBlcm1pc3Npb24gY2hlY2tpbmcgYmVmb3JlIHNob3dpbmcgdGhlIGxpbmsuXG4gICAgICAgIGZpbGUuZ2V0T3JpZ2luYWwoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJSZXNwb25zZSBmb3Igb3JpZ2luYWw6IFwiLCByZXNwb25zZSk7XG4gICAgICAgICAgdmFyIG9yaWdpbmFsID0gJChcIiNvcGVuLW9yaWdpbmFsXCIpLnNob3coKS5vZmYoXCJjbGlja1wiKTtcbiAgICAgICAgICB2YXIgaWQgPSByZXNwb25zZS5yZXN1bHQudmFsdWU7XG4gICAgICAgICAgb3JpZ2luYWwucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIik7XG4gICAgICAgICAgb3JpZ2luYWwuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB3aW5kb3cub3Blbih3aW5kb3cuQVBQX0JBU0VfVVJMICsgXCIvZWRpdG9yI3Byb2dyYW09XCIgKyBpZCwgXCJfYmxhbmtcIik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcHJvZ3JhbUxvYWQgPSBudWxsO1xuICAgIH1cbiAgICBpZihwcm9ncmFtTG9hZCkge1xuICAgICAgcHJvZ3JhbUxvYWQuZmFpbChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB3aW5kb3cuc3RpY2tFcnJvcihcIlRoZSBwcm9ncmFtIGZhaWxlZCB0byBsb2FkLlwiKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHByb2dyYW1Mb2FkO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHNldFRpdGxlKHByb2dOYW1lKSB7XG4gICAgZG9jdW1lbnQudGl0bGUgPSBwcm9nTmFtZSArIFwiIC0gY29kZS5weXJldC5vcmdcIjtcbiAgICAkKFwiI3Nob3dGaWxlbmFtZVwiKS50ZXh0KFwiRmlsZTogXCIgKyBwcm9nTmFtZSk7XG4gIH1cbiAgQ1BPLnNldFRpdGxlID0gc2V0VGl0bGU7XG5cbiAgdmFyIGZpbGVuYW1lID0gZmFsc2U7XG5cbiAgJChcIiNkb3dubG9hZCBhXCIpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgIHZhciBkb3dubG9hZEVsdCA9ICQoXCIjZG93bmxvYWQgYVwiKTtcbiAgICB2YXIgY29udGVudHMgPSBDUE8uZWRpdG9yLmNtLmdldFZhbHVlKCk7XG4gICAgdmFyIGRvd25sb2FkQmxvYiA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtjb250ZW50c10sIHt0eXBlOiAndGV4dC9wbGFpbid9KSk7XG4gICAgaWYoIWZpbGVuYW1lKSB7IGZpbGVuYW1lID0gJ3VudGl0bGVkX3Byb2dyYW0uYXJyJzsgfVxuICAgIGlmKGZpbGVuYW1lLmluZGV4T2YoXCIuYXJyXCIpICE9PSAoZmlsZW5hbWUubGVuZ3RoIC0gNCkpIHtcbiAgICAgIGZpbGVuYW1lICs9IFwiLmFyclwiO1xuICAgIH1cbiAgICBkb3dubG9hZEVsdC5hdHRyKHtcbiAgICAgIGRvd25sb2FkOiBmaWxlbmFtZSxcbiAgICAgIGhyZWY6IGRvd25sb2FkQmxvYlxuICAgIH0pO1xuICAgICQoXCIjZG93bmxvYWRcIikuYXBwZW5kKGRvd25sb2FkRWx0KTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gc2hvd01vZGFsKGN1cnJlbnRDb250ZXh0KSB7XG4gICAgZnVuY3Rpb24gZHJhd0VsZW1lbnQoaW5wdXQpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSAkKFwiPGRpdj5cIik7XG4gICAgICBjb25zdCBncmVldGluZyA9ICQoXCI8cD5cIik7XG4gICAgICBjb25zdCBzaGFyZWQgPSAkKFwiPHR0PnNoYXJlZC1nZHJpdmUoLi4uKTwvdHQ+XCIpO1xuICAgICAgY29uc3QgY3VycmVudENvbnRleHRFbHQgPSAkKFwiPHR0PlwiICsgY3VycmVudENvbnRleHQgKyBcIjwvdHQ+XCIpO1xuICAgICAgZ3JlZXRpbmcuYXBwZW5kKFwiRW50ZXIgdGhlIGNvbnRleHQgdG8gdXNlIGZvciB0aGUgcHJvZ3JhbSwgb3IgY2hvb3NlIOKAnENhbmNlbOKAnSB0byBrZWVwIHRoZSBjdXJyZW50IGNvbnRleHQgb2YgXCIsIGN1cnJlbnRDb250ZXh0RWx0LCBcIi5cIik7XG4gICAgICBjb25zdCBlc3NlbnRpYWxzID0gJChcIjx0dD5zdGFydGVyMjAyNDwvdHQ+XCIpO1xuICAgICAgY29uc3QgbGlzdCA9ICQoXCI8dWw+XCIpXG4gICAgICAgIC5hcHBlbmQoJChcIjxsaT5cIikuYXBwZW5kKFwiVGhlIGRlZmF1bHQgaXMgXCIsIGVzc2VudGlhbHMsIFwiLlwiKSlcbiAgICAgICAgLmFwcGVuZCgkKFwiPGxpPlwiKS5hcHBlbmQoXCJZb3UgbWlnaHQgdXNlIHNvbWV0aGluZyBsaWtlIFwiLCBzaGFyZWQsIFwiIGlmIG9uZSB3YXMgcHJvdmlkZWQgYXMgcGFydCBvZiBhIGNvdXJzZS5cIikpO1xuICAgICAgZWxlbWVudC5hcHBlbmQoZ3JlZXRpbmcpO1xuICAgICAgZWxlbWVudC5hcHBlbmQoJChcIjxwPlwiKS5hcHBlbmQobGlzdCkpO1xuICAgICAgY29uc3QgdXNlQ29udGV4dCA9ICQoXCI8dHQ+dXNlIGNvbnRleHQ8L3R0PlwiKS5jc3MoeyAnZmxleC1ncm93JzogJzAnLCAncGFkZGluZy1yaWdodCc6ICcxZW0nIH0pO1xuICAgICAgY29uc3QgaW5wdXRXcmFwcGVyID0gJChcIjxkaXY+XCIpLmFwcGVuZChpbnB1dCkuY3NzKHsgJ2ZsZXgtZ3Jvdyc6ICcxJyB9KTtcbiAgICAgIGNvbnN0IGVudHJ5ID0gJChcIjxkaXY+XCIpLmNzcyh7XG4gICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ3JvdycsXG4gICAgICAgICdqdXN0aWZ5LWNvbnRlbnQnOiAnZmxleC1zdGFydCcsXG4gICAgICAgICdhbGlnbi1pdGVtcyc6ICdiYXNlbGluZSdcbiAgICAgIH0pO1xuICAgICAgZW50cnkuYXBwZW5kKHVzZUNvbnRleHQpLmFwcGVuZChpbnB1dFdyYXBwZXIpO1xuICAgICAgZWxlbWVudC5hcHBlbmQoZW50cnkpO1xuICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuICAgIGNvbnN0IG5hbWVzcGFjZVJlc3VsdCA9IG5ldyBtb2RhbFByb21wdCh7XG4gICAgICAgIHRpdGxlOiBcIkNob29zZSBhIENvbnRleHRcIixcbiAgICAgICAgc3R5bGU6IFwidGV4dFwiLFxuICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZHJhd0VsZW1lbnQ6IGRyYXdFbGVtZW50LFxuICAgICAgICAgICAgc3VibWl0VGV4dDogXCJDaGFuZ2UgTmFtZXNwYWNlXCIsXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU6IGN1cnJlbnRDb250ZXh0XG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9KTtcbiAgICBuYW1lc3BhY2VSZXN1bHQuc2hvdygocmVzdWx0KSA9PiB7XG4gICAgICBpZighcmVzdWx0KSB7IHJldHVybjsgfVxuICAgICAgQ1BPLmVkaXRvci5zZXRDb250ZXh0TGluZShcInVzZSBjb250ZXh0IFwiICsgcmVzdWx0LnRyaW0oKSArIFwiXFxuXCIpO1xuICAgIH0pO1xuICB9XG4gICQoXCIjY2hvb3NlLWNvbnRleHRcIikub24oXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBmaXJzdExpbmUgPSBDUE8uZWRpdG9yLmNtLmdldExpbmUoMCk7XG4gICAgY29uc3QgY29udGV4dExlbiA9IGZpcnN0TGluZS5tYXRjaChDT05URVhUX1BSRUZJWCk7XG4gICAgc2hvd01vZGFsKGNvbnRleHRMZW4gPT09IG51bGwgPyBcIlwiIDogZmlyc3RMaW5lLnNsaWNlKGNvbnRleHRMZW5bMF0ubGVuZ3RoKSk7XG4gIH0pO1xuXG4gIHZhciBUUlVOQ0FURV9MRU5HVEggPSAyMDtcblxuICBmdW5jdGlvbiB0cnVuY2F0ZU5hbWUobmFtZSkge1xuICAgIGlmKG5hbWUubGVuZ3RoIDw9IFRSVU5DQVRFX0xFTkdUSCArIDEpIHsgcmV0dXJuIG5hbWU7IH1cbiAgICByZXR1cm4gbmFtZS5zbGljZSgwLCBUUlVOQ0FURV9MRU5HVEggLyAyKSArIFwi4oCmXCIgKyBuYW1lLnNsaWNlKG5hbWUubGVuZ3RoIC0gVFJVTkNBVEVfTEVOR1RIIC8gMiwgbmFtZS5sZW5ndGgpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlTmFtZShwKSB7XG4gICAgZmlsZW5hbWUgPSBwLmdldE5hbWUoKTtcbiAgICAkKFwiI2ZpbGVuYW1lXCIpLnRleHQoXCIgKFwiICsgdHJ1bmNhdGVOYW1lKGZpbGVuYW1lKSArIFwiKVwiKTtcbiAgICBzZXRUaXRsZShmaWxlbmFtZSk7XG4gICAgc2hvd1NoYXJlQ29udGFpbmVyKHApO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9hZFByb2dyYW0ocCkge1xuICAgIHByb2dyYW1Ub1NhdmUgPSBwO1xuICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24ocHJvZykge1xuICAgICAgaWYocHJvZyAhPT0gbnVsbCkge1xuICAgICAgICB1cGRhdGVOYW1lKHByb2cpO1xuICAgICAgICBpZihwcm9nLnNoYXJlZCkge1xuICAgICAgICAgIHdpbmRvdy5zdGlja01lc3NhZ2UoXCJZb3UgYXJlIHZpZXdpbmcgYSBzaGFyZWQgcHJvZ3JhbS4gQW55IGNoYW5nZXMgeW91IG1ha2Ugd2lsbCBub3QgYmUgc2F2ZWQuIFlvdSBjYW4gdXNlIEZpbGUgLT4gU2F2ZSBhIGNvcHkgdG8gc2F2ZSB5b3VyIG93biB2ZXJzaW9uIHdpdGggYW55IGVkaXRzIHlvdSBtYWtlLlwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvZy5nZXRDb250ZW50cygpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGlmKHBhcmFtc1tcImdldFwiXVtcImVkaXRvckNvbnRlbnRzXCJdICYmICEocGFyYW1zW1wiZ2V0XCJdW1wicHJvZ3JhbVwiXSB8fCBwYXJhbXNbXCJnZXRcIl1bXCJzaGFyZVwiXSkpIHtcbiAgICAgICAgICByZXR1cm4gcGFyYW1zW1wiZ2V0XCJdW1wiZWRpdG9yQ29udGVudHNcIl07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIENPTlRFWFRfRk9SX05FV19GSUxFUztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2F5KG1zZywgZm9yZ2V0KSB7XG4gICAgaWYgKG1zZyA9PT0gXCJcIikgcmV0dXJuO1xuICAgIHZhciBhbm5vdW5jZW1lbnRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhbm5vdW5jZW1lbnRsaXN0XCIpO1xuICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJMSVwiKTtcbiAgICBsaS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShtc2cpKTtcbiAgICBhbm5vdW5jZW1lbnRzLmluc2VydEJlZm9yZShsaSwgYW5ub3VuY2VtZW50cy5maXJzdENoaWxkKTtcbiAgICBpZiAoZm9yZ2V0KSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBhbm5vdW5jZW1lbnRzLnJlbW92ZUNoaWxkKGxpKTtcbiAgICAgIH0sIDEwMDApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNheUFuZEZvcmdldChtc2cpIHtcbiAgICBjb25zb2xlLmxvZygnZG9pbmcgc2F5QW5kRm9yZ2V0JywgbXNnKTtcbiAgICBzYXkobXNnLCB0cnVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGN5Y2xlQWR2YW5jZShjdXJySW5kZXgsIG1heEluZGV4LCByZXZlcnNlUCkge1xuICAgIHZhciBuZXh0SW5kZXggPSBjdXJySW5kZXggKyAocmV2ZXJzZVA/IC0xIDogKzEpO1xuICAgIG5leHRJbmRleCA9ICgobmV4dEluZGV4ICUgbWF4SW5kZXgpICsgbWF4SW5kZXgpICUgbWF4SW5kZXg7XG4gICAgcmV0dXJuIG5leHRJbmRleDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvcHVsYXRlRm9jdXNDYXJvdXNlbChlZGl0b3IpIHtcbiAgICBpZiAoIWVkaXRvci5mb2N1c0Nhcm91c2VsKSB7XG4gICAgICBlZGl0b3IuZm9jdXNDYXJvdXNlbCA9IFtdO1xuICAgIH1cbiAgICB2YXIgZmMgPSBlZGl0b3IuZm9jdXNDYXJvdXNlbDtcbiAgICB2YXIgZG9jbWFpbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFpblwiKTtcbiAgICBpZiAoIWZjWzBdKSB7XG4gICAgICB2YXIgdG9vbGJhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdUb29sYmFyJyk7XG4gICAgICBmY1swXSA9IHRvb2xiYXI7XG4gICAgICAvL2ZjWzBdID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWFkZXJvbmVsZWdlbmRcIik7XG4gICAgICAvL2dldFRvcFRpZXJNZW51aXRlbXMoKTtcbiAgICAgIC8vZmNbMF0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm9ubmllbWVudWJ1dHRvbicpO1xuICAgIH1cbiAgICBpZiAoIWZjWzFdKSB7XG4gICAgICB2YXIgZG9jcmVwbE1haW4gPSBkb2NtYWluLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJyZXBsTWFpblwiKTtcbiAgICAgIHZhciBkb2NyZXBsTWFpbjA7XG4gICAgICBpZiAoZG9jcmVwbE1haW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGRvY3JlcGxNYWluMCA9IHVuZGVmaW5lZDtcbiAgICAgIH0gZWxzZSBpZiAoZG9jcmVwbE1haW4ubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGRvY3JlcGxNYWluMCA9IGRvY3JlcGxNYWluWzBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkb2NyZXBsTWFpbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChkb2NyZXBsTWFpbltpXS5pbm5lclRleHQgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIGRvY3JlcGxNYWluMCA9IGRvY3JlcGxNYWluW2ldO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZmNbMV0gPSBkb2NyZXBsTWFpbjA7XG4gICAgfVxuICAgIGlmICghZmNbMl0pIHtcbiAgICAgIHZhciBkb2NyZXBsID0gZG9jbWFpbi5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwicmVwbFwiKTtcbiAgICAgIHZhciBkb2NyZXBsY29kZSA9IGRvY3JlcGxbMF0uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInByb21wdC1jb250YWluZXJcIilbMF0uXG4gICAgICAgIGdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJDb2RlTWlycm9yXCIpWzBdO1xuICAgICAgZmNbMl0gPSBkb2NyZXBsY29kZTtcbiAgICB9XG4gICAgaWYgKCFmY1szXSkge1xuICAgICAgZmNbM10gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFubm91bmNlbWVudHNcIik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY3ljbGVGb2N1cyhyZXZlcnNlUCkge1xuICAgIC8vY29uc29sZS5sb2coJ2RvaW5nIGN5Y2xlRm9jdXMnLCByZXZlcnNlUCk7XG4gICAgdmFyIGVkaXRvciA9IHRoaXMuZWRpdG9yO1xuICAgIHBvcHVsYXRlRm9jdXNDYXJvdXNlbChlZGl0b3IpO1xuICAgIHZhciBmQ2Fyb3VzZWwgPSBlZGl0b3IuZm9jdXNDYXJvdXNlbDtcbiAgICB2YXIgbWF4SW5kZXggPSBmQ2Fyb3VzZWwubGVuZ3RoO1xuICAgIHZhciBjdXJyZW50Rm9jdXNlZEVsdCA9IGZDYXJvdXNlbC5maW5kKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIGlmICghbm9kZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbm9kZS5jb250YWlucyhkb2N1bWVudC5hY3RpdmVFbGVtZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgY3VycmVudEZvY3VzSW5kZXggPSBmQ2Fyb3VzZWwuaW5kZXhPZihjdXJyZW50Rm9jdXNlZEVsdCk7XG4gICAgdmFyIG5leHRGb2N1c0luZGV4ID0gY3VycmVudEZvY3VzSW5kZXg7XG4gICAgdmFyIGZvY3VzRWx0O1xuICAgIGRvIHtcbiAgICAgIG5leHRGb2N1c0luZGV4ID0gY3ljbGVBZHZhbmNlKG5leHRGb2N1c0luZGV4LCBtYXhJbmRleCwgcmV2ZXJzZVApO1xuICAgICAgZm9jdXNFbHQgPSBmQ2Fyb3VzZWxbbmV4dEZvY3VzSW5kZXhdO1xuICAgICAgLy9jb25zb2xlLmxvZygndHJ5aW5nIGZvY3VzRWx0JywgZm9jdXNFbHQpO1xuICAgIH0gd2hpbGUgKCFmb2N1c0VsdCk7XG5cbiAgICB2YXIgZm9jdXNFbHQwO1xuICAgIGlmIChmb2N1c0VsdC5jbGFzc0xpc3QuY29udGFpbnMoJ3Rvb2xiYXJyZWdpb24nKSkge1xuICAgICAgLy9jb25zb2xlLmxvZygnc2V0dGxpbmcgb24gdG9vbGJhciByZWdpb24nKVxuICAgICAgZ2V0VG9wVGllck1lbnVpdGVtcygpO1xuICAgICAgZm9jdXNFbHQwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Jvbm5pZW1lbnVidXR0b24nKTtcbiAgICB9IGVsc2UgaWYgKGZvY3VzRWx0LmNsYXNzTGlzdC5jb250YWlucyhcInJlcGxNYWluXCIpIHx8XG4gICAgICBmb2N1c0VsdC5jbGFzc0xpc3QuY29udGFpbnMoXCJDb2RlTWlycm9yXCIpKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdzZXR0bGluZyBvbiBkZWZuIHdpbmRvdycpXG4gICAgICB2YXIgdGV4dGFyZWFzID0gZm9jdXNFbHQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ0ZXh0YXJlYVwiKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ3R4dGFyZWFzPScsIHRleHRhcmVhcylcbiAgICAgIC8vY29uc29sZS5sb2coJ3R4dGFyZWEgbGVuPScsIHRleHRhcmVhcy5sZW5ndGgpXG4gICAgICBpZiAodGV4dGFyZWFzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdJJylcbiAgICAgICAgZm9jdXNFbHQwID0gZm9jdXNFbHQ7XG4gICAgICB9IGVsc2UgaWYgKHRleHRhcmVhcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnc2V0dGxpbmcgb24gaW50ZXIgd2luZG93JylcbiAgICAgICAgZm9jdXNFbHQwID0gdGV4dGFyZWFzWzBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnc2V0dGxpbmcgb24gZGVmbiB3aW5kb3cnKVxuICAgICAgICAvKlxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRleHRhcmVhcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh0ZXh0YXJlYXNbaV0uZ2V0QXR0cmlidXRlKCd0YWJJbmRleCcpKSB7XG4gICAgICAgICAgICBmb2N1c0VsdDAgPSB0ZXh0YXJlYXNbaV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgICovXG4gICAgICAgIGZvY3VzRWx0MCA9IHRleHRhcmVhc1t0ZXh0YXJlYXMubGVuZ3RoLTFdO1xuICAgICAgICBmb2N1c0VsdDAucmVtb3ZlQXR0cmlidXRlKCd0YWJJbmRleCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdzZXR0bGluZyBvbiBhbm5vdW5jZW1lbnQgcmVnaW9uJywgZm9jdXNFbHQpXG4gICAgICBmb2N1c0VsdDAgPSBmb2N1c0VsdDtcbiAgICB9XG5cbiAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTtcbiAgICBmb2N1c0VsdDAuY2xpY2soKTtcbiAgICBmb2N1c0VsdDAuZm9jdXMoKTtcbiAgICAvL2NvbnNvbGUubG9nKCcoY2YpZG9jYWN0ZWx0PScsIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpO1xuICB9XG5cbiAgdmFyIHByb2dyYW1Mb2FkZWQgPSBsb2FkUHJvZ3JhbShpbml0aWFsUHJvZ3JhbSk7XG5cbiAgdmFyIHByb2dyYW1Ub1NhdmUgPSBpbml0aWFsUHJvZ3JhbTtcblxuICBmdW5jdGlvbiBzaG93U2hhcmVDb250YWluZXIocCkge1xuICAgIC8vY29uc29sZS5sb2coJ2NhbGxlZCBzaG93U2hhcmVDb250YWluZXInKTtcbiAgICBpZighcC5zaGFyZWQpIHtcbiAgICAgICQoXCIjc2hhcmVDb250YWluZXJcIikuZW1wdHkoKTtcbiAgICAgICQoJyNwdWJsaXNobGknKS5zaG93KCk7XG4gICAgICAkKFwiI3NoYXJlQ29udGFpbmVyXCIpLmFwcGVuZChzaGFyZUFQSS5tYWtlU2hhcmVMaW5rKHApKTtcbiAgICAgIGdldFRvcFRpZXJNZW51aXRlbXMoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBuYW1lT3JVbnRpdGxlZCgpIHtcbiAgICByZXR1cm4gZmlsZW5hbWUgfHwgXCJVbnRpdGxlZFwiO1xuICB9XG4gIGZ1bmN0aW9uIGF1dG9TYXZlKCkge1xuICAgIHByb2dyYW1Ub1NhdmUudGhlbihmdW5jdGlvbihwKSB7XG4gICAgICBpZihwICE9PSBudWxsICYmICFwLnNoYXJlZCkgeyBzYXZlKCk7IH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVuYWJsZUZpbGVPcHRpb25zKCkge1xuICAgICQoXCIjZmlsZW1lbnVDb250ZW50cyAqXCIpLnJlbW92ZUNsYXNzKFwiZGlzYWJsZWRcIik7XG4gIH1cblxuICBmdW5jdGlvbiBtZW51SXRlbURpc2FibGVkKGlkKSB7XG4gICAgcmV0dXJuICQoXCIjXCIgKyBpZCkuaGFzQ2xhc3MoXCJkaXNhYmxlZFwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5ld0V2ZW50KGUpIHtcbiAgICB3aW5kb3cub3Blbih3aW5kb3cuQVBQX0JBU0VfVVJMICsgXCIvZWRpdG9yXCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2F2ZUV2ZW50KGUpIHtcbiAgICBpZihtZW51SXRlbURpc2FibGVkKFwic2F2ZVwiKSkgeyByZXR1cm47IH1cbiAgICByZXR1cm4gc2F2ZSgpO1xuICB9XG5cbiAgLypcbiAgICBzYXZlIDogc3RyaW5nIChvcHRpb25hbCkgLT4gdW5kZWZcblxuICAgIElmIGEgc3RyaW5nIGFyZ3VtZW50IGlzIHByb3ZpZGVkLCBjcmVhdGUgYSBuZXcgZmlsZSB3aXRoIHRoYXQgbmFtZSBhbmQgc2F2ZVxuICAgIHRoZSBlZGl0b3IgY29udGVudHMgaW4gdGhhdCBmaWxlLlxuXG4gICAgSWYgbm8gZmlsZW5hbWUgaXMgcHJvdmlkZWQsIHNhdmUgdGhlIGV4aXN0aW5nIGZpbGUgcmVmZXJlbmNlZCBieSB0aGUgZWRpdG9yXG4gICAgd2l0aCB0aGUgY3VycmVudCBlZGl0b3IgY29udGVudHMuICBJZiBubyBmaWxlbmFtZSBoYXMgYmVlbiBzZXQgeWV0LCBqdXN0XG4gICAgc2V0IHRoZSBuYW1lIHRvIFwiVW50aXRsZWRcIi5cblxuICAqL1xuICBmdW5jdGlvbiBzYXZlKG5ld0ZpbGVuYW1lKSB7XG4gICAgdmFyIHVzZU5hbWUsIGNyZWF0ZTtcbiAgICBpZihuZXdGaWxlbmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB1c2VOYW1lID0gbmV3RmlsZW5hbWU7XG4gICAgICBjcmVhdGUgPSB0cnVlO1xuICAgIH1cbiAgICBlbHNlIGlmKGZpbGVuYW1lID09PSBmYWxzZSkge1xuICAgICAgZmlsZW5hbWUgPSBcIlVudGl0bGVkXCI7XG4gICAgICBjcmVhdGUgPSB0cnVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHVzZU5hbWUgPSBmaWxlbmFtZTsgLy8gQSBjbG9zZWQtb3ZlciB2YXJpYWJsZVxuICAgICAgY3JlYXRlID0gZmFsc2U7XG4gICAgfVxuICAgIHdpbmRvdy5zdGlja01lc3NhZ2UoXCJTYXZpbmcuLi5cIik7XG4gICAgdmFyIHNhdmVkUHJvZ3JhbSA9IHByb2dyYW1Ub1NhdmUudGhlbihmdW5jdGlvbihwKSB7XG4gICAgICBpZihwICE9PSBudWxsICYmIHAuc2hhcmVkICYmICFjcmVhdGUpIHtcbiAgICAgICAgcmV0dXJuIHA7IC8vIERvbid0IHRyeSB0byBzYXZlIHNoYXJlZCBmaWxlc1xuICAgICAgfVxuICAgICAgaWYoY3JlYXRlKSB7XG4gICAgICAgIHByb2dyYW1Ub1NhdmUgPSBzdG9yYWdlQVBJXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24oYXBpKSB7IHJldHVybiBhcGkuY3JlYXRlRmlsZSh1c2VOYW1lKTsgfSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihwKSB7XG4gICAgICAgICAgICAvLyBzaG93U2hhcmVDb250YWluZXIocCk7IFRPRE8oam9lKTogZmlndXJlIG91dCB3aGVyZSB0byBwdXQgdGhpc1xuICAgICAgICAgICAgaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgbnVsbCwgXCIjcHJvZ3JhbT1cIiArIHAuZ2V0VW5pcXVlSWQoKSk7XG4gICAgICAgICAgICB1cGRhdGVOYW1lKHApOyAvLyBzZXRzIGZpbGVuYW1lXG4gICAgICAgICAgICBlbmFibGVGaWxlT3B0aW9ucygpO1xuICAgICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBwcm9ncmFtVG9TYXZlLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgICAgIHJldHVybiBzYXZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBwcm9ncmFtVG9TYXZlLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgICAgIGlmKHAgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBwLnNhdmUoQ1BPLmVkaXRvci5jbS5nZXRWYWx1ZSgpLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgICBpZihwICE9PSBudWxsKSB7XG4gICAgICAgICAgICB3aW5kb3cuZmxhc2hNZXNzYWdlKFwiUHJvZ3JhbSBzYXZlZCBhcyBcIiArIHAuZ2V0TmFtZSgpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHNhdmVkUHJvZ3JhbS5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgd2luZG93LnN0aWNrRXJyb3IoXCJVbmFibGUgdG8gc2F2ZVwiLCBcIllvdXIgaW50ZXJuZXQgY29ubmVjdGlvbiBtYXkgYmUgZG93biwgb3Igc29tZXRoaW5nIGVsc2UgbWlnaHQgYmUgd3Jvbmcgd2l0aCB0aGlzIHNpdGUgb3Igc2F2aW5nIHRvIEdvb2dsZS4gIFlvdSBzaG91bGQgYmFjayB1cCBhbnkgY2hhbmdlcyB0byB0aGlzIHByb2dyYW0gc29tZXdoZXJlIGVsc2UuICBZb3UgY2FuIHRyeSBzYXZpbmcgYWdhaW4gdG8gc2VlIGlmIHRoZSBwcm9ibGVtIHdhcyB0ZW1wb3JhcnksIGFzIHdlbGwuXCIpO1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH0pO1xuICAgIHJldHVybiBzYXZlZFByb2dyYW07XG4gIH1cblxuICBmdW5jdGlvbiBzYXZlQXMoKSB7XG4gICAgaWYobWVudUl0ZW1EaXNhYmxlZChcInNhdmVhc1wiKSkgeyByZXR1cm47IH1cbiAgICBwcm9ncmFtVG9TYXZlLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgdmFyIG5hbWUgPSBwID09PSBudWxsID8gXCJVbnRpdGxlZFwiIDogcC5nZXROYW1lKCk7XG4gICAgICB2YXIgc2F2ZUFzUHJvbXB0ID0gbmV3IG1vZGFsUHJvbXB0KHtcbiAgICAgICAgdGl0bGU6IFwiU2F2ZSBhIGNvcHlcIixcbiAgICAgICAgc3R5bGU6IFwidGV4dFwiLFxuICAgICAgICBzdWJtaXRUZXh0OiBcIlNhdmVcIixcbiAgICAgICAgbmFycm93OiB0cnVlLFxuICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbWVzc2FnZTogXCJUaGUgbmFtZSBmb3IgdGhlIGNvcHk6XCIsXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU6IG5hbWVcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHNhdmVBc1Byb21wdC5zaG93KCkudGhlbihmdW5jdGlvbihuZXdOYW1lKSB7XG4gICAgICAgIGlmKG5ld05hbWUgPT09IG51bGwpIHsgcmV0dXJuIG51bGw7IH1cbiAgICAgICAgd2luZG93LnN0aWNrTWVzc2FnZShcIlNhdmluZy4uLlwiKTtcbiAgICAgICAgcmV0dXJuIHNhdmUobmV3TmFtZSk7XG4gICAgICB9KS5cbiAgICAgIGZhaWwoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gcmVuYW1lOiBcIiwgZXJyKTtcbiAgICAgICAgd2luZG93LmZsYXNoRXJyb3IoXCJGYWlsZWQgdG8gcmVuYW1lIGZpbGVcIik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmFtZSgpIHtcbiAgICBwcm9ncmFtVG9TYXZlLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgdmFyIHJlbmFtZVByb21wdCA9IG5ldyBtb2RhbFByb21wdCh7XG4gICAgICAgIHRpdGxlOiBcIlJlbmFtZSB0aGlzIGZpbGVcIixcbiAgICAgICAgc3R5bGU6IFwidGV4dFwiLFxuICAgICAgICBuYXJyb3c6IHRydWUsXG4gICAgICAgIHN1Ym1pdFRleHQ6IFwiUmVuYW1lXCIsXG4gICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBtZXNzYWdlOiBcIlRoZSBuZXcgbmFtZSBmb3IgdGhlIGZpbGU6XCIsXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU6IHAuZ2V0TmFtZSgpXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9KTtcbiAgICAgIC8vIG51bGwgcmV0dXJuIHZhbHVlcyBhcmUgZm9yIHRoZSBcImNhbmNlbFwiIHBhdGhcbiAgICAgIHJldHVybiByZW5hbWVQcm9tcHQuc2hvdygpLnRoZW4oZnVuY3Rpb24obmV3TmFtZSkge1xuICAgICAgICBpZihuZXdOYW1lID09PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgd2luZG93LnN0aWNrTWVzc2FnZShcIlJlbmFtaW5nLi4uXCIpO1xuICAgICAgICBwcm9ncmFtVG9TYXZlID0gcC5yZW5hbWUobmV3TmFtZSk7XG4gICAgICAgIHJldHVybiBwcm9ncmFtVG9TYXZlO1xuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgaWYocCA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHVwZGF0ZU5hbWUocCk7XG4gICAgICAgIHdpbmRvdy5mbGFzaE1lc3NhZ2UoXCJQcm9ncmFtIHNhdmVkIGFzIFwiICsgcC5nZXROYW1lKCkpO1xuICAgICAgfSlcbiAgICAgIC5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHJlbmFtZTogXCIsIGVycik7XG4gICAgICAgIHdpbmRvdy5mbGFzaEVycm9yKFwiRmFpbGVkIHRvIHJlbmFtZSBmaWxlXCIpO1xuICAgICAgfSk7XG4gICAgfSlcbiAgICAuZmFpbChmdW5jdGlvbihlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmFibGUgdG8gcmVuYW1lOiBcIiwgZXJyKTtcbiAgICB9KTtcbiAgfVxuXG4gICQoXCIjcnVuQnV0dG9uXCIpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgIENQTy5hdXRvU2F2ZSgpO1xuICB9KTtcblxuICAkKFwiI25ld1wiKS5jbGljayhuZXdFdmVudCk7XG4gICQoXCIjc2F2ZVwiKS5jbGljayhzYXZlRXZlbnQpO1xuICAkKFwiI3JlbmFtZVwiKS5jbGljayhyZW5hbWUpO1xuICAkKFwiI3NhdmVhc1wiKS5jbGljayhzYXZlQXMpO1xuXG4gIHZhciBmb2N1c2FibGVFbHRzID0gJChkb2N1bWVudCkuZmluZCgnI2hlYWRlciAuZm9jdXNhYmxlJyk7XG4gIC8vY29uc29sZS5sb2coJ2ZvY3VzYWJsZUVsdHM9JywgZm9jdXNhYmxlRWx0cylcbiAgdmFyIHRoZVRvb2xiYXIgPSAkKGRvY3VtZW50KS5maW5kKCcjVG9vbGJhcicpO1xuXG4gIGZ1bmN0aW9uIGdldFRvcFRpZXJNZW51aXRlbXMoKSB7XG4gICAgLy9jb25zb2xlLmxvZygnZG9pbmcgZ2V0VG9wVGllck1lbnVpdGVtcycpXG4gICAgdmFyIHRvcFRpZXJNZW51aXRlbXMgPSAkKGRvY3VtZW50KS5maW5kKCcjaGVhZGVyIHVsIGxpLnRvcFRpZXInKS50b0FycmF5KCk7XG4gICAgdG9wVGllck1lbnVpdGVtcyA9IHRvcFRpZXJNZW51aXRlbXMuXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXIoZWx0ID0+ICEoZWx0LnN0eWxlLmRpc3BsYXkgPT09ICdub25lJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsdC5nZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJykgPT09ICdkaXNhYmxlZCcpKTtcbiAgICB2YXIgbnVtVG9wVGllck1lbnVpdGVtcyA9IHRvcFRpZXJNZW51aXRlbXMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtVG9wVGllck1lbnVpdGVtczsgaSsrKSB7XG4gICAgICB2YXIgaXRoVG9wVGllck1lbnVpdGVtID0gdG9wVGllck1lbnVpdGVtc1tpXTtcbiAgICAgIHZhciBpQ2hpbGQgPSAkKGl0aFRvcFRpZXJNZW51aXRlbSkuY2hpbGRyZW4oKS5maXJzdCgpO1xuICAgICAgLy9jb25zb2xlLmxvZygnaUNoaWxkPScsIGlDaGlsZCk7XG4gICAgICBpQ2hpbGQuZmluZCgnLmZvY3VzYWJsZScpLlxuICAgICAgICBhdHRyKCdhcmlhLXNldHNpemUnLCBudW1Ub3BUaWVyTWVudWl0ZW1zLnRvU3RyaW5nKCkpLlxuICAgICAgICBhdHRyKCdhcmlhLXBvc2luc2V0JywgKGkrMSkudG9TdHJpbmcoKSk7XG4gICAgfVxuICAgIHJldHVybiB0b3BUaWVyTWVudWl0ZW1zO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlRWRpdG9ySGVpZ2h0KCkge1xuICAgIHZhciB0b29sYmFySGVpZ2h0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvcFRpZXJVbCcpLm9mZnNldEhlaWdodDtcbiAgICAvLyBnZXRzIGJ1bXBlZCB0byA2NyBvbiBpbml0aWFsIHJlc2l6ZSBwZXJ0dXJiYXRpb24sIGJ1dCBhY3R1YWwgdmFsdWUgaXMgaW5kZWVkIDQwXG4gICAgaWYgKHRvb2xiYXJIZWlnaHQgPCA4MCkgdG9vbGJhckhlaWdodCA9IDQwO1xuICAgIHRvb2xiYXJIZWlnaHQgKz0gJ3B4JztcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnUkVQTCcpLnN0eWxlLnBhZGRpbmdUb3AgPSB0b29sYmFySGVpZ2h0O1xuICAgIHZhciBkb2NNYWluID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21haW4nKTtcbiAgICB2YXIgZG9jUmVwbE1haW4gPSBkb2NNYWluLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3JlcGxNYWluJyk7XG4gICAgaWYgKGRvY1JlcGxNYWluLmxlbmd0aCAhPT0gMCkge1xuICAgICAgZG9jUmVwbE1haW5bMF0uc3R5bGUucGFkZGluZ1RvcCA9IHRvb2xiYXJIZWlnaHQ7XG4gICAgfVxuICB9XG5cbiAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCB1cGRhdGVFZGl0b3JIZWlnaHQpO1xuXG4gIGZ1bmN0aW9uIGluc2VydEFyaWFQb3Moc3VibWVudSkge1xuICAgIC8vY29uc29sZS5sb2coJ2RvaW5nIGluc2VydEFyaWFQb3MnLCBzdWJtZW51KVxuICAgIHZhciBhcnIgPSBzdWJtZW51LnRvQXJyYXkoKTtcbiAgICAvL2NvbnNvbGUubG9nKCdhcnI9JywgYXJyKTtcbiAgICB2YXIgbGVuID0gYXJyLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB2YXIgZWx0ID0gYXJyW2ldO1xuICAgICAgLy9jb25zb2xlLmxvZygnZWx0JywgaSwgJz0nLCBlbHQpO1xuICAgICAgZWx0LnNldEF0dHJpYnV0ZSgnYXJpYS1zZXRzaXplJywgbGVuLnRvU3RyaW5nKCkpO1xuICAgICAgZWx0LnNldEF0dHJpYnV0ZSgnYXJpYS1wb3NpbnNldCcsIChpKzEpLnRvU3RyaW5nKCkpO1xuICAgIH1cbiAgfVxuXG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgaGlkZUFsbFRvcE1lbnVpdGVtcygpO1xuICB9KTtcblxuICB0aGVUb29sYmFyLmNsaWNrKGZ1bmN0aW9uIChlKSB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfSk7XG5cbiAgdGhlVG9vbGJhci5rZXlkb3duKGZ1bmN0aW9uIChlKSB7XG4gICAgLy9jb25zb2xlLmxvZygndG9vbGJhciBrZXlkb3duJywgZSk7XG4gICAgLy9tb3N0IGFueSBrZXkgYXQgYWxsXG4gICAgdmFyIGtjID0gZS5rZXlDb2RlO1xuICAgIGlmIChrYyA9PT0gMjcpIHtcbiAgICAgIC8vIGVzY2FwZVxuICAgICAgaGlkZUFsbFRvcE1lbnVpdGVtcygpO1xuICAgICAgLy9jb25zb2xlLmxvZygnY2FsbGluZyBjeWNsZUZvY3VzIGZyb20gdG9vbGJhcicpXG4gICAgICBDUE8uY3ljbGVGb2N1cygpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9IGVsc2UgaWYgKGtjID09PSA5IHx8IGtjID09PSAzNyB8fCBrYyA9PT0gMzggfHwga2MgPT09IDM5IHx8IGtjID09PSA0MCkge1xuICAgICAgLy8gYW4gYXJyb3dcbiAgICAgIHZhciB0YXJnZXQgPSAkKHRoaXMpLmZpbmQoJ1t0YWJJbmRleD0tMV0nKTtcbiAgICAgIGdldFRvcFRpZXJNZW51aXRlbXMoKTtcbiAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpOyAvL25lZWRlZD9cbiAgICAgIHRhcmdldC5maXJzdCgpLmZvY3VzKCk7IC8vbmVlZGVkP1xuICAgICAgLy9jb25zb2xlLmxvZygnZG9jYWN0ZWx0PScsIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaGlkZUFsbFRvcE1lbnVpdGVtcygpO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gY2xpY2tUb3BNZW51aXRlbShlKSB7XG4gICAgaGlkZUFsbFRvcE1lbnVpdGVtcygpO1xuICAgIHZhciB0aGlzRWx0ID0gJCh0aGlzKTtcbiAgICAvL2NvbnNvbGUubG9nKCdkb2luZyBjbGlja1RvcE1lbnVpdGVtIG9uJywgdGhpc0VsdCk7XG4gICAgdmFyIHRvcFRpZXJVbCA9IHRoaXNFbHQuY2xvc2VzdCgndWxbaWQ9dG9wVGllclVsXScpO1xuICAgIGlmICh0aGlzRWx0WzBdLmhhc0F0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpc0VsdFswXS5nZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJykgPT09ICdkaXNhYmxlZCcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy92YXIgaGlkZGVuUCA9ICh0aGlzRWx0WzBdLmdldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcpID09PSAnZmFsc2UnKTtcbiAgICAvL2hpZGRlblAgYWx3YXlzIGZhbHNlP1xuICAgIHZhciB0aGlzVG9wTWVudWl0ZW0gPSB0aGlzRWx0LmNsb3Nlc3QoJ2xpLnRvcFRpZXInKTtcbiAgICAvL2NvbnNvbGUubG9nKCd0aGlzVG9wTWVudWl0ZW09JywgdGhpc1RvcE1lbnVpdGVtKTtcbiAgICB2YXIgdDEgPSB0aGlzVG9wTWVudWl0ZW1bMF07XG4gICAgdmFyIHN1Ym1lbnVPcGVuID0gKHRoaXNFbHRbMF0uZ2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJykgPT09ICd0cnVlJyk7XG4gICAgaWYgKCFzdWJtZW51T3Blbikge1xuICAgICAgLy9jb25zb2xlLmxvZygnaGlkZGVucCB0cnVlIGJyYW5jaCcpO1xuICAgICAgaGlkZUFsbFRvcE1lbnVpdGVtcygpO1xuICAgICAgdGhpc1RvcE1lbnVpdGVtLmNoaWxkcmVuKCd1bC5zdWJtZW51JykuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKS5zaG93KCk7XG4gICAgICB0aGlzVG9wTWVudWl0ZW0uY2hpbGRyZW4oKS5maXJzdCgpLmZpbmQoJ1thcmlhLWV4cGFuZGVkXScpLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdoaWRkZW5wIGZhbHNlIGJyYW5jaCcpO1xuICAgICAgdGhpc1RvcE1lbnVpdGVtLmNoaWxkcmVuKCd1bC5zdWJtZW51JykuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpLmhpZGUoKTtcbiAgICAgIHRoaXNUb3BNZW51aXRlbS5jaGlsZHJlbigpLmZpcnN0KCkuZmluZCgnW2FyaWEtZXhwYW5kZWRdJykuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgIH1cbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICB9XG5cbiAgdmFyIGV4cGFuZGFibGVFbHRzID0gJChkb2N1bWVudCkuZmluZCgnI2hlYWRlciBbYXJpYS1leHBhbmRlZF0nKTtcbiAgZXhwYW5kYWJsZUVsdHMuY2xpY2soY2xpY2tUb3BNZW51aXRlbSk7XG5cbiAgZnVuY3Rpb24gaGlkZUFsbFRvcE1lbnVpdGVtcygpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdkb2luZyBoaWRlQWxsVG9wTWVudWl0ZW1zJyk7XG4gICAgdmFyIHRvcFRpZXJVbCA9ICQoZG9jdW1lbnQpLmZpbmQoJyNoZWFkZXIgdWxbaWQ9dG9wVGllclVsXScpO1xuICAgIHRvcFRpZXJVbC5maW5kKCdbYXJpYS1leHBhbmRlZF0nKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgdG9wVGllclVsLmZpbmQoJ3VsLnN1Ym1lbnUnKS5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJykuaGlkZSgpO1xuICB9XG5cbiAgdmFyIG5vbmV4cGFuZGFibGVFbHRzID0gJChkb2N1bWVudCkuZmluZCgnI2hlYWRlciAudG9wVGllciA+IGRpdiA+IGJ1dHRvbjpub3QoW2FyaWEtZXhwYW5kZWRdKScpO1xuICBub25leHBhbmRhYmxlRWx0cy5jbGljayhoaWRlQWxsVG9wTWVudWl0ZW1zKTtcblxuICBmdW5jdGlvbiBzd2l0Y2hUb3BNZW51aXRlbShkZXN0VG9wTWVudWl0ZW0sIGRlc3RFbHQpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdkb2luZyBzd2l0Y2hUb3BNZW51aXRlbScsIGRlc3RUb3BNZW51aXRlbSwgZGVzdEVsdCk7XG4gICAgLy9jb25zb2xlLmxvZygnZHRtaWw9JywgZGVzdFRvcE1lbnVpdGVtLmxlbmd0aCk7XG4gICAgaGlkZUFsbFRvcE1lbnVpdGVtcygpO1xuICAgIGlmIChkZXN0VG9wTWVudWl0ZW0gJiYgZGVzdFRvcE1lbnVpdGVtLmxlbmd0aCAhPT0gMCkge1xuICAgICAgdmFyIGVsdCA9IGRlc3RUb3BNZW51aXRlbVswXTtcbiAgICAgIHZhciBlbHRJZCA9IGVsdC5nZXRBdHRyaWJ1dGUoJ2lkJyk7XG4gICAgICBkZXN0VG9wTWVudWl0ZW0uY2hpbGRyZW4oJ3VsLnN1Ym1lbnUnKS5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpLnNob3coKTtcbiAgICAgIGRlc3RUb3BNZW51aXRlbS5jaGlsZHJlbigpLmZpcnN0KCkuZmluZCgnW2FyaWEtZXhwYW5kZWRdJykuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgfVxuICAgIGlmIChkZXN0RWx0KSB7XG4gICAgICAvL2Rlc3RFbHQuYXR0cigndGFiSW5kZXgnLCAnMCcpLmZvY3VzKCk7XG4gICAgICBkZXN0RWx0LmZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgdmFyIHNob3dpbmdIZWxwS2V5cyA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIHNob3dIZWxwS2V5cygpIHtcbiAgICBzaG93aW5nSGVscEtleXMgPSB0cnVlO1xuICAgICQoJyNoZWxwLWtleXMnKS5mYWRlSW4oMTAwKTtcbiAgICByZWNpdGVIZWxwKCk7XG4gIH1cblxuICBmb2N1c2FibGVFbHRzLmtleWRvd24oZnVuY3Rpb24gKGUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdmb2N1c2FibGUgZWx0IGtleWRvd24nLCBlKTtcbiAgICB2YXIga2MgPSBlLmtleUNvZGU7XG4gICAgLy8kKHRoaXMpLmJsdXIoKTsgLy8gRGVsZXRlP1xuICAgIHZhciB3aXRoaW5TZWNvbmRUaWVyVWwgPSB0cnVlO1xuICAgIHZhciB0b3BUaWVyVWwgPSAkKHRoaXMpLmNsb3Nlc3QoJ3VsW2lkPXRvcFRpZXJVbF0nKTtcbiAgICB2YXIgc2Vjb25kVGllclVsID0gJCh0aGlzKS5jbG9zZXN0KCd1bC5zdWJtZW51Jyk7XG4gICAgaWYgKHNlY29uZFRpZXJVbC5sZW5ndGggPT09IDApIHtcbiAgICAgIHdpdGhpblNlY29uZFRpZXJVbCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAoa2MgPT09IDI3KSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdlc2NhcGUgcHJlc3NlZCBpJylcbiAgICAgICQoJyNoZWxwLWtleXMnKS5mYWRlT3V0KDUwMCk7XG4gICAgfVxuICAgIGlmIChrYyA9PT0gMjcgJiYgd2l0aGluU2Vjb25kVGllclVsKSB7IC8vIGVzY2FwZVxuICAgICAgdmFyIGRlc3RUb3BNZW51aXRlbSA9ICQodGhpcykuY2xvc2VzdCgnbGkudG9wVGllcicpO1xuICAgICAgdmFyIHBvc3NFbHRzID0gZGVzdFRvcE1lbnVpdGVtLmZpbmQoJy5mb2N1c2FibGU6bm90KFtkaXNhYmxlZF0pJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgc3dpdGNoVG9wTWVudWl0ZW0oZGVzdFRvcE1lbnVpdGVtLCBwb3NzRWx0cy5maXJzdCgpKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSBlbHNlIGlmIChrYyA9PT0gMzkpIHsgLy8gcmlnaHRhcnJvd1xuICAgICAgLy9jb25zb2xlLmxvZygncmlnaHRhcnJvdyBwcmVzc2VkJyk7XG4gICAgICB2YXIgc3JjVG9wTWVudWl0ZW0gPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpLnRvcFRpZXInKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ3NyY1RvcE1lbnVpdGVtPScsIHNyY1RvcE1lbnVpdGVtKTtcbiAgICAgIHNyY1RvcE1lbnVpdGVtLmNoaWxkcmVuKCkuZmlyc3QoKS5maW5kKCcuZm9jdXNhYmxlJykuYXR0cigndGFiSW5kZXgnLCAnLTEnKTtcbiAgICAgIHZhciB0b3BUaWVyTWVudWl0ZW1zID0gZ2V0VG9wVGllck1lbnVpdGVtcygpO1xuICAgICAgLy9jb25zb2xlLmxvZygndHRtaSogPScsIHRvcFRpZXJNZW51aXRlbXMpO1xuICAgICAgdmFyIHR0bWlOID0gdG9wVGllck1lbnVpdGVtcy5sZW5ndGg7XG4gICAgICB2YXIgaiA9IHRvcFRpZXJNZW51aXRlbXMuaW5kZXhPZihzcmNUb3BNZW51aXRlbVswXSk7XG4gICAgICAvL2NvbnNvbGUubG9nKCdqIGluaXRpYWw9Jywgaik7XG4gICAgICBmb3IgKHZhciBpID0gKGogKyAxKSAlIHR0bWlOOyBpICE9PSBqOyBpID0gKGkgKyAxKSAlIHR0bWlOKSB7XG4gICAgICAgIHZhciBkZXN0VG9wTWVudWl0ZW0gPSAkKHRvcFRpZXJNZW51aXRlbXNbaV0pO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdkZXN0VG9wTWVudWl0ZW0oYSk9JywgZGVzdFRvcE1lbnVpdGVtKTtcbiAgICAgICAgdmFyIHBvc3NFbHRzID0gZGVzdFRvcE1lbnVpdGVtLmZpbmQoJy5mb2N1c2FibGU6bm90KFtkaXNhYmxlZF0pJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdwb3NzRWx0cz0nLCBwb3NzRWx0cylcbiAgICAgICAgaWYgKHBvc3NFbHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKCdmaW5hbCBpPScsIGkpO1xuICAgICAgICAgIC8vY29uc29sZS5sb2coJ2xhbmRpbmcgb24nLCBwb3NzRWx0cy5maXJzdCgpKTtcbiAgICAgICAgICBzd2l0Y2hUb3BNZW51aXRlbShkZXN0VG9wTWVudWl0ZW0sIHBvc3NFbHRzLmZpcnN0KCkpO1xuICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGtjID09PSAzNykgeyAvLyBsZWZ0YXJyb3dcbiAgICAgIC8vY29uc29sZS5sb2coJ2xlZnRhcnJvdyBwcmVzc2VkJyk7XG4gICAgICB2YXIgc3JjVG9wTWVudWl0ZW0gPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpLnRvcFRpZXInKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ3NyY1RvcE1lbnVpdGVtPScsIHNyY1RvcE1lbnVpdGVtKTtcbiAgICAgIHNyY1RvcE1lbnVpdGVtLmNoaWxkcmVuKCkuZmlyc3QoKS5maW5kKCcuZm9jdXNhYmxlJykuYXR0cigndGFiSW5kZXgnLCAnLTEnKTtcbiAgICAgIHZhciB0b3BUaWVyTWVudWl0ZW1zID0gZ2V0VG9wVGllck1lbnVpdGVtcygpO1xuICAgICAgLy9jb25zb2xlLmxvZygndHRtaSogPScsIHRvcFRpZXJNZW51aXRlbXMpO1xuICAgICAgdmFyIHR0bWlOID0gdG9wVGllck1lbnVpdGVtcy5sZW5ndGg7XG4gICAgICB2YXIgaiA9IHRvcFRpZXJNZW51aXRlbXMuaW5kZXhPZihzcmNUb3BNZW51aXRlbVswXSk7XG4gICAgICAvL2NvbnNvbGUubG9nKCdqIGluaXRpYWw9Jywgaik7XG4gICAgICBmb3IgKHZhciBpID0gKGogKyB0dG1pTiAtIDEpICUgdHRtaU47IGkgIT09IGo7IGkgPSAoaSArIHR0bWlOIC0gMSkgJSB0dG1pTikge1xuICAgICAgICB2YXIgZGVzdFRvcE1lbnVpdGVtID0gJCh0b3BUaWVyTWVudWl0ZW1zW2ldKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnZGVzdFRvcE1lbnVpdGVtKGIpPScsIGRlc3RUb3BNZW51aXRlbSk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ2k9JywgaSlcbiAgICAgICAgdmFyIHBvc3NFbHRzID0gZGVzdFRvcE1lbnVpdGVtLmZpbmQoJy5mb2N1c2FibGU6bm90KFtkaXNhYmxlZF0pJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdwb3NzRWx0cz0nLCBwb3NzRWx0cylcbiAgICAgICAgaWYgKHBvc3NFbHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKCdmaW5hbCBpPScsIGkpO1xuICAgICAgICAgIC8vY29uc29sZS5sb2coJ2xhbmRpbmcgb24nLCBwb3NzRWx0cy5maXJzdCgpKTtcbiAgICAgICAgICBzd2l0Y2hUb3BNZW51aXRlbShkZXN0VG9wTWVudWl0ZW0sIHBvc3NFbHRzLmZpcnN0KCkpO1xuICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGtjID09PSAzOCkgeyAvLyB1cGFycm93XG4gICAgICAvL2NvbnNvbGUubG9nKCd1cGFycm93IHByZXNzZWQnKTtcbiAgICAgIHZhciBzdWJtZW51O1xuICAgICAgaWYgKHdpdGhpblNlY29uZFRpZXJVbCkge1xuICAgICAgICB2YXIgbmVhclNpYnMgPSAkKHRoaXMpLmNsb3Nlc3QoJ2RpdicpLmZpbmQoJy5mb2N1c2FibGUnKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ25lYXJTaWJzPScsIG5lYXJTaWJzKTtcbiAgICAgICAgdmFyIG15SWQgPSAkKHRoaXMpWzBdLmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbXlJZD0nLCBteUlkKTtcbiAgICAgICAgc3VibWVudSA9ICQoW10pO1xuICAgICAgICB2YXIgdGhpc0VuY291bnRlcmVkID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGkgPSBuZWFyU2licy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgIGlmICh0aGlzRW5jb3VudGVyZWQpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2FkZGluZycsIG5lYXJTaWJzW2ldKTtcbiAgICAgICAgICAgIHN1Ym1lbnUgPSBzdWJtZW51LmFkZCgkKG5lYXJTaWJzW2ldKSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChuZWFyU2lic1tpXS5nZXRBdHRyaWJ1dGUoJ2lkJykgPT09IG15SWQpIHtcbiAgICAgICAgICAgIHRoaXNFbmNvdW50ZXJlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3N1Ym1lbnUgc28gZmFyPScsIHN1Ym1lbnUpO1xuICAgICAgICB2YXIgZmFyU2licyA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5wcmV2QWxsKCkuZmluZCgnZGl2Om5vdCguZGlzYWJsZWQpJylcbiAgICAgICAgICAuZmluZCgnLmZvY3VzYWJsZScpLmZpbHRlcignOnZpc2libGUnKTtcbiAgICAgICAgc3VibWVudSA9IHN1Ym1lbnUuYWRkKGZhclNpYnMpO1xuICAgICAgICBpZiAoc3VibWVudS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBzdWJtZW51ID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLmNsb3Nlc3QoJ3VsJykuZmluZCgnZGl2Om5vdCguZGlzYWJsZWQpJylcbiAgICAgICAgICAuZmluZCgnLmZvY3VzYWJsZScpLmZpbHRlcignOnZpc2libGUnKS5sYXN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN1Ym1lbnUubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHN1Ym1lbnUubGFzdCgpLmZvY3VzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLypcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKCdubyBhY3Rpb25hYmxlIHN1Ym1lbnUgZm91bmQnKVxuICAgICAgICAgIHZhciB0b3BtZW51SXRlbSA9ICQodGhpcykuY2xvc2VzdCgndWwuc3VibWVudScpLmNsb3Nlc3QoJ2xpJylcbiAgICAgICAgICAuY2hpbGRyZW4oKS5maXJzdCgpLmZpbmQoJy5mb2N1c2FibGU6bm90KFtkaXNhYmxlZF0pJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgICAgIGlmICh0b3BtZW51SXRlbS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0b3BtZW51SXRlbS5maXJzdCgpLmZvY3VzKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ25vIGFjdGlvbmFibGUgdG9wbWVudWl0ZW0gZm91bmQgZWl0aGVyJylcbiAgICAgICAgICB9XG4gICAgICAgICAgKi9cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9IGVsc2UgaWYgKGtjID09PSA0MCkgeyAvLyBkb3duYXJyb3dcbiAgICAgIC8vY29uc29sZS5sb2coJ2Rvd25hcnJvdyBwcmVzc2VkJyk7XG4gICAgICB2YXIgc3VibWVudURpdnM7XG4gICAgICB2YXIgc3VibWVudTtcbiAgICAgIGlmICghd2l0aGluU2Vjb25kVGllclVsKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJzFzdCB0aWVyJylcbiAgICAgICAgc3VibWVudURpdnMgPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpJykuY2hpbGRyZW4oJ3VsJykuZmluZCgnZGl2Om5vdCguZGlzYWJsZWQpJyk7XG4gICAgICAgIHN1Ym1lbnUgPSBzdWJtZW51RGl2cy5maW5kKCcuZm9jdXNhYmxlJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgICBpbnNlcnRBcmlhUG9zKHN1Ym1lbnUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnMm5kIHRpZXInKVxuICAgICAgICB2YXIgbmVhclNpYnMgPSAkKHRoaXMpLmNsb3Nlc3QoJ2RpdicpLmZpbmQoJy5mb2N1c2FibGUnKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ25lYXJTaWJzPScsIG5lYXJTaWJzKTtcbiAgICAgICAgdmFyIG15SWQgPSAkKHRoaXMpWzBdLmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbXlJZD0nLCBteUlkKTtcbiAgICAgICAgc3VibWVudSA9ICQoW10pO1xuICAgICAgICB2YXIgdGhpc0VuY291bnRlcmVkID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmVhclNpYnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAodGhpc0VuY291bnRlcmVkKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdhZGRpbmcnLCBuZWFyU2lic1tpXSk7XG4gICAgICAgICAgICBzdWJtZW51ID0gc3VibWVudS5hZGQoJChuZWFyU2lic1tpXSkpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobmVhclNpYnNbaV0uZ2V0QXR0cmlidXRlKCdpZCcpID09PSBteUlkKSB7XG4gICAgICAgICAgICB0aGlzRW5jb3VudGVyZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvL2NvbnNvbGUubG9nKCdzdWJtZW51IHNvIGZhcj0nLCBzdWJtZW51KTtcbiAgICAgICAgdmFyIGZhclNpYnMgPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpJykubmV4dEFsbCgpLmZpbmQoJ2Rpdjpub3QoLmRpc2FibGVkKScpXG4gICAgICAgICAgLmZpbmQoJy5mb2N1c2FibGUnKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgIHN1Ym1lbnUgPSBzdWJtZW51LmFkZChmYXJTaWJzKTtcbiAgICAgICAgaWYgKHN1Ym1lbnUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgc3VibWVudSA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5jbG9zZXN0KCd1bCcpLmZpbmQoJ2Rpdjpub3QoLmRpc2FibGVkKScpXG4gICAgICAgICAgICAuZmluZCgnLmZvY3VzYWJsZScpLmZpbHRlcignOnZpc2libGUnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy9jb25zb2xlLmxvZygnc3VibWVudT0nLCBzdWJtZW51KVxuICAgICAgaWYgKHN1Ym1lbnUubGVuZ3RoID4gMCkge1xuICAgICAgICBzdWJtZW51LmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ25vIGFjdGlvbmFibGUgc3VibWVudSBmb3VuZCcpXG4gICAgICB9XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0gZWxzZSBpZiAoa2MgPT09IDI3KSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdlc2MgcHJlc3NlZCcpO1xuICAgICAgaGlkZUFsbFRvcE1lbnVpdGVtcygpO1xuICAgICAgaWYgKHNob3dpbmdIZWxwS2V5cykge1xuICAgICAgICBzaG93aW5nSGVscEtleXMgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ2NhbGxpbmcgY3ljbGVGb2N1cyBpaScpXG4gICAgICAgIENQTy5jeWNsZUZvY3VzKCk7XG4gICAgICB9XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgLy8kKHRoaXMpLmNsb3Nlc3QoJ25hdicpLmNsb3Nlc3QoJ21haW4nKS5mb2N1cygpO1xuICAgIH0gZWxzZSBpZiAoa2MgPT09IDkgKSB7XG4gICAgICBpZiAoZS5zaGlmdEtleSkge1xuICAgICAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gICAgICAgIENQTy5jeWNsZUZvY3VzKHRydWUpO1xuICAgICAgfVxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9IGVsc2UgaWYgKGtjID09PSAxMyB8fCBrYyA9PT0gMTcgfHwga2MgPT09IDIwIHx8IGtjID09PSAzMikge1xuICAgICAgLy8gMTM9ZW50ZXIgMTc9Y3RybCAyMD1jYXBzbG9jayAzMj1zcGFjZVxuICAgICAgLy9jb25zb2xlLmxvZygnc3RvcHByb3AgMScpXG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0gZWxzZSBpZiAoa2MgPj0gMTEyICYmIGtjIDw9IDEyMykge1xuICAgICAgLy9jb25zb2xlLmxvZygnZG9wcm9wIDEnKVxuICAgICAgLy8gZm4ga2V5c1xuICAgICAgLy8gZ28gYWhlYWQsIHByb3BhZ2F0ZVxuICAgIH0gZWxzZSBpZiAoZS5jdHJsS2V5ICYmIGtjID09PSAxOTEpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ0MtPyBwcmVzc2VkJylcbiAgICAgIHNob3dIZWxwS2V5cygpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9jb25zb2xlLmxvZygnc3RvcHByb3AgMicpXG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cbiAgICAvL2Uuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0pO1xuXG4gIC8vIHNoYXJlQVBJLm1ha2VIb3Zlck1lbnUoJChcIiNmaWxlbWVudVwiKSwgJChcIiNmaWxlbWVudUNvbnRlbnRzXCIpLCBmYWxzZSwgZnVuY3Rpb24oKXt9KTtcbiAgLy8gc2hhcmVBUEkubWFrZUhvdmVyTWVudSgkKFwiI2Jvbm5pZW1lbnVcIiksICQoXCIjYm9ubmllbWVudUNvbnRlbnRzXCIpLCBmYWxzZSwgZnVuY3Rpb24oKXt9KTtcblxuXG4gIHZhciBjb2RlQ29udGFpbmVyID0gJChcIjxkaXY+XCIpLmFkZENsYXNzKFwicmVwbE1haW5cIik7XG4gIGNvZGVDb250YWluZXIuYXR0cihcInJvbGVcIiwgXCJyZWdpb25cIikuXG4gICAgYXR0cihcImFyaWEtbGFiZWxcIiwgXCJEZWZpbml0aW9uc1wiKTtcbiAgICAvL2F0dHIoXCJ0YWJJbmRleFwiLCBcIi0xXCIpO1xuICAkKFwiI21haW5cIikucHJlcGVuZChjb2RlQ29udGFpbmVyKTtcblxuXG4gIGlmKHBhcmFtc1tcImdldFwiXVtcImhpZGVEZWZpbml0aW9uc1wiXSkge1xuICAgICQoXCIucmVwbE1haW5cIikuYXR0cihcImFyaWEtaGlkZGVuXCIsIHRydWUpLmF0dHIoXCJ0YWJpbmRleFwiLCAnLTEnKTtcbiAgfVxuXG4gIGlmKCEoXCJ3YXJuT25FeGl0XCIgaW4gcGFyYW1zW1wiZ2V0XCJdKSB8fCAocGFyYW1zW1wiZ2V0XCJdW1wid2Fybk9uRXhpdFwiXSAhPT0gXCJmYWxzZVwiKSkge1xuICAgICQod2luZG93KS5iaW5kKFwiYmVmb3JldW5sb2FkXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFwiQmVjYXVzZSB0aGlzIHBhZ2UgY2FuIGxvYWQgc2xvd2x5LCBhbmQgeW91IG1heSBoYXZlIG91dHN0YW5kaW5nIGNoYW5nZXMsIHdlIGFzayB0aGF0IHlvdSBjb25maXJtIGJlZm9yZSBsZWF2aW5nIHRoZSBlZGl0b3IgaW4gY2FzZSBjbG9zaW5nIHdhcyBhbiBhY2NpZGVudC5cIjtcbiAgICB9KTtcbiAgfVxuXG4gIENQTy5lZGl0b3IgPSBDUE8ubWFrZUVkaXRvcihjb2RlQ29udGFpbmVyLCB7XG4gICAgcnVuQnV0dG9uOiAkKFwiI3J1bkJ1dHRvblwiKSxcbiAgICBzaW1wbGVFZGl0b3I6IGZhbHNlLFxuICAgIHJ1bjogQ1BPLlJVTl9DT0RFLFxuICAgIGluaXRpYWxHYXM6IDEwMCxcbiAgICBzY3JvbGxQYXN0RW5kOiB0cnVlLFxuICB9KTtcbiAgQ1BPLmVkaXRvci5jbS5zZXRPcHRpb24oXCJyZWFkT25seVwiLCBcIm5vY3Vyc29yXCIpO1xuICBDUE8uZWRpdG9yLmNtLnNldE9wdGlvbihcImxvbmdMaW5lc1wiLCBuZXcgTWFwKCkpO1xuICBmdW5jdGlvbiByZW1vdmVTaG9ydGVuZWRMaW5lKGxpbmVIYW5kbGUpIHtcbiAgICB2YXIgcnVsZXJzID0gQ1BPLmVkaXRvci5jbS5nZXRPcHRpb24oXCJydWxlcnNcIik7XG4gICAgdmFyIHJ1bGVyc01pbkNvbCA9IENQTy5lZGl0b3IuY20uZ2V0T3B0aW9uKFwicnVsZXJzTWluQ29sXCIpO1xuICAgIHZhciBsb25nTGluZXMgPSBDUE8uZWRpdG9yLmNtLmdldE9wdGlvbihcImxvbmdMaW5lc1wiKTtcbiAgICBpZiAobGluZUhhbmRsZS50ZXh0Lmxlbmd0aCA8PSBydWxlcnNNaW5Db2wpIHtcbiAgICAgIGxpbmVIYW5kbGUucnVsZXJMaXN0ZW5lcnMuZm9yRWFjaCgoZiwgZXZ0KSA9PiBsaW5lSGFuZGxlLm9mZihldnQsIGYpKTtcbiAgICAgIGxvbmdMaW5lcy5kZWxldGUobGluZUhhbmRsZSk7XG4gICAgICAvLyBjb25zb2xlLmxvZyhcIlJlbW92ZWQgXCIsIGxpbmVIYW5kbGUpO1xuICAgICAgcmVmcmVzaFJ1bGVycygpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkZWxldGVMaW5lKGxpbmVIYW5kbGUpIHtcbiAgICB2YXIgbG9uZ0xpbmVzID0gQ1BPLmVkaXRvci5jbS5nZXRPcHRpb24oXCJsb25nTGluZXNcIik7XG4gICAgbGluZUhhbmRsZS5ydWxlckxpc3RlbmVycy5mb3JFYWNoKChmLCBldnQpID0+IGxpbmVIYW5kbGUub2ZmKGV2dCwgZikpO1xuICAgIGxvbmdMaW5lcy5kZWxldGUobGluZUhhbmRsZSk7XG4gICAgLy8gY29uc29sZS5sb2coXCJSZW1vdmVkIFwiLCBsaW5lSGFuZGxlKTtcbiAgICByZWZyZXNoUnVsZXJzKCk7XG4gIH1cbiAgZnVuY3Rpb24gcmVmcmVzaFJ1bGVycygpIHtcbiAgICB2YXIgcnVsZXJzID0gQ1BPLmVkaXRvci5jbS5nZXRPcHRpb24oXCJydWxlcnNcIik7XG4gICAgdmFyIGxvbmdMaW5lcyA9IENQTy5lZGl0b3IuY20uZ2V0T3B0aW9uKFwibG9uZ0xpbmVzXCIpO1xuICAgIHZhciBtaW5MZW5ndGg7XG4gICAgaWYgKGxvbmdMaW5lcy5zaXplID09PSAwKSB7XG4gICAgICBtaW5MZW5ndGggPSAwOyAvLyBpZiB0aGVyZSBhcmUgbm8gbG9uZyBsaW5lcywgdGhlbiB3ZSBkb24ndCBjYXJlIGFib3V0IHNob3dpbmcgYW55IHJ1bGVyc1xuICAgIH0gZWxzZSB7XG4gICAgICBtaW5MZW5ndGggPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgICAgbG9uZ0xpbmVzLmZvckVhY2goZnVuY3Rpb24obGluZU5vLCBsaW5lSGFuZGxlKSB7XG4gICAgICAgIGlmIChsaW5lSGFuZGxlLnRleHQubGVuZ3RoIDwgbWluTGVuZ3RoKSB7IG1pbkxlbmd0aCA9IGxpbmVIYW5kbGUudGV4dC5sZW5ndGg7IH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJ1bGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHJ1bGVyc1tpXS5jb2x1bW4gPj0gbWluTGVuZ3RoKSB7XG4gICAgICAgIHJ1bGVyc1tpXS5jbGFzc05hbWUgPSBcImhpZGRlblwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcnVsZXJzW2ldLmNsYXNzTmFtZSA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gZ290dGEgc2V0IHRoZSBvcHRpb24gdHdpY2UsIG9yIGVsc2UgQ00gc2hvcnQtY2lyY3VpdHMgYW5kIGlnbm9yZXMgaXRcbiAgICBDUE8uZWRpdG9yLmNtLnNldE9wdGlvbihcInJ1bGVyc1wiLCB1bmRlZmluZWQpO1xuICAgIENQTy5lZGl0b3IuY20uc2V0T3B0aW9uKFwicnVsZXJzXCIsIHJ1bGVycyk7XG4gIH1cbiAgQ1BPLmVkaXRvci5jbS5vbignY2hhbmdlcycsIGZ1bmN0aW9uKGluc3RhbmNlLCBjaGFuZ2VPYmpzKSB7XG4gICAgdmFyIG1pbkxpbmUgPSBpbnN0YW5jZS5sYXN0TGluZSgpLCBtYXhMaW5lID0gMDtcbiAgICB2YXIgcnVsZXJzTWluQ29sID0gaW5zdGFuY2UuZ2V0T3B0aW9uKFwicnVsZXJzTWluQ29sXCIpO1xuICAgIHZhciBsb25nTGluZXMgPSBpbnN0YW5jZS5nZXRPcHRpb24oXCJsb25nTGluZXNcIik7XG4gICAgY2hhbmdlT2Jqcy5mb3JFYWNoKGZ1bmN0aW9uKGNoYW5nZSkge1xuICAgICAgaWYgKG1pbkxpbmUgPiBjaGFuZ2UuZnJvbS5saW5lKSB7IG1pbkxpbmUgPSBjaGFuZ2UuZnJvbS5saW5lOyB9XG4gICAgICBpZiAobWF4TGluZSA8IGNoYW5nZS5mcm9tLmxpbmUgKyBjaGFuZ2UudGV4dC5sZW5ndGgpIHsgbWF4TGluZSA9IGNoYW5nZS5mcm9tLmxpbmUgKyBjaGFuZ2UudGV4dC5sZW5ndGg7IH1cbiAgICB9KTtcbiAgICB2YXIgY2hhbmdlZCA9IGZhbHNlO1xuICAgIGluc3RhbmNlLmVhY2hMaW5lKG1pbkxpbmUsIG1heExpbmUsIGZ1bmN0aW9uKGxpbmVIYW5kbGUpIHtcbiAgICAgIGlmIChsaW5lSGFuZGxlLnRleHQubGVuZ3RoID4gcnVsZXJzTWluQ29sKSB7XG4gICAgICAgIGlmICghbG9uZ0xpbmVzLmhhcyhsaW5lSGFuZGxlKSkge1xuICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgIGxvbmdMaW5lcy5zZXQobGluZUhhbmRsZSwgbGluZUhhbmRsZS5saW5lTm8oKSk7XG4gICAgICAgICAgbGluZUhhbmRsZS5ydWxlckxpc3RlbmVycyA9IG5ldyBNYXAoW1xuICAgICAgICAgICAgW1wiY2hhbmdlXCIsIHJlbW92ZVNob3J0ZW5lZExpbmVdLFxuICAgICAgICAgICAgW1wiZGVsZXRlXCIsIGZ1bmN0aW9uKCkgeyAvLyBuZWVkZWQgYmVjYXVzZSB0aGUgZGVsZXRlIGhhbmRsZXIgZ2V0cyBubyBhcmd1bWVudHMgYXQgYWxsXG4gICAgICAgICAgICAgIGRlbGV0ZUxpbmUobGluZUhhbmRsZSk7XG4gICAgICAgICAgICB9XVxuICAgICAgICAgIF0pO1xuICAgICAgICAgIGxpbmVIYW5kbGUucnVsZXJMaXN0ZW5lcnMuZm9yRWFjaCgoZiwgZXZ0KSA9PiBsaW5lSGFuZGxlLm9uKGV2dCwgZikpO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQWRkZWQgXCIsIGxpbmVIYW5kbGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobG9uZ0xpbmVzLmhhcyhsaW5lSGFuZGxlKSkge1xuICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgIGxvbmdMaW5lcy5kZWxldGUobGluZUhhbmRsZSk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coXCJSZW1vdmVkIFwiLCBsaW5lSGFuZGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICByZWZyZXNoUnVsZXJzKCk7XG4gICAgfVxuICB9KTtcblxuICBwcm9ncmFtTG9hZGVkLnRoZW4oZnVuY3Rpb24oYykge1xuICAgIENQTy5kb2N1bWVudHMuc2V0KFwiZGVmaW5pdGlvbnM6Ly9cIiwgQ1BPLmVkaXRvci5jbS5nZXREb2MoKSk7XG4gICAgaWYoYyA9PT0gXCJcIikge1xuICAgICAgYyA9IENPTlRFWFRfRk9SX05FV19GSUxFUztcbiAgICB9XG5cbiAgICBpZiAoYy5zdGFydHNXaXRoKFwiPHNjcmlwdHNvbmx5XCIpKSB7XG4gICAgICAvLyB0aGlzIGlzIGJsb2NrcyBmaWxlLiBPcGVuIGl0IHdpdGggL2Jsb2Nrc1xuICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKCdlZGl0b3InLCAnYmxvY2tzJyk7XG4gICAgfVxuXG4gICAgaWYoIXBhcmFtc1tcImdldFwiXVtcImNvbnRyb2xsZWRcIl0pIHtcbiAgICAgIC8vIE5PVEUoam9lKTogQ2xlYXJpbmcgaGlzdG9yeSB0byBhZGRyZXNzIGh0dHBzOi8vZ2l0aHViLmNvbS9icm93bnBsdC9weXJldC1sYW5nL2lzc3Vlcy8zODYsXG4gICAgICAvLyBpbiB3aGljaCB1bmRvIGNhbiByZXZlcnQgdGhlIHByb2dyYW0gYmFjayB0byBlbXB0eVxuICAgICAgQ1BPLmVkaXRvci5jbS5zZXRWYWx1ZShjKTtcbiAgICAgIENQTy5lZGl0b3IuY20uY2xlYXJIaXN0b3J5KCk7XG4gICAgfVxuXG4gIH0pO1xuXG4gIHByb2dyYW1Mb2FkZWQuZmFpbChmdW5jdGlvbigpIHtcbiAgICBDUE8uZG9jdW1lbnRzLnNldChcImRlZmluaXRpb25zOi8vXCIsIENQTy5lZGl0b3IuY20uZ2V0RG9jKCkpO1xuICB9KTtcblxuICBjb25zb2xlLmxvZyhcIkFib3V0IHRvIGxvYWQgUHlyZXQ6IFwiLCBvcmlnaW5hbFBhZ2VMb2FkLCBEYXRlLm5vdygpKTtcblxuICB2YXIgcHlyZXRMb2FkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gIGNvbnNvbGUubG9nKHdpbmRvdy5QWVJFVCk7XG4gIHB5cmV0TG9hZC5zcmMgPSB3aW5kb3cuUFlSRVQ7XG4gIHB5cmV0TG9hZC50eXBlID0gXCJ0ZXh0L2phdmFzY3JpcHRcIjtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChweXJldExvYWQpO1xuXG4gIHZhciBweXJldExvYWQyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cbiAgZnVuY3Rpb24gbG9nRmFpbHVyZUFuZE1hbnVhbEZldGNoKHVybCwgZSkge1xuXG4gICAgLy8gTk9URShqb2UpOiBUaGUgZXJyb3IgcmVwb3J0ZWQgYnkgdGhlIFwiZXJyb3JcIiBldmVudCBoYXMgZXNzZW50aWFsbHkgbm9cbiAgICAvLyBpbmZvcm1hdGlvbiBvbiBpdDsgaXQncyBqdXN0IGEgbm90aWZpY2F0aW9uIHRoYXQgX3NvbWV0aGluZ18gd2VudCB3cm9uZy5cbiAgICAvLyBTbywgd2UgbG9nIHRoYXQgc29tZXRoaW5nIGhhcHBlbmVkLCB0aGVuIGltbWVkaWF0ZWx5IGRvIGFuIEFKQVggcmVxdWVzdFxuICAgIC8vIGNhbGwgZm9yIHRoZSBzYW1lIFVSTCwgdG8gc2VlIGlmIHdlIGNhbiBnZXQgbW9yZSBpbmZvcm1hdGlvbi4gVGhpc1xuICAgIC8vIGRvZXNuJ3QgcGVyZmVjdGx5IHRlbGwgdXMgYWJvdXQgdGhlIG9yaWdpbmFsIGZhaWx1cmUsIGJ1dCBpdCdzXG4gICAgLy8gc29tZXRoaW5nLlxuXG4gICAgLy8gSW4gYWRkaXRpb24sIGlmIHNvbWVvbmUgaXMgc2VlaW5nIHRoZSBQeXJldCBmYWlsZWQgdG8gbG9hZCBlcnJvciwgYnV0IHdlXG4gICAgLy8gZG9uJ3QgZ2V0IHRoZXNlIGxvZ2dpbmcgZXZlbnRzLCB3ZSBoYXZlIGEgc3Ryb25nIGhpbnQgdGhhdCBzb21ldGhpbmcgaXNcbiAgICAvLyB1cCB3aXRoIHRoZWlyIG5ldHdvcmsuXG4gICAgbG9nZ2VyLmxvZygncHlyZXQtbG9hZC1mYWlsdXJlJyxcbiAgICAgIHtcbiAgICAgICAgZXZlbnQgOiAnaW5pdGlhbC1mYWlsdXJlJyxcbiAgICAgICAgdXJsIDogdXJsLFxuXG4gICAgICAgIC8vIFRoZSB0aW1lc3RhbXAgYXBwZWFycyB0byBjb3VudCBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgcGFnZSBsb2FkLFxuICAgICAgICAvLyB3aGljaCBtYXkgYXBwcm94aW1hdGUgZG93bmxvYWQgdGltZSBpZiwgc2F5LCByZXF1ZXN0cyBhcmUgdGltaW5nIG91dFxuICAgICAgICAvLyBvciBnZXR0aW5nIGN1dCBvZmYuXG5cbiAgICAgICAgdGltZVN0YW1wIDogZS50aW1lU3RhbXBcbiAgICAgIH0pO1xuXG4gICAgdmFyIG1hbnVhbEZldGNoID0gJC5hamF4KHVybCk7XG4gICAgbWFudWFsRmV0Y2gudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgIC8vIEhlcmUsIHdlIGxvZyB0aGUgZmlyc3QgMTAwIGNoYXJhY3RlcnMgb2YgdGhlIHJlc3BvbnNlIHRvIG1ha2Ugc3VyZVxuICAgICAgLy8gdGhleSByZXNlbWJsZSB0aGUgUHlyZXQgYmxvYlxuICAgICAgbG9nZ2VyLmxvZygncHlyZXQtbG9hZC1mYWlsdXJlJywge1xuICAgICAgICBldmVudCA6ICdzdWNjZXNzLXdpdGgtYWpheCcsXG4gICAgICAgIGNvbnRlbnRzUHJlZml4IDogcmVzLnNsaWNlKDAsIDEwMClcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIG1hbnVhbEZldGNoLmZhaWwoZnVuY3Rpb24ocmVzKSB7XG4gICAgICBsb2dnZXIubG9nKCdweXJldC1sb2FkLWZhaWx1cmUnLCB7XG4gICAgICAgIGV2ZW50IDogJ2ZhaWx1cmUtd2l0aC1hamF4JyxcbiAgICAgICAgc3RhdHVzOiByZXMuc3RhdHVzLFxuICAgICAgICBzdGF0dXNUZXh0OiByZXMuc3RhdHVzVGV4dCxcbiAgICAgICAgLy8gU2luY2UgcmVzcG9uc2VUZXh0IGNvdWxkIGJlIGEgbG9uZyBlcnJvciBwYWdlLCBhbmQgd2UgZG9uJ3Qgd2FudCB0b1xuICAgICAgICAvLyBsb2cgaHVnZSBwYWdlcywgd2Ugc2xpY2UgaXQgdG8gMTAwIGNoYXJhY3RlcnMsIHdoaWNoIGlzIGVub3VnaCB0b1xuICAgICAgICAvLyB0ZWxsIHVzIHdoYXQncyBnb2luZyBvbiAoZS5nLiBBV1MgZmFpbHVyZSwgbmV0d29yayBvdXRhZ2UpLlxuICAgICAgICByZXNwb25zZVRleHQ6IHJlcy5yZXNwb25zZVRleHQuc2xpY2UoMCwgMTAwKVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAkKHB5cmV0TG9hZCkub24oXCJlcnJvclwiLCBmdW5jdGlvbihlKSB7XG4gICAgbG9nRmFpbHVyZUFuZE1hbnVhbEZldGNoKHByb2Nlc3MuZW52LlBZUkVULCBlKTtcbiAgICBjb25zb2xlLmxvZyhwcm9jZXNzLmVudik7XG4gICAgcHlyZXRMb2FkMi5zcmMgPSBwcm9jZXNzLmVudi5QWVJFVF9CQUNLVVA7XG4gICAgcHlyZXRMb2FkMi50eXBlID0gXCJ0ZXh0L2phdmFzY3JpcHRcIjtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHB5cmV0TG9hZDIpO1xuICB9KTtcblxuICAkKHB5cmV0TG9hZDIpLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZSkge1xuICAgICQoXCIjbG9hZGVyXCIpLmhpZGUoKTtcbiAgICAkKFwiI3J1blBhcnRcIikuaGlkZSgpO1xuICAgICQoXCIjYnJlYWtCdXR0b25cIikuaGlkZSgpO1xuICAgIHdpbmRvdy5zdGlja0Vycm9yKFwiUHlyZXQgZmFpbGVkIHRvIGxvYWQ7IGNoZWNrIHlvdXIgY29ubmVjdGlvbiBvciB0cnkgcmVmcmVzaGluZyB0aGUgcGFnZS4gIElmIHRoaXMgaGFwcGVucyByZXBlYXRlZGx5LCBwbGVhc2UgcmVwb3J0IGl0IGFzIGEgYnVnLlwiKTtcbiAgICBsb2dGYWlsdXJlQW5kTWFudWFsRmV0Y2gocHJvY2Vzcy5lbnYuUFlSRVRfQkFDS1VQLCBlKTtcblxuICB9KTtcblxuICBjb25zdCBvblJ1bkhhbmRsZXJzID0gW107XG4gIGZ1bmN0aW9uIG9uUnVuKGhhbmRsZXIpIHtcbiAgICBvblJ1bkhhbmRsZXJzLnB1c2goaGFuZGxlcik7XG4gIH1cbiAgZnVuY3Rpb24gdHJpZ2dlck9uUnVuKCkge1xuICAgIG9uUnVuSGFuZGxlcnMuZm9yRWFjaChoID0+IGgoKSk7XG4gIH1cblxuICBjb25zdCBvbkludGVyYWN0aW9uSGFuZGxlcnMgPSBbXTtcbiAgZnVuY3Rpb24gb25JbnRlcmFjdGlvbihoYW5kbGVyKSB7XG4gICAgb25JbnRlcmFjdGlvbkhhbmRsZXJzLnB1c2goaGFuZGxlcik7XG4gIH1cbiAgZnVuY3Rpb24gdHJpZ2dlck9uSW50ZXJhY3Rpb24oaW50ZXJhY3Rpb24pIHtcbiAgICBvbkludGVyYWN0aW9uSGFuZGxlcnMuZm9yRWFjaChoID0+IGgoaW50ZXJhY3Rpb24pKTtcbiAgfVxuXG4gIGNvbnN0IG9uTG9hZEhhbmRsZXJzID0gW107XG4gIGZ1bmN0aW9uIG9uTG9hZChoYW5kbGVyKSB7XG4gICAgb25Mb2FkSGFuZGxlcnMucHVzaChoYW5kbGVyKTtcbiAgfVxuICBmdW5jdGlvbiB0cmlnZ2VyT25Mb2FkKCkge1xuICAgIG9uTG9hZEhhbmRsZXJzLmZvckVhY2goaCA9PiBoKCkpO1xuICB9XG5cbiAgcHJvZ3JhbUxvYWRlZC5maW4oZnVuY3Rpb24oKSB7XG4gICAgQ1BPLmVkaXRvci5mb2N1cygpO1xuICAgIENQTy5lZGl0b3IuY20uc2V0T3B0aW9uKFwicmVhZE9ubHlcIiwgZmFsc2UpO1xuICB9KTtcblxuICBDUE8uYXV0b1NhdmUgPSBhdXRvU2F2ZTtcbiAgQ1BPLnNhdmUgPSBzYXZlO1xuICBDUE8udXBkYXRlTmFtZSA9IHVwZGF0ZU5hbWU7XG4gIENQTy5zaG93U2hhcmVDb250YWluZXIgPSBzaG93U2hhcmVDb250YWluZXI7XG4gIENQTy5sb2FkUHJvZ3JhbSA9IGxvYWRQcm9ncmFtO1xuICBDUE8uc3RvcmFnZUFQSSA9IHN0b3JhZ2VBUEk7XG4gIENQTy5jeWNsZUZvY3VzID0gY3ljbGVGb2N1cztcbiAgQ1BPLnNheSA9IHNheTtcbiAgQ1BPLnNheUFuZEZvcmdldCA9IHNheUFuZEZvcmdldDtcbiAgQ1BPLm9uUnVuID0gb25SdW47XG4gIENQTy5vbkxvYWQgPSBvbkxvYWQ7XG4gIENQTy50cmlnZ2VyT25SdW4gPSB0cmlnZ2VyT25SdW47XG4gIENQTy5vbkludGVyYWN0aW9uID0gb25JbnRlcmFjdGlvbjtcbiAgQ1BPLnRyaWdnZXJPbkludGVyYWN0aW9uID0gdHJpZ2dlck9uSW50ZXJhY3Rpb247XG4gIENQTy50cmlnZ2VyT25Mb2FkID0gdHJpZ2dlck9uTG9hZDtcblxuICBpZihsb2NhbFNldHRpbmdzLmdldEl0ZW0oXCJzYXdTdW1tZXIyMDIxTWVzc2FnZVwiKSAhPT0gXCJzYXctc3VtbWVyLTIwMjEtbWVzc2FnZVwiKSB7XG4gICAgY29uc3QgbWVzc2FnZSA9ICQoXCI8c3Bhbj5cIik7XG4gICAgY29uc3Qgbm90ZXMgPSAkKFwiPGEgdGFyZ2V0PSdfYmxhbmsnIHN0eWxlPSdjb2xvcjogd2hpdGUnPlwiKS5hdHRyKFwiaHJlZlwiLCBcImh0dHBzOi8vd3d3LnB5cmV0Lm9yZy9yZWxlYXNlLW5vdGVzL3N1bW1lci0yMDIxLmh0bWxcIikudGV4dChcInJlbGVhc2Ugbm90ZXNcIik7XG4gICAgbWVzc2FnZS5hcHBlbmQoXCJUaGluZ3MgbWF5IGxvb2sgYSBsaXR0bGUgZGlmZmVyZW50ISBDaGVjayBvdXQgdGhlIFwiLCBub3RlcywgXCIgZm9yIG1vcmUgZGV0YWlscy5cIik7XG4gICAgd2luZG93LnN0aWNrUmljaE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgbG9jYWxTZXR0aW5ncy5zZXRJdGVtKFwic2F3U3VtbWVyMjAyMU1lc3NhZ2VcIiwgXCJzYXctc3VtbWVyLTIwMjEtbWVzc2FnZVwiKTtcbiAgfVxuXG4gIGxldCBpbml0aWFsU3RhdGUgPSBwYXJhbXNbXCJnZXRcIl1bXCJpbml0aWFsU3RhdGVcIl07XG5cbiAgaWYgKHR5cGVvZiBhY3F1aXJlVnNDb2RlQXBpID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBtYWtlRXZlbnRzKHtcbiAgICAgIENQTzogQ1BPLFxuICAgICAgc2VuZFBvcnQ6IGFjcXVpcmVWc0NvZGVBcGkoKSxcbiAgICAgIHJlY2VpdmVQb3J0OiB3aW5kb3csXG4gICAgICBpbml0aWFsU3RhdGVcbiAgICB9KTtcbiAgfVxuICBlbHNlIGlmKCh3aW5kb3cucGFyZW50ICYmICh3aW5kb3cucGFyZW50ICE9PSB3aW5kb3cpKSB8fCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJkZXZlbG9wbWVudFwiKSB7XG4gICAgbWFrZUV2ZW50cyh7IENQTzogQ1BPLCBzZW5kUG9ydDogd2luZG93LnBhcmVudCwgcmVjZWl2ZVBvcnQ6IHdpbmRvdywgaW5pdGlhbFN0YXRlIH0pO1xuICB9XG59KTtcbiJdLCJuYW1lcyI6WyJkZWZpbmUiLCJRIiwiYXV0b0hpZ2hsaWdodEJveCIsInRleHQiLCJ0ZXh0Qm94IiwiJCIsImFkZENsYXNzIiwiYXR0ciIsIm9uIiwic2VsZWN0IiwidmFsIiwicHJvbXB0UXVldWUiLCJzdHlsZXMiLCJ3aW5kb3ciLCJtb2RhbHMiLCJQcm9tcHQiLCJvcHRpb25zIiwicHVzaCIsImluZGV4T2YiLCJzdHlsZSIsImxlbmd0aCIsIkVycm9yIiwibW9kYWwiLCJlbHRzIiwicGFyc2VIVE1MIiwidGl0bGUiLCJtb2RhbENvbnRlbnQiLCJjbG9zZUJ1dHRvbiIsInN1Ym1pdEJ1dHRvbiIsInN1Ym1pdFRleHQiLCJjYW5jZWxUZXh0IiwidG9nZ2xlQ2xhc3MiLCJuYXJyb3ciLCJpc0NvbXBpbGVkIiwiZGVmZXJyZWQiLCJkZWZlciIsInByb21pc2UiLCJwcm90b3R5cGUiLCJzaG93IiwiY2FsbGJhY2siLCJoaWRlU3VibWl0IiwiaGlkZSIsImNsaWNrIiwib25DbG9zZSIsImJpbmQiLCJrZXlwcmVzcyIsImUiLCJ3aGljaCIsIm9uU3VibWl0IiwiZG9jQ2xpY2siLCJ0YXJnZXQiLCJpcyIsImRvY3VtZW50Iiwib2ZmIiwiZG9jS2V5ZG93biIsImtleSIsImtleWRvd24iLCJwb3B1bGF0ZU1vZGFsIiwiY3NzIiwiZm9jdXMiLCJ0aGVuIiwiY2xlYXJNb2RhbCIsImVtcHR5IiwiY3JlYXRlUmFkaW9FbHQiLCJvcHRpb24iLCJpZHgiLCJlbHQiLCJpZCIsInRvU3RyaW5nIiwibGFiZWwiLCJ2YWx1ZSIsIm1lc3NhZ2UiLCJlbHRDb250YWluZXIiLCJhcHBlbmQiLCJsYWJlbENvbnRhaW5lciIsImNvbnRhaW5lciIsImV4YW1wbGUiLCJjbSIsIkNvZGVNaXJyb3IiLCJtb2RlIiwibGluZU51bWJlcnMiLCJyZWFkT25seSIsInNldFRpbWVvdXQiLCJyZWZyZXNoIiwiZXhhbXBsZUNvbnRhaW5lciIsImNyZWF0ZVRpbGVFbHQiLCJkZXRhaWxzIiwiZXZ0IiwiY3JlYXRlVGV4dEVsdCIsImlucHV0IiwiZGVmYXVsdFZhbHVlIiwiZHJhd0VsZW1lbnQiLCJjcmVhdGVDb3B5VGV4dEVsdCIsImJveCIsImNyZWF0ZUNvbmZpcm1FbHQiLCJ0aGF0IiwiY3JlYXRlRWx0IiwiaSIsIm9wdGlvbkVsdHMiLCJtYXAiLCJyZXNvbHZlIiwicmV0dmFsIiwib3JpZ2luYWxQYWdlTG9hZCIsIkRhdGUiLCJub3ciLCJjb25zb2xlIiwibG9nIiwic2hhcmVBUEkiLCJtYWtlU2hhcmVBUEkiLCJwcm9jZXNzIiwiZW52IiwiQ1VSUkVOVF9QWVJFVF9SRUxFQVNFIiwidXJsIiwicmVxdWlyZSIsIm1vZGFsUHJvbXB0IiwiTE9HIiwiY3RfbG9nIiwiYXBwbHkiLCJhcmd1bWVudHMiLCJjdF9lcnJvciIsImVycm9yIiwiaW5pdGlhbFBhcmFtcyIsInBhcnNlIiwibG9jYXRpb24iLCJocmVmIiwicGFyYW1zIiwiaGlnaGxpZ2h0TW9kZSIsImNsZWFyRmxhc2giLCJ3aGl0ZVRvQmxhY2tOb3RpZmljYXRpb24iLCJzdGlja0Vycm9yIiwibW9yZSIsIkNQTyIsInNheUFuZEZvcmdldCIsImVyciIsInRvb2x0aXAiLCJwcmVwZW5kIiwiZmxhc2hFcnJvciIsImZhZGVPdXQiLCJmbGFzaE1lc3NhZ2UiLCJtc2ciLCJzdGlja01lc3NhZ2UiLCJzdGlja1JpY2hNZXNzYWdlIiwiY29udGVudCIsIm1rV2FybmluZ1VwcGVyIiwibWtXYXJuaW5nTG93ZXIiLCJEb2N1bWVudHMiLCJkb2N1bWVudHMiLCJNYXAiLCJoYXMiLCJuYW1lIiwiZ2V0Iiwic2V0IiwiZG9jIiwibG9nZ2VyIiwiaXNEZXRhaWxlZCIsImdldFZhbHVlIiwiZm9yRWFjaCIsImYiLCJWRVJTSU9OX0NIRUNLX0lOVEVSVkFMIiwiTWF0aCIsInJhbmRvbSIsImNoZWNrVmVyc2lvbiIsInJlc3AiLCJKU09OIiwidmVyc2lvbiIsInNldEludGVydmFsIiwic2F2ZSIsImF1dG9TYXZlIiwiQ09OVEVYVF9GT1JfTkVXX0ZJTEVTIiwiQ09OVEVYVF9QUkVGSVgiLCJtZXJnZSIsIm9iaiIsImV4dGVuc2lvbiIsIm5ld29iaiIsIk9iamVjdCIsImtleXMiLCJrIiwiYW5pbWF0aW9uRGl2IiwiY2xvc2VBbmltYXRpb25JZk9wZW4iLCJkaWFsb2ciLCJtYWtlRWRpdG9yIiwiaW5pdGlhbCIsImhhc093blByb3BlcnR5IiwidGV4dGFyZWEiLCJqUXVlcnkiLCJydW5GdW4iLCJjb2RlIiwicmVwbE9wdGlvbnMiLCJydW4iLCJDTSIsInVzZUxpbmVOdW1iZXJzIiwic2ltcGxlRWRpdG9yIiwidXNlRm9sZGluZyIsImd1dHRlcnMiLCJyZWluZGVudEFsbExpbmVzIiwibGFzdCIsImxpbmVDb3VudCIsIm9wZXJhdGlvbiIsImluZGVudExpbmUiLCJDT0RFX0xJTkVfV0lEVEgiLCJydWxlcnMiLCJydWxlcnNNaW5Db2wiLCJjb2xvciIsImNvbHVtbiIsImxpbmVTdHlsZSIsImNsYXNzTmFtZSIsIm1hYyIsImtleU1hcCIsIm1hY0RlZmF1bHQiLCJtb2RpZmllciIsImNtT3B0aW9ucyIsImV4dHJhS2V5cyIsIm5vcm1hbGl6ZUtleU1hcCIsIl9kZWZpbmVQcm9wZXJ0eSIsIlNoaWZ0RW50ZXIiLCJTaGlmdEN0cmxFbnRlciIsImNvbmNhdCIsImluZGVudFVuaXQiLCJ0YWJTaXplIiwidmlld3BvcnRNYXJnaW4iLCJJbmZpbml0eSIsIm1hdGNoS2V5d29yZHMiLCJtYXRjaEJyYWNrZXRzIiwic3R5bGVTZWxlY3RlZFRleHQiLCJmb2xkR3V0dGVyIiwibGluZVdyYXBwaW5nIiwibG9nZ2luZyIsInNjcm9sbFBhc3RFbmQiLCJmcm9tVGV4dEFyZWEiLCJmaXJzdExpbmVJc05hbWVzcGFjZSIsImZpcnN0bGluZSIsImdldExpbmUiLCJtYXRjaCIsIm5hbWVzcGFjZW1hcmsiLCJzZXRDb250ZXh0TGluZSIsIm5ld0NvbnRleHRMaW5lIiwiaGFzTmFtZXNwYWNlIiwiY2xlYXIiLCJyZXBsYWNlUmFuZ2UiLCJsaW5lIiwiY2giLCJndXR0ZXJRdWVzdGlvbldyYXBwZXIiLCJjcmVhdGVFbGVtZW50IiwiZ3V0dGVyVG9vbHRpcCIsImlubmVyVGV4dCIsImd1dHRlclF1ZXN0aW9uIiwic3JjIiwiYXBwZW5kQ2hpbGQiLCJzZXRHdXR0ZXJNYXJrZXIiLCJnZXRXcmFwcGVyRWxlbWVudCIsIm9ubW91c2VsZWF2ZSIsImNsZWFyR3V0dGVyIiwib25tb3VzZW1vdmUiLCJsaW5lQ2giLCJjb29yZHNDaGFyIiwibGVmdCIsImNsaWVudFgiLCJ0b3AiLCJjbGllbnRZIiwibWFya2VycyIsImZpbmRNYXJrc0F0IiwiY2hhbmdlIiwiZG9lc05vdENoYW5nZUZpcnN0TGluZSIsImMiLCJmcm9tIiwiY3VyT3AiLCJjaGFuZ2VPYmpzIiwiZXZlcnkiLCJtYXJrVGV4dCIsImF0dHJpYnV0ZXMiLCJ1c2VsaW5lIiwiYXRvbWljIiwiaW5jbHVzaXZlTGVmdCIsImluY2x1c2l2ZVJpZ2h0IiwiZGlzcGxheSIsIndyYXBwZXIiLCJnZXRUb3BUaWVyTWVudWl0ZW1zIiwiZm9jdXNDYXJvdXNlbCIsIlJVTl9DT0RFIiwic2V0VXNlcm5hbWUiLCJnd3JhcCIsImxvYWQiLCJhcGkiLCJwZW9wbGUiLCJ1c2VySWQiLCJ1c2VyIiwiZGlzcGxheU5hbWUiLCJlbWFpbHMiLCJzdG9yYWdlQVBJIiwiY29sbGVjdGlvbiIsImZhaWwiLCJyZWF1dGgiLCJjcmVhdGVQcm9ncmFtQ29sbGVjdGlvbkFQSSIsImFjdGl2ZUVsZW1lbnQiLCJibHVyIiwidG9Mb2FkIiwiZ2V0RmlsZUJ5SWQiLCJsb2FkUHJvZ3JhbSIsInByb2dyYW1Ub1NhdmUiLCJmY2FsbCIsImluaXRpYWxQcm9ncmFtIiwicHJvZ3JhbUxvYWQiLCJlbmFibGVGaWxlT3B0aW9ucyIsInAiLCJzaG93U2hhcmVDb250YWluZXIiLCJnZXRTaGFyZWRGaWxlQnlJZCIsImZpbGUiLCJnZXRPcmlnaW5hbCIsInJlc3BvbnNlIiwib3JpZ2luYWwiLCJyZXN1bHQiLCJyZW1vdmVDbGFzcyIsIm9wZW4iLCJBUFBfQkFTRV9VUkwiLCJzZXRUaXRsZSIsInByb2dOYW1lIiwiZmlsZW5hbWUiLCJkb3dubG9hZEVsdCIsImNvbnRlbnRzIiwiZWRpdG9yIiwiZG93bmxvYWRCbG9iIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwiQmxvYiIsInR5cGUiLCJkb3dubG9hZCIsInNob3dNb2RhbCIsImN1cnJlbnRDb250ZXh0IiwiZWxlbWVudCIsImdyZWV0aW5nIiwic2hhcmVkIiwiY3VycmVudENvbnRleHRFbHQiLCJlc3NlbnRpYWxzIiwibGlzdCIsInVzZUNvbnRleHQiLCJpbnB1dFdyYXBwZXIiLCJlbnRyeSIsIm5hbWVzcGFjZVJlc3VsdCIsInRyaW0iLCJmaXJzdExpbmUiLCJjb250ZXh0TGVuIiwic2xpY2UiLCJUUlVOQ0FURV9MRU5HVEgiLCJ0cnVuY2F0ZU5hbWUiLCJ1cGRhdGVOYW1lIiwiZ2V0TmFtZSIsInByb2ciLCJnZXRDb250ZW50cyIsInNheSIsImZvcmdldCIsImFubm91bmNlbWVudHMiLCJnZXRFbGVtZW50QnlJZCIsImxpIiwiY3JlYXRlVGV4dE5vZGUiLCJpbnNlcnRCZWZvcmUiLCJmaXJzdENoaWxkIiwicmVtb3ZlQ2hpbGQiLCJjeWNsZUFkdmFuY2UiLCJjdXJySW5kZXgiLCJtYXhJbmRleCIsInJldmVyc2VQIiwibmV4dEluZGV4IiwicG9wdWxhdGVGb2N1c0Nhcm91c2VsIiwiZmMiLCJkb2NtYWluIiwidG9vbGJhciIsImRvY3JlcGxNYWluIiwiZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSIsImRvY3JlcGxNYWluMCIsInVuZGVmaW5lZCIsImRvY3JlcGwiLCJkb2NyZXBsY29kZSIsImN5Y2xlRm9jdXMiLCJmQ2Fyb3VzZWwiLCJjdXJyZW50Rm9jdXNlZEVsdCIsImZpbmQiLCJub2RlIiwiY29udGFpbnMiLCJjdXJyZW50Rm9jdXNJbmRleCIsIm5leHRGb2N1c0luZGV4IiwiZm9jdXNFbHQiLCJmb2N1c0VsdDAiLCJjbGFzc0xpc3QiLCJ0ZXh0YXJlYXMiLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsInJlbW92ZUF0dHJpYnV0ZSIsInByb2dyYW1Mb2FkZWQiLCJtYWtlU2hhcmVMaW5rIiwibmFtZU9yVW50aXRsZWQiLCJtZW51SXRlbURpc2FibGVkIiwiaGFzQ2xhc3MiLCJuZXdFdmVudCIsInNhdmVFdmVudCIsIm5ld0ZpbGVuYW1lIiwidXNlTmFtZSIsImNyZWF0ZSIsInNhdmVkUHJvZ3JhbSIsImNyZWF0ZUZpbGUiLCJoaXN0b3J5IiwicHVzaFN0YXRlIiwiZ2V0VW5pcXVlSWQiLCJzYXZlQXMiLCJzYXZlQXNQcm9tcHQiLCJuZXdOYW1lIiwicmVuYW1lIiwicmVuYW1lUHJvbXB0IiwiZm9jdXNhYmxlRWx0cyIsInRoZVRvb2xiYXIiLCJ0b3BUaWVyTWVudWl0ZW1zIiwidG9BcnJheSIsImZpbHRlciIsImdldEF0dHJpYnV0ZSIsIm51bVRvcFRpZXJNZW51aXRlbXMiLCJpdGhUb3BUaWVyTWVudWl0ZW0iLCJpQ2hpbGQiLCJjaGlsZHJlbiIsImZpcnN0IiwidXBkYXRlRWRpdG9ySGVpZ2h0IiwidG9vbGJhckhlaWdodCIsIm9mZnNldEhlaWdodCIsInBhZGRpbmdUb3AiLCJkb2NNYWluIiwiZG9jUmVwbE1haW4iLCJpbnNlcnRBcmlhUG9zIiwic3VibWVudSIsImFyciIsImxlbiIsInNldEF0dHJpYnV0ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJoaWRlQWxsVG9wTWVudWl0ZW1zIiwic3RvcFByb3BhZ2F0aW9uIiwia2MiLCJrZXlDb2RlIiwiY2xpY2tUb3BNZW51aXRlbSIsInRoaXNFbHQiLCJ0b3BUaWVyVWwiLCJjbG9zZXN0IiwiaGFzQXR0cmlidXRlIiwidGhpc1RvcE1lbnVpdGVtIiwidDEiLCJzdWJtZW51T3BlbiIsImV4cGFuZGFibGVFbHRzIiwibm9uZXhwYW5kYWJsZUVsdHMiLCJzd2l0Y2hUb3BNZW51aXRlbSIsImRlc3RUb3BNZW51aXRlbSIsImRlc3RFbHQiLCJlbHRJZCIsInNob3dpbmdIZWxwS2V5cyIsInNob3dIZWxwS2V5cyIsImZhZGVJbiIsInJlY2l0ZUhlbHAiLCJ3aXRoaW5TZWNvbmRUaWVyVWwiLCJzZWNvbmRUaWVyVWwiLCJwb3NzRWx0cyIsInNyY1RvcE1lbnVpdGVtIiwidHRtaU4iLCJqIiwibmVhclNpYnMiLCJteUlkIiwidGhpc0VuY291bnRlcmVkIiwiYWRkIiwiZmFyU2licyIsInByZXZBbGwiLCJzdWJtZW51RGl2cyIsIm5leHRBbGwiLCJwcmV2ZW50RGVmYXVsdCIsInNoaWZ0S2V5IiwiY3RybEtleSIsImNvZGVDb250YWluZXIiLCJydW5CdXR0b24iLCJpbml0aWFsR2FzIiwic2V0T3B0aW9uIiwicmVtb3ZlU2hvcnRlbmVkTGluZSIsImxpbmVIYW5kbGUiLCJnZXRPcHRpb24iLCJsb25nTGluZXMiLCJydWxlckxpc3RlbmVycyIsInJlZnJlc2hSdWxlcnMiLCJkZWxldGVMaW5lIiwibWluTGVuZ3RoIiwic2l6ZSIsIk51bWJlciIsIk1BWF9WQUxVRSIsImxpbmVObyIsImluc3RhbmNlIiwibWluTGluZSIsImxhc3RMaW5lIiwibWF4TGluZSIsImNoYW5nZWQiLCJlYWNoTGluZSIsImdldERvYyIsInN0YXJ0c1dpdGgiLCJyZXBsYWNlIiwic2V0VmFsdWUiLCJjbGVhckhpc3RvcnkiLCJweXJldExvYWQiLCJQWVJFVCIsImJvZHkiLCJweXJldExvYWQyIiwibG9nRmFpbHVyZUFuZE1hbnVhbEZldGNoIiwiZXZlbnQiLCJ0aW1lU3RhbXAiLCJtYW51YWxGZXRjaCIsImFqYXgiLCJyZXMiLCJjb250ZW50c1ByZWZpeCIsInN0YXR1cyIsInN0YXR1c1RleHQiLCJyZXNwb25zZVRleHQiLCJQWVJFVF9CQUNLVVAiLCJvblJ1bkhhbmRsZXJzIiwib25SdW4iLCJoYW5kbGVyIiwidHJpZ2dlck9uUnVuIiwiaCIsIm9uSW50ZXJhY3Rpb25IYW5kbGVycyIsIm9uSW50ZXJhY3Rpb24iLCJ0cmlnZ2VyT25JbnRlcmFjdGlvbiIsImludGVyYWN0aW9uIiwib25Mb2FkSGFuZGxlcnMiLCJvbkxvYWQiLCJ0cmlnZ2VyT25Mb2FkIiwiZmluIiwibG9jYWxTZXR0aW5ncyIsImdldEl0ZW0iLCJub3RlcyIsInNldEl0ZW0iLCJpbml0aWFsU3RhdGUiLCJhY3F1aXJlVnNDb2RlQXBpIiwibWFrZUV2ZW50cyIsInNlbmRQb3J0IiwicmVjZWl2ZVBvcnQiLCJwYXJlbnQiLCJOT0RFX0VOViJdLCJzb3VyY2VSb290IjoiIn0=