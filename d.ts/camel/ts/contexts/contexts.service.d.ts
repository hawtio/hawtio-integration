/// <reference path="context.d.ts" />
declare namespace Camel {
    class ContextsService {
        private $q;
        private jolokia;
        constructor($q: ng.IQService, jolokia: Jolokia.IJolokia);
        getContexts(mbeans: string[]): ng.IPromise<Context[]>;
        startContexts(contexts: Context[]): ng.IPromise<Context[]>;
        suspendContexts(contexts: Context[]): ng.IPromise<Context[]>;
        deleteContexts(contexts: Context[]): ng.IPromise<Context[]>;
        executeOperationOnContexts(operation: string, contexts: Context[]): ng.IPromise<Context[]>;
    }
}
