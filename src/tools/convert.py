
class Convert(object):

    def __init__(self):
        pass

    def pdf_to_text(self, input_files, param):
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
