# Modinha

Modinha is a model abstraction similar to an ORM or ODM, that aims to separate data modeling and persistence.

## Installation and Usage

Install as a package dependency:

    $ npm install modinha

Create a model:

    var Model = require('modinha');

    var User = Model.extend(null, {
      schema: {
        id:         { type: 'any' },
        first:      { type: 'string' },
        last:       { type: 'string' },
        username:   { type: 'string' },
        email:      { type: 'string', required: true, format: 'email' },
        created:    { type: 'any' },
        modified:   { type: 'any' }      
      }
    });

    // create a new user
    User.create({ email: 'valid@example.com' }, function (err, user) {
      console.log(user);
    });

    // find a user
    User.find({ ATTR: VALUE }, function (err, user) {
      console.log(user);
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
