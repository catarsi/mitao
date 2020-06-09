import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from collections import defaultdict
import re

import matplotlib
matplotlib.use('Agg')

# Plotting tools
import pyLDAvis
import pyLDAvis.gensim  # don't skip this
import matplotlib.pyplot as plt

class Terminal(object):

    def __init__(self, base_tmp_path_base):
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
        if param != None:
            if "p-topic" in param:
                NUM_TOPICS = int(param["p-topic"])
            if "p-meta-category" in param:
                META_KEY = param["p-meta-category"]
                META_LABEL = "metadata attribute = <"+META_KEY+">"


        # Process
        # -------
        # 1) Read and process the inputs
        def get_column_name_for_max_values_of(row,df):
            return df.loc[:,df.loc[row] == df.loc[row].max()].columns.tolist()

        mydf = pd.DataFrame.from_records(inputs["docs_topics"][1:])
        mydf.columns = inputs["docs_topics"][0]
        mydf = mydf.set_index(inputs["docs_topics"][0][0])
        dict_topics = dict((el,[]) for el in mydf.columns)
        index_files = []
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
        DOC_TOT = 0
        CAT_TOT = defaultdict(int)
        for t in dict_topics:
            for f_k in dict_topics[t]:
                if f_k in meta and META_KEY in meta[f_k]:
                    if not meta[f_k][META_KEY] in dict_cat:
                        dict_cat[meta[f_k][META_KEY]] = []

                    index_in = [i for i, d in enumerate(dict_cat[meta[f_k][META_KEY]]) if d["topic"] == t]
                    if len(index_in) == 0:
                        dict_cat[meta[f_k][META_KEY]].append({"topic":t, "length":0, "items":[]})
                        index_in = [len(dict_cat[meta[f_k][META_KEY]]) - 1]

                    dict_cat[meta[f_k][META_KEY]][index_in[0]]["items"].append(f_k)
                    dict_cat[meta[f_k][META_KEY]][index_in[0]]["length"] += 1
                    DOC_TOT += 1
                    CAT_TOT[meta[f_k][META_KEY]] += 1

        # 3) Sort the topics
        for cat in dict_cat:
            dict_cat[cat] = sorted(dict_cat[cat], key=lambda k: k['length'], reverse=True)

        # 4) Prepare the Y-axis
        y_info= dict()
        i_cat = 0
        PALETTE = ["#2a9d8f","#e9c46a","#8ab17d","#e76f51","#287271","#f4a261","#df8f71","#cba270","#264653","#887161"]
        OTHER_COLOR = "#C7C7C7"
        color_id = 0
        ordered_bars = []
        for cat in dict_cat:
            tot_top_docs = 0
            for elem in dict_cat[cat][:NUM_TOPICS]:
                if not elem["topic"] in y_info:
                    y_info[elem["topic"]] = {
                        "topic_y": [0 for _ in range(len(dict_cat))],
                        "topic_y_lbl": "{0:.2f}%".format(elem["length"]/DOC_TOT) + " of all the documents <br>"+"{0:.2f}%".format(elem["length"]/CAT_TOT[cat]) + " of the documents in "+str(cat),
                        #"color": PALETTE[color_id]
                        "color": None
                    }
                    ordered_bars.append(elem["topic"])
                    color_id += 1
                y_info[elem["topic"]]["topic_y"][i_cat] = elem['length']
                tot_top_docs += elem['length']

            other_length = CAT_TOT[cat] - tot_top_docs
            if NUM_TOPICS < len(dict_cat[cat]):
                if not "other" in y_info:
                    ordered_bars.insert(0,"other")
                    y_info["other"] = {
                        "topic_y": [0 for _ in range(len(dict_cat))],
                        "topic_y_lbl": "{0:.2f}%".format(other_length/DOC_TOT) + " of all the documents <br>"+"{0:.2f}%".format(other_length/CAT_TOT[cat]) + " of the documents in "+str(cat),
                        "color": OTHER_COLOR
                    }
                y_info["other"]["topic_y"][i_cat] = other_length
            i_cat += 1

        # 5) Plot
        barchart_data = [["topics/category"]+[cat for cat in dict_cat]]
        fig = go.Figure()
        x = list(dict_cat.keys())
        for k_t in ordered_bars:
            barchart_data.append([k_t] + y_info[k_t]["topic_y"])
            fig.add_trace(go.Bar(
                x=x,
                y=y_info[k_t]["topic_y"],
                hovertemplate =
                '<b>Documents</b>: %{y}'+
                '<br><b>Category</b>: %{x}<br>'+
                '<b>'+y_info[k_t]["topic_y_lbl"]+'</b>',
                marker_color= y_info[k_t]["color"], # marker color can be a single color value or an iterable
                #text = ,
                name=k_t))

        fig.update_layout(
            barmode='stack',
            xaxis={'categoryorder':'category ascending'},
            #title="Plot Title",
            xaxis_title= META_LABEL,
            yaxis_title= "Number of documents",
            font=dict(
                family="Courier New, monospace",
                size=14,
                color="#7f7f7f"
            )
        )

        #fig.show()
        f_name = str(tool_id)+'_topicsdocs_chart.html'
        fig.write_html(self.base_tmp_path+'/'+f_name)

        data_to_return["data"]["d-grouped-barchart"] = {'barchart_data': barchart_data}
        data_to_return["data"]["d-chart-html"] = {f_name: self.base_tmp_path+'/'+f_name}
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
