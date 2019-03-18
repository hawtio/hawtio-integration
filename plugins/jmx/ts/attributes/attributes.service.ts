/// <reference path="../../../rbac/ts/models.ts"/>

namespace Jmx {

  export class AttributesService {

    constructor(
      private $q: ng.IQService,
      private jolokia: Jolokia.IJolokia,
      private jolokiaUrl: string,
      private rbacACLMBean: ng.IPromise<string>) {
      'ngInject';
    }

    registerJolokia(scope: any, request: any, callback: any): void {
      Core.register(this.jolokia, scope, request, callback);
    }

    unregisterJolokia(scope: any): void {
      Core.unregister(this.jolokia, scope);
    }

    listMBean(mbeanName: string, callback: any): void {
      this.jolokia.request(
        {
          type: "LIST",
          method: "post",
          path: Core.escapeMBeanPath(mbeanName),
          ignoreErrors: true
        },
        callback);
    }

    canInvoke(mbeanName: string, attribute: string, type: string): ng.IPromise<boolean> {
      return this.$q<boolean>((resolve, reject) => {
        if (_.isNull(mbeanName) || _.isNull(attribute) || _.isNull(type)) {
          resolve(false);
          return;
        }
        this.rbacACLMBean.then((rbacACLMBean) => {
          if (!rbacACLMBean) {
            // Client-side RBAC is not available
            resolve(true);
          }
          this.jolokia.request(
            {
              type: 'exec',
              mbean: rbacACLMBean,
              operation: 'canInvoke(java.lang.String,java.lang.String,[Ljava.lang.String;)',
              arguments: [mbeanName, `set${attribute}`, [type]]
            },
            Core.onSuccess(
              (response) => {
                log.debug("rbacACLMBean canInvoke attribute response:", response);
                let canInvoke = response.value as boolean;
                resolve(canInvoke);
              },
              {
                error: (response) => {
                  log.debug('AttributesService.canInvoke() failed:', response)
                  resolve(false);
                }
              }
            )
          );
        });
      });
    }

    buildJolokiaUrl(mbeanName: string, attribute: string): string {
      return `${this.jolokiaUrl}/read/${Core.escapeMBean(mbeanName)}/${attribute}`;
    }

    update(mbeanName: string, attribute: string, value: any): void {
      this.jolokia.setAttribute(mbeanName, attribute, value,
        Core.onSuccess(
          (response) => {
            Core.notification("success", `Updated attribute ${attribute}`);
          },
          {
            error: (response) => {
              log.debug("Failed to update attribute", response);
              Core.notification("danger", `Failed to update attribute ${attribute}`);
            }
          }
        ));
    }

  }

}
