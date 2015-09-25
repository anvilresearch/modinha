/**
 * Initialize Module
 */

/**
 * Traverse
 *
 * Recursively iterates through a schema and invokes an operation
 * on each property.
 *
 * @param  {Object}   schema
 * @param  {Object}   source
 * @param  {Object}   target
 * @param  {Function} operation
 * @param  {Object}   options
 * @return {undefined}
 */

function traverse (schema, source, target, operation, options) {
  Object.keys(schema).forEach(function (key) {
    var descriptor = schema[key]

    // Recurse if the property is a nested schema.
    if (descriptor && descriptor.properties) {
      traverse(
        descriptor.properties, // pass the nested schema
        source[key] || {}, // nested source object
        target[key] = {}, // initialize nested target object
        operation,
        options
      )

    // Invoke the operation for this property.
    } else {
      operation(key, descriptor, source, target, options)
    }
  })
}

/**
 * Assign
 *
 * This function is invoked by `traverse`, and operates on one
 * property at a time. It sets a value on a target object based
 * on:
 *
 * 1. a property descriptor defined in the schema.
 * 2. a value derived from a source object
 * 3. a set of options
 *
 * Together, `traverse` and `assign` mutate a target object rather
 * than providing a return value. Although a functional style might
 * result in cleaner code, JavaScript doesn't allow replacing `this`
 * within a constructor function. To consistent, we stick with
 * an imperative style throughout this module.
 *
 * @param  {String} key
 * @param  {Object} descriptor
 * @param  {Object} source
 * @param  {Object} target
 * @param  {Object} options
 * @return {undefined}
 */

function assign (key, descriptor, source, target, options) {
  if (descriptor && !descriptor.private || options.private) {
    var value = source[key]

    // define an immutable property
    if (value && descriptor.immutable) {
      Object.defineProperty(target, key, {
        writable: false,
        enumerable: true,
        value: value
      })

    // invoke a setter method
    } else if (typeof descriptor.set === 'function') {
      descriptor.set.call(target, source)

    // simple assignment
    } else if (value !== undefined) {
      target[key] = value

    // assign default value
    } else if (descriptor.default && options.defaults !== false) {
      var defaultValue = descriptor.default
      target[key] = (typeof defaultValue === 'function')
        ? defaultValue()
        : defaultValue
    }

    // trim string values if requested
    if (descriptor.trim) {
      var trimLeading = descriptor.trim === true || descriptor.trim.leading
      var trimTrailing = descriptor.trim === true || descriptor.trim.trailing

      if (descriptor.type === 'string' && typeof target[key] === 'string') {
        if (trimLeading) {
          target[key] = target[key].replace(/^\s+/, '')
        }
        if (trimTrailing) {
          target[key] = target[key].replace(/\s+$/, '')
        }
      } else if (descriptor.type === 'array' && Array.isArray(target[key])) {
        for (var i = 0; i < target[key].length; i++) {
          if (typeof target[key][i] === 'string') {
            if (trimLeading) {
              target[key][i] = target[key][i].replace(/^\s+/, '')
            }
            if (trimTrailing) {
              target[key][i] = target[key][i].replace(/\s+$/, '')
            }
          }
        }
      }
    }

    // delete property if explicitly undefined
    if (Array.isArray(options.$unset) &&
      options.$unset.indexOf(key) !== -1) {
      delete target[key]
    }
  }

  // invoke "after" method
  if (descriptor.after && value !== undefined) {
    descriptor.after.call(target, source)
  }
}

/**
 * Map
 *
 * @param  {Object} mapping
 * @param  {Object} source
 * @param  {Object} target
 */

function map (mapping, source, target) {
  Object.keys(mapping).forEach(function (path) {
    var from = mapping[path]
    var to = path.split('.')
    if (typeof from === 'function') {
      var value = from(source)
      if (value) { setDeepProperty(target, to, value) }
    } else {
      setDeepProperty(target, to, getDeepProperty(source, from.split('.')))
    }
  })
}

/**
 * Project
 *
 * @param  {Object} mapping
 * @param  {Object} source
 * @param  {Object} target
 */

function project (mapping, source, target) {
  Object.keys(mapping).forEach(function (path) {
    var from = path.split('.')
    var to = mapping[path].split('.')
    setDeepProperty(target, to, getDeepProperty(source, from))
  })
}

/**
 * Select
 *
 * Initialize a subset of an object by providing
 * a selection (array of property "chain" strings).
 * We can think of a selection as a shorthand or
 * macro (in the lisp sense) for a mapping. Select
 * is used by `Modinha.prototype.initialize`.
 *
 * Example:
 *
 *   Model.initialize({
 *     a: 'a',
 *     b: { c: 'c' },
 *     d: 'd'
 *   }, {
 *     select: ['b.c', 'd']
 *   })
 */

function select (properties, source, target) {
  var mapping = {}

  properties.forEach(function (property) {
    mapping[property] = property
  })

  map(mapping, source, target)
}

/**
 * Get deep property
 *
 * @param  {Object} source
 * @param  {Array} chain
 * @return {undefined}
 */

function getDeepProperty (source, chain) {
  var key = chain.shift()

  // there's nothing to see here, move along
  if (source[key] === undefined) { return }
  // if property is null then return null
  if (source[key] === null) { return null }
  // we're at the end of the line, this is the value you're looking for
  if (source[key] && chain.length === 0) { return source[key] }
  // traverse the object
  if (source[key] !== undefined) { return getDeepProperty(source[key], chain) }
}

/**
 * Set deep property
 *
 * @param {Object} target
 * @param {Array} chain
 * @param {any} value
 */
function setDeepProperty (target, chain, value) {
  var key = chain.shift()

  if (chain.length === 0) {
    target[key] = value
  } else {
    if (!target[key]) { target[key] = {} }
    setDeepProperty(target[key], chain, value)
  }
}

/**
 * Initialize
 */

function initialize (schema, source, target, options) {
  if (!source) { source = {} }
  if (!options) { options = {} }

  if (options.mapping) {
    map(options.mapping, source, target)
  } else if (options.select) {
    select(options.select, source, target)
  } else {
    traverse(schema, source, target, assign, options)
  }
}

/**
 * Exports
 */

initialize.traverse = traverse
initialize.assign = assign
initialize.map = map
initialize.project = project
initialize.select = select
initialize.getDeepProperty = getDeepProperty
initialize.setDeepProperty = setDeepProperty

module.exports = initialize
