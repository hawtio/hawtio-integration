/// <reference path="feature.ts"/>
/// <reference path="feature-repository.ts"/>

namespace Karaf {

    export class FeaturesService {

      constructor(private jolokiaService: JVM.JolokiaService, private workspace: Jmx.Workspace) {
        'ngInject';
      }

      getFeatureRepositories(mbean: string): ng.IPromise<FeatureRepository[]> {
        return this.jolokiaService.getMBean(mbean)
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

      installFeature(mbean:string, feature: Feature): ng.IPromise<string> {
        return this.jolokiaService.execute(mbean, 'installFeature(java.lang.String, java.lang.String)', feature.name, feature.version)
          .catch((error: string) => {
            // Ignore server error caused by pax-web restarting
            if (error.indexOf('socket hang up') === -1) {
              throw error;
            }
          });
      }

      uninstallFeature(mbean:string, feature: Feature): ng.IPromise<string> {
        return this.jolokiaService.execute(mbean, 'uninstallFeature(java.lang.String, java.lang.String)', feature.name, feature.version)
          .catch((error: string) => {
            // Ignore server error caused by pax-web restarting
            if (error.indexOf('socket hang up') === -1) {
              throw error;
            }
          });
    }

      addFeatureRepository(mbean:string, repositoryUri: string): ng.IPromise<string> {
        return this.jolokiaService.execute(mbean, 'addRepository(java.lang.String)', repositoryUri);
      }

      removeFeatureRepository(mbean:string, repository: FeatureRepository): ng.IPromise<string> {
        return this.jolokiaService.execute(mbean, 'removeRepository(java.lang.String)', repository.uri);
      }

      hasInvokeRightsForName(mbean:string, name: string) {
        return this.workspace.hasInvokeRightsForName(mbean, name);
      }

      sortByName(a,b): number {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      }
    }
}
