@prefix owl: <http://www.w3.org/2002/07/owl#> .
grammar NQuads;

// Minimal abstracted N-Quads grammar adapted to current simplified ANTLR v4 meta-grammar subset.
// NOTE: Term tokens (IRI, BNODE, LITERAL) are placeholders; a real implementation would
// define full lexer rules for IRIs, blank nodes, literals, language tags, datatypes, etc.
// This file is structured so the existing reduced meta-grammar (IDs only) can parse it
// and the RGSL directives attached to labeled alternatives can be harvested.

nquadsDoc : line* EOF ;

line
 : subject predicate object DOT          #TripleLine
 // @bind S <- $.subject
 // @bind P <- $.predicate
 // @bind O <- $.object
 // @emit S P O
 | subject predicate object graph DOT    #QuadLine
 // @bind S <- $.subject
 // @bind P <- $.predicate
 // @bind O <- $.object
 // @bind G <- $.graph
 // @emit S P O @ G
 ;

subject : IRI #SubjectIri
        | BNODE #SubjectBnode
        ;

predicate : IRI #PredicateIri ;

object : IRI #ObjectIri
       | BNODE #ObjectBnode
       | LITERAL #ObjectLiteral
       ;

graph : IRI #GraphIri
      | BNODE #GraphBnode
      ;

// Placeholder tokens (stand-ins for full N-Quads lexical forms)
IRI      : 'IRI';
BNODE    : 'BNODE';
LITERAL  : 'LITERAL';
DOT      : 'DOT';
WS       : [ \t\r\n]+ -> skip;
