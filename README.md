# j-counter
I need a package to count the concurrent login users of my application, but I couldn't find one that meet my requirements well. So, I wrote one.

j-counter can increase or decrease the count whenever you want. The recording is timestamp based. And it calculates the peak value and average value for you. 

It also do summarize on minute level and hour level, and tell you the peak/avg value of each minute and hour. By default, it do summarize each 10 minutes, but you can customize the interval.

## Installation
```Javascript
npm i j-counter
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
         *      hour: number, // the timestamp value of the hour (minute, second and millisecond are 0)
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
         *      hour: number, // the timestamp value of the hour (minute, second and millisecond are 0)
         *      peak: number, // the peak count during the hour
         *      avg: number, // the average count during the hour
         * }
         */
        hourSummary.push(summary); // you can store the count into database if need.
});
```
## Usage - Summarizing interval
The minuteSummary event is triggered every 10 minutes by default. The interval can be changed with parameter:
```Javascript
const summarizer = counter.triggerSummarizer(1000 * 60 * 5); // 5 minutes
```
But the minimum interval is 1 minute, even if you set the value to smaller number. This is because the calculation is based on minute.
## Data in memory
The counter stores the count data in memory. It's like: 

key: [1599116412345, 1599116412348, 1599116412352, ...] // timestamp when count changes

value: [1,2,3,...] // the count

To avoid the accumulating data from filling out the memory, summarizer automatically cut the records before the previous hour. 
E.g. when summarizer is calculating the data at "2020-09-03 15:30:01:0012", it cuts all the data before "2020-09-03 14:00:00:0000".
If this is still risky, you can execute cut function on minuteSummary event like below. But make sure keep enough data for the calculation.

```Javascript
const minuteSummary = [];
const summarizer = counter.triggerSummarizer(1000*);
summarizer.on('minuteSummary', (summary) => {
        minuteSummary.push(summary);
        counter.cut(Date.now() - (1000 * 60 * 30)); // only keep the records of recent 30 minutes.
});
```
## Calculation formula
peak = max(counts)

avg = (Σ (count * duration)) / (Σ durations)
