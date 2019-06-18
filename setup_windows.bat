python -m venv _venv
_venv\Scripts\activate
echo "Installing the required python libraries ..."
pip install -r requirements.txt
pip list
echo "INSTALLATION DONE !"
deactivate
