import re

class Filter(object):

    def __init__(self):
        pass

    def filter_text(self, input_files, param):
        data_to_return = {"data":{}}

        # Check Restrictions
        ok_to_process = False
        if "d-gen-text" in input_files:
            if len(input_files["d-gen-text"]):
                ok_to_process = True

        if not ok_to_process:
            res_err = {"data":{}}
            res_err["data"]["error"]= "Input data missing!"
            return res_err

        #Define the set of documents
        documents = {}
        for file_k in input_files["d-gen-text"]:
            #iterate through the array of values given
            documents[file_k] =  input_files["d-gen-text"][file_k]

        # Check the given param
        f_macro = []
        f_regex = ""
        if param != None:
            if "p-filteropt" in param:
                if param["p-filteropt"]:
                    for f_opt in param["p-filteropt"]:
                        if f_opt == "names":
                            pass
                        elif f_opt == "dates":
                            documents = self._filter_dates(documents)
                        elif f_opt == "references":
                            documents = self._filter_references(documents)
                        elif f_opt == "header":
                            documents = self._filter_header(documents)

            if "p-filterregex" in param:
                documents = self._filter_by_regex(documents, param["p-filterregex"])

        data_to_return["data"]["d-gen-text"] = documents
        return data_to_return

    def _filter_header(self, documents):
        REGEX_list = [
            "(.+)Abstract"
        ]
        d_filtered = {}
        for doc_k in documents:
            doc_val = documents[doc_k]
            for d_reg_i in REGEX_list:
                a_regex = re.compile(d_reg_i,re.DOTALL)
                doc_val = re.sub(a_regex,"",doc_val)
            d_filtered[doc_k] = doc_val
        return d_filtered

    def _filter_references(self, documents):
        REGEX_list = [
            "References(.+)"
        ]
        d_filtered = {}
        for doc_k in documents:
            doc_val = documents[doc_k]
            for d_reg_i in REGEX_list:
                a_regex = re.compile(d_reg_i,re.DOTALL)
                doc_val = re.sub(a_regex,"",doc_val)
            d_filtered[doc_k] = doc_val
        return d_filtered

    def _filter_dates(self, documents):
        DATES_REGEX_list = [
            "([0-9]{4}/[0-9]{2}/[0-9]{2})",
            "([0-9]{2}/[0-9]{2}/[0-9]{4})",
            "([0-9]{4}-[0-9]{2}-[0-9]{2})",
            "([0-9]{2}-[0-9]{2}-[0-9]{4})"
        ]
        d_filtered = {}
        for doc_k in documents:
            doc_val = documents[doc_k]
            for d_reg_i in DATES_REGEX_list:
                a_regex = re.compile(d_reg_i)
                doc_val = re.sub(a_regex,"",doc_val)
            d_filtered[doc_k] = doc_val
        return d_filtered

    def _filter_by_regex(self, documents, a_regex_str):
        d_filtered = {}
        a_regex = re.compile(a_regex_str)
        for doc_k in documents:
            doc_val = documents[doc_k]
            d_filtered[doc_k] = re.sub(a_regex,"", doc_val)
        return d_filtered
