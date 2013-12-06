Modinha = require '../lib/Modinha'

chai = require 'chai'
expect = chai.expect
chai.should()


describe 'Modinha', ->


  {Model,instance,validation,data,mapping,projection} = {}


  before ->

    Modinha.prototype.b = 'change me'
    Modinha.b = 'changed'

    Model = Modinha.inherit({
      a: 'a'
      b: 'b'
    }, {
      a: 'a'
      b: 'b'
      schema: {
        q:          { type: 'string' },
        r:          { type: 'boolean', default: true },
        s: {
          properties: {
            t:      { type: 'string' },
            u:      { type: 'boolean', default: true }
          }
        },
        v:          { type: 'string', default: -> 'generated' },
        w:          { type: 'string', private: true },
        uuid:       { type: 'string', default: Modinha.defaults.uuid, format: 'uuid', uniqueId: true },
        random:     { type: 'string', default: Modinha.defaults.random(12) }
        timestamp:  { type: 'number', default: Modinha.defaults.timestamp }
        short:      { type: 'string', maxLength: 6 }
        indirect:   { type: 'string', set: ((data) -> @indirect = "indirect#{data.indirect}"), after: ((data) -> @after = "after#{@indirect}") }
        after:      { type: 'string' }
        immutable:  { type: 'string', immutable: true }
      }
    })

    Model.mappings.named =
      'q'   : 'n'
      's.t' : 'm.s.t'




  describe 'model', ->

    it 'should be inheritable', ->
      Descendant = Model.inherit()
      instance = new Descendant
      expect(instance).to.be.an.instanceof Descendant
      expect(instance).to.be.an.instanceof Model
      expect(instance).to.be.an.instanceof Modinha




  describe 'model definition', ->

    it 'should require a schema', ->
      expect(-> Modinha.define()).to.throw Modinha.UndefinedSchemaError

    it 'should inherit the model from Modinha', ->
      DefinedModel = Modinha.define Model.schema
      instance = new DefinedModel
      expect(instance).to.be.an.instanceof Modinha

    it 'should optionally assign a collection', ->
      DefinedModel = Modinha.define 'collection', Model.schema
      DefinedModel.collection.should.equal 'collection'




  describe 'model inheritance', ->
    
    before ->
      instance = new Model

    it 'should require a schema', ->
      expect(-> Modinha.inherit()).to.throw Modinha.UndefinedSchemaError

    it 'should override default uniqueId', ->
      Model.uniqueId.should.equal 'uuid'

    it 'should set new prototype properties on the subclass', ->
      instance.a.should.equal 'a'

    it 'should override prototype properties on the subclass', ->
      instance.b.should.equal 'b'

    it 'should set new static properties on the subclass', ->
      Model.a.should.equal 'a'

    it 'should override static properties on the subclass', ->
      Model.b.should.equal 'b'

    it 'should set the prototype\'s constructor', ->
      Model.prototype.constructor.should.equal Model

    it 'should set the superclass\' prototype', ->
      Model.superclass.should.equal Modinha.prototype




  describe 'model extension', ->

    describe 'with constructor function', ->

      before ->
        class Extension
          c: 'c'
          b: 'bb'
          @c: 'c'
          @b: 'bb'

        Model.extend Extension
        instance = new Model

      it 'should set new prototype properties on the model', ->
        instance.c.should.equal 'c'

      it 'should override prototype properties on the model', ->
        instance.b.should.equal 'bb'

      it 'should set new static properties on the model', ->
        Model.c.should.equal 'c'

      it 'should override static properties on the model', ->
        Model.b.should.equal 'bb'


    describe 'with prototype and static objects', ->

      before ->
        proto = d: 'd', b: 'bbb'
        stat  = e: 'e', c: 'cc'

        Model.extend proto, stat
        instance = new Model

      it 'should set new prototype properties on the model', ->
        instance.d.should.equal 'd'

      it 'should override prototype properties on the model', ->
        instance.b.should.equal 'bbb'

      it 'should set new static properties on the model', ->
        Model.e.should.equal 'e'

      it 'should override static properties on the model', ->
        Model.c.should.equal 'cc'


    describe 'with post extend hook', ->

      before ->
        class PostExtension
          @__postExtend: ->
            @schema.foo = { type: 'string', default: 'bar' }

        Model.extend PostExtension
        instance = new Model

      it 'should invoke the hook to mutate the model', ->
        instance.foo.should.equal 'bar'



  describe 'instance', ->

    it 'should be an instance of its constructor', ->
      expect(instance).to.be.an.instanceof Model

    it 'should be an instance of Modinha', ->
      expect(instance).to.be.an.instanceof Modinha




  describe 'serialize', ->

    it 'should generate JSON', ->
      Model.serialize({ foo: 'bar' }).should.equal(JSON.stringify({ foo: 'bar' }))

  describe 'deserialize', ->

    it 'should parse JSON', ->
      Model.deserialize('{ "foo": "bar" }').foo.should.equal 'bar'

    it 'should catch parsing errors', ->
      expect(-> Model.deserialize('{badjson}')).to.throw Error




  describe 'instance initialization (merge)', ->

    describe 'without data', ->

      it 'should set defaults defined by value', ->
        instance = new Model
        instance.r.should.be.true
        instance.s.u.should.be.true

      it 'should set defaults defined by function', ->
        instance = new Model
        instance.v.should.equal 'generated'


    describe 'with data', ->

      it 'should set properties defined in the schema', ->
        instance = new Model { q: 'q', s: { t: 't' } }
        instance.q.should.equal 'q'
        instance.s.t.should.equal 't'

      it 'should ignore properties not defined in the schema', ->
        instance = new Model hacker: 'p0wn3d'
        expect(instance.hacker).to.be.undefined

      it 'should set defaults defined by value', ->
        instance = new Model q : 'q'
        instance.r.should.be.true
        instance.s.u.should.be.true

      it 'should set defaults defined by function', ->
        instance = new Model q: 'q'
        instance.v.should.equal 'generated'

      it 'should invoke setter', ->
        instance = new Model indirect: 'value'
        instance.indirect.should.equal 'indirectvalue'

      it 'should invoke after', ->
        instance = new Model indirect: 'value'
        instance.after.should.equal 'afterindirectvalue'

      it 'should override default properties with provided data', ->
        instance = new Model r: false
        instance.r.should.be.false

      it 'should skip private values by default', ->
        instance = new Model w: 'secret'
        expect(instance.w).to.be.undefined

      it 'should set immutable values', ->
        instance = new Model immutable: 'cannot change'
        instance.immutable = 'changed'
        instance.immutable.should.equal 'cannot change'


    describe 'with private values option', ->

      it 'should set private values', ->
        instance = new Model { w: 'secret' }, { private: true }
        instance.w.should.equal 'secret'


    describe 'with mapping option', ->

      before ->
        data =
          n: 'q'
          m: { s: { t: 't' } }
          hacker: 'p0wn3d'
    
        mapping =
          'q'   : 'n'
          's.t' : 'm.s.t'

        instance = new Model data, mapping: mapping

      it 'should initialize an object from a literal mapping', ->
        instance.q.should.equal 'q'
        instance.s.t.should.equal 't'

      it 'should initialize an object from a named mapping', ->
        instance = new Model data, mapping: 'named'
        instance.q.should.equal 'q'
        instance.s.t.should.equal 't'

      it 'should ignore properties not defined in the map', ->
        expect(instance.hacker).to.be.undefined


    describe 'with select option', ->

      before ->
        instance = new Model { q: 'q', r: true, v: 'generated' }, select: ['r','v']

      it 'should initialize a subset of an object\'s properties', ->
        instance.r.should.be.true
        instance.v.should.equal 'generated'

      it 'should ignore properties not defined in the selection', ->
        expect(instance.q).to.be.undefined

      it 'should generate default values if selected'


    describe 'without default values', ->

      before ->
        instance = new Model {}, { defaults: false }

      it 'should not initialize default values', ->
        expect(instance.r).to.be.undefined
        expect(instance.s.u).to.be.undefined
        expect(instance.v).to.be.undefined


  describe 'instance projection', ->

    before ->
      instance = new Model q: 'q', s: { t: 't' }
  
      mapping =
        'q'   : 'n'
        's.t' : 'm.s.t'

      data = instance.project(mapping)

    it 'should initialize a new object from a literal mapping', ->
      data.n.should.equal 'q'
      data.m.s.t.should.equal 't'

    it 'should initialize a new object from a named mapping', ->
      data = instance.project 'named'
      data.n.should.equal 'q'
      data.m.s.t.should.equal 't'




  describe 'static initialization', ->
    
    describe 'without data', ->

      it 'should provide an instance of the model', ->
        instance = Model.initialize()
        expect(instance).to.be.instanceof Model


    describe 'with nullify option and no data', ->

      it 'should provide null if data is undefined', ->
        instance = Model.initialize undefined, nullify: true
        expect(instance).to.be.null

      it 'should provide null if data is null', ->
        instance = Model.initialize null, nullify: true
        expect(instance).to.be.null


    describe 'with object data', ->

      it 'should provide an instance of the model', ->
        instance = Model.initialize { q: 'qwerty' }
        expect(instance).to.be.instanceof Model
        instance.q.should.equal 'qwerty'


    describe 'with array data', ->

      it 'should provide an array of model instances', ->
        Model.initialize([
          {q:'first'}
          {q:'second'}
          {q:'third'}
        ]).forEach (instance) ->
          expect(instance).to.be.instanceof Model


    describe 'with JSON object data', ->

      it 'should provide an instance of the model', ->
        instance = Model.initialize '{ "q": "qwerty" }'
        expect(instance).to.be.instanceof Model
        instance.q.should.equal 'qwerty'
    

    describe 'with JSON array data', ->

      it 'should provide an array of model instances', ->
        Model.initialize('''[
          { "q": "first" },
          { "q": "second" },
          { "q": "third" }
        ]''').forEach (instance) ->
          expect(instance).to.be.instanceof Model


    describe 'with an array of JSON object data', ->

      it 'should provide an array of model instances', ->
        Model.initialize([
          '{ "q": "first" }',
          '{ "q": "second" }',
          '{ "q": "third" }'
        ]).forEach (instance) ->
          expect(instance).to.be.instanceof Model


    describe 'with an array and "first" option', ->

      it 'should return the first instance', ->
        instance = Model.initialize([{}, {}, {}], { first: true })
        Array.isArray(instance).should.be.false
        expect(instance).to.be.instanceof Model


    describe 'with functional options', ->
      it 'should map over instances'
      it 'should return a filtered set of instances'




  describe 'default', ->

    describe 'random', ->

      it 'should generate a random string of a given length', ->
        instance = new Model
        instance.random.length.should.be.at.least 12

    describe 'uuid', ->

      it 'should generate a uuid', ->
        instance = new Model
        instance.uuid.length.should.equal 36
        instance.validate().valid.should.be.true

    describe 'timestamp', ->

      it 'should generate a timestamp', ->
        instance = new Model
        instance.timestamp.should.equal Date.now(instance.timestamp)




  describe 'instance merge', ->

    describe 'with no options', ->

      before ->
        instance = new Model { q: 'q', s: { t: 't' } }
        instance.initialize { q: 'qq', s: { t: 'tt' }, hacker: 'p0wn3d' }

      it 'should set properties defined in the schema', ->
        instance.q.should.equal 'qq'
        instance.s.t.should.equal 'tt'

      it 'should ignore properties not defined in the schema', ->
        expect(instance.hacker).to.be.undefined


    describe 'with map option', ->

      beforeEach ->

        instance = new Model { q: 'q', s: { t: 't' } }

        data =
          n: 'qq'
          m: { s: { t: 'tt' } }
          hacker: 'p0wn3d'
    
        mapping =
          'q'   : 'n'
          's.t' : 'm.s.t'

      it 'should update an object from a literal mapping', ->
        instance.initialize data, mapping: mapping
        instance.q.should.equal 'qq'
        instance.s.t.should.equal 'tt'

      it 'should update an object from a named mapping', ->
        instance.initialize data, mapping: 'named'
        instance.q.should.equal 'qq'
        instance.s.t.should.equal 'tt'

      it 'should ignore properties not defined in the map', ->
        instance.initialize data, mapping: mapping
        expect(instance.hacker).to.be.undefined


    describe 'with project option', ->

      beforeEach ->

        data =
          q: 'q'
          s:
            t: 't'
    
        projection =
          'q'   : 'n'
          's.t' : 'm.s.t'


      it 'should intialize an object that differs from the schema', ->
        instance = Model.initialize data
        object = Modinha.project instance, {}, projection
        object.n.should.equal 'q'
        object.m.s.t.should.equal 't'




  describe 'instance validation', ->

    describe 'with valid data', ->

      it 'should be valid', ->
        instance = new Model { short: 'short' }
        instance.validate().valid.should.be.true

    describe 'with invalid data', ->

      before ->
        instance = new Model { short: 'tooLong' }
        validation = instance.validate()

      it 'should not be valid', ->
        validation.valid.should.be.false

      it 'should return a ValidationError', ->
        expect(validation).to.be.instanceof Modinha.ValidationError




  describe 'static validation', ->

    describe 'with valid data', ->

      it 'should be valid', ->
        Model.validate({ short: 'short' }).valid.should.be.true

    describe 'with invalid data', ->

      before ->
        validation = Model.validate({ short: 'tooLong' })

      it 'should not be valid', ->
        validation.valid.should.be.false

      it 'should return a ValidationError', ->
        expect(validation).to.be.instanceof Modinha.ValidationError




  describe 'state machine', ->

    it 'should add a "state" property to the schema?'
    it 'should enumerate states'
    it 'should define transitions'
    it 'should guard transitions'
    it 'should execute "enter" callbacks'
    it 'should execute "exit" callbacks'




  describe 'related object constraints?', ->




