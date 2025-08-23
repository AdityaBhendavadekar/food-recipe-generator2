import os
import requests

FATSECRET_KEY = os.getenv("FATSECRET_CLIENT_ID")      # 👈 set in .env
FATSECRET_SECRET = os.getenv("FATSECRET_CLIENT_SECRET")  # 👈 set in .env

BASE_URL = "https://platform.fatsecret.com/rest/server.api"
TOKEN_URL = "https://oauth.fatsecret.com/connect/token"

def get_access_token():
    """Obtain OAuth2 access token from FatSecret"""
    resp = requests.post(
        TOKEN_URL,
        data={"grant_type": "client_credentials", "scope": "basic"},
        auth=(FATSECRET_KEY, FATSECRET_SECRET),
    )
    resp.raise_for_status()
    return resp.json()["access_token"]

def search_recipes(query, max_results=5, must_have_images=True):
    """Search recipes via FatSecret API using OAuth2 Bearer token"""
    token = get_access_token()
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "method": "recipes.search.v3",
        "search_expression": query,
        "max_results": max_results,
        "must_have_images": str(must_have_images).lower(),
        "format": "json",
    }
    resp = requests.get(BASE_URL, params=params, headers=headers)
    resp.raise_for_status()
    return resp.json()

if __name__ == "__main__":
    data = search_recipes("pizza", max_results=5)
    print(data)