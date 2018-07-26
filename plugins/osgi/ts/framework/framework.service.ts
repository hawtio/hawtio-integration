/// <reference path="../osgiHelpers.ts"/>
/// <reference path="framework.ts"/>

namespace Osgi {

  export class FrameworkService {

    static FRAMEWORK_MBEAN_ATTRIBUTES: string[] = [
      'FrameworkStartLevel',
      'InitialBundleStartLevel'
    ]

    constructor(private $q: ng.IQService, private workspace: Jmx.Workspace, private jolokiaService: JVM.JolokiaService) {
      'ngInject';
    }

    getFramework(): ng.IPromise<Framework> {
      return getSelectionFrameworkMBeanAsync(this.workspace, this.$q)
        .then(objectName => this.jolokiaService.getMBean(objectName))
        .then(response => {
          const framework: Framework = {
            initialBundleStartLevel: response.InitialBundleStartLevel,
            startLevel: response.FrameworkStartLevel
          }
          return framework;
        });
    }

    updateConfiguration(framework: Framework) {
      const mbean = getSelectionFrameworkMBean(this.workspace);
      if (mbean) {
        return this.jolokiaService.setAttributes(mbean, FrameworkService.FRAMEWORK_MBEAN_ATTRIBUTES,
          [framework.startLevel.toString(), framework.initialBundleStartLevel.toString()])
      }
    }
  }
}
