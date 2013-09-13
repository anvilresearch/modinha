/**
 * Module dependencies
 */

var _        = require('underscore')
  , util     = require('util')
  , crypto   = require('crypto')  
  , validate = require('./validate')
//  , Backend  = require('./Backend')
  ;


/**
 * Constructor
 */

function Model (attrs, options) {
  this.initialize(attrs, options || {});
}


/**
 * Default backend
 */

Model.adapter = {
  type: './Backend'
};


/**
 * Schema Defaults
 */

Model.timestamps = true;
Model.uniqueID = '_id';


/**
 * Default value generator functions
 */

Model.defaults = {};

Model.defaults.random = function () {
  return crypto.randomBytes(10).toString('hex');
};


/**
 * Extend
 *
 * This method is adapted from the pattern described in 
 * Pro JavaScript Design Patterns, as well as Backbone's 
 * `extend`/`inherits` functions.
 */

function F () {}

Model.extend = function (collection, proto, static) {

  // Collection argument is optional
  if (!static) {
    static = proto;
    proto = collection;
    collection = '';
  }

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

  // Set the collection name. This may be overridden by static.
  subClass.collection = collection.toLowerCase();

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

  // load the configured backend module and initialize an instance 
  var Backend = require(subClass.adapter.type);
  subClass.backend = new Backend(subClass.collection, subClass.adapter);

  // In future versions, we'll possibly want to extend subClass again
  // with custom methods defined on Backend.

  //
  if (subClass.uniqueID === '_id') {
    subClass.schema._id = { type: 'any' }
  }

  // Add timestamp properties to the schema by default
  if (subClass.timestamps === true) {
    subClass.schema.created  = { type: 'any' }
    subClass.schema.modified = { type: 'any' }
  } 

  // Initialize a container for hooks
  subClass.hooks = {};

  // Initialize the value of prototype.constructor
  // and create a superclass reference
  subClass.prototype.constructor = subClass;
  subClass.superclass = superClass.prototype;

  return subClass;
};



// Recurse through nested schema properties and 
// copy values from the provided attrs onto `this`.
function set (schema, source, target, options) {
  var keys = Object.keys(schema);

  keys.forEach(function (key) {

    // If the value of the property has a "properties" property
    // treat it as a nested schema ...
    if (schema[key].properties) {

      // Define a nested object on `this`.
      if (!target[key]) { target[key] = {}; }

      // Recurse through the nested attrs/schema, setting
      // properties provided by attrs.
      set(schema[key].properties, source[key] || {}, target[key], options);

    // Otherwise treat the key as a simple attribute.
    } else {

      // check that the property is public or that private properties
      // are requested.
      if (!schema[key].private || options.private) {

        // If the data source provides a value, copy it to `this`.
        if (source[key]) {

          target[key] = source[key]; 

        // If not, and the schema provides a default value...
        } else if (schema[key].default) {

          // ... check it's type. If the default is a function, invoke 
          // it and assign its returned value. Otherwise, copy it from 
          // the schema to `this`.
          var defaultValue = schema[key].default;
          target[key] = (typeof defaultValue === 'function')
                      ? defaultValue()
                      : defaultValue;  

        }
      }
    }
  });
}


/**
 * Initialize (body of constructor)
 */

Model.prototype.initialize = function(attrs, options) {
  var Constructor = this.constructor
    , self = this;

  // Set properties of `this`.
  if (!attrs) { attrs = {}; }
  set(Constructor.schema, attrs, self, options);

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
    var result = (Array.isArray(data)) ? data : new Constructor(data);
    callback(null, result);
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