namespace Camel {

  export class DebugService {

    constructor(private workspace: Jmx.Workspace, private jolokiaService: JVM.JolokiaService) {
      'ngInject';
    }

    addConditionalBreakpoint(conditionalBreakpoint: ConditionalBreakpoint): ng.IPromise<void> {
      log.info("Add conditional breakpoint");
      var mbean = getSelectionCamelDebugMBean(this.workspace);
      return this.jolokiaService.execute(mbean, "addConditionalBreakpoint", conditionalBreakpoint.nodeId,
        conditionalBreakpoint.language, conditionalBreakpoint.predicate);
    }

  }

}
