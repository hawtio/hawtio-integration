/// <reference path="../../jmx/ts/workspace.ts"/>
/// <reference path="../../jmx/ts/tree/tree.service.ts"/>

namespace Diagnostics {

  export class DiagnosticsService {

    constructor(private workspace: Jmx.Workspace, private configManager: Core.ConfigManager) {
      'ngInject';
    }

    getTabs(): Nav.HawtioTab[] {
      const tabs = [];
      if (this.hasDiagnosticFunction('jfrCheck')) {
        tabs.push(new Nav.HawtioTab('Flight Recorder', '/diagnostics/jfr'));
      }
      if (this.hasDiagnosticFunction('gcClassHistogram')) {
        tabs.push(new Nav.HawtioTab('Class Histogram', '/diagnostics/heap'));
      }
      if (this.hasHotspotDiagnostic()) {
        tabs.push(new Nav.HawtioTab('Hotspot Diagnostic', '/diagnostics/flags'));
      }
      return tabs;
    }

    private hasHotspotDiagnostic(): boolean {
      return this.workspace.treeContainsDomainAndProperties('com.sun.management', {type: 'HotSpotDiagnostic'});
    }

    private hasDiagnosticFunction(operation: string): boolean {
      const diagnostics = this.workspace.findMBeanWithProperties('com.sun.management', {type: 'DiagnosticCommand'});
      return diagnostics && diagnostics.mbean && diagnostics.mbean.op && !!diagnostics.mbean.op[operation];
    }

    findMyPid(title) {
      //snatch PID from window title
      const regex = /pid:(\d+)/g;
      const pid = regex.exec(title);
      if (pid && pid[1]) {
        return pid[1];
      } else {
        return null;
      }
    }

  }

}
