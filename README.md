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
```git clone https://github.com/catarsi/mitao.git```   

---

### Step (3): Installation

```cd mitao```   
___

On Mac/Linux: ```python3 -m venv _venv```  
On Windows: ```py -3 -m venv _venv```
___

On Mac/Linux: ```. _venv/bin/activate```  
On Windows: ```_venv\Scripts\activate```
___

```pip install -r requirements.txt```  
___
```python -m nltk.downloader all```
__
```deactivate```


---

### Step (4): Running Mitao

On Mac/Linux: ```. _venv/bin/activate```  
On Windows: ```_venv\Scripts\activate```
___
```python main.py .```
