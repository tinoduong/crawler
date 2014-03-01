angular.module('imageMarker', [])
    .config(['$locationProvider', function ($locationProvider) {
        $locationProvider.html5Mode(true);
    }])
    .controller('ImageListCtrl', ['$scope', '$window', '$http', '$location', function ($scope, $wndw, $http, $location) {
        var images, currentIndex, loadedMetadataFor, startCropPosition;

        function setIndex(index) {
            if (index < 0 || index > images.length) return;

            var image = images[index];

            currentIndex = index;
            $scope.image = image;

            loadedMetadataFor = null;
            $http({ method: 'GET', url: '/' + encodeURIComponent($scope.image) + '/metadata' }).
                success(function (data) {
                    loadedMetadataFor = image;
                    $scope.metadata = data;
                    if (!('isWatch' in $scope.metadata)) {
                        $scope.metadata.isWatch = true;
                    }
                });
        }

        function saveMetadata() {
            $http.put('/' + encodeURIComponent($scope.image) + '/metadata', JSON.stringify($scope.metadata), 
                    { 'Content-type': 'application/json' })
                .error(function () {
                    console.error('There was an error saving the metadata');
                });
        }

        function getPositionInImage($event) {
            var image = $wndw.document.getElementById('theimage'),
                clientRect = image.getBoundingClientRect(),
                iTop = $wndw.scrollX + clientRect.top,
                iLeft = $wndw.scrollY + clientRect.left;

            return {
                x: $event.pageX - iLeft,
                y: $event.pageY - iTop
            };

        }

        function markPosition(position) {
            $scope.metadata.center = position;
            saveMetadata();
        }

        function getNormalizedRect(p1, p2) {
            var topLeft = { x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y) },
                bottomRight =  { x: Math.max(p1.x, p2.x), y: Math.max(p1.y, p2.y) };


            return {
                topLeft: topLeft,
                width: bottomRight.x - topLeft.x,
                height: bottomRight.y - topLeft.y
            };
        }
       

        $scope.user = 'tino'; // just so something is set

        $scope.goNext = function () {

            var index = currentIndex + 1,
                comp = $scope.user === 'tino' ?
                    function (x) { return parseInt(x[0], 10) < 8; }
                    :
                    function (x) { return parseInt(x[0], 10) >= 8 };

            while (currentIndex < images.length && !comp(images[index])) {
                index++;
            }
            setIndex(index);
        };

        $scope.goPrevious = function () {
            var index = currentIndex - 1,
                comp = $scope.user === 'tino' ?
                    function (x) { return parseInt(x[0], 10) < 8; }
                    :
                    function (x) { return parseInt(x[0], 10) >= 8 };

            while (currentIndex >= 0 && !comp(images[index])) {
                index--;
            }
            setIndex(index);
        };

        $scope.markWatch = function (image, isWatch) {
            $scope.metadata.isWatch = isWatch;
            saveMetadata();
        };

        $scope.loaded = function () {
            return loadedMetadataFor === $scope.image;
        };

        $scope.mousedown = function ($event) {
            startCropPosition = getPositionInImage($event);
        };

        $scope.mouseup = function ($event) {
            var endCropPosition = getPositionInImage($event),
                distFromStart = Math.sqrt(Math.pow(startCropPosition.x - endCropPosition.x, 2) +
                                          Math.pow(startCropPosition.y - endCropPosition.y, 2));

            if (distFromStart < 10) {
                markPosition(startCropPosition);
                startCropPosition = void 0;
                return;
            }

            $scope.metadata.crop = getNormalizedRect(startCropPosition, endCropPosition);
            saveMetadata();

            startCropPosition = void 0;
        };

        $scope.mousemove = function ($event) {
            if (startCropPosition === void 0) return;

            $scope.metadata.crop = getNormalizedRect(startCropPosition, getPositionInImage($event));
        };

        $http({ method: 'GET', url: '/image'}).
            success(function(data) {
                images = data;
                currentIndex = -1;
                $scope.goNext();
            });
    }]);
