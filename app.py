import os
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from test import predict_food
from fatsecret_api import search_recipes   # 👈 import FatSecret API helper

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    try:
        # 1. Run ML prediction
        preds = predict_food(filepath, top_k=3)  # [('pizza', 0.85), ...]

        # 2. Use top-1 prediction for recipe search
        top_food = preds[0][0].replace("_", " ")
        print("Top predicted food:", top_food)
        recipes = search_recipes(top_food, max_results=3)
        print("Recipes found:", recipes)

        return jsonify({
            "predictions": preds,
            "recipes": recipes
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
