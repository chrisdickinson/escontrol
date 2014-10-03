'use strict'

module.exports = install

function install(proto) {
  proto.visitSwitchStatement = visitSwitchStatement
}

function visitSwitchStatement(node) {
  this._pushBlock(node)
  this._pushFrame(visitedDiscriminant, node)
  this._visit(node.discriminant)
}

function visitedDiscriminant(node) {
  this._connect(this.last(), this._popValue('switch-store'))
  this._pushFrame(iterateCases, {
    casesPendingBodies: [],
    defaultBodyIdx: null,
    enterBodyIdx: null,
    cases: node.cases,
    lastTest: null,
    lastBody: null,
    branchIDs: [],
    bodyIndex: 0,
    index: 0
  })
}

function iterateCases(context) {
  // we either came from:
  // 1. the discriminant
  // 2. a cases' test -- false-connect from previous test
  // 3. a case body -- false-connect the previous test & normal-connect the body?
  if (context.cases.length === context.index) {
    // clean up:
    // 1. connect the last body to the exit
    // 2. false-connect the last test case to either the exit or the
    //    default node's exit
    // 3. true-connect all pending cases to exit
    var block = this._popBlock()

    if (!context.cases.length) {
      this._connect(this.last(), block.exit)
    }

    while (context.branchIDs.length) {
      this._branchEnd(context.branchIDs.shift())
    }

    if (context.lastBody) {
      this._connect(context.lastBody, block.exit)
    }

    if (context.lastTest) {
      this._setIfFalse()
      if (context.defaultBodyIdx !== null) {
        this._connect(context.lastTest, this._edges[context.defaultBodyIdx].to)
      } else {
        this._connect(context.lastTest, block.exit)
      }
    }

    for(var i = 0; i < context.casesPendingBodies.length; ++i) {
      this._setIfTrue()
      this._connect(context.casesPendingBodies[i], block.exit)
    }

    this._setLastNode(block.exit)

    return
  }

  context.bodyIndex = 0
  context.current = context.cases[context.index++]

  if (context.current.test === null) {
    context.defaultBodyIdx = this._edges.length
    context.branchIDs.push(this._branchOpen())
    this._pushFrame(iterateCaseBody, context)

    return
  }

  this._pushFrame(visitedTest, context)

  if (context.lastTest) {
    this._setIfFalse()
    this._setLastNode(context.lastTest)
  }

  this._visit(context.current.test)
}

function visitedTest(context) {
  context.lastTest = this._popValue('compare-switch')
  this._connect(this.last(), context.lastTest)

  if (!context.current.consequent.length) {
    context.casesPendingBodies.push(context.lastTest)
    this._pushFrame(iterateCases, context)

    return
  }

  this._setIfTrue()
  context.enterBodyIdx = this._edges.length
  context.branchIDs.push(this._branchOpen())
  this._pushFrame(iterateCaseBody, context)
}

function iterateCaseBody(context) {
  var last = this.last()

  if (context.bodyIndex > 0 && context.enterBodyIdx !== null) {
    for (var i = 0; i < context.casesPendingBodies.length; ++i) {
      this._setIfTrue()
      this._connect(
        context.casesPendingBodies[i], 
        this._edges[context.enterBodyIdx].to
      )
    }

    if (context.lastBody) {
      this._connect(
          context.lastBody,
          this._edges[context.enterBodyIdx].to
      )
    }

    context.casesPendingBodies.length = 0
    context.enterBodyIdx = null
  }

  if (context.current.consequent.length === context.bodyIndex) {
    context.lastBody = last
    this._pushFrame(iterateCases, context)

    return
  }

  this._pushFrame(iterateCaseBody, context)
  this._visit(context.current.consequent[context.bodyIndex++])
}
