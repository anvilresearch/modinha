# Modinha
[![Build Status](https://travis-ci.org/camfou/modinha.svg?branch=master)](https://travis-ci.org/camfou/modinha)

Modinha is a toolkit for creating persisted models. This is for programmers who like to work from the bottom up, building up persistence code from low level drivers, such as node_redis. Modinha provides:

* Schema-based validation
* Model inheritance
* Model extension (mixins)
* Flexible serialization/deserialization
* Literal and functional default value definition
* Private value protection
* Selection (initialize a subset of an object)
* Mapping (initialize an object from a different data model)
* Optional null values (normalize empty query results)
* More



### Installation and Usage

#### Install

```bash
$ npm install modinha
```


#### Require

```javascript
var Modinha = require('modinha');
```


#### Define a model based on a schema

```javascript
var Account = Modinha.define({
  _id: { type: 'string', default: Modinha.default.uuid },
  name: { type: 'string' },
  email: { type: 'string', required: true, format: 'email' },
  hash: { type: 'string', required: true, private: true },
  created: { type: 'string', default: Modinha.default.timestamp, format: 'utc-millisec' }
})
```

`Modinha.define()` optionally takes a collection name as the first argument and will assign the value of that argument to the new model's static `collection` property.

```javascript
Modinha.define('accounts', schema)
```


#### Create an instance

```javascript
var account = new Account({ email: 'john@smith.com' }, options)
```


#### Validation

Validate an uninitialized object against the model's schema.

```javascript
Account.validate({...})
```

Validate an instance.

```javascript
var account = new Account({...})
var validation = account.validate()
```


#### Initializing Objects

Like the constructor, a model's static initialize method takes data and options arguments.

With a null or undefined data argument, initialize will return an instance of the model with default values.

```javascript
Account.initialize()
```

For cases where this is undesirable, such as initializing database results, use the nullify option

```javascript
Account.initialize(undefined, { nullify: true })
```

Like the constructor, initialize will set any properties you provide that are defined in the schema.

```javascript
Account.initialize({ email: 'john@example.com' })
```

Default values will not be set if values for the property are provided.

```javascript
Account.initialize({ _id: '...', email: 'john@example.com' })
```

Properties not defined in the schema are ignored.

```javascript
Account.initialize({ hacker: 'p0wn3d' })
```

Private schema properties are also ignored by default. This is to prevent accidental disclosure of sensitive values, such as hashed passwords. To include private values in an instance, set the private option to true.

```javascript
Account.initialize({ hash: 'secret', ... }, { private: true })
```

Unlike the constructor, the static initialize method can also instantiate multiple objects in one call, parse json, and any combination of the two.

```javascript
Account.initialize([{...},{...},{...}])
Account.initialize('{ "json": true }')
Account.initialize('[{},{},{}]')
Account.initialize(['{}', '{}'])
```

#### Collections

Running initialize against a set of objects will return a `ModelCollection`, an
object which extends the Javascript Array object and provides Model-specific
functionality that will apply across all the items in the collection.

For example,

```javascript
Account.initialize([{...},{...},{...}])
```

will return a ModelCollection with three Account instances.

Currently, the ModelCollection object only supports the `project` function,
which can be used like so:

```javascript
var accounts = Account.initialize([
  { email: 'jane.doe@example.com' },
  { email: 'ham.sandwich@example.com' },
  { email: 'rosewater@example.com' }
])

var projections = accounts.project({
  email: 'email_address'
})

// projections = [
//   { email_address: 'jane.doe@example.com' },
//   { email_address: 'ham.sandwich@example.com' },
//   { email_address: 'rosewater@example.com' }
// ]
```



#### Mappings

Pass a mapping in the options.

```javascript
Account.initialize({ facebook: { bs: {}, id: '...' } }, { map: { '_id': 'facebook.id' } })
```

Or predefine named mappings:

```javascript
Account.maps.facebook = {
  '_id': 'facebook.id'
}
```

```javascript
Account.initialize(fbData, { map: 'facebook' })
```


#### Selections

Get a subset of an object.

```javascript
Account.initialize({...}, { select: ['name', 'email'] })
```


#### Merging objects

Merge works identical to initialize, except that it mutates an existing instance instead of creating a new one.

```javascript
var account = new Account({...})
account.merge(data, { map: 'facebook' })
```

If you would like to delete a property off of an object, then set the `$unset` operator on the options object to an array with the list of property names you would like to delete. For example,

```javascript
var account = new Account({ ssn: '123-456-7890' })
account.merge({}, { $unset: [ 'ssn' ] })
```


#### Trimming strings and arrays of strings

Modinha supports automatically trimming strings or arrays of strings as the data is initialized. This feature is configured on the schema using the `trim` property:

```javascript
var Account = Modinha.define({
  name: {
    type: 'string',
    trim: true
  },
  contributions: {
    type: 'array',
    trim: true
  }
})

var account = new Account({
  name: '  Stephen Hawking  ',
  contributions: [
    'theories  ',
    '  understanding the fabric of the universe',
    ' ice bucket challenge survivor '
  ]
})

// account.name = 'Stephen Hawking'
// account.contributions = [
//   'theories',
//   'understanding the fabric of the universe',
//   'ice bucket challenge survivor'
// ]
```

String trimming can also be limited to only the leading or trailing whitespace by setting `trim` to an object with the `leading` and `trailing` boolean properties:

```javascript
var Account = Modinha.define({
  name: {
    type: 'string',
    trim: {
      leading: true
    }
  },
  contributions: {
    type: 'array',
    trim: {
      trailing: true
    }
  }
})

var account = new Account({
  name: '  Alan Turing  ',
  contributions: [
    'cracking the enigma code  ',
    '  theory of computation',
    ' the turing test '
  ]
})

// account.name = 'Alan Turing  '
// account.contributions = [
//   'cracking the enigma code',
//   '  theory of computation',
//   ' the turing test'
// ]
```



#### Serialization and deserialization

By default, Modinha models serialize and deserialize JSON. These methods can be overridden to store data in a different format. For example, we might want to use [MessagePack](http://msgpack.org/) or [CSV](https://tools.ietf.org/html/rfc4180), or perhaps compress the data with [snappy](https://code.google.com/p/snappy/).

```javascript
Account.serialize = function (object) {
  return msgpack.pack(object);
}

Account.deserialize = function (data) {
  return msgpack.unpack(data);
}
```


#### Augment the model

This model can be easily augmented with static and prototype methods.

```javascript
Account.create = function (data, options, callback) {
  // ...
}

Account.prototype.save = function (data, options, callback) {
  // ...
}
```

When a model requires many methods that are general and identical to other models, duplication can be avoided by extending the model with mixins.


#### Extend the model

Pass in a "class" (constructor) or explicit prototype and static augmentations.

```javascript
Model.extend(SomethingToMixin)
Model.extend(proto, static)
```


#### Inherit from a model

```javascript
var Admin = Account.inherit(proto, static)
```



## The MIT License

Copyright (c) 2015 Anvil Research, Inc. http://anvil.io

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
