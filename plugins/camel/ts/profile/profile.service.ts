/// <reference path="../../../jvm/ts/jolokia/jolokia.service.ts"/>

namespace Camel {

  export class ProfileService {

    constructor(private treeService: Jmx.TreeService, private jolokiaService: JVM.JolokiaService) {
      'ngInject';
    }

    getProfile(): ng.IPromise<any[]> {
      return this.treeService.getSelectedMBeanName()
        .then(mbeanName => this.jolokiaService.execute(mbeanName, 'dumpRouteStatsAsXml(boolean,boolean)', false, true))
        .then(xml => {
          const profile = [];
          const doc = $.parseXML(xml);
          const routeMessages = $(doc).find("routeStat");

          routeMessages.each((idx, message) => {
            const messageData = {
              id: {},
              count: {},
              last: {},
              delta: {},
              mean: {},
              min: {},
              max: {},
              total: {},
              self: {}
            };

            // compare counters, as we only update if we have new data
            messageData.id = message.getAttribute("id");

            let total = 0;
            total += +message.getAttribute("exchangesCompleted");
            total += +message.getAttribute("exchangesFailed");
            messageData.count = total;
            messageData.last = parseInt(message.getAttribute("lastProcessingTime"));
            // delta is only avail from Camel 2.11 onwards
            const delta = message.getAttribute("deltaProcessingTime");
            if (delta) {
              messageData.delta = parseInt(delta);
            } else {
              messageData.delta = 0;
            }
            messageData.mean = parseInt(message.getAttribute("meanProcessingTime"));
            messageData.min = parseInt(message.getAttribute("minProcessingTime"));
            messageData.max = parseInt(message.getAttribute("maxProcessingTime"));
            messageData.total = parseInt(message.getAttribute("totalProcessingTime"));
            messageData.self = parseInt(message.getAttribute("selfProcessingTime"));

            profile.push(messageData);
          });

          const processorMessages = $(doc).find("processorStat");

          processorMessages.each((idx, message) => {
            const messageData = {
              id: {},
              count: {},
              last: {},
              delta: {},
              mean: {},
              min: {},
              max: {},
              total: {},
              self: {}
            };

            messageData.id = message.getAttribute("id");
            let total = 0;
            total += +message.getAttribute("exchangesCompleted");
            total += +message.getAttribute("exchangesFailed");
            messageData.count = total;
            messageData.last = parseInt(message.getAttribute("lastProcessingTime"));
            // delta is only avail from Camel 2.11 onwards
            const delta = message.getAttribute("deltaProcessingTime");
            if (delta) {
              messageData.delta = parseInt(delta);
            } else {
              messageData.delta = 0;
            }
            messageData.mean = parseInt(message.getAttribute("meanProcessingTime"));
            messageData.min = parseInt(message.getAttribute("minProcessingTime"));
            messageData.max = parseInt(message.getAttribute("maxProcessingTime"));
            // total time for processors is pre calculated as accumulated from Camel 2.11 onwards
            const apt = message.getAttribute("accumulatedProcessingTime");
            if (apt) {
              messageData.total = parseInt(apt);
            } else {
              messageData.total = 0;
            }
            // self time for processors is their total time
            messageData.self = parseInt(message.getAttribute("totalProcessingTime"));

            profile.push(messageData);
          });

          return profile;
        });
    }

  }

}
