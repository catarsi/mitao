BASEDIR=$(dirname "$0")
python3.7 -m venv $BASEDIR/_venv
. $BASEDIR/_venv/bin/activate
echo "Installing the required python libraries ..."
pip install -r $BASEDIR/requirements.txt
python -m nltk.downloader -d $BASEDIR/_venv/nltk_data all
pip list
echo "INSTALLATION DONE !"
deactivate
