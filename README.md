<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.1/css/all.css" crossorigin="anonymous">

<img src="doc/mitao_logo_(white_bg).png" alt="logo" width="250"/>

MITAO, a Mashup Interface for Text Analysis Operations, is an open source, user-friendly, modular, and flexible software written in Python and Javascript for performing several kinds of text analysis, and can be run locally on a machine by using any modern Web browser. Its source code and documentation is all available on its <i style="padding: 3px; background-color: #F2F2F2" class="fab fa-github"> <a href="https://github.com/catarsi/mitao">Github repository</a></i>. It is licensed under the ISC License. The last release of Mitao is available at [https://archive.org/details/mitao2](https://archive.org/details/mitao2). Each release makes available Mitao for Linux, MacOS and Windows.

This application is linked to CATARSI ([https://centri.unibo.it/dharc/en/research/projects-at-dh-arc#catarsi](https://centri.unibo.it/dharc/en/research/projects-at-dh-arc#catarsi)). It was developed using DIPAM  ([https://github.com/ivanhb/dipam](https://github.com/ivanhb/dipam)): A Dashboard Interface for Python-based Applications Mashup.
<img src="doc/mitao_screenshot.png" alt="screen"/>  

# Requirements
* **Python 3.X** programming language, Download and install it from the official website -> [Click here](https://www.python.org/downloads/). We recommend you to follow <i style="padding: 3px; background-color: #F2F2F2" class="fas fa-file"> <a href="doc/python_installation.pdf">our instructions</a></i>.<br><b style="color:#ff9a00">Warning:</b> don't install python using Conda (or any other environment management system)
* The **Chrome web browser**, download it -> [Click here](https://www.google.com/intl/en/chrome/)

# Installing and running Mitao
Before starting the installation of Mitao make sure: 
* **All the requirements have been successfully installed**  
* **Your local machine has at least 5GB of empty space available**
* **Your internet connection is on, during the whole installation procedure**

## Linux
1. [Download the last version of Mitao for Linux](https://archive.org/download/mitao2/mitao_v2.1.2_linux.zip) and unzip the downloaded archive.
1. Open your Console/Terminal and type `./setup.sh` to run the installation of Mitao; wait to the end of the installation.

> if a **Permission Denied** error message appears when running the **setup.sh** file, then you need to call the scripts using `sudo`. e.g. `sudo ./setup.sh` or `sudo bash ./setup.sh`

2. Once the installation is done, you will find the file **Mitao.sh** on the main folder (the directory containing the **setup.sh** file).
3. Type `./Mitao.sh` to run Mitao.

## MacOS
> **The following instructions might not work for the Mac machines with the M1 chip. We are working on handling these issues in the upcoming versions of MITAO** 
1. [Download the last version of Mitao for MacOS](https://archive.org/download/mitao2/mitao_v2.1.2_macos.zip) and extract the the content of the archive. A folder with the name ***mitao\_{VERSION}\_macos*** should appear.
2. Right click on the folder ***mitao\_{VERSION}\_macos*** and select **copy**
3. Open the **Terminal** application
> Terminal is an application. You will find it in Applications - Utilities - Terminal. One keyboard shortcut for opening it (or any other app) is Command + Spacebar then type the app's name.

4. Type the command `cd` followed by a **space**, then right click and select **paste**; the command on the Terminal should be something like this: `cd /THE/PATH/TO/mitao\_{VERSION}\_macos`. Press enter.
5. Type the command `chmod 777 *` and press enter; you can close the Terminal window now  
6. Go back to your ***mitao\_{VERSION}\_macos*** folder and **double click** the ***setup*** file; a Terminal window will appear and the installation should start; wait to the end of the installation.
> macOS might block and exit the installation with an error: **unidentified developer**; in this case you must allow macOS to open the application anyway (usually this is done from **System preferences -> Security & Privacy -> General**). <br>**Note: this issue might appear more than once during the installation; do the same operation for each occasion** 

> in some cases the installation might stop with this error: **xcrun: error: invalid active developer ...** To handle this error you must:
>  * Open the Terminal and type: `xcode-select --install`
>  * A dialog box appears, you must click on the **install** button and accept the terms so that the download and installation will start
>  * Close the terminal once the installation is done

7. Once the installation is done, you will find the application **Mitao** on the main folder (i.e. ***mitao_{VERSION}_macos***).
8. **Copy->Paste** the **Mitao** application on your **/application** folder (or any other desired folder). Once you do this, you can also delete the original extracted folder, i.e. ***mitao\_{VERSION}\_macos***.<br> **Note: only a Copy->Paste operation must be done. DON'T Drop->Drag or Cut->Paste the Mitao application**
9. Run Mitao by double clicking on the **Mitao** application (the one you have copied). 

## Windows
1. [Download the last version of Mitao for Windows](https://archive.org/download/mitao2/mitao_v2.1_windows.zip) and unzip the downloaded archive.
2. Double click on the <i style="padding: 3px; background-color: #F2F2F2" class="fas fa-file"> setup</i> file; the command prompt window will appear and the required modules/libraries will be installed; wait to the end of the installation.  
> if a **Permission Denied** error message appears when double clicking the **setup** or the **Mitao** file, then right click on the corresponding file and select the ***run as adminstrator*** option.  

> In case you get the following error message during the installation of MITAO: **"error: Microsoft Visual C++ 14.0 is required"**, then follow the instructions given at [https://medium.com/@jacky_ttt/day060-fix-error-microsoft-visual-c-14-0-is-required-629413e798cd](https://medium.com/@jacky_ttt/day060-fix-error-microsoft-visual-c-14-0-is-required-629413e798cd)

3. Once the installation is done, you will find the file **Mitao** on the main folder (the directory containing the **setup** file).
4. Run Mitao by double clicking on the **Mitao** file.  

> When running Mitao the command prompt window will appear; on some Windows versions this window will automatically close once Mitao is closed. If this is not the case, you can close it manually after closing Mitao.  
