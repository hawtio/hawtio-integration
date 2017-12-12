/// <reference path="destination.controller.ts"/>
/// <reference path="../activemqHelpers.ts"/>

namespace ActiveMQ {

  export const createDestinationComponent: angular.IComponentOptions = {
    controller: DestinationController,
    templateUrl: 'plugins/activemq/html/destination/create.html'
  };

  export const deleteQueueComponent: angular.IComponentOptions = {
    controller: DestinationController,
    templateUrl: 'plugins/activemq/html/destination/deleteQueue.html'
  };

  export const deleteTopicComponent: angular.IComponentOptions = {
    controller: DestinationController,
    templateUrl: 'plugins/activemq/html/destination/deleteTopic.html'
  };

}
