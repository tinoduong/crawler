angular.module('imageMarker', []).
    controller('ImageListCtrl', ['$scope', '$window', function ($scope, $wndw, $q) {
        function loadImages(imageDir) {
            console.log(imageDir);
        }

        $scope.loadImages = function (directory) {
            $wndw.webkitResolveLocalFileSystemURL(
                directory,
                loadImages,
                function (error) {
                    console.error('There was an error resolving the local directory:', error);
                }
            );
        };
    }]);
