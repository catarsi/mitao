from nltk.corpus import stopwords
from nltk.stem.wordnet import WordNetLemmatizer
import string
# Importing Gensim
import gensim
from gensim import corpora
from gensim.models.coherencemodel import CoherenceModel

# Plotting tools
#import pyLDAvis
#import pyLDAvis.gensim  # don't skip this

class TextAnalysis(object):

    def __init__(self):
        pass

    # Each tool defined here must respect the configuration attributes given in the config file
    # the returned output must be same as these defined in the [output] key for the corresponding method
    def lda(self, input_files, param):

        data_to_return = {"data":{}}
        ok_to_process = False
        #Check the MUST Prerequisite
        # Check Restrictions
        if "d-gen-text" in input_files:
            if len(input_files["d-gen-text"]):
                ok_to_process = True

        if not ok_to_process:
            res_err = {"data":{}}
            res_err["data"]["error"] = "Input data missing!"
            return res_err

        #The params
        p_num_topics = 5
        p_num_words = None
        p_stopwords = None
        if param != None:
            if "p-topic" in param:
                p_num_topics = int(param["p-topic"])
            if "p-numwords" in param:
                p_num_words = int(param["p-numwords"])
            if "p-defstopwords" in param:
                p_stopwords = str(param["p-defstopwords"])


        #Define the set of documents
        documents = {}
        for file_k in input_files["d-gen-text"]:
            #iterate through the array of values given
            documents[file_k] =  input_files["d-gen-text"][file_k]


        def clean(doc, p_stopwords, d_stopwords):
            stop = d_stopwords
            if p_stopwords != "none":
                stop = stop.union(set(stopwords.words(p_stopwords)))
            stop_free = " ".join([i for i in doc.lower().split() if i not in stop])
            for s_w in stop_free:
                if "accounting" in s_w:
                    print(s_w)
            exclude = set(string.punctuation)
            punc_free = ''.join(ch for ch in stop_free if ch not in exclude)
            lemma = WordNetLemmatizer()
            normalized = " ".join(lemma.lemmatize(word) for word in punc_free.split())
            return normalized

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

        print(stopwords_data)
        doc_clean = [clean(str(documents[doc_k]), p_stopwords, stopwords_data).split() for doc_k in documents]
        doc_names = [doc_k for doc_k in documents]

        # Creating the term dictionary of our courpus, where every unique term is assigned an index.
        dictionary = corpora.Dictionary(doc_clean)

        # Converting list of documents (corpus) into Document Term Matrix using dictionary prepared above.
        doc_term_matrix = [dictionary.doc2bow(doc) for doc in doc_clean]


        # Creating the object for LDA model using gensim library
        Lda = gensim.models.ldamodel.LdaModel

        # Running and Trainign LDA model on the document term matrix.
        try:
            ldamodel = Lda(doc_term_matrix, num_topics= p_num_topics, id2word = dictionary, passes=50)
        except:
            res_err = {"data":{}}
            res_err["data"]["error"] = "Incompatible data have been given as input to the LDA algorithm"
            return res_err

        res = ldamodel.print_topics(num_topics= p_num_topics, num_words= p_num_words)

        # Get the Perplexity value
        perplexity = ldamodel.log_perplexity(doc_term_matrix)
        # Get the Coherence value
        cm = CoherenceModel(model=ldamodel, corpus=doc_term_matrix, coherence='u_mass')
        coherence = cm.get_coherence()

        # populate the files according to the topics found
        a_tab = [["topic","word","score"]]
        for topic_i in res:
            # 0: is id, 1: str of all words
            t_id = topic_i[0] + 1
            t_words_str = topic_i[1]
            t_words = t_words_str.split(" + ")
            for a_t_word in t_words:
                a_t_word_parts = a_t_word.split("*")
                score = a_t_word_parts[0]
                the_word = a_t_word_parts[1].replace('"','')
                a_tab.append([t_id,the_word,score])

        try:
            all_topics = ldamodel.get_document_topics(doc_term_matrix, minimum_probability=0, per_word_topics=True)
        except Exception as e:
            print(e)

        tab_doc_topics = []
        doc_index = 0
        for doc_topics, word_topics, phi_values in all_topics:
            if doc_index == 0:
                header = ["doc"]
                for t_i in range(0,len(doc_topics)):
                    header.append("Topic #"+str(t_i+1))
                tab_doc_topics.append(header)

            doc_topic_val = [doc_names[doc_index]]
            for d_t in doc_topics:
                doc_topic_val.append(d_t[1])

            tab_doc_topics.append(doc_topic_val)
            doc_index = doc_index + 1

        #The returned data must include a recognizable key and the data associated to it
        data_to_return["data"]["d-topics-table"] = {"topics": a_tab}
        data_to_return["data"]["d-coherence"] = {"coherence": str(coherence)}
        data_to_return["data"]["d-perplexity"] = {"perplexity": str(perplexity)}
        data_to_return["data"]["d-doc-topics"] = {"doctopics": tab_doc_topics}
        return data_to_return
