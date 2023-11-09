// import Vue from 'vue'
// import Vuesax from 'vuesax'
 
// import 'vuesax/dist/vuesax.css'
// Vue.use(Vuesax)

// on domcontentloaded
document.addEventListener('DOMContentLoaded', function() {
console.log("quizbot.js loaded");
// Function to download content inside a div as a text file.
function downloadDivContentAndLocalStorageDataAsTextFile(divId, localStorageKey, filename) {
    // Get the div content.
    var divContent = document.getElementById(divId).innerText;
    
    // Get the stored data from localStorage directly as a string.
    var storedData = localStorage.getItem(localStorageKey);

    // convert the storedData object to a string
    storedData = JSON.stringify(storedData);
    
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
        console.log('Success:', data);
        alert("Transcript saved successfully");
        // redirect to the dashboard
        window.location.href = "https://app.larq.ai/api/SaveTranscript";
    })
    .catch((error) => {
        console.error('Error:', error);
    });
    });
    });