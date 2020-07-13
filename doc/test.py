import tkinter
from tkinter import filedialog
from tkinter.filedialog import asksaveasfile

root = tkinter.Tk()
root.wm_withdraw() # this completely hides the root window
# root.iconify() # this will move the root window to a minimized icon.

def file_save():
    f = asksaveasfile(mode='w', defaultextension=".txt")
    if f is None: # asksaveasfile return `None` if dialog closed with "cancel".
        return
    f.write("ciao")
    f.close() # `()` was missing.
    root.destroy()

file_save()

root.mainloop()
