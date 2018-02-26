/// <reference path="layout/layout.service.ts"/>

namespace SpringBoot {

  export function configureRoutes($routeProvider: angular.route.IRouteProvider) {
    'ngInject';
    $routeProvider
      .when('/spring-boot', {redirectTo: '/spring-boot/health'})
      .when('/spring-boot/health', {template: '<spring-boot-health></spring-boot-health>'})
      .when('/spring-boot/trace', {template: '<spring-boot-trace></spring-boot-trace>'})
      .when('/spring-boot/loggers', {template: '<spring-boot-loggers></spring-boot-loggers>'});
    }

  export function configureNavigation($rootScope: ng.IScope,
                                      viewRegistry,
                                      HawtioNav: HawtioMainNav.Registry,
                                      workspace: Jmx.Workspace,
                                      springBootLayoutService: SpringBootLayoutService) {
    'ngInject';

    viewRegistry['spring-boot'] = 'plugins/spring-boot/layout/layout.html';

    const unsubscribe = $rootScope.$on('jmxTreeUpdated', () => {
      unsubscribe();
      let valid = springBootLayoutService.getTabs().length > 0;
      const tab = HawtioNav.builder()
      .id('spring-boot')
      .title(() => 'Spring Boot')
      .href(() => '/spring-boot')
      .isValid(() => valid)
      .isSelected(() => workspace.isMainTabActive('spring-boot'))
      .build();
      HawtioNav.add(tab);
    });
  }
}