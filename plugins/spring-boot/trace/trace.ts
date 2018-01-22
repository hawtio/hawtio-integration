namespace SpringBoot {

  export class Trace {
    timestamp: string
    method: string
    path: string
    httpStatusCode: number
    timeTaken: number
    info: any

    constructor(trace) {
      this.timestamp = trace.timestamp;
      this.method = trace.info.method;
      this.path = trace.info.path;
      this.info = trace.info;

      if (this.info.timeTaken) {
        this.timeTaken = parseInt(this.info.timeTaken);
      }

      if (this.info.headers.response) {
        this.httpStatusCode = parseInt(this.info.headers.response.status);
      }
    }  
  }
}