const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const uploadBox = document.getElementById('upload-box');
const uploadIcon = document.getElementById('upload-icon');
const uploadText = document.getElementById('upload-text');

uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            uploadBox.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image">`;
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        uploadBox.innerHTML = '';
        uploadBox.appendChild(uploadIcon);
        uploadBox.appendChild(uploadText);
        uploadText.textContent = "No file chosen, yet!";
    }
});
