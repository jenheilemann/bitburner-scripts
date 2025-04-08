/** @param {NS} ns */
export async function main(ns) {
  ns.tprint("This is purely a helper class, don't run this file by itself.")
}

const JOB_TYPES = {
  PREPPING : 'prepping',
  HACKING: 'hacking'
}

export class BatchJob {
  constructor(data) {
    this.id = data.id
    this.time = data.time
    this.type = JOB_TYPES[data.type.toUpperCase()]
    this.target = data.target
    this.start = data.start
    this.end = data.end
  }

  /**
   * @returns {boolean} has this batch fully completed?
   */
  isExpired() {
    return this.end < performance.now()
  }

  /**
   * @returns {boolean} are we currently within the error window while 
   *                    this batch is completing?
   */
  isInsideErrorWindow() {
    return this.start < performance.now() && performance.now() < this.end
  }

  /**
   * @returns {boolean} is this batch prepping the server for batches?
   */
  isPrepping() {
    return this.type == JOB_TYPES.PREPPING
  }

  toObj() {
    return {
              id: this.id, 
              time: this.time, 
              type: this.type, 
              target: this.target,
              start: this.start,
              end: this.end,
            }
  }
}

export class BatchDataQueue {
  /**
   * @param {array} batchList - list of batches that might be running
   */
  constructor(batchList) {
    this.batchList = batchList.map(data => new BatchJob(data))
  }

  /**
   * @returns {BatchJob} data object that handles what we know about the batch
   */
  nextBatch() {
    return this.batchList[0]
  }

  /**
   * @returns {boolean} are there any batches running right now?
   */
  isEmpty() {
    if (this.batchList.length  == 0 ) { return true }
    return false
  }

  /**
   * @returns {null} 
   */
  discardExpiredBatchData() {
    this.batchList = this.batchList.filter(job => !job.isExpired())
  }

  /**
   * @returns {obj}
   */
  toObj() {
    return this.batchList.map(job => job.toObj())
  }

  /**
   * @param {string} target
   * @returns {string}
   */
  anyInsideErrorWindow(target) {
    return this.batchList.some(job => job.target == target && job.isInsideErrorWindow())
  }

  /**
   * @returns {string}
   */
  hasPreppingScript(hostname) {
    return this.batchList.some(job => job.isPrepping() && job.target == hostname)
  }

  /**
   * Add a new batchJob to the list
   * @returns {null} 
   */
  addNewJob(start, end, id, time, type, target) {
    this.batchList.push(new BatchJob({start: start, end: end, id: id, time: time, type: type, target: target}))
  }
}
