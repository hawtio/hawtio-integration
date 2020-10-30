/// <reference path="../quartz.service.ts"/>

namespace Quartz {

  export class TreeController {

    constructor(
      private $scope: ng.IScope,
      private $location: ng.ILocationService,
      private workspace: Jmx.Workspace,
      private quartzService: QuartzService) {
      'ngInject';
    }

    $onInit(): void {
      this.$scope.$on("$routeChangeSuccess", () => {
        // lets do this asynchronously to avoid Error: $digest already in progress
        setTimeout(() => this.updateSelectionFromURL(), 50);
      });

      this.$scope.$on(Jmx.TreeEvent.Updated, () => this.reloadTree());

      // reload tree on startup
      this.reloadTree();
    }

    private reloadTree(): void {
      log.debug("Reloading Quartz tree");
      const mbean = this.quartzService.getQuartzMBean();
      if (!mbean) {
        log.debug("Quartz mbean not found");
        return;
      }
      log.debug("Quartz mbean found:", mbean);

      const rootFolder = this.createQuartzSchedulerFolder("Quartz Schedulers", "quartz-folder", "quartzSchedulers", "");
      const tree = [rootFolder];

      this.quartzService.searchSchedulers((mbeans: string[]) => {
        mbeans.forEach(mbean => this.addChildScheduler(rootFolder, mbean));

        log.debug("Setting up Quartz tree with nid:", this.$location.search()["nid"]);
        Jmx.enableTree(this.$scope, this.$location, this.workspace, $(treeElementId), tree);

        // lets do this asynchronously to avoid Error: $digest already in progress
        setTimeout(() => this.updateSelectionFromURL(), 50);
      });
    }

    private createQuartzSchedulerFolder(text: string, className: string, typeName: string, key: string): Jmx.Folder {
      const folder = new Jmx.Folder(text);
      folder.class = className;
      folder.typeName = typeName;
      folder.domain = jmxDomain;
      folder.key = key;
      return folder;
    }

    private addChildScheduler(folder: Jmx.Folder, mbean: string): void {
      const name = this.quartzService.readSchedulerName(mbean);
      // use scheduler name as key as that is unique for us
      const scheduler = this.createQuartzSchedulerFolder(name, "quartz-scheduler", "quartzScheduler", name);
      scheduler.objectName = mbean;
      folder.children.push(scheduler);
    }

    private updateSelectionFromURL(): void {
      Jmx.updateTreeSelectionFromURLAndAutoSelect(this.$location, $(treeElementId),
        (first: Jmx.Folder) => {
          // use function to auto select first scheduler if there is only one scheduler
          const schedulers = first.children;
          if (schedulers && schedulers.length === 1) {
            return schedulers[0];
          }
          return null;
        },
        true);

      this.workspace.broadcastSelectionNode();
    }
  }

  export const treeComponent: angular.IComponentOptions = {
    template: `
      <div class="tree-nav-sidebar-content">
        <div class="tree-nav-sidebar-header">
          <h4>Quartz Schedulers</h4>
        </div>
        <div id="quartztree" class="treeview-pf-hover treeview-pf-select"></div>
      </div>
    `,
    controller: TreeController,
  };

}
