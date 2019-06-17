#BASEDIR=$(dirname "$0")
#echo "$BASEDIR"
python3.7 -m venv _venv
cd _venv
. bin/activate
echo "Installing the required python libraries ..."
pip install -r ../requirements.txt
pip list
echo "INSTALLATION DONE !"
deactivate
