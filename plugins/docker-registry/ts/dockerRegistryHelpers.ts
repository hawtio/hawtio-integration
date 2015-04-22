/// <reference path="../../includes.ts"/>
/// <reference path="dockerRegistryInterfaces.ts"/>

module DockerRegistry {
  export var context = '/docker-registry';
  export var hash = UrlHelpers.join('#', context);
  export var defaultRoute = UrlHelpers.join(hash, 'list');
  export var basePath = UrlHelpers.join('plugins', context);
  export var templatePath = UrlHelpers.join(basePath, 'html');
  export var pluginName = 'DockerRegistry';
  export var log:Logging.Logger = Logger.get(pluginName);
  export var SEARCH_FRAGMENT = '/v1/search';

  /**
   * Fetch the available docker images in the registry, can only
   * be called after app initialization
   */
  export function getDockerImageRepositories(callback: (restURL:string, repositories:DockerImageRepositories) => void) {
    var DockerRegistryRestURL = HawtioCore.injector.get("DockerRegistryRestURL");
    var $http:ng.IHttpService = HawtioCore.injector.get("$http");
    DockerRegistryRestURL.then((restURL:string) => {
      $http.get(UrlHelpers.join(restURL, SEARCH_FRAGMENT))
        .success((data:DockerImageRepositories) => {
          callback(restURL, data);
        })
        .error((data) => {
          log.debug("Error fetching image repositories:", data);
          callback(restURL, null);
        });
    });
  }

  export function completeDockerRegistry() {
    var $q = <ng.IQService> HawtioCore.injector.get("$q");
    var $rootScope = <ng.IRootScopeService> HawtioCore.injector.get("$rootScope");
    var deferred = $q.defer();
    getDockerImageRepositories((restURL:string, repositories:DockerImageRepositories) => {
      if (repositories && repositories.results) {
        // log.debug("Got back repositories: ", repositories);
        var results = repositories.results;
        results = results.sortBy((res) => { return res.name; }).first(15);
        var names = results.map((res) => { return res.name; });
        // log.debug("Results: ", names);
        deferred.resolve(names);
      } else {
        // log.debug("didn't get back anything, bailing");
        deferred.reject([]);
      }
    });
    return deferred.promise;
  }


}
