namespace SpringBoot {

  export function SpringBootLayoutController($location: ng.ILocationService) {
    'ngInject';

    this.tabs = [
      new Core.HawtioTab('Health', '/spring-boot/health')
    ];

    this.goto = tab => {
      $location.path(tab.path);
    };
  }

}