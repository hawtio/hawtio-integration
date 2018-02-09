namespace SpringBoot {

  export function SpringBootLayoutController($location: ng.ILocationService) {
    'ngInject';

    this.tabs = [
      new Core.HawtioTab('Health', '/spring-boot/health'),
      new Core.HawtioTab('Trace', '/spring-boot/trace'),
      new Core.HawtioTab('Loggers', '/spring-boot/loggers')
    ];

    this.goto = tab => {
      $location.path(tab.path);
    };
  }
}
