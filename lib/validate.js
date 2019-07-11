/**
 * Module dependencies
 */

var _ = require('underscore')
var util = require('util')
var validator = require('lx-valid')

/**
 * Add a format extension for UUID
 */

var uuidFormat = /[0-9a-f]{22}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
validator.validate.formatExtensions.uuid = uuidFormat

/**
 * Format extension for url that allows localhost
 */

var urlFormat = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/
validator.validate.formatExtensions.url = urlFormat

/**
 * Validate function
 *
 * After validating, we transform the array of errors objects
 * provided by validator.validate into an object keyed by
 * property, for easier lookup.
 */

function validate (data, schema) {
  var validation, errorProperties

  validation = validator.validate(data, { properties: schema })
  errorProperties = _.pluck(validation.errors, 'property')

  validation.errors = _.object(errorProperties, validation.errors)
  return new ValidationError(validation)
}

/**
 * Validation error
 */

function ValidationError (validation) {
  var errors = validation.errors || {}
  var messages = []

  _.extend(this, validation)
  this.name = 'ValidationError'

  Object.keys(errors).forEach(function (key) {
    var attribute = errors[key].attribute
    var actual = errors[key].actual
    var message = errors[key].message

    switch (attribute) {
      case 'required':
      case 'type':
        messages.push('"' + key + '"' + ' ' + message + '.')
        break

      case 'format':
        messages.push('"' + actual + '"' + ' ' + message + '.')
        break

      default:
        messages.push(message)
    }
  })

  this.message = messages.join(' ')

  this.statusCode = 400
}

util.inherits(ValidationError, Error)
validate.ValidationError = ValidationError

/**
 * Exports
 */

module.exports = validate
