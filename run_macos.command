BASEDIR=$(dirname "$0")
source  $BASEDIR/_venv/bin/activate
python $BASEDIR/main.py $BASEDIR
python -mwebbrowser http://127.0.0.1:5000/
