declare namespace Camel {
    class Context {
        name: string;
        state: string;
        managementName: string;
        selected: boolean;
        constructor(name: string, state: string, managementName: string);
        mbean: string;
    }
}
