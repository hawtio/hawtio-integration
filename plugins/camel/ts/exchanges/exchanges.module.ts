/// <reference path="exchanges.component.ts"/>
/// <reference path="inflight-exchanges.component.ts"/>
/// <reference path="blocked-exchanges.component.ts"/>
/// <reference path="confirm-unblock-exchange.component.ts"/>
/// <reference path="exchanges.service.ts"/>

namespace Camel {

  export const exchangesModule = angular
    .module('hawtio-camel-exchanges', [])
    .component('exchanges', exchangesComponent)
    .component('inflightExchanges', inflightExchangesComponent)
    .component('blockedExchanges', blockedExchangesComponent)
    .component('confirmUnblockExchange', confirmUnblockExchangeComponent)
    .service('exchangesService', ExchangesService)
    .name;

}
