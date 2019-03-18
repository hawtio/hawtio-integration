namespace Runtime {

  export enum MetricType {
    JVM = "JVM",
    SYSTEM = "System",
    SPRING_BOOT = "Spring Boot"
  }

  export class Metric {
    constructor(public name:string, public value: any, public unit?: string) {
    }

    getDescription(): string {
      return this.name + ": " + this.value + (this.unit != null ? " " + this.unit : "");
    }
  }

  export class UtilizationMetric extends Metric {
    constructor(public name:string, public value: any, public available: any, public unit: string) {
      super(name, value, unit);
    }

    getDescription(): string {
      let unitDescription = (this.unit != null ? ' ' + this.unit : '');
      let description = this.name + ": " + this.value;
      description += " " + unitDescription + " of";
      description += " " + this.available + unitDescription;
      return description;
    }
  }

  export class MetricGroup {

    constructor(public type: MetricType, public metrics: Metric[] = []) {
    }

    updateMetrics(metrics: Metric[]) {
      metrics.forEach(metric => {
        let index: number = this.metrics.map((m) => { return m.name; }).indexOf(metric.name);
        if (index === -1) {
          this.metrics.push(metric);
        } else {
          this.metrics[index] = metric;
        }
      });
    }
  }
}
