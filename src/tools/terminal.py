import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from collections import defaultdict
from collections import OrderedDict
import re
import json

import matplotlib
matplotlib.use('Agg')

# Plotting tools
import pyLDAvis
import pyLDAvis.gensim  # don't skip this
import matplotlib.pyplot as plt

class Terminal(object):

    def __init__(self, base_tmp_path_base):
        self.PALETTE = ["#0377a8","#fc6f5f","#e2ce71","#ad7947","#e97947","#5cb991","#ffadcb","#b46ddc"]
        self.MY_DPI = 80
        self.base_tmp_path = base_tmp_path_base
        pass

    def ldavis(self, input_files, param, tool_id):

        data_to_return = {"data":{}}
        ok_to_process = False

        # Check the tool needs
        # -----
        if "d-model-corpus" in input_files and "d-dictionary-corpus" in input_files and "d-gensimldamodel" in input_files:
            ok_to_process = len(input_files["d-model-corpus"]) and len(input_files["d-dictionary-corpus"]) and len(input_files["d-gensimldamodel"])

        if not ok_to_process:
            res_err = {"data":{}}
            res_err["data"]["error"] = "Input data missing!"
            return res_err

        corpus = []
        for file_k in input_files["d-model-corpus"]:
            for d in input_files["d-model-corpus"][file_k]:
                corpus.append(d["value"])

        dictionary = None
        for file_k in input_files["d-dictionary-corpus"]:
            dictionary = input_files["d-dictionary-corpus"][file_k]

        ldamodel = None
        for file_k in input_files["d-gensimldamodel"]:
            ldamodel = input_files["d-gensimldamodel"][file_k]

        # Params
        # -----
        # NO PARAMS
        vis = pyLDAvis.gensim.prepare(ldamodel, corpus, dictionary, sort_topics=False)
        html_str = pyLDAvis.prepared_data_to_html(vis)
        data_to_return["data"]["d-ldavis-html"] = {"ldavis": html_str}
        return data_to_return

    def cat_topics_barchart(self, input_files, param, tool_id):
        data_to_return = {"data":{}}

        # Pre
        # -------
        # Check Restrictions
        ok_to_process = ("d-doc-topics-table" in input_files) and (len(input_files["d-doc-topics-table"]) == 1)
        ok_to_process = ok_to_process and (("d-metadata" in input_files) and (len(input_files["d-metadata"]) > 0))
        if not ok_to_process:
            data_to_return["data"]["error"] = "unexpected or missing input!"
            return data_to_return

        # Read inputs
        inputs = {"meta_docs": {}, "docs_topics": {}}
        for file_k in input_files["d-metadata"]:
            inputs["meta_docs"][file_k] =  input_files["d-metadata"][file_k]
        for file_k in input_files["d-doc-topics-table"]:
            inputs["docs_topics"] =  input_files["d-doc-topics-table"][file_k]

        # Params
        META_FILTER = []
        META_KEY = ""
        META_LABEL = ""
        META_KEY_TYPE = ""
        CHART_AXIS_TYPE = "none"
        if param != None:
            if "p-meta-filter" in param:
                META_FILTER = [a.strip() for a in param["p-meta-filter"].split(",")]
            if "p-meta-value" in param:
                META_KEY = param["p-meta-value"]
                META_LABEL = "metadata attribute = <"+META_KEY+">"
            if "p-meta-type" in param:
                META_KEY_TYPE = param["p-meta-type"]
            if "p-chart-axis" in param:
                if param["p-chart-axis"] == "time_series":
                    CHART_AXIS_TYPE = "initial"

        # Process
        # -------
        # 0) Prepare HTML template
        html_layout = ""

        # 1) Read and process the inputs
        def get_column_name_for_max_values_of(row,df):
            return df.loc[:,df.loc[row] == df.loc[row].max()].columns.tolist()

        mydf = pd.DataFrame.from_records(inputs["docs_topics"][1:])
        mydf.columns = inputs["docs_topics"][0]
        mydf = mydf.set_index(inputs["docs_topics"][0][0])
        dict_topics = dict((el,[]) for el in mydf.columns)
        index_files = []
        # for each topic we create a list of all the documents which have it as top score
        for index,row in mydf.iterrows():
            for t_k in get_column_name_for_max_values_of(index,mydf):
                clean_index = re.sub(r'^.*?\/', '', str(index))
                dict_topics[t_k].append(clean_index)
                index_files.append(clean_index)

        meta = {}
        meta_index = {}
        meta_x_values = set()
        for f_name in inputs["meta_docs"]:
            k_meta = re.sub(r'^.*?\/', '', str(f_name)).replace(".json","")
            if k_meta in index_files:
                meta[k_meta] = inputs["meta_docs"][f_name]
                for a_meta_k in inputs["meta_docs"][f_name]:
                    a_meta_k_val = inputs["meta_docs"][f_name][a_meta_k]
                    a_data_type = str(type(a_meta_k_val))
                    if "list" in a_data_type:
                        inner_type = "string"
                        if len(a_meta_k_val) > 0:
                            inner_type = str(type(a_meta_k_val[0]))
                            if "str" in inner_type:
                                inner_type = "string"
                            elif "int" in inner_type:
                                inner_type = "integer"
                        meta_index[a_meta_k] = "list("+inner_type+")"
                        l = [a_val for a_val in a_meta_k_val]
                        a_meta_k_val = l
                    elif "str" in a_data_type:
                        meta_index[a_meta_k] = "string"
                        a_meta_k_val = [a_meta_k_val]
                    elif "int" in a_data_type:
                        meta_index[a_meta_k] = "integer"
                        a_meta_k_val = [a_meta_k_val]

                    if a_meta_k == META_KEY:
                        meta_x_values.update(a_meta_k_val)

        meta_x_values = list(meta_x_values)
        meta_x_values.sort()

        filter_meta = dict()
        for m in meta_index:
            if m in META_FILTER:
                filter_meta[m] = meta_index[m]

        html_template = """
        <!DOCTYPE html>
        <html>
          <head>
                <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
                <link rel="stylesheet" href="http://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
                <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
                <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
                <script src="https://cdn.plot.ly/plotly-1.52.3.min.js" charset="utf-8"></script>

                <style>
                        body{
                          padding: 30px;
                        }
                        .chart-container{
                          display: inline-block;
                          vertical-align: top;
                          width: 70%;
                          border-left: 1px solid gray;
                          margin-left: 20px;
                          height: auto;
                          max-height: 700px;
                          min-width: 800px;
                        }
                        .handlers-container{
                          padding: 10px;
                          width: fit-content;
                          width: 300px;
                          display: inline-block;
                        }
                        .sec-title{
                          font-size: 14pt;
                          border-bottom: solid 1px;
                          padding-left: 5px;
                        }
                        #btn_filter{
                          margin-top: 5px;
                          width: 100%;
                        }
                        #btn_filter:hover{
                          color: white;
                        }

                        .switch_buttons{
                          width: 100%;
                          vertical-align: top;
                          margin-bottom: 20px;
                        }
                        .switch-btn{
                          width: 130px;
                          font-size: 10pt;
                        }

                        .g-1{
                          margin-bottom: 5px;
                        }
                        #lines_chart{
                          display: """+CHART_AXIS_TYPE+""";
                        }

                        #filters_container{
                          padding: 10px;
                          width: 100%;
                          max-height: 200px;
                        }
                        .m-box{
                          vertical-align: top;
                          margin-right: 5%;
                          width: 100%;
                          margin-bottom: 10px;
                        }
                        .m-box .pre{
                          font-size: 16pt;
                          padding-left:3%;
                          max-width: 5%;
                          border-left: solid 1px gray;
                          vertical-align: middle;
                        }
                        .m-box button{
                          display: inline-block;
                          width: 90%;
                          font-size: 12pt;
                          white-space: normal;

                        }
                        label.f-all-checkbox{
                            color: navy;
                            font-size: 10pt!important;
                            padding: 5px;
                        }
                        .m-box-values{
                          display: none;
                          max-height: 150px;
                          overflow: scroll;
                          margin-top: 1px;
                          margin: 0 auto;
                        }
                        .m-box-values label{
                          padding-left: 10px;
                          font-size: 10pt;
                          vertical-align: center;
                          max-width: 80%;
                        }
                        #refine_container{
                          padding: 10px;
                          width: 100%;
                          max-height: 200px;
                          margin-bottom: 20px;
                        }
                        #refine_container select{
                           width: 100%;
                        }
                </style>
                <title>Viualizations</title>

                <script type="text/javascript">

                /*FROM MITAO*/
                var app_init_data = """+json.dumps(dict_topics, indent = 4)+""";
                var app_meta = """+json.dumps(meta, indent = 4)+""";
                var att_index = """+json.dumps(filter_meta, indent = 4)+""";

                /*FROM MITAO*/
                var app_x_att = \""""+META_KEY+"""\";
                var app_x_att_type = \""""+meta_index[META_KEY]+"""\";
                var app_x_data = """+json.dumps(meta_x_values)+""";

                /*------------*/
        /*------------*/
        var index_trace_colors = {};
        var charts = new Set(["count","bars"]);
        var filtered_data = JSON.parse(JSON.stringify(app_init_data));
        var filter_index = null;
        var index_meta = {};
        for (var k_f in app_meta) {
          for (var m in app_meta[k_f]) {
            if ((m != app_x_att) && (m in att_index)) {
              if (!(m in index_meta)) {
                index_meta[m] =  new Set();
              }
              if (att_index[m] == "string"){
                index_meta[m].add(app_meta[k_f][m]);
              }else if (att_index[m] == "integer"){
                index_meta[m].add(app_meta[k_f][m]);
              }else if (att_index[m].includes("list")) {
                for (var i = 0; i < app_meta[k_f][m].length; i++) {
                  index_meta[m].add(app_meta[k_f][m][i]);
                }
              }
            }
          }
        }

        /*Define all colors*/
        function hexToRgbA(hex,opacity){
            var c;
            if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
                c= hex.substring(1).split('');
                if(c.length== 3){
                    c= [c[0], c[0], c[1], c[1], c[2], c[2]];
                }
                c= '0x'+c.join('');
                return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+opacity+')';
            }
            throw new Error('Bad Hex');
        }
        var palette = ["#0377a8","#fc6f5f","#e2ce71","#ad7947","#e97947","#5cb991","#ffadcb","#b46ddc"];
        var index_palette = 0;
        for (var k_cat in filtered_data) {
          var color = palette[index_palette%palette.length];
          var opacity = 1 - (Math.floor(index_palette/palette.length) * 0.20);
          if (opacity < 0.3) { opacity = 1;}
          index_trace_colors[k_cat] = hexToRgbA(color,opacity);
          index_palette += 1;
        }
        index_trace_colors["others"] = "#CCCCCC";

        //var top_topics = Object.keys(app_init_data).length;

        function draw_chart(obj_data, x_data, x_att, chart_type, data_type) {

          var type = null;
          var barmode = null;
          if (chart_type == "bars") {
            type = "bar";
            barmode = "stack";
          }else if (chart_type == "lines") {
            type = "scatter";
          }

          var chart_data = [];
          var index_palette = 0;
          for (var cat in obj_data) {

            var trace_color = index_trace_colors[cat];

            var y_vals = [];
            var y_text = [];
            for (var i = 0; i < x_data.length; i++) {
              y_vals.push(obj_data[cat][x_data[i]][data_type]);
              y_text.push(String((obj_data[cat][x_data[i]]["precentage_total"] * 100).toFixed(2)));
            }

            var others_opt = {};
            if (chart_type == "lines") {
              others_opt = {
                  line: {
                    color: trace_color,
                    width: 1
                  }
              }
            }

            var trace = {
                x: x_data,
                y: y_vals,
                name: cat,
                type: type,
                text: y_text,
                orientation: 'v',
                hovertemplate: '<b>Topic #'+cat+'</b>'+
                              '<br>&#8594; <b>%{y}</b> document/s in <b><%{x}></b>'+
                              '<br>&#8594; <b>%{text}%</b> of all the documents'+
                              '<extra></extra>',
                marker: {
                  color: trace_color,
                  size: 8
                }
            };

            chart_data.push(Object.assign( {}, trace, others_opt));
          }

          var layout = {};
          if (chart_type == "bars") {
            layout = {
              "hovermode": "closest",
              "barmode": barmode,
              "xaxis": {
                'automargin': true,
                tickmode: "array",
                tickvals: x_data,
                ticktext: x_data
              },
              "yaxis":{
                'automargin': true,
              }
            };
          }else if (chart_type == "lines") {
            layout = {
              "hovermode": "closest",
              "xaxis": {
                'automargin': true,
                tickmode: "linear",
                tickvals: x_data,
                ticktext: x_data
              },
              "yaxis":{
                'automargin': true,
              }
            };
          }

          if (data_type == "counts") {
          }else if (data_type == "percentage") {
            layout["yaxis"] = {tickformat: '%'}
          }



          Plotly.newPlot('chart_container', chart_data, layout);
        }

        function check(g= null, v=null) {
                // check the type of chart
                var chart_type = null;
                var data_type = null;
                if ((g != null) && (g == "g-1")) {
                  data_type = v;
                }else {
                  $(".g-1 label").each(function( index ) {
                    if ($( this ).hasClass('active')){
                      data_type = $( this ).attr("value");
                    }
                  });
                }

                if ((g != null) && (g == "g-2")) {
                  chart_type = v;
                }else {
                  $(".g-2 label").each(function( index ) {
                    if ($( this ).hasClass('active')){
                      chart_type = $( this ).attr("value");
                    }
                  });
                }

                //now prepare the data
                // <obj_data> and <x_data>
                var obj_data = {};
                var index_counts = {"all": 0, "category":{}, "x_tick":{}}
                for (var k_cat in filtered_data) {
                      //init
                      obj_data[k_cat] = {};
                      index_counts["category"][k_cat] = 0;
                      for (var i = 0; i < app_x_data.length; i++) {
                        obj_data[k_cat][app_x_data[i]] = {"counts":0,"percentage":0};
                      }
                      //populate
                      for (var i = 0; i < filtered_data[k_cat].length; i++) {
                        var elem_name = filtered_data[k_cat][i];
                        if (elem_name in app_meta) {
                          if (app_x_att in app_meta[elem_name]) {

                            var l_att_val = [app_meta[elem_name][app_x_att]];
                            if (app_x_att_type.includes("list")) {
                              var l_att_val = app_meta[elem_name][app_x_att];
                            }
                            for (var h = 0; h < l_att_val.length; h++) {
                              att_val = l_att_val[h];
                              //TODO AN ERROR
                              if (app_x_data.indexOf(att_val) != -1) {
                                obj_data[k_cat][att_val]["counts"] += 1;
                                //update counts
                                if (!(k_cat in index_counts["category"])) {
                                  index_counts["category"][k_cat] = 0;
                                }
                                if (!(att_val in index_counts["x_tick"])) {
                                  index_counts["x_tick"][att_val] = 0;
                                }
                                index_counts["category"][k_cat] += 1;
                                index_counts["x_tick"][att_val] += 1;
                                index_counts["all"] += 1;
                              }
                            }
                          }
                        }
                      }
                }

                /*Refine obj_data and select only the top_topics*/
                var index_top_topics = {}
                var index_other_topics = {}
                var e = document.getElementById("top_topics");
                var top_topics = parseInt(e.options[e.selectedIndex].value);
                for (var i = 0; i < app_x_data.length; i++) {
                  index_top_topics[app_x_data[i]] = new Array();
                  index_other_topics[app_x_data[i]] = {"categories": new Set(),"counts":0}
                }
                for (var k_cat in filtered_data) {
                  for (var i = 0; i < app_x_data.length; i++) {
                    var val_x_counts = obj_data[k_cat][app_x_data[i]]["counts"];
                    index_top_topics[app_x_data[i]].push({"category":k_cat,"counts":val_x_counts});
                  }
                }
                for (var i = 0; i < app_x_data.length; i++) {
                  // Sort app_x_data[k_cat]
                  index_top_topics[app_x_data[i]].sort((a, b) => (a.counts < b.counts) ? 1 : -1)
                  var tot_topics = index_top_topics[app_x_data[i]].length;
                  if (top_topics < tot_topics) {
                    index_other_topics[app_x_data[i]]["categories"] = index_top_topics[app_x_data[i]].slice(top_topics, tot_topics);
                    for (var n = 0; n < index_other_topics[app_x_data[i]]["categories"].length; n++) {
                      var a_category = index_other_topics[app_x_data[i]]["categories"][n];
                      index_other_topics[app_x_data[i]]["counts"] += a_category["counts"];
                    }
                  }
                  index_top_topics[app_x_data[i]] = index_top_topics[app_x_data[i]].slice(0, top_topics);
                }

                //update the obj_data with only the top topics
                updated_obj_data = {}
                for (var k_cat in obj_data) {
                  var count_zeros = 0;
                  for (var x_key in obj_data[k_cat]) {
                    //if is not part of the top topics
                    // -> make its count 0
                    function search_category(nameKey, myArray){
                        for (var i=0; i < myArray.length; i++) {
                            if (myArray[i].category === nameKey) {
                                return myArray[i];
                            }
                        }
                        return -1;
                    }
                    if (search_category(k_cat, index_top_topics[x_key]) == -1){
                      obj_data[k_cat][x_key]["counts"] = 0;
                      count_zeros += 1;
                    }
                  }
                  // remove it if the topic is 0 in for all the x values
                  if (count_zeros != app_x_data.length) {
                    updated_obj_data[k_cat] = obj_data[k_cat];
                  }
                }
                obj_data = updated_obj_data;
                obj_data["others"] = index_other_topics;

                for (var k_cat in obj_data) {
                  for (var x_key in obj_data[k_cat]) {
                    obj_data[k_cat][x_key]["percentage"] =  obj_data[k_cat][x_key]["counts"]/index_counts["x_tick"][x_key];
                    obj_data[k_cat][x_key]["precentage_total"] = obj_data[k_cat][x_key]["counts"]/index_counts["all"];
                  }
                }

                //console.log(obj_data);
                draw_chart(obj_data, app_x_data, app_x_att, chart_type, data_type);
        }

        function filter() {

              // filter_index = {"att":{Set of values}}
              filtered_data = JSON.parse(JSON.stringify(app_init_data));
              var copy_filtered_data = JSON.parse(JSON.stringify(filtered_data));
              for (var k_cat in filtered_data) {
                  copy_filtered_data[k_cat] = [];
                  for (var i = 0; i < filtered_data[k_cat].length; i++) {
                    var elem_name = filtered_data[k_cat][i];
                    var include = false;
                    //in case we have no filters always include
                    if (Object.keys(att_index).length == 0) {
                      include = true;
                    }else{
                      //in case we have filters -> all meta filters must be satisfaied
                      include = true;
                      if (elem_name in app_meta) {
                        var inter_check = true;
                        for (var filter_att in att_index) {
                          inter_check = inter_check && (filter_att in app_meta[elem_name]);
                          if (inter_check) {
                            var a_meta_att_value = app_meta[elem_name][filter_att];
                            inter_check = inter_check && (filter_att in filter_index);
                            if (inter_check) {
                              var meta_res = false;
                              if (att_index[filter_att] == "string") {
                                meta_res = (meta_res || filter_index[filter_att].has(a_meta_att_value));
                              }else if (att_index[filter_att].includes("list")) {
                                for (var j = 0; j < a_meta_att_value.length; j++) {
                                  meta_res = (meta_res || filter_index[filter_att].has(a_meta_att_value[j]));
                                }
                              }
                              inter_check = inter_check && meta_res;
                            }
                          }
                          include = include && inter_check;
                        }
                      }
                    }

                    if (include) {
                      copy_filtered_data[k_cat].push(elem_name);
                    }
                  }
              }
              filtered_data = copy_filtered_data;
            }

        </script>

      </head>
      <body>
              <div class="handlers-container">

                <div class="switch_buttons">
                  <div class="g-1 btn-group btn-group-toggle" data-toggle="buttons">
                     <label onchange="check('g-1','counts');" value="counts" class="switch-btn btn btn-light active">
                       <input value="counts" type="radio" name="options" id="option_g1_1" autocomplete="off" checked> Counts <span style="margin-left: 5px"> # </span>
                     </label>
                     <label onchange="check('g-1','percentage');" value="percentage" class="switch-btn btn btn-light">
                       <input value="percentage" type="radio" name="options" id="option_g1_2" autocomplete="off"> Percentage <span style="margin-left: 5px"> % </span>
                     </label>
                  </div>
                  <br>
                  <div class="g-2 btn-group btn-group-toggle" data-toggle="buttons">
                     <label onchange="check('g-2','bars');" value="bars" class="switch-btn btn btn-light active">
                       <input value="bars" type="radio" name="options" id="option_g2_1" autocomplete="off" checked> Bars chart <span style="margin-left: 5px">
                       <svg class="bi bi-bar-chart-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <rect width="4" height="5" x="1" y="10" rx="1"/>
                          <rect width="4" height="9" x="6" y="6" rx="1"/>
                          <rect width="4" height="14" x="11" y="1" rx="1"/>
                        </svg>
                        </span>
                     </label>
                     <label onchange="check('g-2','lines');" value="lines" id="lines_chart" class="switch-btn btn btn-light">
                       <input value="lines" type="radio" name="options" id="option_g2_2" autocomplete="off"> Lines chart
                       <span style="margin-left: 5px">
                         <svg class="bi bi-graph-up" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0h1v16H0V0zm1 15h15v1H1v-1z"/>
                        <path fill-rule="evenodd" d="M14.39 4.312L10.041 9.75 7 6.707l-3.646 3.647-.708-.708L7 5.293 9.959 8.25l3.65-4.563.781.624z"/>
                        <path fill-rule="evenodd" d="M10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4h-3.5a.5.5 0 0 1-.5-.5z"/>
                        </svg>
                      </span>
                     </label>
                  </div>
                </div>

                <div class="sec-title">Refine</div>
                <div id="refine_container"></div>

                <div class="sec-title">Filter</div>
                <div id="filters_container"></div>

              </div>



              <div id="chart_container" class="chart-container"></div>

              <script type="text/javascript">

                /* BUild doms*/
                for (var m_att in index_meta) {
                  var filter_box = "";
                  var l_meta_values = Array.from(index_meta[m_att]);
                  l_meta_values = l_meta_values.sort();
                  if (l_meta_values.length > 0) {
                    for (var i = 0; i < l_meta_values.length; i++) {
                      filter_box = filter_box + '<span><input class="f-checkbox" data-att="'+m_att+'" type="checkbox" id="checkbox_'+String(i)+'" value="'+l_meta_values[i]+'" checked></span><span><label for="checkbox_'+String(i)+'">'+l_meta_values[i]+'</label></span><br>';
                    }
                    filter_box = "<div class='m-box'><button id='"+m_att+"_btn' type='button' class='btn btn-light'>Metadata attribute: "+m_att+"</button><span class='pre' id='"+m_att+"_pre'>+</span><div id='"+m_att+"_values' class='m-box-values'>" +'<input class="f-all-checkbox" data-att="'+m_att+'" data-checked=true type="checkbox" id="all_checkbox_'+String(i)+'" checked></span><span><label class="f-all-checkbox" for="all_checkbox_'+String(i)+'">Check/Uncheck all</label><br>'+ filter_box.substring(0, filter_box.length-4)+"</div>";
                  }
                  document.getElementById("filters_container").innerHTML += filter_box;
                }
                document.getElementById("filters_container").innerHTML += "<button id='btn_filter' type='button' class='btn btn-dark'>Apply filters</button>";
                for (var m_att in index_meta) {

                   $("#"+m_att+"_btn").click(function(event) {
                    var values_box = event.target.id.replace("_btn","_values");
                    var pre_box = event.target.id.replace("_btn","_pre");
                    var display_val = $("#"+values_box).css('display');

                    if (display_val == "none") {
                      document.getElementById(pre_box).innerHTML = "-";
                      $("#"+values_box).css("display", "block");
                    }else {
                      if (display_val == "block") {
                        document.getElementById(pre_box).innerHTML = "+";
                        $("#"+values_box).css("display", "none");
                      }
                    }
                  });
                }

                if (Object.keys(index_meta).length > 0) {
                  $("#btn_filter").click(function(event) {
                    var checked_inputs = $(".f-checkbox:checked");
                    var index_filters = {};
                    for (var i = 0; i < checked_inputs.length; i++) {
                      var checked_att = checked_inputs[i].getAttribute("data-att");
                      var checked_value = checked_inputs[i].getAttribute("value");
                      if (!(checked_att in index_filters)) {
                        index_filters[checked_att] = new Set();
                      }
                      index_filters[checked_att].add(checked_value);
                    }
                    filter_index = index_filters;
                    filter();
                    check();
                 });
                }

                if (Object.keys(att_index).length == 0) {
                 $("#filters_container").css("display", "none");
                 $("#filters_container").prev().css("display", "none");
                }else {
                 $(".f-all-checkbox").change(function() {

                   var current_val = $(this).attr('checked');
                   var new_val = !current_val;
                   var data_att = $(this).attr('data-att');
                   $(".f-checkbox[data-att='"+data_att+"']").prop('checked', new_val);
                   $(this).attr('checked',new_val);
                 });
                }

                var str_options = "";
                for (var topic_i = 0; topic_i < Object.keys(app_init_data).length-1; topic_i++) {
                 str_options += "<option value='"+String(topic_i+1)+"'>Show top "+String(topic_i+1)+" topics</option>";
                }
                str_options = "<option value='"+String(Object.keys(app_init_data).length)+"'>Show all the topics</option>" + str_options;
                document.getElementById("refine_container").innerHTML += "<select id='top_topics'>"+str_options+"</select>";

                $("#top_topics").change(function(event) {
                 check();
                });

                $("#btn_filter").click();
                </script>
                </body>
                </html>
        """

        f_name = str(tool_id)+'_chart_('+str(META_KEY)+')'
        #data_to_return["data"]["d-grouped-barchart"] = {f_name+'_data': barchart_data}
        data_to_return["data"]["d-chart-html"] = {f_name+'_view': html_template}
        return data_to_return

    def save_file(self, input_files, param, tool_id):
        data_to_return = {"data":{}}

        # NO RESTRICTIONS  Takes any input

        #Build data here
        res_docs = {}
        for a_data_value in input_files:
            res_docs[a_data_value] = {}
            for file_k in input_files[a_data_value]:
                res_docs[a_data_value][file_k] = input_files[a_data_value][file_k]

        data_to_return["data"] = res_docs
        return data_to_return
