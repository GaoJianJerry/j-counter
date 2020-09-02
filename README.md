# j-counter
I need a package to count the concurrent login users in my application, and I didn't find any that meet my requirements well. So, I wrote one.
Feel free to enjoy if you find it's what you are looking for.

This package is still in development, but main features are already there.

## Installation - Javascript
```Javascript
        const { JCounter } = require('j-counter');
```
## Installation - Typescript
```Javascript
        import { JCounter } from 'j-counter';
```
## Usage - Increase / decrease counter
```Javascript
        const counter = new JCounter();

        counter.addOne();
        console.log(`Latest count is ${counter.getLastCount()}`); // 1

        counter.dropOne();
        console.log(`Latest count is ${counter.getLastCount()}`); // 0

        counter.add(5);
        console.log(`Latest count is ${counter.getLastCount()}`); // 5

        counter.drop(5);
        console.log(`Latest count is ${counter.getLastCount()}`); // 0
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
 