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

      if (trace.info) {
        this.method = trace.info.method;
        this.path = trace.info.path;
        this.info = trace.info;

        if (trace.info.timeTaken) {
          this.timeTaken = parseInt(trace.info.timeTaken);
        }

        if (trace.info.headers.response) {
          this.httpStatusCode = parseInt(this.info.headers.response.status);
        }
      } else if (trace.request) {
        this.method = trace.request.method;
        this.path = new URL(trace.request.uri).pathname;
        this.info = trace;

        if (trace.timeTaken) {
          this.timeTaken = parseInt(trace.timeTaken);
        }

        if (trace.response && trace.response.status) {
          this.httpStatusCode = parseInt(trace.response.status);
        }
      }
    }
  }
}
