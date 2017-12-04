namespace Karaf {

    export class FeatureRepository {

      features: Feature[] = [];
      dependencies: string[] = [];

      constructor(public name: string, public uri: string) {
      }
    }
  }