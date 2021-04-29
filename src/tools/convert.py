import re
import pandas as pd

class Convert(object):

    def __init__(self):
        pass

    def meta_builder_from_tab(self, input_files, param, tool_id):

        # INPUTS and PARAMETERS
        # ---------------
        ## Check the input
        ## TAB_FILE is a dictionary;
        ## the key is the name of the table file; the value is the table itself in a matrix format (list of lists)
        TAB_FILE = None
        if "d-gen-table"in input_files:
            if len(input_files["d-gen-table"]) > 1:
                return {"data":{"error": "only one table should be given as input"}}
            elif len(input_files["d-gen-table"]) == 0:
                return {"data":{"error": "a table must be given as input"}}
            else:
                TAB_FILE = list(input_files["d-gen-table"].items())[0]
        if TAB_FILE == None:
            return {"data":{"error": "a table must be given as input"}}

        # Get data and Parameters
        ATT_ID = None
        ATT_CONTENT = []
        if param != None:
            if "p-tab-att-id" in param:
                ATT_ID = str(param["p-tab-att-id"])
            if "p-tab-atts-content" in param:
                ATT_CONTENT = str(param["p-tab-atts-content"]).split(", ")

        if ATT_ID == None:
            return {"data":{"error": "the column used as id must be specified"}}
        if len(ATT_CONTENT) == 0:
            return {"data":{"error": "the columns used as meta attributes must be specified"}}


        # MAIN BODY OF THE TOOL
        # ---------------

        ## Functions
        def tab_to_meta(table_matrix, att_id, atts_content):

            df_table = pd.DataFrame(table_matrix[1:], columns = table_matrix[0])
            atts_content.insert(0,att_id)
            if len(set(table_matrix[0]).intersection(set(atts_content))) != len(atts_content):
                return {"error": "the column names are incorrect"}

            sub_df = df_table[atts_content]
            documents = dict()
            for row in sub_df.values:

                # Get the content
                json_content = {}
                f_name = str(row[0])
                meta_atts = atts_content[1:]
                for i,val in enumerate(row[1:]):
                    json_content[meta_atts[i]] = val

                documents[f_name] = json_content

            print(documents)
            return {"d-metadata": documents}

        #Define the set of documents
        documents_to_return = tab_to_meta(TAB_FILE[1],ATT_ID,ATT_CONTENT)
        return {"data": documents_to_return}


    def doc_builder(self, input_files, param, tool_id):

        # INPUTS and PARAMETERS
        # ---------------

        ## Check the input
        ## TAB_FILE is a dictionary;
        ## the key is the name of the table file; the value is the table itself in a matrix format (list of lists)
        TAB_FILE = None
        if "d-gen-table"in input_files:
            if len(input_files["d-gen-table"]) > 1:
                return {"data":{"error": "only one table should be given as input"}}
            elif len(input_files["d-gen-table"]) == 0:
                return {"data":{"error": "a table must be given as input"}}
            else:
                TAB_FILE = list(input_files["d-gen-table"].items())[0]
        if TAB_FILE == None:
            return {"data":{"error": "a table must be given as input"}}

        # Get data and Parameters
        ATT_ID = None
        ATT_CONTENT = []
        if param != None:
            if "p-tab-att-id" in param:
                ATT_ID = str(param["p-tab-att-id"])
            if "p-tab-atts-content" in param:
                ATT_CONTENT = str(param["p-tab-atts-content"]).split(", ")

        if ATT_ID == None:
            return {"data":{"error": "the column used as id must be specified"}}
        if len(ATT_CONTENT) == 0:
            return {"data":{"error": "the columns used for the content must be specified"}}

        # MAIN BODY OF THE TOOL
        # ---------------

        ## Functions
        def tab_to_docs(table_matrix, att_id, atts_content, exclude_empty = True, lowercase = True, separator = " ", file_extension=".txt"):

            df_table = pd.DataFrame(table_matrix[1:], columns = table_matrix[0])
            atts_content.insert(0,att_id)
            if len(set(table_matrix[0]).intersection(set(atts_content))) != len(atts_content):
                return {"error": "the column names are incorrect"}

            sub_df = df_table[atts_content]
            documents = dict()
            for row in sub_df.values:

                # Get the content
                str_content = ""
                for val in row[1:]:
                    str_val = str(val).strip()
                    if lowercase:
                        str_val = str_val.lower()
                    if str_val != "NaN" and str_val != "nan" and str_val != "":
                        str_content += str(val) + str(separator)

                if len(str_content) >= len(separator):
                    str_content = str_content[:-len(separator)]

                if str_content != "" and exclude_empty:
                    f_name = str(row[0])
                    documents[row[0]] = str_content

            return {"d-gen-text": documents}

        #Define the set of documents
        documents_to_return = tab_to_docs(TAB_FILE[1],ATT_ID,ATT_CONTENT)
        return {"data": documents_to_return}

    def pdf_to_text(self, input_files, param, tool_id):
        data_to_return = {"data":{}}

        # Check Restrictions
        if "d-gen-pdf" in input_files:
            if len(input_files["d-gen-pdf"]) == 0:
                return {"data":{"error": "input data missing"}}

        #Define the set of documents
        documents = {}
        for file_k in input_files["d-gen-pdf"]:
            a_pdf_in_txt_file = input_files["d-gen-pdf"][file_k]
            documents[file_k] =  a_pdf_in_txt_file

        data_to_return["data"]["d-gen-text"] = documents
        return data_to_return

    def meta_builder(self, input_files, param, tool_id):

        def clean_file_name(f_path):
            clean_index = f_path
            #Remove extension
            for i in reversed(range(len(clean_index))):
                if clean_index[i] == ".":
                    clean_index = clean_index[:i]
                    break
            #Remove path to file
            for i in reversed(range(len(clean_index))):
                if "/" in clean_index[i] or "\\ "[0] in clean_index[i]:
                    clean_index = clean_index[i+1:]
                    break
            return clean_index

        data_to_return = {"data":{}}

        # Pre
        # -------
        # Check Restrictions
        ok_to_process = "d-gen-text" in input_files
        ok_to_process = ok_to_process and len(input_files["d-gen-text"]) > 1
        if not ok_to_process:
            data_to_return["data"]["error"] = "unexpected or missing input!"
            return data_to_return

        # Read inputs
        documents = {}
        for file_k in input_files["d-gen-text"]:
            documents[file_k] =  input_files["d-gen-text"][file_k]

        # Params
        REGEX_TEXT = None
        if param != None:
            if "p-metaregex" in param:
                REGEX_TEXT = str(param["p-metaregex"])


        meta_list = [row.split("[[ATT]]") for row in REGEX_TEXT.split("[[RULE]]")]
        docs_meta = {}
        for f_name in documents:
            meta_dict = dict()
            for r in meta_list:
                row_index = dict()
                for cell in r:
                    parts = cell.split("[[EQUALS]]")
                    att_name = parts[0]
                    att_value = parts[1]
                    row_index[att_name] = att_value

                found_elem = re.findall(row_index["regex"], f_name)
                if "list" in row_index["type"]:
                    att_type = row_index["type"]
                    att_type_val = re.findall(r'list\((.*)\)', att_type)
                    if len(att_type_val) > 0:
                        att_type_parts = att_type_val[0].split(",")
                        data_type = att_type_parts[0]
                        separator = att_type_parts[1]
                        l_res = found_elem[0].split(separator)
                        meta_dict[row_index["att"]] = found_elem[0].split(separator)
                else:
                    if len(found_elem) > 0:
                        meta_dict[row_index["att"]] = found_elem[0]

            docs_meta[clean_file_name(f_name)] = meta_dict


        data_to_return["data"]["d-metadata"] = docs_meta
        return data_to_return
