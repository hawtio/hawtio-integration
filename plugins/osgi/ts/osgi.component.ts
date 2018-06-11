namespace Osgi {

  export const osgiComponent: angular.IComponentOptions = {
    template: `
      <div class="osgi-nav-main">
        <osgi-navigation></osgi-navigation>
        <div class="contents" ng-view></div>
      </div>
    `
  };

}
