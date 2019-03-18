/// <reference path="uiPlugin.ts"/>

namespace UI {

  // simple directive that adds the patternfly card BG color to the content area of a hawtio app
  _module.directive('hawtioCardBg', ['$timeout', ($timeout) => {
    return {
      restrict: 'AC',
      link: (scope, element, attr) => {
        $timeout(() => {
          var parent = $('body');
          //console.log("Parent: ", parent);
          parent.addClass('cards-pf');
          element.on('$destroy', () => {
            parent.removeClass('cards-pf');
          });
        }, 10);
      }
    }
  }]);
}
