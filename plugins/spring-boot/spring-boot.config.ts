/// <reference path="spring-boot.service.ts"/>

namespace SpringBoot {

  export function configureRoutes($routeProvider: angular.route.IRouteProvider) {
    'ngInject';
    $routeProvider
      .when('/spring-boot/health', {template: '<spring-boot-health></spring-boot-health>'})
      .when('/spring-boot/trace', {template: '<spring-boot-trace></spring-boot-trace>'})
      .when('/spring-boot/loggers', {template: '<spring-boot-loggers></spring-boot-loggers>'});
    }

  export function configureLayout(workspace: Jmx.Workspace, springBootService: SpringBootService,
    mainNavService: Nav.MainNavService) {
    'ngInject';
    mainNavService.addItem({
      title: 'Spring Boot',
      href: '/spring-boot',
      template: '<spring-boot></spring-boot>',
      isValid: () => springBootService.getTabs().length > 0
    });
  }

}
