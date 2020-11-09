#! /bin/sh
PYV=$(python --version 2>&1)
if [[ $PYV == *"Python 3"* ]]
  then
    PYI=python
    echo + Python3 detected: $PYI
  else
    PYV=$(python3 --version)
    if [[ $PYV == *"Python 3"* ]]
      then
        PYI=python3
        echo + Python3 detected: $PYI
      else
        echo + Python3 interpreter not found !!
    fi
fi

BASEDIR=$(dirname "$0")
echo + Creating the virtual environment
$PYI -m venv $BASEDIR/app/_venv
echo + Activate the virtual environment
. $BASEDIR/app/_venv/bin/activate
echo + Installing the requirements
pip install -r $BASEDIR/app/requirements.txt
deactivate

# Create the APP
# ---
#(app-name).app
#├── Contents
#│   └── MacOS
#│   └── (app-name)
#└── Icon
#cat $BASEDIR/app/run_macos_appify.sh | sh $BASEDIR/app/private_appify.sh $BASEDIR "mitao"
#cp -a $BASEDIR/app/. $BASEDIR/mitao.app/Contents/MacOS/
cp -a $BASEDIR/app/Mitao.app $BASEDIR

echo MITAO has been successfully installed !!
