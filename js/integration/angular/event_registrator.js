"use strict";

var $ = require("../../core/renderer"),
    eventRegistrator = require("../../events/core/event_registrator"),
    ngModule = require("./module");

eventRegistrator.callbacks.add(function(name) {
    var ngEventName = name.slice(0, 2) + name.charAt(2).toUpperCase() + name.slice(3);
    ngModule.directive(ngEventName, ['$parse', function($parse) {
        return function(scope, element, attr) {
            var attrValue = $.trim(attr[ngEventName]),
                handler,
                eventOptions = { };

            if(attrValue.charAt(0) === "{") {
                eventOptions = scope.$eval(attrValue);
                handler = $parse(eventOptions.execute);
            } else {
                handler = $parse(attr[ngEventName]);
            }

            element.on(name, eventOptions, function(e) {
                scope.$apply(function() {
                    handler(scope, { $event: e });
                });
            });
        };
    }]);
});
