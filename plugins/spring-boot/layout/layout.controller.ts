namespace SpringBoot {

  export function SpringBootLayoutController($location: ng.ILocationService) {
    'ngInject';

    const tabs = [
      {name: 'Health', path: '/spring-boot/health'}
    ];

    this.names = tabs.map(tab => tab.name);

    this.changePath = name => {
      const tab = _.find(tabs, {name: name});
      $location.path(tab.path);
    };
  }

}