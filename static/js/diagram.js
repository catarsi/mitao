
class dipam_diagram {


  constructor(config_data, workflow={}) {
    this.CONFIG = config;

    this.DIAGRAM_DATA = {id: "", name: "", type: "", value:""};
    this.NODE_DATA = {id: "", name: "", type: "", value:""};
    this.EDGE_DATA = {id: "", name: "", type: "", value:"", source: "", target:""};
    //add the additional ad-hoc attributes defined in config
    //this._apply_diagram_config_definition();

    this.DIAGRAM_CONTAINER = document.getElementById('cy');

    this.DIAGRAM_GENERAL = workflow.diagram;
    this.INIT_NODES = workflow.nodes;
    this.INIT_EDGES = workflow.edges;

    this.STYLE = {
      node: {
        tool: {'shape': 'diamond','background-color': 'orange'},
        data: {'shape': 'round-rectangle','background-color': '#74beda'},
      },
      edge:{
        edge: {'line-color': '#bfbfbf', 'target-arrow-color': '#bfbfbf'}
      }
    };

    this.ONCLICK_STYLE = {
      node: {
        tool: {'background-color': '#663500'},
        data: {'background-color': '#663500'},
      },
      edge:{
        edge: {'line-color': '#663500', 'target-arrow-color': '#663500'}
      }
    };

    this.COMPATIBLE_STYLE = {
          true: {'opacity': '1', 'overlay-opacity': '0'},
          false:{'opacity': '0.3', 'overlay-opacity': '0'}
    };

    this.cy = cytoscape({
              container: this.DIAGRAM_CONTAINER,

              layout: {
                name: 'grid',
                rows: 2,
                cols: 2
              },

              style: [
                {
                  selector: 'node[name]',
                  style: {
                    'content': 'data(name)'
                  }
                },

                {
                  selector: 'edge',
                  style: {
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'triangle'
                  }
                },

                // some style for the extension


                {
                  selector: '.eh-handle',
                  style: {
                    'background-color': 'red',
                    'width': 15,
                    'height': 15,
                    'shape': 'ellipse',
                    'overlay-opacity': 0,
                    'border-width': 10, // makes the handle easier to hit
                    'border-opacity': 0,
                    'opacity': 0.6,
                  }
                },

                {
                  selector: '.eh-hover',
                  style: {
                    'background-color': 'red'
                  }
                },

                {
                  selector: '.eh-source',
                  style: {
                    'border-width': 2,
                    'border-color': 'red'
                  }
                },

                {
                  selector: '.eh-target',
                  style: {
                    'border-width': 2,
                    'border-color': 'red'
                  }
                },

                {
                  selector: '.eh-preview, .eh-ghost-edge',
                  style: {
                    'background-color': 'red',
                    'line-color': 'red',
                    'target-arrow-color': 'red',
                    'source-arrow-color': 'red'
                  }
                },

                {
                  selector: '.eh-ghost-edge.eh-preview-active',
                  style: {
                    'opacity': 0
                  }
                }
              ],

              elements: {
                nodes: this.INIT_NODES,
                edges: this.INIT_EDGES
              }
    });
    this.set_diagram_layout(workflow);
    var cy_undo_redo = this.cy.undoRedo(
        {
              isDebug: true, // Debug mode for console messages
              actions: {},// actions to be added
              undoableDrag: false, // Whether dragging nodes are undoable can be a function as well
              stackSizeLimit: undefined, // Size limit of undo stack, note that the size of redo stack cannot exceed size of undo stack
              ready: function () { // callback when undo-redo is ready

              }
        }
    );
    this.cy_undo_redo = cy_undo_redo;

    this.get_nodes('tool').style(this.STYLE.node.tool);
    this.get_nodes('data').style(this.STYLE.node.data);
    this.get_edges().style(this.STYLE.edge.edge);
  }

  set_diagram_layout(workflow) {
    var list_nodes = workflow.nodes;
    for (var i = 0; i < list_nodes.length; i++) {

      if ("graph" in list_nodes[i].data) {
        if ("position" in list_nodes[i].data.graph) {
          var a_node = this.cy.nodes('node[id = "'+list_nodes[i].data.id+'"]');
          var a_pos = JSON.parse(JSON.stringify(list_nodes[i].data.graph.position));
          a_node.position("x",a_pos.x);
          a_node.position("y",a_pos.y);
        }
      }
    }
  }

  set_events(){
    var eh = this.cy.edgehandles();
    this.cy.on('ehshow', (event, sourceNode) => {
          if (sourceNode._private.selected == false) {
            eh.hide();
          }
    });
  }
  get_diagram_obj(){
    return this.cy;
  }
  get_undo_redo() {
    return this.cy_undo_redo;
  }
  get_gen_elem(type){
    switch (type) {
      case 'diagram':
        return this.get_diagram();
        break;
      case 'edge':
        return this.get_edges();
      default:
        return this.get_nodes(type);
    }
  }
  get_gen_elem_by_id(id){
    if (this.get_diagram().data.id == id) {
      return this.get_diagram();
    }else if (this.cy.nodes('node[id = "'+id+'"]').length > 0) {
      return this.cy.nodes('node[id = "'+id+'"]')[0];
    }else if (this.cy.edges('edge[id = "'+id+'"]').length > 0) {
      return this.cy.edges('edge[id = "'+id+'"]')[0];
    }
    return -1;
  }

  get_diagram(){
    return this.DIAGRAM_GENERAL;
  }
  get_nodes(type = null){
    if (type != null) {
      return this.cy.nodes('node[type = "'+type+'"]');
    }
    return this.cy.nodes('node[type = "data"]').union(this.cy.nodes('node[type = "tool"]'));
  }
  get_target_nodes(node){
    var out_nodes = this.cy.edges('edge[source="'+node._private.data.id+'"]').targets();
    var out_nodes_normalized = out_nodes.nodes('node[type = "data"]').union(out_nodes.nodes('node[type = "tool"]'));
    return out_nodes_normalized;
  }
  get_source_nodes(node){
    var in_nodes = this.cy.edges('edge[target="'+node._private.data.id+'"]').sources();
    var in_nodes_normalized = in_nodes.nodes('node[type = "data"]').union(in_nodes.nodes('node[type = "tool"]'));
    return in_nodes_normalized;
  }
  get_nodes_att_values(arr_nodes, att){
    var arr_att = [];
    for (var i = 0; i < arr_nodes.length; i++) {
      arr_att.push(arr_nodes[i]._private.data[att]);
    }
    return arr_att;
  }
  get_edges(){
    return this.cy.edges();
  }

  get_workflow_data(){
    var workflow_to_save = {
      'diagram': this.DIAGRAM_GENERAL,
      'nodes': [],
      'edges': [],
    };
    // build the nodes
    var diagram_nodes = this.get_nodes();
    for (var i = 0; i < diagram_nodes.length; i++) {
      workflow_to_save.nodes.push({"data": _normalize_data_to_save(diagram_nodes[i], true)});
    }
    // build the edges
    var diagram_edges = this.get_edges();
    for (var i = 0; i < diagram_edges.length; i++) {
      workflow_to_save.edges.push({"data": _normalize_data_to_save(diagram_edges[i])});
    }

    return workflow_to_save;

    function _normalize_data_to_save(an_elem, is_node = false) {
      //check if there is objects also
      console.log(an_elem._private.data)
      /*
      if ("param" in an_elem._private.data) {
        if ("p-file" in an_elem._private.data.param) {
          for (var i = 0; i < an_elem._private.data.param["p-file"].length; i++) {
            console.log(an_elem._private.data.param["p-file"][i].name);
          }
        }
      }
      */

      //var res_obj = JSON.parse(JSON.stringify(an_elem._private.data));
      var res_obj = an_elem._private.data;

      if ("workflow" in res_obj){
        delete res_obj["workflow"];
      }
      //gen the graph data of elem
      if (is_node) {
        if (!('graph' in res_obj)) {
          res_obj["graph"] = {};
        }
        res_obj.graph["position"] = an_elem._private.position;
      }
      return res_obj;
    }

  }
  get_keys(type){
    var res = {'label':[],'value':[]};
    if (this.CONFIG.hasOwnProperty(type)) {
      for (var a_k in this.CONFIG[type]) {
        res.value.push(a_k);
        res.label.push(this.CONFIG[type][a_k].label);
      }
    }
    return res;
  }
  get_data_keys(){
  }

  get_terminal_tools(){
    var arr = []
    if (this.CONFIG.hasOwnProperty("tool")) {
      for (var a_k in this.CONFIG.tool) {
        if (this.CONFIG.tool[a_k].class == "Terminal") {
          arr.push(a_k);
        }
      }
    }

    var res = [];
    var all_nodes = this.get_nodes();
    for (var i = 0; i < all_nodes.length; i++) {
      if(arr.indexOf(all_nodes[i]._private.data.value) != -1){
        res.push({"id":all_nodes[i]._private.data.id, "value": all_nodes[i]._private.data.value});
      }
    }

    return res;
  }

  //<type>: 'data', 'tool', 'param'
  get_conf_elems(type, values) {
      var res = {};
      for (var i = 0; i < values.length; i++) {
        res[values[i]] = [];
      }

      for (var a_k in this.CONFIG) {
        if (a_k == type) {
          for (var k_elem in this.CONFIG[a_k]) {
            var att_elems = this.CONFIG[a_k][k_elem];
            for (var k_att_elem in res) {
              if (k_att_elem == '[KEY]') {
                  res[k_att_elem].push(k_elem);
              }else if (k_att_elem in this.CONFIG[a_k][k_elem]) {
                    res[k_att_elem].push(att_elems[k_att_elem]);
              }
            }
          }
        }
      }

      return res;
  }

  get_conf_att(type = null, k_type = null, k_att = null){
    if ((type != null) && (type in this.CONFIG)){
        if ((k_type != null) && (k_type in this.CONFIG[type])) {
            if ((k_att != null) && (k_att in this.CONFIG[type][k_type])) {
                return this.CONFIG[type][k_type][k_att];
            }else {
              return this.CONFIG[type][k_type];
            }
        }else {
          return this.CONFIG[type];
        }
    }else {
      return this.CONFIG;
    }
    return -1;
  }

  add_node(type) {
    var node_n = this.gen_node_data(type);
    node_n.group = 'nodes';
    this.cy.add(node_n);
    this.cy_undo_redo.do("add", this.cy.$("#"+node_n.data.id));
  }
  gen_node_data(n_type, a_value = null) {
    var a_node_data = null;
    if (n_type in this.NODE_DATA) {
      a_node_data = JSON.parse(JSON.stringify(this.NODE_DATA[n_type]));
    }else {
      a_node_data = JSON.parse(JSON.stringify(this.NODE_DATA));
    }

    var node_obj = {
      style: this.STYLE.node[n_type],
      position: { x: 0, y: 0},
      data: a_node_data
    };


    //var info_box = this.DIAGRAM_CONTAINER.getBoundingClientRect();
    //node_obj.position.x = info_box.x;
    //node_obj.position.y = info_box.y + info_box.height/2;

    //try with the pan value
    //this.fit_diagram();
    var info_box = this.cy.extent();
    node_obj.position.x = info_box.x1 + Math.abs(info_box.x1/3);
    node_obj.position.y = info_box.y1 + Math.abs(info_box.y1/2);

    for (var i = 0; i < this.cy.nodes().length; i++) {
      var a_node_added = this.cy.nodes()[i];
      if((a_node_added.position('x') == node_obj.position.x) && (a_node_added.position('y') == node_obj.position.y)){
        node_obj.position.y = node_obj.position.y + a_node_added.height();
        i = 0;
      }
    }

    //Init the essential data: id, name, value
    if (n_type in this.CONFIG) {
      var type_value = Object.keys(this.CONFIG[n_type])[0];
      if (a_value != null) {
        type_value = a_value;
      }
      if (Object.keys(this.CONFIG[n_type]).length > 0){
          var new_id = this.gen_id(n_type);
          node_obj.data.id = new_id;
          node_obj.data.name = new_id;
          node_obj.data.type = n_type;
          node_obj.data.value = type_value;
      }

      //check if I should add dynamic fields for the param associated
      node_obj.data.param = {};
      var my_conf = this.CONFIG[n_type][type_value];
      if ('param' in this.CONFIG[n_type][type_value]) {
        for (var i = 0; i < my_conf.param.length; i++) {
          var p_key = my_conf.param[i];
          if (p_key in this.CONFIG.param) {
              var corresponding_param = this.CONFIG.param[p_key];
              var corresponding_param_handler = corresponding_param.handler;
              var corresponding_param_val = null;
              switch (corresponding_param_handler) {
                case "select-value":
                  var init_val_index = corresponding_param.value.indexOf(corresponding_param.init_value);
                  corresponding_param_val = corresponding_param.value[init_val_index];
                  break;
                case "input-text":
                  corresponding_param_val = corresponding_param.init_value;
                  break;
                case "select-file":
                  corresponding_param_val = JSON.parse(JSON.stringify(corresponding_param.init_value));
                  break;
                case "check-value":
                  var check_val_list = [];
                  for (var j = 0; j < corresponding_param.init_value.length; j++) {
                    if(corresponding_param.init_value[j] == 1){
                       check_val_list.push(corresponding_param.value[j]);
                    }
                  }
                  corresponding_param_val = check_val_list;
                  break;
                default:
              }
              node_obj.data.param[p_key] = corresponding_param_val;
            }
          }
        }
      }
    return node_obj;
  }

  after_add_edge(edge_data){
    var interface_instance = this;
    var cy_instance = this.cy;
    var source_node = cy_instance.nodes("node[id='"+edge_data.source+"']")[0];
    var target_node = cy_instance.nodes("node[id='"+edge_data.target+"']")[0];
    var flag_compatible = this.is_compatible(source_node, target_node);

    //check if the diagram is still a DAG
    var flag_is_cycle = is_cycle(this.get_target_nodes(source_node), source_node);

    //check also if there is another same edge
    if ((!flag_compatible) || flag_is_cycle)  {
      console.log('Edge not compatible! ');
      if (flag_is_cycle) {
        console.log("It creates a loop !");
      }
      cy_instance.remove('#'+edge_data.id);
    }else {
      //if flag_compatible add it to log file
      this.cy_undo_redo.do("add", cy_instance.$("#"+edge_data.id));
    }

    return edge_data;

    //is cycle starting from node N
    function is_cycle(arr_nodes, origin){

      //check if one of the nodes is origin
      for (var i = 0; i < arr_nodes.length; i++) {
        var node = arr_nodes[i];
        if (__is_same_node(node, origin)) {
          return true;
        }
      }

      var res = false;
      for (var i = 0; i < arr_nodes.length; i++) {
        var node = arr_nodes[i];
        var out_nodes = interface_instance.get_target_nodes(node);
        if (out_nodes.length != 0) {
            res = res || is_cycle(out_nodes , origin);
        }
      }

      return res;

      function __is_same_node(n_a, n_b){
        return (n_a._private.data.id == n_b._private.data.id);
      }
    }
  }
  gen_edge_data(source_id,target_id){
    var edge_obj = { data: JSON.parse(JSON.stringify(this.EDGE_DATA)) , group: 'edges'};
    edge_obj.data.id = this.gen_id('edge');
    edge_obj.data.type = 'edge';
    edge_obj.data.name = this.gen_id('edge');
    edge_obj.data.source = source_id;
    edge_obj.data.target = target_id;
    return JSON.parse(JSON.stringify(edge_obj));
  }

  //Update an element
  // (1) Its data in the cy diagram
  // (2) Its style in the cy diagram
  // (3) The realtime correlated items (Remove edges in case not suitable anymore)
  // (4) The real time compatible elements of the cy diagram
  update_elem(id, type, data){
    console.log("Data to uodate: ",data);
    //first check if it's the Diagram
    if (id == this.DIAGRAM_GENERAL.data.id) {
      for (var k_data in data) {
        if (this.DIAGRAM_GENERAL.data.hasOwnProperty(k_data)) {
          this.DIAGRAM_GENERAL.data[k_data] = data[k_data];
        }
      }
      return this.DIAGRAM_GENERAL;
    }

    var d_elem = this.cy.getElementById(id);

    // (1) update it's data first
    var value_updated = false;
    for (var k_data in data) {
      if (data[k_data] != -1) {

        if (k_data == "value")
          if (data.value != -1)
            value_updated = true;

        if (d_elem._private.data.hasOwnProperty(k_data)) {
          d_elem._private.data[k_data] = data[k_data];
        }else if ('param' in d_elem._private.data) {
          //its a param
          if (d_elem._private.data.param.hasOwnProperty(k_data)) {
            d_elem._private.data.param[k_data] = data[k_data];
          }
        }
      }
    }
    if (value_updated) {
        var new_node_data = this.gen_node_data(type, data.value).data;
        d_elem._private.data.value = data.value;
        d_elem._private.data.param = new_node_data.param;
    }

    // (2) Its style in the cy diagram
    this.adapt_style(d_elem);

    // (2.1) In case is an Edge then STOP HERE
    if(d_elem.isEdge()){
      return d_elem;
    }

    // (3) The realtime correlated items (Remove neighborhood edges in case not suitable anymore)
    this.check_node_compatibility(d_elem, true);

    // (4) The real time compatible elements of the cy diagram
    this.check_node_compatibility(d_elem);

    //update diagram
    this.cy.style().update();

    return d_elem;
  }

  //adapt the style to an element:<elem>
  //returns the new style of the element
  adapt_style(elem){
    var elem_type = 'node';
    if(elem.isEdge()){
      elem_type = 'edge';
    }
    var elem_style = this.STYLE[elem_type][elem._private.data.type];
    elem.style(elem_style);
    return elem_style;
  }

  //Remove an element by taking its id:<elem_id> from the diagram
  //returns the removed element
  remove_elem(elem_id){
    this.cy_undo_redo.do("remove", this.cy.$("#"+elem_id));
    return this.cy.remove("#"+elem_id);
  }

  //adapt the style of the clicked element:<elem> of type:<type>
  click_elem_style(elem,type){

    elem = elem._private.data;

    //first color all nodes
    var arr_elems = this.cy.nodes();
    for (var i = 0; i < arr_elems.length; i++) {
      var elem_obj = arr_elems[i];
      this.cy.nodes('node[id="'+elem_obj._private.data.id+'"]').style(this.STYLE.node[elem_obj._private.data.type]);
    }

    arr_elems = this.cy.edges();
    for (var i = 0; i < arr_elems.length; i++) {
      var elem_obj = arr_elems[i];
      this.cy.edges('edge[id="'+elem_obj._private.data.id+'"]').style(this.STYLE.edge[elem_obj._private.data.type]);
    }

    if (type == 'node') {
      this.cy.nodes('node[id="'+elem.id+'"]').style(this.ONCLICK_STYLE.node[elem.type]);
    }else if (type == 'edge') {
      this.cy.edges('edge[id="'+elem.id+'"]').style(this.ONCLICK_STYLE.edge[elem.type]);
    }
  }

  //adapt the node compatibility status regarding it's neighborhood nodes
  //returns the neighborhood nodes
  check_node_compatibility(node, neighborhood = false){

    var node_id = node._private.data.id;

    //first make all transparent
    this.activate_nodes(null,false, true);
    //activate selected node
    this.activate_nodes("node[id='"+node_id+"']", true, true);
    //get the nodes i must check
    var nodes_to_check = {
      'all_nodes': this.cy.nodes('[type = "data"]').union(this.cy.nodes('[type = "tool"]')).difference(this.cy.nodes("node[id='"+node_id+"']")),
      'target_nodes': this.cy.edges('[source = "'+node_id+'"]').target(),
      'source_nodes': this.cy.edges('[target = "'+node_id+'"]').source()
    };

    //in case we want to check only the neighborhood nodes (the connected nodes)
    if (neighborhood) {
      nodes_to_check.all_nodes = [];
    } else {
      nodes_to_check.target_nodes = [];
      nodes_to_check.source_nodes = [];
    }

    for (var k_nodes in nodes_to_check) {
      if (nodes_to_check[k_nodes] != undefined) {
        for (var i = 0; i < nodes_to_check[k_nodes].length; i++) {
          var node_to_check_obj = nodes_to_check[k_nodes][i];
          var node_to_check_obj_id = node_to_check_obj._private.data.id;
          var flag_compatible = false;
          if (k_nodes == 'target_nodes') {
            flag_compatible = this.is_compatible(node, node_to_check_obj);
            if (!(flag_compatible)){
              this.cy.remove(this.cy.edges('edge[source="'+node_id+'"]').edges('edge[target="'+node_to_check_obj_id+'"]') );
            }
          }
          else if (k_nodes == 'source_nodes') {
            flag_compatible = this.is_compatible(node_to_check_obj, node);
            if (!(flag_compatible)){
              this.cy.remove(this.cy.edges('edge[source="'+node_id+'"]').edges('edge[target="'+node_to_check_obj_id+'"]') );
            }
          }
          else if (k_nodes == 'all_nodes') {
            flag_compatible = this.is_compatible(node, node_to_check_obj);
          }
          this.activate_nodes("node[id='"+node_to_check_obj_id+"']",flag_compatible, flag_compatible);
        }
      }
    }

    return nodes_to_check;
  }

  //activate/deactivate the diagram nodes. a subset could be defined through <selector>
  //returns the activated/deactivated nodes
  activate_nodes(selector= null, active = true, flag_interaction= true){
    var target_element = this.cy.nodes();
    if (selector != null) {
      target_element = this.cy.nodes(selector);
    }
    for (var i = 0; i < target_element.length; i++) {
      target_element[i].style(this.COMPATIBLE_STYLE[active]);
      target_element[i]._private.active = active;
    }
    return target_element;
  }

  //Generate an ID for a giving type of element
  //type: tool | data | edge
  //returns an ID with t- | d- | e- followed by a 4-digit. e.g: t-0012
  gen_id(type){

      var str_prefix = "";
      var num_id = null;
      var arr_elems = null;
      switch (type) {
            case 'tool': str_prefix = "t-"; arr_elems= this.get_nodes('tool'); break;
            case 'data': str_prefix = "d-"; arr_elems= this.get_nodes('data'); break;
            case 'edge': str_prefix = "e-"; arr_elems= this.get_edges(); break;
      }

      var ids_taken = [];
      for (var i = 0; i < arr_elems.length; i++) {
          ids_taken.push(parseInt(arr_elems[i]._private.data.id.substring(2)));
      }

      var num_id = 1;
      while (num_id <= arr_elems.length) {
        if (ids_taken.indexOf(num_id) == -1) {
          break;
        }else {
          num_id++;
        }
      }

      var num_zeros = 3 - num_id/10;
      var str_zeros = "";
      for (var i = 0; i < num_zeros; i++) {
            str_zeros= str_zeros + "0";
      }
      return str_prefix+str_zeros+num_id;
  }

  //takes a class node
  //returns an array of all the output data IDs
  get_output(node){
    var res = [];
    var node_type = node._private.data.type;
    var node_value = node._private.data.value;
    if (node_type == 'data') {
      res.push(node_value);
    }else {
      var node_conf_obj = this.CONFIG[node_type][node_value];
      if (node_conf_obj != undefined) {
        if (node_conf_obj.output != undefined) {
          res = node_conf_obj.output;
        }
      }
    }

    return res;
  }

  //takes a class node
  //returns an array of all the compatible-input data IDs
  get_compatible_input(node){
    var res = [];
    var node_type = node._private.data.type;
    var node_value = node._private.data.value;
    if (node_type != 'data') {
      var node_conf_obj = this.CONFIG[node_type][node_value];
      if (node_conf_obj != undefined) {
        if (node_conf_obj.compatible_input != undefined) {
          res = node_conf_obj.compatible_input;
        }
      }
    }
    return res;
  }

  //is compatible
  //returns true if the output of <source_node> is acceptable (compatible) for the <target_node>
  is_compatible(source_node, target_node){
    //check if the edge is compatible
    var compatible_input = this.get_compatible_input(target_node);
    var output = this.get_output(source_node);
    for (var i = 0; i < output.length; i++) {
      if(compatible_input.indexOf(output[i]) != -1){
        return true;
      }
    }
    return false;
  }

  //build the topological execution order of the nodes
  build_nodes_topological_ordering(){
    var topological_ordered_list = [];

    //get all nodes
    var all_nodes = this.get_nodes();
    var ids_queue = this.get_nodes_att_values(all_nodes, 'id');

    //console.log(ids_queue.shift(),ids_queue);
    //var count = 15;
    while (ids_queue.length > 0) {
      //count--; if (count == 0) {break;}

      //console.log(ids_queue.length, ids_queue, topological_ordered_list);
      var n_id = ids_queue.shift();
      var a_node = this.get_gen_elem_by_id(n_id);
      var a_node_config = this.CONFIG[a_node._private.data.type][a_node._private.data.value];

      //define the node method for both cases
      var a_node_class = null;
      var a_node_compatible_inputs = [];
      if (a_node._private.data.type == 'tool') {
        a_node_class = a_node_config["function"];
        a_node_compatible_inputs = a_node_config["compatible_input"];
      }else if (a_node._private.data.type == 'data') {
        a_node_class = a_node_config["data_class"];
      }

      //var a_node_to_process = jQuery.extend(true, {}, a_node);
      var a_node_to_process = a_node._private.data;
      a_node_to_process['workflow'] = {};
      a_node_to_process.workflow['class'] = a_node_class;
      a_node_to_process.workflow['compatible_input'] = a_node_compatible_inputs;
      a_node_to_process.workflow['input'] = this.get_nodes_att_values(this.get_source_nodes(a_node),'id');
      a_node_to_process.workflow['output'] = this.get_nodes_att_values(this.get_target_nodes(a_node),'id');

      if(!(_process_node(a_node_to_process))){
        ids_queue.push(n_id);
      }
    }

    return topological_ordered_list;

    function _process_node(a_node){
      var add_it = false;
      var inputs = a_node.workflow.input;

      //check if all its inputs are inside the index_processed
      var all_processed = true;
      for (var j = 0; j < inputs.length; j++) {
          if(_in_topological_order(inputs[j], topological_ordered_list)) {
            all_processed = true;
          }else {
            all_processed = false;
            break;
          }
      }
      if (all_processed) {
          add_it = true;
      }

      if (add_it) {
        topological_ordered_list.push(a_node);
      }

      return add_it;

      function _in_topological_order(val, topological_ordered_list){
        for (var k = 0; k < topological_ordered_list.length; k++) {
          if(topological_ordered_list[k].id == val){
            return true;
          }
        }
        return false;
      }
    }
  }


  zoom_in(){
    this.cy.zoom(this.cy.zoom() + 0.1);
  }
  zoom_out(){
    this.cy.zoom(this.cy.zoom() - 0.1);
  }
  fit_diagram(){
    this.cy.fit();
  }

}
