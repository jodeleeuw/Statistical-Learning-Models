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
      add_item_to_lexicon([unique_items[i]]);
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

  module.getLexicon = function() {
    var sortedLexicon = lexicon.sort(function(a,b){ return b.weight - a.weight; });
    return JSON.parse(JSON.stringify(sortedLexicon));
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
      codeLength: undefined,
      chunkID: "C"+(lexicon.length+1),
      canonical: (item.length == 1)
    });
  }

  function create_lower_bound_table(){
    var lower_bound_per_length = [];
    for(l in lexicon){
      var len = lexicon[l].word.length;
      if(typeof lower_bound_per_length[len] == 'undefined'){
        lower_bound_per_length[len] = lexicon[l].codeLength / len;
      } else {
        if(lower_bound_per_length[len] > lexicon[l].codeLength / len){
          lower_bound_per_length[len] = lexicon[l].codeLength / len;
        }
      }
    }

    var all = [];
    for(i in lower_bound_per_length){
      all.push({len: i, perunit: lower_bound_per_length[i]});
    }

    var sorted = all.sort(function(a,b){ return a.perunit - b.perunit; });

    return sorted;

  }

  function get_lower_bound_estimate(arr_of_continuous_item_lengths, table){

    var sum = 0;

    for(i in arr_of_continuous_item_lengths){
      var s = 0; // sum for this unit
      var l = arr_of_continuous_item_lengths[i];
      var ti = 0; // table index
      while(l > 0){
        while(l >= table[ti].len){
          l-= table[ti].len;
          s+= table[ti].perunit * table[ti].len;
        }
        ti++;
      }
      sum += s;
    }

    return sum;
  }

  function update_codelengths(){

    var whole_vector = [];

    for(l in lexicon){
      whole_vector.push(lexicon[l].chunkID)
    }

    for(i in memory){
      whole_vector.push(memory[i])
    }

    var total_length = whole_vector.length;

    for(l in lexicon){
      var count = count_occurences(lexicon[l].chunkID, whole_vector);
      var bitlength = -count * Math.log2(count/total_length);
      lexicon[l].codeLength = bitlength;
    }
  }

  function count_occurences(item, vector){
    var count = 0;
    for(i in vector){
      if(vector[i] == item){
        count++;
      }
    }
    return count;
  }

  function get_codelength(vector){
    var sum = 0;
    for(i in vector){
      for(l in lexicon){
        if(lexicon[l].chunkID == vector[i]){
          sum += lexicon[l].codeLength;
          break;
        }
      }
    }
    return sum;
  }

  function factorize(vector, chunks){

    // start by coding the vector with just the base chunks

    // for each possible chunk, recompute the vector using that chunk + the base chunks
    var non_canonical_chunks = [];
    for(i in chunks){
      if(!chunks[i].canonical){
        non_canonical_chunks.push(chunks[i]);
      }
    }

    // goal state is that there are no more chunks that could apply to the vector...

    var openset = [{v: vector.slice(0), cost: get_codelength(vector), }];


    // the distance is the cost of the chunks so far + lower bound estimate on the cost of the rest of the chunks

    // whichever encoding has the lowest cost becomes the new vector

    // the process stops when only the base chunks can be used, or no chunk other than base chunks fit.

  }

  return module;

})();
