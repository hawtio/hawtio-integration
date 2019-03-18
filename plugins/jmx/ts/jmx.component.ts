namespace Jmx {

  export const jmxComponent: angular.IComponentOptions = {
    template: `
      <div class="tree-nav-layout">
        <div class="sidebar-pf sidebar-pf-left" resizable r-directions="['right']">
          <tree-header></tree-header>
          <tree></tree>
        </div>
        <div class="tree-nav-main">
          <jmx-header></jmx-header>
          <jmx-navigation></jmx-navigation>
          <div class="contents" ng-view></div>
        </div>
      </div>
    `
  };

}
