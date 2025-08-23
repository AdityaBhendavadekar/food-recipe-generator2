document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("file-input");
  const chooseBtn = document.getElementById("choose-btn");
  const predictBtn = document.getElementById("predict-btn");
  const uploadBox = document.getElementById("upload-box");
  const resultCard = document.getElementById("result-card");
  const predictionList = document.getElementById("prediction-list");
  const loader = document.getElementById("loader");

  // Open file chooser
  chooseBtn.addEventListener("click", () => fileInput.click());

  // When file chosen
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) {
      predictBtn.disabled = true;
      uploadBox.innerHTML = `<i class="bi bi-cloud-upload-fill"></i><p>No file chosen, yet!</p>`;
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      uploadBox.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image">`;
    };
    reader.readAsDataURL(file);

    predictBtn.disabled = false;
    resultCard.style.display = "none";
  });

  // Predict
  predictBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    // UI state
    predictBtn.disabled = true;
    loader.style.display = "block";
    resultCard.style.display = "block";
    predictionList.innerHTML = "<li>Processing...</li>";

    try {
      const resp = await fetch("/predict", { method: "POST", body: formData });
      const data = await resp.json();
      console.log(data);
      console.log(resp);


      if (data.error) {
        predictionList.innerHTML = `<li style="color:red;">${data.error}</li>`;
      } else {
        predictionList.innerHTML = data.predictions
          .map(p => `<li><b>${p[0]}</b> - ${(p[1] * 100).toFixed(2)}%</li>`)
          .join("");
      }
    } catch (e) {
      predictionList.innerHTML = `<li style="color:red;">Server error</li>`;
    } finally {
      predictBtn.disabled = false;
      loader.style.display = "none";
    }
  });
});
