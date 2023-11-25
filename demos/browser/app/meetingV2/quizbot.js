// import Vue from 'vue'
// import Vuesax from 'vuesax'
 
// import 'vuesax/dist/vuesax.css'
// Vue.use(Vuesax)




// on domcontentloaded
document.addEventListener('DOMContentLoaded', function() {
// BEGIN DOMCONTENTLOADED



console.log("quizbot.js loaded");
// Function to download content inside a div as a text file.
function downloadDivContentAndLocalStorageDataAsTextFile(divId, localStorageKey, filename) {
    // Get the div content.
    var divContent = document.getElementById(divId).innerText;
    
    // Get the stored data from localStorage directly as a string.
    var storedData = localStorage.getItem(localStorageKey);

    // convert the storedData object to a string
    storedData = JSON.stringify(JSON.parse(storedData), null, '\n');
    
    // Combine both the div content and the stored data.
    var combinedContent = 'Detailed Summary:\n\n' + divContent + '\n\nLocal Storage Data:\n\n' + storedData;
    
    // Convert the combined content to a Blob.
    var blob = new Blob([combinedContent], { type: 'text/plain' });
    
    // Create an anchor element to trigger the download.
    var downloadLink = document.createElement('a');
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(blob);
    
    // Append the anchor to the document and trigger the download, then remove the anchor.
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
  
  // Add an event listener to the element that will trigger the download.
  document.querySelector('.link').addEventListener('click', function() {
    downloadDivContentAndLocalStorageDataAsTextFile('full-dash', 'data', 'detailed_summary.txt');
  });
//   do the same for clicking #quiz-summaries:
document.querySelector('#quiz-summaries').addEventListener('click', function() {
        downloadDivContentAndLocalStorageDataAsTextFile('full-dash', 'data', 'detailed_summary.txt');
      });



//   clicking #button-meeting-leave will send all text in the #transcript-container (as 'transcript') along with localStorage's userId (as 'user_id') and the ?m= parameter (as 'meeting_id') in the URL to https://app.larq.ai/api/SaveTranscript:
document.querySelector('#button-meeting-leave').addEventListener('click', function() {
    // Get the div content.
    var transcript = document.getElementById('transcript-container').innerText;
    // Get the stored data from localStorage directly as a string.
    var user_id = localStorage.getItem('userId');
    // Get the meeting_id from the "m=" parameter in the URL:
    var meeting_id = window.location.search.split('m=')[1];
    // Combine all the data:
    var data = {
        transcript: transcript,
        user_id: user_id,
        meeting_id: meeting_id
    };
    // Convert the data object to a string
    data = JSON.stringify(data);
    // Send the data to the API endpoint
    fetch('https://app.larq.ai/api/SaveTranscript', {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(data => {
        console.log('Transcript Saved Success:', data);
        // redirect to the dashboard
        // window.location.href = "https://app.larq.ai/api/SaveTranscript";
    })
    .catch((error) => {
        console.error('Error:', error);
    });
    });


// if the parameter is ?signup=true and the #login-container is visible, then click the #button-signup:
if (window.location.search.split('signup=')[1] == 'true' && document.getElementById('login-container').style.display == 'block') {
    document.querySelector('#button-signup').click();
}


// GET QUIZZES

const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
if (!userId) {
    console.error('No userId found in localStorage');
    return;
}

fetch(`https://app.larq.ai/api/getQuizzes?user_id=${userId}`)
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateQuizzes(data.message);
        } else {
            console.error('Failed to fetch quizzes');
        }
    })
    .catch(error => console.error('Error:', error));

function updateQuizzes(quizzes) {
const quizzesDiv = document.getElementById('previous-quizzes');
if (quizzes.length === 0) {
    quizzesDiv.innerHTML = 'No previous quizzes yet.';
    return;
}

quizzesDiv.innerHTML = ''; // Clear existing content
quizzes.forEach(quiz => {
    const quizElement = document.createElement('div');
    quizElement.className = 'quiz';
    quizElement.textContent = quiz.title; // Assuming each quiz has a 'title' property
    quizzesDiv.appendChild(quizElement);
});
};



// VECTOR UPLOAD FUNCTION
function uploadPDF(pdfFile, userId) {
    const formData = new FormData();
    formData.append('pdf', pdfFile);

    const pdfspinner = document.getElementById('pdfspinner');
    const choosePDFBtn = document.getElementById('pdfInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const storeName = document.getElementById('store-name');

    pdfspinner.classList.remove('d-none');
    choosePDFBtn.disabled = true;
    uploadBtn.disabled = true;

    fetch('https://app.larq.ai/api/Vectorize', {
        method: 'POST',
        body: formData,
        headers: {
            'user_id': userId
        }
    })
    .then(response => response.json())
    .then(result => {
        pdfspinner.classList.add('d-none');
        choosePDFBtn.disabled = false;
        uploadBtn.disabled = false;

        if (result.status === "success") {
            storeName.innerText = result.store_name;
            storeName.classList.remove('d-none');
            uploadBtn.textContent = "Uploaded";
            uploadBtn.classList.remove('btn-outline-danger');
            uploadBtn.classList.add('btn-outline-success');
            uploadBtn.classList.remove('d-none');

            // make cancelBtn visible by removing the 'd-none' class:
            document.getElementById('cancelBtn').classList.remove('d-none');
            uploadBtn.classList.add('btn-outline-success');
            localStorage.setItem('storeName', result.store_name);
            localStorage.setItem('vector_id', result.vector_id);

        } else {
            storeName.innerText = result.message;
            storeName.classList.remove('d-none');
            storeName.classList.remove('alert-success');
            storeName.classList.add('alert-warning');
            uploadBtn.textContent = "Upload";
            uploadBtn.classList.add('btn-outline-warning');
        }
    })
    .catch(error => {
        console.error("Error uploading PDF:", error);
        pdfspinner.classList.add('d-none');
        choosePDFBtn.disabled = false;
        uploadBtn.disabled = false;
        storeName.innerText = "Error uploading file" + error;
        storeName.classList.remove('alert-success');
        storeName.classList.add('alert-danger');
        storeName.classList.remove('d-none');
        uploadBtn.classList.add('btn-outline-danger');
    });
}

document.getElementById('pdfInput').addEventListener('change', function() {
    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.classList.remove('d-none');
    if (this.files && this.files[0]) {
        uploadBtn.disabled = false;
        uploadBtn.classList.remove('btn-outline-success');
        uploadBtn.classList.add('btn-outline-primary');
        // put the name of the pdf in <p class="text-sm d-none" id="pdf-name"></p>
        document.getElementById('pdf-name').innerText = this.files[0].name;
        document.getElementById('pdf-name').classList.remove('d-none');

    } else {
        uploadBtn.disabled = true;
        uploadBtn.classList.add('btn-outline-warning');
        uploadBtn.classList.remove('btn-outline-primary');

    }
});

document.getElementById('cancelBtn').addEventListener('click', function() {
    const storeName = document.getElementById('store-name');
    const uploadBtn = document.getElementById('uploadBtn');

    // Clear the success message and reset the upload button
    storeName.innerText = '';
    storeName.classList.add('d-none');
    uploadBtn.textContent = 'Upload';
    uploadBtn.classList.remove('btn-outline-success', 'btn-success');
    document.getElementById('cancelBtn').classList.add('d-none');
    // Remove the vectorID from localStorage
    localStorage.removeItem('vector_id');


});


document.getElementById('uploadBtn').addEventListener('click', function() {
    const pdfFile = document.getElementById('pdfInput').files[0];
    const userId = localStorage.getItem('userId');
    const pdfalert = document.getElementById('pdf-alert');

    if (pdfFile && userId) {
        uploadPDF(pdfFile, userId)
            .then(response => {
                console.log(response);
                this.classList.add('btn-success');
            })
            .catch(error => {
                console.error(error);
                this.classList.add('btn-danger');
                pdfalert.classList.remove('d-none');
            });
    } else {
        console.warn("Please select a PDF file first. userId:", userId);
        this.classList.add('btn-danger');
        pdfalert.classList.remove('d-none');
    }
});

document.getElementById('quick-join').addEventListener('click', function(e) {
    e.preventDefault(); // Prevent default if it's a link or has other default behavior
    handleJoinAction();
});

document.getElementById('joinButton').addEventListener('click', function(e) {
    e.preventDefault(); // Same as above
    handleJoinAction();
});

// END DOMCONTENTLOADED
    });



function handleJoinAction() {
        const meetingName = document.getElementById('inputMeeting').value;
        // get userId from localstorage
        const userId = localStorage.getItem('userId');
        // Add other form data as needed
    
        fetch('https://app.larq.ai/api/scheduleMeeting', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                meeting_name: meetingName,
                host_id: userId,
                timestamp: Date.now(),
                duration: 60 // minutes
                // Add other meeting details
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Handle joining or starting the meeting (NEW MEETING)
                console.log(data.message);
                // set localstorage "host_id" to data.host_id
                localStorage.setItem('host_id', data.host_id);
                // Redirect to meeting page or perform other actions
            } else if (data.status === 'exists') {
                // Handle meeting already exists (JOIN MEETING)
                console.log(data.message);
                localStorage.setItem('host_id', data.host_id);
                // Redirect to meeting page or perform other actions
            }
            else {
                console.error(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };