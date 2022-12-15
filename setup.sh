#!/bin/bash
cd src/python/
echo "Extracting python3.9 ..."
tar xvf Python-3.9.0.tgz
echo "Installing python3.9 locally ..."
cd Python-3.9.0
./configure
make
echo "Building a virtual environment ..."
python -m venv ../mitaovenv_py3_9
echo "Activating the virtual environment"
cd ../
source mitaovenv_py3_9/bin/activate
cd ../../
echo "Installing the requirements ..."
pip install -r requirements.txt
mv src/setup/mitao.sh .
echo "MITAO has been successfully installed !!"
deactivate