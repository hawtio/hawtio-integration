namespace UI {
  _module.directive('httpSrc', ['$http', function ($http) {
    return {
      // do not share scope with sibling img tags and parent
      // (prevent show same images on img tag)
      scope: {
        httpSrcChanged: '='
      },
      link : function ($scope: any, elem, attrs) {
        function revokeObjectURL() {
          if ($scope.objectURL) {
            URL.revokeObjectURL($scope.objectURL);
          }
        }

        $scope.$watch('objectURL', function (objectURL, oldURL) {
          if (objectURL !== oldURL) {
            elem.attr('src', objectURL);
            if (typeof $scope.httpSrcChanged !== 'undefined') {
              $scope.httpSrcChanged = objectURL;
            }
          }
        });

        $scope.$on('$destroy', revokeObjectURL);

        attrs.$observe('httpSrc', function (url: any) {
          revokeObjectURL();

          if (url && url.indexOf('data:') === 0) {
            $scope.objectURL = url;
          } else if (url) {
            $http.get(url, {responseType: 'arraybuffer'})
              .then(function (response) {
                var blob = new Blob(
                  [response.data],
                  {type: attrs['mediaType'] ? attrs['mediaType'] : 'application/octet-stream'}
                );
                $scope.objectURL = URL.createObjectURL(blob);
              });
          }
        });
      }
    };
  }])
}