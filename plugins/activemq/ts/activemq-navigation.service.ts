/// <reference path="activemqHelpers.ts"/>

namespace ActiveMQ {

  export class ActiveMQNavigationService {

    constructor(private workspace: Jmx.Workspace) {
      'ngInject';
    }

    getTabs(): Core.HawtioTab[] {
      const tabs = [];
      
      tabs.push(new Core.HawtioTab('Attributes', '/jmx/attributes'));
      tabs.push(new Core.HawtioTab('Operations', '/jmx/operations'));
      tabs.push(new Core.HawtioTab('Chart', '/jmx/charts'));
      
      if (this.shouldShowBrowseTab()) {
        tabs.push(new Core.HawtioTab('Browse', '/activemq/browseQueue'));
      }

      if (this.shouldShowSendTab()) {
        tabs.push(new Core.HawtioTab('Send', '/activemq/sendMessage'));
      }

      if (this.shouldShowDurableSubscribersTab()) {
        tabs.push(new Core.HawtioTab('Durable Subscribers', '/activemq/durableSubscribers'));
      }
      
      if (this.shouldShowJobsTab()) {
        tabs.push(new Core.HawtioTab('Jobs', '/activemq/jobs'));
      }

      if (this.shouldShowCreateTab()) {
        tabs.push(new Core.HawtioTab('Create', '/activemq/createDestination'));
      }
      
      if (this.shouldShowDeleteTopicTab()) {
        tabs.push(new Core.HawtioTab('Delete', '/activemq/deleteTopic'));
      }

      if (this.shouldShowDeleteQueueTab()) {
        tabs.push(new Core.HawtioTab('Delete', '/activemq/deleteQueue'));
      }

      if (this.shouldShowQueuesTab()) {
        tabs.push(new Core.HawtioTab('Queues', '/activemq/queues'));
      }

      if (this.shouldShowTopicsTab()) {
        tabs.push(new Core.HawtioTab('Topics', '/activemq/topics'));
      }
      
      return tabs;
    }    

    private shouldShowBrowseTab() {
      return this.isQueue() && this.workspace.hasInvokeRights(this.workspace.selection, 'browse()');
    }

    private shouldShowSendTab() {
      return (this.isQueue() || this.isTopic()) &&
      this.workspace.hasInvokeRights(this.workspace.selection, 'sendTextMessage(java.util.Map,java.lang.String,java.lang.String,java.lang.String)');
    }

    private shouldShowDurableSubscribersTab() {
      return this.isBroker();
    }
    
    private shouldShowJobsTab() {
      return this.isJobScheduler();
    }

    private shouldShowCreateTab() {
      return this.isBroker() && this.workspace.hasInvokeRights(this.getBroker(), 'addQueue', 'addTopic');
    }

    private shouldShowDeleteTopicTab() {
      return this.isTopic() && this.workspace.hasInvokeRights(this.getBroker(), 'removeTopic');
    }

    private shouldShowDeleteQueueTab() {
      return this.isQueue() && this.workspace.hasInvokeRights(this.getBroker(), 'removeQueue');
    }
    
    private shouldShowQueuesTab() {
      return this.isBroker();
    }

    private shouldShowTopicsTab() {
      return this.isBroker();
    }

    private isQueue() {
      return this.workspace.hasDomainAndProperties(jmxDomain, {'destinationType': 'Queue'}, 4) ||
        this.workspace.selectionHasDomainAndType(jmxDomain, 'Queue');
    }
  
    private isTopic() {
      return this.workspace.hasDomainAndProperties(jmxDomain, {'destinationType': 'Topic'}, 4) || this.workspace.selectionHasDomainAndType(jmxDomain, 'Topic');
    }
  
    private isQueuesFolder() {
      return this.workspace.selectionHasDomainAndLastFolderName(jmxDomain, 'Queue');
    }
  
    private isTopicsFolder() {
      return this.workspace.selectionHasDomainAndLastFolderName(jmxDomain, 'Topic');
    }
  
    private isJobScheduler() {
        return this.workspace.hasDomainAndProperties(jmxDomain, {'service': 'JobScheduler'}, 4);
    }
  
    private isBroker() {
      if (this.workspace.selectionHasDomainAndType(jmxDomain, 'Broker')) {
        var self = Core.pathGet(this.workspace, ["selection"]);
        var parent = Core.pathGet(this.workspace, ["selection", "parent"]);
        return !(parent && (parent.ancestorHasType('Broker') || self.ancestorHasType('Broker')));
      }
      return false;
    }

    private getBroker() {
      var answer: Jmx.Folder = null;
      var selection = this.workspace.selection;
      if (selection) {
        answer = <Jmx.Folder> selection.findAncestor((current: Jmx.Folder) => {
          var entries = <any> current.entries;
          if (entries) {
            return (('type' in entries && entries.type === 'Broker') && 'brokerName' in entries && !('destinationName' in entries) && !('destinationType' in entries))
          } else {
            return false;
          }
        });
      }
      return answer;
    }
      
  }

  _module.service('activeMQNavigationService', ActiveMQNavigationService);
  
}
