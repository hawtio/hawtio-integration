/// <reference path="../camelPlugin.d.ts" />
declare namespace Camel {
    class ToolbarController {
        constructor();
    }
    const toolbarComponent: {
        template: string;
        controller: typeof ToolbarController;
    };
}
