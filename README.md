# pi-clock

A Raspberry Pi-powered light-based alarm clock for toddlers

![pi-clock_schematic](pi-clock_schematic.png)

## Installation

1.  `git clone https://www.github.com/avonmoll/pi-clock/`
2.  `cd pi-clock`
3.  `npm install` (`sudo` may be necessary if installing directly on RPi)

## Usage

### [pm2](pm2.keymetrics.io) (Recommended)

1.  Install pm2: `npm install -g pm2`
2.  Configure startup: `pm2 startup`
3.  Start app: `pm2 start server.js -o log`
4.  `pm2 save`

### cron

The following command adds an entry to the root crontab to run the app on reboot.

1.  `sudo echo "@reboot root cd /home/<path-to>/pi-clock && sudo node server.js >> log 2>&1 &" >> /etc/crontab`
2.  `sudo reboot`

## Materials

-   [Adafruit 7-segment 4-digit LED display with I2C backpack](https://www.adafruit.com/products/1002)
-   [10mm red LED](https://www.taydaelectronics.com/led-10mm-red-water-clear-ultra-bright.html) (note: an additional 100 ohm resistor may be needed in series with one of the existing resistors since I used an LED rated for higher voltage)
-   [10mm green LED](https://www.taydaelectronics.com/led-10mm-green-water-clear-ultra-bright.html)
-   male-female jumper wires
-   male-male jumper wires

## Tools

-   Soldering iron (for the I2C backpack)

## Build & development

Run `grunt` for building and `grunt serve` for preview.

## Testing

Running `grunt test` will run the unit tests with karma.

* * *

The web server was scaffolded with [yo angular generator](https://github.com/yeoman/generator-angular)
version 0.15.1.
