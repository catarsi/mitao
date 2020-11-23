import re

class Convert(object):

    def __init__(self):
        pass

    def pdf_to_text(self, input_files, param, tool_id):
        data_to_return = {"data":{}}

        # Check Restrictions
        ok_to_process = False
        if "d-gen-pdf" in input_files:
            if len(input_files["d-gen-pdf"]):
                ok_to_process = True

        if not ok_to_process:
            res_err = {"data":{}}
            res_err["data"]["error"]= "Input data missing!"
            return res_err

        #Define the set of documents
        documents = {}
        for file_k in input_files["d-gen-pdf"]:
            a_pdf_in_txt_file = input_files["d-gen-pdf"][file_k]
            documents[file_k] =  a_pdf_in_txt_file

        data_to_return["data"]["d-gen-text"] = documents
        return data_to_return

    def meta_builder(self, input_files, param, tool_id):
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

            docs_meta[f_name] = meta_dict


        data_to_return["data"]["d-metadata"] = docs_meta
        return data_to_return
