var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events;
(function (events) {
    var Event = (function () {
        function Event(type, bubbles, cancelable) {
            if (bubbles === void 0) { bubbles = null; }
            if (cancelable === void 0) { cancelable = null; }
            this.eventPhase = 0;
            this.timeStamp = 0;
            this.defaultPrevented = false;
            this.propagationStopped = false;
            this.immediatePropagationStopped = false;
            this.type = type;
            this.bubbles = !!bubbles;
            this.cancelable = !!cancelable;
            this.timeStamp = (new Date()).getTime();
        }
        Event.prototype.preventDefault = function () {
            this.defaultPrevented = true;
        };
        Event.prototype.stopPropagation = function () {
            this.propagationStopped = true;
        };
        Event.prototype.stopImmediatePropagation = function () {
            this.immediatePropagationStopped = this.propagationStopped = true;
        };
        Event.prototype.remove = function () {
            this.removed = true;
        };
        Event.prototype.clone = function () {
            return new Event(this.type, this.bubbles, this.cancelable);
        };
        Event.prototype.set = function (props) {
            for (var n in props) {
                if (props.hasOwnProperty(n)) {
                    this[n] = props[n];
                }
            }
            return this;
        };
        Event.prototype.toString = function () {
            return "[Event (type=" + this.type + ")]";
        };
        return Event;
    }());
    events.Event = Event;
})(events || (events = {}));
var events;
(function (events) {
    var EventDispatcher = (function () {
        function EventDispatcher() {
            this._listeners = null;
            this._captureListeners = null;
            this.off = this.removeEventListener;
        }
        EventDispatcher.initialize = function (target) {
            var p = EventDispatcher.prototype;
            target.addEventListener = p.addEventListener;
            target.on = p.on;
            target.removeEventListener = target.off = p.removeEventListener;
            target.removeAllEventListeners = p.removeAllEventListeners;
            target.hasEventListener = p.hasEventListener;
            target.dispatchEvent = p.dispatchEvent;
            target._dispatchEvent = p._dispatchEvent;
            target.willTrigger = p.willTrigger;
        };
        EventDispatcher.prototype.addEventListener = function (type, listener, useCapture) {
            var listeners;
            if (useCapture) {
                listeners = this._captureListeners = this._captureListeners || {};
            }
            else {
                listeners = this._listeners = this._listeners || {};
            }
            var arr = listeners[type];
            if (arr) {
                this.removeEventListener(type, listener, useCapture);
            }
            arr = listeners[type];
            if (!arr) {
                listeners[type] = [listener];
            }
            else {
                arr.push(listener);
            }
            return listener;
        };
        EventDispatcher.prototype.on = function (type, listener, scope, once, data, useCapture) {
            if (listener.handleEvent) {
                scope = scope || listener;
                listener = listener.handleEvent;
            }
            scope = scope || this;
            return this.addEventListener(type, function (evt) {
                listener.call(scope, evt, data);
                once && evt.remove();
            }, useCapture);
        };
        EventDispatcher.prototype.removeEventListener = function (type, listener, useCapture) {
            var listeners = useCapture ? this._captureListeners : this._listeners;
            if (!listeners) {
                return;
            }
            var arr = listeners[type];
            if (!arr) {
                return;
            }
            for (var i = 0, l = arr.length; i < l; i++) {
                if (arr[i] == listener) {
                    if (l == 1) {
                        delete (listeners[type]);
                    }
                    else {
                        arr.splice(i, 1);
                    }
                    break;
                }
            }
        };
        EventDispatcher.prototype.removeAllEventListeners = function (type) {
            if (!type) {
                this._listeners = this._captureListeners = null;
            }
            else {
                if (this._listeners) {
                    delete (this._listeners[type]);
                }
                if (this._captureListeners) {
                    delete (this._captureListeners[type]);
                }
            }
        };
        EventDispatcher.prototype.dispatchEvent = function (eventObj, target) {
            if (typeof eventObj == "string") {
                var listeners = this._listeners;
                if (!listeners || !listeners[eventObj]) {
                    return false;
                }
                eventObj = new events.Event(eventObj);
            }
            try {
                eventObj.target = target || this;
            }
            catch (e) {
            }
            if (!eventObj.bubbles || !this.parent) {
                this._dispatchEvent(eventObj, 2);
            }
            else {
                var top = this;
                var list = [top];
                while (top.parent) {
                    list.push(top = top.parent);
                }
                var i;
                var l = list.length;
                for (i = l - 1; i >= 0 && !eventObj.propagationStopped; i--) {
                    list[i]._dispatchEvent(eventObj, 1 + ((i == 0) ? 1 : 0));
                }
                for (i = 1; i < l && !eventObj.propagationStopped; i++) {
                    list[i]._dispatchEvent(eventObj, 3);
                }
            }
            return eventObj.defaultPrevented;
        };
        EventDispatcher.prototype.hasEventListener = function (type) {
            var listeners = this._listeners;
            var captureListeners = this._captureListeners;
            return !!((listeners && listeners[type]) || (captureListeners && captureListeners[type]));
        };
        EventDispatcher.prototype.willTrigger = function (type) {
            var o = this;
            while (o) {
                if (o.hasEventListener(type)) {
                    return true;
                }
                o = o.parent;
            }
            return false;
        };
        EventDispatcher.prototype.toString = function () {
            return "[EventDispatcher]";
        };
        EventDispatcher.prototype.destruct = function () {
            this.removeAllEventListeners();
        };
        EventDispatcher.prototype._dispatchEvent = function (eventObj, eventPhase) {
            var l, listeners = (eventPhase == 1) ? this._captureListeners : this._listeners;
            if (eventObj && listeners) {
                var arr = listeners[eventObj.type];
                if (!arr || !(l = arr.length)) {
                    return;
                }
                try {
                    eventObj.currentTarget = this;
                }
                catch (e) {
                }
                try {
                    eventObj.eventPhase = eventPhase;
                }
                catch (e) {
                }
                eventObj.removed = false;
                arr = arr.slice();
                for (var i = 0; i < l && !eventObj.immediatePropagationStopped; i++) {
                    var o = arr[i];
                    if (o.handleEvent) {
                        o.handleEvent(eventObj);
                    }
                    else {
                        o(eventObj);
                    }
                    if (eventObj.removed) {
                        this.removeEventListener(eventObj.type, o, eventPhase == 1);
                        eventObj.removed = false;
                    }
                }
            }
        };
        return EventDispatcher;
    }());
    events.EventDispatcher = EventDispatcher;
})(events || (events = {}));
var jp;
(function (jp) {
    var matium;
    (function (matium) {
        var EventDispatcher = events.EventDispatcher;
        var SampleEventDispatcher = (function (_super) {
            __extends(SampleEventDispatcher, _super);
            function SampleEventDispatcher() {
                _super.call(this);
                console.log("Extend Test");
            }
            return SampleEventDispatcher;
        }(EventDispatcher));
        matium.SampleEventDispatcher = SampleEventDispatcher;
    })(matium = jp.matium || (jp.matium = {}));
})(jp || (jp = {}));
var main;
document.addEventListener("DOMContentLoaded", function () {
    main = new jp.matium.SampleEventDispatcher();
}, false);
//# sourceMappingURL=sample.js.map