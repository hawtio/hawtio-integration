/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
namespace UI {

  _module.directive('hawtioAutoDropdown', ['$timeout', ($timeout) => ({
    restrict: 'A',
    link: ($scope, $element, $attrs) => {
      function locateElements (event?) {
        var el = $element.get(0);
        if (event && event.relatedNode !== el && event.type) {
          if (event && event.type !== 'resize') {
            return;
          }
        }

        var overflowEl = $($element.find('.dropdown.overflow'));
        var overflowMenu = $(overflowEl.find('ul.dropdown-menu'));
        var margin = 0;
        var availableWidth = 0;

        try {
          overflowEl.addClass('pull-right');
          margin = overflowEl.outerWidth() - overflowEl.innerWidth();
          availableWidth = overflowEl.position().left - $element.position().left - 50;
          overflowEl.removeClass('pull-right');
        } catch (e) {
          log.debug("caught " + e);
        }

        overflowMenu.children().insertBefore(overflowEl);

        let overflowItems = [];

        $element.children(':not(.overflow):not(:hidden)').each(function() {
          var self = $(this);
          availableWidth = availableWidth - self.outerWidth(true);
          if (availableWidth < 0) {
            overflowItems.push(self);
          }
        });

        for (let i = overflowItems.length - 1; i > -1; i--) {
          overflowItems[i].prependTo(overflowMenu);
        }

        if (overflowMenu.children().length > 0) {
          overflowEl.css('visibility', 'visible');
        }

        if (availableWidth > 130) {
          var noSpace = false;

          overflowMenu.children(':not(.overflow)').filter(function() {
            return $(this).css('display') !== 'none';
          }).each(function() {
            if (noSpace) {
              return;
            }
            var self = $(this);

            if (availableWidth > self.outerWidth()) {
              availableWidth = availableWidth - self.outerWidth();
              self.insertBefore(overflowEl);
            } else {
              noSpace = true;
            }
          });
        }

        if (overflowMenu.children().length === 0) {
          overflowEl.css('visibility', 'hidden');
        }
      }

      $(window).resize(_.throttle(locateElements, 100));
      $scope.$on('$routeChangeSuccess', () => $timeout(locateElements, 0, false));

      $timeout(locateElements, 0, false);
    }
  })]);
}
