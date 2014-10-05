'use strict';
//var util = require('util');
var path = require('path');
var _ = require('lodash');
var utils = require('../utils');
var Class = require('../class');

var ControllerGenerator = Class.extend({
    constructor: function() {

        Class.apply(this, arguments);
        var that = this;
        this.on('end', function() {
            var done = that.async();
            utils.injectComponent(path.join(that.getClientScriptFolder(), that.modulename, 'controllers'))
                .then(function() {
                    return utils.injectSubComponent(that, path.join(that.getClientScriptFolder(), that.modulename));
                })
                .then(function() {
                    done();
                });
        }.bind(this));

        this.createOptions();

        this.argument('modulename', {
            type: String,
            required: false
        });

        this.argument('controllername', {
            type: String,
            required: false
        });
        this.modulename = this._.camelize(this._.slugify(this._.humanize(this.modulename)));
        this.controllername = this._.camelize(this._.slugify(this._.humanize(this.controllername)));
    },

    initializing: function() {
        var done = this.async();
        var that = this;
        this.clientModules = [];
        var emitError = function() {
            that.log(that.utils.chalk.red('No module could be found. Please run \'yo angular-famous-ionic:module\' to create one.'));
            that.emit('error', 'No module found');
            done();
        };
        this.getClientModules()
            .then(function(modules) {
                if(!_.isArray(modules) || modules.length <= 0) {
                    emitError();
                }
                that.clientModules = modules;
                done();
            }, function() {
                emitError();
            });
    },

    prompting: function() {

        var done = this.async();
        var that = this;

        var choices = _.map(this.clientModules, function(module) {
            return {
                name: module,
                value: module
            };
        });

        var prompts = [{
            name: 'modulename',
            type: 'list',
            choices: choices,
            when: function() {
                var result = !that.modulename || that.modulename.length <= 0;
                return result;
            },
            message: 'What is the name of your module ?',
            default: that.modulename,
            validate: function(value) {
                value = _.str.trim(value);
                if(_.isEmpty(value) || value[0] === '/' || value[0] === '\\') {
                    return 'Please enter a non empty name';
                }
                if(!_.contains(that.clientModules, value)) {
                    return 'The module name ' + value + ' does not exist';
                }
                return true;
            }
        }, {
            name: 'controllername',
            when: function() {
                return !that.controllername || that.controllername.length <= 0;
            },
            message: 'How would like to name your controller ?',
            validate: function(value) {
                value = _.str.trim(value);
                if(_.isEmpty(value) || value[0] === '/' || value[0] === '\\') {
                    return 'Please enter a non empty name';
                }
                return true;
            }
        }];

        this.prompt(prompts, function(answers) {
            that.modulename = that.modulename || answers.modulename;
            that.controllername = that.controllername || answers.controllername;
            done();
        });

    },

    configuring: function() {

    },

    writing: function() {
        var done = this.async();
        this.sourceRoot(path.join(__dirname, '../templates/controller'));
        var targetDir = path.join('client', 'scripts', this.modulename, 'controllers');
        this.mkdir(targetDir);

        // make sure the controllers/index.js exist
        utils.createIndexFile(this, targetDir, '../module/controllers');

        this.template('index.js', path.join(targetDir, this.controllername + '.js'));
        this.template('index.test.js', path.join(targetDir, this.controllername + '.test.js'));
        done();

    },

    end: function() {

    }
});

module.exports = ControllerGenerator;