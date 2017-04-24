/// <reference path="../../includes.ts"/>
/// <reference path="activemqPlugin.ts"/>

namespace ActiveMQ {

  _module.controller('ActiveMQ.TabsController', ['$scope', '$location', 'workspace', (
      $scope,
      $location: ng.ILocationService,
      workspace: Jmx.Workspace) => {

    $scope.tabs = [
      {
        id: 'jmx-attributes',
        title: 'Attributes',
        href: "/jmx/attributes" + workspace.hash(),
        show: () => true
      },
      {
        id: 'jmx-operations',
        title: 'Operations',
        href: "/jmx/operations" + workspace.hash(),
        show: () => true
      },
      {
        id: 'jmx-charts',
        title: 'Chart',
        href: "/jmx/charts" + workspace.hash(),
        show: () => true
      },
      {
        id     : 'activemq-browse',
        title  : 'Browse',
        tooltip: "Browse the messages on the queue",
        show   : () => isQueue(workspace) && workspace.hasInvokeRights(workspace.selection, 'browse()'),
        href   : '/activemq/browseQueue' + workspace.hash()
      },
      {
        id     : 'activemq-send',
        title  : 'Send',
        tooltip: 'Send a message to this destination',
        show   : () => (isQueue(workspace) || isTopic(workspace)) && workspace.hasInvokeRights(workspace.selection, 'sendTextMessage(java.util.Map,java.lang.String,java.lang.String,java.lang.String)'),
        href   : '/activemq/sendMessage' + workspace.hash()
      },
      {
        id     : 'activemq-durable-subscribers',
        title  : 'Durable Subscribers',
        tooltip: 'Manage durable subscribers',
        show   : () => isBroker(workspace),
        href   : '/activemq/durableSubscribers' + workspace.hash()
      },
      {
        id     : 'activemq-jobs',
        title  : 'Jobs',
        tooltip: 'Manage jobs',
        show   : () => isJobScheduler(workspace),
        href   : '/activemq/jobs' + workspace.hash()
      },
      {
        id     : 'activemq-create-destination',
        title  : 'Create',
        tooltip: 'Create a new destination',
        show   : () => (isBroker(workspace) || isQueuesFolder(workspace) || isTopicsFolder(workspace) || isQueue(workspace) || isTopic(workspace)) && workspace.hasInvokeRights(getBroker(workspace), 'addQueue', 'addTopic'),
        href   : '/activemq/createDestination' + workspace.hash()
      },
      {
        id     : 'activemq-delete-topic',
        title  : 'Delete',
        tooltip: 'Delete this topic',
        show   : () => isTopic(workspace) && workspace.hasInvokeRights(getBroker(workspace), 'removeTopic'),
        href   : '/activemq/deleteTopic' + workspace.hash()
      },
      {
        id     : 'activemq-delete-queue',
        title  : 'Delete',
        tooltip: 'Delete or purge this queue',
        show   : () => isQueue(workspace) && workspace.hasInvokeRights(getBroker(workspace), 'removeQueue'),
        href   : '/activemq/deleteQueue' + workspace.hash()
      },
      {
        id     : 'activemq-queues',
        title  : 'Queues',
        tooltip: 'View Queues',
        show   : () => isBroker(workspace),
        href   : '/activemq/queues' + workspace.hash()
      },
      {
        id     : 'activemq-topics',
        title  : 'Topics',
        tooltip: 'View Topics',
        show   : () => isBroker(workspace),
        href   : '/activemq/topics' + workspace.hash()
      }
    ];

    $scope.isActive = tab => workspace.isLinkActive(tab.href);
  }]);
}
