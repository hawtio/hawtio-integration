/// <reference path="models.ts"/>

namespace RBAC {

  export class RBACTasksFactory {
    static create(postLoginTasks: Core.Tasks, jolokia: Jolokia.IJolokia, $q: ng.IQService): RBACTasks {
      'ngInject';
      let rbacTasks = new RBACTasksImpl($q.defer());
      postLoginTasks.addTask("FetchJMXSecurityMBeans", () => rbacTasks.fetchJMXSecurityMBeans(jolokia));
      return rbacTasks;
    }
  }

  export class RBACACLMBeanFactory {
    static create(rbacTasks: RBACTasks): ng.IPromise<string> {
      'ngInject';
      return rbacTasks.getACLMBean();
    }
  }

  class RBACTasksImpl extends Core.Tasks implements RBACTasks {

    private ACLMBean: string = null;

    constructor(private deferred: ng.IDeferred<string>) {
      super("RBAC");
    }

    fetchJMXSecurityMBeans(jolokia: Jolokia.IJolokia): void {
      jolokia.request(
        { type: 'search', mbean: '*:type=security,area=jmx,*' },
        Core.onSuccess((response) => {
          log.debug("Fetching JMXSecurity MBeans...", response);
          let mbeans = response.value as string[];
          let chosen = "";
          if (mbeans.length === 0) {
            log.info("Didn't discover any JMXSecurity mbeans, client-side role based access control is disabled");
          } else if (mbeans.length === 1) {
            chosen = mbeans[0];
          } else if (mbeans.length > 1) {
            let picked = false;
            mbeans.forEach((mbean) => {
              if (picked) {
                return;
              }
              if (_.includes(mbean, "HawtioDummy")) {
                return;
              }
              if (!_.includes(mbean, "rank=")) {
                chosen = mbean;
                picked = true;
              }
            });
          }
          if (chosen != null && chosen != "") {
            log.info("Using mbean", chosen, "for client-side role based access control");
          } else {
            log.info("Didn't discover any effective JMXSecurity mbeans, client-side role based access control is disabled");
          }
          this.initialize(chosen);
        }));
    }

    initialize(mbean: string): void {
      this.ACLMBean = mbean;
      this.deferred.resolve(this.ACLMBean);
      super.execute();
    }

    getACLMBean(): ng.IPromise<string> {
      return this.deferred.promise;
    }
  }

}
