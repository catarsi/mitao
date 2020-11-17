<img src="doc/mitao_v2.svg" alt="logo" width="250"/>

MITAO, a Mashup Interface for Text Analysis Operations, is an open source, user-friendly, modular, and flexible software written in Python and Javascript for performing several kinds of text analysis, and can be run locally on a machine by using any modern Web browser. Its source code and documentation is all available on this repository, and it is licensed under the ISC License.
This application is linked to CATARSI (https://centri.unibo.it/dharc/en/research/projects-at-dh-arc#catarsi). It was developed using DIPAM  (https://github.com/ivanhb/dipam): A Dashboard Interface for Python-based Applications Mashup.

<img src="doc/main_screen.png" alt="screen"/>

## Requirements
* Python 3.X programming language, Download and install it from the official website -> [Click here](https://www.python.org/downloads/)
* The Chrome web browser, download it -> [Click here](https://www.google.com/intl/en/chrome/)

## Install and run Mitao

### Step (1): open a Shell
* On **Windows**: **_Command Prompt_**
* On **Mac**: **_Terminal_**
* On **Linux**: **_Terminal_** or **_Console_**

---

### Step (2): download Mitao
* ```git clone https://github.com/catarsi/mitao.git```   

---

### Step (3): install the modules needed
* Get inside the root directory:
```cd mitao```  

* Enter the following commands in order to install all the libraries needed.  
  * ```python3 -m pip install -r requirements.txt```  
  * ```python3 -m nltk.downloader all```

---

### Step (4): run Mitao
* ```python3 main.py .```
