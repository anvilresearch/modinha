/**
 * Module dependencies
 */

var _       = require('underscore')
  , util    = require('util')
  , validate  = require('./validate')
  , Backend = require('./Backend')
  ;


/**
 * Constructor
 */

function Model (attrs) {
  this.initialize(attrs);
}


/**
 * Defaults
 */

Model.timestamps = true;
Model.uniqueID = '_id';


/**
 * Extend
 *
 * This method is adapted from the pattern described in 
 * Pro JavaScript Design Patterns, as well as Backbone's 
 * `extend`/`inherits` functions.
 */

function F () {}

Model.extend = function (proto, static) {

  // Require a schema to be defined on constructors derived 
  // directly from Model.
  if (this.name === 'Model' && (!static || !static.schema)) { 
    throw new UndefinedSchemaError(); 
  }

  // `this` refers to the constructor on which `extend` was called as a
  // static method. That constructor might be `Model` or it might be a class 
  // that extends `Model`, directly or indirectly.
  var superClass = this;

  // `subClass` is the new constructor we will eventually return. 
  // superClass is applied to `this` 
  var subClass = function () {
    superClass.apply(this, arguments);
  };

  // Initialize a new default backend.
  subClass.backend = new Backend();

  // We use an empty constructor to set up the prototype of 
  // subClass in order to avoid potential costs or side effects
  // of instantiating superClass.
  F.prototype = superClass.prototype;
  subClass.prototype = new F();

  // Here we merge properties of the `proto` argument into
  // subClass.prototype. Properties of proto will override 
  // those of subClass.prototype.
  _.extend(subClass.prototype, proto);

  // Merge properties of superClass and `static` argument
  // into subClass. `static` properties will override superClass.
  // Note that it is possible, though not advisable, to replace `extend`.
  _.extend(subClass, superClass, static);

  if (subClass.uniqueID === '_id') {
    subClass.schema._id = { type: 'any' }
  }

  if (subClass.timestamps === true) {
    subClass.schema.created  = { type: 'any' }
    subClass.schema.modified = { type: 'any' }
  } 

  subClass.hooks = {};

  // Initialize the value of prototype.constructor
  // and create a superclass reference
  subClass.prototype.constructor = subClass;
  subClass.superclass = superClass.prototype;

  return subClass;
};



// Recurse through nested schema properties and 
// copy values from the provided attrs onto `this`.
function set (schema, source, target) {
  var keys = Object.keys(schema);

  keys.forEach(function (key) {

    // If the key defines a nested schema ...
    if (schema[key].properties) {

      // Define a nested object on `this`.
      if (!target[key]) { target[key] = {}; }

      // Recurse through the nested attrs/schema, setting
      // properties provided by attrs.
      set(schema[key].properties, source[key] || {}, target[key]);

    } else {
      // If the data source provides a value, copy it to `this`.
      // If not, and the schema provides a default value,
      // copy it from the schema to `this`.
      if (source[key]) {
        target[key] = source[key]; 
      } else if (schema[key].default) {
        target[key] = schema[key].default;
      }
    }
  });
}


/**
 * Initialize (body of constructor)
 */

Model.prototype.initialize = function(attrs) {
  var Constructor = this.constructor
    , self = this;

  // Set properties of `this`.
  if (!attrs) { attrs = {}; }
  set(Constructor.schema, attrs, self);

  // Initialize the ID
  if (!self[Constructor.uniqueID]) { 
    self[Constructor.uniqueID] = Constructor.backend.createID(); 
  }  
};


/**
 * Validate data against the schema.
 */

Model.prototype.validate = function() {
  var Constructor = this.constructor;
  return validate(this, Constructor.schema);
};


/**
 * Create
 */

Model.create = function (attrs, callback) {
  var Constructor = this
    , hooks = Constructor.hooks
    , instance = new Constructor(attrs)
    ;

  if (hooks.validate) {
    hooks.validate.forEach(function (fn) {
      fn.apply(instance);
    });    
  }
  
  var validation = instance.validate();
  if (!validation.valid) { return callback(validation); }

  if (Constructor.timestamps === true) {
    var now = new Date();
    instance.created = now;
    instance.modified = now;    
  }

  if (hooks.create) {
    hooks.create.forEach(function (fn) {
      fn.apply(instance);
    });
  }

  Constructor.backend.save(instance, function (err) {
    if (err) { return callback(err); }
    callback(null, instance);
  });
};


/**
 * Find
 */

Model.find = function (conditions, options, callback) {
  var Constructor = this;
  
  if (callback === undefined) {
    callback = options;
    options = {};
  }

  Constructor.backend.find(conditions, function (err, data) {
    if (err) { return callback(err); }
    if (!data) { return callback(null, data); }
    callback(null, new Constructor(data));
  });
};


/**
 * Update
 */

Model.update = function (conditions, attrs, callback) {
  var Constructor = this;

  Constructor.find(conditions, function (err, instance) {
    if (!attrs) { attrs = {}; }
    set(Constructor.schema, attrs, instance);

    var validation = instance.validate();

    if (!validation.valid) { 
      return callback(validation); 
    }

    if (Constructor.timestamps === true) {
      instance.modified = new Date();    
    }

    Constructor.backend.update(conditions, instance, function (err) {
      if (err) { return callback(err); }
      callback(null, instance);
    });
  });
};


/**
 * Destroy
 */

Model.destroy = function (conditions, callback) {
  var Constructor = this;
  Constructor.backend.destroy(conditions, function (err) {
    callback(err);
  });
};


/**
 * Before hook
 */

Model.before = function (event, callback) {
  var Constructor = this;
  var hooks = Constructor.hooks;
  if (!hooks[event]) { hooks[event] = []; }
  hooks[event].push(callback);
};


/**
 * UndefinedSchemaError
 */

function UndefinedSchemaError() {
  this.name = 'UndefinedSchemaError';
  this.message = 'Extending Model requires a schema';
  Error.call(this, this.message);
  Error.captureStackTrace(this, arguments.callee);
}

util.inherits(UndefinedSchemaError, Error);
Model.UndefinedSchemaError = UndefinedSchemaError;


/**
 * Exports
 */

module.exports = Model;