/// <reference path="workspace.ts"/>

namespace Jmx {

  export function createWorkspace($location: ng.ILocationService, jmxTreeLazyLoadRegistry,
    $compile: ng.ICompileService, $templateCache: ng.ITemplateCacheService, localStorage: Storage,
    jolokia: Jolokia.IJolokia, jolokiaStatus: JVM.JolokiaStatus, $rootScope, userDetails) {
    'ngInject';
    let workspace = new Workspace(jolokia, jolokiaStatus, jmxTreeLazyLoadRegistry, $location, $compile,
      $templateCache, localStorage, $rootScope);
    return workspace;
  }
}
