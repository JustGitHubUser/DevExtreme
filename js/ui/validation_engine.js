"use strict";

var $ = require("../core/renderer"),
    Class = require("../core/class"),
    extend = require("../core/utils/extend").extend,
    inArray = require("../core/utils/array").inArray,
    EventsMixin = require("../core/events_mixin"),
    errors = require("../core/errors"),
    commonUtils = require("../core/utils/common"),
    numberLocalization = require("../localization/number"),
    messageLocalization = require("../localization/message");

var rulesValidators = {
    /**
    * @name requiredRule
    * @publicName RequiredRule
    * @section dxValidator
    * @type object
    */
    "required": {
        /**
        * @name requiredRuleOptions_type
        * @publicName type
        * @type string
        * @acceptValues 'required'
        */
        /**
        * @name requiredRuleOptions_trim
        * @publicName trim
        * @type boolean
        * @default true
        */
        /**
        * @name requiredRuleOptions_message
        * @publicName message
        * @type string
        * @default 'Required'
        */
        validate: function(value, rule) {
            if(!commonUtils.isDefined(value)) return false;
            if(value === false) {
                return false;
            }
            value = String(value);
            if(rule.trim || !commonUtils.isDefined(rule.trim)) {
                value = $.trim(value);
            }

            return value !== "";
        },
        defaultMessage: function(value) { return messageLocalization.getFormatter("validation-required")(value); },
        defaultFormattedMessage: function(value) { return messageLocalization.getFormatter("validation-required-formatted")(value); }
    },
    /**
    * @name numericRule
    * @publicName NumericRule
    * @section dxValidator
    * @type object
    */
    "numeric": {
        /**
        * @name numericRuleOptions_type
        * @publicName type
        * @type string
        * @acceptValues 'numeric'
        */
        /**
        * @name numericRuleOptions_message
        * @publicName message
        * @type string
        * @default 'Value should be a number'
        */
        validate: function(value, rule) {
            if(!rulesValidators.required.validate(value, {})) {
                return true;
            }

            if(rule.useCultureSettings && commonUtils.isString(value)) {
                return !isNaN(numberLocalization.parse(value));
            } else {
                return commonUtils.isNumeric(value);
            }
        },
        defaultMessage: function(value) { return messageLocalization.getFormatter("validation-numeric")(value); },
        defaultFormattedMessage: function(value) { return messageLocalization.getFormatter("validation-numeric-formatted")(value); }
    },
    /**
    * @name rangeRule
    * @publicName RangeRule
    * @section dxValidator
    * @type object
    */
    "range": {
        /**
        * @name rangeRuleOptions_type
        * @publicName type
        * @type string
        * @acceptValues 'range'
        */
        /**
        * @name rangeRuleOptions_min
        * @publicName min
        * @type datetime|number
        */
        /**
        * @name rangeRuleOptions_max
        * @publicName max
        * @type datetime|number
        */
        /**
        * @name rangeRuleOptions_message
        * @publicName message
        * @type string
        * @default 'Value is out of range'
        */
        /**
        * @name rangeRuleOptions_reevaluate
        * @publicName reevaluate
        * @type boolean
        * @default false
        */

        validate: function(value, rule) {
            if(!rulesValidators.required.validate(value, {})) {
                return true;
            }

            var validNumber = rulesValidators["numeric"].validate(value, rule),
                validValue = commonUtils.isDefined(value),
                number = validNumber ? parseFloat(value) : validValue && value.valueOf(),
                min = rule.min,
                max = rule.max;

            if(!(validNumber || commonUtils.isDate(value)) && !validValue) {
                return false;
            }

            if(commonUtils.isDefined(min)) {
                if(commonUtils.isDefined(max)) {
                    return number >= min && number <= max;
                }
                return number >= min;
            } else {
                if(commonUtils.isDefined(max)) {
                    return number <= max;
                } else {
                    throw errors.Error("E0101");
                }
            }
        },
        defaultMessage: function(value) { return messageLocalization.getFormatter("validation-range")(value); },
        defaultFormattedMessage: function(value) { return messageLocalization.getFormatter("validation-range-formatted")(value); }
    },

    /**
    * @name stringLengthRule
    * @publicName StringLengthRule
    * @section dxValidator
    * @type object
    */
    "stringLength": {
        /**
        * @name stringLengthRuleOptions_type
        * @publicName type
        * @type string
        * @acceptValues 'stringLength'
        */
        /**
        * @name stringLengthRuleOptions_min
        * @publicName min
        * @type number
        */
        /**
        * @name stringLengthRuleOptions_max
        * @publicName max
        * @type number
        */
        /**
        * @name stringLengthRuleOptions_trim
        * @publicName trim
        * @type boolean
        * @default true
        */
        /**
        * @name stringLengthRuleOptions_message
        * @publicName message
        * @type string
        * @default 'The length of the value is not correct'
        */
        validate: function(value, rule) {
            value = commonUtils.isDefined(value) ? String(value) : "";
            if(rule.trim || !commonUtils.isDefined(rule.trim)) {
                value = $.trim(value);
            }

            return rulesValidators.range.validate(value.length,
                extend({}, rule));
        },
        defaultMessage: function(value) { return messageLocalization.getFormatter("validation-stringLength")(value); },
        defaultFormattedMessage: function(value) { return messageLocalization.getFormatter("validation-stringLength-formatted")(value); }
    },

    /**
    * @name customRule
    * @publicName CustomRule
    * @section dxValidator
    * @type object
    */
    "custom": {
        /**
        * @name customRuleOptions_type
        * @publicName type
        * @type string
        * @acceptValues 'custom'
        */
        /**
        * @name customRuleOptions_validationCallback
        * @publicName validationCallback
        * @type function
        * @type_function_return true|false
        * @type_function_param1 options:object
        * @type_function_param1_field1 value:string|number
        * @type_function_param1_field2 rule:object
        * @type_function_param1_field3 validator:object
        */
        /**
        * @name customRuleOptions_message
        * @publicName message
        * @type string
        * @default 'Value is invalid'
        */
        /**
        * @name customRuleOptions_reevaluate
        * @publicName reevaluate
        * @type boolean
        * @default false
        */
        validate: function(value, rule) {
            return rule.validationCallback({
                value: value,
                validator: rule.validator,
                rule: rule
            });
        },
        defaultMessage: function(value) { return messageLocalization.getFormatter("validation-custom")(value); },
        defaultFormattedMessage: function(value) { return messageLocalization.getFormatter("validation-custom-formatted")(value); }
    },

    /**
    * @name compareRule
    * @publicName CompareRule
    * @section dxValidator
    * @type object
    */
    "compare": {
        /**
        * @name compareRuleOptions_type
        * @publicName type
        * @type string
        * @acceptValues 'compare'
        */
        /**
        * @name compareRuleOptions_comparisonTarget
        * @publicName comparisonTarget
        * @type function
        * @type_function_return object
        */
        /**
        * @name compareRuleOptions_comparisonType
        * @publicName comparisonType
        * @type string
        * @default '=='
        * @acceptValues '=='|'!='|'==='|'!=='|'>'|'>='|'<'|'<='
        */
        /**
        * @name compareRuleOptions_message
        * @publicName message
        * @type string
        * @default 'Values do not match'
        */
        /**
        * @name compareRuleOptions_reevaluate
        * @publicName reevaluate
        * @type boolean
        * @default true
        */
        validate: function(value, rule) {
            if(!rule.comparisonTarget) {
                throw errors.Error("E0102");
            }

            extend(rule, { reevaluate: true });

            var otherValue = rule.comparisonTarget(),
                type = rule.comparisonType || "==";

            switch(type) {
                case "==":
                    return value == otherValue; // jshint ignore:line
                case "!=":
                    return value != otherValue; // jshint ignore:line
                case "===":
                    return value === otherValue;
                case "!==":
                    return value !== otherValue;
                case ">":
                    return value > otherValue;
                case ">=":
                    return value >= otherValue;
                case "<":
                    return value < otherValue;
                case "<=":
                    return value <= otherValue;

            }
        },
        defaultMessage: function(value) { return messageLocalization.getFormatter("validation-compare")(value); },
        defaultFormattedMessage: function(value) { return messageLocalization.getFormatter("validation-compare-formatted")(value); }
    },

    /**
    * @name patternRule
    * @publicName PatternRule
    * @section dxValidator
    * @type object
    */
    "pattern": {
        /**
        * @name patternRuleOptions_type
        * @publicName type
        * @type string
        * @acceptValues 'pattern'
        */
        /**
        * @name patternRuleOptions_pattern
        * @publicName pattern
        * @type regexp|string
        */
        /**
        * @name patternRuleOptions_message
        * @publicName message
        * @type string
        * @default 'Value does not match pattern'
        */
        validate: function(value, rule) {
            if(!rulesValidators.required.validate(value, {})) {
                return true;
            }
            var pattern = rule.pattern;
            if(commonUtils.isString(pattern)) {
                pattern = new RegExp(pattern);
            }
            return pattern.test(value);
        },
        defaultMessage: function(value) { return messageLocalization.getFormatter("validation-pattern")(value); },
        defaultFormattedMessage: function(value) { return messageLocalization.getFormatter("validation-pattern-formatted")(value); }
    },

    /**
    * @name emailRule
    * @publicName EmailRule
    * @section dxValidator
    * @type object
    */
    "email": {
        /**
        * @name emailRuleOptions_type
        * @publicName type
        * @type string
        * @acceptValues 'email'
        */
        /**
        * @name emailRuleOptions_message
        * @publicName message
        * @type string
        * @default 'Email is invalid'
        */
        validate: function(value, rule) {
            if(!rulesValidators.required.validate(value, {})) {
                return true;
            }
            return rulesValidators.pattern.validate(value,
                extend({},
                    rule,
                    {
                        pattern: /^[\d\w\._\-]+@([\d\w\._\-]+\.)+[\w]+$/i
                    }));
        },
        defaultMessage: function(value) { return messageLocalization.getFormatter("validation-email")(value); },
        defaultFormattedMessage: function(value) { return messageLocalization.getFormatter("validation-email-formatted")(value); }
    }

};

var GroupConfig = Class.inherit({
    ctor: function(group) {
        this.group = group;
        this.validators = [];
    },

    validate: function() {
        var result = {
            isValid: true,
            brokenRules: [],
            validators: []
        };

        $.each(this.validators, function(_, validator) {
            var validatorResult = validator.validate();
            result.isValid = result.isValid && validatorResult.isValid;

            if(validatorResult.brokenRule) {
                result.brokenRules.push(validatorResult.brokenRule);
            }
            result.validators.push(validator);
        });

        this.fireEvent("validated", [{
            validators: result.validators,
            brokenRules: result.brokenRules,
            isValid: result.isValid
        }]);

        return result;
    },

    reset: function() {
        $.each(this.validators, function(_, validator) {
            validator.reset();
        });
    }
}).include(EventsMixin);

/**
 * @name validationEngine
 * @section Core
 * @publicName validationEngine
 * @module ui/validation_engine
 * @export default
 */
var ValidationEngine = {
    groups: [],

    /**
    * @name validationEngineMethods_getGroupConfig
    * @section Core
    * @publicName getGroupConfig(group)
    * @param1 group:string|object
    * @return object
    */
    /**
    * @name validationEngineMethods_getGroupConfig
    * @section Core
    * @publicName getGroupConfig()
    * @return object
    */
    getGroupConfig: function(group) {
        var result = commonUtils.grep(this.groups, function(config) {
            return config.group === group;
        });

        if(result.length) {
            return result[0];
        }
        //TODO: consider throwing exception here, as it causes quite strange and hardly diagnostable behaviour
    },

    initGroups: function() {
        this.groups = [];
        this.addGroup();
    },

    addGroup: function(group) {

        var config = this.getGroupConfig(group);
        if(!config) {
            config = new GroupConfig(group);
            this.groups.push(config);
        }

        return config;
    },

    removeGroup: function(group) {
        var config = this.getGroupConfig(group),
            index = inArray(config, this.groups);

        if(index > -1) {
            this.groups.splice(index, 1);
        }

        return config;
    },

    _setDefaultMessage: function(rule, validator, name) {
        if(!commonUtils.isDefined(rule.message)) {
            if(validator.defaultFormattedMessage && commonUtils.isDefined(name)) {
                rule.message = validator.defaultFormattedMessage(name);
            } else {
                rule.message = validator.defaultMessage();
            }
        }
    },

    validate: function validate(value, rules, name) {
        var result = {
                name: name,
                value: value,
                brokenRule: null,
                isValid: true,
                validationRules: rules
            },
            that = this;

        $.each(rules || [], function(_, rule) {
            var ruleValidator = rulesValidators[rule.type],
                ruleValidationResult;

            if(ruleValidator) {
                if(commonUtils.isDefined(rule.isValid) && rule.value === value && !rule.reevaluate) {
                    if(!rule.isValid) {
                        result.isValid = false;
                        result.brokenRule = rule;
                        return false;
                    }
                    return true;
                }

                rule.value = value;
                ruleValidationResult = ruleValidator.validate(value, rule);
                rule.isValid = ruleValidationResult;

                if(!ruleValidationResult) {
                    result.isValid = false;

                    that._setDefaultMessage(rule, ruleValidator, name);

                    result.brokenRule = rule;
                }

                if(!rule.isValid) {
                    return false;
                }

            } else {
                throw errors.Error("E0100");
            }
        });

        return result;
    },

    registerValidatorInGroup: function(group, validator) {
        var groupConfig = ValidationEngine.addGroup(group);

        if(inArray(validator, groupConfig.validators) < 0) {
            groupConfig.validators.push(validator);
        }
    },

    _shouldRemoveGroup: function(group, validatorsInGroup) {
        var isDefaultGroup = group === undefined,
            isValidationGroupInstance = group && group.NAME === "dxValidationGroup";

        return !isDefaultGroup && !isValidationGroupInstance && !validatorsInGroup.length;
    },

    removeRegisteredValidator: function(group, validator) {
        var config = ValidationEngine.getGroupConfig(group),
            validatorsInGroup = config && config.validators;
        var index = inArray(validator, validatorsInGroup);
        if(index > -1) {
            validatorsInGroup.splice(index, 1);
            if(this._shouldRemoveGroup(group, validatorsInGroup)) {
                this.removeGroup(group);
            }
        }
    },

    /**
    * @name validationEngineMethods_validateGroup
    * @section Core
    * @publicName validateGroup(group)
    * @param1 group:string|object
    * @return object
    */
    /**
    * @name validationEngineMethods_validateGroup
    * @section Core
    * @publicName validateGroup()
    * @return object
    */
    validateGroup: function(group) {
        var groupConfig = ValidationEngine.getGroupConfig(group);

        if(!groupConfig) {
            throw errors.Error("E0110");
        }

        return groupConfig.validate();
    },

    /**
    * @name validationEngineMethods_resetGroup
    * @section Core
    * @publicName resetGroup(group)
    * @param1 group:string|object
    */
    /**
    * @name validationEngineMethods_resetGroup
    * @section Core
    * @publicName resetGroup()
    */
    resetGroup: function(group) {
        var groupConfig = ValidationEngine.getGroupConfig(group);

        if(!groupConfig) {
            throw errors.Error("E0110");
        }

        return groupConfig.reset();
    }

};

ValidationEngine.initGroups();

module.exports = ValidationEngine;
