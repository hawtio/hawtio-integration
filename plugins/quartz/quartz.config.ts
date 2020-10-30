namespace Quartz {

  export const log: Logging.Logger = Logger.get('hawtio-quartz');

  export const jmxDomain = 'quartz';

  export function configureRoutes($routeProvider: angular.route.IRouteProvider): void {
    'ngInject';
    $routeProvider.
      when('/quartz/scheduler', { template: '<quartz-scheduler></quartz-scheduler>' }).
      when('/quartz/triggers', { template: '<quartz-triggers></quartz-triggers>' }).
      when('/quartz/jobs', { template: '<quartz-jobs></quartz-jobs>' });
  }

  export function configureLayout(mainNavService: Nav.MainNavService, workspace: Jmx.Workspace): void {
    'ngInject';
    mainNavService.addItem({
      title: 'Quartz',
      basePath: '/quartz',
      template: '<quartz></quartz>',
      isValid: () => isValid(workspace)
    });
  }

  export function configureHelp(helpRegistry: Help.HelpRegistry, workspace: Jmx.Workspace): void {
    'ngInject';
    helpRegistry.addUserDoc('quartz', 'plugins/quartz/doc/help.md',
      () => isValid(workspace));
  }

  function isValid(workspace: Jmx.Workspace): boolean {
    return workspace.treeContainsDomainAndProperties(jmxDomain);
  }

  // filters

  export function iconClass(state: any): string {
    const ok = "pficon pficon-ok";
    const paused = "pficon pficon-paused";
    if (_.isBoolean(state)) {
      return state ? ok : paused;
    }
    if (state) {
      switch (state.toString().toLowerCase()) {
        case 'true':
          return ok;
        case 'normal':
          return ok;
        case 'false':
          return paused;
        case 'paused':
          return paused;
      }
    }
    return "pficon pficon-error-circle-o";
  }

  export function misfireText(val: number): string {
    if (_.isNumber(val)) {
      switch (val) {
        case -1:
          return "ignore";
        case 0:
          return "smart";
        case 1:
          return "fire once now";
        case 2:
          return "do nothing";
      }
    }
    return "unknown";
  }

}
