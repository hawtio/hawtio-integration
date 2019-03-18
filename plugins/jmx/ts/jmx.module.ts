/// <reference path="../../jvm/ts/jvmHelpers.ts"/>
/// <reference path="attributes/attributes.module.ts"/>
/// <reference path="common/common.module.ts"/>
/// <reference path="operations/operations.module.ts"/>
/// <reference path="tree/tree.module.ts"/>
/// <reference path="jmx.component.ts"/>
/// <reference path="jmx.config.ts"/>
/// <reference path="workspace.factory.ts"/>

namespace Jmx {

  export var jmxModule = angular.module('hawtio-jmx', [
    'angularResizable',
    commonModule,
    attributesModule,
    operationsModule,
    treeModule
  ])
  .config(configureRoutes)
  .run(configureAbout)
  .run(configureHelp)
  .run(configureMainNav)
  .run(configurePageTitle)
  .run(initializeTree)
  .component('jmx', jmxComponent)
  .factory('workspace', createWorkspace)
  .factory('jmxTreeLazyLoadRegistry', () => Core.lazyLoaders);

  hawtioPluginLoader.addModule(jmxModule.name);

  export const log: Logging.Logger = Logger.get(jmxModule.name);
}
