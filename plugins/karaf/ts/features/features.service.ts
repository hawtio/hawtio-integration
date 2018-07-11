/// <reference path="feature.ts"/>
/// <reference path="feature-repository.ts"/>

namespace Karaf {

    export class FeaturesService {

      public static MBEAN: string = 'org.apache.karaf:type=feature,name=root';

      constructor(private jolokiaService: JVM.JolokiaService, private workspace: Jmx.Workspace) {
        'ngInject';
      }

      getFeatureRepositories(): ng.IPromise<FeatureRepository[]> {
        return this.jolokiaService.getMBean(FeaturesService.MBEAN)
        .then(value => {
          const repositories: FeatureRepository[] = [];
          angular.forEach(value['Repositories'], (repository) => {
            const featureRepository: FeatureRepository = new FeatureRepository(repository.Name, repository.Uri)
            featureRepository.dependencies = repository.Repositories;

            if (!repository.Blacklisted) {
              angular.forEach(repository.Features, (item) => {
                angular.forEach(item, (featureInfo, version) => {
                  if (!value['Features'][featureInfo.Name][version].Blacklisted) {
                    const feature: Feature = new Feature(
                      featureInfo.Name,
                      featureInfo.Version,
                      value['Features'][featureInfo.Name][version].Installed,
                      value['Features'][featureInfo.Name][version].Required,
                      repository.Name,
                      repository.Uri
                    );
                    featureRepository.features.push(feature);
                  }
                });
              });
              repositories.push(featureRepository);
            }
          });

          return repositories.sort((a,b) => {
            return this.sortByName(a,b);
          });
        })
      }

      installFeature(feature: Feature): ng.IPromise<string> {
        return this.jolokiaService.execute(FeaturesService.MBEAN, 'installFeature(java.lang.String, java.lang.String)', feature.name, feature.version)
          .catch((error: string) => {
            // Ignore server error caused by pax-web restarting
            if (error.indexOf('socket hang up') === -1) {
              throw error;
            }
          });
      }

      uninstallFeature(feature: Feature): ng.IPromise<string> {
        return this.jolokiaService.execute(FeaturesService.MBEAN, 'uninstallFeature(java.lang.String, java.lang.String)', feature.name, feature.version)
          .catch((error: string) => {
            // Ignore server error caused by pax-web restarting
            if (error.indexOf('socket hang up') === -1) {
              throw error;
            }
          });
    }

      addFeatureRepository(repositoryUri: string): ng.IPromise<string> {
        return this.jolokiaService.execute(FeaturesService.MBEAN, 'addRepository(java.lang.String)', repositoryUri);
      }

      removeFeatureRepository(repository: FeatureRepository): ng.IPromise<string> {
        return this.jolokiaService.execute(FeaturesService.MBEAN, 'removeRepository(java.lang.String)', repository.uri);
      }

      hasInvokeRightsForName(name: string) {
        return this.workspace.hasInvokeRightsForName(FeaturesService.MBEAN, name);
      }

      sortByName(a,b): number {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      }
    }
}
