/// <reference path="forms2Plugin.ts"/>
namespace HawtioForms {

    _module.directive('hawtioCombobox', [() => {
      return {
        restrict: 'A',
        link: (scope, element, attrs) => {
          // TODO - disable the bootstrap combobox until we can have it properly display a drop-down
          /*
          var isComboboxAlready = false;
          scope.$children = element.children();
          scope.$watchCollection('$children', (children) => {
            if (!isComboboxAlready && children.length > 5) {
              isComboboxAlready = true;
              (<any>element).combobox();
            }
            setTimeout(() => {
              console.log("Refreshing");
              (<any>element).combobox('refresh');
            }, 10);
          });
          */
        }
      }
    }]);
  }
