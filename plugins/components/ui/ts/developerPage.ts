/// <reference path="uiPlugin.ts"/>
/**
 * @module UI
 */
namespace UI {

  _module.controller("UI.DeveloperPageController", ["$scope", "$http", ($scope, $http) => {

    $scope.getContents = function(filename, cb) {
      var fullUrl = UrlHelpers.join(UI.templatePath, "test", filename);
      $http({method: 'GET', url: fullUrl})
          .success(function(data, status, headers, config) {
            cb(data);
          })
          .error(function(data, status, headers, config) {
            cb("Failed to fetch " + filename + ": " + data);
          });
    };
  }]);
}
