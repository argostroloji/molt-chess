import requests
import json

BASE_URL = "https://www.moltbook.com/api/v1"
# Using Argosbot key to authenticate for reading (any key works usually)
API_KEY = "moltbook_sk_UZw6SgJJw7X8kthCTl9ctUJyOUmkKWrG" 

def check_feed():
    headers = {"Authorization": f"Bearer {API_KEY}"}
    try:
        # Fetch recent posts
        print("Fetching recent posts...")
        resp = requests.get(f"{BASE_URL}/posts?sort=new&limit=5", headers=headers, timeout=10)
        
        if resp.status_code == 200:
            posts = resp.json()
            # If posts directly list or inside 'posts' key
            post_list = posts.get("posts", posts) if isinstance(posts, dict) else posts
            
            for p in post_list:
                print(json.dumps(p, indent=2))
                break # Just need one example
        else:
            print(f"Error fetching posts: {resp.status_code} {resp.text}")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    check_feed()
