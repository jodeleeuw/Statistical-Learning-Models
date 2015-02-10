/* Josh de Leeuw */

MDLChunker = (function(){

  var module = {};

  var input_vector = [];

  var parameters = {
    memory_size: 150,
    perceptual_span: 25,
    logging: true
  };

  var lexicon = [];

  var memory = [];

  module.setup = function(input, params){

    // parse input into atomic items
    input_vector = parse_input_items(input);

    // find all unique items and add to lexicon
    var unique_items = unique(input_vector);

    for(i in unique_items){
      add_to_lexicon(unique_items[i]);
    }

    update_codelengths();

    // merge parameters into default params
    for(var param in params){
      parameters[param] = params[param];
    }

  }

  module.step = function(){

    // fill the perceptual vector

    // process the vector in terms of chunks for factorize

    // take only the first chunk out of vector and add to memory

    // optimize the chunk encoding

    // update the codelengths

  }

  module.run = function(){

  }

  function parse_input_items(input, split_char){

    var split_input;
    if(typeof split_char == 'string'){
      split_input = input.split(split_char);
    } else {
      split_input = input.split("");
    }

    return split_input;
  }

  function unique(arr){
    var out = [];
    for(i in arr){
      if(out.indexOf(arr[i]) == -1){
        out.push(arr[i]);
      }
    }
    return out;
  }

  function add_item_to_lexicon(item){
    lexicon.push({
      word: item,
      codelength: undefined
    });
  }

  function update_codelengths(){

  }

  return module;

})();
