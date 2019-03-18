/// <reference path="uiPlugin.ts"/>

namespace UI {

  interface ClipboardScope extends ng.IScope {
    hawtioClipboard: string;
  }

  function clipboardDirective($timeout: ng.ITimeoutService): ng.IDirective {
    'ngInject';
    return {
      restrict: 'A',
      scope: {
        hawtioClipboard: '@'
      },
      link($scope: ClipboardScope, $element, $attrs) {
        let copied = false;
        $element.attr('data-clipboard-target', $scope.hawtioClipboard);
        $element.tooltip({placement: 'bottom', title: 'Copy to clipboard'});
    
        new Clipboard($element.get(0)).on('success', () => {
          $element.tooltip('destroy');
          $timeout(() => {
            $element.tooltip({placement: 'bottom', title: 'Copied!'});
            $element.tooltip('show');
            copied = true;
          }, 200);
        });
    
        $element.on('mouseleave', () => {
          if (copied) {
            $element.tooltip('destroy');
            $timeout(() => {
              $element.tooltip({placement: 'bottom', title: 'Copy to clipboard'});
              copied = false;
            }, 200);
          }
        });
      }
    };
  }

  _module.directive('hawtioClipboard', clipboardDirective);

}
