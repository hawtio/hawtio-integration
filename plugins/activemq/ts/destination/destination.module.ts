/// <reference path="destination.component.ts"/>

namespace ActiveMQ {

  export const destinationModule = angular
    .module('hawtio-activemq-destination', [])
    .component('createDestination', createDestinationComponent)
    .component('deleteQueue', deleteQueueComponent)
    .component('deleteTopic', deleteTopicComponent)
    .name;

}
