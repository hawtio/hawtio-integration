namespace SpringBoot {

  export class Health {

    constructor(public global: HealthCard, public details: HealthCard[]) {
    }

  }

  export interface HealthCard {
    title: string;
    iconClass: string;
    info?: string[];
  }

}
