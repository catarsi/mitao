class dipam_interface {

    constructor() {
        this.DIAGRAM_INSTANCE_OBJ = null;
        this.DOMS = {
          "DIAGRAM": {
              "CONTAINER": document.getElementById('cy'),
              //diagram editor (add nodes)
              "EDITOR_CONTAINER": document.getElementById('diagram_editor'),
              "ADD_TOOL_BTN": document.getElementById('add_tool'),
              "ADD_DATA_BTN": document.getElementById('add_data'),
              //undo-redo
              "UNDO_REDO_CONTAINER": document.getElementById('diagram_undo_redo'),
              "UNDO_BTN": document.getElementById('undo_btn'),
              "REDO_BTN": document.getElementById('redo_btn'),
              //zoom
              "ZOOM_CONTAINER": document.getElementById('diagram_zoom'),
              "ZOOMIN_BTN": document.getElementById('zoom_in_btn'),
              "ZOOMOUT_BTN": document.getElementById('zoom_out_btn'),
              //fit
              "FIT_CONTAINER": document.getElementById('diagram_fit'),
              "FIT_BTN": document.getElementById('fit_btn')
          },
          "CONTROL": {
              "CONTAINER": document.getElementById('control_body'),
              //menu navigator
              "NAV_CONTAINER": document.getElementById('control_nav'),
              "INFO_BTN": document.getElementById('nav_info_a'),
              "OVERVIEW_BTN": document.getElementById('nav_overview_a'),
          },
          "WORKFLOW": {
              //buttons
              "RUN_BTN": document.getElementById('btn_run_workflow'),
              "SAVE_BTN": document.getElementById('btn_save_workflow'),
              "SAVE_BTN_DOWNLOAD": document.getElementById('btn_save_workflow_a'),
              "LOAD_BTN": document.getElementById('btn_load_workflow'),
              //timeline
              "TIMELINE_CONTAINER": document.getElementById('timeline_container'),
              "START_BLOCK": document.getElementById('start_block'),
              "END_BLOCK": document.getElementById('end_block'),
              //extra section
              "EXTRA_CONTAINER": document.getElementById('workflow_extra'),
          }
        };

        this.info_section_html = "";
        this.info_section_elem = {};
        this.overview_section_html = "";
        this.overview_section_elem = {};

        this.workflow = null;
        this.request_status_on = true;
    }

    set_corresponding_diagram(diagram){
      this.DIAGRAM_INSTANCE_OBJ = diagram;
      this.DIAGRAM_INSTANCE_CY = diagram.get_diagram_obj();
      //a temp internal data structure
      this.temp_dipam_value = {};

      //The doms that should trigger events
      this.DOM_EVENT_ELEMS = {
          'edit-trigger':{},
          'remove-trigger': {},
          'cancel-trigger': {},
          'save-trigger': {},
          'select-file-trigger': {},
          'select-value-trigger': {},
          'check-value-trigger': {}
      };

      this.DIAGRAM_INSTANCE_OBJ.fit_diagram();
    }

    set_dipam_temp_val(key, new_val){
      this.temp_dipam_value[key] = new_val;
    }
    get_dipam_temp_val(key){
      if (key in this.temp_dipam_value) {
        return this.temp_dipam_value[key];
      }
      return -1;
    }
    reset_dipam_temp_val(){
      this.temp_dipam_value = {};
    }

    //build the info panel on the left
    build_overview(elem, elem_class= 'all') {
        this.overview_section_html = this.build_control_section(elem);
        this.overview_section_elem['elem'] = elem;
        this.overview_section_elem['elem_class'] = elem_class;
    }

    build_info(elem, elem_class= 'nodes', update_control_params = false) {
      if('_private' in elem)
        elem = elem._private;
      this.info_section_html = this.build_control_section(elem, update_control_params);
      this.info_section_elem['elem'] = elem;
      this.info_section_elem['elem_class'] = elem_class;
    }

    build_control_section(elem, update_control_params = false){
      var interface_instance = this;
      var diagram_instance = this.DIAGRAM_INSTANCE_OBJ;
      var res_str_html = "";
      var fixed_elems = ['id','type','source','target','class','input','output','compatible_input'];
      var foot_buttons = ['edit', 'remove'];
      if (elem.data.type == 'diagram') {
        foot_buttons = ['edit'];
      }

      res_str_html = res_str_html + '<div id="control_mid">';
      var all_param_doms_str = "";
      for (var k_attribute in elem.data) {
        var a_dom_str = "";

        //check is not one of the fixed attributes
        if(fixed_elems.indexOf(k_attribute) == -1){

          //check if is a must-attribute
          switch (k_attribute) {
            case 'name':
              //is an input-box
              this.set_dipam_temp_val(k_attribute,elem.data.name);
              a_dom_str = _build_a_dom("input-text", elem, k_attribute, {intro_lbl: "Name:"});
              break;
            case 'value':
              //is a dropdown
              this.set_dipam_temp_val(k_attribute,elem.data.value);
              var res_elem_type = diagram_instance.get_conf_elems(elem.data.type, ['[KEY]','label','class_label']);
              if (elem.data.type == "edge") {
                res_elem_type = {'[KEY]': ["edge"],'label': ["Edge"],'class_label':["General"]};
              }
              a_dom_str = _build_a_dom("select-value", elem, k_attribute, {intro_lbl: "Type:", value: res_elem_type['[KEY]'], label: res_elem_type['label'], class_label: res_elem_type['class_label']});
              break;

            case 'param':
              //is a param
              for (var k_param in elem.data.param) {
                    var para_obj = diagram_instance.get_conf_att("param",k_param, null);
                    var para_val = para_obj.value;
                    if (para_val != -1) {
                      all_param_doms_str = all_param_doms_str + _build_a_dom(para_obj.handler, elem, k_param, {intro_lbl: para_obj.label, value: para_obj.value, label: para_obj.value_label}, true);
                      this.set_dipam_temp_val(k_param,elem.data.param[k_param]);
                   }
              }
              if (update_control_params) {
                var control_param_sec = document.getElementsByClassName("control-params");
                if (control_param_sec.length > 0) {
                  control_param_sec = control_param_sec[0];
                }else {
                  return -1;
                }
                control_param_sec.innerHTML = all_param_doms_str;
              }
          }
          res_str_html = res_str_html + a_dom_str;
        }
      }
      res_str_html = res_str_html + "<div class='control-params'>"+ all_param_doms_str + '</div></div>';
      console.log(this.temp_dipam_value);

      //now the foot buttons
      var param_btn = {
        'edit': {intro_lbl: 'Edit properties'},
        'remove': {intro_lbl: 'Remove element'},
      };
      res_str_html = res_str_html + '<div id="control_foot">';
      for (var i = 0; i < foot_buttons.length; i++) {
        var btn_key = foot_buttons[i];
        a_dom_str = _build_a_dom(btn_key, elem, null, param_btn[btn_key]);
        res_str_html = res_str_html + a_dom_str;
      }
      res_str_html = res_str_html + '</div>';
      return res_str_html;

      function _build_a_dom(dom_tag, elem, k_attribute, param = {}, is_param = false){
        var a_dom_id = k_attribute;
        var a_dom_class = dom_tag + "-trigger";
        var str_html = "";
        var dom_value = elem.data[k_attribute];
        if (is_param) {
          a_dom_class = a_dom_class+" "+ "param-att";
          dom_value = elem.data.param[k_attribute];
        }
        if (k_attribute == "value") {
          a_dom_class = a_dom_class+" "+ "data-elem-value";
        }

        switch (dom_tag) {
          case 'select-value':
              var list_class_label = new Set(param.class_label);
              if (list_class_label.size == 0) {
                list_class_label.add("all");
              }

              var str_options = "";
              for (let a_class_label of list_class_label) {
                if (a_class_label != "all") {
                  str_options = str_options + "<optgroup label='"+a_class_label+"'>";
                }
                for (var j = 0; j < param.value.length; j++) {
                    var add_it = false;
                    if (a_class_label == "all") {
                      add_it = true;
                    }else if (param.class_label[j] == a_class_label){
                      add_it = true;
                    }

                    if (add_it) {
                        var selected_val = "";
                        if (param.value[j] == dom_value) {
                          selected_val = "selected";
                        }
                        str_options = str_options + "<option data-select-target='"+a_dom_id+"' value='"+param.value[j]+"' "+selected_val+">"+param.label[j]+"</option>";
                    }

                };
                str_options = str_options + "</optgroup>";
              }

              str_html = str_html + `
              <div class="input-group `+dom_tag+`">
                      <div class="input-group-prepend">
                        <label class="input-group-text">`+param.intro_lbl+`</label>
                      </div>
                      <select data-att-value="`+k_attribute+`" data-id="`+elem.data.id+`" id="`+a_dom_id+`" class="`+a_dom_class+` att-handler save-value custom-select" disabled>`+str_options+`</select>
              </div>`;
              break;

        case 'check-value':
                  var str_options = "";
                  console.log(param.value,dom_value);
                  for (var j = 0; j < param.value.length; j++) {
                      var selected_val = "";
                      if (dom_value.indexOf(param.value[j]) != -1) {
                        selected_val = "checked";
                      }
                      str_options = str_options + "<input type='checkbox' class='"+a_dom_class+" att-handler' data-select-target='"+a_dom_id+"' data-value-index='"+j+"' "+selected_val+" value='"+param.value[j]+"' disabled>"+param.label[j]+"<br>";
                   };

                    str_html = str_html + `
                    <div class="input-group `+dom_tag+`">
                          <div class="input-group-prepend">
                            <label class="input-group-text">`+param.intro_lbl+`</label>
                          </div>
                          <div data-att-value="`+k_attribute+`" data-id="`+elem.data.id+`" id="`+a_dom_id+`" class="save-value check-input-group">`+str_options+`</div>
                    </div>
                    `;
                  break;

          case 'input-text':
                str_html = str_html + `
                <div class="input-group `+dom_tag+`">
                  <div class="input-group-prepend">
                    <label class="input-group-text">`+param.intro_lbl+`</label>
                  </div>
                  <input data-id="`+elem.data.id+`" id="`+a_dom_id+`" class="save-value att-handler" value="`+dom_value+`" data-att-value="`+k_attribute+`" class="`+a_dom_class+`" type="text" disabled></input>
                </div>
                `;
                break;

          case 'select-file':
                  dom_value = interface_instance.label_handler(a_dom_id, {value: dom_value, elem: elem});
                  var str_options = `<option selected>Select source</option>
                                    <option id='`+a_dom_id+`_optfile' value='file'>File\/s</option>
                                    <option id='`+a_dom_id+`_optdir' value='dir'>Directory</option>`;

                  str_html = str_html +`
                  <div class="input-group btn-group `+dom_tag+`">
                      <div class="input-group-prepend">
                        <label class="input-group-text">`+param.intro_lbl+`</label>
                      </div>
                      <select data-att-value="`+k_attribute+`" data-id="`+elem.data.id+`" id="`+a_dom_id+`" class="`+a_dom_class+` att-handler save-value custom-select" disabled>`+str_options+`</select>
                      <input data-id="`+elem.data.id+`" type="file" id="`+a_dom_id+`_file" style="display: none;" multiple="true"/>
                      <input data-id="`+elem.data.id+`" type="file" id="`+a_dom_id+`_dir" style="display: none;" webkitdirectory directory multiple="false"/>

                      <label id="`+a_dom_id+`__lbl" class="input-group-text" value="">`+dom_value+`</label>
                  </div>
                  `;
                  break;

            case 'edit':
                  str_html = str_html + `
                  <div class="foot-dom btn-edit">
                  <button id="edit" value="editoff" type="button" data-id="`+elem.data.id+`" class="`+a_dom_class+` btn btn-light">
                  `+param.intro_lbl+`</button></div>`;
                  break;

            case 'remove':
                  str_html = str_html + `
                  <div class="foot-dom btn-remove">
                  <button id="remove" type="button" data-id="`+elem.data.id+`" class="`+a_dom_class+` btn btn-light">
                  `+param.intro_lbl+`</button></div>`;
                  break;

          default:
        }
        return str_html;
      }

    }
    /* Setting the Events */
    set_must_events(){
      var interface_instance = this;
      //always do these default events
      $(document).on('keyup', '#control input', function(){
          var key_att = document.getElementById(this.id).getAttribute('data-att-value');
          interface_instance.set_dipam_temp_val(key_att,$(this).val());
      });
      $(document).on('keyup', '#workflow_extra input', function(){
          document.getElementById(this.id).setAttribute('data-att-value',$(this).val());
      });
    }
    set_control_section_events(elem){
      if ('_private' in elem) {
        elem = elem._private;
      }
      for (var k_dom_event in this.DOM_EVENT_ELEMS) {
        var list_dom_events = document.getElementsByClassName(k_dom_event);
        for (var i = 0; i < list_dom_events.length; i++) {
          this.set_a_dom_event(list_dom_events[i], k_dom_event, elem, this.DOM_EVENT_ELEMS[k_dom_event]);
        }
      }
    }
    set_a_dom_event(event_dom, dom_class, corresponding_elem = null, param = {}){
      var interface_instance = this;
      var diagram_instance = this.DIAGRAM_INSTANCE_OBJ;
      if ('_private' in corresponding_elem) {
        corresponding_elem = corresponding_elem._private;
      }

      switch (dom_class) {
          case 'edit-trigger':
              $(event_dom).on('click', function() {
                interface_instance.reset_dipam_temp_val();
                interface_instance.editing();
              });
              break;
          case 'cancel-trigger':
              $(event_dom).on('click', function() {
                interface_instance.editing("cancel");
              });
            break;
          case 'save-trigger':
            $(event_dom).on('click', function() {
              this.setAttribute("href","src/.data/workflow.json");

              var data_to_update = $.extend(true,{},interface_instance.editing("save"));
              interface_instance.reload_control_section(
                  diagram_instance.update_elem(
                    corresponding_elem.data.id,
                    corresponding_elem.data.type,
                    data_to_update
                    )
              );

              //Check if there are also files in the saved params
              //in this case upload them to server and save them
              var post_data = new FormData();
              for (var k_att in data_to_update) {
                if (k_att == 'p-file') {
                  Array.prototype.forEach.call(data_to_update[k_att], function(file,index) { post_data.append(k_att+'[]', file);});
                  for (var i = 0; i < data_to_update[k_att].length; i++) {
                    var file_att = {};
                    file_att["lastModified"] = data_to_update[k_att][i]["lastModified"];
                    file_att["name"] = data_to_update[k_att][i]["name"];
                    file_att["size"] = data_to_update[k_att][i]["size"];
                    post_data.append(k_att+'-att[]', JSON.stringify(file_att));
                  }
                }
              }

              $.ajax({
                url: "/upload",
                data: post_data,
                processData: false,
                contentType: false,
                type: 'POST',
                success: function(data) {}
              });
            });
            break;
          //Remove an element from the CY
          case 'remove-trigger':
              $(event_dom).on('click', function() {
                  diagram_instance.remove_elem(corresponding_elem.data.id);
                  interface_instance.removing();
                  interface_instance.show_undo_redo(
                    diagram_instance.get_undo_redo().isUndoStackEmpty(),
                    diagram_instance.get_undo_redo().isRedoStackEmpty()
                  );
              });
              break;
          case 'select-value-trigger':
                var dom_id = event_dom.getAttribute('id');
                $(event_dom).on('change', function(){
                    var arr_option_selected = $("#"+dom_id+" option:selected");
                    if (arr_option_selected.length > 0) {
                      interface_instance.set_dipam_temp_val(this.getAttribute('data-att-value'), arr_option_selected[0].value);
                      var is_data_elem_value = ($("#"+dom_id+".data-elem-value").length > 0);
                      //in case is a value update the param section
                      if (is_data_elem_value) {
                        var data_to_update = $.extend(true,{},interface_instance.editing("save"));
                        interface_instance.reload_control_section(
                            diagram_instance.update_elem(
                              corresponding_elem.data.id,
                              corresponding_elem.data.type,
                              data_to_update
                            ), true
                        );
                      }
                    };
                });
                break;
           case 'check-value-trigger':
                      $(event_dom).on('click', function(){
                          var father_id = this.getAttribute('data-select-target');
                          var check_value = this.getAttribute('value');
                          var att_key = document.getElementById(father_id).getAttribute('data-att-value');

                          var a_list = [];
                          var list_checked = $(".check-value-trigger:checked");
                          for (var l = 0; l < list_checked.length; l++) {
                            a_list.push(list_checked[l].getAttribute('value'));
                          }

                          interface_instance.set_dipam_temp_val(att_key, a_list);
                      });
                  break;
            case 'select-file-trigger':
                  var dom_id = event_dom.getAttribute('id');
                  $(event_dom).on('change', function(e){
                      e.preventDefault();
                      var arr_option_selected = $("#"+dom_id+" option:selected");
                      if (arr_option_selected.length > 0) {
                        var opt_value = arr_option_selected[0].value;
                        console.log(document.getElementById(dom_id+"_"+opt_value));
                        document.getElementById(dom_id+"_"+opt_value).click();
                      }
                  });

                  var a_dom_obj_lbl = document.getElementById(dom_id+"__lbl");

                  $( "#"+dom_id+"_file").on('change', function(){
                    console.log(this.value);
                    var data_att_value = this.files;
                    if(data_att_value){
                        var corresponding_lbl = interface_instance.label_handler(dom_id, {value: data_att_value, elem: corresponding_elem} );
                        a_dom_obj_lbl.innerHTML = corresponding_lbl;
                        var att_key = $("#"+dom_id)[0].getAttribute('data-att-value');
                        interface_instance.set_dipam_temp_val(att_key, data_att_value);
                    }
                  });
                  $( "#"+dom_id+"_dir").on('change', function(){
                    var data_att_value = this.files;
                    if(data_att_value){
                        var corresponding_lbl = interface_instance.label_handler(dom_id, {value: data_att_value, elem: corresponding_elem} );
                        a_dom_obj_lbl.innerHTML = corresponding_lbl;
                        var att_key = $("#"+dom_id)[0].getAttribute('data-att-value');
                        interface_instance.set_dipam_temp_val(att_key, data_att_value);
                    }
                  });
                  break;
            default:
      }
    }



    /*on click methods*/
    click_on_node(node){
      if ('_private' in node) {
        node = node._private;
      }
      this.build_info(node,'nodes');
      this.click_info_nav();
    }
    click_on_edge(edge){
      if ('_private' in edge) {
        edge = edge._private;
      }
      this.build_info(edge, 'edges');
      this.click_info_nav();
    }
    click_info_nav() {
      this.switch_nav('nav_info');
      this.DOMS.CONTROL.CONTAINER.innerHTML = this.info_section_html;
      var info_elem = this.info_section_elem;
      if (info_elem.elem) {
        this.set_must_events();
        this.set_control_section_events(info_elem.elem);
      }
    }
    click_overview_nav() {
      this.switch_nav('nav_overview');
      this.DOMS.CONTROL.CONTAINER.innerHTML = this.overview_section_html;
      var overview_elem = this.overview_section_elem;
      //this.set_section_events(this.OVERVIEW_SECTION[overview_elem.elem_class][overview_elem.elem.data.type], overview_elem.elem);
      this.set_must_events();
      this.set_control_section_events(overview_elem.elem);
    }
    switch_nav(nav_node_id) {
      for (var i = 0; i < document.getElementsByClassName('nav-btn').length; i++) {
        var obj = document.getElementsByClassName('nav-btn')[i];
        if(obj.id == nav_node_id){
          document.getElementsByClassName('nav-btn')[i].className = "nav-btn active";
        }else {
          document.getElementsByClassName('nav-btn')[i].className = "nav-btn";
        }
      }
    }


    label_handler(dom_id, param){
      var str = "";
      switch (dom_id) {
        case 'p-file':
            if (param.value != undefined) {
                    if (param.value == {}) {
                      str = "";
                    }else if (param.value.length == 1){
                      str = param.value[0].name;
                    }else if (param.value.length > 1){
                      str = param.value.length+ " files" ;
                    }
            }
        default:
      }
      return str;
    }




    get_active_nav(){
      for (var i = 0; i < document.getElementsByClassName('nav-btn').length; i++) {
        if (document.getElementsByClassName('nav-btn')[i].className == "nav-btn active") {
          return document.getElementsByClassName('nav-btn')[i].id.replace("nav_","").replace("a_","");
        }
      }
      return -1;
    }



    removing(){
      this.info_section_html = "";
      this.click_overview_nav();
    }

    editing(action = null){
      this._switch_edit_doms();
      return this.set_edit_section(action);
    }

    _switch_edit_doms(){
      var current_flag = false;
      var arr_doms_toedit = document.getElementsByClassName('att-handler');
      for (var i = 0; i < arr_doms_toedit.length; i++) {
        if (i == 0) {
           current_flag = arr_doms_toedit[i].disabled;
        }
        arr_doms_toedit[i].disabled = !current_flag;
      }
      var newflag = "editon";
      if (!current_flag == true) {
        newflag = "editoff";
      }
      document.getElementById('edit').setAttribute('value',newflag);
    }

    set_edit_section(action = null){
      var res = 1;
      var editdom = document.getElementById('edit');
      var removedom = document.getElementById('remove');
      var data_elem_id = editdom.getAttribute('data-id');
      editdom.style.display = 'none';
      removedom.style.display = 'none';

      var edit_value = editdom.getAttribute('value');

      //if i am not yet in editing mode then the edit section should be built first
      if (edit_value == 'editon') {
        var two_buttons_dom = `<div id="edit_buttons" class="foot-dom">
                               <span><button id='cancel' type='button' class='cancel-trigger btn btn-default edit-switch'>Cancel</button></span>
                               <span>
                               <button id='save' type='button' class='save-trigger btn btn-default edit-switch'>Save</button></span>
                               </div>`;
        editdom.parentNode.parentNode.innerHTML = two_buttons_dom + editdom.parentNode.parentNode.innerHTML;
        //set events
        var corresponding_elem = this.DIAGRAM_INSTANCE_OBJ.get_gen_elem_by_id(data_elem_id);
        //console.log(corresponding_elem);

        this.set_a_dom_event(document.getElementById("cancel"),"cancel-trigger", corresponding_elem);
        this.set_a_dom_event(document.getElementById("save"),"save-trigger", corresponding_elem);

      }else {
        //I am already in editing mode (the edit section have been already built)
        //check what action I should take now

        //remove the edit buttons
        if (document.getElementById('edit_buttons') != undefined) {
          document.getElementById('edit_buttons').remove();
        }

        //finish editing the doms
        //editdom.setAttribute('value','editoff');

        editdom.style.display = 'block';
        removedom.style.display = 'block';

        //do the corresponding function corresponding to the choice/action made
        switch (action) {
          case 'cancel':
            editdom.setAttribute('value','editoff');
            this.reload_control_section();
            break;
          case 'save':
            editdom.setAttribute('value','editoff');
            res = this.save();
            break;
          default:
        }
      }
      return res;
    }

    reload_control_section(new_elem = null, update_control_params = false){

      var active_nav = this.get_active_nav();

      //check in which section I was
      if (active_nav == 'overview'){
        //in case the overview attributes have been updated/edited
        if (new_elem != null) {
          this.build_overview(new_elem);
        }
        this.click_overview_nav();
        //this.DOMS.CONTROL.OVERVIEW_BTN.click();
      }else if (active_nav == 'info') {
        //in case an element (node/edge) have been updated/edited
        if (new_elem != null) {
          if ('_private' in new_elem) {
            new_elem = new_elem._private;
          }
          this.build_info(new_elem, update_control_params);
        }
        this.click_info_nav();
        //this.DOMS.CONTROL.INFO_BTN.click();
      }
    }

    save() {
      var arr_modified_doms = document.getElementsByClassName('save-value');

      var res_value = {};
      for (var i = 0; i < arr_modified_doms.length; i++) {
        var obj_dom = arr_modified_doms[i];
        var ele_target_att = obj_dom.getAttribute('data-att-value');
        res_value[ele_target_att] = this.get_dipam_temp_val(ele_target_att);
      }
      return res_value;
    }

  click_load_workflow(){

  }


  click_run_workflow(){
    var new_status = -1;
    var new_lbl_status = -1;
    var workflow_status = this.DOMS.WORKFLOW.RUN_BTN.value;

    if (workflow_status == 'ready') {
      _disable_divs(this,true);
      new_status = 'run';
      new_lbl_status = "Stop process";

    }else if (workflow_status == 'run') {
      _disable_divs(this,true);
      new_status = 'stop';
      new_lbl_status = "Reset";

    }else if (workflow_status == 'stop') {
      _disable_divs(this,false);
      new_status = "ready";
      new_lbl_status = "Run workflow";

    }

    this.DOMS.WORKFLOW.RUN_BTN.value = new_status;
    this.DOMS.WORKFLOW.RUN_BTN.innerHTML = new_lbl_status;
    return new_status;

    function _disable_divs(instance,disable){
      var p_event = 'none';
      var opacity_val = '0.3';
      if (!(disable)) {
        p_event = '';
        opacity_val = '';
      }

      instance.DOMS.DIAGRAM.CONTAINER.style["pointer-events"] = p_event;
      //instance.DOMS.DIAGRAM.CONTAINER.style["opacity"] = opacity_val;
      //set all single nodes style
      var all_nodes = instance.DIAGRAM_INSTANCE_OBJ.get_nodes();
      for (var i = 0; i < all_nodes.length; i++) {
        all_nodes[i].style({"opacity" : opacity_val});
      }

      instance.DOMS.DIAGRAM.EDITOR_CONTAINER.style["pointer-events"] = p_event;
      //instance.DOMS.DIAGRAM.EDITOR_CONTAINER.style["opacity"] = opacity_val;
      instance.DOMS.DIAGRAM.ADD_TOOL_BTN.style["opacity"] = opacity_val;
      instance.DOMS.DIAGRAM.ADD_DATA_BTN.style["opacity"] = opacity_val;

      instance.DOMS.DIAGRAM.ZOOM_CONTAINER.style["pointer-events"] = p_event;
      instance.DOMS.DIAGRAM.ZOOM_CONTAINER.style["opacity"] = opacity_val;

      instance.DOMS.DIAGRAM.FIT_CONTAINER.style["pointer-events"] = p_event;
      instance.DOMS.DIAGRAM.FIT_CONTAINER.style["opacity"] = opacity_val;

      instance.DOMS.DIAGRAM.UNDO_REDO_CONTAINER.style["pointer-events"] = p_event;
      instance.DOMS.DIAGRAM.UNDO_REDO_CONTAINER.style["opacity"] = opacity_val;

      instance.DOMS.CONTROL.NAV_CONTAINER.style["pointer-events"] = p_event;
      instance.DOMS.CONTROL.NAV_CONTAINER.style["opacity"] = opacity_val;

      instance.DOMS.CONTROL.CONTAINER.style["pointer-events"] = p_event;
      instance.DOMS.CONTROL.CONTAINER.style["opacity"] = opacity_val;

      var control_inputs = document.getElementsByClassName('check-value-trigger');
      console.log(control_inputs);
      for (var i = 0; i < control_inputs.length; i++) {
        control_inputs[i].disabled = true;
      }

      //instance.TIMELINE_CONTAINER.innerHTML = "";
      if (!(disable)) {
        [...document.getElementsByClassName('timeline-block-inner')].map(n => n && n.remove());
      }
      //instance.TIMELINE_TEXT.innerHTML = "Workflow timeline ...";
      instance.DOMS.WORKFLOW.END_BLOCK.style.visibility = 'hidden';
    }
  }

  //Executes all the workflow
  handle_workflow(status, param){
    var interface_instance = this;
    if (status == 'run') {
      this.request_status_on = true;
      this.workflow = param;
      var workflow_to_process = this.workflow;
      var index_processed = {};
      var terminals = this.DIAGRAM_INSTANCE_OBJ.get_terminal_tools();
      console.log(terminals);

      //process workflow
      $.ajax({
        url: "/reset",
        type: 'GET',
        success: function(data) {
              //console.log("reset temp data");
              if (data.startsWith("Error:")) {
                console.log("Could not reset temp data!");
              }else {
                _process_workflow(interface_instance,0,terminals);
              }
          }
      });

    }else if (status == 'stop') {
      //Stop the execution and abort all the running functions
      window.stop();
      this.request_status_on = false;
      console.log("Process stopped!");
    }else if (status == 'ready') {
      this.request_status_on = true;
      console.log("Ready again!");
    }

    function _process_workflow(instance,i,terminals){

            var w_elem = workflow_to_process[i];
            console.log("Process: ", w_elem)
            //check if is a terminal

            //call the server
            var data_to_post = _gen_form_data(w_elem);

            $.ajax({
              url: "/process",
              data: data_to_post,
              processData: false,
              contentType: false,
              type: 'POST',
              success: function(data) {
                    if (data.startsWith("Error:")) {
                      instance.add_timeline_block(w_elem.id, w_elem.type, w_elem.name, true, data);
                    }else {
                      instance.in_light_node(w_elem.id);
                      instance.add_timeline_block(w_elem.id, w_elem.type, w_elem.name);
                      //process next node
                      if (i == workflow_to_process.length - 1) {
                        console.log("Done All !!");
                        instance.process_terminals(terminals);
                        instance.DOMS.WORKFLOW.END_BLOCK.style.visibility = 'visible';
                        instance.DOMS.WORKFLOW.RUN_BTN.innerHTML = "Process done";
                        instance.DOMS.WORKFLOW.RUN_BTN.value = "stop";
                      }else {
                        if (instance.request_status_on) {
                          _process_workflow(instance,i+1,terminals);
                        }
                      }
                    }
                }
            });

            /*normalize the file list in a form type*/
            function _gen_form_data(elem_data){
              var post_data = new FormData();

              /*The array and object elements should be normalized for Post*/
              /* The node data are:
                1) The MUST-ATT: id, name, value, type
                2) The WORKFLOW-ATT: class, input, output, compatible_input
                3) The PARAM-ATT: e.g: 'p-file'
                4) The GRAPH-ATT: e.g: 'position'
              */
              for (var an_att in elem_data) {
                  var list_att = {};
                  list_att[an_att] = elem_data[an_att];

                  if ((an_att == 'workflow') || (an_att == 'param') || (an_att == 'graph')) {
                    list_att = elem_data[an_att];
                    for (var v_att in elem_data[an_att]) {
                      post_data.append(an_att+'[]', v_att);
                    }
                  }

                  for (var a_k in list_att) {
                    var val_of_att = list_att[a_k];
                    if (a_k == 'p-file') {
                      Array.prototype.forEach.call(val_of_att, function(file,index) { post_data.append(a_k+'[]', file);});
                    }else {
                      if (Array.isArray(val_of_att)) {
                        //form_data.append(a_k, JSON.stringify(w_elem[a_k]));
                        // Append files to files array
                        for (let i = 0; i < val_of_att.length; i++) {
                          let elem_i = val_of_att[i];
                          post_data.append(a_k+'[]', elem_i);
                        }
                      }else if (val_of_att instanceof Object) {
                        post_data.append(a_k, JSON.stringify(w_elem[a_k]));
                      }else {
                        post_data.append(a_k, val_of_att);
                      }
                    }
                  }
              }
              return post_data;
            }
      }
  }
  process_terminals(terminals){
    var interface_instance = this;
    for (var i = 0; i < terminals.length; i++) {
      var node_id = terminals[i].id;

      var dom_elems = document.getElementsByClassName('timeline-block-inner');
      var last_dom = this.DOMS.WORKFLOW.START_BLOCK;
      for (var j = 0; j < dom_elems.length; j++) {
        last_dom = dom_elems[j];
        if(last_dom.getAttribute('data-value') == node_id){
          break;
        }
      }

      /*switch according to the terminal tool value*/
      var a_linker_dom = null;
      switch (terminals[i].value) {
        case "t-save-files":
          a_linker_dom = document.createElement("a");
          a_linker_dom.setAttribute("value",node_id);
          a_linker_dom.target = "_blank";
          a_linker_dom.innerHTML = "Save";
          a_linker_dom.href = "/download/"+node_id+"?time="+(new Date().getTime()).toString();
          last_dom.innerHTML = last_dom.innerHTML + "<div class='inner-timeline-block'>"+a_linker_dom.outerHTML+"</div>";
          break;

        case "t-doctopics-view":
          a_linker_dom = document.createElement("a");
          a_linker_dom.setAttribute("value",node_id);
          a_linker_dom.innerHTML = "Show";
          a_linker_dom.href = "/gettoolfile?id="+node_id+"&type=img&result=file&time="+(new Date().getTime()).toString();
          a_linker_dom.setAttribute("data-lightbox",node_id);
          last_dom.innerHTML = last_dom.innerHTML + "<div class='inner-timeline-block'>"+a_linker_dom.outerHTML+"</div>";
          //$.get( "/gettoolfile?id="+node_id+"&type=img&result=file").done(function(res) {interface_instance.build_linker_timelineblock(node_id,res)});
          break;

        case "t-topics-view":
          a_linker_dom = document.createElement("a");
          a_linker_dom.setAttribute("value",node_id);
          a_linker_dom.innerHTML = "Show";
          a_linker_dom.href = "/gettoolfile?id="+node_id+"&type=img&result=file&time="+(new Date().getTime()).toString();
          a_linker_dom.setAttribute("data-lightbox",node_id);
          last_dom.innerHTML = last_dom.innerHTML + "<div class='inner-timeline-block'>"+a_linker_dom.outerHTML+"</div>";
          //$.get( "/gettoolfile?id="+node_id+"&type=img&result=file").done(function(res) {interface_instance.build_linker_timelineblock(node_id,res)});
          break;
        default:
      }
    }
  }

  in_light_node(node_id){
    this.DIAGRAM_INSTANCE_OBJ.get_gen_elem_by_id(node_id).style({"opacity": "1"})
  }

  //add a html block to timeline and update percentage
  add_timeline_block(node_id, node_type, node_name, is_error = false, error_msg = ""){
    var extra_class = node_type+"-block";
    if (is_error) {
      extra_class = "error-block"
    }
    //this.TIMELINE_TEXT.innerHTML = "Workflow Done";
    var block_to_add = document.createElement("div");
    block_to_add.setAttribute("class", "timeline-block-inner "+extra_class);
    block_to_add.setAttribute("data-value", node_id);
    block_to_add.innerHTML = '<span class="tooltiptext">'+node_name+'</span>';


    var starting_block = this.DOMS.WORKFLOW.START_BLOCK;
    var found = false;

    var dom_elems = document.getElementsByClassName('timeline-block-inner');
    var last_dom = this.DOMS.WORKFLOW.START_BLOCK;
    for (var i = 0; i < dom_elems.length; i++) {
      last_dom = dom_elems[i];
      if(last_dom.getAttribute('data-value') == node_id){
        found = true;
      }
    }
    if (!found) {
      //_insert_after(block_to_add,this.DOMS.WORKFLOW.START_BLOCK);
      _insert_after(block_to_add,last_dom);
      if (is_error) {
        var err_block_msg = document.createElement("div");
        err_block_msg.setAttribute("class", "timeline-block-inner text-block");
        err_block_msg.setAttribute("data-value", node_id);
        err_block_msg.innerHTML = "<label>"+error_msg+"</label>";
        _insert_after(err_block_msg,block_to_add);
      }
    }



    function _insert_after(newNode, referenceNode) {
      referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }
  }

  show_undo_redo(undo_empty, redo_empty){
    this.show_undo(!undo_empty);
    this.show_redo(!redo_empty);
  }

  show_undo(flag= true){
    this.DOMS.DIAGRAM.UNDO_BTN.style.visibility = 'visible';
    if (!(flag)) {
      this.DOMS.DIAGRAM.UNDO_BTN.style.visibility = 'hidden';
    }
  }

  show_redo(flag= true){
    this.DOMS.DIAGRAM.REDO_BTN.style.visibility = 'visible';
    if (!(flag)) {
      this.DOMS.DIAGRAM.REDO_BTN.style.visibility = 'hidden';
    }
  }


  //************************************************************//
  //********* Events handlers **********************************//
  //************************************************************//
  //set all the interface events
  set_events(reload = false){

    var interface_instance = this;
    var diagram_instance = this.DIAGRAM_INSTANCE_OBJ;
    var diagram_cy = this.DIAGRAM_INSTANCE_CY;

    if (reload){
      _elem_onclick_handle();
      return 1;
    }


    //ADD Node and Tool Buttons
    $('#'+this.DOMS.DIAGRAM.ADD_DATA_BTN.getAttribute('id')).on({
      click: function(e) {
        diagram_instance.add_node('data');
        _elem_onclick_handle();
        interface_instance.show_undo_redo(diagram_instance.get_undo_redo().isUndoStackEmpty(),diagram_instance.get_undo_redo().isRedoStackEmpty());
        diagram_instance.get_diagram_obj().nodes()[diagram_instance.get_diagram_obj().nodes().length - 1].emit('click', []);
        document.getElementById('edit').click();
      }
    });
    $('#'+this.DOMS.DIAGRAM.ADD_TOOL_BTN.getAttribute('id')).on({
      click: function(e) {
        diagram_instance.add_node('tool');
        _elem_onclick_handle();
        interface_instance.show_undo_redo(diagram_instance.get_undo_redo().isUndoStackEmpty(),diagram_instance.get_undo_redo().isRedoStackEmpty());
        diagram_instance.get_diagram_obj().nodes()[diagram_instance.get_diagram_obj().nodes().length - 1].emit('click', []);
        document.getElementById('edit').click();
      }
    });


    //the info section Nav menu
    $( "#"+this.DOMS.CONTROL.OVERVIEW_BTN.getAttribute('id')).on("click", function() {
      interface_instance.click_overview_nav();
    });
    $( "#"+this.DOMS.CONTROL.INFO_BTN.getAttribute('id')).on("click", function() {
      interface_instance.click_info_nav();
    });

    //the undo/redo Nav menu
    $(this.DOMS.DIAGRAM.UNDO_BTN).on("click", function() {
      diagram_instance.cy_undo_redo.undo();
      interface_instance.show_undo_redo(
                  diagram_instance.get_undo_redo().isUndoStackEmpty(),
                  diagram_instance.get_undo_redo().isRedoStackEmpty());
    });
    $(this.DOMS.DIAGRAM.REDO_BTN).on("click", function() {
      diagram_instance.cy_undo_redo.redo();
      interface_instance.show_undo_redo(
                  diagram_instance.get_undo_redo().isUndoStackEmpty(),
                  diagram_instance.get_undo_redo().isRedoStackEmpty());
    });

    //the zoom in/out Nav menu
    $(this.DOMS.DIAGRAM.ZOOMIN_BTN).on("click", function() {
      diagram_instance.zoom_in();
    });
    $(this.DOMS.DIAGRAM.ZOOMOUT_BTN).on("click", function() {
      diagram_instance.zoom_out();
    });

    //the fit diagram
    $(this.DOMS.DIAGRAM.FIT_BTN).on("click", function() {
      diagram_instance.fit_diagram();
    });


    /*The Workflow buttons and correlated events*/
    $(this.DOMS.WORKFLOW.RUN_BTN).on({
        click: function(e) {
              e.preventDefault();
              diagram_instance.fit_diagram();
              var status = interface_instance.click_run_workflow();
              setTimeout(function(){ interface_instance.handle_workflow(status,diagram_instance.build_nodes_topological_ordering()); }, 2000);
        }
    });

    $( "#"+this.DOMS.WORKFLOW.SAVE_BTN.getAttribute('id')).on({
        click: function(e) {
          e.preventDefault();
          //interface_instance.click_save_workflow();
          var workflow_data = diagram_instance.get_workflow_data();
          console.log(workflow_data);
          $.post( "/saveworkflow"+"?time="+(new Date().getTime()).toString(), {
            workflow_data: JSON.stringify(workflow_data),
            path: "",
            name: "",
            load: "off"
          }).done(function() {
            interface_instance.DOMS.WORKFLOW.SAVE_BTN_DOWNLOAD.click();
          });
        }
    });


    $( "#"+this.DOMS.WORKFLOW.LOAD_BTN.getAttribute('id')).on({
        click: function(e) {
          e.preventDefault();
          $('#file_to_load').trigger('click');
        }
    });

    $('#file_to_load').on({
        change: function(e) {
          var file = $('#file_to_load')[0].files[0];
          if (file) {
            var reader = new FileReader();
            reader.readAsText(file, "UTF-8");
            reader.onload = function(e) {
                var result = e.target.result;
                //console.log(result);
                $.post( "/loadworkflow", {
                  workflow_file: result
                }).done(function() {
                  //$.get("/");
                  location.reload();
                });
            };
          }
        }
    });

    _elem_onclick_handle();

    function _elem_onclick_handle(){
        //nodes on click handler
        diagram_cy.nodes().on('click', function(e){
            console.log("Node clicked !", this._private.data.id,this);
            diagram_instance.click_elem_style(this,'node');
            diagram_instance.check_node_compatibility(this);
            interface_instance.click_on_node(this);
        });

        //edges on click handler
        diagram_cy.edges().on('click', function(e){
            console.log("Edge clicked !", this._private.data.id,this);
            diagram_instance.click_elem_style(this,'edge');
            interface_instance.click_on_edge(this);
        });
    }

  }
}
