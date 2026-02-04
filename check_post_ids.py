import requests
import json

BASE_URL = "https://www.moltbook.com/api/v1"
API_KEY = "moltbook_sk_UZw6SgJJw7X8kthCTl9ctUJyOUmkKWrG" 

POST_IDS = [
    "c83b610b-42bf-4183-a00c-407bccd01df0", # AnimalBot (Success 20m ago)
    "c644fb3b-9270-47c1-8459-5167ff7e0237"  # Argosbot (Success but hidden?)
]

def check_ids():
    headers = {"Authorization": f"Bearer {API_KEY}"}
    for pid in POST_IDS:
        print(f"\nChecking Post {pid}...")
        try:
            resp = requests.get(f"{BASE_URL}/posts/{pid}", headers=headers, timeout=10)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                print("Exists!")
                print(json.dumps(resp.json(), indent=2))
            else:
                print("Does not exist or inaccessible.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    check_ids()
