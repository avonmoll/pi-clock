// declare var require: any;
let GPIO = require('onoff').Gpio;
// import { Gpio as GPIO } from 'onoff';

function hoursToMillis(hours: number): number {
    return hours * 3600000;
}

function mod(x: number, y: number): number {
    return ((x % y) + y) % y;
}

let wakeTime: number = 7;
let firstLightOnTime: number = 6;
let lastLightOffTime: number = 8;
let sleepLED = new GPIO(17, 'out');
let wakeLED = new GPIO(22, 'out');

function test() {
    setInterval(function() {
        let state = wakeLED.readSync();
        wakeLED.writeSync(Number(!state));
        sleepLED.writeSync(Number(!state));
    }, 1000)
}

function setState([sleepState, wakeState]: [number, number]) {
    sleepLED.writeSync(sleepState);
    wakeLED.writeSync(wakeState);
    console.log(`set state=${[sleepState, wakeState]} at ${new Date()}`)
}

function getTime(): number {
    let now: Date = new Date()
    return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

function initialize(): number[] {
    let time: number = getTime();
    let state = [0, 0];
    if (time >= firstLightOnTime && time < lastLightOffTime) { state = [1, 0] }
    else if (time >= wakeTime && time < lastLightOffTime) { state = [0, 1] }
    return state;
}

function nextState(state) {
    let [sleepState, wakeState] = state;
    if (sleepState == 0 && wakeState == 0) { return [1, 0] }
    else if (sleepState == 1 && wakeState == 0) { return [0, 1] }
    else if (sleepState == 0 && wakeState == 1) { return [0, 0] }
    else { throw Error(`State not valid: ${state}`) }
}

function nextTime(stateNext) {
    let time: number = getTime();
    let [sleepState, wakeState] = stateNext;
    if (sleepState == 0 && wakeState == 0) { return mod(lastLightOffTime - time, 24) }
    else if (sleepState == 1 && wakeState == 0) { return mod(firstLightOnTime - time, 24) }
    else if (sleepState == 0 && wakeState == 1) { return mod(wakeTime - time, 24) }
    else { throw Error(`Invalid next state: ${stateNext}`) }
}

function updateAndSchedule(state) {
    setState(state);
    let newState = nextState(state);
    let wait = hoursToMillis(nextTime(newState));
    if (wait < 0) {
        throw Error(`wait is negative: ${wait}`);
    }
    console.log(`wait ${wait / 1000} seconds`)
    setTimeout(() => {
        try {
            updateAndSchedule(newState)
        }
        catch (e) {
            throw e
        }
    }, wait);
}

function start() {
    console.log('pi-clock started');
    let state = initialize();
    
    // Prevent setTimeout from suspending by doing something every 10 minutes
    setInterval(() => {}, 10 * 60 * 1000);
    
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


process.on('SIGINT', function() {
    console.log('terminated');
    sleepLED.unexport();
    wakeLED.unexport();
})
