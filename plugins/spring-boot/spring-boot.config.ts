/// <reference path="spring-boot.service.ts"/>

namespace SpringBoot {

  export function configureRoutes($routeProvider: angular.route.IRouteProvider) {
    'ngInject';
    $routeProvider
      .when('/spring-boot', {redirectTo: '/spring-boot/health'})
      .when('/spring-boot/health', {template: '<spring-boot-health></spring-boot-health>'})
      .when('/spring-boot/trace', {template: '<spring-boot-trace></spring-boot-trace>'})
      .when('/spring-boot/loggers', {template: '<spring-boot-loggers></spring-boot-loggers>'});
    }

  export function configureLayout($templateCache: ng.ITemplateCacheService, viewRegistry, HawtioNav: Nav.Registry,
    workspace: Jmx.Workspace, treeService: Jmx.TreeService, springBootService: SpringBootService) {
    'ngInject';

    const templateCacheKey = 'spring-boot.html';
    $templateCache.put(templateCacheKey, '<spring-boot></spring-boot>');
    viewRegistry['spring-boot'] = templateCacheKey;

    treeService.treeContainsDomainAndProperties('org.springframework.boot')
      .then(isSpringBoot => {
        if (isSpringBoot) {
          springBootService.getTabs()
            .then(tabs => {
              const tab = HawtioNav.builder()
                .id('spring-boot')
                .title(() => 'Spring Boot')
                .href(() => '/spring-boot')
                .isValid(() => tabs.length > 0)
                .isSelected(() => workspace.isMainTabActive('spring-boot'))
                .build();
              HawtioNav.add(tab);
            });
        }
      });
  }

}
