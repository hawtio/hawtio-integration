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
        path: "/jmx/attributes",
        show: () => true
      },
      {
        id: 'jmx-operations',
        title: 'Operations',
        path: "/jmx/operations",
        show: () => true
      },
      {
        id: 'jmx-charts',
        title: 'Chart',
        path: "/jmx/charts",
        show: () => true
      },
      {
        id     : 'activemq-browse',
        title  : 'Browse',
        tooltip: "Browse the messages on the queue",
        show   : () => isQueue(workspace) && workspace.hasInvokeRights(workspace.selection, 'browse()'),
        path   : '/activemq/browseQueue'
      },
      {
        id     : 'activemq-send',
        title  : 'Send',
        tooltip: 'Send a message to this destination',
        show   : () => (isQueue(workspace) || isTopic(workspace)) && workspace.hasInvokeRights(workspace.selection, 'sendTextMessage(java.util.Map,java.lang.String,java.lang.String,java.lang.String)'),
        path   : '/activemq/sendMessage'
      },
      {
        id     : 'activemq-durable-subscribers',
        title  : 'Durable Subscribers',
        tooltip: 'Manage durable subscribers',
        show   : () => isBroker(workspace),
        path   : '/activemq/durableSubscribers'
      },
      {
        id     : 'activemq-jobs',
        title  : 'Jobs',
        tooltip: 'Manage jobs',
        show   : () => isJobScheduler(workspace),
        path   : '/activemq/jobs'
      },
      {
        id     : 'activemq-create-destination',
        title  : 'Create',
        tooltip: 'Create a new destination',
        show   : () => isBroker(workspace) && workspace.hasInvokeRights(getBroker(workspace), 'addQueue', 'addTopic'),
        path   : '/activemq/createDestination'
      },
      {
        id     : 'activemq-delete-topic',
        title  : 'Delete',
        tooltip: 'Delete this topic',
        show   : () => isTopic(workspace) && workspace.hasInvokeRights(getBroker(workspace), 'removeTopic'),
        path   : '/activemq/deleteTopic'
      },
      {
        id     : 'activemq-delete-queue',
        title  : 'Delete',
        tooltip: 'Delete or purge this queue',
        show   : () => isQueue(workspace) && workspace.hasInvokeRights(getBroker(workspace), 'removeQueue'),
        path   : '/activemq/deleteQueue'
      },
      {
        id     : 'activemq-queues',
        title  : 'Queues',
        tooltip: 'View Queues',
        show   : () => isBroker(workspace),
        path   : '/activemq/queues'
      },
      {
        id     : 'activemq-topics',
        title  : 'Topics',
        tooltip: 'View Topics',
        show   : () => isBroker(workspace),
        path   : '/activemq/topics'
      }
    ];

    $scope.isActive = tab => workspace.isLinkActive(tab.path);

    $scope.goto = (path: string) => $location.path(path);
  }]);
}
