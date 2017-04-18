/// <reference path="context.d.ts" />
/// <reference path="contexts.service.d.ts" />
declare namespace Camel {
    class ContextsController {
        private $uibModal;
        private workspace;
        private contextsService;
        toolbarConfig: {
            actionsConfig: {
                primaryActions: {
                    name: string;
                    actionFn: (action: any) => void;
                }[];
                moreActions: {
                    name: string;
                    actionFn: (action: any) => void;
                }[];
            };
        };
        tableConfig: {
            selectionMatchProp: string;
        };
        tableColummns: {
            header: string;
            itemField: string;
        }[];
        tableItems: {
            name: any;
            state: any;
        }[];
        contexts: Context[];
        constructor($uibModal: any, workspace: Core.Workspace, contextsService: ContextsService);
        $onInit(): void;
        private getSelectedContexts();
        private loadContexts();
        private updateContexts();
        private removeSelectedContexts();
    }
    const contextsComponent: {
        templateUrl: string;
        controller: typeof ContextsController;
    };
}
