namespace Karaf {

    export class FeatureRepository {

      features: Feature[] = [];

      constructor(public name: string, public uri: string) {
      }
    }
  }