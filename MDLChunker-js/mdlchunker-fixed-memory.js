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

    if(input_vector.length == 0){
      return;
    }

    // fill the perceptual vector
    var percept = [];
    var done = false;
    var input_vector_index = 0;
    var last = [];
    while(!done){
      percept.push(input_vector[input_vector_index]);
      var factorized = factorize(percept);
      if(get_total_codelength(factorized) > parameters.perceptual_span) {
        done = true;
      } else {
        if(input_vector_index == input_vector.length-1){
          done = true;
          last = factorized;
        } else {
          input_vector_index++;
          last = factorized;
        }
      }
    }
    percept = last;

    // take only the first chunk out of vector and add to memory
    var first_chunk_items = get_canonical_definition(get_chunk_by_id(percept[0]));
    for(i in first_chunk_items){
      input_vector.shift();
    }

    add_to_memory(first_chunk_items);

    // optimize the chunk encoding
    var new_chunk = new_chunk_search();
    while(new_chunk != false){
      add_item_to_lexicon([new_chunk.c1.chunkID, new_chunk.c2.chunkID]);
      update_codelengths();
      new_chunk = new_chunk_search();
    }

    update_codelengths();
  }

  module.run = function(){
    while(input_vector.length > 0){
      module.step();
    }
  }

  module.getLexicon = function() {
    //var sortedLexicon = lexicon.sort(function(a,b){ return a.codeLength - b.codeLength; });
    return JSON.parse(JSON.stringify(lexicon));
  }

  module.getInput = function() {
    return JSON.stringify(input_vector);
  }

  module.getMemory = function() {
    return JSON.stringify(memory);
  }

  module.getFactorizedMemory = function() {
    return JSON.stringify(factorize(memory));
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
      canonical: (item.length == 1),
      priority: undefined
    });
  }

  function get_canonical_definition(chunk){

    var canonical_definition = [];

    var word = chunk.word;
    if(chunk.canonical){
      return word;
    } else {
      for(var i in word){
        var thischunk = get_chunk_by_id(word[i]);
        canonical_definition = canonical_definition.concat(get_canonical_definition(thischunk));
      }
      return canonical_definition;
    }

  }

  function get_chunk_by_id(chunkID){
    for(var i in lexicon){
      if(lexicon[i].chunkID == chunkID){
        return lexicon[i];
      }
    }
  }

  /*
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
  */

  function update_chunk_priority(){

    lexicon.sort(function(a,b){ return a.codeLength - b.codeLength; });

    for(var i in lexicon){
      lexicon[i].priority = i;
    }

  }

  function update_codelengths(){

    var whole_vector = get_whole_factorized_vector();

    var total_length = whole_vector.length;

    for(l in lexicon){
      var count = count_occurences(lexicon[l].chunkID, whole_vector);
      var bitlength = -Math.log2(count/total_length);
      lexicon[l].codeLength = bitlength;
    }
  }

  function get_whole_factorized_vector(){
    var whole_vector = [];

    for(l in lexicon){
      whole_vector.push(lexicon[l].chunkID)
    }

    var factorized_memory = factorize(memory);

    for(i in factorized_memory){
      whole_vector.push(factorized_memory[i])
    }

    return whole_vector;
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

  function get_total_codelength(vector){
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

  function factorize(vector){

    // make a copy
    vector = vector.slice(0);

    // update chunk priority
    // this sorts the lexicon so that the first item is the shortest codelength
    update_chunk_priority();

    // apply the chunks to the vector in order, with smallest codelengths first
    for(i in lexicon){
      vector = replace_chunk_occurrences(lexicon[i], vector);
    }

    return vector;

  }

  function replace_chunk_occurrences(chunk, vector){
    var new_vector = [];
    var word = get_canonical_definition(chunk);

    for(var v = 0; v<vector.length; v++){
      // check for canonical definition match
      if(JSON.stringify(vector.slice(v,v+word.length)) == JSON.stringify(word)){
        new_vector.push(chunk.chunkID);
        v += word.length-1;
      }
      // check for chunk definition match
      else if(JSON.stringify(vector.slice(v, v+chunk.word.length)) == JSON.stringify(chunk.word)){
        new_vector.push(chunk.chunkID);
        v += chunk.word.length-1;
      }
      // no match
      else {
        new_vector.push(vector[v]);
      }
    }
    return new_vector;
  }

  function add_to_memory(items){

    // add all items to memory
    for(i in items){
      memory.push(items[i]);
    }

    // check if memory is too large
    while(memory.length > parameters.memory_size){
      memory.shift();
    }

  }

  function new_chunk_search(){

    var whole_vector = get_whole_factorized_vector();
    var factorized_memory = factorize(memory);

    // search process on the memory vector only
    // check for each possible combination of chunks
    var possible_new_chunks = [];
    for(var i in lexicon){
      for(var j in lexicon){
        if(i!=j){
          var count = count_cooccurences(lexicon[i].chunkID, lexicon[j].chunkID, factorized_memory);
          possible_new_chunks.push({
            c1: lexicon[i],
            c2: lexicon[j],
            count: count,
          });
        }
      }
    }
    for(var i in possible_new_chunks){
      possible_new_chunks[i].delta = description_length_increase(possible_new_chunks[i], factorized_memory);
    }
    // sort, with most negative delta first
    possible_new_chunks.sort(function(a,b){ return a.delta - b.delta; });

    if(possible_new_chunks[0].delta < 0){
      return possible_new_chunks[0];
    } else {
      return false;
    }

  }

  function count_cooccurences(c1,c2,vector){
    var count = 0;
    for(var i=0; i<vector.length-1; i++){
      if(vector[i] == c1 && vector[i+1] == c2){
        count++;
      }
    }
    return count;
  }

  function description_length_increase(newchunk, vector){
    var N = vector.length; // number of chunks in memory
    var CiCj = newchunk.count; // number of cooccurences of c1 and c2
    var Ci = count_occurences(newchunk.c1.chunkID, vector);
    var Cj = count_occurences(newchunk.c2.chunkID, vector);

    var L1 = newchunk.count * (Math.log2((N + 3 - CiCj)/(CiCj + 1)) - Math.log2(N/Ci) - Math.log2(N/Cj));
    var L2 = (Ci - CiCj) * (Math.log2((N + 3 - CiCj)/(Ci - CiCj + 1)) - Math.log2(N/Ci)) + (Cj - CiCj) * (Math.log2((N + 3 - CiCj)/(Cj - CiCj + 1)) - Math.log2(N/Cj));
    var L3 = Math.log2( Math.pow(N+3-CiCj,3) / ((CiCj + 1)*(Ci - CiCj + 1)*(Cj-CiCj+1)))
    var L4 = (N - Ci - Cj) * Math.log2( (N + 3 - CiCj)/N )

    return L1 + L2 + L3 + L4;
  }

  return module;

})();
