/**
 * @namespace RBAC
 * @main RBAC
 */
/// <reference path="../../jmx/ts/workspace.ts"/>
/// <reference path="../../jvm/ts/jolokia/jolokiaService.ts"/>
/// <reference path="models.ts"/>
/// <reference path="rbac.directive.ts"/>
/// <reference path="rbac.service.ts"/>
/// <reference path="jmxTreeProcessor.ts"/>

namespace RBAC {

  export const pluginName: string = "hawtio-jmx-rbac";
  export const log: Logging.Logger = Logger.get(pluginName);

  angular
    .module(pluginName, [])
    .directive('hawtioShow', HawtioShow.factory)
    .service('rbacTasks', RBACTasksFactory.create)
    .service('rbacACLMBean', RBACACLMBeanFactory.create)
    .run(addTreePostProcessor);

  const TREE_POSTPROCESSOR_NAME = "rbacTreePostprocessor";

  function addTreePostProcessor(
    jolokia: Jolokia.IJolokia,
    jolokiaStatus: JVM.JolokiaStatus,
    rbacTasks: RBACTasks,
    preLogoutTasks: Core.Tasks,
    workspace: Jmx.Workspace): void {
    'ngInject';

    preLogoutTasks.addTask("ResetRBAC", () => {
      log.debug("Resetting RBAC tasks");
      rbacTasks.reset();
      workspace.removeNamedTreePostProcessor(TREE_POSTPROCESSOR_NAME);
    });

    // add info to the JMX tree if we have access to invoke on mbeans or not
    let processor = new JmxTreeProcessor(jolokia, jolokiaStatus, rbacTasks, workspace);
    rbacTasks.addTask("JMXTreePostProcess",
      () => workspace.addNamedTreePostProcessor(TREE_POSTPROCESSOR_NAME,
        (tree: Jmx.Folder) => processor.process(tree)));
  }

  hawtioPluginLoader.addModule(pluginName);
}
