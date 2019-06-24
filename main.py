
import json
import requests
import re
import sys
import csv
import os, shutil
import time
from os.path import basename
from shutil import copyfile
import zipfile

from src import tool
from src import data
from src import linker

from flask import Flask, render_template, request, json, jsonify, redirect, url_for, send_file, after_this_request
#from flask.ext.cache import Cache
#cache = Cache()
import webbrowser
from threading import Timer

#cache.clear()
app = Flask(__name__)
#app.config['DEBUG'] = True
#app.debug = True
app.config.update(
    SEND_FILE_MAX_AGE_DEFAULT=True
)

SCRIPT_PATH = ""
if (len(sys.argv) > 1):
    SCRIPT_PATH = str(sys.argv[1])

BASE_PROCESS_PATH = SCRIPT_PATH+"/src/.process-temp"
BASE_TMP_PATH = SCRIPT_PATH+"/src/.tmp"
BASE_CONFIG_PATH = SCRIPT_PATH+"/src/.data"
CONFIG_DATA = {}

#Will store all the FileStorage of the 'data' nodes
corpus = {}
dipam_linker = None
dipam_tool = None
dipam_data = None

#Handled extensions
FILE_TYPE = {}
FILE_TYPE["pdf"] = ["pdf"]
FILE_TYPE["img"] = ["png"]
FILE_TYPE["text"] = ["txt"]
FILE_TYPE["table"] = ["csv"]

def shutdown_server():
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Not running with the Werkzeug Server')
    func()

@app.route('/shutdown')
def shutdown():
    shutdown_server()
    return 'Server shutting down...'


@app.route('/status')
def status():
    return "Online\n"

#example: /dipam?workflow=WW&?config=CC
@app.route('/')
def index():
    workflow_path = request.args.get('workflow')
    if workflow_path == None:
        workflow_path = BASE_CONFIG_PATH+"/workflow.json"
    workflow_data = json.load(open(workflow_path))
    return render_template('index.html', workflow=workflow_data, config=CONFIG_DATA)

@app.route('/upload', methods = ['POST'])
def upload():
    #Check if also files have been uploaded
    for k in request.files:
        val = request.files.getlist(k)
    return "Success:uploaded"

@app.route("/download/<id>")
def download(id):

    def zipdir(path, ziph):
        # ziph is zipfile handle
        for root, dirs, files in os.walk(path):
            for file in files:
                abs_path = os.path.join(root, file)
                if not abs_path.endswith(".zip"):
                    ziph.write(abs_path,basename(abs_path))

    try:
        if(id == "workflow"):
            return send_file(BASE_CONFIG_PATH+"/workflow.json", as_attachment=True)
        else:
            a_zip_dir = BASE_PROCESS_PATH+"/"+id+"/"
            zipf = zipfile.ZipFile(a_zip_dir+"/"+id+".zip", 'w', zipfile.ZIP_DEFLATED)
            zipdir(a_zip_dir, zipf)
            zipf.close()

            return send_file(a_zip_dir+"/"+id+".zip", as_attachment=True)
    except Exception as e:
        return e

@app.route("/gettoolfile")
def gettoolfile():
    @after_this_request
    def add_header(response):
        #response.headers['X-UA-Compatible'] = 'IE=Edge,chrome=1'
        response.headers['Cache-Control'] = 'public, max-age=0'
        return response

    elem_id = request.args.get('id')
    elem_type = request.args.get('type')
    res_type = request.args.get('result')

    tool_process_dir = BASE_PROCESS_PATH+"/"+elem_id+"/"
    wanted_type = []
    list_type = elem_type.split(",")
    for f_type in FILE_TYPE:
        if f_type in list_type:
            wanted_type.extend(FILE_TYPE[f_type])

    res_files = []
    for root, dirs, files in os.walk(tool_process_dir):
        for file in files:
            for a_type in wanted_type:
                if file.endswith(a_type):
                    res_files.append(tool_process_dir+file)

    #return res_files
    return_res = {'file': res_files}
    if res_type == "file":
        return send_file(res_files[0], as_attachment=False)
    else:
        return json.dumps(return_res)


@app.route('/saveworkflow', methods = ['POST'])
def save_workflow():
    jsdata = request.form['workflow_data']
    jsdata = json.loads(jsdata)
    path = request.form['path']
    fname = "workflow.json"
    load_after = request.form['load']

    if (path==""):
        path = BASE_CONFIG_PATH+"/"

    new_filename = ""
    if fname == "":
        id = 0
        new_filename = "w-"+str(id)
        directory = os.fsencode(path)
        for file in os.listdir(directory):
            filename = os.fsdecode(file)
            if filename == new_filename+".json":
                id = id + 1
                new_filename = "w-"+str(id)
        new_filename = new_filename+".json"
    else:
        new_filename = fname
        if not fname.endswith('.json'):
            new_filename = fname+".json"

    with open(path + new_filename, 'w') as outfile:
        json.dump(jsdata, outfile)

    return "Save done !"


@app.route('/loadworkflow', methods = ['POST'])
def load_workflow():
    workflow_file = request.form['workflow_file']
    jsdata = json.loads(workflow_file)
    workflow_fname = "workflow.json"
    path = BASE_CONFIG_PATH+"/"
    with open(path + workflow_fname, 'w') as outfile:
        json.dump(jsdata, outfile)

    return "Load done !"

@app.route('/reset')
def reset_temp_data():
    dipam_linker.reset()
    for the_file in os.listdir(BASE_PROCESS_PATH):
        file_path = os.path.join(BASE_PROCESS_PATH, the_file)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path): shutil.rmtree(file_path)
        except Exception as e:
            return "Error:"+e

    for the_file in os.listdir(BASE_TMP_PATH):
        file_path = os.path.join(BASE_TMP_PATH, the_file)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path): shutil.rmtree(file_path)
        except Exception as e:
            return "Error:"+e

    return "Success:Processing done !"

@app.route('/process', methods = ['POST'])
def process():

    def check_extension(file_type, file_name = None):
        extension = None
        if file_type == "table":
            extension = "csv"
        elif file_type == "text":
            extension = "txt"
        elif file_type == "img":
            extension = "png"
        elif file_type == "pdf":
            extension = "pdf"

        if file_name:
            res = file_name
            if extension:
                file_name_parts = file_name.split(".")
                if(file_name_parts[-1] != extension):
                    res = res +"."+ extension
            return res
        return extension


    def write_file(path, file_value, file_type):

        if not os.path.exists(os.path.dirname(path)):
            os.makedirs(os.path.dirname(path))

        write_on_file = False
        #build string according to file type
        if file_type == "table":
            str_table = ""
            #file_value is a matrix
            for row in file_value:
                for cell in row:
                    str_table += str(cell) + ","
                str_table = str_table[:-1]
                str_table += "\n"
            str_table = str_table[:-1]
            file_value = str_table
            write_on_file = True

        elif file_type == "text":
            write_on_file = True

        elif file_type == "img":
            #copy the picture from the .tmp/ directory to the tool dir
            copyfile(file_value, path)
            #time.sleep(5)
            #os.remove(file_value)
        elif file_type == "pdf":
            #copy the picture from the .tmp/ directory to the tool dir
            copyfile(file_value, path)
            #time.sleep(5)
            #os.remove(file_value)


        if write_on_file:
            with open(path, 'w') as d_file:
                d_file.write(file_value)

        return path

    ## FIRST POPULATE THE INNER VARS
    ################################

    elem_must_att = {
                "id": None,
                'type': None,
                'value': None,
                'name': None,
    }
    elem_workflow_att = {}
    elem_graph_att = {}
    elem_param_att = {}

    if 'workflow[]' in request.form:
        for i_elem in request.form.getlist('workflow[]'):
            elem_workflow_att[i_elem] = None
    if 'graph[]' in request.form:
        for i_elem in request.form.getlist('graph[]'):
            elem_graph_att[i_elem] = None
    if 'param[]' in request.form:
        for i_elem in request.form.getlist('param[]'):
            elem_param_att[i_elem] = None


    def populate_index(normal_k, val):
        #Check if is a must att
        if normal_k in elem_must_att:
            elem_must_att[normal_k] = val
        #Check if is a workflow att
        elif normal_k in elem_workflow_att:
            elem_workflow_att[normal_k] = val
        #Check if is a graph att
        elif normal_k in elem_graph_att:
            elem_graph_att[normal_k] = val
        #Check if is a param att
        elif normal_k in elem_param_att:
            elem_param_att[normal_k] = val
        else:
            return -1
        return val


    #Check ordinary form values first
    for k in request.form:
        val = request.form[k]
        if k.endswith('[]'):
            val = []
            val = request.form.getlist(k)
        populate_index(k.replace("[]",""), val)

    #Check if also files have been uploaded
    for k in request.files:
        val = request.files.getlist(k)
        normal_k = k
        normal_k = normal_k.replace("[]","")
        populate_index(normal_k, val)


    #print(elem_must_att, elem_workflow_att, elem_graph_att, elem_param_att)

    ## PROCESS THE POSTED ELEMENT
    ################################

    # If is a Tool:
    #   check all the input nodes
    #   take only the compatible data from all the nodes
    #########
    elem_id = elem_must_att["id"]
    elem_value = elem_must_att["value"]
    elem_class = elem_workflow_att["class"]
    elem_index = None
    data_entries = []

    if elem_must_att["type"] == "tool":

        input_files = {}
        if elem_workflow_att["compatible_input"]:
            for comp_input in elem_workflow_att["compatible_input"]:
                input_files[comp_input] = {}

        if elem_workflow_att["input"]:
            for id_input in elem_workflow_att['input']:

                #is a data file -> Take it from the corpus (Its data is suitable, DIPAM does this on ClientSide)
                if id_input in corpus:
                    d_value = next(iter(corpus[id_input].items()))[0]
                    if d_value in input_files:
                        input_files[d_value] = corpus[id_input][d_value]["files"]

                #is a tool input -> check the outputs compatible with my inputs
                else:
                    #ask the linker for its link object
                    index_elem = dipam_linker.get_elem(id_input)
                    #print(" -> inputs from tool: ", index_elem)
                    if index_elem != -1:
                        #check if the input node have compatible data i can take
                        set_of_files = {}
                        for comp_input in input_files:
                            if comp_input in index_elem:
                                index_elem_data = index_elem[comp_input]
                                #call the data handler to process this type of inputs
                                for file_k in index_elem_data:
                                    #<file_k> : is the name of the file
                                    file_path = BASE_PROCESS_PATH+"/"+str(id_input)+"/"+file_k
                                    a_data = dipam_data.handle([file_path], comp_input, file_type = "path", param = None)

                                    for a_doc_k in a_data[0]:
                                        input_files[comp_input][file_k] = a_data[0][a_doc_k]


        #The data entries in this case are the output of the tool
        data_entries = dipam_tool.run(
            elem_must_att,
            elem_workflow_att,
            elem_graph_att,
            input_files,
            elem_param_att
        )
        #print("Output: ",data_entries)

        #check if there were errors
        if "error" in data_entries:
            return "Error: "+str(data_entries["error"])


        #Index the new Tool and its output data
        elem_index = dipam_linker.index_elem(elem_must_att["id"])
        if elem_index != None:
            for d_key, d_val in data_entries.items():
                #write entries in dir
                updated_data_entries = {}
                for f_key, f_val in d_val.items():
                    f_data_type = dipam_data.get_data_index(d_key)["data_class"]
                    f_name_normalized = check_extension(f_data_type, f_key)
                    write_file(BASE_PROCESS_PATH+"/"+str(elem_id)+"/"+f_name_normalized, f_val, f_data_type)
                    updated_data_entries[f_name_normalized] = f_val

                #print("updated_data_entries:",updated_data_entries)
                #And index the new files
                dipam_linker.add_entry(elem_must_att["id"], d_key ,updated_data_entries)

        #print("I am linked: ",dipam_linker.get_elem(elem_must_att["id"]))
        #print("\n\n")

    elif elem_must_att["type"] == "data":
        #data_entries.append(dipam_linker.build_data_entry(posted_data))
        #The data entries in this case are the elements themselfs
        # we read directly these files and save them locally
        #add the corresponding files
        files = None;
        if 'p-file' in elem_param_att:
            files = elem_param_att['p-file']

        a_data = dipam_data.handle(files, elem_value, file_type = "file", param = None)

        corpus[elem_id] = {}
        corpus[elem_id][elem_value] = {}
        corpus[elem_id][elem_value]["files"] = a_data[0]
        corpus[elem_id][elem_value]["data_class"] = a_data[1]

    #print(posted_data["id"]," index is: " ,dipam_linker.get_elem(posted_data["id"]))9
    return "Success:Processing done !"

def open_browser():
    dipam_url = "http://127.0.0.1:5000/"
    browser_path = [
        "chrome",
        "google-chrome",
        "chromium",
        "chromium-browser",
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe %s'
    ]

    def rec_open(url,index):
        if index >= len(browser_path):
            return False

        try:
            browse = webbrowser.get(browser_path[index]).open(dipam_url)
        except Exception as e:
            browse = False
        if not browse:
            rec_open(url,index + 1)
        else:
            print(browser_path[index])
            return True

        return True

    def search_chrome_in_windows(a_root):
        dir_path = os.path.dirname(a_root)
        for root, dirs, files in os.walk(dir_path):
            for file in files:
                if file.startswith('chrome.exe'):
                    return root+'/'+str(file)
        return False

    if not rec_open(dipam_url,0):
        system_root = os.path.abspath(os.sep)
        if(system_root != "/"):
            browser_path_win = search_chrome_in_windows(system_root)
            if browser_path_win != False:
                webbrowser.get(browser_path_win+" %s").open(dipam_url)
                return(browser_path_win)

        webbrowser.open(dipam_url)
        return("Default browser")


if __name__ == '__main__':
    #app.config['TEMPLATES_AUTO_RELOAD'] = True
    CONFIG_DATA = json.load(open(BASE_CONFIG_PATH+"/config.json"))

    dipam_linker = linker.Linker(BASE_PROCESS_PATH)
    dipam_tool = tool.Tool(CONFIG_DATA["tool"], BASE_TMP_PATH)
    dipam_data = data.Data(CONFIG_DATA["data"], BASE_TMP_PATH)

    Timer(1, open_browser).start();
    app.run()
