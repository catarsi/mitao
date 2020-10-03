import psutil
import requests
import time

time.sleep(10)
while True:
    localtime = time.localtime()
    result = time.strftime("%I:%M:%S %p", localtime)
    time.sleep(1)
    is_running = "MITAO" in (p.name() for p in psutil.process_iter())
    if not is_running:
        x = requests.get('http://localhost:5000/shutdown')
        break
