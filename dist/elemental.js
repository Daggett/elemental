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

angular.module('elemental', [
    'elemental.helpers.element',
    'elemental.helpers.events',
    'elemental.tooltip',
    'elemental.select',
    'elemental.select-menu'
]);




angular.module('elemental.select-menu', [
    'ngResource'
])

.directive('elSelectMenu', ['$compile', '$parse', function ($compile, $parse) {
    var noop = angular.noop,
        isDefined = angular.isDefined,
        isUndefined = angular.isUndefined,
        jqLite = angular.element,
        forEach = angular.forEach;

    function hashKey(obj) {
          var objType = typeof obj,
              key;

        if (objType == 'object' && obj !== null) {
            if (typeof (key = obj.$$hashKey) == 'function') {
                // must invoke on object to keep the right this
                key = obj.$$hashKey();
            } else if (key === undefined) {
                key = obj.$$hashKey = nextUid();
            }
        } else {
            key = obj;
        }

        return objType + ':' + key;
    }

    function HashMap(array){
        forEach(array, this.put, this);
    }

    HashMap.prototype = {
        put: function(key, value) {
            this[hashKey(key)] = value;
        },

        get: function(key) {
            return this[hashKey(key)];
        },

        remove: function(key) {
            var value = this[key = hashKey(key)];
            delete this[key];
            return value;
        }
    };

    var uid = 0;

    function nextUid() {
        return uid++;
    }

    var NG_OPTIONS_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/,
        nullModelCtrl = {$setViewValue: noop};
    // jshint maxlen: 100

    return {
        restrict: 'A',
        require: ['elSelectMenu', '?ngModel'],
        controller: ['$element', '$scope', '$attrs', function($element, $scope, $attrs) {
            var self = this,
                optionsMap = {},
                ngModelCtrl = nullModelCtrl,
                nullOption,
                unknownOption;

            self.databound = $attrs.ngModel;


            self.init = function(ngModelCtrl_, nullOption_, unknownOption_) {
                ngModelCtrl = ngModelCtrl_;
                nullOption = nullOption_;
                unknownOption = unknownOption_;
            };



            self.addOption = function(value) {
                assertNotHasOwnProperty(value, '"option value"');
                optionsMap[value] = true;

                if (ngModelCtrl.$viewValue == value) {
                    $element.val(value);
                    if (unknownOption.parent()) unknownOption.remove();
                }
            };


            self.removeOption = function(value) {
                if (this.hasOption(value)) {
                    delete optionsMap[value];
                    if (ngModelCtrl.$viewValue == value) {
                        this.renderUnknownOption(value);
                    }
                }
            };


            self.renderUnknownOption = function(val) {
                var unknownVal = '? ' + hashKey(val) + ' ?';
                unknownOption.val(unknownVal);
                $element.prepend(unknownOption);
                $element.val(unknownVal);
                unknownOption.prop('selected', true); // needed for IE
            };


            self.hasOption = function(value) {
                return optionsMap.hasOwnProperty(value);
            };

            $scope.$on('$destroy', function() {
                // disable unknown option so that we don't do work when the whole select is being destroyed
                self.renderUnknownOption = noop;
            });
        }],

        link: function(scope, element, attr, ctrls) {
            // if ngModel is not defined, we don't need to do anything
            if (!ctrls[1]) return;

            var selectCtrl = ctrls[0],
                ngModelCtrl = ctrls[1],
                multiple = attr.multiple,
                optionsExp = attr.elOptions,
                nullOption = false, // if false, user will not be able to select it (used by ngOptions)
                emptyOption,
                optionTemplate = jqLite('<el-option></el-option>'),
                optGroupTemplate = jqLite('<el-optgroup></el-optgroup>'),
                optionsScope = $parse(attr.optionsScope)(scope) || scope,
                unknownOption = optionTemplate.clone();

            // find "null" option
            for (var i = 0, children = element.children(), ii = children.length; i < ii; i++) {
                if (jqLite(children[i]).attr('value') === '') {
                    emptyOption = nullOption = children.eq(i);
                    break;
                }
            }

            selectCtrl.init(ngModelCtrl, nullOption, unknownOption);

            // required validator
            if (multiple) {
                ngModelCtrl.$isEmpty = function(value) {
                    return !value || value.length === 0;
                };
            }

            if (optionsExp) setupAsOptions(scope, element, ngModelCtrl);
            else if (multiple) setupAsMultiple(scope, element, ngModelCtrl);
            else setupAsSingle(scope, element, ngModelCtrl, selectCtrl);


            ////////////////////////////



            function setupAsSingle(scope, selectElement, ngModelCtrl, selectCtrl) {
                ngModelCtrl.$render = function() {
                    var optionElement = null,
                        viewValue = ngModelCtrl.$viewValue;

                    // TODO: We need to improve this checking
                    angular.forEach(selectElement.children(), function (option) {
                        if (jqLite(option).attr('value') == viewValue) {
                            optionElement = jqLite(option);
                            return false;
                        }
                    });


                    if (selectCtrl.hasOption(viewValue) || optionElement) {
                        if (unknownOption.parent()) unknownOption.remove();
                        selectElement.val(viewValue);
                        optionElement.addClass('selected').attr('selected', 'selected');
                        if (viewValue === '') emptyOption.prop('selected', true); // to make IE9 happy
                    } else {
                        if (isUndefined(viewValue) && emptyOption) {
                            selectElement.val('');
                        } else {
                            selectCtrl.renderUnknownOption(viewValue);
                        }
                    }
                };

                element.on('mousedown', function (event) {
                    if (event.target.tagName.toLowerCase() != 'el-option') return;

                    var target = jqLite(event.target);

                    element.find('el-option').removeAttr('selected').removeClass('selected');
                    target.attr('selected', 'selected').addClass('selected');

                    element.val(target.attr('value'));
                    element.triggerHandler('change');
                    element.triggerHandler('select');
                });

                selectElement.on('change', function() {
                    scope.$apply(function() {
                        if (unknownOption.parent()) unknownOption.remove();
                        ngModelCtrl.$setViewValue(selectElement.val());
                    });
                });
            }

            function setupAsMultiple(scope, selectElement, ctrl) {
                var lastView;
                ctrl.$render = function() {
                    var items = new HashMap(ctrl.$viewValue);
                    forEach(selectElement.find('el-option'), function(option) {
                        option.selected = isDefined(items.get(option.value));
                    });
                };

                // we have to do it on each watch since ngModel watches reference, but
                // we need to work of an array, so we need to see if anything was inserted/removed
                scope.$watch(function selectMultipleWatch() {
                    if (!equals(lastView, ctrl.$viewValue)) {
                        lastView = copy(ctrl.$viewValue);
                        ctrl.$render();
                    }
                });

                selectElement.on('change', function() {
                    scope.$apply(function() {
                        var array = [];
                        forEach(selectElement.find('em-option'), function(option) {
                            if (option.selected) {
                                array.push(option.value);
                            }
                        });
                        ctrl.$setViewValue(array);
                    });
                });
            }

            function setupAsOptions(scope, selectElement, ctrl) {
                var match;

                if (!(match = optionsExp.match(NG_OPTIONS_REGEXP))) {
                    throw Exception('iexp',
                        "Expected expression in form of " +
                        "'_select_ (as _label_)? for (_key_,)?_value_ in _collection_'" +
                        " but got '{0}'. Element: {1}",
                        optionsExp);
                }
                var displayFn = $parse(match[2] || match[1]),
                    valueName = match[4] || match[6],
                    keyName = match[5],
                    groupByFn = $parse(match[3] || ''),
                    valueFn = $parse(match[2] ? match[1] : valueName),
                    valuesFn = $parse(match[7]),
                    track = match[8],
                    trackFn = track ? $parse(match[8]) : null,
                    // This is an array of array of existing option groups in DOM.
                    // We try to reuse these if possible
                    // - optionGroupsCache[0] is the options with no option group
                    // - optionGroupsCache[?][0] is the parent: either the SELECT or OPTGROUP element
                    optionGroupsCache = [[{element: selectElement, label:''}]];

                function setDisplayValue() {
                    var locals = {},
                        displayValue;

                    if (!multiple) {
                        locals[valueName] = ctrl.$viewValue;
                        displayValue = displayFn(locals) || (nullOption ? nullOption.text() : undefined);
                    } else {
                        displayValue = [];
                        angular.forEach(ctrl.$viewValue, function (value) {
                            locals[valueName] = value;
                            displayValue.push(displayFn(locals));
                        });
                    }
                    scope[attr.displayValue] = displayValue;
                }

                element.on('mousedown', function (event) {
                    if (event.target.tagName.toLowerCase() != 'el-option') return;

                    var target = jqLite(event.target);

                    if (!multiple) {
                        element.find('el-option').removeAttr('selected').removeClass('selected');
                        target.attr('selected', 'selected').addClass('selected`');
                    } else {
                        var selected = target.attr('selected');
                        target[selected ? 'removeAttr' : 'attr']('selected', 'selected');
                        target.toggleClass('selected', !selected);
                        target.prop('selected', !selected);
                    }

                    element.val(parseInt(target.val()));
                    element.triggerHandler('change');
                    element.triggerHandler('select');

                    setDisplayValue();
                });

                if (nullOption) {
                    // compile the element since there might be bindings in it
                    $compile(nullOption)(scope);

                    // remove the class, which is added automatically because we recompile the element and it
                    // becomes the compilation root
                    nullOption.removeClass('ng-scope');

                    // we need to remove it before calling selectElement.empty() because otherwise IE will
                    // remove the label from the element. wtf?
                    nullOption.remove();
                }

                // clear contents, we'll add what's needed based on the model
                selectElement.empty();

                selectElement.on('change', function() {
                    scope.$apply(function() {
                        var optionGroup,
                            collection = valuesFn(optionsScope),
                            locals = {},
                            key, value, optionElement, index, groupIndex, length, groupLength, trackIndex;

                        if (multiple) {
                            value = [];
                            for (groupIndex = 0, groupLength = optionGroupsCache.length;
                                 groupIndex < groupLength;
                                 groupIndex++) {
                                // list of options for that group. (first item has the parent)
                                optionGroup = optionGroupsCache[groupIndex];

                                for(index = 1, length = optionGroup.length; index < length; index++) {
                                    if ((optionElement = optionGroup[index].element)[0].selected) {
                                        key = optionElement.val();
                                        if (keyName) locals[keyName] = key;
                                        if (trackFn) {
                                            for (trackIndex = 0; trackIndex < collection.length; trackIndex++) {
                                                locals[valueName] = collection[trackIndex];
                                                if (trackFn(scope, locals) == key) break;
                                            }
                                        } else {
                                            locals[valueName] = collection[key];
                                        }
                                        value.push(valueFn(scope, locals));
                                    }
                                }
                            }
                        } else {
                            key = selectElement.val();
                            if (key == '?') {
                                value = undefined;
                            } else if (key === ''){
                                value = null;
                            } else {
                                if (trackFn) {
                                    for (trackIndex = 0; trackIndex < collection.length; trackIndex++) {
                                        locals[valueName] = collection[trackIndex];
                                        if (trackFn(scope, locals) == key) {
                                            value = valueFn(scope, locals);
                                            break;
                                        }
                                    }
                                } else {
                                    locals[valueName] = collection[key];
                                    if (keyName) locals[keyName] = key;
                                    value = valueFn(scope, locals);
                                }
                            }
                            // Update the null option's selected property here so $render cleans it up correctly
                            if (optionGroupsCache[0].length > 1) {
                                if (optionGroupsCache[0][1].id !== key) {
                                    optionGroupsCache[0][1].selected = false;
                                }
                            }
                            
                        }
                        ctrl.$setViewValue(value);
                    });
                });

                ctrl.$render = render;

                // TODO(vojta): can't we optimize this ?
                scope.$watch(render);

                function render() {
                    setDisplayValue();

                    // Temporary location for the option groups before we render them
                    var optionGroups = {'':[]},
                        optionGroupNames = [''],
                        optionGroupName,
                        optionGroup,
                        option,
                        existingParent, existingOptions, existingOption,
                        modelValue = ctrl.$modelValue,
                        values = valuesFn(optionsScope),
                        keys = keyName ? sortedKeys(values) : values,
                        key,
                        groupLength, length,
                        groupIndex, index,
                        locals = {},
                        selected,
                        selectedSet = false, // nothing is selected yet
                        lastElement,
                        element,
                        label;

                    if (multiple) {
                        if (trackFn && isArray(modelValue)) {
                            selectedSet = new HashMap([]);
                            for (var trackIndex = 0; trackIndex < modelValue.length; trackIndex++) {
                                locals[valueName] = modelValue[trackIndex];
                                selectedSet.put(trackFn(scope, locals), modelValue[trackIndex]);
                            }
                        } else {
                            selectedSet = new HashMap(modelValue);
                        }
                    }

                    // We now build up the list of options we need (we merge later)
                    for (index = 0; length = keys.length, index < length; index++) {

                        key = index;
                        if (keyName) {
                            key = keys[index];
                            if ( key.charAt(0) === '$' ) continue;
                            locals[keyName] = key;
                        }

                        locals[valueName] = values[key];

                        optionGroupName = groupByFn(scope, locals) || '';
                        if (!(optionGroup = optionGroups[optionGroupName])) {
                            optionGroup = optionGroups[optionGroupName] = [];
                            optionGroupNames.push(optionGroupName);
                        }
                        if (multiple) {
                            selected = isDefined(
                                selectedSet.remove(trackFn ? trackFn(scope, locals) : valueFn(scope, locals))
                            );
                        } else {
                            if (trackFn) {
                                var modelCast = {};
                                modelCast[valueName] = modelValue;
                                selected = trackFn(scope, modelCast) === trackFn(scope, locals);
                            } else {
                                selected = modelValue === valueFn(scope, locals);
                            }
                            selectedSet = selectedSet || selected; // see if at least one item is selected
                        }
                        label = displayFn(scope, locals); // what will be seen by the user

                        // doing displayFn(scope, locals) || '' overwrites zero values
                        label = isDefined(label) ? label : '';
                        optionGroup.push({
                            // either the index into array or key from object
                            id: trackFn ? trackFn(scope, locals) : (keyName ? keys[index] : index),
                            label: label,
                            selected: selected                                     // determine if we should be selected
                        });
                    }
                    if (!multiple) {
                        if (nullOption || modelValue === null) {
                            // insert null option if we have a placeholder, or the model is null
                            optionGroups[''].unshift({id:'', label:'', selected:!selectedSet});
                        } else if (!selectedSet) {
                            // option could not be found, we have to insert the undefined item
                            optionGroups[''].unshift({id:'?', label:'', selected:true});
                        }
                    }

                    // Now we need to update the list of DOM nodes to match the optionGroups we computed above
                    for (groupIndex = 0, groupLength = optionGroupNames.length;
                         groupIndex < groupLength;
                         groupIndex++) {
                        // current option group name or '' if no group
                        optionGroupName = optionGroupNames[groupIndex];

                        // list of options for that group. (first item has the parent)
                        optionGroup = optionGroups[optionGroupName];

                        if (optionGroupsCache.length <= groupIndex) {
                            // we need to grow the optionGroups
                            existingParent = {
                                element: optGroupTemplate.clone().attr('label', optionGroupName),
                                label: optionGroup.label
                            };
                            existingOptions = [existingParent];
                            optionGroupsCache.push(existingOptions);
                            selectElement.append(existingParent.element);
                        } else {
                            existingOptions = optionGroupsCache[groupIndex];
                            existingParent = existingOptions[0];  // either SELECT (no group) or OPTGROUP element

                            // update the OPTGROUP label if not the same.
                            if (existingParent.label != optionGroupName) {
                                existingParent.element.attr('label', existingParent.label = optionGroupName);
                            }
                        }

                        lastElement = null;  // start at the beginning
                        for(index = 0, length = optionGroup.length; index < length; index++) {
                            option = optionGroup[index];
                            if ((existingOption = existingOptions[index+1])) {
                                // reuse elements
                                lastElement = existingOption.element;
                                if (existingOption.label !== option.label) {
                                    lastElement.text(existingOption.label = option.label);
                                }
                                if (existingOption.id !== option.id) {
                                    lastElement.val(existingOption.id = option.id);
                                }
                                // lastElement.prop('selected') provided by jQuery has side-effects
                                if (existingOption.selected !== option.selected) {
                                    lastElement.prop('selected', (existingOption.selected = option.selected));
                                    lastElement.toggleClass('selected', (existingOption.selected = option.selected));
                                    lastElement.attr('selected', (existingOption.selected = option.selected));
                                }
                            } else {
                                // grow elements

                                // if it's a null option
                                if (option.id === '' && nullOption) {
                                    // put back the pre-compiled element
                                    element = nullOption;
                                } else {
                                    // jQuery(v1.4.2) Bug: We should be able to chain the method calls, but
                                    // in this version of jQuery on some browser the .text() returns a string
                                    // rather then the element.
                                    (element = optionTemplate.clone())
                                        .val(option.id)
                                        .toggleClass('selected', option.selected)
                                        .attr('selected', option.selected)
                                        .text(option.label);
                                }

                                existingOptions.push(existingOption = {
                                        element: element,
                                        label: option.label,
                                        id: option.id,
                                        selected: option.selected
                                });
                                if (lastElement) {
                                    lastElement.after(element);
                                } else {
                                    existingParent.element.append(element);
                                }
                                lastElement = element;
                            }
                        }
                        // remove any excessive OPTIONs in a group
                        index++; // increment since the existingOptions[0] is parent element not OPTION
                        while(existingOptions.length > index) {
                            existingOptions.pop().element.remove();
                        }
                    }
                    // remove any excessive OPTGROUPs from select
                    while(optionGroupsCache.length > groupIndex) {
                        optionGroupsCache.pop()[0].element.remove();
                    }
                }
            }
        }
    };
}]);

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
