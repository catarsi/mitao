BASEDIR=$(dirname "$0")
python3.7 -m venv $BASEDIR/_venv
. $BASEDIR/_venv/bin/activate
echo "Installing the required python libraries ..."
pip install -r $BASEDIR/requirements.txt
pip list
echo "INSTALLATION DONE !"
deactivate
