/// <reference path="formHelpers.ts"/>
/// <reference path="simpleFormDirective.ts"/>
/// <reference path="inputTableDirective.ts"/>
/// <reference path="baseDirectives.ts"/>
/// <reference path="submitDirective.ts"/>
/// <reference path="resetDirective.ts"/>
/// <reference path="formGlobals.ts"/>
namespace Forms {

  export var _module = angular.module(Forms.pluginName, []);

  _module.directive('simpleForm', ["$compile", ($compile) => {
    return new Forms.SimpleForm($compile);
  }]);

  // an alias of the above so we can support older views still
  _module.directive('hawtioForm', ["$compile", ($compile) => {
    return new Forms.SimpleForm($compile);
  }]);

  _module.directive('hawtioInputTable', ["$compile", ($compile) => {
    return new Forms.InputTable($compile);
  }]);

  _module.directive('hawtioFormText', ["$compile", ($compile) => {
    return new Forms.TextInput($compile);
  }]);

  _module.directive('hawtioFormPassword', ["$compile", ($compile) => {
    return new Forms.PasswordInput($compile);
  }]);

  _module.directive('hawtioFormHidden', ["$compile", ($compile) => {
    return new Forms.HiddenText($compile);
  }]);

  _module.directive('hawtioFormNumber', ["$compile", ($compile) => {
    return new Forms.NumberInput($compile);
  }]);

  _module.directive('hawtioFormSelect', ["$compile", ($compile) => {
    return new Forms.SelectInput($compile);
  }]);

  _module.directive('hawtioFormArray', ["$compile", ($compile) => {
    return new Forms.ArrayInput($compile);
  }]);

  _module.directive('hawtioFormStringArray', ["$compile", ($compile) => {
    return new Forms.StringArrayInput($compile);
  }]);

  _module.directive('hawtioFormCheckbox', ["$compile", ($compile) => {
    return new Forms.BooleanInput($compile);
  }]);

  _module.directive('hawtioFormCustom', ["$compile", ($compile) => {
    return new Forms.CustomInput($compile);
  }]);

  _module.directive('hawtioSubmit', () => {
    return new Forms.SubmitForm();
  });

  _module.directive('hawtioReset', () => {
    return new Forms.ResetForm();
  });

  _module.run(() => {
    log.debug("loaded");
  });

  /*
  _module.run(["helpRegistry", (helpRegistry) => {
    helpRegistry.addDevDoc("forms", 'app/forms/doc/developer.md');
  }]);
  */

  _module.run(['$rootScope', ($rootScope) => {
    if (!$rootScope._) {
      // Add lodash for views if it's not already added
      $rootScope._ = _;
    }
  }]);


  hawtioPluginLoader.addModule(pluginName);
}
