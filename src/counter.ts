import * as _ from 'underscore';

export class Counter {
  name: string;
  // counts: Map<number, number> = new Map();
  keys: number[] = [];
  values: number[] = [];
  lastCount = 0;
  bornAt: number;
  firstAt: number;
  lastAt: number;
  recording = true;

  constructor(name: string) {
    this.name = name;
    this.bornAt = new Date().getTime();
    // this.trigger();
  }

  destroy() {
    // clearInterval(this.sumaryLoop);
    delete this.keys;
    delete this.values;
    delete this.lastCount;
    delete this.firstAt;
    delete this.lastAt;
    // delete this.sumaryLoop;
    // delete this.summary;
  }

  has(key: number) {
    return this.keys.includes(key);
  }

  get(key: number) {
    return this.values[this.keys.indexOf(key)];
  }

  set(key: number, value: number) {
    this.keys.push(key);
    this.values.push(value);
  }

  /**
   * increase the count number
   * @param pace : number to increase. can be positive or nagetive number.
   */
  increase(pace?: number): boolean {
    if (!this.recording) return false;
    this.lastCount = this.lastCount + (pace || 1);
    this.lastAt = new Date().getTime();
    if (!this.firstAt) this.firstAt = this.lastAt;
    this.set(this.lastAt, this.lastCount);
    return true;
  }

  getName(): string {
    return this.name;
  }

  /**
   * Gets the count number at the given ts, or get the last count
   * @param ts
   */
  getCountAt(ts?: number) {
    if (!ts || ts >= this.lastAt) return this.lastCount;
    if (ts < this.firstAt) return 0;

    let idx = -1;
    for (const key of this.keys) {
      if (key > ts) {
        break;
      }
      idx++;
    }
    return idx > -1 ? this.values[idx] : 0;
  }

  /**
   * Get the peak count during a time period
   * @param beginAt : timestamp
   * @param endAt : timestamp
   */
  getPeak(beginAt?: number, endAt?: number) {
    if (!this.firstAt) return 0; // No record yet
    if (beginAt !== undefined && beginAt === endAt) return this.getCountAt(beginAt);
    if (beginAt !== undefined && endAt !== undefined && beginAt > endAt) return NaN;
    const calSince = beginAt || 0;
    const calTill = endAt || this.lastAt + 1;
    if (calSince >= this.lastAt) {
      return this.lastCount; // if the expected period is later than the last record, the peek value should be the last count
    } else if (calTill < this.firstAt) {
      return 0;
    }

    let findSince = -1;
    let findTill = -1;
    for (const key of this.keys) {
      if (key <= calSince) {
        findSince++;
        findTill++;
      } else if (key <= calTill) {
        findTill++;
      } else if (key > calTill) {
        break;
      }
    }
    if (findSince === -1) findSince = 0; // in case endAt is larger than the last record
    if (findTill === -1) findTill = this.keys.length - 1; // in case endAt is larger than the last record

    const values = this.values.slice(findSince, findTill + 1);
    if (values.length === 0) return 0;
    return _.max(values);
  }

  /**
   * Calculate the average count during given period.
   * @param beginAt : Timestamp, defaults to 0
   * @param endAt : Timestamp, defaults to current timestamp
   *
   * Description:
   * Formula: y = (Σ (record * duration)) / total_duration
   * Where:
   *  "record" stands for each count recorded.
   *  "duration" stands for milliseconds a count kept
   *  "total_duration" stands for millisecounds between the timestamp of calculation start and endAt./
   *  The "the timestamp of calculation start" is the max(beginAt, The 1st record timestamp). /
   *  In other words, the time before the 1st record is ignored.
   */
  getAvg(beginAt?: number, endAt?: number) {
    if (!this.firstAt) return 0; // No record yet
    if (beginAt !== undefined && beginAt === endAt) return this.getCountAt(beginAt);
    if (beginAt !== undefined && endAt !== undefined && beginAt > endAt) return NaN; // Invalid parameters

    const calSince = beginAt || 0; // MS since
    const calTill = endAt || new Date().getTime(); // MS till
    if (calSince >= this.lastAt) {
      return this.lastCount; // if the expected period is later than the last record, the peek value should be the last count
    } else if (calTill < this.firstAt) {
      return 0;
    }

    let findSince = -1; // Index since
    let findTill = -1; // Index till
    for (const key of this.keys) {
      if (key <= calSince) {
        findSince++;
        findTill++;
      } else if (key <= calTill) {
        findTill++;
      } else if (key > calTill) {
        break;
      }
    }
    if (findSince === -1) findSince = 0; // in case endAt is larger than the last record
    if (findTill === -1) findTill = this.keys.length - 1; // in case endAt is larger than the last record

    const values = this.values.slice(findSince, findTill + 1);
    if (values.length === 0) return 0; // should never happen
    const firstKey = Math.max(calSince, this.keys[findSince], this.firstAt); // handle the case where beginAt is early than firstAt
    const restKeys = this.keys.slice(findSince + 1, findTill + 1);
    if (restKeys.length === 0) return values[0];

    const totalTs = calTill - firstKey;
    let totalCount = 0;
    let lastKey = firstKey;
    let idx = 0;
    for (const key of restKeys) {
      totalCount += (key - lastKey) * values[idx++];
      lastKey = key;
    }
    totalCount += (calTill - lastKey) * values[idx];
    const result = totalCount / totalTs;
    return result;
  }

  /**
   * Cut the records with a given timestamp
   * @param cutAt : number
   */
  cut(cutAt?: number) {
    let cutKeys;
    let cutValues;
    let doAppend = true;
    const cms = cutAt || new Date().getTime();
    if (!this.firstAt) return { cutAt: cms }; // No record yet
    if (cms <= this.firstAt) return { cutAt: cms }; // Nothing happens
    if (cms >= this.lastAt) {
      cutKeys = this.keys;
      cutValues = this.values;
      this.keys = [];
      this.values = [];
      this.keys.push(cms);
      this.values.push(this.lastCount);
      this.firstAt = cms;
      this.lastAt = cms;
    } else {
      // cutAt is between this.firstAt and this.lastAt
      let cutIdx = -1; // Last index to cut
      for (const key of this.keys) {
        if (key < cms) {
          cutIdx++;
        } else if (key === cms) {
          doAppend = false;
          break;
        } else {
          break;
        }
      }
      if (cutIdx === -1) return { cutAt: cms }; // Nothing happens
      // const values = this.values.slice(findSince, findTill + 1);
      const oldKeys = this.keys;
      const oldValues = this.values;
      cutKeys = oldKeys.slice(0, cutIdx + 1);
      cutValues = oldValues.slice(0, cutIdx + 1);
      this.keys = [];
      this.values = [];
      if (doAppend) {
        this.keys.push(cms); // what if cms === next index?
        this.values.push(oldValues[cutIdx]);
      }
      this.keys = this.keys.concat(oldKeys.slice(cutIdx + 1));
      this.values = this.values.concat(oldValues.slice(cutIdx + 1));
      this.firstAt = cms;
      // this.firstAt = cms;
    }

    return {
      cutAt: cms,
      cutKeys,
      cutValues,
    };
  }

  length() {
    return this.keys.length;
  }
}
