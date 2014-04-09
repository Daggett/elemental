angular.module('elemental.helpers.element', [])

.directive("elElement", function () {
    return {
        restrict: 'A',
        scope: false,
        compile: function () {
            return {
                pre: function (scope, iElement, iAttrs) {
                    scope[iAttrs.elElement] = iElement;
                }
            };
        }
    };
});
