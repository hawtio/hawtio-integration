namespace Camel {

  export const camelComponent: angular.IComponentOptions = {
    template: `
      <div class="tree-nav-layout">
        <div class="sidebar-pf sidebar-pf-left" resizable r-directions="['right']">
          <camel-tree-header></camel-tree-header>
          <camel-tree></camel-tree>
        </div>
        <div class="tree-nav-main">
          <div>
            <context-actions></context-actions>
            <route-actions></route-actions>
            <jmx-header></jmx-header>
          </div>
          <camel-navigation></camel-navigation>
          <div class="contents" ng-view></div>
        </div>
      </div>
    `
  };

}
