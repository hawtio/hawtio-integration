namespace Jmx {

  export class Operation {

    args: OperationArgument[];
    description: string;
    name: string;
    readableName: string;
    canInvoke: boolean;

    constructor(method: string, args: OperationArgument[], description: string) {
      this.args = args;
      this.description = description;
      this.name = Operation.buildName(method, args);
      this.readableName = Operation.buildReadableName(method, args);
      this.canInvoke = true;
    }

    private static buildName(method: string, args: OperationArgument[]): string {
      return method + "(" + args.map(arg => arg.type).join() + ")";
    }

    private static buildReadableName(method: string, args: OperationArgument[]): string {
      return method + "(" + args.map(arg => arg.readableType()).join(', ') + ")";
    }
  }

  export class OperationArgument {
    name: string;
    type: string;
    desc: string;

    constructor() { }

    readableType(): string {
      let lastDotIndex = this.type.lastIndexOf('.');
      let answer = lastDotIndex > 0 ? this.type.substr(lastDotIndex + 1) : this.type;
      if (_.startsWith(this.type, '[') && _.endsWith(this.type, ';')) {
        answer = _.trimEnd(answer, ';') + '[]';
      }
      return answer;
    }
  }

}
