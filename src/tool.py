from src.tools import textAnalysis
from src.tools import terminal
from src.tools import filter
from src.tools import convert

class Tool(object):

    def __init__(self, tool_config, base_tmp_path):

        self.tool_index = tool_config

        #initialize all the modules that handle the tool elements
        self.tool_handler = {}
        self.tool_handler["TextAnalysis"] = textAnalysis.TextAnalysis()
        self.tool_handler["Filter"] = filter.Filter()
        self.tool_handler["Terminal"] = terminal.Terminal(base_tmp_path)
        self.tool_handler["Convert"] = convert.Convert()


    def run(self, n_data, n_workflow, n_graph, input_files, param = None):
        elem_id = n_data['id']
        elem_value = n_data['value']
        method = n_workflow['class']
        output_data = n_workflow['output']

        res = {}
        if elem_value in self.tool_index:
            tool_conf = self.tool_index[elem_value]
            if tool_conf["class"] in self.tool_handler:
                print("Running a "+str(tool_conf["class"])+" tool ..."+" .With value: "+elem_value)
                res = getattr(self.tool_handler[tool_conf["class"]],method)(input_files, param)
        else:
            #Tool not handled
            res["data"]["error"] = "Tool not handled!"

        #return this to main.py
        return res["data"]
