# Statistical-Learning-Models
JavaScript implementations of various models of statistical learning

## Models

### PARSER

#### parser.js

This is the standard implementation of PARSER.

#### parser-proportional-forgetting.js

This implementation of PARSER changes the way that forgetting happens. Rather
than forgetting each item in the lexicon at a constant rate for each *step* of
the model, the forgetting amount is tied to the length of the percept on that
step.

### MDLChunker

#### mdlchunker.js

This is an implementation of MDLChunker for parsing streams where the boundaries
between utterances is unknown. It also features a fixed memory capacity.

## Experiments

This folder contains various tests of these models.
