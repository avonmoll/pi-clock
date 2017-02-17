var GPIO = require('onoff').Gpio;
function hoursToMillis(hours) {
    return hours * 3600000;
}
function mod(x, y) {
    return ((x % y) + y) % y;
}
var wakeTime = 7;
var firstLightOnTime = 6;
var lastLightOffTime = 8;
var sleepLED = new GPIO(17, 'out');
var wakeLED = new GPIO(22, 'out');
function test() {
    setInterval(function () {
        var state = wakeLED.readSync();
        wakeLED.writeSync(Number(!state));
        sleepLED.writeSync(Number(!state));
    }, 1000);
}
function setState(_a) {
    var sleepState = _a[0], wakeState = _a[1];
    sleepLED.writeSync(sleepState);
    wakeLED.writeSync(wakeState);
    console.log("set state=" + [sleepState, wakeState] + " at " + new Date());
}
function getTime() {
    var now = new Date();
    return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}
function initialize() {
    var time = getTime();
    var state = [0, 0];
    if (time >= firstLightOnTime && time < lastLightOffTime) {
        state = [1, 0];
    }
    else if (time >= wakeTime && time < lastLightOffTime) {
        state = [0, 1];
    }
    return state;
}
function nextState(state) {
    var sleepState = state[0], wakeState = state[1];
    if (sleepState == 0 && wakeState == 0) {
        return [1, 0];
    }
    else if (sleepState == 1 && wakeState == 0) {
        return [0, 1];
    }
    else if (sleepState == 0 && wakeState == 1) {
        return [0, 0];
    }
    else {
        throw Error("State not valid: " + state);
    }
}
function nextTime(stateNext) {
    var time = getTime();
    var sleepState = stateNext[0], wakeState = stateNext[1];
    if (sleepState == 0 && wakeState == 0) {
        return mod(lastLightOffTime - time, 24);
    }
    else if (sleepState == 1 && wakeState == 0) {
        return mod(firstLightOnTime - time, 24);
    }
    else if (sleepState == 0 && wakeState == 1) {
        return mod(wakeTime - time, 24);
    }
    else {
        throw Error("Invalid next state: " + stateNext);
    }
}
function updateAndSchedule(state) {
    setState(state);
    var newState = nextState(state);
    var wait = hoursToMillis(nextTime(newState));
    if (wait < 0) {
        throw Error("wait is negative: " + wait);
    }
    console.log("wait " + wait / 1000 + " seconds");
    setTimeout(function () {
        try {
            updateAndSchedule(newState);
        }
        catch (e) {
            throw e;
        }
    }, wait);
}
function start() {
    console.log('pi-clock started');
    var state = initialize();
    setInterval(function () { }, 10 * 60 * 1000);
    updateAndSchedule(state);
}
if (process.argv[2] == undefined) {
    start();
}
else if (process.argv[2] == "test") {
    test();
}
else {
    console.log("Invalid arg");
}
process.on('SIGINT', function () {
    console.log('terminated');
    sleepLED.unexport();
    wakeLED.unexport();
});
