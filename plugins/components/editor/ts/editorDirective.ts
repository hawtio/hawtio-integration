/// <reference path="editorPlugin.ts"/>
/// <reference path="CodeEditor.ts"/>
/**
 * @module HawtioEditor
 */
namespace HawtioEditor {

  _module.directive('hawtioEditor', ["$parse", ($parse) => {
    return HawtioEditor.Editor($parse);
  }]);

  export function Editor($parse) {

    return {
      restrict: 'A',
      replace: true,
      templateUrl: UrlHelpers.join(templatePath, "editor.html"),
      scope: {
        text: '=hawtioEditor',
        mode:  '=',
        readOnly: '=?',
        outputEditor: '@',
        name: '@'
      },
      controller: ["$scope", "$element", "$attrs", ($scope, $element, $attrs) => {
        $scope.codeMirror = null;
        $scope.doc = null;
        $scope.options = [];

        UI.observe($scope, $attrs, 'name', 'editor');

        $scope.applyOptions = () => {
          if ($scope.codeMirror) {
            _.forEach($scope.options, (option:any) => {
              try {
                $scope.codeMirror.setOption(option.key, option.value);
              } catch (err) {
                // ignore
              }
            });
          }
        };

        $scope.$watch(_.debounce(() => {
          if ($scope.codeMirror) {
              $scope.codeMirror.refresh();
          }
        }, 100, { trailing: true}));

        $scope.$watch('codeMirror', () => {
          if ($scope.codeMirror) {
            $scope.doc = $scope.codeMirror.getDoc();
            $scope.codeMirror.on('change', function(changeObj) {
              $scope.text = $scope.doc.getValue();
              $scope.dirty = !$scope.doc.isClean();
              Core.$apply($scope);
            });
          }
        });

      }],

      link: ($scope, $element, $attrs) => {
        if ('dirty' in $attrs) {
          $scope.dirtyTarget = $attrs['dirty'];
          $scope.$watch("$parent['" + $scope.dirtyTarget + "']", (newValue, oldValue) => {
            if (newValue !== oldValue) {
              $scope.dirty = newValue;
            }
          });
        }
        var config = _.cloneDeep($attrs);
        delete config['$$observers'];
        delete config['$$element']
        delete config['$attr'];
        delete config['class'];
        delete config['hawtioEditor'];
        delete config['mode'];
        delete config['dirty'];
        delete config['outputEditor'];
        if ('onChange' in $attrs) {
          var onChange = $attrs['onChange'];
          delete config['onChange'];
          $scope.options.push({
            onChange: (codeMirror) => {
              var func = $parse(onChange);
              if (func) {
                func($scope.$parent, { codeMirror:codeMirror });
              }
            }
          });
        }
        angular.forEach(config, (value, key) => {
          $scope.options.push({
            key: key,
            'value': value
          });
        });
        $scope.$watch('mode', () => {
          if ($scope.mode) {
            if (!$scope.codeMirror) {
              $scope.options.push({
                key: 'mode',
                'value': $scope.mode
              });
            } else {
              $scope.codeMirror.setOption('mode', $scope.mode);
            }
          }
        });
        $scope.$watch('readOnly', (readOnly) => {
          var val:any = Core.parseBooleanValue(readOnly, false);
          if ($scope.codeMirror) {
            $scope.codeMirror.setOption('readOnly', val);
          } else {
            $scope.options.push({
              key: 'readOnly',
              value: val
            });
          }
        });
        function getEventName(type:string) {
          var name = $scope.name || 'default';
          return "hawtioEditor_" + name + "_" + type;
        }
        $scope.$watch('dirty', (dirty) => {
          if ('dirtyTarget' in $scope) {
            $scope.$parent[$scope.dirtyTarget] = dirty;
          }
          $scope.$emit(getEventName('dirty'), dirty);
        });
        /*
        $scope.$watch(() => { return $element.is(':visible'); }, (newValue, oldValue) => {
          if (newValue !== oldValue && $scope.codeMirror) {
              $scope.codeMirror.refresh();
          }
        });
        */
        $scope.$watch('text', (text) => {
          if (!$scope.codeMirror) {
            var options:any = {
              value: text 
            };
            options = CodeEditor.createEditorSettings(options);
            $scope.codeMirror = CodeMirror.fromTextArea($element.find('textarea').get(0), options);
            var outputEditor = $scope.outputEditor;
            if (outputEditor) {
              var outputScope = $scope.$parent || $scope;
              Core.pathSet(outputScope, outputEditor, $scope.codeMirror);
            }
            $scope.applyOptions();
            $scope.$emit(getEventName('instance'), $scope.codeMirror);
          } else if ($scope.doc) {
            if (!$scope.codeMirror.hasFocus()) {
              var text = $scope.text || "";
              if (angular.isArray(text) || angular.isObject(text)) {
                text = JSON.stringify(text, null, "  ");
                $scope.mode = "javascript";
                $scope.codeMirror.setOption("mode", "javascript");
              }
              $scope.doc.setValue(text);
              $scope.doc.markClean();
              $scope.dirty = false;
            }
          }
        });
      }

    };
  }
}
