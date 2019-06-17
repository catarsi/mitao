python3.7 -m venv _venv
cd _venv
. bin/activate
ECHO "Installing the required python libraries ..."
pip install -r ../requirements.txt
pip list
ECHO "INSTALLATION DONE !"
deactivate
