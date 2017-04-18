declare namespace Jmx {
    class HeaderController {
        title: string;
        constructor($rootScope: any);
    }
    const headerComponent: {
        template: string;
        controller: typeof HeaderController;
    };
}
