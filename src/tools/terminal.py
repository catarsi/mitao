import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from collections import defaultdict
from collections import OrderedDict
import re

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
        NUM_TOPICS = 2
        META_KEY = ""
        META_LABEL = ""
        META_KEY_TYPE = ""
        CHART_AXIS_TYPE = "none"
        if param != None:
            if "p-topic" in param:
                NUM_TOPICS = int(param["p-topic"])
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
        for f_name in inputs["meta_docs"]:
            k_meta = re.sub(r'^.*?\/', '', str(f_name)).replace(".json","")
            if k_meta in index_files:
                meta[k_meta] = inputs["meta_docs"][f_name]

        # 2) Classify on categories
        dict_cat = defaultdict(dict)
        for t in dict_topics:
            for f_k in dict_topics[t]:
                if f_k in meta and META_KEY in meta[f_k]:
                    #Check Meta Type
                    meta_val = [meta[f_k][META_KEY]]
                    if META_KEY_TYPE.startswith("list"):
                        meta_val = meta[f_k][META_KEY]

                    for m_v in meta_val:
                        if m_v.strip() != "":
                            if not m_v in dict_cat:
                                dict_cat[m_v] = []

                            index_in = [i for i, d in enumerate(dict_cat[m_v]) if d["topic"] == t]
                            if len(index_in) == 0:
                                dict_cat[m_v].append({"topic":t, "length":0, "items":[]})
                                index_in = [len(dict_cat[m_v]) - 1]

                            dict_cat[m_v][index_in[0]]["items"].append(f_k)
                            dict_cat[m_v][index_in[0]]["length"] += 1

        # 3) Sort the topics
        CAT_TOT = defaultdict(int)
        DOC_TOT = 0
        for cat in dict_cat:
            dict_cat[cat] = sorted(dict_cat[cat], key=lambda k: k['length'], reverse=True)
            for topic_o in dict_cat[cat]:
                CAT_TOT[cat] += topic_o['length']
                DOC_TOT += topic_o['length']

        # 4) Prepare the Y-axis
        y_info= dict()
        i_cat = 0

        # if time series x is sorted
        x = sorted(dict_cat.keys())
        NUM_CAT = len(dict_cat)

        color_id = 0
        ordered_topics = []
        for cat in x:
            tot_top_docs = 0
            for elem in dict_cat[cat][:NUM_TOPICS]:
                if not elem["topic"] in y_info:
                    y_info[elem["topic"]] = {
                        "topic_y_count": [0 for _ in range(NUM_CAT)],
                        "topic_y_percentage": [0 for _ in range(NUM_CAT)],
                        "topic_y_count_lbl": ["" for _ in range(NUM_CAT)],
                        "topic_y_percentage_lbl": ["" for _ in range(NUM_CAT)],
                        #"color": PALETTE[color_id]
                        "color": self.PALETTE[color_id % len(self.PALETTE)],
                        "color_opacity": 1 - ((((len(ordered_topics) + 1) / len(self.PALETTE)) * 0.25) % 1)
                    }
                    ordered_topics.append(elem["topic"])
                    color_id += 1
                y_info[elem["topic"]]["topic_y_count"][i_cat] = elem['length']
                y_info[elem["topic"]]["topic_y_percentage"][i_cat] = elem["length"]/CAT_TOT[cat]
                y_info[elem["topic"]]["topic_y_count_lbl"][i_cat] = "<br>&#8594; %.2f"%((elem["length"]/DOC_TOT)*100 ) + "% of all the documents <br>"+"&#8594; %.2f"%((elem["length"]/CAT_TOT[cat])*100)+ "% of the documents in "+str(cat)
                y_info[elem["topic"]]["topic_y_percentage_lbl"][i_cat] = "<br>&#8594; %d documents (%.2f"%(elem["length"] ,(elem["length"]/DOC_TOT)*100 ) + "% of all the documents)"
                tot_top_docs += elem['length']

            other_length = CAT_TOT[cat] - tot_top_docs
            if NUM_TOPICS < len(dict_cat[cat]):
                if not "other" in y_info:
                    ordered_topics.insert(0,"other")
                    y_info["other"] = {
                        "topic_y_count": [0 for _ in range(NUM_CAT)],
                        "topic_y_percentage": [0 for _ in range(NUM_CAT)],
                        "topic_y_count_lbl": ["" for _ in range(NUM_CAT)],
                        "topic_y_percentage_lbl": ["" for _ in range(NUM_CAT)],
                        "color": "#C7C7C7",
                        "color_opacity": 1
                    }
                y_info["other"]["topic_y_count"][i_cat] = other_length
                y_info["other"]["topic_y_percentage"][i_cat] = other_length/CAT_TOT[cat]
                y_info["other"]["topic_y_count_lbl"][i_cat] = "<br>&#8594; %.2f"%((other_length/DOC_TOT)*100)+ "% of all the documents <br>"+"&#8594; %.2f"%((other_length/CAT_TOT[cat])*100)+ "% of the documents in "+str(cat)
                y_info["other"]["topic_y_percentage_lbl"][i_cat] = "<br>&#8594; %d documents (%.2f"%(other_length,(other_length/DOC_TOT)*100)+ "% of all the documents)"
            i_cat += 1

        # 5) Plot
        str_html_dict = dict()
        for y_type in ["count","percentage"]:
            y_suffix = ""
            if y_type == "percentage":
                y_suffix = ",.2%"
            for chart_type in ["bars","lines"]:

                yaxis_title_val = "Number of documents"
                if y_type == "percentage":
                    yaxis_title_val = "Percentage"

                barchart_data = [["topics/category"]+[cat for cat in x]]
                fig = go.Figure()

                for k_t in ordered_topics:
                    barchart_data.append([k_t] + y_info[k_t]["topic_y_"+y_type])

                    #convert hex to rgba
                    h = color=y_info[k_t]["color"].lstrip('#')
                    t = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
                    t= t + (y_info[k_t]["color_opacity"],)
                    rgba = "rgba"+str(t)

                    if chart_type == "lines":
                        fig.add_trace(go.Scatter(
                            x=x, y=y_info[k_t]["topic_y_"+y_type],
                            mode='lines+markers',
                            hovertext = y_info[k_t]["topic_y_"+y_type+"_lbl"],
                            hovertemplate =
                            '<b>Topic #'+str(k_t)+'</b>'+
                            '<br>&#8594; <b>%{y}</b> of the documents in <b><%{x}></b> '+
                            '%{hovertext}'+
                            '<extra></extra>', #hide the second box
                            line=dict(color=rgba, width=2.5),
                            hoverlabel = {
                                "font": {"color": 'black'},
                                "bgcolor": rgba
                            },
                            name=k_t))

                    elif chart_type == "bars":
                        fig.add_trace(go.Bar(
                            x=x,
                            y=y_info[k_t]["topic_y_"+y_type],
                            hovertext = y_info[k_t]["topic_y_"+y_type+"_lbl"],
                            hovertemplate =
                            '<b>Topic #'+str(k_t)+'</b>'+
                            '<br>&#8594; <b>%{y}</b> of the documents in <b><%{x}></b> '+
                            '%{hovertext}'+
                            '<extra></extra>', #hide the second box
                            marker = dict(color=y_info[k_t]["color"], opacity=y_info[k_t]["color_opacity"]),
                            hoverlabel = {
                                "font": {"color": 'black'},
                                "bgcolor": rgba
                            },
                            #marker_color= y_info[k_t]["color"], # marker color can be a single color value or an iterable
                            #text = ,
                            name=k_t))

                fig.update_layout(
                    barmode='stack',
                    paper_bgcolor='rgba(0,0,0,0)',
                    plot_bgcolor='rgba(0,0,0,0)',
                    xaxis={'categoryorder':'category ascending'},
                    legend_title_text='Topic',
                    #title="Plot Title",
                    yaxis_tickformat = y_suffix,
                    xaxis_title= META_LABEL,
                    yaxis_title= yaxis_title_val,
                    font=dict(
                        family="helvetica neue",
                        size=17,
                        color="black"
                    )
                )
                fig.update_yaxes(showgrid=True, gridwidth=0.2, gridcolor='#E9E9E9')

                #fig.show()
                #f_name = str(tool_id)+'_'+chart_type+'_chart_('+str(META_KEY)+').html'
                #fig.write_html(self.base_tmp_path+'/'+f_name)
                k_chart = "_".join(sorted([y_type,chart_type]))
                str_html = fig.to_html()
                str_html = str_html.rsplit("\n",3)[0]
                str_html = str_html.split("\n",5)[5]
                str_html_dict[k_chart] = str_html

        html_template = """<!DOCTYPE html>
        <html>
        <head>
          <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
          <link rel="stylesheet" href="http://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
          <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
          <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
          <script type="text/javascript">
            var charts = new Set(["count","bars"]);

            function check(val, exclude_val) {
              if(!(charts.has(val))){
                charts.delete(exclude_val);
                charts.add(val);
              }
              var res_set = Array.from(charts).sort();
              chart_key = Array.from(res_set).join('_');
              console.log(chart_key)
              l_chart_keys = ["bars_count","count_lines","bars_percentage","lines_percentage"];
              for (var i = 0; i < l_chart_keys.length; i++) {
                document.getElementById(l_chart_keys[i]).style.display = "none";
              }
              document.getElementById(chart_key).style.display = "block";
            }
          </script>
          <style>
              body{
                padding: 30px;
              }
              .switch_buttons{
                padding-top: 10px;
                padding-left: 10px;
              }
              .html-object{
                width: 100%;
                height: 600px;
              }
              .switch-btn{
                width: 180px;
              }
              .g-1{
                margin-bottom: 5px;
              }
              #lines_chart{
                display: """+CHART_AXIS_TYPE+""";
              }
            </style>
          <title>Viualizations</title>
        </head>
        <body>
            <div class="switch_buttons">
              <div class="g-1 btn-group btn-group-toggle" data-toggle="buttons">
                 <label class="switch-btn btn btn-light active">
                   <input type="radio" name="options" id="option1" onchange="check('count','percentage')" autocomplete="off" checked> Counts <span style="margin-left: 5px"> # </span>
                 </label>
                 <label class="switch-btn btn btn-light">
                   <input type="radio" name="options" id="option2" onchange="check('percentage','count')" autocomplete="off"> Percentage <span style="margin-left: 5px"> % </span>
                 </label>
              </div>
              <br>
              <div class="g-2 btn-group btn-group-toggle" data-toggle="buttons">
                 <label class="switch-btn btn btn-light active">
                   <input type="radio" name="options" id="option1" onchange="check('bars','lines')" autocomplete="off" checked> Bars chart <span style="margin-left: 5px">
                   <svg class="bi bi-bar-chart-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <rect width="4" height="5" x="1" y="10" rx="1"/>
                      <rect width="4" height="9" x="6" y="6" rx="1"/>
                      <rect width="4" height="14" x="11" y="1" rx="1"/>
                    </svg>
                 </label>
                 <label id="lines_chart" class="switch-btn btn btn-light">
                   <input type="radio" name="options" id="option2" onchange="check('lines','bars')" autocomplete="off"> Lines chart <span style="margin-left: 5px">
                   <svg class="bi bi-graph-up" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0h1v16H0V0zm1 15h15v1H1v-1z"/>
                    <path fill-rule="evenodd" d="M14.39 4.312L10.041 9.75 7 6.707l-3.646 3.647-.708-.708L7 5.293 9.959 8.25l3.65-4.563.781.624z"/>
                    <path fill-rule="evenodd" d="M10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4h-3.5a.5.5 0 0 1-.5-.5z"/>
                  </svg>
                 </label>
              </div>
            </div>
            <div id="content">
              <div id="bars_count" class="html-object" type="text/html">"""+str_html_dict["bars_count"]+"""</div>
              <div id="count_lines" class="html-object" type="text/html">"""+str_html_dict["count_lines"]+"""</div>
              <div id="bars_percentage" class="html-object" type="text/html">"""+str_html_dict["bars_percentage"]+"""</div>
              <div id="lines_percentage" class="html-object" type="text/html">"""+str_html_dict["lines_percentage"]+"""</div>
            </div>
            <script type="text/javascript">
              check('bars','lines');
            </script>
        </body>
        </html>"""

        f_name = str(tool_id)+'_chart_('+str(META_KEY)+')'
        data_to_return["data"]["d-grouped-barchart"] = {f_name+'_data': barchart_data}
        #data_to_return["data"]["d-chart-html"] = {f_name: self.base_tmp_path+'/'+f_name}
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
