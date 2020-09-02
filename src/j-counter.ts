import { Counter } from './counter';
import { isNumber } from 'util';
import { Summarizer } from './summarizer';
import * as _ from 'underscore';

const EXCEPTION_COUNTER_NOT_EXIST = 'The counter not exist';
const EXCEPTION_DELETE_DEFAULT_COUNTER = 'Can not delete the default counter';

// const enum Granularity {
//     DAY = 0,
//     HOUR,
//     MINUTE
// };

export class JCounter {
  private counters: Map<string, Counter> = new Map();
  private summarizers: Map<string, Summarizer> = new Map();
  private DEFAULT_NAME = '__DEFAULT_COUNTER__';
  private defaultCounter: Counter;
  // granularity: Granularity;

  constructor() {
    this.defaultCounter = new Counter(this.DEFAULT_NAME);
    this.counters.set(this.DEFAULT_NAME, this.defaultCounter);
  }

  // setGranularity(granularity: number){
  //     this.granularity = granularity;
  // }

  getCounter(name?: string) {
    const cName = name || this.DEFAULT_NAME;
    const c = this.counters.get(cName);
    if (c === undefined) throw { message: EXCEPTION_COUNTER_NOT_EXIST };
    return c;
  }

  createCounter(name: string) {
    if (this.counters.has(name)) {
      return this.counters.get(name);
    }
    const counter = new Counter(name);
    this.counters.set(name, counter);
    return counter;
  }

  getLastCount(name?: string) {
    const c = this.getCounter(name);
    return c.lastCount;
  }

  addOne(name?: string) {
    const c = this.getCounter(name);
    c.increase();
    return true;
  }

  add(pace: number, name?: string) {
    if (!isNumber(pace)) return false;
    const c = this.getCounter(name);
    return c.increase(pace);
  }

  dropOne(name?: string) {
    const c = this.getCounter(name);
    c.increase(-1);
  }

  drop(pace: number, name?: string) {
    if (!isNumber(pace)) return false;
    const c = this.getCounter(name);
    return c.increase(-pace);
  }

  getCountAt(ts: number, name?: string) {
    const c = this.getCounter(name);
    return c.getCountAt(ts);
  }

  // //debug only
  // getKeys(name?: string){
  //     const c = this.getCounter(name);
  //     return c.keys;
  // }

  getLastAt() {
    const c = this.getCounter(name);
    return c.lastAt;
  }

  getPeak(begin?: number, end?: number, name?: string) {
    const c = this.getCounter(name);
    return c.getPeak(begin, end);
  }

  getAvg(begin?: number, end?: number, name?: string) {
    const c = this.getCounter(name);
    return c.getAvg(begin, end);
  }

  cut(cutAt?: number, name?: string) {
    const c = this.getCounter(name);
    return c.cut(cutAt);
  }

  triggerSummarizer(interval?: number, name?: string) {
    const cName = name || this.DEFAULT_NAME;
    const c = this.getCounter(cName);
    let s = this.summarizers.get(cName);
    if (!s) {
      s = new Summarizer(c);
      s.trigger(interval);
      this.summarizers.set(cName, s);
    }
    return s;
  }

  getSummarizer(name?: string) {
    const cName = name || this.DEFAULT_NAME;
    const s = this.summarizers.get(cName);
    if (s === undefined) throw { message: EXCEPTION_COUNTER_NOT_EXIST };
    return s;
  }

  // getSummary(name?: string){
  //     const cName = name || this.DEFAULT_NAME;
  //     const s = this.summarizers.get(cName);
  //     if (s === undefined) throw {message: EXCEPTION_COUNTER_NOT_EXIST};
  //     return s.getSummary();
  // }

  getMinutePeak(name?: string) {
    const cName = name || this.DEFAULT_NAME;
    const summarizer = this.summarizers.get(cName);
    if (summarizer === undefined) throw { message: EXCEPTION_COUNTER_NOT_EXIST };
    const summary = summarizer.getSummary();
    const vals = summary.values();
    let element = vals.next();
    const result = [];
    while (!element.done) {
      const hourSummary = element.value;
      result.push({ hour: hourSummary.hour, peaks: hourSummary.peaks });
      element = vals.next();
    }
    return result;
  }

  getMinuteAvg(name?: string) {
    const cName = name || this.DEFAULT_NAME;
    const summarizer = this.summarizers.get(cName);
    if (summarizer === undefined) throw { message: EXCEPTION_COUNTER_NOT_EXIST };
    const summary = summarizer.getSummary();
    const vals = summary.values();
    let element = vals.next();
    const result = [];
    while (!element.done) {
      const hourSummary = element.value;
      result.push({ hour: hourSummary.hour, avgs: hourSummary.avgs });
      element = vals.next();
    }
    return result;
  }

  getHourPeak(name?: string) {
    const cName = name || this.DEFAULT_NAME;
    const summarizer = this.summarizers.get(cName);
    if (summarizer === undefined) throw { message: EXCEPTION_COUNTER_NOT_EXIST };
    const summary = summarizer.getSummary();
    const vals = summary.values();
    let element = vals.next();
    const result = [];
    while (!element.done) {
      const hourSummary = element.value;
      result.push({ hour: hourSummary.hour, peak: _.max(hourSummary.peaks) });
      element = vals.next();
    }
    return result;
  }

  getHourAvg(name?: string) {
    const cName = name || this.DEFAULT_NAME;
    const summarizer = this.summarizers.get(cName);
    if (summarizer === undefined) throw { message: EXCEPTION_COUNTER_NOT_EXIST };
    const summary = summarizer.getSummary();
    const vals = summary.values();
    let element = vals.next();
    const result = [];
    while (!element.done) {
      const hourSummary = element.value;
      const sum = hourSummary.avgs.reduce(summarizer.sumReducer);
      result.push({ hour: hourSummary.hour, avg: sum / hourSummary.getLength() });
      element = vals.next();
    }
    return result;
  }

  deleteCounter(name: string) {
    if (name !== this.DEFAULT_NAME) {
      const c = this.counters.get(name);
      if (c) {
        c.destroy();
        this.counters.delete(name);
      }
    } else {
      throw { message: EXCEPTION_DELETE_DEFAULT_COUNTER };
    }
    const s = this.summarizers.get(name);
    if (s) {
      s.destroy();
      this.summarizers.delete(name);
    }
  }

  destroyAll() {
    this.counters.forEach((c) => {
      c.destroy();
    });
    this.summarizers.forEach((s) => {
      s.destroy();
    });
  }

  pause(name?: string) {
    const c = this.getCounter(name);
    c.recording = false;
  }

  resume(name?: string) {
    const c = this.getCounter(name);
    c.recording = true;
  }
}
