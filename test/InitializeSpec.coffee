chai      = require 'chai'
sinon     = require 'sinon'
sinonChai = require 'sinon-chai'
expect    = chai.expect

chai.use sinonChai
chai.should()


{
  traverse,
  assign,
  select,
  map,
  getDeepProperty,
  setDeepProperty
} = require '../lib/initialize'




describe 'traverse', ->


  { schema, source, target, operation } = {}


  beforeEach ->
    schema = {
      a: { type: 'string' }
      b: { type: 'string' }
      c: { properties: { d: { type: 'string' } } }
    }
    source = {
      a: 'a',
      b: 'b',
      c: { d: 'd' }
    }
    target = {}

  it 'should traverse schema and source objects', ->
    operation = sinon.spy()
    traverse(schema, source, target, operation)
    operation.should.have.been.calledWith 'a', schema.a, source, target
    operation.should.have.been.calledWith 'b', schema.b, source, target
    operation.should.have.been.calledWith 'd', schema.c.properties.d, source.c, {}

  it 'should operate on a target object', ->
    traverse schema, source, target, (key, descriptor, source, target) ->
      target[key] = source[key]
    target.a.should.equal 'a'
    target.b.should.equal 'b'
    target.c.d.should.equal 'd'




describe 'assign', ->


  { key, descriptors, source, target, options } = {}


  beforeEach ->
    descriptors =
      simple:    { type: 'string' }
      empty:     { type: 'string' }
      private:   { type: 'string', private: true }
      deleted:   { type: 'string' }
      exists:    { type: 'string' }
      immutable: { type: 'string', immutable: true }
      setter:    { type: 'string', set: (data) -> @setter = "#{data.setter}ter" }
      default:   { type: 'string', default: 'default' }
      defaultFn: { type: 'string', default: -> 'default' }
      after:     { type: 'string', after: (data) -> @setAfter = "#{data.after} assignment"}
    source =
      simple: 'simple'
      empty: ''
      deleted: 'boogers'
      private: 'private'
      immutable: 'immutable'
      setter: 'set'
      after: 'after'
    target =
      deleted: 'not deleted'
      exists:  'exists'
    options = { $unset: [ 'deleted' ] }

  it 'should set a property on target from source', ->
    assign('simple', descriptors.simple, source, target, options)
    target.simple.should.equal 'simple'

  it 'should set an empty string on a target from source', ->
    assign('empty', descriptors.empty, source, target, options)
    target.empty.should.equal ''

  it 'should remove target properties marked for deletion with $unset', ->
    assign('deleted', descriptors.deleted, source, target, options)
    target.should.not.have.property('deleted')

  it 'should keep target properties not marked for deletion with $unset', ->
    assign('exists', descriptors.exists, source, target, options)
    target.should.have.property('exists')
    target.exists.should.equal 'exists'

  it 'should skip private properties by default', ->
    assign('private', descriptors.private, source, target, options)
    expect(target.private).to.be.undefined

  it 'should optionally assign private properties', ->
    assign('private', descriptors.private, source, target, { private: true })
    target.private.should.equal 'private'

  it 'should define immutable properties', ->
    assign('immutable', descriptors.immutable, source, target, options)
    target.immutable = 'changed'
    target.immutable.should.equal 'immutable'

  it 'should set a property from a setter method', ->
    assign('setter', descriptors.setter, source, target, options)
    target.setter.should.equal 'setter'

  it 'should set a property from a default value', ->
    assign('default', descriptors.default, source, target, options)
    target.default.should.equal 'default'

  it 'should set a property from a default function', ->
    assign('defaultFn', descriptors.defaultFn, source, target, options)
    target.defaultFn.should.equal 'default'

  it 'should optionally skip default assignment', ->
    assign('default', descriptors.default, source, target, { defaults: false })
    expect(target.default).to.be.undefined

  it 'should invoke an "after" method', ->
    assign('after', descriptors.after, source, target, options)
    target.setAfter.should.equal 'after assignment'

  describe 'trim property', ->

    describe 'with strings', ->

      dsc =
        trimBothSides:
          type: 'string'
          trim: true
        trimLeading:
          type: 'string'
          trim:
            leading: true
        trimTrailing:
          type: 'string'
          trim:
            trailing: true
        noTrim:
          type: 'string'

      src =
        trimBothSides: ' test '
        trimLeading: ' test '
        trimTrailing: ' test '
        noTrim: ' test '

      tgt = {}

      it 'should trim both leading and trailing whitespace', ->
        assign('trimBothSides', dsc.trimBothSides, src, tgt, {})
        expect(tgt.trimBothSides).to.equal 'test'

      it 'should trim leading whitespace alone', ->
        assign('trimLeading', dsc.trimLeading, src, tgt, {})
        expect(tgt.trimLeading).to.equal 'test '

      it 'should trim trailing whitespace alone', ->
        assign('trimTrailing', dsc.trimTrailing, src, tgt, {})
        expect(tgt.trimTrailing).to.equal ' test'

      it 'should not trim whitespace if not requested', ->
        assign('noTrim', dsc.noTrim, src, tgt, {})
        expect(tgt.noTrim).to.equal ' test '


    describe 'arrays', ->

      dsc =
        trimBothSides:
          type: 'array'
          trim: true
        trimLeading:
          type: 'array'
          trim:
            leading: true
        trimTrailing:
          type: 'array'
          trim:
            trailing: true
        noTrim:
          type: 'array'

      src =
        trimBothSides: [ ' test0 ', ' test1 ' ]
        trimLeading: [ ' test0 ', ' test1 ' ]
        trimTrailing: [ ' test0 ', ' test1 ' ]
        noTrim: [ ' test0 ', ' test1 ' ]

      tgt = {}

      it 'should trim both leading and trailing whitespace', ->
        assign('trimBothSides', dsc.trimBothSides, src, tgt, {})
        expect(tgt.trimBothSides).to.eql [ 'test0', 'test1' ]

      it 'should trim leading whitespace alone', ->
        assign('trimLeading', dsc.trimLeading, src, tgt, {})
        expect(tgt.trimLeading).to.eql [ 'test0 ', 'test1 ' ]

      it 'should trim trailing whitespace alone', ->
        assign('trimTrailing', dsc.trimTrailing, src, tgt, {})
        expect(tgt.trimTrailing).to.eql [ ' test0', ' test1' ]

      it 'should not trim whitespace if not requested', ->
        assign('noTrim', dsc.noTrim, src, tgt, {})
        expect(tgt.noTrim).to.eql [ ' test0 ', ' test1 ' ]




describe 'map', ->

  {mapping,source,target} = {}

  beforeEach ->
    source =
      a: 'a'
      b: { c: { d: 'e' } }
      f: 'f'

    mapping =
      'q'   : 'a'
      'r.s' : 'b.c.d'
      'n'   : (src) -> Object.keys(src).length

    target = {}

  it 'should assign properties to an object from a mapping', ->
    map(mapping, source, target)
    target.q.should.equal 'a'
    target.r.s.should.equal 'e'
    target.n.should.equal 3

  it 'should ignore properties of the source not defined in the mapping', ->
    map(mapping, source, target)
    expect(target.f).to.be.undefined






describe 'select', ->

  {properties,source,target} = {}

  beforeEach ->
    properties = [ 'a', 'b.c.d' ]

    source =
      a: 'a'
      b: { c: { d: 'e' } }
      f: 'f'

    target = {}

  it 'should assign a subset of a source object\'s properties to a target', ->
    select(properties, source, target)
    target.a.should.equal 'a'
    target.b.c.d.should.equal 'e'

  it 'should ignore properties not defined in the properties', ->
    select(properties, source, target)
    expect(target.f).to.be.undefined



describe 'getDeepProperty', ->

  it 'should read a value from nested source objects via chain', ->
    getDeepProperty({ a: { b: { c: 'c' } } }, ['a', 'b', 'c']).should.equal 'c'

  it 'should read an empty string', ->
    getDeepProperty({ a: { b: { c: '' } } }, ['a', 'b', 'c']).should.equal ''


describe 'setDeepProperty', ->

  it 'should read a value from nested source objects via chain', ->
    target = {}
    setDeepProperty(target, ['a', 'c'], 'c')
    target.a.c.should.equal 'c'

  it 'should ignore undefined values', ->
    target = { a: 'a', b: 'b' }
    setDeepProperty(target, ['a'], undefined)
    target.a.should.equal 'a'

  it 'should set empty strings', ->
    target = { a: 'a' }
    setDeepProperty(target, ['a'], '')
    target.a.should.equal ''



