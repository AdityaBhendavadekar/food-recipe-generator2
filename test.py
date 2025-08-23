import json
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

# --- Load trained model ---
MODEL_PATH = "model4_lan2.15-0.85.keras"   # update path if needed
LABELS_PATH = "class_labels.json"  # update path if needed

model = load_model(MODEL_PATH)

# --- Load class labels ---
with open(LABELS_PATH, "r") as f:
    class_labels = json.load(f)

# --- Predict function ---
def predict_food(img_path, top_k=1):
    # Preprocess
    img = image.load_img(img_path, target_size=(224, 224))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0) / 255.0  # normalize like training

    # Model prediction
    preds = model.predict(x)[0]  # shape: (num_classes,)

    # Top-k predictions
    top_indices = preds.argsort()[-top_k:][::-1]
    results = [(class_labels[i], float(preds[i])) for i in top_indices]
    return results

# # --- Example usage ---
# if __name__ == "__main__":
#     img_path = "./images/rice.jpg"  # 🔹 replace with your local image
#     predictions = predict_food(img_path, top_k=2)  # top-2
#     for label, prob in predictions:
#         print(f"{label}: {prob*100:.2f}%")
