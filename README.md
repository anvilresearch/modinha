# Modinha

Modinha is a schema-based object modeling package for Node.js. Because ORM/ODM-type libraries tend to cause as many problems as they solve, Modinha aims to separate model logic from persistence. The primary goal is to make it easy to write runtime swappable custom backends at the driver level, without having to entirely sacrifice the benefits that higher-level model code provides. Defining the backend for models at runtime rather than hard coding them with specific adapters supports running unit tests against an in-memory backend to keep large unit test suites running fast, while selecting a "real" backend for integration tests and deployment. This feature should also make migrating from one backend to another much less painful.

### Installation and Usage

#### Install

    $ npm install modinha

#### Require

    var Modinha = require('modinha');

#### Extend.

Anything you want to add or override on the model or its prototype can be passed to extend.

    var CLASSNAME = Modinha.extend(PROTOTYPE, STATIC);

A schema must be defined for each model. By default, all schemas have a unique `_id` and timestamps. You can omit `_id` or the timestamps with static properties.

    var M = Modinha.extend(null, {
      schema: {
        name: { type: 'string', required: true }
      },
      uniqueID: false,
      timestamps: false
    });

You can also set a different property as the unique id.

    var M = Modinha.extend(null, {
      schema: { other: { type: 'string', required: true } },
      uniqueID: 'other'
    });    

Schema properties can have default values, which can be a literal value or a function that generates a value.

    var M = Modinha.extend(null, {
      schema: {
        color: { 
          type: 'string', 
          enum: ['blue', 'green' ], 
          default: 'blue' 
        },
        secret: { 
          type: 'string', 
          default: function () { 
            return Math.random(); 
          } 
        }
      }
    });

Modinha defines a property for common default functions. At the moment there's a random string generator. More to come...

    var M = Modinha.extend(null, {
      schema: {
        secret: { type: 'string', default: Modinha.defaults.random }
      }
    });


#### CRUD

Models have CRUD-like static methods.

    var User = Modinha.extend(null, {
      schema: {
        name:  { type: 'string' },
        email: { type: 'string', required: true, format: 'email' }
      }
    });

    User.create({ email: 'valid@example.com' }, function (err, user) {
      console.log(user);
    });

    User.find({ _id: '384850302' }, function (err, user) {
      console.log(user);
    });

    User.update({ email: 'initial@example.com' }, 
                { name: 'Updated', email: 'updated@example.com' },
                function (err, user) {
                  console.log(user);
                });

    User.destroy({ name: 'Gladiator' }, function (err) {
      console.log('R.I.P.')
    });


#### Hooks

Perform model-specific operations before validating or creating instances.

    var Widget = Modinha.extend(null, { schema: { name: { type: 'string' } } });

    Widget.before('create', function () {
      this.name += ' widget';
    });

    Widget.before('validate', function () {
      console.log('hope this is valid...');
    });


## Persistence

Modinha uses an in-memory backend by default. This works like a mock backend for testing and simplifies initial stages of development. Adapters for a few different data stores are planned, including Redis, Riak, and MongoDB.


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
