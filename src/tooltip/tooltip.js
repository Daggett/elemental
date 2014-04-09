angular.module('elemental.tooltip', [
    
])

.directive('elTooltipAnchor', [function () {
    return {
        scope: false,
        controller: ['$element', '$scope', '$attrs', function($element, $scope, $attrs) {
            var self = this;

            self.getPosition = function () {
                return $element[0].getBoundingClientRect();
            };
        }],
        link: function (scope, element) {

        }
    }
}])

.directive('elTooltip', ['$parse', '$document', '$window', '$compile', function ($parse, $document, $window, $compile) {
    var jqLite = angular.element,
        overlay = angular.element('<el-tooltip-overlay>');

    return {
        scope: false,
        require: ['^elTooltipAnchor', 'elTooltip'],

        controller: ['$element', function ($element) {
            var self = this,
                ctrl;

            self.init = function (_ctrl) {
                ctrl = _ctrl;
            };

            self.updatePosition = function () {
                pos = ctrl[0].getPosition();
                console.log(pos, $element[0]);
                $element.css({top: (pos.top + pos.height) + 'px', left: pos.left + 'px'});
            };

            self.show = function () {
                jqLite(document).on('scroll', self.updatePosition);
                jqLite(window).on('resize', self.updatePosition);

                jqLite(document.body).append(overlay);
                ctrl[1].updatePosition();
            };

            self.hide = function () {
                jqLite(document).off('scroll', self.updatePosition);
                jqLite(window).off('resize', self.updatePosition);

                overlay.remove();
            };
        }],

        compile: function (element, attr, transclude) {

            return function (scope, element, attr, ctrl) {
                ctrl[1].init(ctrl);
                jqLite(document.body).append(element);

                attr.$observe('ngShow', function (expr) {
                    scope.$watch(function () {
                        return $parse(expr)(scope);
                    }, function (show) {
                        if (!!show) {
                            ctrl[1].show();
                        } else {
                            ctrl[1].hide();
                        }
                    })
                });
            }
        }
    }
}]);
