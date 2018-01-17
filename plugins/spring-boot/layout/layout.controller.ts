namespace SpringBoot {

  export function SpringBootLayoutController($location: ng.ILocationService) {
    'ngInject';

    this.tabs = [
      new Core.HawtioTab('Health', '/spring-boot/health'),
      new Core.HawtioTab('Mappings', '/spring-boot/mappings')
    ];

    this.goto = tab => {
      $location.path(tab.path);
    };
  }

}
