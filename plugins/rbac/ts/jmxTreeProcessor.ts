namespace RBAC {

  type MBeans = { [name: string]: Jmx.Folder };

  export class JmxTreeProcessor {

    constructor(
      private jolokia: Jolokia.IJolokia,
      private jolokiaStatus: JVM.JolokiaStatus,
      private rbacTasks: RBACTasks,
      private workspace: Jmx.Workspace) {
    }

    process(tree: Jmx.Folder): void {
      log.debug("Processing tree", tree);
      this.rbacTasks.getACLMBean().then((aclMBean) => {
        let mbeans: MBeans = {};
        this.flattenMBeanTree(mbeans, tree);
        let listMethod = this.jolokiaStatus.listMethod;
        switch (listMethod) {
          case JVM.JolokiaListMethod.LIST_WITH_RBAC:
            log.debug("Process JMX tree: list with RBAC mode");
            this.processWithRBAC(mbeans);
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

    private flattenMBeanTree(mbeans: MBeans, tree: Jmx.Folder): void {
      if (!Core.isBlank(tree.objectName)) {
        mbeans[tree.objectName] = tree;
      }
      if (tree.isFolder()) {
        tree.children.forEach((child) => this.flattenMBeanTree(mbeans, child as Jmx.Folder));
      }
    }

    private processWithRBAC(mbeans: MBeans): void {
      // we already have everything related to RBAC in place, except 'class' property
      _.forEach(mbeans, (node: Jmx.Folder, mbeanName: string) => {
        let mbean = node.mbean;
        let canInvoke = mbean && (_.isNil(mbean.canInvoke) || mbean.canInvoke);
        this.addCanInvokeToClass(node, canInvoke);
      });
    }

    private processGeneral(aclMBean: string, mbeans: MBeans): void {
      let requests = [];
      let bulkRequest = {};
      _.forEach(mbeans, (mbean, mbeanName) => {
        if (!('canInvoke' in mbean)) {
          requests.push({
            type: 'exec',
            mbean: aclMBean,
            operation: 'canInvoke(java.lang.String)',
            arguments: [mbeanName]
          });
          if (mbean.mbean && mbean.mbean.op) {
            let ops = mbean.mbean.op;
            mbean.mbean.opByString = {};
            let opList: string[] = [];
            _.forEach(ops, (op: Core.JMXOperation, opName: string) => {
              if (_.isArray(op)) {
                _.forEach(op, (op) => this.addOperation(mbean, opList, opName, op));
              } else {
                this.addOperation(mbean, opList, opName, op);
              }
            });
            bulkRequest[mbeanName] = opList;
          }
        }
      });
      requests.push({
        type: 'exec',
        mbean: aclMBean,
        operation: 'canInvoke(java.util.Map)',
        arguments: [bulkRequest]
      });
      this.jolokia.request(requests, Core.onSuccess(
        (response) => {
          let mbean = response.request.arguments[0];
          if (mbean && _.isString(mbean)) {
            let canInvoke = response.value;
            mbeans[mbean]['canInvoke'] = response.value;
            this.addCanInvokeToClass(mbeans[mbean], canInvoke);
          } else {
            let responseMap = response.value;
            _.forEach(responseMap, (operations, mbeanName) => {
              _.forEach(operations, (data, operationName) => {
                mbeans[mbeanName].mbean.opByString[operationName]['canInvoke'] = data['CanInvoke'];
              });
            });
          }
        },
        { error: (response) => { /* silently ignore */ } }));
    }

    private addOperation(mbean: Jmx.Folder, opList: string[], opName: string, op: Core.JMXOperation) {
      let operationString = Core.operationToString(opName, op.args);
      // enrich the mbean by indexing the full operation string so we can easily look it up later
      mbean.mbean.opByString[operationString] = op;
      opList.push(operationString);
    }

    private addCanInvokeToClass(mbean: any, canInvoke: boolean): void {
      let toAdd = canInvoke ? "can-invoke" : "cant-invoke";
      mbean['class'] = this.stripClasses(mbean['class']);
      mbean['class'] = this.addClass(mbean['class'], toAdd);
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
