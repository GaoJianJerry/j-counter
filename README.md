# j-counter
I need a package to count the concurrent login users of my application, but I couldn't find one that meet my requirements well. So, I wrote one.

## Installation
```Javascript
npm install j-counter
```
## Invoke in javascript
```Javascript
const { JCounter } = require('j-counter');
```
## Invoke in typescript
```Javascript
import { JCounter } from 'j-counter';
```
## Usage - Increase / decrease counter
```Javascript
const counter = new JCounter();
let count = 0;
counter.addOne();
count = counter.getLastCount(); // 1
counter.dropOne();
count = counter.getLastCount(); // 0
counter.add(5);
count = counter.getLastCount(); // 5
counter.drop(6);
count = counter.getLastCount(); // -1
```
## Usage - Multiple counters
```Javascript
counter.createCounter('counter1');
counter.addOne('counter1');
let count1 = counter.getLastCount('counter1');
```
## Usage - Get peak and average counts
```Javascript
const peak = counter.getPeak(); // 5
console.log(`Peak count is: ${peak}`);

const avg = counter.getAvg();
console.log(`Average count is: ${avg}`);

const now = Date.now();
console.log(`The count at 1 second ago: ${counter.getCountAt(now - 1000)}`);

const peak10 = counter.getPeak(now - 10000, now); // Peak value of recent 10 seconds
console.log(`Peak of recent 10 seconds is: ${peak10}`);

const avg10 = counter.getAvg(now - 10000, now);// Average value of recent 10 seconds
console.log(`Average of recent 10 seconds is: ${avg10}`);

counter.cut(now); // Cuts all the records before now, and keep the count at now.
```
## Usage - Summarizing peak and average count by minute
```Javascript
const minuteSummary = [];
const summarizer = counter.triggerSummarizer();
summarizer.on('minuteSummary', (summary) => {
        console.log(summary);
        /**
         * The summary object is like this: 
         * {
         *      hour: number, // the timestamp value of the hour
         *      minute: number, // 0 - 59, stands for the minute
         *      peak: number, // the peak count during the minute
         *      avg: number, // the average count during the minute
         * }
         */
        minuteSummary.push(summary); // you can store the count into database if need.
});
```
## Usage - Summarizing peak and average count by hour
```Javascript
const hourSummary = [];
const summarizer = counter.triggerSummarizer();
summarizer.on('hourSummary', (summary) => {
        console.log(summary);
        /**
         * The summary object is like this: 
         * {
         *      hour: number, // the timestamp value of the hour
         *      peak: number, // the peak count during the minute
         *      avg: number, // the average count during the minute
         * }
         */
        hourSummary.push(summary); // you can store the count into database if need.
});
```

