/// <reference path="activemqHelpers.ts"/>

namespace ActiveMQ {

  const TAB_CONFIG: any = {
    attributes: {
      title: 'Attributes',
      route: '/activemq/attributes'
    },
    operations: {
      title: 'Operations',
      route: '/activemq/operations'
    },
    chart: {
      title: 'Chart',
      route: '/activemq/charts'
    },
    browse: {
      title: 'Browse',
      route: '/activemq/browseQueue'
    },
    sendMessage: {
      title: 'Send',
      route: '/activemq/sendMessage'
    },
    durableSubscribers: {
      title: 'Durable Subscribers',
      route: '/activemq/durableSubscribers'
    },
    jobs: {
      title: 'Jobs',
      route: '/activemq/jobs'
    },
    createDestination: {
      title: 'Create',
      route: '/activemq/createDestination'
    },
    deleteTopic: {
      title: 'Delete',
      route: '/activemq/deleteTopic'
    },
    deleteQueue: {
      title: 'Delete',
      route: '/activemq/deleteQueue'
    },
    queues: {
      title: 'Queues',
      route: '/activemq/queues'
    },
    topics: {
      title: 'Topics',
      route: '/activemq/topics'
    },
  }

  export class ActiveMQNavigationService {

    constructor(private workspace: Jmx.Workspace, private configManager: Core.ConfigManager) {
      'ngInject';
    }

    getTabs(): Nav.HawtioTab[] {
      const tabs = [];

      let enabledRoutes = Object.keys(TAB_CONFIG)
        .map(config => {return TAB_CONFIG[config].route})
        .filter(route => {return _.startsWith(route, '/activemq') && this.configManager.isRouteEnabled(route)});

      if (enabledRoutes.length > 0) {
        tabs.push(new Nav.HawtioTab(TAB_CONFIG.attributes.title, TAB_CONFIG.attributes.route));
        tabs.push(new Nav.HawtioTab(TAB_CONFIG.operations.title, TAB_CONFIG.operations.route));
        tabs.push(new Nav.HawtioTab(TAB_CONFIG.chart.title, TAB_CONFIG.chart.route));

        if (this.shouldShowBrowseTab()) {
          tabs.push(new Nav.HawtioTab(TAB_CONFIG.browse.title, TAB_CONFIG.browse.route));
        }

        if (this.shouldShowSendTab()) {
          tabs.push(new Nav.HawtioTab(TAB_CONFIG.sendMessage.title, TAB_CONFIG.sendMessage.route));
        }

        if (this.shouldShowDurableSubscribersTab()) {
          tabs.push(new Nav.HawtioTab(TAB_CONFIG.durableSubscribers.title, TAB_CONFIG.durableSubscribers.route));
        }

        if (this.shouldShowJobsTab()) {
          tabs.push(new Nav.HawtioTab(TAB_CONFIG.jobs.title, TAB_CONFIG.jobs.route));
        }

        if (this.shouldShowCreateTab()) {
          tabs.push(new Nav.HawtioTab(TAB_CONFIG.createDestination.title, TAB_CONFIG.createDestination.route));
        }

        if (this.shouldShowDeleteTopicTab()) {
          tabs.push(new Nav.HawtioTab(TAB_CONFIG.deleteTopic.title, TAB_CONFIG.deleteTopic.route));
        }

        if (this.shouldShowDeleteQueueTab()) {
          tabs.push(new Nav.HawtioTab(TAB_CONFIG.deleteQueue.title, TAB_CONFIG.deleteQueue.route));
        }

        if (this.shouldShowQueuesTab()) {
          tabs.push(new Nav.HawtioTab(TAB_CONFIG.queues.title, TAB_CONFIG.queues.route));
        }

        if (this.shouldShowTopicsTab()) {
          tabs.push(new Nav.HawtioTab(TAB_CONFIG.topics.title, TAB_CONFIG.topics.route));
        }
      }

      return tabs;
    }

    private shouldShowBrowseTab() {
      return this.configManager.isRouteEnabled(TAB_CONFIG.browse.route) && this.isQueue() &&
        this.workspace.hasInvokeRights(this.workspace.selection, 'browse()');
    }

    private shouldShowSendTab() {
      return this.configManager.isRouteEnabled(TAB_CONFIG.sendMessage.route) && (this.isQueue() || this.isTopic()) &&
      this.workspace.hasInvokeRights(this.workspace.selection, 'sendTextMessage(java.util.Map,java.lang.String,java.lang.String,java.lang.String)');
    }

    private shouldShowDurableSubscribersTab() {
      return this.configManager.isRouteEnabled(TAB_CONFIG.durableSubscribers.route) && this.isBroker();
    }

    private shouldShowJobsTab() {
      return this.configManager.isRouteEnabled(TAB_CONFIG.jobs.route) && this.isJobScheduler();
    }

    private shouldShowCreateTab() {
      return this.configManager.isRouteEnabled(TAB_CONFIG.createDestination.route) && this.isBroker() &&
        this.workspace.hasInvokeRights(this.getBroker(), 'addQueue', 'addTopic');
    }

    private shouldShowDeleteTopicTab() {
      return this.configManager.isRouteEnabled(TAB_CONFIG.deleteTopic.route) && this.isTopic() &&
        this.workspace.hasInvokeRights(this.getBroker(), 'removeTopic');
    }

    private shouldShowDeleteQueueTab() {
      return this.configManager.isRouteEnabled(TAB_CONFIG.deleteQueue.route) && this.isQueue() &&
        this.workspace.hasInvokeRights(this.getBroker(), 'removeQueue');
    }

    private shouldShowQueuesTab() {
      return this.configManager.isRouteEnabled(TAB_CONFIG.queues.route) && this.isBroker();
    }

    private shouldShowTopicsTab() {
      return this.configManager.isRouteEnabled(TAB_CONFIG.topics.route) && this.isBroker();
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

}
