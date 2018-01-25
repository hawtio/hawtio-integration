namespace Camel {
  export class TreeHeaderController {

    filter: string = '';
    result: any[] = [];

    constructor(
      private $scope,
      private $element: JQuery) {
        'ngInject';
        // it's not possible to declare classes to the component host tag in AngularJS
        $element.addClass('tree-nav-sidebar-header');
    }

    $onInit(): void {
      this.$scope.$watch(angular.bind(this, () => this.filter),
        (filter, previous) => {
          if (filter !== previous) {
            this.search(filter);
          }
        }
      );
    }

    private search(filter: string): void {
      const doSearch = (filter: string) => {
        const result = this.tree().search(filter, {
          ignoreCase: true,
          exactMatch: false,
          revealResults: true,
        });
        this.result.length = 0;
        this.result.push(...result);
        Core.$apply(this.$scope);
      };
      _.debounce(doSearch, 300, { leading: false, trailing: true })(filter);
    }

    private tree(): any {
      return ($(treeElementId) as any).treeview(true);
    }

    expandAll(): any {
      return this.tree()
        .expandNode(this.tree().getNodes(), { levels: 1, silent: true });
    }

    contractAll(): any {
      return this.tree()
        .collapseNode(this.tree().getNodes(), { ignoreChildren: true, silent: true });
    }
  }
}
