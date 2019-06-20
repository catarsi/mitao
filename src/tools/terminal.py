import numpy as np

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

class Terminal(object):

    def __init__(self, base_tmp_path_base):
        self.MY_DPI = 80
        self.base_tmp_path = base_tmp_path_base
        pass

    def doc_topics_barchart(self, input_files, param):
        data_to_return = {"data":{}}

        ok_to_process = False
        #Check the MUST Prerequisite
        # Check Restrictions
        if "d-doc-topics" in input_files:
            if len(input_files["d-doc-topics"]) > 0:
                ok_to_process = True

        if not ok_to_process:
            res_err = {"data":{}}
            res_err["data"]["error"] = "Input data missing!"
            return res_err

        #For each different file entry in input_files["d-doc-topics"] build a different chart and save it
        documents = input_files["d-doc-topics"]
        documents_legend = []
        for file_name in documents:
            all_tab = documents[file_name]
            if(len(all_tab[0]) > 1):
                if(len(all_tab) > 1):
                    topic_names = all_tab[0][1:]
                    doc_names = [r[0] for r in all_tab[1:]]
                    doc_names_index = [r_index for r_index in range(0, len(doc_names)) ]
                    topics_tab = [r[1:] for r in all_tab[1:]]

                    documents_legend.append(["document","index"])
                    for index_doc in range(0,len(doc_names)):
                        documents_legend.append([doc_names[index_doc],index_doc])

                    topics_tab_normalized = []
                    for row in topics_tab:
                        normalize_row = [float(cell) for cell in row]
                        topics_tab_normalized.append(normalize_row)

                    #lets draw now
                    doctopic = np.array(topics_tab_normalized)
                    N, K = doctopic.shape
                    ind = np.arange(N)  # the x-axis locations for the novels
                    width = 0.5  # the width of the bars
                    plots = []
                    height_cumulative = np.zeros(N)

                    for k in range(K):
                        color = plt.cm.coolwarm(k/K, 1)
                        if k == 0:
                            p = plt.bar(ind, doctopic[:, k], width, color=color)
                        else:
                            p = plt.bar(ind, doctopic[:, k], width, bottom=height_cumulative, color=color)
                        height_cumulative += doctopic[:, k]
                        plots.append(p)

                    plt.ylim((0, 1))  # proportions sum to 1, so the height of the stacked bars is 1
                    plt.ylabel('Topics')
                    plt.title('Topic distribution across documents')
                    plt.xticks(ind+width/2, doc_names, rotation = 70, ha="right")
                    plt.yticks(np.arange(0, 1, len(doc_names)))
                    plt.tight_layout()
                    # see http://matplotlib.org/api/pyplot_api.html#matplotlib.pyplot.legend for details
                    # on making a legend in matplotlib
                    plt.legend([p[0] for p in plots], topic_names)
                    plt.savefig(self.base_tmp_path+'/doctopic_chart.png', dpi = 300)
                    plt.close()
                    plt.clf()
                    plt.cla()


        data_to_return["data"]["d-chartimg"] = {'doctopic_chart.png': self.base_tmp_path+'/doctopic_chart.png'}
        data_to_return["data"]["d-chartlegend"] = {'legend': documents_legend}
        return data_to_return

    def topics_words_list(self, input_files, param):
        data_to_return = {"data":{}}

        ok_to_process = False
        #Check the MUST Prerequisite
        # Check Restrictions
        documents = []
        if "d-topics-table" in input_files:
            if len(input_files["d-topics-table"]) > 0:
                documents = input_files["d-topics-table"]
                ok_to_process = True

        if not ok_to_process:
            res_err = {"data":{}}
            res_err["data"]["error"] = "Input data missing!"
            return res_err


        #For each different file entry in input_files["d-topics-table"] build a different chart and save it
        documents_legend = []
        for file_name in documents:
            a_tab = documents[file_name]

            NUM_TOPICS = []
            max_score = 0
            num_top_words = 0
            for row_index in range(1,len(a_tab)):
                if float(a_tab[row_index][2]) > float(max_score):
                    max_score = a_tab[row_index][2]
                NUM_TOPICS.append(a_tab[row_index][0])
                if NUM_TOPICS[0] == a_tab[row_index][0]:
                    num_top_words = num_top_words + 1
            NUM_TOPICS = len(set(NUM_TOPICS))


            MAXFONT = 50
            MINFONT = 16
            fontsize_base = MAXFONT/ float(max_score)

            plt.figure(figsize=(NUM_TOPICS*8, NUM_TOPICS*2.5))

            for t in range(NUM_TOPICS):
                plt.subplot(1, NUM_TOPICS, t + 1)  # plot numbering starts with 1
                plt.box(on=None)
                plt.ylim(0, num_top_words + 0.5)  # stretch the y-axis to accommodate the words
                plt.xticks([])  # remove x-axis markings ('ticks')
                plt.yticks([]) # remove y-axis markings ('ticks')
                plt.title('Topic #{}'.format(t + 1), fontsize = MAXFONT/2, pad = MAXFONT)

                top_words = []
                for row_index in range(1,len(a_tab)):
                    row = a_tab[row_index]
                    if (int(row[0]) == int(t+1)):
                        top_words.append(row[1:])
                #print("Topic",t+1,"with ",num_top_words," : ",top_words)

                for i in range(0,len(top_words)):
                    word = top_words[i][0]
                    score = float(top_words[i][1])
                    plt.text(0.3, num_top_words-i-0.5, word, fontsize= MINFONT + fontsize_base*score)

            #plt.figure(figsize=(800/self.MY_DPI, 800/self.MY_DPI), dpi=self.MY_DPI)
            plt.savefig(self.base_tmp_path+'/topicswords_chart.png', dpi = 200)
            plt.tight_layout();
            plt.close()
            plt.clf()
            plt.cla()

        data_to_return["data"]["d-chartimg"] = {'topicswords_chart.png': self.base_tmp_path+'/topicswords_chart.png'}
        return data_to_return

    def save_file(self, input_files, param):
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
