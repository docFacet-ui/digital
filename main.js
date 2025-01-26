// Get the file input and the container where files will be displayed
const fileUploadInput = document.getElementById("fileUpload");
const allFilesContainer = document.querySelector(".allFiles");
const searchBar = document.querySelector(".searchBar input");
const searchIcon = document.querySelector(".fa-magnifying-glass");
const showFileValues = document.querySelector(".showFileValues");

// Initial file list (only showing 8 items)
let allFiles = [
    "Materials Selection Guidelines.pdf",
    "Emergency Shutdown OnOff valves Spec.pdf",
    "shell and Tube Heat Exchanger Specification.pdf",
    "file1.pdf"
];

const API_URL = "https://xt6gsecaplq7ig2w2sg65fcqia0uihao.lambda-url.us-east-2.on.aws/";

// On load - display initial files
window.onload = function () {
    renderFiles();
    showNoDataMessage();
};

// Function to show "No Data" message
function showNoDataMessage() {
    showFileValues.innerHTML = `
        <div class="noDataMessage">
            <img src="https://img.freepik.com/free-vector/flat-design-no-data-illustration_23-2150527124.jpg?t=st=1737902978~exp=1737906578~hmac=a3b70611c67c268c05009d2ef64cb451be55dd42684080ea239eb6a82df9ef38&w=740" 
                alt="No Data Available" 
                style="max-width: 100%; height: auto;">
        </div>
    `;
}

// Event listener for file selection
fileUploadInput.addEventListener("change", handleFileSelection);
searchIcon.addEventListener("click", handleSearch);

function handleFileSelection(event) {
    const files = event.target.files;

    if (files.length > 0) {
        const newFileName = files[0].name;

        // Add new file to the beginning and limit to 8 files
        allFiles.unshift(newFileName);
        if (allFiles.length > 8) {
            allFiles.pop(); // Remove the oldest file to keep the list at 8
        }

        renderFiles(); // Re-render the file list
    }
}

// Function to render the file list (ensuring only 8 items)
function renderFiles() {
    allFilesContainer.innerHTML = ""; // Clear current content
    let fileID = allFiles.length; // Use dynamic file IDs

    allFiles.forEach(fileName => {
        let eachFile = document.createElement("input");
        eachFile.type = "radio";
        eachFile.id = fileName + fileID;
        eachFile.name = "All_Files";
        eachFile.classList.add("filesRadio");

        let fileLabel = document.createElement("label");
        fileLabel.innerHTML = fileName;
        fileLabel.htmlFor = eachFile.id;
        fileLabel.classList.add("filesLabel");

        allFilesContainer.appendChild(eachFile);
        allFilesContainer.appendChild(fileLabel);

        fileID--; // Decrement fileID for uniqueness
    });
}

// Search function triggered by clicking the search icon
async function handleSearch() {
    const searchValue = searchBar.value.trim();
    const selectedFile = document.querySelector('input[name="All_Files"]:checked');

    if (selectedFile && searchValue !== "") {
        const fileName = selectedFile.nextSibling.innerHTML;
        const keywords = searchValue.split(',').map(keyword => keyword.trim());
        const requestParams = {
            payload: {
                pdf_file_name: fileName,
                keywords: keywords
            }
        };

        console.log("Request Parameters:", JSON.stringify(requestParams));

        // Clear previous search results before making a new request
        showFileValues.innerHTML = ""; // This clears the existing search results

        try {
            const response = await fetch(`${API_URL}?payload=${encodeURIComponent(JSON.stringify(requestParams))}`, {
                method: "POST",
                body: JSON.stringify(requestParams)
            });

            if (!response.ok) {
                throw new Error("No Result Found");
            }

            const data = await response.json();
            displaySearchResults(data);
        } catch (error) {
            showFileValues.innerHTML = `<p>Error fetching data: ${error.message}</p>`;
        }
    } else {
        // showFileValues.innerHTML = "Please Select a file and enter a keyword to search.";
        showNoDataMessage();
        alert("Please Select a file and enter a keyword to search.");
    }
}

// Function to display search results in a dynamic table
function displaySearchResults(data) {
    const selectedFile = document.querySelector('input[name="All_Files"]:checked');
    const fileName = selectedFile ? selectedFile.nextSibling.innerHTML : "No file selected";

    if (data && Object.keys(data).length > 0) {
        let resultHtml = "<table class='resultTable' border='1'><thead><tr><th class='resultTableHead'>Key</th><th class='resultTableHead'>Page No</th><th class='resultTableHead'>Type</th><th class='resultTableHead'>" + fileName + "</th></tr></thead><tbody>";

        for (let key in data) {
            if (data[key]) {
                data[key].forEach(item => {
                    let id = item[0];
                    let type = item[1].toUpperCase();
                    let details = Array.isArray(item[2]) ? item[2].map(val => val === null ? "-" : val).join(", ") : (item[2] === null ? "-" : item[2]);
                    resultHtml += `<tr><td>${key}</td><td>${id}</td><td>${type}</td><td>${details}</td></tr>`;
                });
            } else {
                resultHtml += `<tr class="noData"><td colspan='4'>No data available for:<span class="noDataValue"> ${key} </span></td></tr>`;
            }
        }

        resultHtml += "</tbody></table>";
        showFileValues.innerHTML = resultHtml;
    } else {
        showFileValues.innerHTML = "No matching results found.";
    }
}

