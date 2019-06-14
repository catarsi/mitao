
class TOOL_NAME(object):

    def __init__(self, tool_list):
        self.TOOL = tool_list

    def is_handled(self, t_value):
        return t_value in self.TOOL

    # Each function defined must return data which include a recognizable key
    # as defined in the config.json file
    #
    # e.g:
    # {
    #    "d-gen-text": {"0.txt": "HI","1.txt":"BYE" ...}
    #   ...
    # }
    def FUN_NAME(self, input_files, input_file_names, param):
        data_to_return = {"data":{}}

        # 1) Check if the input data type compatibilities and needed are given
        # 2) Check if there are some parameters in <param>
        # 3) Process the data and return it

        return data_to_return
