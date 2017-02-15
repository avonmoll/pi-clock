var GPIO = require('onoff').Gpio;
function hoursToMillis(hours) {
    return hours * 3600000;
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
function setState(state) {
    sleepLED.writeSync(state[0]);
    wakeLED.writeSync(state[1]);
    console.log("set state=" + [state] + " at " + getTime());
}
function getTime() {
    var now = new Date();
    return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}
function initialize() {
    var time = getTime();
    var state = [0, 0];
    if (time >= firstLightOnTime) {
        state = [1, 0];
    }
    else if (time >= wakeTime && time < lastLightOffTime) {
        state = [0, 1];
    }
    return state;
}
function nextState(state) {
    switch (state) {
        case ([0, 0]): {
            return [1, 0];
        }
        case ([1, 0]): {
            return [0, 1];
        }
        case ([0, 1]): {
            return [0, 0];
        }
    }
}
function nextTime(stateNext) {
    var time = getTime();
    switch (stateNext) {
        case ([0, 0]): {
            return (lastLightOffTime - time) % 24;
        }
        case ([1, 0]): {
            return (firstLightOnTime - time) % 24;
        }
        case ([0, 1]): {
            return (wakeTime - time) % 24;
        }
    }
}
function updateAndSchedule(state) {
    setState(state);
    var newState = nextState(state);
    var wait = hoursToMillis(nextTime(newState));
    setTimeout(updateAndSchedule(newState), wait);
}
function start() {
    console.log('pi-clock started');
    var state = initialize();
    updateAndSchedule(state);
}
start();
process.on('SIGINT', function () {
    console.log('terminated');
    sleepLED.unexport();
    wakeLED.unexport();
});
