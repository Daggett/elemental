angular.module('elemental.select', [
    'elemental.tooltip',
    'elemental.select-menu',
    'elemental.helpers.events'
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
        scope: {
            multiple: '@',
            tabindex: '@elTabindex',
            options: '@elOptions',
            pack: '@pack', // delegate pack property for tooltip
            model: '=ngModel'
        },
        require: '?ngModel',
        transclude: true,
        template: 
            '<div el-tooltip-anchor>' + 
                '<div el-watch-width="elementWidth"></div>' +
                '<el-display-value tabindex="{{tabindex}}" onmousedown="this.focus(); /* IE hack */" ng-mousedown="menuShow = true;" ng-focus="menuShow = true" ng-blur="menuShow = false" class="display-value">' + 
                    '<span class="el-carrot"><span></span></span>' + 
                    '<span class="el-text">{{output | selectvalue}}</span>' + 
                '</el-display-value>' + 
                '<div class="el-select-tooltip" el-tooltip pack="{{pack}}" ng-show="menuShow">' +
                    '<div el-element="menu" ng-transclude ng-style="{\'min-width\': elementWidth + \'px\'}" class="el-overlapped" ng-mousedown="$event.preventDefault();" ng-select="multiple ? null : (menuShow = false)" unselectable="on" display-value="output" el-select-menu multiple="{{multiple}}" ng-model="model" el-options="{{options}}" options-scope="$parent"></div>' + 
                '</div>' +
            '</div>',
        compile: function () {
            return {
                pre: function (scope, element, attr, ctrl) {
                    scope.tabindex = scope.tabindex || 0;
                }
            }
        }
    }
}]);
