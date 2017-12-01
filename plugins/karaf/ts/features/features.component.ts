/// <reference path="feature.ts"/>
/// <reference path="features.service.ts"/>

namespace Karaf {

    export class FeaturesController {

      private static FILTER_FUNCTIONS = {
        state: (features, state) => features.filter(feature => feature.installed === (state === 'Installed' ? true : false)),
        name: (features, name) => {
          let regExp = new RegExp(name, 'i');
          return features.filter(feature => regExp.test(feature.name));
        },
        repository: (features, repositoryName) => {
          return features.filter(feature => feature.repositoryName === repositoryName)
        }
      };

      private features: Feature[] = [];

      private repositories: FeatureRepository[];

      private selectedRepository: FeatureRepository;

      private repositoryUri: string;

      private repositoryFilterValues:string[] = [];

      private listConfig = {
        showSelectBox: false,
        useExpandingRows: false
      };

      private loading = true;

      private listItems = null;

      private listItemActionButtons = [
        {
          name: 'Install',
          actionFn: (action, item) => {
            action.selectedId = item.id;
            this.featuresService.installFeature(item)
              .then(response => {
                Core.notification('success', response);
                this.loadFeatureRepositories();
                action.selectedId = null;
              })
              .catch(error => {
                Core.notification('danger', error)
                action.selectedId = null;
              });
          },
          selectedId: null
        },
        {
          name: 'Uninstall',
          actionFn: (action, item) => {
            action.selectedId = item.id;
            this.featuresService.uninstallFeature(item)
              .then(response => {
                Core.notification('success', response);
                this.loadFeatureRepositories();
                action.selectedId = null;
              })
              .catch(error => {
                Core.notification('danger', error)
                action.selectedId = null;
              });
          },
          selectedId: null
        }
      ];

      private toolbarConfig = {
        filterConfig: {
          fields: [
            {
              id: 'name',
              title: 'Name',
              placeholder: 'Filter by name...',
              filterType: 'text'
            },
            {
              id: 'state',
              title:  'State',
              placeholder: 'Filter by state...',
              filterType: 'select',
              filterValues: [
                'Installed',
                'Uninstalled'
              ]
            },
            {
              id: 'repository',
              title:  'Repository',
              placeholder: 'Filter by repository...',
              filterType: 'select'
            }
          ],
          onFilterChange: (filters: any[]) => {
            this.applyFilters(filters);
          },
          appliedFilters: [],
          resultsCount: 0
        },
        actionsConfig: {
          primaryActions: [
            {
              name: 'Add repository',
              actionFn: action => {
                this.$uibModal.open({
                  templateUrl: 'addRepositoryDialog.html',
                  scope: this.$scope
                })
                .result
                  .then(() => {
                    if (this.repositoryUri) {
                      this.featuresService.addFeatureRepository(this.repositoryUri)
                      .then(response => {
                        Core.notification('success', response);
                        this.loadFeatureRepositories();
                      })
                      .catch(error => Core.notification('danger', error));
                    }
                    this.repositoryUri = null;
                  });
              }
            },
            {
              name: 'Remove repository',
              actionFn: action => {
                this.$uibModal.open({
                  templateUrl: 'removeRepositoryDialog.html',
                  scope: this.$scope
                })
                .result
                  .then(() => {
                    if (this.selectedRepository) {
                      let dependentRepositories = [];

                      angular.forEach(this.repositories, repository => {
                        if (repository.name !== this.selectedRepository.name) {
                          angular.forEach(repository.dependencies, dependency => {
                            if (dependency === this.selectedRepository.uri) {
                              dependentRepositories.push(repository.name);
                            }
                          });
                        }
                      });

                      if (dependentRepositories.length > 0) {
                        Core.notification('danger', `Unable to remove repository ${this.selectedRepository.name}. It is required by ${dependentRepositories}.`)
                        return;
                      }

                      this.featuresService.removeFeatureRepository(this.selectedRepository)
                      .then(response => {
                        Core.notification('success', response);
                        this.loadFeatureRepositories();
                      })
                      .catch(error => Core.notification('danger', error));
                    }
                    this.selectedRepository = null;
                  });
              }
            }
          ]
        },
        isTableView: false
      };

      constructor(private featuresService: FeaturesService, private $uibModal, private $scope) {
        'ngInject';
      }

      $onInit() {
        this.loadFeatureRepositories();
      }

      private loadFeatureRepositories() {
        this.featuresService.getFeatureRepositories()
          .then(featureRepositories => {
            this.features = [];

            featureRepositories.forEach(repository => {
              this.features.push.apply(this.features, repository.features);
            });

            this.listItems = this.features.sort(this.featuresService.sortByName);
            this.repositories = featureRepositories.sort(this.featuresService.sortByName);

            this.repositoryFilterValues = this.repositories.map(repository => {
              return repository.name;
            });

            this.toolbarConfig.filterConfig.fields[2]['filterValues'] = this.repositoryFilterValues;

            if (this.toolbarConfig.filterConfig.appliedFilters.length > 0) {
              this.applyFilters(this.toolbarConfig.filterConfig.appliedFilters)
            } else {
              this.toolbarConfig.filterConfig.resultsCount = this.features.length;
            }
            this.loading = false;
          });
      }

      private applyFilters(filters: any[]) {
        let filteredFeatures = this.features;
        filters.forEach(filter => {
          filteredFeatures = FeaturesController.FILTER_FUNCTIONS[filter.id](filteredFeatures, filter.value);
        });
        this.listItems = filteredFeatures;
        this.toolbarConfig.filterConfig.resultsCount = filteredFeatures.length;
      }

      private enableButtonForItem(action, item) {
        if (action.selectedId && action.selectedId === item.id) {
          return false;
        }

        if (action.name === 'Install') {
          return item.installed === false;
        }

        if (action.name === 'Uninstall') {
          return item.installed === true;
        }
      }
    }

    export const featuresComponent: angular.IComponentOptions = {
      templateUrl: 'plugins/karaf/html/features.html',
      controller: FeaturesController
    };
  }

