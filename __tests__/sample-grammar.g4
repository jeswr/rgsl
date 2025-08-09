grammar SampleGrammar;

triples: subject predicate object '.' #TripleLine
       ;
subject: IRI #SubjectIri ;
predicate: IRI #PredicateIri ;
object: IRI #ObjectIri ;

IRI: '<' ~[>]+ '>' ;
WS: [ \t\r\n]+ -> skip;
