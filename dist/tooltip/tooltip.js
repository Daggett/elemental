angular.module('elemental.tooltip', [
    
])

.directive('elTooltipAnchor', [function () {
    return {
        scope: false,
        controller: ['$element', '$scope', '$attrs', function($element, $scope, $attrs) {
            var self = this;

            self.getPosition = function () {
                var position = $element[0].getBoundingClientRect(),
                    windowWidth = document.documentElement.clientWidth;

                position = {
                    left: position.left,
                    top: position.top,
                    leftWidth: position.right,
                    topWidth: position.bottom,
                    right: windowWidth - position.right
                }

                return position;
            };
        }],
        link: function (scope, element) {

        }
    }
}])

.directive('elTooltip', ['$parse', '$document', '$window', '$compile', function ($parse, $document, $window, $compile) {
    var jqLite = angular.element;

    return {
        scope: false,
        require: ['^elTooltipAnchor', 'elTooltip'],

        controller: ['$element', '$scope', '$attrs', function ($element, $scope, $attrs) {
            var self = this,
                ctrl,
                overlay,
                pack;

            self.init = function (_ctrl, _pack) {
                ctrl = _ctrl;
                pack = $attrs.pack
                overlay = self.$overlay = $compile('<el-tooltip-overlay>')($scope);
            };

            self.updatePosition = function () {
                pos = ctrl[0].getPosition();

                var left, top, right;

                top = pos.topWidth;

                console.log(pack)

                switch (pack) {
                    case 'end':
                        right = pos.right;
                        break;
                    case 'start': default:
                        left = pos.left;
                        break;
                }

                $element.css({
                    top: top ? (top + 'px') : 'auto', 
                    left: left ? (left + 'px') : 'auto', 
                    right: right ? (right + 'px') : 'auto'
                });
            };

            self.show = function () {
                var el = $element;

                jqLite(document).on('scroll', self.updatePosition);
                jqLite(window).on('resize', self.updatePosition);

                jqLite(document.body).append(overlay);
                overlay.on('mousedown', self.mousedown);

                ctrl[1].updatePosition();
            };

            self.mousedown = angular.noop;

            self.hide = function () {
                var el = $element;

                jqLite(document).off('scroll', self.updatePosition);
                jqLite(window).off('resize', self.updatePosition);

                overlay.off('mousedown', self.mousedown);
                overlay.remove();
            };

            $scope.$on('$destroy', function() {
                $element.remove();
            });
        }],

        compile: function (element, attr, transclude) {


            return function (scope, element, attr, ctrl) {
                ctrl[1].init(ctrl, attr.pack);
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

                var fn = $parse(attr.maskMousedown);
                ctrl[1].mousedown = function (event) {
                    fn(scope, {$event: event});
                    scope.$apply();
                };
            }
        }
    }
}]);
