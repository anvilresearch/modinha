chai      = require 'chai'
sinon     = require 'sinon'
sinonChai = require 'sinon-chai'
expect    = chai.expect

chai.use sinonChai
chai.should()




initialize      = require '../lib/initialize'
ModelCollection = require '../lib/ModelCollection'




describe 'ModelCollection', ->



  describe 'Instance', ->

    it 'should inherit Array', ->

      expect(new ModelCollection()).to.be.instanceof Array


  describe 'Constructor', ->

    it 'should retain a reference to the original model constructor', ->

      fakeConstructor = {}

      collection = new ModelCollection(fakeConstructor)

      expect(collection.__model).to.equal fakeConstructor


    it 'should call initialize for each object if data is provided', ->

      data = []
      fakeConstructor =
        initialize: (item) ->
          data.push item

      new ModelCollection fakeConstructor, [1, 2, 3]

      data.should.eql [1, 2, 3]


    it 'should pass options to initialize', ->

      options = 0
      fakeConstructor =
        initialize: (item, opts) ->
          options = opts

      new ModelCollection fakeConstructor, ['data'], 1

      options.should.equal 1


  describe 'project', ->

    mappingCallCount = 0

    before ->

      sinon.stub initialize, 'project'

      mapping =
        a: 'aardvark'

      fakeConstructor = { mappings: {}, initialize: -> }

      Object.defineProperty fakeConstructor.mappings, 'map',
        get: ->
          mappingCallCount++
          return mapping


      collection = new ModelCollection fakeConstructor, [1, 2, 3]

      collection.project 'map'

    after ->

      initialize.project.restore()


    it 'should call project for all instances in the collection', ->

      initialize.project.should.have.been.calledThrice

    it 'should reference the model mapping once', ->

      mappingCallCount.should.equal 1
