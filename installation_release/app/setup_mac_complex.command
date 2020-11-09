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
$PYI -m venv $BASEDIR/_venv
echo + Activate the virtual environment
. $BASEDIR/_venv/bin/activate
echo + Installing the requirements
pip install -r $BASEDIR/requirements.txt
echo MITAO has been successfully installed !!
deactivate
