import os
import json
from shutil import copyfile

class Linker(object):

    def __init__(self, base_process_path):
        self.process_dir = base_process_path+"/"
        self.index = {}

    def reset(self):
        self.index = {}

    def get_elem(self, id):
        if id in self.index:
            return self.index[id]
        else:
            return -1

    def index_elem(self, id):
        if id not in self.index:
            self.index[id] = {}
            self.__create_process_dir(id)
        return self.index[id]

    def add_entry(self, id, data_key, list_data_obj):
        if id in self.index:
            if data_key not in self.index[id]:
                self.index[id][data_key] = set()
            for file_name in set(list_data_obj.keys()):
                self.index[id][data_key].add(file_name)
            return self.index[id][data_key]
        return -1

    def build_data_entry(self, node):
        new_entry = {}
        #the value
        new_entry[node["value"]] = {}

        #add the corresponding files
        files = None;
        if 'p-file[]' in node["param"]:
            files = node["param"]['p-file[]']
        new_entry[node["value"]]['files'] = files
        #the class
        new_entry[node["value"]]['class'] = node["class"]

        return new_entry


    def get_data(self, id):
        if id in self.index:
            return self.index[id]['file']
        else:
            return -1

    #dir should be like the node id
    def __create_process_dir(self, dir_id):
        new_dir = self.process_dir+str(dir_id)
        try:
            os.mkdir(new_dir)
            return self.process_dir+str(dir_id)
        except FileExistsError:
            return self.process_dir+str(dir_id)

    #create an index for the internal files
    def __dump_index(self, dir, data_id, files):
        index = {}
        index[data_id] = files
        with open(str(dir)+'/index.json', 'w') as f:
            json.dump(index, f)

    def __copy_files(self, files, dir, type):
        if type == 'text':
            self.__text_file(files, dir)
        elif type == 'table':
            self.__text_file(files, dir)

    def __text_file(self, files, dir):
        for f in files:
            copyfile(f, dir+"/"+f.name)

    def __table_file(self):
        for f in files:
            copyfile(f, dir+"/"+f.name)
