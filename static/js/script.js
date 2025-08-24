document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("file-input");
    const chooseBtn = document.getElementById("choose-btn");
    const predictBtn = document.getElementById("predict-btn");
    const uploadBox = document.getElementById("upload-box");
    const resultCard = document.getElementById("result-card");
    const predictionList = document.getElementById("prediction-list");
    const loader = document.getElementById("loader");
    const recipesContainer = document.getElementById("recipes-container");
    const infoTitle = document.querySelector(".card-content h2");
    const infoText = document.querySelector(".card-content p");

    let allRecipesData = {}; // Stores all recipes from the API response

    // Open file chooser
    chooseBtn.addEventListener("click", () => fileInput.click());

    // When a file is chosen
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) {
            predictBtn.disabled = true;
            uploadBox.innerHTML = `<i class="bi bi-cloud-upload-fill"></i><p>No file chosen, yet!</p>`;
            return;
        }

        const reader = new FileReader();
        reader.onload = e => {
            uploadBox.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image" class="w-full h-full object-cover rounded-lg">`;
        };
        reader.readAsDataURL(file);

        predictBtn.disabled = false;
        resultCard.classList.add("hidden");
        recipesContainer.innerHTML = '';
        infoTitle.innerText = "Recipe Generation from Food Image";
        infoText.innerText = "Upload a food image and let our AI predict its food name. We’ll generate top predictions with confidence scores.";
    });

    // Predict button click handler
    predictBtn.addEventListener("click", async () => {
        const file = fileInput.files[0];
        if (!file) {
            console.error("Please select an image first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        // Update UI state
        predictBtn.disabled = true;
        loader.classList.remove("hidden");
        resultCard.classList.remove("hidden");
        predictionList.innerHTML = "<li><div class='text-center text-gray-500'>Processing...</div></li>";
        recipesContainer.innerHTML = '';
        infoTitle.innerText = "Fetching Predictions...";
        infoText.innerText = "Please wait while we analyze the image and generate recipes.";

        try {
            const resp = await fetch("/predict", { method: "POST", body: formData });
            const data = await resp.json();
            
            if (data.error) {
                predictionList.innerHTML = `<li class="text-red-500 text-center">${data.error}</li>`;
                infoTitle.innerText = "Error";
                infoText.innerText = data.error;
                return;
            }

            allRecipesData = data.recipes;
            predictionList.innerHTML = "";
            recipesContainer.innerHTML = "";

            // Display predictions as clickable cards to select a food category
            const foodNames = Object.keys(data.recipes);
            foodNames.forEach(foodName => {
                const li = document.createElement("li");
                li.className = "flex justify-between items-center bg-white p-3 rounded-md shadow-sm cursor-pointer transition-all duration-200 hover:bg-gray-100";
                li.innerHTML = `<span>${foodName.charAt(0).toUpperCase() + foodName.slice(1)}</span>`;
                li.dataset.foodName = foodName;

                const prediction = data.predictions.find(p => p[0].replace("_", " ") === foodName);
                if (prediction) {
                    const confidenceSpan = document.createElement("span");
                    confidenceSpan.className = "text-gray-500 text-sm font-semibold";
                    confidenceSpan.innerText = `${(prediction[1] * 100).toFixed(2)}%`;
                    li.appendChild(confidenceSpan);
                }

                // New click handler to display recipe tabs for the selected food category
                li.addEventListener('click', () => {
                    displayRecipeTabs(li, foodName);
                });
                predictionList.appendChild(li);
            });
            
            // Automatically display the recipe tabs for the first predicted food
            const firstFoodElement = predictionList.querySelector("li");
            if (firstFoodElement) {
                displayRecipeTabs(firstFoodElement, foodNames[0]);
            }
            
        } catch (e) {
            console.error("Server or network error:", e);
            predictionList.innerHTML = `<li class="text-red-500 text-center">Server error</li>`;
            infoTitle.innerText = "Error";
            infoText.innerText = "An unexpected error occurred.";
        } finally {
            predictBtn.disabled = false;
            loader.classList.add("hidden");
        }
    });

    /**
     * Displays a list of recipe tabs for the selected food category.
     * @param {HTMLElement} element The clicked list item for a food category.
     * @param {string} foodName The name of the food category.
     */
    function displayRecipeTabs(element, foodName) {
        // Remove 'selected' class from all food category items
        document.querySelectorAll("#prediction-list li").forEach(li => {
            li.classList.remove("bg-[#6c63ff]", "text-white", "shadow-lg");
            const span = li.querySelector('span:not(.font-semibold)');
            const confidenceSpan = li.querySelector('span.font-semibold');
            if (span) span.classList.remove("text-white");
            if (confidenceSpan) confidenceSpan.classList.remove("text-white");
        });

        // Add 'selected' class to the clicked food category item
        element.classList.add("bg-[#6c63ff]", "text-white", "shadow-lg");
        const selectedSpan = element.querySelector('span:not(.font-semibold)');
        const selectedConfidenceSpan = element.querySelector('span.font-semibold');
        if (selectedSpan) selectedSpan.classList.add("text-white");
        if (selectedConfidenceSpan) selectedConfidenceSpan.classList.add("text-white");

        const recipes = allRecipesData[foodName];
        
        if (recipes && recipes.length > 0) {
            recipesContainer.innerHTML = ''; // Clear previous content

            // Create a container for the tabs and recipe content
            const tabsWrapper = document.createElement("div");
            tabsWrapper.className = "recipe-tabs-container";

            const tabsList = document.createElement("div");
            tabsList.className = "flex flex-wrap border-b border-gray-200 mb-6";
            
            const contentContainer = document.createElement("div");
            contentContainer.className = "recipe-content-container";

            // Create a tab for each recipe
            recipes.forEach((recipe, index) => {
                const tab = document.createElement("button");
                tab.className = "tab-btn text-center py-2 px-4 font-semibold text-gray-500 border-b-2 border-transparent transition-colors duration-200 hover:text-[#6c63ff] hover:border-[#6c63ff]";
                tab.innerText = recipe.name;
                tab.dataset.recipeIndex = index;

                tab.addEventListener('click', () => {
                    displayRecipeContent(tab, recipes, index);
                });
                tabsList.appendChild(tab);
            });

            tabsWrapper.appendChild(tabsList);
            tabsWrapper.appendChild(contentContainer);
            recipesContainer.appendChild(tabsWrapper);
            
            // Automatically click the first tab to show its content
            const firstTab = tabsList.querySelector('.tab-btn');
            if (firstTab) {
                displayRecipeContent(firstTab, recipes, 0);
            }

        } else {
            recipesContainer.innerHTML = `<p class="text-gray-500 text-center">No recipes found for ${foodName}.</p>`;
        }
    }

    /**
     * Displays the content for a selected recipe tab.
     * @param {HTMLElement} tabElement The clicked tab button.
     * @param {Array} recipes An array of recipes for the current food category.
     * @param {number} index The index of the recipe to display.
     */
    function displayRecipeContent(tabElement, recipes, index) {
        // Remove 'selected' class from all tabs
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove("text-[#6c63ff]", "border-[#6c63ff]");
            tab.classList.add("text-gray-500", "border-transparent");
        });
        
        // Add 'selected' class to the active tab
        tabElement.classList.add("text-[#6c63ff]", "border-[#6c63ff]");
        tabElement.classList.remove("text-gray-500", "border-transparent");

        const recipe = recipes[index];
        const contentContainer = document.querySelector('.recipe-content-container');

        if (recipe) {
            let ingredientsList = recipe.ingredients.map(ing => `<li>${ing}</li>`).join('');
            let instructionsList = recipe.instructions.map((step, stepIndex) => `<li>${step}</li>`).join('');
            
            contentContainer.innerHTML = `
                <div class="recipe-card bg-gray-100 rounded-lg p-6 mb-6 shadow-sm">
                    <div class="mb-4">
                        <h5 class="text-lg font-semibold text-[#6c63ff] mb-2">Ingredients</h5>
                        <ul class="list-disc pl-5 space-y-1 text-gray-700">
                            ${ingredientsList}
                        </ul>
                    </div>
                    <div>
                        <h5 class="text-lg font-semibold text-[#6c63ff] mb-2">Instructions</h5>
                        <ol class="list-decimal pl-5 space-y-2 text-gray-700">
                            ${instructionsList}
                        </ol>
                    </div>
                </div>
            `;
        } else {
            contentContainer.innerHTML = `<p class="text-gray-500 text-center">Recipe not found.</p>`;
        }
    }
});
