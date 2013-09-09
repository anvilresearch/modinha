/**
 * Module dependencies
 */

var _      = require('underscore')
  , crypto = require('crypto')
  ;


/**
 * Mock backend
 */

function Backend () {
  this.reset();
}


/**
 * Reset documents (used for testing)
 */

Backend.prototype.reset = function() {
  this.documents = [];
};


/**
 * Generate a document ID
 */

Backend.prototype.createID = function () { 
  return crypto.randomBytes(10).toString('hex');
};


/**
 * Save a document
 */

Backend.prototype.save = function (doc, callback) {
  this.documents.push(doc);
  callback(null, doc);
};
 

/**
 * Update a document
 */

Backend.prototype.update = function (conditions, attrs, callback) {
  this.find(conditions, function (err, doc) {
    _.extend(doc, attrs);
    callback(null, doc);
  });
};


/**
 * Find a document
 */

Backend.prototype.find = function (conditions, options, callback) {
  if (callback === undefined) {
    callback = options;
    options = {};
  }

  var result, key = Object.keys(conditions).pop();

  if (key) {
    var keys = key.split('.');
    result = _.find(this.documents, function (doc) { 
      if (keys.length === 1) { return doc[keys[0]] === conditions[key]; }
      if (keys.length === 2) { return doc[keys[0]][keys[1]] === conditions[key]; }
    });
  } else {
    result = this.documents;
  }

  callback(null, result || null);   
};


/**
 * Destroy a document
 */

Backend.prototype.destroy = function(conditions, callback) {
  var documents = this.documents;

  this.find(conditions, function (err, doc) {
    var i = documents.indexOf(doc);
    if (i !== -1) { documents.splice(i, 1); }
    callback(null);
  });
};

/**
 * Exports
 */

module.exports = Backend;