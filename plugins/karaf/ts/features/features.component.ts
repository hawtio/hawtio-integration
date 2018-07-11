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

    private repositoryFilterValues: string[] = [];

    listConfig = {
      showSelectBox: false,
      useExpandingRows: false,
      updateInProgress: false,
    };

    loading = true;

    listItems = null;

    private readonly installButton = {
      name: 'Install',
      actionFn: (action, feature: Feature) => {
        if (this.listConfig.updateInProgress === true) {
          return;
        }

        Core.notification('info', `Installing feature ${feature.name}`);
        this.setUpdateInProgress(true);
        this.featuresService.installFeature(feature)
          .then(() => {
            this.runWithDelay(() => {
              this.loadFeatureRepositories(() => {
                Core.notification('success', `Installed feature ${feature.name}`);
                this.setUpdateInProgress(false);
              });
            });
          })
          .catch(error => {
            Core.notification('danger', error)
            this.setUpdateInProgress(false);
          });
      },
      selectedId: null
    };

    private readonly uninstallButton = {
      name: 'Uninstall',
      actionFn: (action, feature: Feature) => {
        if (this.listConfig.updateInProgress === true) {
          return;
        }

        // Only uninstall required features. Else assume the feature is a dependency of some other feature.
        // See https://issues.jboss.org/browse/ENTESB-9135.
        if (feature.required === false) {
          Core.notification('warning', `Feature ${feature.name} cannot be uninstalled as other features depend on it`);
          return;
        }

        Core.notification('info', `Uninstalling feature ${feature.name}`);
        this.setUpdateInProgress(true);
        this.featuresService.uninstallFeature(feature)
          .then(() => {
            this.runWithDelay(() => {
              this.loadFeatureRepositories(() => {
                const updatedFeature = this.features.filter((match: Feature) => match.name === feature.name && match.version === feature.version)[0];

                // Handle scenario where Karaf has not modified the installed state after uninstall
                if (updatedFeature && updatedFeature.installed === true && updatedFeature.required === false) {
                  Core.notification('warning', `Feature ${feature.name} cannot be uninstalled as other features depend on it`);
                } else {
                  Core.notification('success', `Uninstalled feature ${feature.name}`);
                }

                this.setUpdateInProgress(false);
              });
            });
          })
          .catch(error => {
            Core.notification('danger', error)
            this.setUpdateInProgress(false);
          });
      },
      selectedId: null
    };

    listItemActionButtons = this.itemActionButtons();

    private readonly addRepositoryAction = {
      name: 'Add repository',
      actionFn: action => {
        this.$uibModal.open({
          component: 'featureRepositoryAddModal'
        })
        .result.then((repository: any) => {
          if (repository.uri && repository.uri.trim().length > 0) {
            const repositoryMatch:FeatureRepository = this.repositories.filter(match => match.uri === repository.uri.trim())[0]
            if (repositoryMatch) {
              Core.notification('warning',`Feature repository ${repositoryMatch.uri} is already installed`);
            } else {
              Core.notification('info', `Adding feature repository ${repository.uri}`);
              this.setUpdateInProgress(true);
              this.featuresService.addFeatureRepository(repository.uri)
              .then(() => {
                this.loadFeatureRepositories(() => {
                  Core.notification('success', `Added feature repository ${repository.uri}`);
                  this.setUpdateInProgress(false);
                });
              })
              .catch(error => {
                Core.notification('danger', error)
                this.setUpdateInProgress(false);
              });
            }
          }
        });
      }
    };

    private readonly removeRepositoryAction = {
      name: 'Remove repository',
      actionFn: action => {
        this.$uibModal.open({
          component: 'featureRepositoryRemoveModal',
          resolve: {repositories: () => {return this.repositories}}
        })
        .result.then((selectedRepository: FeatureRepository) => {
          if (selectedRepository) {
            const dependentRepositories = [];

            angular.forEach(this.repositories, repository => {
              if (repository.name !== selectedRepository.name) {
                angular.forEach(repository.dependencies, dependency => {
                  if (dependency === selectedRepository.uri) {
                    dependentRepositories.push(repository.name);
                  }
                });
              }
            });

            if (dependentRepositories.length > 0) {
              let message = dependentRepositories.length === 1 ? dependentRepositories[0] : dependentRepositories.length + ' other features';
              Core.notification('danger',
                `Unable to remove repository ${selectedRepository.name}. It is required by ${message}.`)
              return;
            }

            Core.notification('info', `Removing feature repository ${selectedRepository.uri}`);
            this.setUpdateInProgress(true);
            this.featuresService.removeFeatureRepository(selectedRepository)
              .then(() => {
                this.loadFeatureRepositories(() => {
                  Core.notification('success', `Removed feature repository ${selectedRepository.uri}`);
                  this.setUpdateInProgress(false);
                });
              })
              .catch(error => {
                Core.notification('danger', error)
                this.setUpdateInProgress(false);
              });
            }
        });
      }
    };

    toolbarActions = this.toolbarActionButtons();

    toolbarConfig = {
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
            title: 'State',
            placeholder: 'Filter by state...',
            filterType: 'select',
            filterValues: [
              'Installed',
              'Uninstalled'
            ]
          },
          {
            id: 'repository',
            title: 'Repository',
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
        primaryActions: this.toolbarActions
      },
      isTableView: false
    };

    pageConfig = {
      pageSize: 10
    };

    constructor(private featuresService: FeaturesService, private $uibModal: angular.ui.bootstrap.IModalService,
      private workspace: Jmx.Workspace, private $timeout: ng.ITimeoutService) {
      'ngInject';
    }

    $onInit(): void {
      this.loadFeatureRepositories();
    }

    private itemActionButtons(): any[] {
      let buttons = [];
      if (this.featuresService.hasInvokeRightsForName('installFeature')) {
        buttons.push(this.installButton);
      }
      if (this.featuresService.hasInvokeRightsForName('uninstallFeature')) {
        buttons.push(this.uninstallButton);
      }
      log.debug("RBAC - Rendered features buttons:", buttons);
      return buttons;
    }

    private toolbarActionButtons(): any[] {
      let actions = [];
      if (this.featuresService.hasInvokeRightsForName('addRepository')) {
        actions.push(this.addRepositoryAction);
      }
      if (this.featuresService.hasInvokeRightsForName('removeRepository')) {
        actions.push(this.removeRepositoryAction);
      }
      log.debug("RBAC - Rendered features actions:", actions);
      return actions;
    }

    private loadFeatureRepositories(loadCompleteFn?: Function): void {
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
        })
        .catch(error => {
          Core.notification('danger', error);
          this.setUpdateInProgress(false);
        })
        .then(() => {
          if (loadCompleteFn) {
            loadCompleteFn()
          }
        });
    }

    private applyFilters(filters: any[]): void {
      let filteredFeatures = this.features;
      filters.forEach(filter => {
        filteredFeatures = FeaturesController.FILTER_FUNCTIONS[filter.id](filteredFeatures, filter.value);
      });
      this.listItems = filteredFeatures;
      this.toolbarConfig.filterConfig.resultsCount = filteredFeatures.length;
    }

    enableButtonForItem(action, item): boolean {
      if (this['config']['updateInProgress'] === true) {
        return false;
      }

      if (action.name === 'Install') {
        return item.installed === false;
      }

      if (action.name === 'Uninstall') {
        return item.installed === true;
      }
    }

    private setUpdateInProgress(updateInProgress: boolean): void {
      this.listConfig.updateInProgress = updateInProgress;
      this.toolbarActions.forEach(action => action.isDisabled = (this.listConfig.updateInProgress === true));
    }

    private runWithDelay(fn: Function): void {
      const timeoutPromise = this.$timeout(() => {
        this.$timeout.cancel(timeoutPromise);
        fn();
      }, 2000);
    }
  }

  export const featuresComponent: angular.IComponentOptions = {
    templateUrl: 'plugins/karaf/html/features.html',
    controller: FeaturesController
  };
}

