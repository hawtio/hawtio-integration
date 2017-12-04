/// <reference path="feature.ts"/>
/// <reference path="feature-repository.ts"/>
/// <reference path="../karafHelpers.ts"/>

namespace Karaf {

    export class FeaturesService {

      private log: Logging.Logger = Logger.get("Karaf");

      constructor(private $q: ng.IQService, private jolokia: Jolokia.IJolokia, private workspace: Jmx.Workspace) {
        'ngInject';
      }

      getFeatureRepositories(): ng.IPromise<FeatureRepository[]> {
        return this.execute(getSelectionFeaturesMBean(this.workspace), undefined, undefined, 'read')
          .then(value => {
            const repositories: FeatureRepository[] = [];
            angular.forEach(value['Repositories'], (repository) => {
              let featureRepository: FeatureRepository = new FeatureRepository(repository.Name, repository.Uri)
              featureRepository.dependencies = repository['Repositories'];

              angular.forEach(repository['Features'], (item) => {
                angular.forEach(item, (featureInfo, version) => {
                  let feature: Feature = new Feature(
                    featureInfo.Name,
                    featureInfo.Version,
                    value['Features'][featureInfo.Name][version].Installed,
                    repository.Name,
                    repository.Uri
                  );
                  featureRepository.features.push(feature);
                });
              });
                repositories.push(featureRepository);
              });

              return repositories.sort((a,b) => {
                return this.sortByName(a,b);
              });
          });
      }

      installFeature(feature: Feature): ng.IPromise<string> {
        const mbean = getSelectionFeaturesMBean(this.workspace);
        const args = [feature.name, feature.version];
        return this.execute(mbean, 'installFeature(java.lang.String, java.lang.String)', args)
          .then(this.handleResponse);
      }

      uninstallFeature(feature: Feature): ng.IPromise<string> {
        const mbean = getSelectionFeaturesMBean(this.workspace);
        const args = [feature.name, feature.version];
        return this.execute(mbean, 'uninstallFeature(java.lang.String, java.lang.String)', args)
          .then(this.handleResponse);
      }

      addFeatureRepository(repositoryUri: string): ng.IPromise<string> {
        const mbean = getSelectionFeaturesMBean(this.workspace);
        const args = [repositoryUri];
        return this.execute(mbean, 'addRepository(java.lang.String)', args)
          .then(this.handleResponse);
      }

      removeFeatureRepository(repository: FeatureRepository): ng.IPromise<string> {
        const mbean = getSelectionFeaturesMBean(this.workspace);
        const args = [repository.uri];
        return this.execute(mbean, 'removeRepository(java.lang.String)', args)
          .then(this.handleResponse);
      }

      private execute(mbean: string, operation: string, args = [], type: string = "exec"): ng.IPromise<string> {
        const request = {
          type: type,
          mbean: mbean,
        };

        if (operation) {
          request['operation'] = operation;
        }

        if (args) {
          request['arguments'] = args;
        }

        return this.$q((resolve, reject) => {
          this.jolokia.request(request, {
            method: "post",
            success: response => resolve(response.value),
            error: response => {
              reject(response.error);
            }
          });
        });
      }

      private handleResponse(response) {
        if (response && response['Error']) {
          throw response['Error'];
        } else {
          return `The operation completed successfully`;
        }
      }

      sortByName(a,b) {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      }
    }
}