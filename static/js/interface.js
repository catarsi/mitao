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
              "FIT_BTN": document.getElementById('fit_btn'),
              //remove elem
              "REMOVE_ELEM_CONTAINER": document.getElementById('remove_elem'),
          },
          "CONTROL": {
              "GUI": document.getElementById('gui'),
              "BASE": document.getElementById('control'),
              "CONTAINER": document.getElementById('control_body'),
              //"CONTAINER_MID": document.getElementById('control_mid'),
              //menu navigator
              "NAV_CONTAINER": document.getElementById('control_nav'),
              "INFO_BTN": document.getElementById('nav_info_a'),
              "OVERVIEW_BTN": document.getElementById('nav_overview_a'),
          },
          "WORKFLOW": {
              //buttons
              "OPT_TRIGGER": document.getElementById('list_options_trigger'),
              "OPT_LIST": document.getElementById('list_options'),
              "RUN_BTN": document.getElementById('btn_run_workflow'),
              "UPDATE_TOOL_BTN": document.getElementById('btn_update_tool'),
              "HELP_TOOL_BTN": document.getElementById('btn_help_tool'),
              "SAVE_BTN": document.getElementById('btn_save_workflow'),
              "SAVE_BTN_DOWNLOAD": document.getElementById('btn_save_workflow_a'),
              "LOAD_BTN": document.getElementById('btn_load_workflow'),
              "SHUTDOWN_BTN": document.getElementById('shutdown_btn'),
              //timeline
              "TIMELINE_CONTAINER": document.getElementById('timeline_container'),
              "START_BLOCK": document.getElementById('start_block'),
              "END_BLOCK": document.getElementById('end_block'),
              //extra section
              "EXTRA_CONTAINER": document.getElementById('workflow_extra'),
              //notifications
              "NOTE_BADGE": document.getElementById('badge_notification'),
          }
        };

        this.info_section_html = "";
        this.info_section_elem = {};
        this.overview_section_html = "";
        this.overview_section_elem = {};

        this.workflow = null;
        this.request_status_on = true;
        this.in_loading_status = false;

        this.DOMS.DIAGRAM.UNDO_BTN.style["pointer-events"] = "none";
        this.DOMS.DIAGRAM.UNDO_BTN.style["opacity"] = 0.3;
        this.DOMS.DIAGRAM.REDO_BTN.style["pointer-events"] = "none";
        this.DOMS.DIAGRAM.REDO_BTN.style["opacity"] = 0.3;
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
          'input-text-trigger': {},
          'input-text-large-trigger': {},
          'input-text-group-trigger': {},
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

    check_version(){
      var interface_instance = this;
      $.ajax({
        url: "/check_tool",
        type: 'GET',
        success: function(data) {
              data = JSON.parse(data);
              console.log(data);
              if (!(data["is_ready"])) {
                interface_instance.DOMS.WORKFLOW.NOTE_BADGE.style.display = "block";
                //$(interface_instance.DOMS.WORKFLOW.UPDATE_TOOL_BTN).toggleClass("disable-elem");
                $(interface_instance.DOMS.WORKFLOW.UPDATE_TOOL_BTN).addClass("to-do-style");
              }else {
                interface_instance.DOMS.WORKFLOW.NOTE_BADGE.style.display = "none";
                $(interface_instance.DOMS.WORKFLOW.UPDATE_TOOL_BTN).removeClass("to-do-style");
              }
          }
      });
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
      this.DOMS.CONTROL.BASE.className = elem.data.type;
    }

    build_control_section(elem, update_control_params = false){
      var interface_instance = this;
      var diagram_instance = this.DIAGRAM_INSTANCE_OBJ;
      var res_str_html = "";
      var fixed_elems = ['id','type','source','target','class','input','output','compatible_input'];
      var foot_buttons = ['edit', 'remove', 'save'];
      if (elem.data.type == 'diagram') {
        //foot_buttons = ['edit'];
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
              a_dom_str = _build_logo_dom(elem.data.type) + _build_a_dom("input-text", elem, k_attribute, {intro_lbl: "Name:"});
              break;
            case 'value':
              //is a dropdown
              this.set_dipam_temp_val(k_attribute,elem.data.value);
              var res_elem_type = diagram_instance.get_conf_elems(elem.data.type, ['[KEY]','label','input_ready','class_label']);
              if (elem.data.type == "edge") {
                res_elem_type = {'[KEY]': ["edge"],'label': ["Edge"],'input_ready':[true],'class_label':["General"]};
              }
              a_dom_str = _build_a_dom("select-value", elem, k_attribute, {intro_lbl: "Type:", value: res_elem_type['[KEY]'], input_ready: res_elem_type['input_ready'], label: res_elem_type['label'], class_label: res_elem_type['class_label']});
              break;

            case 'param':
              //is a param
              //var sorted_params = Object.keys(elem.data.param).sort();
              var l_conf_params = diagram_instance.get_conf_att(elem.data.type, elem.data.value, null)["param"];
              if (l_conf_params != undefined) {
                for (var k = 0; k < l_conf_params.length; k++) {
                      var k_param = l_conf_params[k];
                      var para_obj = diagram_instance.get_conf_att("param",k_param, null);
                      var para_val = para_obj.value;
                      if (para_val != -1) {
                        all_param_doms_str = all_param_doms_str + _build_a_dom(para_obj.handler, elem, k_param, {intro_lbl: para_obj.label, placeholder:para_obj.placeholder, value: para_obj.value, label: para_obj.value_label, group:para_obj.group}, true);
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
          }
          res_str_html = res_str_html + a_dom_str;
        }
      }

      //info and input output
      //corresponding info and details about it

      var input_output_info_str = "";
      var description_str = "";
      var elem_conf_obj = diagram_instance.get_conf_att(elem.data.type, elem.data.value, null);
      description_str = _build_description(elem_conf_obj['description']);
      if (description_str != "") {
        description_str = "<div class='info-box'>"+ description_str + "</div>";
      }
      input_output_info_str = _build_info(elem.data);
      if (input_output_info_str.length > 0) {
        input_output_info_str = "<div class='info-box'>"+ input_output_info_str + "</div>";
      }

      res_str_html = res_str_html + description_str + input_output_info_str + "<div class='control-params'>"+ all_param_doms_str + '</div></div>';
      //console.log(this.temp_dipam_value);

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

      function _build_description(str){
        if (str == undefined) {
          return "";
        }else {
          return _build_open_trigger("Description")+"<div class='content' style='display: none'>"+str+"</div>";
        }
      }
      function _build_info(elem_data){
        var input_output_info_str = "";
        if (elem_data.type == "tool") {
          var a_tool_obj = diagram_instance.get_conf_att("tool", elem_data.value, null);
          var inputs_index = []
          var optional_input_info_str = "";
          if ("optional_input" in a_tool_obj) {
            for (var u = 0; u < a_tool_obj["optional_input"].length; u++) {
              var a_data_obj = diagram_instance.get_conf_att("data", a_tool_obj["optional_input"][u], null);
              optional_input_info_str = optional_input_info_str +"&rarr; "+ a_data_obj["label"] + " (optional)<p>";
              inputs_index.push(a_data_obj["label"]);
            }
          }
          var required_input_info_str = "";
          for (var u = 0; u < a_tool_obj["compatible_input"].length; u++) {
            var a_data_obj = diagram_instance.get_conf_att("data", a_tool_obj["compatible_input"][u], null);
            if (inputs_index.indexOf(a_data_obj["label"]) == -1) {
              required_input_info_str = required_input_info_str +"&rarr; "+ a_data_obj["label"] +"<p>";
            }
          }
          var title_input = ""
          if ((required_input_info_str.length > 0) || (optional_input_info_str.length > 0)) {
            title_input = '<div class="title">Input:</div>'
          }
          input_output_info_str = title_input + required_input_info_str + optional_input_info_str;

          var output_info_str = "";
          if ("output" in a_tool_obj) {
            for (var u = 0; u < a_tool_obj["output"].length; u++) {
              var a_data_obj = diagram_instance.get_conf_att("data", a_tool_obj["output"][u], null);
              output_info_str = output_info_str +"&rarr; "+ a_data_obj["label"] +"<p>";
            }
          }
          title_input = ""
          if (output_info_str.length > 0){
            title_input = '<div class="title">Output:</div>'
          }
          input_output_info_str = _build_open_trigger("Inputs and Outputs")+"<div class='content' style='display: none'>"+ input_output_info_str + title_input + output_info_str+"</div>";
        }
        return input_output_info_str;
      }
      function _build_open_trigger(title){
        var svg_closed = '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-up" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/></svg>';
        var svg_open = '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>';
        var html_btn = `<button class="open-box-trigger" data-title="`+title+`" type="button">`+title+` `+svg_closed+`</button>`;
        return html_btn;
      }
      function _build_logo_dom(elem_type){
        var html_logo = "<div class='elem-logo'>";
        switch (elem_type) {
          case "tool":
            html_logo += '<svg class="bi bi-tools" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M0 1l1-1 3.081 2.2a1 1 0 0 1 .419.815v.07a1 1 0 0 0 .293.708L10.5 9.5l.914-.305a1 1 0 0 1 1.023.242l3.356 3.356a1 1 0 0 1 0 1.414l-1.586 1.586a1 1 0 0 1-1.414 0l-3.356-3.356a1 1 0 0 1-.242-1.023L9.5 10.5 3.793 4.793a1 1 0 0 0-.707-.293h-.071a1 1 0 0 1-.814-.419L0 1zm11.354 9.646a.5.5 0 0 0-.708.708l3 3a.5.5 0 0 0 .708-.708l-3-3z"/><path fill-rule="evenodd" d="M15.898 2.223a3.003 3.003 0 0 1-3.679 3.674L5.878 12.15a3 3 0 1 1-2.027-2.027l6.252-6.341A3 3 0 0 1 13.778.1l-2.142 2.142L12 4l1.757.364 2.141-2.141zm-13.37 9.019L3.001 11l.471.242.529.026.287.445.445.287.026.529L5 13l-.242.471-.026.529-.445.287-.287.445-.529.026L3 15l-.471-.242L2 14.732l-.287-.445L1.268 14l-.026-.529L1 13l.242-.471.026-.529.445-.287.287-.445.529-.026z"/></svg>';
            break;
          case "data":
            html_logo += '<svg class="bi bi-archive-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M12.643 15C13.979 15 15 13.845 15 12.5V5H1v7.5C1 13.845 2.021 15 3.357 15h9.286zM6 7a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1H6zM.8 1a.8.8 0 0 0-.8.8V3a.8.8 0 0 0 .8.8h14.4A.8.8 0 0 0 16 3V1.8a.8.8 0 0 0-.8-.8H.8z"/></svg>';
            break;
          case "diagram":
            html_logo += '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-diagram-2-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M3 11.5A1.5 1.5 0 0 1 4.5 10h1A1.5 1.5 0 0 1 7 11.5v1A1.5 1.5 0 0 1 5.5 14h-1A1.5 1.5 0 0 1 3 12.5v-1zm6 0a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 9 12.5v-1zm-3-8A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6h-1A1.5 1.5 0 0 1 6 4.5v-1z"/><path fill-rule="evenodd" d="M8 5a.5.5 0 0 1 .5.5V7H11a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 5 7h2.5V5.5A.5.5 0 0 1 8 5z"/></svg>';
            break;
          case "edge":
            html_logo += '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-arrow-up-left" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M2.5 4a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1H3.5V9a.5.5 0 0 1-1 0V4z"/><path fill-rule="evenodd" d="M2.646 3.646a.5.5 0 0 1 .708 0l9 9a.5.5 0 0 1-.708.708l-9-9a.5.5 0 0 1 0-.708z"/></svg>';
            break;
          default:
        }
        html_logo += "</div>";
        return html_logo;
      }
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
        var group_class = "";
        if ("group" in param) {
          if (param["group"] == true) {
            group_class = "group";
          }else {
            group_class = "ungroup";
          }
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
                          var add_opt = is_param;
                          if (!(add_opt)) {
                            if (param.input_ready[j]) {
                              add_opt = true;
                            }
                          }
                          if (add_opt) {
                            var selected_val = "";
                            if (param.value[j] == dom_value) {
                              selected_val = "selected";
                            }
                            str_options = str_options + "<option data-select-target='"+a_dom_id+"' value='"+param.value[j]+"' "+selected_val+">"+param.label[j]+"</option>";
                          }
                    }

                };
                str_options = str_options + "</optgroup>";
              }

              str_html = str_html + `
              <div class="input-group `+dom_tag+` `+group_class+`">
                      <div class="input-group-prepend">
                        <label class="input-group-text">`+param.intro_lbl+`</label>
                      </div>
                      <select data-att-value="`+k_attribute+`" data-id="`+elem.data.id+`" id="`+a_dom_id+`" class="`+a_dom_class+` att-handler save-value custom-select" >`+str_options+`</select>
              </div>`;
              break;

          case 'check-value':
                 var group_title = '';
                 if (param.intro_lbl != null) {
                   group_title = '<div class="input-group-prepend"><label class="input-group-text">'+param.intro_lbl+'</label></div>';
                 }

                 var selected_val = "";
                 if (dom_value) {
                   selected_val = "checked";
                 }
                 str_html = str_html +
                    `<div class="input-group `+dom_tag+` `+group_class+`">`+
                    group_title +
                    `<input `+selected_val+` type="checkbox" class="`+a_dom_class+` save-value att-handler" data-att-value="`+k_attribute+`" data-id="`+elem.data.id+`" id="`+a_dom_id+`"><label>`+param.label+`</label>
                    </div>`;
                 break;

          case 'input-text':
                var placeholder_str = "";
                if (param.placeholder != undefined){
                  placeholder_str = 'placeholder="'+param.placeholder+'"';
                }
                var input_value_html = "";
                if (dom_value != undefined){
                  input_value_html = 'value="'+dom_value+'"';
                }
                str_html = str_html + `
                <div class="input-group `+dom_tag+` `+group_class+`">
                  <div class="input-group-prepend">
                    <label class="input-group-text">`+param.intro_lbl+`</label>
                  </div>
                  <input `+placeholder_str+` data-id="`+elem.data.id+`" id="`+a_dom_id+`" class="`+a_dom_class+` save-value att-handler" `+input_value_html+` data-att-value="`+k_attribute+`" type="text" ></input>
                </div>
                `;
                break;

          case 'input-text-large':
                var placeholder_str = "";
                if (param.placeholder != undefined){
                  placeholder_str = 'placeholder="'+param.placeholder+'"';
                }
                var input_value_html = "";
                var str_value_html = "";
                if (dom_value != undefined){
                  str_value_html = dom_value;
                  input_value_html = 'value="'+dom_value+'"';
                }
                str_html = str_html + `
                <div class="input-group `+dom_tag+` `+group_class+`">
                  <div class="input-group-prepend">
                    <label class="input-group-text">`+param.intro_lbl+`</label>
                  </div>
                  <textarea `+placeholder_str+` data-id="`+elem.data.id+`" id="`+a_dom_id+`" class="`+a_dom_class+` save-value att-handler" `+input_value_html+` data-att-value="`+k_attribute+`" type="text" >`+ str_value_html.replace(/\\n/g,"&#13;&#10;")+`</textarea>
                </div>
                `;
                break;

          case 'input-text-group':
                      var g_inputs = `<div data-id="`+elem.data.id+`" id="`+a_dom_id+`" class="g-headers `+a_dom_class+` save-value att-handler" data-att-value="`+k_attribute+`">`;

                      //get the rows with their corresponding values
                      //att[[EQUALS]]ff[[ATT]]type[[EQUALS]][[ATT]]regex[[EQUALS]]
                      console.log(dom_value);
                      var rows = null;
                      var index_rows = new Array(1).fill(-1);
                      if (dom_value != null) {
                        rows = dom_value.split("[[RULE]]");
                        index_rows = new Array(rows.length).fill(-1);
                        for (var i = 0; i < rows.length; i++) {
                          var cells = rows[i].split("[[ATT]]");
                          for (var j = 0; j < cells.length; j++) {
                            var vals = cells[j].split("[[EQUALS]]");
                            if (index_rows[i] == -1) {
                              index_rows[i] = {};
                            }
                            index_rows[i][vals[0]] = vals[1];
                          }
                        }
                      }


                      var input_text_header = `<tr><td>`;
                      var columns = [];
                      for (var i = 0; i < param.label.length; i++) {
                        input_text_header = input_text_header + "<div>"+param.label[i]+"</div>";
                        if (columns.indexOf(param.value[i]) == -1) {
                          columns.push(param.value[i]);
                        }
                      }
                      input_text_header = input_text_header + `</td><td><button type="button" data-value="`+param.value+`" class="add_att_regex">+</button></td></tr>`;

                      var input_text_row_pattern = "";
                      for (var i = 0; i < index_rows.length; i++) {
                        input_text_row_pattern = input_text_row_pattern + `<tr><td>`;
                        var a_row = index_rows[i];
                        for (var j = 0; j < columns.length; j++) {
                          var input_val = a_row[columns[j]];
                          if (input_val == undefined) {
                            input_val = "";
                          }
                          var placeholder_str = "";
                          if (param.placeholder != undefined){
                            placeholder_str = 'placeholder="'+param.placeholder[j]+'"';
                          }

                          input_text_row_pattern = input_text_row_pattern + `<input `+placeholder_str+` value="`+input_val+`" class=`+columns[j]+` type="text"></input>`;
                        }
                        if (i > 0) {
                            input_text_row_pattern = input_text_row_pattern + `</td><td><button type="button" class="del_att_regex">-</button></td></tr>`+`</tr>`;
                        }else {
                            input_text_row_pattern = input_text_row_pattern + `</td><td></td></tr>`+`</tr>`;
                        }
                      }

                      str_html = str_html + `
                      <div class="input-group `+dom_tag+` `+group_class+`">
                        <div class="input-group-prepend">
                          <label class="input-group-text">`+param.intro_lbl+`</label>
                        </div>
                        `+g_inputs +`<table>`+ input_text_header + input_text_row_pattern + `</table></div>
                      </div>`;
                break;

          case 'select-file':
                  dom_value = interface_instance.label_handler(a_dom_id, {value: dom_value, elem: elem});
                  var str_options = `<option selected>Select source</option>
                                    <option id='`+a_dom_id+`_optfile' value='file'>File\/s</option>
                                    <option id='`+a_dom_id+`_optdir' value='dir'>Directory</option>`;

                  str_html = str_html +`
                  <div class="input-group btn-group `+dom_tag+` `+group_class+`">
                      <div class="input-group-prepend">
                        <label class="input-group-text">`+param.intro_lbl+`</label>
                      </div>
                      <select data-att-value="`+k_attribute+`" data-id="`+elem.data.id+`" id="`+a_dom_id+`" class="`+a_dom_class+` att-handler save-value custom-select" >`+str_options+`</select>
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

          case 'save':
                str_html = str_html + `<div id="edit_buttons" class="foot-dom">
                                       <span><button id='cancel' type='button' class='cancel-trigger btn btn-default edit-switch'>Cancel</button></span>
                                       <span>
                                       <button id='save' type='button' class='save-trigger btn btn-default edit-switch'>Save</button></span>
                                       </div>`;
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
          //var key_att = document.getElementById(this.id).getAttribute('data-att-value');
          //interface_instance.set_dipam_temp_val(key_att,$(this).val());
      });
      $(document).on('keyup', '#workflow_extra input', function(){
          //document.getElementById(this.id).setAttribute('data-att-value',$(this).val());
      });
      // delete with keyboard diagram items
      //TODO Check UNDO REDO ISSUE
      $('body').one("keydown", function(event){
      //$('body').keyup(function(event){
          if ((event.keyCode == 8) || (event.keyCode == 46)){
            if ((interface_instance.info_section_elem['elem_class'] == "nodes") || (interface_instance.info_section_elem['elem_class'] == "edges")) {
              var focused_elems = $(':focus');
              if ((interface_instance.info_section_elem['elem'] != null) && (focused_elems.length == 0))  {
                //document.getElementById('remove').click();
              }
            }
          }
       });

      $('.open-box-trigger').on( "click", function() {
          var current_display_val =  $( this ).next().css( "display");
          var svg_closed = '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-up" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/></svg>';
          var svg_open = '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>';
          console.log(current_display_val);
          if (current_display_val == "none") {
            $( this ).next().css( "display","block");
            $( this ).html($( this ).attr("data-title") +" "+ svg_open);
          }else {
            if (current_display_val == "block") {
              $( this ).next().css( "display","none");
              $( this ).html($( this ).attr("data-title") +" "+ svg_closed);
            }
          }
       });

      $(interface_instance.DOMS.WORKFLOW.UPDATE_TOOL_BTN).on( "click", function() {

        function __update(tag = "write") {
          $('.hover_bkgr_fricc').addClass("not-active");
          $(interface_instance.DOMS.CONTROL.GUI).addClass("disable-elem");
          $('.hover_bkgr_fricc .content').html(`
            <img class="mitao-logo" src="getlogo" alt="mitao">
            <p>Updating MITAO ... <br>(This process might take several minutes. Please don't close the application)</p>
            `);
          $.ajax({
            url: "/update_tool/"+tag,
            type: 'GET',
            success: function(data) {
                  data = JSON.parse(data);
                  $(interface_instance.DOMS.CONTROL.GUI).removeClass("disable-elem");
                  $('.popupCloseButton').click();
                  console.log(data);
                  interface_instance.DOMS.WORKFLOW.NOTE_BADGE.style.display = "none";
                  $(interface_instance.DOMS.WORKFLOW.UPDATE_TOOL_BTN).removeClass("to-do-style");
              }
          });
        }

        if ($(this).hasClass("to-do-style")) {
          $('.hover_bkgr_fricc').show();
          __update();
        }else {
            $('.hover_bkgr_fricc .content').html(`
              <img class="mitao-logo" src="getlogo" alt="mitao">
              <p>MITAO is updated!<br>Do you want to proceed anyway?</p>
              <button id="force_update_tool">Yes, force update anyway</button>
            `);
            $('.hover_bkgr_fricc').show();
            $("#force_update_tool").on( "click", function(){
              __update("overwrite");
            });
        }
      });



      $(interface_instance.DOMS.WORKFLOW.HELP_TOOL_BTN).on( "click", function() {

        $('.hover_bkgr_fricc .content').html(`
          <img class="mitao-logo" src="getlogo" alt="mitao">
          <p>This is MITAO, a Mashup Interface for Text Analysis Operations, is a new graphic-based, user friendly, open source software for performing topic modelling and other analysis on textual data.
          It permits the definition and execution of a visual text analysis workflow. The source code and documentation is available on the MITAO Github repository. MITAO is currently licensed under the ISC License.</p>
          <p>
            <a href="https://doi.org/10.19245/25.05.pij.5.2.3">Check the paper on MITAO</a><br>
            <a href="https://github.com/catarsi/mitao">Go to the git repository</a>
          </p>
          `);
        $('.hover_bkgr_fricc').show();
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

      function _check_undo_redo(){
        interface_instance.show_undo_redo(
          diagram_instance.get_undo_redo().isUndoStackEmpty(),
          diagram_instance.get_undo_redo().isRedoStackEmpty()
        );
      }

      if ('_private' in corresponding_elem) {
        corresponding_elem = corresponding_elem._private;
      }
      //console.log("corresponding_elem = ",corresponding_elem);

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
          case 'input-text-trigger':
            $(event_dom).on('change', function(){
              var scrol_pos = $("#control_mid").scrollTop();
              var att_key = this.getAttribute('data-att-value');
              var new_val = $(event_dom).val();
              interface_instance.set_dipam_temp_val(att_key, new_val);

              var data_to_update = $.extend(true,{},interface_instance.editing("save"));
              diagram_instance.update_elem(corresponding_elem.data.id, corresponding_elem.data.type, data_to_update);
              document.getElementById('save').click();
              _check_undo_redo();
              $("#control_mid").scrollTop(scrol_pos);
            });
            break;
          case 'input-text-large-trigger':
              $(event_dom).on('change', function(){
                var scrol_pos = $("#control_mid").scrollTop();
                var current_val = $(this).val();
                interface_instance.set_dipam_temp_val(this.getAttribute('data-att-value'),current_val);
                var data_to_update = $.extend(true,{},interface_instance.editing("save"));
                diagram_instance.update_elem(corresponding_elem.data.id, corresponding_elem.data.type, data_to_update);
                document.getElementById('save').click();
                $("#control_mid").scrollTop(scrol_pos);
              });
              break;
          case 'input-text-group-trigger':
                  $(event_dom).on('click','.add_att_regex', function(){
                    var column_list = String($(this).attr("data-value")).split(",");
                    var input_text_row_pattern = "<tr><td>";
                    for (var i = 0; i < column_list.length; i++) {
                      input_text_row_pattern = input_text_row_pattern + `<input class=`+column_list[i]+` type="text"></input>`;
                    }
                    var html_row = input_text_row_pattern + `</td><td><button type="button" class="del_att_regex">-</button></td></tr>`;
                    this.parentElement.parentElement.parentElement.innerHTML = this.parentElement.parentElement.parentElement.innerHTML + html_row;
                  });
                  $(event_dom).on('click','.del_att_regex', function(){
                    this.parentElement.parentElement.remove();
                  });
                  $(event_dom).on('change','input', function(){
                    var scrol_pos = $("#control_mid").scrollTop();
                    $(this).attr('value', $(this).val());
                    var list_inputs = $("."+dom_class+" input");
                    var index_inputs = {};
                    var num_rows = 0;
                    for (var i = 0; i < list_inputs.length; i++) {
                      var c_name = list_inputs[i].className;
                      if (!(c_name in index_inputs)) {
                        index_inputs[c_name] = [];
                      }
                      index_inputs[c_name].push(list_inputs[i].value)
                      if (index_inputs[c_name].length > num_rows) {
                        num_rows = index_inputs[c_name].length;
                      }
                    }

                    var new_value = "";
                    for (var i = 0; i < num_rows; i++) {
                      for (var k in index_inputs) {
                        new_value = new_value + k+"[[EQUALS]]"+index_inputs[k][i]+"[[ATT]]";
                      }
                      new_value = new_value.substring(0, new_value.length - 7) + "[[RULE]]";
                    }
                    new_value = new_value.substring(0, new_value.length - 8);

                    //console.log(index_inputs);
                    //console.log(new_value);

                    interface_instance.set_dipam_temp_val($(event_dom).attr('data-att-value'),new_value);
                    var data_to_update = $.extend(true,{},interface_instance.editing("save"));
                    diagram_instance.update_elem(corresponding_elem.data.id, corresponding_elem.data.type, data_to_update);
                    document.getElementById('save').click();
                    $("#control_mid").scrollTop(scrol_pos);
                  });
                  break;
          case 'select-value-trigger':
                var dom_id = event_dom.getAttribute('id');
                $(event_dom).on('change', function(){
                    var scrol_pos = $("#control_mid").scrollTop();

                    var arr_option_selected = $("#"+dom_id+" option:selected");
                    if (arr_option_selected.length > 0) {
                      interface_instance.set_dipam_temp_val(this.getAttribute('data-att-value'), arr_option_selected[0].value);
                      var is_data_elem_value = ($("#"+dom_id+".data-elem-value").length > 0);
                      //in case is a value update the param section
                      if (is_data_elem_value) {
                        var data_to_update = $.extend(true,{},interface_instance.editing("save"));
                        diagram_instance.update_elem(corresponding_elem.data.id, corresponding_elem.data.type, data_to_update);
                      }
                    };
                    interface_instance.editing("save");
                    document.getElementById('save').click();
                    $("#control_mid").scrollTop(scrol_pos);
                });
                break;
           case 'check-value-trigger':
                  $(event_dom).on('change', function(){
                          var scrol_pos = $("#control_mid").scrollTop();
                          var att_key = this.getAttribute('data-att-value');
                          interface_instance.set_dipam_temp_val(att_key, this.checked);

                          /*Always put these lines*/
                          var data_to_update = $.extend(true,{},interface_instance.editing("save"));
                          diagram_instance.update_elem(corresponding_elem.data.id, corresponding_elem.data.type, data_to_update);
                          document.getElementById('save').click();
                          $("#control_mid").scrollTop(scrol_pos);
                          /* -- -- ---- */
                  });
                  break;
            case 'select-file-trigger':
                  var dom_id = event_dom.getAttribute('id');
                  $(event_dom).on('change', function(e){
                      e.preventDefault();
                      var arr_option_selected = $("#"+dom_id+" option:selected");
                      if (arr_option_selected.length > 0) {
                        var opt_value = arr_option_selected[0].value;
                        document.getElementById(dom_id+"_"+opt_value).click();
                      }
                  });

                  var a_dom_obj_lbl = document.getElementById(dom_id+"__lbl");

                  $( "#"+dom_id+"_file").on('change', function(){
                    //console.log(this.value);
                    var data_att_value = this.files;
                    if(data_att_value){
                        var scrol_pos = $("#control_mid").scrollTop();
                        var corresponding_lbl = interface_instance.label_handler(dom_id, {value: data_att_value, elem: corresponding_elem} );
                        a_dom_obj_lbl.innerHTML = corresponding_lbl;
                        var att_key = $("#"+dom_id)[0].getAttribute('data-att-value');
                        interface_instance.set_dipam_temp_val(att_key, data_att_value);
                        interface_instance.editing("save");
                        document.getElementById('save').click();
                        $("#control_mid").scrollTop(scrol_pos);
                    }
                  });
                  $( "#"+dom_id+"_dir").on('change', function(){
                    var data_att_value = this.files;
                    if(data_att_value){
                        var scrol_pos = $("#control_mid").scrollTop();
                        var corresponding_lbl = interface_instance.label_handler(dom_id, {value: data_att_value, elem: corresponding_elem} );
                        a_dom_obj_lbl.innerHTML = corresponding_lbl;
                        var att_key = $("#"+dom_id)[0].getAttribute('data-att-value');
                        interface_instance.set_dipam_temp_val(att_key, data_att_value);
                        interface_instance.editing("save");
                        document.getElementById('save').click();
                        $("#control_mid").scrollTop(scrol_pos);
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
      document.getElementById('edit').click();
      this.reset_dipam_temp_val();
    }
    click_overview_nav() {
      this.switch_nav('nav_overview');
      this.DOMS.CONTROL.BASE.className = "diagram";
      this.DOMS.CONTROL.CONTAINER.innerHTML = this.overview_section_html;
      var overview_elem = this.overview_section_elem;
      //this.set_section_events(this.OVERVIEW_SECTION[overview_elem.elem_class][overview_elem.elem.data.type], overview_elem.elem);
      this.set_must_events();
      this.set_control_section_events(overview_elem.elem);
      document.getElementById('edit').click();
      this.reset_dipam_temp_val();
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
      $( "#"+this.DOMS.DIAGRAM.REMOVE_ELEM_CONTAINER.getAttribute('id')).css("display", "none");
      this.click_overview_nav();
    }

    editing(action = null){
      //this._switch_edit_doms();
      return this.set_edit_section(action);
    }

    _switch_edit_doms(){
      var current_flag = false;
      var arr_doms_toedit = document.getElementsByClassName('att-handler');
      /*
      for (var i = 0; i < arr_doms_toedit.length; i++) {
        if (i == 0) {
           current_flag = arr_doms_toedit[i].disabled;
        }
        arr_doms_toedit[i].disabled = !current_flag;
      }
      */
      var newflag = "editon";
      if (!current_flag == true) {
        newflag = "editoff";
      }
      document.getElementById('edit').setAttribute('value',newflag);
    }

    set_edit_section(action = null){
      //do the corresponding function corresponding to the choice/action made
      switch (action) {
          case 'cancel':
            //editdom.setAttribute('value','editoff');
            this.reload_control_section();
            break;
          case 'save':
            //editdom.setAttribute('value','editoff');
            return this.save();
          default:
        }
      return 1;
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
          this.build_info(new_elem, 'nodes', update_control_params);
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
    var instance = this;

    if (workflow_status == 'ready') {
      _disable_divs(this,true,true);
      new_status = 'run';
      new_lbl_status = "Stop process";

    }else if (workflow_status == 'run') {
      _disable_divs(this,true,false);
      new_status = 'stop';
      new_lbl_status = "Get back to edit";

    }else if (workflow_status == 'stop') {
      _disable_divs(this,false,true);
      new_status = "ready";
      new_lbl_status = '<svg class="bi bi-play-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>Run workflow';
    }
    _style_workflow_btn(new_status,new_lbl_status);

    return new_status;

    function _style_workflow_btn(new_status,new_lbl_status) {
      var new_bg_color = "var(--bg-color)";
      var new_width = "25%";
      if (new_status == "run") {
        //new_bg_color = "var(--running)";
        new_width = "50%";
      }
      if (new_status == "stop") {
        new_width = "50%";
      }

      instance.DOMS.WORKFLOW.RUN_BTN.style["background-color"] = new_bg_color;
      //instance.DOMS.WORKFLOW.RUN_BTN.style["width"] = new_width;
      instance.DOMS.WORKFLOW.RUN_BTN.style["opacity"] = '1';
      instance.DOMS.WORKFLOW.RUN_BTN.style["pointer-events"] = "auto";
      instance.DOMS.WORKFLOW.RUN_BTN.value = new_status;
      instance.DOMS.WORKFLOW.RUN_BTN.innerHTML = new_lbl_status;
    }
    function _disable_divs(instance,disable,reset_timeline){
      var p_event = 'none';
      var opacity_val = '0.8';
      if (!(disable)) {
        p_event = '';
        opacity_val = '';
      }
      //set all single nodes style
      var all_nodes = instance.DIAGRAM_INSTANCE_OBJ.get_nodes();
      for (var i = 0; i < all_nodes.length; i++) {
        all_nodes[i].style({"opacity" : '0.3'});
      }

      var elements = [
        instance.DOMS.DIAGRAM.CONTAINER,
        instance.DOMS.DIAGRAM.ADD_TOOL_BTN,
        instance.DOMS.DIAGRAM.ADD_DATA_BTN,
        instance.DOMS.DIAGRAM.UNDO_REDO_CONTAINER,
        instance.DOMS.CONTROL.NAV_CONTAINER,
        instance.DOMS.CONTROL.CONTAINER,
        instance.DOMS.DIAGRAM.REMOVE_ELEM_CONTAINER
      ]
      for (var i = 0; i < elements.length; i++) {
        elements[i].style["opacity"] =  opacity_val;
        elements[i].style["pointer-events"] =  p_event;
      }

      var control_inputs = document.getElementsByClassName('check-value-trigger');
      //console.log(control_inputs);
      for (var i = 0; i < control_inputs.length; i++) {
        control_inputs[i].disabled = true;
      }

      //instance.TIMELINE_CONTAINER.innerHTML = "";
      if (reset_timeline) {
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
      //console.log(terminals);

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

    function _process_workflow(instance,i,terminals, pending_index = 0){

            var w_elem = workflow_to_process[i];
            console.log("Process: ", w_elem)
            //check if is a terminal

            //call the server
            var request_status = "done";
            var form_data = _gen_form_data(w_elem, pending_index);
            var data_to_post = form_data["post_data"];
            var new_index = form_data["new_index"];
            console.log(data_to_post, new_index);

            $.ajax({
              url: "/process",
              timeout: 0, // 24 hours (24 * 60 * 60 * 1000). Set the timeout value in milliseconds or 0 for unlimited
              data: data_to_post,
              processData: false,
              contentType: false,
              type: 'POST',
              success: function(data) {
                    if (data.startsWith("Success:Waiting data !")) {
                      //process the same item again (modified version)
                      _process_workflow(instance,i,terminals, new_index);
                    }else {
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
                            instance.DOMS.WORKFLOW.RUN_BTN.innerHTML = "Get back to edit";
                            instance.DOMS.WORKFLOW.RUN_BTN.value = "stop";
                          }else {
                            if (instance.request_status_on) {
                              _process_workflow(instance,i+1,terminals);
                            }
                          }
                        }
                    }
                }
            });

            /*normalize the file list in a form type*/
            function _gen_form_data(elem_data, files_start_index = 0){
              var post_data = new FormData();
              var request_status = "done";
              var new_index = null;
              var MAX_NUM_FILES = 500;
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

                      //the maximum supported number of files
                      Array.prototype.forEach.call(val_of_att, function(file,index) { if((index>=files_start_index) && (index-files_start_index<MAX_NUM_FILES)){post_data.append(a_k+'[]', file);} });

                      // check if the posted data exceeds the maximum number of supported chars
                      if (val_of_att.length - files_start_index > MAX_NUM_FILES){
                        request_status = "pending";
                        new_index = files_start_index + MAX_NUM_FILES;
                      }

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
              post_data.append("request_status", request_status);
              return {"post_data": post_data, "new_index": new_index};
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
          a_linker_dom.innerHTML = '<svg class="bi bi-download" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M.5 8a.5.5 0 01.5.5V12a1 1 0 001 1h12a1 1 0 001-1V8.5a.5.5 0 011 0V12a2 2 0 01-2 2H2a2 2 0 01-2-2V8.5A.5.5 0 01.5 8z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M5 7.5a.5.5 0 01.707 0L8 9.793 10.293 7.5a.5.5 0 11.707.707l-2.646 2.647a.5.5 0 01-.708 0L5 8.207A.5.5 0 015 7.5z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M8 1a.5.5 0 01.5.5v8a.5.5 0 01-1 0v-8A.5.5 0 018 1z" clip-rule="evenodd"/></svg>';
          a_linker_dom.href = "/download/"+node_id+"?time="+(new Date().getTime()).toString();
          last_dom.innerHTML = last_dom.innerHTML + "<div class='inner-timeline-block'>"+a_linker_dom.outerHTML+"</div>";
          break;

        case "t-doctopics-view":
          a_linker_dom = document.createElement("a");
          a_linker_dom.setAttribute("value",node_id);
          a_linker_dom.innerHTML = '<svg class="bi bi-display" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M5.75 13.5c.167-.333.25-.833.25-1.5h4c0 .667.083 1.167.25 1.5H11a.5.5 0 010 1H5a.5.5 0 010-1h.75z"/><path fill-rule="evenodd" d="M13.991 3H2c-.325 0-.502.078-.602.145a.758.758 0 00-.254.302A1.46 1.46 0 001 4.01V10c0 .325.078.502.145.602.07.105.17.188.302.254a1.464 1.464 0 00.538.143L2.01 11H14c.325 0 .502-.078.602-.145a.758.758 0 00.254-.302 1.464 1.464 0 00.143-.538L15 9.99V4c0-.325-.078-.502-.145-.602a.757.757 0 00-.302-.254A1.46 1.46 0 0013.99 3zM14 2H2C0 2 0 4 0 4v6c0 2 2 2 2 2h12c2 0 2-2 2-2V4c0-2-2-2-2-2z" clip-rule="evenodd"/></svg>';
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
    this.DOMS.DIAGRAM.UNDO_BTN.style["pointer-events"] = "auto";
    this.DOMS.DIAGRAM.UNDO_BTN.style["opacity"] = 1;
    if (!(flag)) {
      this.DOMS.DIAGRAM.UNDO_BTN.style["pointer-events"] = "none";
      this.DOMS.DIAGRAM.UNDO_BTN.style["opacity"] = 0.3;
    }
  }

  show_redo(flag= true){
    this.DOMS.DIAGRAM.REDO_BTN.style["pointer-events"] = "auto";
    this.DOMS.DIAGRAM.REDO_BTN.style["opacity"] = 1;
    if (!(flag)) {
      this.DOMS.DIAGRAM.REDO_BTN.style["pointer-events"] = "none";
      this.DOMS.DIAGRAM.REDO_BTN.style["opacity"] = 0.3;
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

    // List of options
    $( "#"+this.DOMS.WORKFLOW.OPT_TRIGGER.getAttribute('id')).on({
      click: function(e) {
        var display_val = $( "#"+interface_instance.DOMS.WORKFLOW.OPT_LIST.getAttribute('id')).css("display");
        if (display_val == "none") {
          $( "#"+interface_instance.DOMS.WORKFLOW.OPT_LIST.getAttribute('id')).css("display", "block");
        }else {
          $( "#"+interface_instance.DOMS.WORKFLOW.OPT_LIST.getAttribute('id')).css("display", "none");
        }
      }
    });

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
      diagram_instance.click_elem_style();
      $( "#"+interface_instance.DOMS.DIAGRAM.REMOVE_ELEM_CONTAINER.getAttribute('id')).css("display", "none");
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

    $(this.DOMS.WORKFLOW.SAVE_BTN).on("click", function() {
          //e.preventDefault();
          console.log("Saving ... ");
          document.getElementById('list_options_trigger').click();
          //interface_instance.click_save_workflow();
          var workflow_data = diagram_instance.get_workflow_data();
          $.post( "/saveworkflow"+"?time="+(new Date().getTime()).toString(), {
            //workflow_data: JSON.stringify(workflow_data).replace(/\\/g, "\\\\"),
            workflow_data: JSON.stringify(workflow_data),
            path: "",
            name: "",
            load: "off"
          }).done(function() {
            interface_instance.DOMS.WORKFLOW.SAVE_BTN_DOWNLOAD.click();
          });
    });

    $( "#"+this.DOMS.WORKFLOW.SHUTDOWN_BTN.getAttribute('id')).on({
        click: function(e) {
          e.preventDefault();
          $.get("/shutdown").always(function() {
            window.close();
          });
        }
    });


    $( "#"+this.DOMS.WORKFLOW.LOAD_BTN.getAttribute('id')).on({
        click: function(e) {
          e.preventDefault();
          $('#file_to_load').trigger('click');
        }
    });

    $( "#"+this.DOMS.DIAGRAM.REMOVE_ELEM_CONTAINER.getAttribute('id')+" button").on('click', function(e){
      if ((interface_instance.info_section_elem['elem_class'] == "nodes") || (interface_instance.info_section_elem['elem_class'] == "edges")) {
        if (interface_instance.info_section_elem['elem'] != null){
          document.getElementById('remove').click();
          $( "#"+interface_instance.DOMS.DIAGRAM.REMOVE_ELEM_CONTAINER.getAttribute('id')).css("display", "none");
        }
      }
    });

    $('#file_to_load').on({
        change: function(e) {
          var file = $('#file_to_load')[0].files[0];
          if (file) {
            var reader = new FileReader();
            reader.readAsText(file, "UTF-8");
            reader.onload = function(e) {
                document.getElementById('list_options_trigger').click();
                var result = e.target.result;
                //console.log(result);
                interface_instance.in_loading_status = true;
                $.post( "/loadworkflow", {
                  workflow_file: result
                }).done(function() {
                  window.removeEventListener("beforeunload", beforeunload_fun);
                  location.reload();
                  window.addEventListener('beforeunload',beforeunload_fun);
                });
            };
          }
        }
    });

    _elem_onclick_handle();

    function _elem_onclick_handle(){

        diagram_cy.on('tap', function(event){
          // target holds a reference to the originator
          // of the event (core or element)
          var evtTarget = event.target;
          if (Object.keys(evtTarget).length == 1) {
            $( "#"+interface_instance.DOMS.CONTROL.OVERVIEW_BTN.getAttribute('id')).click();
            diagram_instance.highlight_diagram();
          }
        });

        //nodes on click handler
        diagram_cy.nodes().on('click', function(e){
            diagram_instance.click_elem_style(this,'node');
            diagram_instance.check_node_compatibility(this);
            interface_instance.click_on_node(this);
            elem_remove_handler(this);
        });

        //edges on click handler
        diagram_cy.edges().on('click', function(e){
            //console.log("Edge clicked !", this._private.data.id,this);
            diagram_instance.click_elem_style(this,'edge');
            interface_instance.click_on_edge(this);
            elem_remove_handler(this);
        });

        function elem_remove_handler(elem) {
          $( "#"+interface_instance.DOMS.DIAGRAM.REMOVE_ELEM_CONTAINER.getAttribute('id')).css("display", "block");
        }
    }

  }
}
