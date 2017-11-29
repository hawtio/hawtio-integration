/// <reference path="../activemqHelpers.ts"/>

namespace ActiveMQ {

  export class DestinationController {

    private log: Logging.Logger = Logger.get("ActiveMQ");

    private readonly buttonNameLimit = 30;

    amqJmxDomain = this.localStorage['activemqJmxDomain'] || "org.apache.activemq";

    message: string = "";
    destinationName: string = "";
    destinationType: string = "Queue";

    createDialog: boolean = false;
    deleteDialog: boolean = false;
    purgeDialog: boolean = false;

    constructor(
      private $scope,
      private workspace: Jmx.Workspace,
      private $location: ng.ILocationService,
      private jolokia: Jolokia.IJolokia,
      private localStorage: Storage) {
      'ngInject';
    }

    private operationSuccess() {
      this.destinationName = "";
      this.workspace.operationCounter += 1;
      Core.notification("success", this.message);
      this.workspace.loadTree();
      Core.$apply(this.$scope);
    }

    private deleteSuccess() {
      // lets set the selection to the parent
      this.workspace.removeAndSelectParentNode();
      this.workspace.operationCounter += 1;
      Core.notification("success", this.message);
      // and switch to show the attributes (table view)
      this.$location.path('/jmx/attributes').search({ "main-tab": "activemq", "sub-tab": "activemq-attributes" });
      this.workspace.loadTree();
      Core.$apply(this.$scope);
    }

    private validateDestinationName(name: string): boolean {
      return name.indexOf(":") === -1;
    }

    private isQueue(destinationType: string): boolean {
      return destinationType === "Queue";
    }

    private checkIfDestinationExists(name: string, destinationType: string): boolean {
      let answer = false;
      let destinations;
      if (this.isQueue(destinationType)) {
        destinations = ActiveMQ.retrieveQueueNames(this.workspace, false);
      } else {
        destinations = ActiveMQ.retrieveTopicNames(this.workspace, false);
      }
      angular.forEach(destinations, (destination) => {
        if (name === destination) {
          answer = true;
        }
      });
      return answer;
    }

    validateAndCreateDestination(name: string, destinationType: string) {
      if (!this.validateDestinationName(name)) {
        this.createDialog = true;
        return;
      }
      if (this.checkIfDestinationExists(name, destinationType)) {
        Core.notification("error", `The ${this.uncapitalisedDestinationType()} "${name}" already exists`);
        return;
      }
      this.createDestination(name, destinationType);
    }

    private createDestination(name: string, destinationType: string) {
      let mbean = getBrokerMBean(this.workspace, this.jolokia, this.amqJmxDomain);
      name = Core.escapeHtml(name);
      if (mbean) {
        let operation;
        if (this.isQueue(destinationType)) {
          operation = "addQueue(java.lang.String)";
          this.message = `Created queue "${name}"`;
        } else {
          operation = "addTopic(java.lang.String)";
          this.message = `Created topic "${name}"`;
        }
        if (mbean) {
          this.jolokia.execute(mbean, operation, name, Core.onSuccess(() => this.operationSuccess()));
        } else {
          Core.notification("error", "Could not find the Broker MBean!");
        }
      }
    }

    /**
     * When destination name contains "_" like "aaa_bbb", the actual name might be either
     * "aaa_bbb" or "aaa:bbb", so the actual name needs to be checked before removal.
     * @param name destination name
     */
    private restoreRealDestinationName(name: string): string {
      if (name.indexOf("_") === -1) {
        return name;
      }
      return this.jolokia.getAttribute(this.workspace.getSelectedMBeanName(), "Name", Core.onSuccess(null));
    }

    deleteDestination() {
      let mbean = getBrokerMBean(this.workspace, this.jolokia, this.amqJmxDomain);
      let selection = this.workspace.selection;
      let entries = selection.entries;
      if (mbean && selection && this.jolokia && entries) {
        let domain = selection.domain;
        let name = entries["Destination"] || entries["destinationName"] || selection.text;
        let operation;
        if (this.isQueue(entries["Type"] || entries["destinationType"])) {
          operation = "removeQueue(java.lang.String)";
          this.message = `Deleted queue "${name}"`;
        } else {
          operation = "removeTopic(java.lang.String)";
          this.message = `Deleted topic "${name}"`;
        }
        name = this.restoreRealDestinationName(name);
        // do not unescape name for destination deletion
        this.jolokia.execute(mbean, operation, name, Core.onSuccess(() => this.deleteSuccess()));
      }
    }

    purgeDestination() {
      let mbean = this.workspace.getSelectedMBeanName();
      let selection = this.workspace.selection;
      let entries = selection.entries;
      if (mbean && selection && this.jolokia && entries) {
        let name = entries["Destination"] || entries["destinationName"] || selection.text;
        let operation = "purge()";
        this.message = `Purged queue "${name}"`;
        // unescape should be done right before invoking jolokia
        name = _.unescape(name);
        this.jolokia.execute(mbean, operation, Core.onSuccess(() => this.operationSuccess()));
      }
    }

    selectedShortName(): string {
      let name = this.selectedName();
      if (name === null) {
        return null;
      }
      let ellipsis = name.length > this.buttonNameLimit ? "..." : ""
      return name ? name.substring(0, this.buttonNameLimit) + ellipsis : null;
    }

    selectedName(): string {
      let selection = this.workspace.selection;
      return selection ? _.unescape(selection.text) : null;
    }

    uncapitalisedDestinationType(): string {
      return this.destinationType.charAt(0).toLowerCase() + this.destinationType.substring(1);
    }
  }

}
