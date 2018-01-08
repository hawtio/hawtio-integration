namespace SpringBoot {

  export class Health {

    constructor(public status: HealthStatus, public items: HealthItem[]) {
    }

  }

  export type HealthStatus = 'FATAL' | 'DOWN' | 'OUT OF SERVICE' | 'UNKNOWN' | 'UP';

  export interface HealthItem {
    title: string;
    info: string[];
  }
 
}