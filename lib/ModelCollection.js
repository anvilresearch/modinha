/**
 * Module dependencies
 */

var initialize = require('./initialize')
  ;


/**
 * Abstract Constructor
 */

function ModelCollection(model, data, options) {
  this.__model = model;

  if (Array.isArray(data)) {
    this.push.apply(this, data.map(function (item) {
      return model.initialize(item, options);
    }));
  }
}


/**
 * Inherit Array as base prototype
 */

ModelCollection.prototype = Object.create(Array.prototype);


/**
 * Project mappings
 */

ModelCollection.prototype.project = function (mapping) {
  var results = [];

  if (typeof mapping === 'string') {
    mapping = this.__model.mappings[mapping];
  }

  this.forEach(function (item) {
    var target = {};

    initialize.project(mapping, item, target);

    results.push(target);
  });

  return results;
};


/**
 * Export
 */

module.exports = ModelCollection;
