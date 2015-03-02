/* A JavaScript implementation of the PARSER model */

PARSER = (function(){

  var module = {};

  var lexicon = [];

  var input_vector = [];

  var last_percept_length = 0;

  var current_step = 0;

  var parameters = {
    maximum_percept_size: 3,
    initial_lexicon_weight: 1.0,
    shaping_weight_threshold: 1.0,
    reinforcement_rate: 0.5,
    forgetting_rate: 0.05,
    interference_rate: 0.005,
    logging: true
  };

  module.setup = function(input, params) {

    // parse input into atomic items
    input_vector = parse_input_items(input);

    // merge parameters into default params
    for(var param in params){
      parameters[param] = params[param];
    }

  }

  module.step = function() {

    if(parameters.logging){
      console.log('Step: '+(++current_step)+'----------------')
    }
    // pick percept length
    var percept_length = Math.floor(Math.random() * parameters.maximum_percept_size) + 1;
    last_percept_length = percept_length;

    if(parameters.logging){
      console.log('Percept length: '+percept_length);
    }
    // get shaped input
    var percept = shape_input_stream(percept_length);

    if(parameters.logging){
      console.log('Percept: '+JSON.stringify(percept));
    }
    // reinforce weights for all items in the percept

    // whole percept
    var whole_percept = flatten(percept);
    reinforce_lexicon_item(whole_percept);

    // components if there are any
    if(percept.length > 1){
      for(var c in percept){
        reinforce_lexicon_item(percept[c]);
      }
    }

    // do forgetting process
    forgetting(whole_percept);

    // do interference // TODO: fix this! no interference for currently seen item.
    interference(percept);
  }

  module.run = function() {

    while(input_vector.length > 0){
      module.step();
    }

  }

  module.getLexicon = function() {
    var sortedLexicon = lexicon.sort(function(a,b){ return b.weight - a.weight; });
    return JSON.parse(JSON.stringify(sortedLexicon));
  }

  module.getInput = function() {
    return JSON.stringify(input_vector);
  }

  module.getLastPerceptLength = function(){
    return last_percept_length;
  }

  function parse_input_items(input, split_char){
    //var unique_items = [];

    var split_input;
    if(typeof split_char == 'string'){
      split_input = input.split(split_char);
    } else {
      split_input = input.split("");
    }

    /*for(var i=0; i<split_input.length; i++){
      if(unique_items.indexOf(split_input[i]) == -1){
        unique_items.push(split_input[i]);
      }
    }*/

    return split_input;
  }

  function shape_input_stream(length){
    var shaped_input = [];
    for(var i=0; i<length; i++){
      var next = next_percept();
      if(typeof next[0] != 'undefined'){
        shaped_input.push(next);
      }
    }
    return shaped_input;
  }

  function next_percept(){

    var possible_matches = [];

    // iterate through all the items in lexicon to find candidate matches
    for(var l in lexicon){
      if(lexicon[l].weight >= parameters.shaping_weight_threshold){
        if(match_lexicon_item_to_input(lexicon[l].word, input_vector)){
          possible_matches.push(lexicon[l].word);
        }
      }
    }

    // find longest match
    var longest_word = [];
    for(var m in possible_matches){
      if(possible_matches[m].length > longest_word.length) {
        longest_word = possible_matches[m];
      }
    }

    var next_percept = []
    if(longest_word.length == 0){
      next_percept.push(input_vector.shift());
    } else {
      for(var i = 0; i<longest_word.length;i++){
        next_percept.push(input_vector.shift());
      }
    }

    return next_percept;
  }

  function match_lexicon_item_to_input(word, input){
    for(var i in word){
      if(typeof input[i] == 'undefined'){
        return false;
      }
      if(word[i] !== input[i]){
        return false;
      }
    }
    return true;
  }

  function reinforce_lexicon_item(item){
    var match = false;
    for(l in lexicon){
      if(JSON.stringify(lexicon[l].word) == JSON.stringify(item)){
        match = true;
        if(parameters.logging){
          console.log('Matched lexicon item: '+JSON.stringify(lexicon[l]));
        }
        lexicon[l].weight += parameters.reinforcement_rate;
      }
    }
    if(!match){
      add_lexicon_item(item);
    }
  }

  function add_lexicon_item(item){
    if(parameters.logging){
      console.log('Adding new item to lexicon: '+JSON.stringify(item));
    }
    lexicon.push({
      word: item,
      weight: parameters.initial_lexicon_weight
    });
  }

  function forgetting(current_percept){

    // forget amount is tied to number of items that were seen
    var forget_amount = parameters.forgetting_rate * current_percept.length;

    // forgetting happens for everything BUT the current whole percept

    for(l in lexicon){
      if(JSON.stringify(lexicon[l].word) !== JSON.stringify(current_percept)){
        lexicon[l].weight -= forget_amount;
        if(lexicon[l].weight < 0){
          lexicon.splice(l, 1);
        }
      }
    }
  }

  function interference(current_percept){

    // search lexicon for items that contain syllables from the current percept
    // but are NOT the current percept or any of it's subunits

    var whole_percept = flatten(current_percept);

    for(l in lexicon){
      var will_interfere = false;
      for(i in whole_percept){
        if(lexicon[l].word.indexOf(whole_percept[i]) >= 0 && JSON.stringify(lexicon[l].word) !== JSON.stringify(whole_percept)){
          will_interfere = true;
          for(j in current_percept){
            if(JSON.stringify(lexicon[l].word) == JSON.stringify(current_percept[j])){
              will_interfere = false;
            }
          }
        }
      }
      if(will_interfere){
        if(parameters.logging){
          console.log('Interference decay for item: '+JSON.stringify(lexicon[l].word));
        }
        lexicon[l].weight -= parameters.interference_rate;
      }
    }
  }

  function flatten(arr){
    var out = [];
    for(var i = 0; i < arr.length; i++){
      if(Array.isArray(arr[i])){
        for(var j = 0; j < arr[i].length; j++){
          out.push(arr[i][j]);
        }
      } else {
        out.push(arr[i]);
      }
    }
    return out;
  }

  return module;

})();
