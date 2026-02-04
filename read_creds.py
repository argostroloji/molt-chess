import json
from pathlib import Path

path = Path("C:/Users/eray/.config/moltbook/credentials.json")
try:
    with open(path, "r", encoding="utf-16") as f:
        print(f.read())
except Exception as e:
    print(f"Failed with utf-16: {e}")
    try:
        with open(path, "r", encoding="utf-8") as f:
            print(f.read())
    except Exception as e2:
        print(f"Failed with utf-8: {e2}")
