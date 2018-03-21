namespace Camel {

  export class TypeConvertersStatistics {

    public AttemptCounter: number;
    public HitCounter: number;
    public MissCounter: number;
    public FailedCounter: number;

    constructor(object) {
      angular.extend(this, object);
    }

    reset() {
      this.AttemptCounter = 0;
      this.HitCounter = 0;
      this.MissCounter = 0;
      this.FailedCounter = 0;
    }
  }

}
