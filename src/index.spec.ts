import { JCounter } from './index';
import { Summarizer } from './summarizer';
import * as _ from 'underscore';

jest.setTimeout(3600000);

class Utils {
  constructor() {}

  /**
   * Execute the function fun() in ts milliseconds
   * @param fun : Function
   * @param ts : number
   */
  execIn(fun: Function, ts: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(fun());
      }, ts);
    });
  }
}

const utils = new Utils();

describe('Counter initiation', () => {
  test('Counter object should create successfully', () => {
    const jc = new JCounter();
    expect.assertions(1);
    expect(jc).toBeTruthy();
    jc.destroyAll();
  });
});

describe('Counter creation', () => {
  const jc = new JCounter();

  afterAll(() => {
    jc.destroyAll();
  });

  test('Counter should be created by default', () => {
    expect.assertions(2);
    const lastCount = jc.getLastCount();
    expect(lastCount).toEqual(0);
    try {
      const lastCount1 = jc.getLastCount('counter1');
      console.log(lastCount1);
    } catch (e) {
      expect(e.message).toEqual('The counter not exist');
    }
  });

  test('Counter should be created with name', () => {
    jc.createCounter('counter1');
    const lastCount1 = jc.getLastCount('counter1');
    expect(lastCount1).toEqual(0);
  });
});

describe('Counter can increase', () => {
  test('Default counter can add one', () => {
    const jc = new JCounter();
    jc.addOne();
    const lastCount = jc.getLastCount();
    expect(lastCount).toEqual(1);
    jc.destroyAll();
  });

  test('Default counter can add two', () => {
    const jc = new JCounter();
    jc.add(2);
    const lastCount = jc.getLastCount();
    expect(lastCount).toEqual(2);
    jc.destroyAll();
  });

  test('Named counter can add one', () => {
    const jc = new JCounter();
    jc.createCounter('counter1');
    jc.addOne('counter1');
    const lastCount = jc.getLastCount('counter1');
    expect(lastCount).toEqual(1);
    jc.destroyAll();
  });

  test('Named counter can add two', () => {
    const jc = new JCounter();
    jc.createCounter('counter1');
    jc.add(2, 'counter1');
    const lastCount = jc.getLastCount('counter1');
    expect(lastCount).toEqual(2);
    jc.destroyAll();
  });
});

describe('Counter can decrease', () => {
  test('Default counter can drop one', () => {
    const jc = new JCounter();
    jc.dropOne();
    const lastCount = jc.getLastCount();
    expect(lastCount).toEqual(-1);
    jc.destroyAll();
  });

  test('Default counter can drop two', () => {
    const jc = new JCounter();
    jc.drop(2);
    const lastCount = jc.getLastCount();
    expect(lastCount).toEqual(-2);
    jc.destroyAll();
  });

  test('Named counter can drop one', () => {
    const jc = new JCounter();
    jc.createCounter('counter1');
    jc.dropOne('counter1');
    const lastCount = jc.getLastCount('counter1');
    expect(lastCount).toEqual(-1);
    jc.destroyAll();
  });

  test('Named counter can drop two', () => {
    const jc = new JCounter();
    jc.createCounter('counter1');
    jc.drop(2, 'counter1');
    const lastCount = jc.getLastCount('counter1');
    expect(lastCount).toEqual(-2);
    jc.destroyAll();
  });
});

describe('Counter can get the count at a timestamp', () => {
  const jc = new JCounter();
  const currentTs = new Date().getTime();
  jc.createCounter('counter1');
  const adds = () => {
    jc.addOne();
    jc.addOne('counter1');
  };

  beforeAll(async () => {
    await utils.execIn(adds, 2000);
    await utils.execIn(() => {}, 2000);
  });

  afterAll(async () => {
    // jc.destroyAll();
  });

  test('Count is 0 before begin ts', async () => {
    const count0 = jc.getCountAt(currentTs);
    const count1 = jc.getCountAt(currentTs, 'counter1');
    expect(count0).toEqual(0);
    expect(count1).toEqual(0);
  });

  test('Count is 0 before 1st count', async () => {
    const count0 = jc.getCountAt(currentTs + 1000);
    const count1 = jc.getCountAt(currentTs + 1000, 'counter1');
    expect(count0).toEqual(0);
    expect(count1).toEqual(0);
  });

  test('Count is 1 after 1st count', async () => {
    const count0 = jc.getCountAt(currentTs + 3000);
    const count1 = jc.getCountAt(currentTs + 3000, 'counter1');
    expect(count0).toEqual(1);
    expect(count1).toEqual(1);
  });
});

describe('Counter can get peak value for given period', () => {
  const jc = new JCounter();
  const currentTs = new Date().getTime();
  jc.createCounter('counter1');
  const c = jc.getCounter();
  const add = () => {
    jc.addOne();
    jc.addOne('counter1');
  };
  const drop = () => {
    jc.dropOne();
    jc.dropOne('counter1');
  };
  const idle = () => {};

  beforeAll(async () => {
    /**
     * Test data is below.
     *
     *  val 1  2  3  4  5  6  5  4  3  2
     *      |--|--|--|--|--|--|--|--|--|---->
     *  idx 0  1  2  3  4  5  6  7  8  9
     *
     *  each "-" stands for 250 ms
     */
    await utils.execIn(add, 500); //0
    await utils.execIn(add, 500); //2
    await utils.execIn(add, 500); //2
    await utils.execIn(add, 500); //4
    await utils.execIn(add, 500); //4
    await utils.execIn(add, 500); //6
    await utils.execIn(drop, 500); //6
    await utils.execIn(drop, 500); //4
    await utils.execIn(drop, 500); //8
    await utils.execIn(drop, 500); //2
    await utils.execIn(idle, 1000);
  });

  afterAll(() => {
    jc.destroyAll();
  });

  test('peak is 0 if expected period is earlier than first record', async () => {
    const peak0 = jc.getPeak(currentTs - 1000, currentTs);
    expect(peak0).toEqual(0);
  });

  test('peak is last count if expected period is later than last record', async () => {
    const lastAt = jc.getLastAt();
    const peak1 = jc.getPeak(lastAt + 1, lastAt + 12000);
    expect(peak1).toEqual(2);
  });

  test('peak is the biggest count during the period', async () => {
    const peak1 = jc.getPeak(c.firstAt - 10, c.lastAt);
    expect(peak1).toEqual(6);
    const peak2 = jc.getPeak(c.firstAt, c.lastAt);
    expect(peak2).toEqual(6);
    const peak3 = jc.getPeak(c.firstAt, c.keys[2]);
    expect(peak3).toEqual(3);
    const peak4 = jc.getPeak(c.keys[2] + 10, c.keys[3] + 10);
    expect(peak4).toEqual(4);
    const peak5 = jc.getPeak(c.keys[4] + 10, c.keys[8] + 10);
    expect(peak5).toEqual(6);
    const peak6 = jc.getPeak(c.keys[7] + 10, c.keys[9] + 10);
    expect(peak6).toEqual(4);
  });

  test('peak is the biggest count by default', async () => {
    const peak1 = jc.getPeak();
    expect(peak1).toEqual(6);
  });
});

describe('Counter can get average value for given period', () => {
  const jc = new JCounter();
  const c = jc.getCounter();
  // const currentTs = new Date().getTime();
  jc.createCounter('counter1');
  const add = () => {
    jc.addOne();
    jc.addOne('counter1');
  };
  const drop = () => {
    jc.dropOne();
    jc.dropOne('counter1');
  };
  const idle = () => {};

  beforeAll(async () => {
    /**
     * Test data is below.
     *
     *  val 1  2  3  4  5  4  3  2  1
     *      |--|--|--|--|--|--|--|--|---->
     *  idx 0  1  2  3  4  5  6  7  8
     *
     *  each "-" stands for 250 ms
     */
    await utils.execIn(add, 500);
    await utils.execIn(add, 500);
    await utils.execIn(add, 500);
    await utils.execIn(add, 500);
    await utils.execIn(add, 500);
    await utils.execIn(drop, 500);
    await utils.execIn(drop, 500);
    await utils.execIn(drop, 500);
    await utils.execIn(drop, 500);
    await utils.execIn(idle, 1000);
  });

  afterAll(() => {
    jc.destroyAll();
  });

  test('Average is 0 if expected period is earlier than first record', async () => {
    const count1 = jc.getAvg(c.firstAt - 500, c.firstAt - 1);
    expect(count1).toEqual(0);
  });

  test('Average is last count if expected period is later than last record', async () => {
    const lastAt = jc.getLastAt();
    const count1 = jc.getAvg(lastAt + 1, lastAt + 12000);
    expect(count1).toEqual(1);
  });

  test('Average is calculated correctly', async () => {
    const count1 = jc.getAvg(c.firstAt, c.keys[1]);
    expect(count1.toFixed(2)).toEqual(Number(1).toFixed(2));

    const count2 = jc.getAvg(c.firstAt, c.keys[2]);
    expect(count2.toFixed(2)).toEqual(Number(1.5).toFixed(2));

    const count3 = jc.getAvg(c.keys[3], c.keys[6]);
    expect(count3.toFixed(2)).toEqual(Number(4.33).toFixed(2));

    const count4 = jc.getAvg(c.firstAt - 5500, c.keys[3]);
    expect(count4.toFixed(2)).toEqual(Number(2).toFixed(2));

    const count5 = jc.getAvg(c.keys[6], c.lastAt + 1500);
    expect(count5.toFixed(2)).toEqual(Number(1.6).toFixed(2));

    const count6 = jc.getAvg(c.keys[4] - 250, c.keys[5] + 250);
    expect(count6.toFixed(2)).toEqual(Number(4.5).toFixed(2));
  });

  test('Average is calculated correctly for default parameters', async () => {
    const cms = new Date().getTime();
    const count1 = jc.getAvg();
    const periodof1 = cms - c.lastAt;
    const expCount = (24 * 500 + periodof1) / (8 * 500 + periodof1);
    expect(count1.toFixed(1)).toEqual(expCount.toFixed(1)); // there is difference between the cms and the real ms inside jc.getAvg
  });
});

describe('Counter work correctly on cut', () => {
  const jc = new JCounter();
  const c = jc.getCounter();
  // const currentTs = new Date().getTime();
  jc.createCounter('counter1');
  const add = () => {
    jc.addOne();
    jc.addOne('counter1');
  };
  const drop = () => {
    jc.dropOne();
    jc.dropOne('counter1');
  };
  const idle = () => {};

  beforeAll(async () => {
    /**
     * Test data is below.
     *
     *  val 1  2  1  0  1  2  3  4  5  4  3  2  1
     *      |--|--|--|--|--|--|--|--|--|--|--|--|---->
     *  idx 0  1  2  3  4  5  6  7  8  9  10 11 12
     *
     *  each "-" stands for 250 ms
     */
    await utils.execIn(add, 500);
    await utils.execIn(add, 500);
    await utils.execIn(drop, 500);
    await utils.execIn(drop, 500);
    await utils.execIn(add, 500);
    await utils.execIn(add, 500);
    await utils.execIn(add, 500);
    await utils.execIn(add, 500);
    await utils.execIn(add, 500);
    await utils.execIn(drop, 500);
    await utils.execIn(drop, 500);
    await utils.execIn(drop, 500);
    await utils.execIn(drop, 500);
    await utils.execIn(idle, 1000);
  });

  afterAll(() => {
    jc.destroyAll();
  });

  test('Nothing happens when cut at or before first record', async () => {
    const tail = jc.cut(c.firstAt);
    expect(tail).toBeTruthy();
    expect(tail.cutAt).toEqual(c.firstAt);
    expect(tail.cutKeys).toBeFalsy();
    expect(tail.cutValues).toBeFalsy();
    expect(c.length()).toEqual(13);
  });

  test('Cut works correctly when cut within record period', async () => {
    const cutAt = c.keys[1] + 250;
    const expectedTail = {
      cutAt: cutAt,
      cutKeys: [c.keys[0], c.keys[1]],
      cutValues: [1, 2],
    };
    const tail = jc.cut(cutAt);
    expect(tail).toBeTruthy();
    expect(tail).toEqual(expectedTail);
    expect(c.length()).toEqual(12);
    expect(c.firstAt).toEqual(cutAt);
  });

  test('Cut works correctly when cut at a record key', async () => {
    const cutAt = c.keys[3];
    const expectedTail = {
      cutAt: cutAt,
      cutKeys: [c.keys[0], c.keys[1], c.keys[2]],
      cutValues: [2, 1, 0],
    };
    const tail = jc.cut(cutAt);
    expect(tail).toBeTruthy();
    expect(tail).toEqual(expectedTail);
    expect(c.length()).toEqual(9);
    expect(c.firstAt).toEqual(cutAt);
    expect(c.values).toEqual([1, 2, 3, 4, 5, 4, 3, 2, 1]);
  });

  test('Average is calculated correctly after cut', async () => {
    const count1 = jc.getAvg(c.firstAt, c.keys[1]);
    expect(count1.toFixed(2)).toEqual(Number(1).toFixed(2));

    const count2 = jc.getAvg(c.firstAt, c.keys[2]);
    expect(count2.toFixed(2)).toEqual(Number(1.5).toFixed(2));

    const count3 = jc.getAvg(c.keys[3], c.keys[6]);
    expect(count3.toFixed(2)).toEqual(Number(4.33).toFixed(2));

    const count4 = jc.getAvg(c.firstAt - 5500, c.keys[3]);
    expect(count4.toFixed(2)).toEqual(Number(2).toFixed(2));

    const count5 = jc.getAvg(c.keys[6], c.lastAt + 1500);
    expect(count5.toFixed(2)).toEqual(Number(1.6).toFixed(2));

    const count6 = jc.getAvg(c.keys[4] - 250, c.keys[5] + 250);
    expect(count6.toFixed(2)).toEqual(Number(4.5).toFixed(2));
  });

  test('Peak is calculated correctly after cut', async () => {
    const peak = jc.getPeak();
    expect(peak).toEqual(5);
  });

  test('All records are cut when cut after lastAt', async () => {
    const cutAt = c.lastAt + 100;
    const expectedTail = {
      cutAt: cutAt,
      cutKeys: c.keys,
      cutValues: c.values,
    };
    const tail = jc.cut(cutAt);
    expect(tail).toBeTruthy();
    expect(tail).toEqual(expectedTail);
    expect(c.length()).toEqual(1);
    expect(c.firstAt).toEqual(cutAt);
    expect(c.lastAt).toEqual(cutAt);
    expect(c.values).toEqual([1]);
  });
});

describe('Summarizer can be triggered', () => {
  const jc = new JCounter();
  const s = jc.triggerSummarizer(60000);
  // const s = jc.getSummarizer();
  const muniteSummary: any[] = [];
  const hourSummary: any[] = [];
  let hour: Date;
  s.on('beforeSummarize', (summary) => {
    console.log('beforeSummarize triggered.');
    console.log(summary);
  });

  s.on('afterSummarize', (summary) => {
    console.log('afterSummarize triggered.');
    console.log(summary);
  });

  s.on('hourSummary', (summary) => {
    console.log('hourSummary triggered.');
    hourSummary.push(summary);
  });

  s.on('minuteSummary', (summary) => {
    console.log('minuteSummary triggered.');
    muniteSummary.push(summary);
  });
  // const c = jc.getCounter();
  // const currentTs = new Date().getTime();
  const add = () => {
    jc.addOne();
  };
  const drop = () => {
    jc.dropOne();
  };
  const idle = () => {};

  beforeAll(async () => {
    /**
     * Test data is below.
     *
     *  val 1  2  1  0  1  2  3  4  5  4  3  2  1
     *      |--|--|--|--|--|--|--|--|--|--|--|--|---->
     *  idx 0  1  2  3  4  5  6  7  8  9  10 11 12
     *
     *  each "-" stands for 250 ms
     */

    // let now = new Date();
    // if (now.getMinutes() >= 59){
    //     await utils.execIn(idle, 60000);
    // }
    // if (now.getSeconds() >= 50){
    //     await utils.execIn(idle, 10000);
    // }
    hour = new Date();
    hour.setMilliseconds(0);
    hour.setSeconds(0);
    hour.setMinutes(0);
    await utils.execIn(add, 500);
    await utils.execIn(add, 500);
    await utils.execIn(add, 500);
    await utils.execIn(add, 500);
    await utils.execIn(add, 500);
    await utils.execIn(drop, 500);
    await utils.execIn(drop, 500);
    await utils.execIn(drop, 500);
    await utils.execIn(drop, 500);
    await utils.execIn(idle, 1000);
    await utils.execIn(idle, 130000);
  });

  afterAll(() => {
    jc.destroyAll();
  });

  test('Summarizer is created', () => {
    expect(s).toBeInstanceOf(Summarizer);
    expect(s.getSummary()).toBeTruthy();
  });

  test('Peak on minute level is correct', async () => {
    const peak = jc.getMinutePeak();
    expect(peak).toBeTruthy();
    expect(peak.length).toEqual(1);
    expect(peak[0]).toBeTruthy();
    expect(peak[0].hour).toEqual(hour.getTime());
    const peaks = peak[0].peaks;
    expect(_.max(peaks)).toEqual(5);
  });

  test('Peak on hour level is correct', async () => {
    const peak = jc.getHourPeak();
    expect(peak).toBeTruthy();
    expect(peak.length).toEqual(1);
    expect(peak[0]).toBeTruthy();
    expect(peak[0].hour).toEqual(hour.getTime());
    const p = peak[0].peak;
    expect(p).toEqual(5);
  });

  test('Average on minute level is correct', async () => {
    const avgs = jc.getMinuteAvg();
    expect(avgs).toBeTruthy();
    expect(avgs.length).toEqual(1);
    expect(avgs[0]).toBeTruthy();
    expect(avgs[0].hour).toEqual(hour.getTime());
    const avg = avgs[0].avgs;
    expect(_.max(avg)).toBeGreaterThan(0);
  });

  test('Average on hour level is correct', async () => {
    const avgs = jc.getHourAvg();
    expect(avgs).toBeTruthy();
    expect(avgs.length).toEqual(1);
    expect(avgs[0]).toBeTruthy();
    expect(avgs[0].hour).toEqual(hour.getTime());
    const avg = avgs[0].avg;
    expect(avg).toBeGreaterThan(0);
  });

  test('Munite summary event works correctly', async () => {
    const length = muniteSummary.length;
    const expPeak = muniteSummary.reduce((prev, curr) => {
      return { peak: Math.max(prev.peak, curr.peak) };
    });
    const expAvg = muniteSummary.reduce((prev, curr) => {
      return { avg: Math.max(prev.avg, curr.avg) };
    });
    // console.log(muniteSummary);
    expect(length).toBeGreaterThan(0);
    expect(muniteSummary[0]).toBeTruthy();
    expect(muniteSummary[0].hour).toEqual(hour.getTime());
    expect(muniteSummary[0].minute).toEqual(0);
    expect(muniteSummary[0].avg).toEqual(0);
    expect(muniteSummary[0].peak).toEqual(0);
    expect(muniteSummary[length - 1]).toBeTruthy();
    expect(muniteSummary[length - 1].hour).toEqual(hour.getTime());
    expect(muniteSummary[length - 1].minute).toEqual(length - 1);
    expect(muniteSummary[length - 1].avg).toBeGreaterThanOrEqual(0);
    expect(muniteSummary[length - 1].peak).toBeGreaterThanOrEqual(0);
    expect(expPeak.peak).toEqual(5);
    expect(expAvg.avg).toBeGreaterThan(1);
  });

  test('Hour summary event works correctly', async () => {
    // const length = hourSummary.length;
    // const expPeak = hourSummary.reduce((prev, curr) => {
    //   return { peak: Math.max(prev.peak, curr.peak) };
    // });
    // const expAvg = muniteSummary.reduce((prev, curr) => {
    //   return { avg: Math.max(prev.avg, curr.avg) };
    // });
    // // console.log(muniteSummary);
    // expect(length).toBeGreaterThan(0);
    // expect(muniteSummary[0]).toBeTruthy();
    // expect(muniteSummary[0].hour).toEqual(hour.getTime());
    // expect(muniteSummary[0].minute).toEqual(0);
    // expect(muniteSummary[0].avg).toEqual(0);
    // expect(muniteSummary[0].peak).toEqual(0);
    // expect(muniteSummary[length - 1]).toBeTruthy();
    // expect(muniteSummary[length - 1].hour).toEqual(hour.getTime());
    // expect(muniteSummary[length - 1].minute).toEqual(length - 1);
    // expect(muniteSummary[length - 1].avg).toBeGreaterThanOrEqual(0);
    // expect(muniteSummary[length - 1].peak).toBeGreaterThanOrEqual(0);
    // expect(expPeak.peak).toEqual(5);
    // expect(expAvg.avg).toBeGreaterThan(1);
  });
});
