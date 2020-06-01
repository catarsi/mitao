from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer, SnowballStemmer
from nltk.stem.porter import *
import string
# Importing Gensim
import gensim
from gensim import corpora, models
from gensim.models.coherencemodel import CoherenceModel

import pandas as pd

# Plotting tools
import pyLDAvis
import pyLDAvis.gensim  # don't skip this
import matplotlib.pyplot as plt

class TextAnalysis(object):

    def __init__(self):
        pass

    def tokenize(self, input_files, param):

        data_to_return = {"data":{}}
        ok_to_process = False

        # Check the tool needs
        # -----
        if "d-gen-text" in input_files:
            if len(input_files["d-gen-text"]):
                ok_to_process = True

        if not ok_to_process:
            res_err = {"data":{}}
            res_err["data"]["error"] = "Input data missing!"
            return res_err
        # -----

        # Params
        # -----
        p_stopwords = None #string e.g. "English"
        if param != None:
            if "p-defstopwords" in param:
                p_stopwords = str(param["p-defstopwords"])


        # Data (Input Documents)
        # use pandas and convert to DataFrame
        # -----
        documents = {}
        for file_k in input_files["d-gen-text"]:
            documents[file_k] =  input_files["d-gen-text"][file_k]
        docs_df = pd.DataFrame.from_dict(documents, orient='index', columns=["content"])

        # Data preprocessing
        # Tokenization, remove words having fewer than 3 chars, stopwords, lemmatizing, stemming
        # -----
        lang = "english"
        if p_stopwords != "none":
            lang = p_stopwords.lower()
        stemmer = SnowballStemmer(lang)

        def read_stopwords_data(obj_data):
            res = []
            for file_name in obj_data:
                for a_tab in obj_data[file_name]:
                    for row in a_tab:
                        res.append(row)
            return res

        stopwords_data = set()
        if "d-stopwords" in input_files:
            if len(input_files["d-stopwords"]) > 0:
                stopwords_data = set(read_stopwords_data(input_files["d-stopwords"]))

        def lemmatize_stemming(text):
            return stemmer.stem(WordNetLemmatizer().lemmatize(text, pos='v'))

        def preprocess(text):
            result = []
            for token in gensim.utils.simple_preprocess(text):
                stop = stopwords_data
                if p_stopwords != "none":
                    stop = stop.union(set(stopwords.words(p_stopwords)))
                #stop = gensim.parsing.preprocessing.STOPWORDS
                if token not in stop and len(token) > 3:
                    result.append(lemmatize_stemming(token))
            return result

        processed_docs = docs_df['content'].map(preprocess)
        processed_docs_ldict = []
        for k,doc in processed_docs.items():
            processed_docs_ldict.append({"index":k,"value":doc})

        data_to_return["data"]["d-processed-corpus"] = {"processed_corpus": processed_docs_ldict}
        return data_to_return

    def build_corpus(self, input_files, param):

        data_to_return = {"data":{}}
        ok_to_process = False
        #Check the MUST Prerequisite
        # Check Restrictions
        if "d-processed-corpus" in input_files:
            if len(input_files["d-processed-corpus"]):
                ok_to_process = True

        if not ok_to_process:
            res_err = {"data":{}}
            res_err["data"]["error"] = "Input data missing!"
            return res_err

        # convert to data series
        indexes = []
        values = []
        # in this case i expect only 1 file
        for file_k in input_files["d-processed-corpus"]:
            for d in input_files["d-processed-corpus"][file_k]:
                indexes.append(d["index"])
                values.append(d["value"])
        processed_docs = pd.Series(values, index =indexes)

        #The params
        #---------
        p_model = None #string e.g. "English"
        if param != None:
            if "p-corpusmodel" in param:
                p_model = str(param["p-corpusmodel"])


        # -> Create the dictionary of words containing the number of times a word appears in the training set
        # -> Filter out tokens that appear in: (a) less than 15 documents; OR (b) more than 0.5 documents
        # -> and keep only the first 100000 most frequent tokens.
        # -----
        dictionary = gensim.corpora.Dictionary(processed_docs)
        #dictionary.filter_extremes()
        index_corpus = []
        vec_corpus = []
        for k,doc in processed_docs.items():
            vec_corpus.append(dictionary.doc2bow(doc))
            index_corpus.append(k)

        # TF-IDF
        if p_model == "tfidf":
            tfidf = models.TfidfModel(vec_corpus)
            vec_corpus = tfidf[vec_corpus]


        #The returned data must include a recognizable key and the data associated to it
        # -----
        vec_corpus_ldict = []
        for i in range(0,len(vec_corpus)):
            vec_corpus_ldict.append({"index":index_corpus[i],"value":vec_corpus[i]})

        data_to_return["data"]["d-model-corpus"] = {"modelled_corpus": vec_corpus_ldict}
        data_to_return["data"]["d-dictionary-corpus"] = {"dictionary": dictionary}
        return data_to_return

    def lda(self, input_files, param):

        data_to_return = {"data":{}}
        ok_to_process = False

        # Check the tool needs
        # -----
        if "d-model-corpus" in input_files and "d-dictionary-corpus" in input_files:
            ok_to_process = len(input_files["d-model-corpus"]) and len(input_files["d-dictionary-corpus"])

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
            print(input_files["d-dictionary-corpus"][file_k])
            dictionary = input_files["d-dictionary-corpus"][file_k]

        # Params
        # -----
        p_num_topics = 5 #int number
        if param != None:
            if "p-topic" in param:
                p_num_topics = int(param["p-topic"])

        # Running LDA
        # -----
        try:
            ldamodel = gensim.models.LdaMulticore(corpus, num_topics=p_num_topics, id2word=dictionary, passes=5, workers=2)
        except:
            res_err = {"data":{}}
            res_err["data"]["error"] = "Incompatible data have been given as input to the LDA algorithm"
            return res_err

        data_to_return["data"]["d-gensimldamodel"] = {"ldamodel": ldamodel}
        return data_to_return

    def ldavis(self, input_files, param):

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

        vis = pyLDAvis.gensim.prepare(ldamodel, corpus, dictionary)
        html_str = pyLDAvis.prepared_data_to_html(vis)
        data_to_return["data"]["d-webpage"] = {"webpage": html_str}
        return data_to_return

    def doc_prop_topics(self, input_files, param):

        data_to_return = {"data":{}}
        ok_to_process = False

        # Check the tool needs
        # -----
        if "d-model-corpus" in input_files and "d-gensimldamodel" in input_files:
            ok_to_process = len(input_files["d-model-corpus"]) and len(input_files["d-gensimldamodel"])

        if not ok_to_process:
            res_err = {"data":{}}
            res_err["data"]["error"] = "Input data missing!"
            return res_err

        corpus = []
        corpus_doc_index = []
        for file_k in input_files["d-model-corpus"]:
            for d in input_files["d-model-corpus"][file_k]:
                corpus.append(d["value"])
                corpus_doc_index.append(d["index"])

        ldamodel = None
        for file_k in input_files["d-gensimldamodel"]:
            ldamodel = input_files["d-gensimldamodel"][file_k]

        # Params
        # -----

        def _doc_topics(ldamodel, corpus, corpus_doc_index):

            topic_num_list = []
            doc_topics_l = []
            for i, row_list in enumerate(ldamodel[corpus]):
                row = row_list[0] if ldamodel.per_word_topics else row_list
                if i == 0:
                    topic_num_list = [val[0] for i,val in enumerate(row)]
                row_doc = [round(val[1],4) for i,val in enumerate(row)]
                doc_topics_l.append(row_doc)

            return pd.DataFrame(doc_topics_l, columns = topic_num_list, index = corpus_doc_index)

        df_doc_topics = _doc_topics(ldamodel,corpus, corpus_doc_index)
        df_doc_topics.index.names = ['doc']
        df_doc_topics = df_doc_topics.reset_index()
        l_doc_topics = [df_doc_topics.columns.values.tolist()] + df_doc_topics.values.tolist()

        data_to_return["data"]["d-doc-topics-table"] = {"doc_topics": l_doc_topics}
        return data_to_return

    def words_prop_topics(self, input_files, param):

        data_to_return = {"data":{}}
        ok_to_process = False

        # Check the tool needs
        # -----
        if "d-model-corpus" in input_files and "d-gensimldamodel" in input_files:
            ok_to_process = len(input_files["d-model-corpus"]) and len(input_files["d-gensimldamodel"])

        if not ok_to_process:
            res_err = {"data":{}}
            res_err["data"]["error"] = "Input data missing!"
            return res_err

        corpus = []
        corpus_doc_index = []
        for file_k in input_files["d-model-corpus"]:
            for d in input_files["d-model-corpus"][file_k]:
                corpus.append(d["value"])
                corpus_doc_index.append(d["index"])

        ldamodel = None
        for file_k in input_files["d-gensimldamodel"]:
            ldamodel = input_files["d-gensimldamodel"][file_k]

        # Params
        # -----
        topnum_words = 10 #int number
        if param != None:
            if "p-numwords" in param:
                p_num_topics = int(param["p-numwords"])

        def _word_topics(ldamodel, corpus, corpus_doc_index):

            topics_index = set()
            topics = []
            for i, row_list in enumerate(ldamodel[corpus]):
                row = row_list[0] if ldamodel.per_word_topics else row_list
                for j, (topic_num, prop_topic) in enumerate(row):
                    wp = ldamodel.show_topic(topic_num, topn=topnum_words)
                    topic_keywords = [[topic_num,word,prop] for word, prop in wp]
                    if not topic_num in topics_index:
                        topics = topics + topic_keywords
                    topics_index.add(topic_num)

            return pd.DataFrame(topics, columns = ["topic","word","prop"])

        df_topics = _word_topics(ldamodel,corpus, corpus_doc_index)
        l_topics = [df_topics.columns.values.tolist()] + df_topics.values.tolist()
        print(l_topics)
        data_to_return["data"]["d-word-topics-table"] = {"word_topics": l_topics}
        return data_to_return
