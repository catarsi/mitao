#import pdftotext
from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfpage import PDFPage
from io import BytesIO

class Data(object):

    def __init__(self, data_config, base_tmp_path):
        # All the type of data in their corresponding data-class
        self.tmp_folder = base_tmp_path
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

    def handle(self, files_list, data_value, file_type = "file", param = None):
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
                        list_docs_obj[file_name] = self.process_img(file_name)
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

    def process_img(self, img_file_name):
        return self.tmp_folder+"/"+img_file_name

    def process_pdf(self, pdf_file_name, a_pdf_file):

        def decode_str(_input):
            return _input.decode("utf-8")

        def pdf_to_text(path):
            manager = PDFResourceManager()
            retstr = BytesIO()
            layout = LAParams(all_texts=True)
            device = TextConverter(manager, retstr, laparams=layout)
            filepath = open(path, 'rb')
            interpreter = PDFPageInterpreter(manager, device)

            for page in PDFPage.get_pages(filepath, check_extractable=True):
                interpreter.process_page(page)

            text = retstr.getvalue()

            filepath.close()
            device.close()
            retstr.close()
            return text

        #the other approach
        full_path = self.tmp_folder+"/"+pdf_file_name
        a_pdf_file.save(full_path)
        #a_text_file = pdftotext.PDF(a_pdf_file)
        a_text_file = pdf_to_text(full_path)
        a_text_file = decode_str(a_text_file)
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
