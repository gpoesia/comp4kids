/*
 * Syntactic analyzer for Robolang.
 */

var Lexer = require("./lexer");

/// Language constructs.
var ASTNodeTypes = {
  ACTION: {name: "Action"},
  BLOCK: {name: "Block"},
  LOOP: {name: "Loop"},
  PROGRAM: {name: "Program"},
  CONDITIONAL: {name: "Conditional"},
  CONDITIONAL_LOOP: {name: "Conditional Loop"},
};

/// Represents one node of the Abstract Syntax Tree.
function ASTNode(type) {
  this.type = type;
  this.children = [];
  this.attributes = {};
}

ASTNode.prototype = {
  type: null,
  children: null,
  attributes: null,

  toString: function() {
    var repr = "";
    if (this.type === ASTNodeTypes.ACTION) {
      repr += "ACTION(" + this.attributes.action + ")";
    } else if (this.type === ASTNodeTypes.BLOCK) {
      repr += "BLOCK";
    } else if (this.type === ASTNodeTypes.LOOP) {
      repr += "LOOP(" + this.attributes.tripCount + ")";
    } else if (this.type === ASTNodeTypes.PROGRAM) {
      repr += "PROGRAM";
    } else {
      repr += "UNKNOWN";
    }

    if (this.children.length > 0) {
      repr += "{ ";
      for (var i = 0; i < this.children.length; ++i) {
        repr += this.children[i].toString() + " ";
      }
      repr += "}";
    }

    return repr;
  },
};

/// Base class for a parser of one node type.
function ASTNodeParser() { }
ASTNodeParser.prototype = {
  /// Returns true if this parser recognizes the upcoming construct to be one
  /// of the type it knows how to parse.
  lookahead: function(parserState) {
    throw "Not implemented.";
  },
  /// Parses the next construct of the program and returns an AST node that
  /// represents it.
  parse: function(parserState) {
    throw "Not implemented.";
  },
};

/// List of all specific node parser types.
ASTNodeParser.nodeParsers = [];

/// Discover the type of AST node adequate to the following construct and parses
/// it using the appropriate parser.
function ASTGeneralNodeParser() { }
ASTGeneralNodeParser.prototype = Object.create(ASTNodeParser.prototype);
Object.assign(ASTGeneralNodeParser.prototype, {
  /// Returns true if any of the parsers recognizes the upcoming construct.
  lookahead: function(parserState) {
    for (var i = 0; i < ASTNodeParser.nodeParsers.length; ++i) {
      var parser = new ASTNodeParser.nodeParsers[i]();
      if (parser.lookahead(parserState)) {
        return true;
      }
    }
    return false;
  },
  /// Finds the appropriate parser and uses it.
  parse: function(parserState) {
    for (var i = 0; i < ASTNodeParser.nodeParsers.length; ++i) {
      var parser = new ASTNodeParser.nodeParsers[i]();
      if (parser.lookahead(parserState)) {
        return parser.parse(parserState);
      }
    }
    throw "No suitable parser found.";
  },
});

function ASTProgramNodeParser() { }
ASTProgramNodeParser.prototype = Object.create(ASTNodeParser.prototype);
Object.assign(ASTProgramNodeParser.prototype, {
  lookahead: function(parserState) {
    return parserState.lookahead().type == Lexer.TokenTypes.BEGIN_BLOCK;
  },

  parse: function(parserState) {
    var node = new ASTNode(ASTNodeTypes.PROGRAM);
    var parser = new ASTGeneralNodeParser();

    while (!parserState.programEnded() && parser.lookahead(parserState)) {
      node.children.push(parser.parse(parserState));
    }

    return node;
  },
});

function ASTBlockNodeParser() {}
ASTBlockNodeParser.prototype = Object.create(ASTNodeParser.prototype);
Object.assign(ASTBlockNodeParser.prototype, {
  lookahead: function(parserState) {
    return parserState.lookahead().type == Lexer.TokenTypes.BEGIN_BLOCK;
  },

  parse: function(parserState) {
    var node = new ASTNode(ASTNodeTypes.BLOCK);
    parserState.consumeToken(Lexer.TokenTypes.BEGIN_BLOCK);
    node.children.push(new ASTProgramNodeParser().parse(parserState));
    parserState.consumeToken(Lexer.TokenTypes.END_BLOCK);
    return node;
  },
});

function ASTBlockNodeParser() {}
ASTBlockNodeParser.prototype = Object.create(ASTNodeParser.prototype);
Object.assign(ASTBlockNodeParser.prototype, {
  lookahead: function(parserState) {
    return parserState.lookahead().type == Lexer.TokenTypes.BEGIN_BLOCK;
  },

  parse: function(parserState) {
    var node = new ASTNode(ASTNodeTypes.BLOCK);
    parserState.consumeToken(Lexer.TokenTypes.BEGIN_BLOCK);
    node.children.push(new ASTProgramNodeParser().parse(parserState));
    parserState.consumeToken(Lexer.TokenTypes.END_BLOCK);
    return node;
  },
});

ASTNodeParser.nodeParsers.push(ASTBlockNodeParser);

function ASTLoopNodeParser() { }
ASTLoopNodeParser.prototype = Object.create(ASTNodeParser.prototype);
Object.assign(ASTLoopNodeParser.prototype, {
  lookahead: function(parserState) {
    return parserState.lookahead().type === Lexer.TokenTypes.INTEGER;
  },

  parse: function(parserState) {
    var node = new ASTNode(ASTNodeTypes.LOOP);
    node.attributes.tripCount =
        parserState.consumeToken(Lexer.TokenTypes.INTEGER).value;
    node.children.push(new ASTBlockNodeParser().parse(parserState));
    return node;
  },
});

ASTNodeParser.nodeParsers.push(ASTLoopNodeParser);

function ASTConditionalNodeParser() { }
ASTConditionalNodeParser.prototype = Object.create(ASTNodeParser.prototype);
Object.assign(ASTConditionalNodeParser.prototype, {
  lookahead: function(parserState) {
    var next = parserState.lookahead(2);
    return (next.length == 2 &&
            next[0].type === Lexer.TokenTypes.IDENTIFIER &&
            next[1].type === Lexer.TokenTypes.CONDITION_SIGN);
  },

  parse: function(parserState) {
    var node = new ASTNode(ASTNodeTypes.CONDITIONAL);
    node.attributes.variable =
        parserState.consumeToken(Lexer.TokenTypes.IDENTIFIER).value;
    parserState.consumeToken(Lexer.TokenTypes.CONDITION_SIGN);
    node.children.push(new ASTBlockNodeParser().parse(parserState));
    return node;
  },
});

ASTNodeParser.nodeParsers.push(ASTConditionalNodeParser);

function ASTActionNodeParser() { }
ASTActionNodeParser.prototype = Object.create(ASTNodeParser.prototype);
Object.assign(ASTActionNodeParser.prototype, {
  lookahead: function(parserState) {
    return parserState.lookahead().type === Lexer.TokenTypes.ACTION_IDENTIFIER;
  },

  parse: function(parserState) {
    var node = new ASTNode(ASTNodeTypes.ACTION);
    node.attributes.action =
        parserState.consumeToken(Lexer.TokenTypes.ACTION_IDENTIFIER).value;
    return node;
  },
});

ASTNodeParser.nodeParsers.push(ASTActionNodeParser);

module.exports = {
  ASTProgramNodeParser: ASTProgramNodeParser,
  ASTNodeTypes: ASTNodeTypes,
};

function ASTConditionalLoopNodeParser() { }
ASTConditionalLoopNodeParser.prototype = Object.create(ASTNodeParser.prototype);
Object.assign(ASTConditionalLoopNodeParser.prototype, {
  lookahead: function(parserState) {
    var next = parserState.lookahead(4);
    return (next.length == 4 &&
            next[0].type === Lexer.TokenTypes.CONDITIONAL_LOOP_KEYWORD &&
            next[1].type === Lexer.TokenTypes.BEGIN_EXPRESSION &&
            next[2].type === Lexer.TokenTypes.IDENTIFIER &&
            next[3].type === Lexer.TokenTypes.END_EXPRESSION);
  },

  parse: function(parserState) {
    var node = new ASTNode(ASTNodeTypes.CONDITIONAL_LOOP);
    parserState.consumeToken(Lexer.TokenTypes.CONDITIONAL_LOOP_KEYWORD);
    parserState.consumeToken(Lexer.TokenTypes.BEGIN_EXPRESSION);
    node.attributes.variable =
        parserState.consumeToken(Lexer.TokenTypes.IDENTIFIER).value;
    parserState.consumeToken(Lexer.TokenTypes.END_EXPRESSION);
    node.children.push(new ASTBlockNodeParser().parse(parserState));
    return node;
  },
});

ASTNodeParser.nodeParsers.push(ASTConditionalLoopNodeParser);

