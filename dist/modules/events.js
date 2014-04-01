angular.module('elemental.helpers.events', [])

.directive('elScroll', ['$parse', function ($parse) {
    return {
        scope: false,
        link: function (scope, element, attrs) {
            var fn = $parse(attrs.elScroll);

            element.on('scroll', function (event) {
                fn(scope, {$event: event});
                $scope.apply();
            });
        }
    }
}])

// Directive to watch element's width, supposed to be used with empty element
.directive('elWatchWidth', ['$compile', function ($compile) {
    return {
        scope: false,
        link: function (scope, element, attrs) {
            var checkDownscale = $compile('<div style="left: -999999px; position: absolute; overflow-x: auto; width: 100%; height: 100%;">' +
                    '<div style="width: 999999%; height: 1px;"></div>' +
                '</div>')(scope),
                checkUpscale = $compile('<div style="left: -999999px; position: absolute; overflow-x: auto; width: 100%; height: 100%;">' +
                    '<div style="width: 999999px; height: 1px;"></div>' +
                '</div>')(scope);

            element.append(checkUpscale);
            element.append(checkDownscale);

            function updateScroll() {
                checkDownscale[0].scrollLeft = checkDownscale[0].scrollWidth;
                checkUpscale[0].scrollLeft = checkUpscale[0].scrollWidth;
            }

            checkDownscale.on('scroll', listenDownscale); 
            checkUpscale.on('scroll', listenUpscale);

            function listenUpscale() {
                updateScroll();

                scope[attrs.elWatchWidth] = element[0].clientWidth;
                scope.$apply();
            }

            function listenDownscale() {
                updateScroll();
            }

            updateScroll();

            // Garbage collection
            scope.$on('destroy', function () {
                checkUpscale.remove();
                checkDownscale.remove();
            });
        }
    }
}]);
