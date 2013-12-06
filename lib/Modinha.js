/**
 * Module dependencies
 */

var _          = require('underscore')
  , util       = require('util')
  , uuid       = require('node-uuid')
  , crypto     = require('crypto')  
  , validate   = require('./validate')
  , initialize = require('./initialize')
  , map        = initialize.map
  , select     = initialize.select
  , project    = initialize.project
  ;


/**
 * Abstract Constructor
 */

function Modinha (data, options) {
  this.initialize(data, options);
}


/**
 * Default uniqueId property
 */

Modinha.uniqueId = '_id';


/**
 * Default value generator functions
 */

Modinha.defaults = {};


/**
 * UUID
 */

Modinha.defaults.uuid = function () {
  return uuid.v4();
};


/**
 * Random string
 */

Modinha.defaults.random = function (len) {
  return function () {
    return crypto.randomBytes(len || 10).toString('hex');  
  }
};


/**
 * Timestamp
 */

Modinha.defaults.timestamp = function () {
  return Date.now();
}


/**
 * Model definition
 *
 * Most model definitions require no options other than 
 * a schema and collection name. Using Modinha.inherit usually 
 * ends up requiring a null proto property and a static argument 
 * with only a schema property. Modinha.define makes creating 
 * models by inheritance a little more concise in most cases.
 */

Modinha.define = function (collection, schema) {
  if (!schema) {
    schema = collection;
    collection = undefined;
  }

  return this.inherit(null, { schema: schema, collection: collection })
};


/**
 * Inherit
 *
 * Calling inherit on Modinha or a model will return 
 * a new model. It works similar "extend", but instead
 * of mutating the receiver, it creates a new model that 
 * inherits from the receiver.
 */

function F () {}

Modinha.inherit = function (proto, static) {
  if (this.name === 'Modinha' && (!static || !static.schema)) { 
    throw new UndefinedSchemaError(); 
  }

  var superClass = this;

  var subClass = function () {
    superClass.apply(this, arguments);
  };

  F.prototype = superClass.prototype;
  subClass.prototype = new F();

  _.extend(subClass.prototype, proto);
  _.extend(subClass, superClass, static);

  subClass.prototype.constructor = subClass;
  subClass.superclass = superClass.prototype;

  // override the uniqueId property name if
  // a (non-nested) property in the schema is
  // flagged as uniqueId
  Object.keys(subClass.schema).forEach(function (property) {
    if (subClass.schema[property].uniqueId) { subClass.uniqueId = property }
  });

  return subClass;
}


/**
 * Extend
 *
 * This is a mixin method. It extends the model it's called
 * on with another class, or with explicit prototype and 
 * static arguments.
 */

Modinha.extend = function () {
  var Constructor = this
    , args = Array.prototype.slice.call(arguments)
    , proto
    , stat
    ;

  // treat a function as a constructor
  if (typeof args[0] === 'function') {
    stat  = args[0];
    proto = stat.prototype;
  } 

  // assume there are two object args
  else {
    proto = args[0] || null;
    stat  = args[1] || null;
  }

  _.extend(Constructor.prototype, proto);
  _.extend(Constructor, stat);

  if (typeof Constructor.__postExtend === 'function') {
    Constructor.__postExtend();
  }
}


/**
 * Initialize
 *
 * Used by the constructor to initialize an instance, and it can 
 * be called on an existing instance to update the properties.
 * 
 * Copy properties from provided data to an instance based 
 * on a set of rules. By default, merge will treat the schema
 * as a whitelist, copying all the properties it defines that
 * exist in the data. 
 * 
 * With the "map" option, merge will copy values to the instance 
 * based on a provided map. Maps can be literal objects or named. 
 * Initialize will resolve named maps.
 * 
 * With the "select" option, initialize will copy a subset of the 
 * provided data onto an instance. Select can be thought of as a 
 * special case of "map".
 */

Modinha.prototype.initialize = function (data, options) {
  var constructor = this.constructor
    , mappings    = constructor.mappings
    , schema      = constructor.schema
    , options     = options || {};
    ;

  if (typeof options.mapping === 'string') {
    options.mapping = mappings[options.mapping];
  }

  initialize(schema, data, this, options);
};


/**
 * Merge
 *
 * Invokes initialize but enforces non-assignment of defaults.
 * Need to consider how to delete keys and set to undefined, since
 * initialize doesn't assign undefined values.
 */

Modinha.prototype.merge = function (data, options) {
  options = options || {};
  options.defaults = false;
  this.initialize(data, options);
};


/**
 * Initialize
 *
 * This method provides enhanced initialization logic that 
 * probably doesn't belong directly in the constructor.
 *
 * If passed multiple values, it will initialize several
 * instances. If passed JSON, it will parse the JSON with 
 * error handling and reinvoke itself with the parsed object.
 *
 * If passed undefined or null, if will optionally skip
 * instantiating an object and return null. This is useful
 * for handling empty database responses.
 */

Modinha.initialize = function (data, options) {
  // get a reference to model this 
  // method is called on
  var Constructor = this;

  // set options if not provided in arguments
  if (!options) { 
    options = {}; 
  }

  // return null instead of a new instance
  // if the nullify option is provided
  if (!data && options.nullify) { 
    return null; 
  }

  // If data is a string, deserialize it and return 
  // the result of reinvoking the constructor on the
  // object representation
  if (typeof data === 'string') {
    return Constructor.initialize(Constructor.deserialize(data), options);
  }

  // reinvoke this method for each item in an array
  if (Array.isArray(data)) {
    if (options.first) {
      return Constructor.initialize(data[0], options);
    } else {
      return data.map(function (item) {
        return Constructor.initialize(item, options);
      });      
    }
  }

  // if we made it this far, it's time to get to work
  return new Constructor(data || {}, options);
}


/**
 * Serialize
 */

Modinha.serialize = function (object) {
  return JSON.stringify(object);
};


/**
 * Deserialize
 */

Modinha.deserialize = function (data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    throw new Error('failed to parse JSON');
  }
};


/**
 * Project
 */

Modinha.project = function (source, target, mapping) {
  project(mapping, source, target);
  return target;
};


/**
 * Project from instance
 */

Modinha.prototype.project = function (mapping) {
  var target = {};

  // resolve named mapping
  if (typeof mapping === 'string') {
    mapping = this.constructor.mappings[mapping];
  }

  project(mapping, this, target)

  return target;
}


/**
 * Named mappings
 */

Modinha.mappings = {};


/**
 * Validate data against the schema with either a
 * static method or an instance method.
 */

Modinha.validate = function (data) {
  return validate(data, this.schema);
};

Modinha.prototype.validate = function() {
  var Constructor = this.constructor;
  return validate(this, Constructor.schema);
};


/**
 * ValidationError
 */

Modinha.ValidationError = validate.ValidationError;


/**
 * UndefinedSchemaError
 */

function UndefinedSchemaError() {
  this.name = 'UndefinedSchemaError';
  this.message = 'Model inheritance requires a schema definition';
  Error.call(this, this.message);
  Error.captureStackTrace(this, arguments.callee);
}

util.inherits(UndefinedSchemaError, Error);
Modinha.UndefinedSchemaError = UndefinedSchemaError;


/**
 * Exports
 */

module.exports = Modinha;
