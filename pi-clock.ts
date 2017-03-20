// ///<reference path="./node_modules/@types/node/index.d.ts" />

let SevenSegment = require('ht16k33-sevensegment-display');
let GPIO = require('onoff').Gpio;
import fs = require('fs');
let moment = require('moment');

export enum LightState {
  wake,
  sleep,
  off
}

let days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function hoursToMillis(hours: number): number {
    return hours * 3600000;
}

function mod(x: number, y: number): number {
    return ((x % y) + y) % y;
}

function getTime(d:Date): number {
   return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

function dayOfWeek(): number {
    let now: Date = new Date();
    return now.getDay();
}

function DSTmodifier():number {
    let today = moment(new Date()),
    tomorrow = moment(new Date(today.getTime() + 24 * 3600 * 1000));
    
    if (today.isDST() == tomorrow.isDST()) {
        return 0;
    } else if (today.isDST() &&  !tomorrow.isDST()) {
        return 1;
    } else if (!today.isDST() && tomorrow.isDST()) {
        return -1;
    }
}

export class PiClock {

    wakeTime: number = 7;
    firstLightOnTime: number = 6;
    lastLightOffTime: number = 8;
    sleepLED = new GPIO(17, 'out');
    wakeLED = new GPIO(22, 'out');
    lightState: LightState;
    eventTimeout;
    displayTimeout;
    display = new SevenSegment(0x70, 1);
    config;
    
    constructor() {
        this.display.display.setBrightness(1);
    }

    test() {
        setInterval(function() {
            let state = this.wakeLED.readSync();
            this.wakeLED.writeSync(Number(!state));
            this.sleepLED.writeSync(Number(!state));
        }, 1000)
    }
    
    readConfig() {
        this.config = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'));
        this.wakeTime = getTime(new Date(this.config.wakeTime[days[dayOfWeek()]]));
        this.firstLightOnTime = this.wakeTime - this.config.before / 60;
        this.lastLightOffTime = this.wakeTime + this.config.after / 60;
    }

    setState(lightState: LightState) {
        this.lightState = lightState;
        let [sleepState, wakeState]:[number,number] = this.unpackState();
        this.sleepLED.writeSync(sleepState);
        this.wakeLED.writeSync(wakeState);
        console.log(`set state=${LightState[this.lightState]} at ${new Date()}`)
    } 

    initialize(): LightState {
        let time: number = getTime(new Date());
        this.readConfig();
        let state = LightState.off;
        if (time >= this.firstLightOnTime && time < this.wakeTime) { state = LightState.sleep }
        else if (time >= this.wakeTime && time < this.lastLightOffTime) { state = LightState.wake }
        return state;
    }

    nextState(state:LightState) {
        switch(state) {
            case LightState.wake: return LightState.off;
            case LightState.sleep: return LightState.wake;
            case LightState.off: return LightState.sleep;
        }
    }

    nextTime(stateNext:LightState) {
        let time: number = getTime(new Date());
        switch(stateNext) {
            case LightState.wake:
                return mod(this.wakeTime - time, 24);
            case LightState.sleep:
                return mod(this.firstLightOnTime - time, 24) + DSTmodifier();
            case LightState.off:
                return mod(this.lastLightOffTime - time, 24);
        }
    }

    updateAndSchedule(state) {
        // TODO: if state is off, then get tomorrow's configs
        this.setState(state);
        let newState = this.nextState(state);
        let wait = hoursToMillis(this.nextTime(newState));
        if (wait < 0) {
            throw Error(`wait is negative: ${wait}`);
        }
        console.log(`wait ${wait / 1000 / 3600} hours`)
        return setTimeout(() => {
            try {
                this.eventTimeout = this.updateAndSchedule(newState)
            }
            catch (e) {
                throw e
            }
        }, wait);
    }

    displaySchedule() {
        let now = new Date(),
        hour = now.getHours(),
        minute = now.getMinutes();

        //Hours
        hour = hour % 12;
        if (hour == 0) {
            hour = 12;
        }
        if (hour >= 10) { 
            this.display.writeDigit(0, Math.floor(hour / 10));
        }
        else {
            this.display.writeDigit(0, null);
        }
        this.display.writeDigit(1, hour % 10);

        //Minutes
        this.display.writeDigit(3, Math.floor(minute / 10));
        this.display.writeDigit(4, minute % 10);

        //Colon
        this.display.setColon(true);
        
        //Time until next minute
        let coeff = 1000 * 60;
        let nextMinute = Math.ceil(now.getTime() / coeff) * coeff - now.getTime();
        
        //Schedule
        this.displayTimeout = setTimeout(() => {
            this.displayTimeout = this.displaySchedule();
        }, nextMinute);
    }

    start() {
        console.log('pi-clock started');
        let state = this.initialize();
        
        try {
            clearTimeout(this.eventTimeout);
            clearTimeout(this.displayTimeout);
        }
        finally {}
        
        // Prevent setTimeout from suspending by doing something every minute
        this.displayTimeout = this.displaySchedule();

        this.eventTimeout = this.updateAndSchedule(state);
    }

    unpackState(): [number, number] {
        switch (this.lightState) {
          case LightState.wake:
            return [0, 1];
          case LightState.sleep:
            return [1, 0];
          case LightState.off:
            return [0, 0];
        }
    }
    
    dispose() {
        this.sleepLED.unexport();
        this.wakeLED.unexport();
        clearTimeout(this.eventTimeout);
        clearTimeout(this.displayTimeout);
        this.display.clear();
        console.log('pi-clock stopped');
    }
}

if (!module.parent) {
    // this is the main module
    let clock = new PiClock();
    if (process.argv[2] == undefined) {
        clock.start();
    }
    else if (process.argv[2] == "test") {
        clock.test();
    }
    else {
        console.log("Invalid arg");
    }
    process.on('SIGINT', function() {
        clock.dispose();
        process.exit();
    })
}
