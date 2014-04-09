angular.module('elemental.select', [
    'elemental.tooltip',
    'elemental.select-menu',
    'elemental.helpers.events',
    'elemental.helpers.element'
])

.filter('selectvalue', ['$parse', function ($parse) {
    return function(input, path, delimiter) {
        var list = [];

        input = angular.isArray(input) ? input : [input];

        delimiter = delimiter || ', ';

        var fn = path ? $parse(path) : function(a){return a};

        angular.forEach(input, function (item) {
            list.push(fn(item));
        });

        return list.join(delimiter || ', ');
    };
}])

.directive('elSelect', ['$compile', '$parse', function ($compile, $parse) {
    return {
        scope: true,
        require: '?ngModel',
        template: 
            '<div el-tooltip-anchor el-watch-width="elementWidth">' + 
                '<div tabindex="{{tabindex}}" ng-mousedown="menuShow = true" ng-focus="menuShow = true" ng-blur="menuShow = false" class="display-value">{{output | selectvalue}}</div>' + 
                '<div el-tooltip ng-show="menuShow">' +
                    '<div ng-style="{\'min-width\': elementWidth + \'px\'}" el-element="selectMenu" ng-mousedown="$event.preventDefault();" ng-select="multiple ? null : (menuShow = false)" unselectable="on" display-value="output" el-select-menu multiple="{{multiple}}" ng-model="model" el-options="{{options}}"></div>' + 
                '</div>' +
            '</div>',
        compile: function () {
            return {
                pre: function (scope, element, attr) {
                    scope.selectMenu = null;
                    scope.multiple = attr.multiple;
                    scope.options = attr.elOptions;
                    scope.model = $parse(attr.ngModel)(scope);
                    scope.tabindex = attr.elTabindex || 0;
                }
            }
        }
    }
}]);
