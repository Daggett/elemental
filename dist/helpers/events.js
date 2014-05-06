angular.module('elemental.helpers.events', [
    'elemental.helpers.element'
])

// Directive to watch element's width, supposed to be used with empty element
.directive('elWatchWidth', ['$compile', function ($compile) {
    var devicePixelRatio = window.devicePixelRatio || 1;

    return {
        scope: {
            elWatchWidth: '='
        },
        template: 
            '<div style="overflow: hidden; width: 0; height: 0;">' +
                '<div style="position: absolute; width: 100%; height: 1px; left: -9999px;">' +
                    '<div el-element="checkDownscale" ng-scroll="listenDownscale($event)" style="overflow: scroll; height: 100%;">' +
                        '<div style="width: 9999%; height: 9999px;"></div>' +
                    '</div>' +
                    '<div el-element="checkUpscale" ng-scroll="listenUpscale($event)" style="overflow: scroll; height: 100%;">' +
                        '<div style="width: 9999px; height: 9999px;"></div>' +
                    '</div>' +
                '</div>' +
            '</div>',
        link: function (scope, element, attrs) {
            var checkDownscale = scope.checkDownscale,
                checkUpscale = scope.checkUpscale;           

            function updateScroll() {
                checkDownscale[0].scrollLeft = checkDownscale[0].scrollWidth;
                checkUpscale[0].scrollLeft = checkUpscale[0].scrollWidth;
            }

            scope.listenUpscale = function () {
                updateScroll();
                scope.elWatchWidth = element[0].clientWidth;
            }

            scope.listenDownscale = function () {
                updateScroll();
            }

            updateScroll();
        }
    }
}]);

angular.forEach('scroll select overflow underflow'.split(' '), function (eventName) {
    var directiveName = 'ng' + eventName.charAt(0).toUpperCase() + eventName.slice(1);

    angular.module('elemental.helpers.events')
    .directive(directiveName, ['$parse', function ($parse) {
        return {
            scope: false,
            link: function (scope, element, attrs) {
                var fn = $parse(attrs[directiveName]);

                element.on(eventName, function (event) {
                    fn(scope, {$event: event});
                    scope.$apply();
                });
            }
        }
    }])

});
