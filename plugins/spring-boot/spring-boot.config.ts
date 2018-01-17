namespace SpringBoot {

  export function configureRoutes($routeProvider: angular.route.IRouteProvider) {
    'ngInject';
    $routeProvider
      .when('/spring-boot', {redirectTo: '/spring-boot/health'})
      .when('/spring-boot/health', {template: '<spring-boot-health></spring-boot-health>'})
      .when('/spring-boot/mappings', {template: '<spring-boot-mappings></spring-boot-mappings>'});
    }

  export function configureNavigation(viewRegistry, HawtioNav: HawtioMainNav.Registry, workspace: Jmx.Workspace) {
    'ngInject';

    viewRegistry['spring-boot'] = 'plugins/spring-boot/layout/layout.html';

    let valid = false;
    const tab = HawtioNav.builder()
      .id('spring-boot')
      .title(() => 'Spring Boot')
      .href(() => '/spring-boot')
      .isValid(() => workspace.treeContainsDomainAndProperties('org.springframework.boot'))
      .isSelected(() => workspace.isMainTabActive('spring-boot'))
      .build();
    HawtioNav.add(tab);
  }

}