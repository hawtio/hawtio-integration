/// <reference path="forms2Interfaces.ts"/>

namespace HawtioForms {
  export var pluginName = 'hawtio-forms2';
  export var templatePath = 'plugins/components/forms2/html';
  export var log:Logging.Logger = Logger.get(pluginName);

  export class Constants {
    public static get FORM_STANDARD() { return UrlHelpers.join(templatePath, 'form-standard.html'); }
    public static get FORM_INLINE() { return UrlHelpers.join(templatePath, 'form-inline.html'); }
    public static get FORM_UNWRAPPED() { return UrlHelpers.join(templatePath, 'form-unwrapped.html'); }
    public static get FORM_HORIZONTAL() { return UrlHelpers.join(templatePath, 'form-horizontal.html'); }
    public static get STANDARD_HORIZONTAL_INPUT() { return UrlHelpers.join(templatePath, 'standard-horizontal-input.html'); }
    public static get STANDARD_INPUT() { return UrlHelpers.join(templatePath, 'standard-input.html'); }
    public static get STATIC_HORIZONTAL_TEXT() { return UrlHelpers.join(templatePath, 'static-horizontal-text.html'); }
    public static get STATIC_TEXT() { return UrlHelpers.join(templatePath, 'static-text.html'); }
    public static get SELECT_HORIZONTAL() { return UrlHelpers.join(templatePath, 'select-horizontal.html'); }
    public static get SELECT() { return UrlHelpers.join(templatePath, 'select.html'); }
    public static get OPTION_ARRAY() { return UrlHelpers.join(templatePath, 'optionArray.html'); }
    public static get OPTION_OBJECT() { return UrlHelpers.join(templatePath, 'optionObject.html'); }
    public static get OPTION_CONFIG_OBJECT() { return UrlHelpers.join(templatePath, 'optionConfigObject.html'); }
    public static get CHECKBOX_HORIZONTAL() { return UrlHelpers.join(templatePath, 'checkbox-horizontal.html'); }
    public static get CHECKBOX() { return UrlHelpers.join(templatePath, 'checkbox.html'); }
    public static get OBJECT() { return UrlHelpers.join(templatePath, 'object.html'); }
    public static get ARRAY() { return UrlHelpers.join(templatePath, 'array.html'); }
    public static get MAP() { return UrlHelpers.join(templatePath, 'map.html'); }
    public static get HIDDEN() { return UrlHelpers.join(templatePath, 'hidden.html'); }
  }

  export function addPostInterpolateAction(context, name, func:(el:any) => any) {
    if (!(name in context.postInterpolateActions)) {
      context.postInterpolateActions[name] = [];
    }
    context.postInterpolateActions[name].push(func);
  }

  export function addPreCompileAction(context, name, func:() => void) {
    if (!(name in context.preCompileActions)) {
      context.preCompileActions[name] = [];
    }
    context.preCompileActions[name].push(func);
  }

  export function getFormMain(context, config:FormConfiguration):string {
    switch(config.style) {
      case FormStyle.STANDARD:
        return context.$templateCache.get(Constants.FORM_STANDARD);
      case FormStyle.INLINE:
        return context.$templateCache.get(Constants.FORM_INLINE);
      case FormStyle.UNWRAPPED:
        return context.$templateCache.get(Constants.FORM_UNWRAPPED);
      default:
        return context.$templateCache.get(Constants.FORM_HORIZONTAL);
    }
  }

  export function getStandardTemplate(context, config:FormConfiguration, control:FormElement, type:string):string {
    var template = undefined;
    switch(config.style) {
      case FormStyle.HORIZONTAL:
        template = context.$templateCache.get(Constants.STANDARD_HORIZONTAL_INPUT);
        break;
      default:
        template = context.$templateCache.get(Constants.STANDARD_INPUT);
    }
    return applyElementConfig(context, config, control, template, type);
  }

  export function applyElementConfig(context, config:FormConfiguration, control:FormElement, template:string, type?:string):string {
    var el = angular.element(template);
    if ('tooltip' in control) {
      el.attr({title: control.tooltip});
    }
    if ('control-group-attributes' in control) {
      el.attr(control['control-group-attributes']);
    }
    if ('label-attributes' in control) {
      el.find('label').attr(control['label-attributes']);
    }
    var input = el.find('input');
    if (type) {
      input.attr({type: type});
      }
    if ('input-attributes' in control) {
      input.attr(control['input-attributes']);
    }
    if ('selectors' in control) {
      _.forIn(control.selectors, (func: (el:any) => void, selector: string) => {
        log.debug("Found selector: ", selector, " for control: ", control, " applying");
        if (selector === 'el') {
          func(el);
        } else {
          func($(el.find(selector)));
        }
      });
    }
    return el.prop('outerHTML');
  }

  export function getStaticTextTemplate(context, config:FormConfiguration):string {
    switch(config.style) {
      case FormStyle.HORIZONTAL:
        return context.$templateCache.get(Constants.STATIC_HORIZONTAL_TEXT);
      default:
        return context.$templateCache.get(Constants.STATIC_TEXT);
    }
  }

  export function setSelectOptions(isArray:boolean, propName:string, select) {

  }

  export function getSelectTemplate(context, config:FormConfiguration, name:string, control:FormElement):string {
    var template = undefined;
    switch(config.style) {
      case FormStyle.HORIZONTAL:
        template = context.$templateCache.get(Constants.SELECT_HORIZONTAL);
        break;
      default:
        template = context.$templateCache.get(Constants.SELECT);
    }
    addPostInterpolateAction(context, name, (el) => {
      var select = el.find('select');
      var propName = 'config.properties[\'' + name + '\'].enum';
      var isArray = _.isArray(control.enum);
      var isFunction = _.isFunction(control.enum);
      if (isArray) {
        if (_.isObject(_.first(control.enum))) {
          var template = context.$templateCache.get(Constants.OPTION_CONFIG_OBJECT);
          var interpolate = context.$interpolate(template);
          _.forEach(control.enum, (config:any) => {
            var newOption = angular.element(interpolate(config));
            if (config.attributes) {
              newOption.attr(config.attributes);
            }
            select.append(newOption);
          });
        } else {
          var template = context.$templateCache.get(Constants.OPTION_ARRAY);
          var interpolate = context.$interpolate(template);
          _.forEach(control.enum, (value) => {
            select.append(interpolate({
              value: value
            }));
          });
        }
      } else if (isFunction) {
        context.scope.enum = control.enum;
        select.attr('ng-options', 'item.value as item.label for item in enum()');
        select.removeAttr('hawtio-combobox');
      } else {
        var template = context.$templateCache.get(Constants.OPTION_OBJECT);
        var interpolate = context.$interpolate(template);
        _.forIn(control.enum, (value, key) => {
          select.append(interpolate({
            key: key,
            value: value
          }));
        });
      }
    });
    return applyElementConfig(context, config, control, template);
  }

  export function getCheckboxTemplate(context, config:FormConfiguration, control:FormElement):string {
    switch(config.style) {
      case FormStyle.HORIZONTAL:
        return context.$templateCache.get(Constants.CHECKBOX_HORIZONTAL);
      default:
        return context.$templateCache.get(Constants.CHECKBOX);
    }
  }

  export function getObjectTemplate(context, config:FormConfiguration, name: string, control:FormElement):string {
    var configName = 'config.properties.' + name;
    if ('javaType' in control) {
      configName = control.javaType;
    }
    addPostInterpolateAction(context, name, (el) => {
      var attr = {
        'hawtio-form-2': configName,
        'entity': 'entity.' + name,
        'no-wrap': 'true',
        'mode': config.mode,
        'style': config.style,
        'label': control.label || context.maybeHumanize(name)
      };
      var groupAttr = {};
      if ('control-group-attributes' in control) {
        _.forIn(control['control-group-attributes'], (value, key) => {
          groupAttr[key] = value;
        });
      }
      el.attr(groupAttr);
      el.find('.inline-object').attr(attr);
    });
    return context.$templateCache.get(Constants.OBJECT);
  }

  export function getMapTemplate(context, config:FormConfiguration, name:string, control:FormElement):string {
    addPostInterpolateAction(context, name, (el) => {
      el.find('.inline-map').attr({
        'hawtio-forms-2-map': 'config.properties.' + name,
        'entity': 'entity.' + name,
        'mode': config.mode
      });
    });
    return context.$templateCache.get(Constants.MAP);
  }

  export function getArrayTemplate(context, config:FormConfiguration, name:string, control:FormElement):string {
    /*
    if (control.items) {
      if (!('javaType' in control.items)) {
        log.debug("Array, name: ", name, " type: ", control.items.type, " control: ", control);
      } else {
        log.debug("Array, name: ", name, " type: ", control.items.javaType, " control: ", control);
      }
    }
    */
    addPostInterpolateAction(context, name, (el) => {
      el.find('.inline-array').attr({
        'hawtio-forms-2-array': 'config.properties.' + name,
        'entity': 'entity.' + name,
        'mode': config.mode
      });
    });
    return context.$templateCache.get(Constants.ARRAY);
  };

  export function lookupTemplate(context, config:FormConfiguration, name:string, control:FormElement):string {
    var controlType = context.mappings.getMapping(control.type);
    if ('enum' in control) {
      controlType = 'select';
    }
    if ('properties' in control) {
      controlType = 'object';
    }
    if (control.hidden) {
      controlType = 'hidden';
    }
    // coerce this for now...
    if (control.type === 'object' && control.javaType && _.startsWith(control.javaType, 'java.util.Map')) {
      controlType = 'map';
    }
    if (controlType) {
      switch (controlType) {
        case 'array':
          return getArrayTemplate(context, config, name, control);
        case 'number':
          return getStandardTemplate(context, config, control, 'number');
        case 'password':
          return getStandardTemplate(context, config, control, 'password');
        case 'text':
          return getStandardTemplate(context, config, control, 'text');
        case 'static':
          return getStaticTextTemplate(context, config);
        case 'object':
          return getObjectTemplate(context, config, name, control);
        case 'map':
          return getMapTemplate(context, config, name, control);
        case 'hidden':
          control.hidden = true;
          return applyElementConfig(context, config, control, context.$templateCache.get(Constants.HIDDEN));
        case 'select':
          return getSelectTemplate(context, config, name, control);
        case 'checkbox':
          return getCheckboxTemplate(context, config, control);
      }
    }
    // log.debug("No mapping found for control: ", control);
    var type = control.javaType || control.type;
    // log.debug("controlType: ", type);
    // look in the schema registry
    var schema = context.schemas.getSchema(type);
    // log.debug("Schema: ", schema);
    if (schema) {
      return getObjectTemplate(context, config, name, <FormElement>_.extend(control, schema));
    }
    return undefined;
  }

  export function getTemplate(context, config:FormConfiguration, name, control:FormElement):string {
    if ('formTemplate' in control) {
      return control.formTemplate;
    }
    return lookupTemplate(context, config, name, control);
  }

  export function interpolateTemplate(context, config:FormConfiguration, name, control:FormElement, template:string, model:string):string {
    if (control.formTemplate) {
      //log.debug("template: ", template);
      //log.debug("name: ", name, " control: ", control);
      return control.formTemplate;
    }
    var interpolateFunc = context.$interpolate(template);
    var answer = interpolateFunc({
      maybeHumanize: context.maybeHumanize,
      control: control,
      name: name,
      model: model
    });
    // log.debug("postInterpolateActions: ", postInterpolateActions);
    if (context.postInterpolateActions[name]) {
      var el = angular.element(answer);
      context.postInterpolateActions[name].forEach((func) => {
        func(el);
      });
      answer = el.prop('outerHTML');
    }
    return answer;
  }

  export function createMaybeHumanize(context) {
    return (value) => {
      var config = context.config;
      if (!config || (config && !config.disableHumanizeLabel)) {
        return Core.humanizeValue(value);
      } else {
        return value;
      }
    }
  }

  export function initConfig(context, config: FormConfiguration, lookup = true) {
    var answer = <any> config;
    if (!answer && lookup) {
      // look in schema registry
      var name = context.attrs[context.directiveName];
      // log.debug("not a full config object, looking up schema: ", name);
      if (name) {
        answer = context.schemas.cloneSchema(name);
        if (!answer) {
          // log.debug("No schema found for type: ", name);
          // log.debug("attrs: ", context.attrs);
          answer = {};
        }
      }
    }
    if (answer) {
      // set any missing defaults
      if ('label' in context.attrs) {
        answer.label = context.attrs['label'];
      }
      if ('mode' in context.attrs) {
        answer.mode = Number(context.attrs['mode']);
      }
      if ('style' in context.attrs) {
        answer.style = Number(context.attrs['style']);
      }
      if ('noWrap' in context.attrs) {
        if (context.attrs['noWrap']) {
          answer.style = FormStyle.UNWRAPPED;
        }
      }
    }
    return createFormConfiguration(answer);
  }



}
