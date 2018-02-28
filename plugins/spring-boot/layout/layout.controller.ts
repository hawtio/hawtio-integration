namespace SpringBoot {

  export function SpringBootLayoutController($location: ng.ILocationService) {
    'ngInject';

    this.tabs = [
      new Nav.HawtioTab('Health', '/spring-boot/health'),
      new Nav.HawtioTab('Trace', '/spring-boot/trace'),
      new Nav.HawtioTab('Loggers', '/spring-boot/loggers')
    ];

    this.goto = tab => {
      $location.path(tab.path);
    };
  }
}
