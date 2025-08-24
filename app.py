import os
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from test import predict_food
from get_recipe import search_recipes   # 👈 import FatSecret API helper

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

@app.route("/")
def home():
    return render_template("index.html")

# @app.route("/predict", methods=["POST"])
# def predict():
#     if "file" not in request.files:
#         return jsonify({"error": "No file part"}), 400

#     file = request.files["file"]
#     if file.filename == "":
#         return jsonify({"error": "No file selected"}), 400

#     filename = secure_filename(file.filename)
#     filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
#     file.save(filepath)

#     try:
#         # 1. Run ML prediction
#         preds = predict_food(filepath, top_k=3)  # [('pizza', 0.85), ...]

#         # 2. Use top-1 prediction for recipe search
#         top_food = preds[0][0].replace("_", " ")
#         print("Top predicted food:", top_food)
#         recipes = search_recipes(top_food, max_results=3)
#         print("Recipes found:", recipes)

#         return jsonify({
#             "predictions": preds,
#             "recipes": recipes
#         })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

@app.route("/predict", methods=["POST"])
def predict():
    """
    Handles image upload, runs food prediction, and retrieves recipes for the
    top two predicted food classes.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    try:
        # 1. Run ML prediction to get top-k predictions.
        # This function is not provided, but we assume it returns
        # a list of tuples like [('pizza', 0.85), ('burger', 0.70), ...].
        preds = predict_food(filepath, top_k=3)

        # 2. Extract the top two predicted food names.
        top_two_preds = preds[:2]
        
        # 3. Initialize a dictionary to store recipes for each food.
        all_recipes = {}

        # 4. Loop through the top two predictions to get one recipe for each.
        for food_name, confidence in top_two_preds:
            # Clean up the food name for the recipe search.
            search_query = food_name.replace("_", " ")
            print(f"Searching recipes for: {search_query}")

            # Call the search_recipes function with max_results=1 to get one recipe.
            recipes_for_food = search_recipes(search_query, max_results=2)

            # Store the result in our dictionary with the food name as the key.
            all_recipes[search_query] = recipes_for_food

        # 5. Return the predictions and the new recipes dictionary.
        return jsonify({
            "predictions": preds,
            "recipes": all_recipes
        })

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
