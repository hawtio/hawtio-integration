/// <reference path="workspace.ts"/>

namespace Jmx {

  export let currentProcessId = '';

  export function configureRoutes($routeProvider: ng.route.IRouteProvider) {
    'ngInject';
    $routeProvider
      .when('/jmx/attributes', {templateUrl: 'plugins/jmx/html/attributes/attributes.html'})
      .when('/jmx/operations', {template: '<operations></operations>'})
      .when('/jmx/charts', {templateUrl: 'plugins/jmx/html/charts.html'})
      .when('/jmx/charts/edit', {templateUrl: 'plugins/jmx/html/chartEdit.html'});
  }

  export function configureAbout(aboutService: About.AboutService) {
    'ngInject';
    aboutService.addProductInfo('Hawtio JMX', 'PACKAGE_VERSION_PLACEHOLDER');
  }

  export function configureHelp(helpRegistry) {
    'ngInject';
    helpRegistry.addUserDoc('jmx', 'plugins/jmx/doc/help.md');
  }

  export function configureMainNav(mainNavService: Nav.MainNavService, workspace: Workspace) {
    'ngInject';
    mainNavService.addItem({
      title: 'JMX',
      basePath: '/jmx',
      template: '<jmx></jmx>',
      isValid: () => workspace.hasMBeans()
    });
  }

  export function configurePageTitle(pageTitle, jolokia) {
    'ngInject';
    pageTitle.addTitleElement(() => {
      if (currentProcessId === '') {
        try {
          currentProcessId = jolokia.getAttribute('java.lang:type=Runtime', 'Name');
        } catch (e) {
          // ignore
        }
        if (currentProcessId && currentProcessId.indexOf("@") !== -1) {
          currentProcessId = "pid:" + currentProcessId.split("@")[0];
        }
      }
      return currentProcessId;
    });
  }

  export function initializeTree($q: ng.IQService, $rootScope: ng.IRootScopeService,
    initService: Init.InitService, workspace: Workspace) {
    'ngInject';
    initService.registerInitFunction(() => {
      log.info('Jmx.initializeTree: initializing...');
      return $q(resolve => {
        workspace.loadTree();
        const unsubscribe = $rootScope.$on(TreeEvent.Fetched, () => {
          unsubscribe();
          log.info('Jmx.initializeTree: initialized');
          resolve();
        });
      });
    });
  }

}
