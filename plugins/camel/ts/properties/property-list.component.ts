/// <reference path="../camelPlugin.ts"/>

namespace Camel {

  _module.component('propertyList', {
    template: `
      <div ng-show="$ctrl.properties.length > 0">
        <h3 title="">{{$ctrl.title}}</h3>
        <dl class="dl-horizontal">
          <dt ng-repeat-start="property in $ctrl.properties" title="{{property.name}}">
            {{property.name}}
          </dt>
          <dd class="camel-properties-value" title="" ng-repeat-end>
            <span class="fa fa-info-circle camel-properties-info-circle" data-toggle="tooltip" data-placement="top" title="{{property.description}}"></span>
            <samp>{{property.value}}</samp>
          </dd>
        </dl>
      </div>`,
    bindings: {
      title: '@',
      properties: '<'
    }
  });

}
