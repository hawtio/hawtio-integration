/// <reference path="../camelPlugin.ts"/>

namespace Camel {

  _module.component('propertyList', {
    bindings: {
      title: '@',
      properties: '<'
    },
    template: `
      <div ng-show="$ctrl.properties.length > 0">
        <h3 title="">{{$ctrl.title}}</h3>
        <dl class="dl-horizontal">
          <dt ng-repeat-start="property in $ctrl.properties" title="{{property.name}}">
            {{property.name}}
          </dt>
          <dd class="camel-properties-value" title="" ng-repeat-end>
            <span class="pficon pficon-info camel-properties-info-circle" data-toggle="tooltip" data-placement="top" title="{{property.description}}"></span>
            {{property.value}}
          </dd>
        </dl>
      </div>
    `
  });

}
