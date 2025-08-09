parser grammar ANTLRv4Parser;
options { tokenVocab=ANTLRv4Lexer; }

grammarSpec: (GRAMMAR ID SEMI) rules EOF;

rules: ruleSpec*;
ruleSpec: parserRuleSpec; // only parser rules for this subset

parserRuleSpec: ID COLON ruleAltList SEMI ;

ruleAltList: labeledAlt (OR labeledAlt)* ;

labeledAlt: alternative (POUND identifier)? ;

alternative: element+ ;

identifier: ID ;

element: ID | LPAREN alternative RPAREN ;
