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
      private:   { type: 'string', private: true }
      immutable: { type: 'string', immutable: true }
      setter:    { type: 'string', set: (data) -> @setter = "#{data.setter}ter" }
      default:   { type: 'string', default: 'default' }
      defaultFn: { type: 'string', default: -> 'default' }
      after:     { type: 'string', after: (data) -> @setAfter = "#{data.after} assignment"}
    source =
      simple: 'simple'
      private: 'private'
      immutable: 'immutable'
      setter: 'set'
      after: 'after'
    target = {}
    options = {}

  it 'should set a property on target from source', ->
    assign('simple', descriptors.simple, source, target, options)
    target.simple.should.equal 'simple'

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

    target = {}

  it 'should assign properties to an object from a mapping', ->
    map(mapping, source, target)
    target.q.should.equal 'a'
    target.r.s.should.equal 'e'
    
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


describe 'setDeepProperty', ->

  it 'should read a value from nested source objects via chain', ->
    target = {}
    setDeepProperty(target, ['a', 'c'], 'c')
    target.a.c.should.equal 'c'





