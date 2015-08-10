/**
 * Module dependencies
 */

var initialize = require('./initialize')
  ;


/**
 * Abstract Constructor
 */

function ModelCollection(model, data, options) {
  // Create a new Array as a starting point
  //
  // Javascript's type system is challenged, so extending the Array prototype
  // doesn't work as expected. Instead, we must create an Array and shove
  // methods onto it.
  var collection = Array.apply(null, []);

  // Store the model of the instances for this collection
  collection.__model = model;

  // If data has been provided, fill up the collection with it as a
  // starting point.
  if (Array.isArray(data)) {
    collection.push.apply(collection, data.map(function (item) {
      if (item instanceof model) {
        return item;
      } else {
        return model.initialize(item, options);
      }
    }));
  }

  ModelCollection.injectClassMethods(collection);

  return collection;
}


/**
 * Add collection methods to Array instance
 */

function injectClassMethods (collection) {
  var methods = Object.getOwnPropertyNames(ModelCollection.prototype);
  methods.forEach(function(method) {
    collection[method] = ModelCollection.prototype[method];
  });
  return collection;
};
ModelCollection.injectClassMethods = injectClassMethods;


/**
 * Project mappings
 */

function project(mapping) {
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
}
ModelCollection.prototype.project = project;


/**
 * Export
 */

module.exports = ModelCollection;
