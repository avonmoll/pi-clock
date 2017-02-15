// declare var require: any;
let GPIO = require('onoff').Gpio;
// import { Gpio as GPIO } from 'onoff';

function hoursToMillis(hours: number): number {
    return hours * 3600000;
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
    console.log(`set state=${[sleepState, wakeState]} at ${getTime()}`)
}

function getTime(): number {
    let now: Date = new Date()
    return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

function initialize(): number[] {
    let time: number = getTime();
    let state = [0, 0];
    if (time >= firstLightOnTime) { state = [1, 0] }
    else if (time >= wakeTime && time < lastLightOffTime) { state = [0, 1] }
    return state;
}

function nextState(state) {
    if (state == [0, 0]) { return [1, 0] }
    else if (state == [1, 0]) { return [0, 1] }
    else if (state == [0, 1]) { return [0, 0] }
}

function nextTime(stateNext) {
    let time: number = getTime();
    // switch (stateNext) {
    //     case ([0, 0]): { return (lastLightOffTime - time) % 24 }
    //     case ([1, 0]): { return (firstLightOnTime - time) % 24 }
    //     case ([0, 1]): { return (wakeTime - time) % 24 }
    // }
    if (stateNext == [0, 0]) { return (lastLightOffTime - time) % 24 }
    else if (stateNext == [1, 0]) { return (firstLightOnTime - time) % 24 }
    else if (stateNext == [0, 1]) { return (wakeTime - time) % 24 }
    else { throw Error('Invalid next state') }
}

function updateAndSchedule(state) {
    setState(state);
    let newState = nextState(state);
    let wait = hoursToMillis(nextTime(newState));
    setTimeout(updateAndSchedule(newState), wait);
}

function start() {
    console.log('pi-clock started');
    let state = initialize();
    updateAndSchedule(state);
}

start()

process.on('SIGINT', function() {
    console.log('terminated');
    sleepLED.unexport();
    wakeLED.unexport();
})
