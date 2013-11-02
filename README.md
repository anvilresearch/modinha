# Modinha

Modinha is a toolkit for creating persisted models. This is for programmers who like to work from the bottom up, building up persistence code from low level drivers, such as node_redis. Modinha provides:

* Schema-based validation
* Model inheritance
* Model extension (mixins)
* Literal and functional default value definition
* Private value protection
* Selection (initialize a subset of an object)
* Mapping (initialize an object from a different data model)
* Optional null values (normalize empty query results)
* More



### Installation and Usage

#### Install

    $ npm install modinha

#### Require

    var Modinha = require('modinha');


#### Define a model based on a schema

    var Account = Modinha.define({
      _id:      { type: 'string', default: Modinha.default.uuid },
      name:     { type: 'string' },
      email:    { type: 'string', required: true, format: 'email' },
      hash:     { type: 'string', required: true, private: true },
      created:  { type: 'string', default: Modinha.default.timestamp, format: 'utc-millisec' }
    });


#### Create an instance

    var account = new Account({ email: 'john@smith.com' }, options);


#### Validation

Validate an uninitialized object against the model's schema.

    Account.validate({...})

Validate an instance.

    var account = new Account({...})
      , validation = account.validate()


#### Initializing Objects

Like the constructor, a model's static initialize method takes data and options arguments. 
    
With a null or undefined data argument, initialize will return an instance of the model with default values.

    Account.initialize()

For cases where this is undesirable, such as initializing database results, use the nullify option

    Account.initialize(undefined, { nullify: true })

Like the constructor, initialize will set any properties you provide that are defined in the schema.

    Account.initialize({ email: 'john@example.com' })

Default values will not be set if values for the property are provided.

    Account.initialize({ _id: '...', email: 'john@example.com' })

Properties not defined in the schema are ignored.

    Account.initialize({ hacker: 'p0wn3d' })

Private schema properties are also ignored by default. This is to prevent accidental disclosure of sensitive values, such as hashed passwords. To include private values in an instance, set the private option to true.

    Account.initialize({ hash: 'secret', ... }, { private: true })

Unlike the constructor, the static initialize method can also instantiate multiple objects in one call, parse json, and any combination of the two.

    Account.initialize([{...},{...},{...}])
    Account.initialize('{ "json": true }')
    Account.initialize('[{},{},{}]')
    Account.initialize(['{}', '{}'])
    
    
#### Mappings

Pass a mapping in the options.

    Account.initialize({ facebook: { bs: {}, id: '...' } }, { map: { '_id': 'facebook.id' } })

Or predefine named mappings:

    Account.maps.facebook = {
      '_id': 'facebook.id'
    };

    Account.initialize(fbData, { map: 'facebook' });


#### Selections

Get a subset of an object.

    Account.initialize({...}, { select: ['name', 'email'] });


#### Merging objects

Merge works identical to initialize, except that it mutates an existing instance instead of creating a new one.

    var account = new Account({...});
    account.merge(data, { map: 'facebook' });


#### Augment the model

This model can be easily augmented with static and prototype methods.

    Account.create = function (data, options, callback) {
      if (!callback) {
        callback = options;
        options = {};    
      }
      
      var account = new Account(data, options)
        , validation = account.validate()
        , timestamp = Date.now()
        ;
      
      account.created = timestamp;
      account.modified = timestamp;
      
      if (!validation.valid) { 
        return callback(validation); 
      }
      
      // store the account data
      // maintain a sorted set of account ids
      // maintain a secondary index by email
      client.multi()
        .hset('accounts', account._id, JSON.stringify(account))    
        .zadd('accounts:id', timestamp, account._id)               
        .hset('accounts:email', account.email, account._id)        
        .exec(function (err) {
          if (err) { return callback(err); }
          callback(null, account);
        });
    }

When a model requires many methods that are general and identical to other models, duplication can be avoided by extending the model with mixins.


#### Extend the model

Pass in a "class" (constructor) or explicit prototype and static augmentations.

    Model.extend(SomethingToMixin)
    Model.extend(proto, static);

#### Inherit from a model

    var Admin = Account.inherit(proto, static);



## The MIT License

Copyright (c) 2013 Christian Smith http://anvil.io

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
