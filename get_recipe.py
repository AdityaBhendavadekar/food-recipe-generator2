import os
import requests
import json
import time

# --- Gemini API Configuration ---
# IMPORTANT: This API key is a placeholder. In a real-world application,
# you would manage API keys securely, for example, using environment variables.
# For this example, we'll use an empty string, as the Canvas environment
# will automatically provide it at runtime.
GEMINI_API_KEY = ""
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent"

def search_recipes(query, max_results=2):
    """
    Generates a list of recipes based on a user's query using the Gemini API.
    
    This function leverages the Gemini API's text generation capabilities with
    JSON mode to produce structured, dynamic recipe content.
    
    Args:
        query (str): The food name or recipe to search for.
        max_results (int): The number of recipes to generate.
    
    Returns:
        dict: A dictionary containing the generated recipes or an error message.
    """
    
    # Construct the user prompt for the Gemini API.
    prompt = f"Provide exactly {max_results} recipes for '{query}'. The recipes should be conversational and easy for a beginner to follow. Each recipe should include a 'name', an 'ingredients' list, and a 'instructions' list. The response must be valid JSON."

    # Define the payload for the API request.
    # The generationConfig specifies that we want a JSON response
    # and we define the schema for the output.
    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "name": {"type": "STRING"},
                        "ingredients": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"}
                        },
                        "instructions": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"}
                        }
                    },
                    "propertyOrdering": ["name", "ingredients", "instructions"]
                }
            }
        }
    }
    
    headers = {
        'Content-Type': 'application/json'
    }

    # Implement exponential backoff for robust API calls.
    # This helps handle potential rate limiting.
    max_retries = 5
    retry_delay = 1
    for i in range(max_retries):
        try:
            # Make the POST request to the Gemini API.
            response = requests.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                headers=headers,
                data=json.dumps(payload)
            )
            response.raise_for_status() # Raise an exception for bad status codes
            
            api_result = response.json()
            
            # Extract the generated JSON string from the API response.
            if api_result.get('candidates') and api_result['candidates'][0].get('content'):
                raw_json = api_result['candidates'][0]['content']['parts'][0]['text']
                # Parse the JSON string into a Python object.
                parsed_json = json.loads(raw_json)
                return parsed_json
            else:
                return {"error": "API response was empty or malformed."}

        except requests.exceptions.RequestException as e:
            if i < max_retries - 1:
                print(f"Request failed: {e}. Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                return {"error": f"Failed to get a response after {max_retries} retries: {e}"}
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON response: {e}. Raw response: {raw_json}")
            return {"error": "Failed to decode JSON from API response."}

if __name__ == "__main__":
    try:
        data = search_recipes("pizza", max_results=2)
        print(json.dumps(data, indent=2))
        
        print("\n--- Displaying the recipes ---")
        if isinstance(data, list):
            for i, recipe in enumerate(data):
                print(f"\nRecipe {i + 1}: {recipe['name']}")
                print("Ingredients:")
                for ingredient in recipe['ingredients']:
                    print(f"- {ingredient}")
                print("\nInstructions:")
                for step in recipe['instructions']:
                    print(f"- {step}")
        else:
            print(data.get("error", "An unknown error occurred."))
            
    except Exception as e:
        print(f"An error occurred: {e}")
