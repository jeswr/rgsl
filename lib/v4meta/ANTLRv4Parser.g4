parser grammar ANTLRv4Parser;
options { tokenVocab=ANTLRv4Lexer; }

grammarSpec: (GRAMMAR ID SEMI) rules EOF;

rules: ruleSpec*;
ruleSpec: parserRuleSpec; // only parser rules for this subset

parserRuleSpec: ID COLON ruleAltList SEMI ;

ruleAltList: labeledAlt (OR labeledAlt)* ;

labeledAlt: alternative (POUND identifier)? ;

alternative: element* ; // allow empty (for epsilon alts)

identifier: ID ;

// Elements can have EBNF suffixes.
 element: atom ebnfSuffix? ;
 atom: ID | LPAREN alternative (OR alternative)* RPAREN ;
 ebnfSuffix: QUESTION QUESTION? | STAR QUESTION? | PLUS QUESTION? ;
