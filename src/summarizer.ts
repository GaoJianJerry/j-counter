import * as _ from 'underscore';
import { HourSummary } from './summary';
import { Counter } from './counter';
import { EventEmitter } from 'events';

const DEFAULT_SUMMARY_INTERVAL = 600000; // 10 minutes
const MINIMUN_SUMMARY_INTERVAL = 60000;
const DEFAULT_KEEP_RECORDS = 24;
const MINIMUM_KEEP_RECORDS = 5;

export class Summarizer extends EventEmitter {
  sumaryLoop: any;
  summary: Map<number, HourSummary>;
  // summaryInterval = 60000;
  prevCut: object;
  counter: Counter;
  keepRecords: number;
  sumReducer = (accumulator: number, currentValue: number) => accumulator + currentValue;

  constructor(counter: Counter, keepRecords?: number) {
    super();
    // this.summaryInterval = Math.max(summaryInterval? summaryInterval: DEFAULT_SUMMARY_INTERVAL, MINIMUM_SUMMARY_INTERVAL);
    this.counter = counter;
    this.keepRecords = Math.max(keepRecords ? keepRecords : DEFAULT_KEEP_RECORDS, MINIMUM_KEEP_RECORDS);
    this.summary = new Map();
  }

  trigger(interval?: number) {
    this.sumaryLoop = setInterval(
      this.triggerSummarize.bind(this),
      Math.max(interval || DEFAULT_SUMMARY_INTERVAL, MINIMUN_SUMMARY_INTERVAL),
    );
  }

  triggerSummarize() {
    this.emit('beforeSummarize', [this.summary]);
    const current = new Date();
    current.setMilliseconds(0);
    current.setSeconds(0);
    const curMin = current.getTime();
    current.setMinutes(0);
    const curHour = current.getTime();
    const prevHour = curHour - 3600000;
    let beginMin = 0;
    let length;
    if (this.summary.has(prevHour)) {
      length = this.getSummaryObj(prevHour).getLength();
      if (length < 60) {
        beginMin = prevHour + length * 1000;
        this.summarize(beginMin, curHour - 1000, prevHour);
      }
    }
    length = this.getSummaryObj(curHour).getLength();
    if (length < 60) {
      beginMin = curHour + length * 1000;
      this.summarize(beginMin, curMin, curHour);
    }
    this.prevCut = this.counter.cut(prevHour); // cut is save, because it will leave at least 1 record.
    this.clearRecords();
    this.emit('afterSummarize', this.summary);
  }

  clearRecords() {
    this.emit('beforeClear', [this.summary]);
    const keysArray = Array.from(this.summary.keys());
    if (keysArray.length > this.keepRecords) {
      const keysToDelete = keysArray.slice(0, -this.keepRecords);
      keysToDelete.forEach((key) => {
        this.summary.delete(key);
      });
    }
    this.emit('afterClear', [this.summary]);
  }

  summarize(beginMin: number, endMin: number, hour: number) {
    const summary = this.getSummaryObj(hour);
    for (let m = beginMin; m <= endMin; m = m + 60000) {
      const time = new Date(m);
      const minute = time.getMinutes();
      if (minute < summary.getLength()) continue;
      const mpeak = this.counter.getPeak(m, m + 60000);
      const mavg = this.counter.getAvg(m, m + 60000);
      summary.setPeak(minute, mpeak);
      summary.setAvg(minute, mavg);
      this.emit('minuteSummary', { hour, minute, peak: mpeak, avg: mavg });
      if (minute === 59) {
        this.emit('hourSummary', this.getHourSummary(hour));
      }
      if (summary.getLength() >= 60) break;
    }
  }

  getHourSummary(hour: number) {
    const hourSummary = this.getSummaryObj(hour);
    const sum = hourSummary.avgs.reduce(this.sumReducer);
    const result = {
      hour,
      peak: _.max(hourSummary.peaks),
      avg: sum / hourSummary.getLength(),
    };
    return result;
  }

  getSummaryObj(hour: number) {
    let sum = this.summary.get(hour);
    if (!sum) {
      sum = new HourSummary(hour);
      this.summary.set(hour, sum);
    }
    return sum;
  }

  getSummary() {
    return this.summary;
  }

  destroy() {
    this.emit('beforeDestroy');
    clearInterval(this.sumaryLoop);
    delete this.sumaryLoop;
    delete this.summary;
    this.emit('afterDestroy');
  }
}
