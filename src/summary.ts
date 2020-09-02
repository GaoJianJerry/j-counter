export class HourSummary {
  peaks: number[] = [];
  avgs: number[] = [];
  hour: number;

  constructor(hour: number) {
    this.hour = hour;
  }

  setPeak(minute: number, peak: number) {
    this.peaks[minute] = peak;
  }

  setAvg(minute: number, avg: number) {
    this.avgs[minute] = avg;
  }

  getLength() {
    return this.peaks.length;
  }
}
