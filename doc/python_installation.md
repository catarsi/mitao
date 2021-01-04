# Check if you have Python3
To check if you already have the last version of Python (3.9) installed on your machine (Windows, Mac, or Linux), you need to use a command-line interpreter - shell. Operating systems have different command-line application/interface. Windows uses [Command Prompt](https://en.wikipedia.org/wiki/Cmd.exe), Mac uses [Terminal](https://en.wikipedia.org/wiki/Terminal_\(macOS\)), and Linux uses an application called "Console" or "Terminal" (respectively for the KDE and GNOME environments).

## Windows

* Open the Windows menu 
* Type *command* in the search bar
* Select Command Prompt from the search results
* Type `py -3 --version` in the command line and press return to check whether you have Python 3 installed, and eventually which version.

## MacOS

* Open the Spotlight search box in the upper right-hand corner
* Type *terminal* in the search bar
* Click on Terminal or just hit return if it's the first result
* Type `python3 --version` in the command line and press return to check whether you have Python 3 installed, and eventually which version.

## Linux
* Open the Dash by clicking the icon of your Linux operating system appearing in the upper-left menu
* Type *terminal* or *console* in the search bar
* Select the Terminal/Console application from the results that appear
* Type `python3 --version` in the command line and press return to check whether you have Python 3 installed, and eventually which version.



# Install Python3

## Windows
* Go to [Python Downloads](https://www.python.org/downloads/). It will show *Download the latest version of Python* according to the OS you are using.
* Click on the download button to get the latest version of **Python (3.9)**.
* Double-click on the Python installer just downloaded.
* A dialog box like the one below will appear
<img src="py_installer_windows.png">
* Click on <b>Customize installation</b>
* On the following page you should keep all the checkboxes selected, and move to the next page
* Now you should be in the Advanced Options page. Here you need to keep checked the default options with the addition of these two check-boxes (if not already checked): <b>Install for all users</b>, and <b>Add python to environment varaibles</b>. Make sure the <i>Customize install location</i> has been also updated
<img src="py_installer_options.png">
* Click on the <b>Install</b> button, and wait until the end of the installation
* Finally, go to the command line and try to type <code>py -3 --version</code> and press return to check whether you correctly installed Python.

## MacOS
* Go to [Python Downloads](https://www.python.org/downloads/). It will show *Download the latest version of Python* according to the OS you are using.
* Click on the download button to get the latest version of **Python (3.9)**.
* Double-click on the downloaded .pkg file to start the wizard.</li>
* Follow the instructions.
* Finally, go to the command line and try to type <code>python3 --version</code> and press return to check whether you correctly installed Python.</li>

## Linux
* Go to [Python Downloads](https://www.python.org/downloads/). It will show *Download the latest version of Python* according to the OS you are using.
* Click on the download button to get the latest version of **Python (3.9)**.
* Open the Command Line Interface (Terminal or Console)
* Type <code>sudo apt-get update</code>
* Type <code>sudo apt-get install python3.9 python3-pip</code>
* Finally, go to the command line and try to type <code>python3 --version</code> and press return to check whether you correctly installed Python

<b>Note:</b> in case you find troubles in the process, check the <a href="https://realpython.com/installing-python/#how-to-install-on-ubuntu-and-linux-mint">following instructions</a> and follow the instructions according to your specific Linux distribution
