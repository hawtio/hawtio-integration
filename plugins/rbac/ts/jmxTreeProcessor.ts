namespace RBAC {

  type MBeans = { [name: string]: Jmx.Folder };
  type BulkRequest = { [name: string]: string[] };
  type BulkResponse = { [name: string]: Operations };
  type Operations = { [name: string]: Operation };
  type Operation = { ObjectName: string, Method: string, CanInvoke: boolean };

  export class JmxTreeProcessor {

    constructor(
      private jolokia: Jolokia.IJolokia,
      private jolokiaStatus: JVM.JolokiaStatus,
      private rbacTasks: RBACTasks) {
    }

    /**
     * Process JMX tree and attach RBAC info (canInvoke) to it in advance.
     *
     * Matrix of supported RBAC Mbeans per platform:
     * +-------------------------+-----------+--------------+---------------+
     * |        Platform         | ACL MBean | RBACRegistry | RBACDecorator |
     * +-------------------------+-----------+--------------+---------------+
     * | Karaf                   | o         | o            | o             |
     * | WildFly                 | x (dummy) | o            | x             |
     * | Spring Boot             | x (dummy) | o            | x             |
     * | Artemis                 | o         | o            | x             |
     * | Jolokia (no hawtio.war) | x         | x            | x             |
     * +-------------------------+-----------+--------------+---------------+
     *
     * Object names for the RBAC MBeans:
     * - ACL MBean:     "*:type=security,area=jmx,*"
     * - RBACRegistry:  "hawtio:type=security,name=RBACRegistry"
     * - RBACDecorator: "hawtio:type=security,area=jolokia,name=RBACDecorator"
     */
    process(tree: Jmx.Folder): void {
      log.debug("Processing tree", tree);
      this.rbacTasks.getACLMBean().then((aclMBean) => {
        const mbeans = this.flatten(tree);
        switch (this.jolokiaStatus.listMethod) {
          case JVM.JolokiaListMethod.LIST_OPTIMISED:
            log.debug("Process JMX tree: optimised list mode");
            if (this.hasDecoratedRBAC(mbeans)) {
              log.debug("JMX tree already decorated with RBAC");
              this.processWithRBAC(mbeans);
            } else {
              log.debug("JMX tree not decorated with RBAC, fetching RBAC info now");
              this.processGeneral(aclMBean, mbeans);
            }
            log.debug("Processed tree mbeans with RBAC", mbeans);
            break;
          case JVM.JolokiaListMethod.LIST_GENERAL:
          case JVM.JolokiaListMethod.LIST_CANT_DETERMINE:
          default:
            log.debug("Process JMX tree: general mode");
            this.processGeneral(aclMBean, mbeans);
            log.debug("Processed tree mbeans", mbeans);
            break;
        }
      });
    }

    private flatten(tree: Jmx.Folder): MBeans {
      const mbeans: MBeans = {};
      this.flattenFolder(mbeans, tree);
      return mbeans;
    }

    /**
     * Recursive method to flatten MBeans folder
     */
    private flattenFolder(mbeans: MBeans, folder: Jmx.Folder): void {
      if (!Core.isBlank(folder.objectName)) {
        mbeans[folder.objectName] = folder;
      }
      if (folder.isFolder()) {
        folder.children.forEach(child => this.flattenFolder(mbeans, child as Jmx.Folder));
      }
    }

    /**
     * Check if RBACDecorator has been applied to the MBean tree at server side.
     */
    private hasDecoratedRBAC(mbeans: MBeans): boolean {
      const node = _.find(mbeans,
        folder => !_.isEmpty(folder.mbean.op) && _.isEmpty(folder.mbean.opByString));
      return _.isNil(node);
    }

    private processWithRBAC(mbeans: MBeans): void {
      // we already have everything related to RBAC in place, except 'class' property
      _.forEach(mbeans, (node: Jmx.Folder, mbeanName: string) => {
        const mbean = node.mbean;
        const canInvoke = mbean && (_.isNil(mbean.canInvoke) || mbean.canInvoke);
        this.addCanInvokeToClass(node, canInvoke);
      });
    }

    private processGeneral(aclMBean: string, mbeans: MBeans): void {
      const requests: Jolokia.IRequest[] = [];
      const bulkRequest: BulkRequest = {};
      // register canInvoke requests for each MBean and accumulate bulkRequest for all ops
      _.forEach(mbeans, (folder, mbeanName) => {
        this.addCanInvokeRequests(aclMBean, mbeanName, folder, requests, bulkRequest);
      });
      // register the bulk request finally based on the accumulated bulkRequest
      requests.push({
        type: 'exec',
        mbean: aclMBean,
        operation: 'canInvoke(java.util.Map)',
        arguments: [bulkRequest]
      });
      // send batch request
      log.debug('Batch canInvoke request:', requests);
      this.jolokia.request(requests, Core.onSuccess(
        (response) => this.applyCanInvoke(mbeans, response),
        { error: (response) => { /* silently ignore */ } }));
    }

    private addCanInvokeRequests(aclMBean: string, mbeanName: string, folder: Jmx.Folder,
      requests: Jolokia.IRequest[], bulkRequest: BulkRequest): void {
      // request for MBean
      requests.push({
        type: 'exec',
        mbean: aclMBean,
        operation: 'canInvoke(java.lang.String)',
        arguments: [mbeanName]
      });
      // bulk request for MBean ops
      if (folder.mbean && folder.mbean.op) {
        // opByString is later filled in addOperation()
        folder.mbean.opByString = {};
        const opList: string[] = [];
        _.forEach(folder.mbean.op, (op: Core.JMXOperation, opName: string) => {
          if (_.isArray(op)) {
            // overloaded ops
            _.forEach(op, (op) => this.addOperation(folder, opList, opName, op));
          } else {
            // single op
            this.addOperation(folder, opList, opName, op);
          }
        });
        if (!_.isEmpty(opList)) {
          bulkRequest[mbeanName] = opList;
        }
      }
    }

    private addOperation(folder: Jmx.Folder, opList: string[], opName: string, op: Core.JMXOperation): void {
      const opString = Core.operationToString(opName, op.args);
      // enrich the mbean by indexing the full operation string so we can easily look it up later
      folder.mbean.opByString[opString] = op;
      opList.push(opString);
    }

    private applyCanInvoke(mbeans: MBeans, response: Jolokia.IResponse): void {
      const mbean = response.request.arguments[0];
      if (mbean && _.isString(mbean)) {
        // single request
        const canInvoke = response.value;
        mbeans[mbean].mbean.canInvoke = response.value;
        this.addCanInvokeToClass(mbeans[mbean], canInvoke);
      } else {
        // batch request
        const bulkResponse: BulkResponse = response.value;
        log.debug('Batch canInvoke response:', bulkResponse);
        _.forEach(bulkResponse, (ops: Operations, mbeanName: string) => {
          _.forEach(ops, (op: Operation, opName: string) => {
            mbeans[mbeanName].mbean.opByString[opName]['canInvoke'] = op.CanInvoke;
          });
        });
      }
    }

    private addCanInvokeToClass(mbean: Jmx.Folder, canInvoke: boolean): void {
      const toAdd = canInvoke ? "can-invoke" : "cant-invoke";
      mbean.class = this.addClass(this.stripClasses(mbean.class), toAdd);
      if (!canInvoke) {
        // change the tree node icon to lock here
        mbean.icon = 'fa fa-lock';
      }
    }

    private stripClasses(css: string): string {
      if (Core.isBlank(css)) {
        return css;
      }
      let parts = css.split(" ");
      let answer = [];
      parts.forEach((part) => {
        if (part !== "can-invoke" && part !== "cant-invoke") {
          answer.push(part);
        }
      });
      return answer.join(" ").trim();
    }

    private addClass(css: string, _class: string): string {
      if (Core.isBlank(css)) {
        return _class;
      }
      let parts = css.split(" ");
      parts.push(_class);
      return _.uniq(parts).join(" ").trim();
    }

  }

}
