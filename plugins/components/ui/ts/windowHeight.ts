/// <reference path="uiPlugin.ts"/>
//
namespace UI {

  _module.directive('hawtioWindowHeight', ['$window', ($window) => {
    return {
      restrict: 'A',
      replace: false,
      link: (scope, element, attrs) => {

        var viewportHeight = $window.innerHeight;
  
        function processElement(el) {
          var offset = el.offset();
          if (!offset) {
            return;
          }
          var top = offset.top;
          var height = viewportHeight - top;
          if (height > 0) {
            el.attr({
              'style': 'height: ' + height + 'px;'
            });
          }
        }

        function layout() {
          viewportHeight = $window.innerHeight;
          element.parents().each((index, el) => {
            el = <any>$(el);
            processElement(el);
          });
          processElement(element);
        }
        scope.$watch(_.debounce(layout, 1000, { trailing: true}));
      }
    };
  }]);


}
