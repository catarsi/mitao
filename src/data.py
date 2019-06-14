import pdftotext

class Data(object):

    def __init__(self, data_config):
        # All the type of data in their corresponding data-class
        self.data_index = {}
        for k_data in data_config:
            self.data_index[k_data] = {}
            self.data_index[k_data]['data_class'] = data_config[k_data]["data_class"]
            self.data_index[k_data]['file_name'] = data_config[k_data]["file_name"]

    def get_data_index(self, d_key):
        if d_key in self.data_index:
            return self.data_index[d_key]
        else:
            return None

    def handle(self, files_list, data_value, file_type = "file", param = None, tmp_folder = None):
        list_docs_obj = {}
        data_class = None
        if data_value in self.data_index:
            data_class = self.data_index[data_value]['data_class']
            #file_name = self.data_index[data_value]['file_name']
            if files_list:
                for a_file in files_list:
                    if file_type == "path":
                        path_parts = a_file.split("/")
                        file_name = path_parts[len(path_parts)-1]
                    elif file_type == "file":
                        file_name = a_file.filename

                    if data_class == 'img':
                        list_docs_obj[file_name] = self.process_img(file_name, tmp_folder)
                    elif data_class == 'pdf':
                        list_docs_obj[file_name] = self.process_pdf(file_name, a_file)
                    else:
                        a_doc = self.read_input(a_file, file_type)
                        list_docs_obj[file_name] = None
                        if data_class == 'text':
                            list_docs_obj[file_name] = self.process_text(a_doc)
                        elif data_class == 'table':
                            list_docs_obj[file_name] = self.process_table(a_doc)

        return (list_docs_obj, data_class)

    def read_input(self,a_file, file_type):
        res = None
        if file_type == "path":
            a_f = open(a_file,"r", encoding='utf-8', errors='ignore')
            res = a_f.read()
            a_f.close()
        elif file_type == "file":
            res = str(a_file.read(),'utf-8',errors='ignore')
        else:
            res = a_file
        return res

    def process_img(self, img_file_name, base_tmp_path):
        return base_tmp_path+"/"+img_file_name

    def process_pdf(self, pdf_file_name, a_pdf_file):
        #the other approach
        #a_pdf_file.save(base_tmp_path)
        a_text_file = pdftotext.PDF(a_pdf_file)
        a_text_file = " ".join(a_text_file)
        return a_text_file

    def process_text(self,an_input):
        return an_input

    def process_table(self,an_input, with_header = False):
        res_matrix = []
        rows = an_input.split("\n")

        starting_i = 0
        if with_header:
            starting_i = 1
        for i in range(starting_i,len(rows)):
            r = rows[i]
            res_matrix.append(r.split(","))
        return res_matrix
