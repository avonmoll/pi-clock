"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SevenSegment = require('ht16k33-sevensegment-display');
var GPIO = require('onoff').Gpio;
var fs = require("fs");
var LightState;
(function (LightState) {
    LightState[LightState["wake"] = 0] = "wake";
    LightState[LightState["sleep"] = 1] = "sleep";
    LightState[LightState["off"] = 2] = "off";
})(LightState = exports.LightState || (exports.LightState = {}));
var days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
function hoursToMillis(hours) {
    return hours * 3600000;
}
function mod(x, y) {
    return ((x % y) + y) % y;
}
function getTime(d) {
    return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}
function dayOfWeek() {
    var now = new Date();
    return now.getDay();
}
var PiClock = (function () {
    function PiClock() {
        this.wakeTime = 7;
        this.firstLightOnTime = 6;
        this.lastLightOffTime = 8;
        this.sleepLED = new GPIO(17, 'out');
        this.wakeLED = new GPIO(22, 'out');
        this.display = new SevenSegment(0x70, 1);
        this.display.display.setBrightness(5);
    }
    PiClock.prototype.test = function () {
        setInterval(function () {
            var state = this.wakeLED.readSync();
            this.wakeLED.writeSync(Number(!state));
            this.sleepLED.writeSync(Number(!state));
        }, 1000);
    };
    PiClock.prototype.readConfig = function () {
        this.config = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'));
        this.wakeTime = getTime(new Date(this.config.wakeTime[days[dayOfWeek()]]));
        this.firstLightOnTime = this.wakeTime - this.config.before / 60;
        this.lastLightOffTime = this.wakeTime + this.config.after / 60;
    };
    PiClock.prototype.setState = function (lightState) {
        this.lightState = lightState;
        var _a = this.unpackState(), sleepState = _a[0], wakeState = _a[1];
        this.sleepLED.writeSync(sleepState);
        this.wakeLED.writeSync(wakeState);
        console.log("set state=" + LightState[this.lightState] + " at " + new Date());
    };
    PiClock.prototype.initialize = function () {
        var time = getTime(new Date());
        this.readConfig();
        var state = LightState.off;
        if (time >= this.firstLightOnTime && time < this.lastLightOffTime) {
            state = LightState.sleep;
        }
        else if (time >= this.wakeTime && time < this.lastLightOffTime) {
            state = LightState.wake;
        }
        return state;
    };
    PiClock.prototype.nextState = function (state) {
        switch (state) {
            case LightState.wake: return LightState.off;
            case LightState.sleep: return LightState.wake;
            case LightState.off: return LightState.sleep;
        }
    };
    PiClock.prototype.nextTime = function (stateNext) {
        var time = getTime(new Date());
        switch (stateNext) {
            case LightState.wake:
                return mod(this.wakeTime - time, 24);
            case LightState.sleep:
                return mod(this.firstLightOnTime - time, 24);
            case LightState.off:
                return mod(this.lastLightOffTime - time, 24);
        }
    };
    PiClock.prototype.updateAndSchedule = function (state) {
        var _this = this;
        this.setState(state);
        var newState = this.nextState(state);
        var wait = hoursToMillis(this.nextTime(newState));
        if (wait < 0) {
            throw Error("wait is negative: " + wait);
        }
        console.log("wait " + wait / 1000 + " seconds");
        return setTimeout(function () {
            try {
                _this.eventTimeout = _this.updateAndSchedule(newState);
            }
            catch (e) {
                throw e;
            }
        }, wait);
    };
    PiClock.prototype.displaySchedule = function () {
        var _this = this;
        var now = new Date(), hour = now.getHours(), minute = now.getMinutes();
        this.display.writeDigit(0, Math.floor(hour / 10));
        this.display.writeDigit(1, hour % 10);
        this.display.writeDigit(3, Math.floor(minute / 10));
        this.display.writeDigit(4, minute % 10);
        this.display.setColon(true);
        var coeff = 1000 * 60;
        var nextMinute = Math.ceil(now.getTime() / coeff) * coeff - now.getTime();
        this.displayTimeout = setTimeout(function () {
            _this.displayTimeout = _this.displaySchedule();
        }, nextMinute);
    };
    PiClock.prototype.start = function () {
        console.log('pi-clock started');
        var state = this.initialize();
        try {
            clearTimeout(this.eventTimeout);
            clearTimeout(this.displayTimeout);
        }
        finally { }
        this.displayTimeout = this.displaySchedule();
        this.eventTimeout = this.updateAndSchedule(state);
    };
    PiClock.prototype.unpackState = function () {
        switch (this.lightState) {
            case LightState.wake:
                return [0, 1];
            case LightState.sleep:
                return [1, 0];
            case LightState.off:
                return [0, 0];
        }
    };
    PiClock.prototype.dispose = function () {
        this.sleepLED.unexport();
        this.wakeLED.unexport();
        clearTimeout(this.eventTimeout);
        clearTimeout(this.displayTimeout);
        this.display.clear();
        console.log('pi-clock stopped');
    };
    return PiClock;
}());
exports.PiClock = PiClock;
var clock = new PiClock();
if (process.argv[2] == undefined) {
    clock.start();
}
else if (process.argv[2] == "test") {
    clock.test();
}
else {
    console.log("Invalid arg");
}
process.on('SIGINT', function () {
    clock.dispose();
    process.exit();
});
