import * as bootstrap from 'bootstrap';

// **********************************************************************
// **********************************************************************
// DOM CONTENT LOADED
// **********************************************************************
// **********************************************************************
document.addEventListener('DOMContentLoaded', function() {
// BEGIN DOMCONTENTLOADED

console.log("quizbot.js loaded");

// **********************************************************************
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
// **********************************************************************


// **********************************************************************
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
// **********************************************************************



// **********************************************************************

// if the parameter is ?signup=true and the #login-container is visible, then click the #button-signup:
if (window.location.search.split('signup=')[1] == 'true' && document.getElementById('login-container').style.display == 'block') {
    document.querySelector('#button-signup').click();
}

// **********************************************************************



// **********************************************************************

// GET QUIZZES
const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
if (userId) {

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
    quizElement.textContent = quiz.quiz_title; // Assuming each quiz has a 'title' property
    quizzesDiv.appendChild(quizElement);
});
};
}

// **********************************************************************


// **********************************************************************
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


// **********************************************************************
// **********************************************************************
// HOST ID
document.getElementById('quick-join').addEventListener('click', function(e) {
    // e.preventDefault(); // Prevent default if it's a link or has other default behavior
    handleJoinAction();
});

document.getElementById('joinButton').addEventListener('click', function(e) {
    // e.preventDefault(); // Same as above
    handleJoinAction();
});
// **********************************************************************

// **********************************************************************
// Function for clicking #quiz-button to toggle #myDIV
const x = document.getElementById('myDIV');
const quizButton = document.getElementById('quiz-button');

quizButton.addEventListener('click', function() {
    if (window.demoMeetingAppInstance.isHost()) {
        console.log("You're the host, you can create Quiz!");
    } else {
        console.log("You're not the host, you can't create quizzes!");
        alert("You're not the host, you can't create quizzes!");

        // Show #create-quiz-not-host
        const createQuizNotHost = document.getElementById('create-quiz-not-host');
        createQuizNotHost.classList.add('animate__slideInRight');
        return;
    }

    if (x) {
        const createQuiz = document.getElementById('create-quiz');
        const quizQuestion = document.getElementById('quiz_question');
        const quizInProgress = document.getElementById('quiz_in_progress');
        const transcriptContainer = document.getElementById('tile-transcript-container');

        if (x.classList.contains('animate__slideInRight')) {
            x.classList.remove('animate__slideInRight');
            x.classList.add('animate__slideOutRight');

            if (createQuiz) {
                createQuiz.classList.add('animate__slideInRight');
            }
            if (quizQuestion) {
                quizQuestion.classList.remove('animate__slideInRight');
            }
            if (quizInProgress) {
                quizInProgress.classList.remove('animate__slideInRight');
            }
            if (transcriptContainer) {
                transcriptContainer.style.width = '100%';
            }
        } else {
            x.classList.remove('animate__slideOutRight');
            x.classList.add('animate__slideInRight');

            if (transcriptContainer) {
                transcriptContainer.style.width = 'calc(100% - 300px)'; // Adjust width as needed
            }
        }
    }
});
// **********************************************************************


// If the user is host and clicks #button-meeting-leave, then save all text in #transcript-container and send it to app.larq.ai/api/SaveTranscript along with the userId and meetingId:
document.querySelector('#button-meeting-leave').addEventListener('click', function() {
    // if not host, then return:
    if (!window.demoMeetingAppInstance.isHost()) {
        return;
    }

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
    }
    );
    });

// **********************************************************************



document.querySelector('#scheduleMeetingSubmit')?.addEventListener('click', () => {
    const meetingScheduleTime = (document.getElementById('meetingScheduleTime') ).value;
  
    if (!meetingScheduleTime) {
        alert('Please ensure both date and time are selected.');
        return;
    }
  
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('User ID is missing. Did you sign in?');
        return;
    }
  
    const meetingName = (document.getElementById('meetingName') ).value;
    // let authToken = localStorage.getItem('authToken');
  
    fetch("https://app.larq.ai/api/scheduleMeeting", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' 
            // Add Authorization header if needed
            // 'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            timestamp: meetingScheduleTime,
            host_id: userId,
            meeting_name: meetingName,
            duration: 60
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            
          let dataString = localStorage.getItem('data');
          if (!dataString) {
              console.error('No data found in localStorage');
              return;
          }
          
          // Parse the data string into an object
          let data = JSON.parse(dataString);
          
          // Check if 'this_month_meetings' exists in the data
          if (!data.dashboard_stats || !data.dashboard_stats.this_month_meetings) {
              console.error('Invalid data structure in localStorage');
              return;
          }
          
          // Create a new meeting object
          const newMeeting = {
            _id: data.meeting_id,
            host_id: userId,
            meeting_name: meetingName,
            timestamp: meetingScheduleTime,
            duration: 60
            // Add other necessary fields here
        };

        // // Generate and display "Add to Calendar" links
        // const googleCalendarLink = generateGoogleCalendarLink(meetingScheduleTime, meetingName);
        // const outlookCalendarLink = generateOutlookCalendarLink(meetingScheduleTime, meetingName); // You need to implement this

        // // Display or log the links (modify as needed)
        // console.log('Add to Google Calendar:', googleCalendarLink);
        // console.log('Download ICS for Outlook:', outlookCalendarLink);

      
          // Add the new meeting to the 'this_month_meetings' array
          data.dashboard_stats.this_month_meetings.push(newMeeting);
      
          // Convert the updated data object back to a string
          dataString = JSON.stringify(data);
      
          // Store the updated string back in localStorage
          localStorage.setItem('data', dataString);
          showEventModal(meetingName, meetingScheduleTime, data.meeting_id, 60);    
            //   location.reload();
            // Hide modal if needed
            // document.getElementById('scheduleMeetingModal')!.style.display = 'none';
        } 
        else if( data.status === 'exists'){
          alert(data.message);    
          showEventModal(meetingName, meetingScheduleTime, data.meeting_id, 60);    
  
        }
        else {
            alert(data.message);
        }
    })
    .catch(error => {
        alert('Error occurred: ' + error.message);
        console.error('Error:', error);
    });
  });
  
// **********************************************************************
// **********************************************************************
// END DOMCONTENTLOADED
// **********************************************************************
// **********************************************************************

});



// **********************************************************************
// **********************************************************************
// FUNCTIONS
// **********************************************************************
// **********************************************************************

function showEventModal(content, timestamp, id, duration) {
    const modalElement = document.getElementById('eventModal');
    const modalContentElement = document.getElementById('eventModalContent');
  
    if (!modalElement || !modalContentElement) {
      console.error("Modal elements not found");
      return;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    let formattedTimestamp = "Invalid Date";
  
    if (timestamp) {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {  // Check if date is valid
        const formattedDate = date.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
        const formattedTime = date.toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true });
        formattedTimestamp = `${formattedDate}<br>At ${formattedTime}`;
      }
    }
  
    // Generate calendar links
    const googleCalendarLink = generateGoogleCalendarLink(timestamp, content, id);
    const outlookCalendarLink = generateOutlookCalendarLink(timestamp, content, id);
  
    modalContentElement.innerHTML = `<div class="text-center">
      <h3>${content}</h3>
      <br><br>
      <small>Event on ${formattedTimestamp}</small>
      <br><br>
      <i>Duration: ${duration} minutes</i>
      <br><br>
      <p style="font-size:14px">Add to Calendar</p>
      <a href="${googleCalendarLink}" target="_blank" class="btn btn-warning d-inline col-5 p-2 m-2">Google Calendar</a>
      <a href="${outlookCalendarLink}" download class="btn btn-info d-inline text-white col-5 p-2 m-2">Outlook ICS File</a>
      <br><br>
      <button class="btn btn-success d-inline col-5 p-2 m-2" onclick="window.open('https://app.larq.ai?m=${id}', '_blank')">Go to Meeting</button>
      <button class="btn btn-primary d-inline col-5 p-2 m-2" onclick="copyToClipboard('https://app.larq.ai?m=${id}', this)">Copy Meeting Link</button>
    </div>`;
  
    modal.show();
  }


function generateGoogleCalendarLink(meetingTime, meetingName, meetingId) {
    const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
    const formatTime = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const startTime = new Date(meetingTime);
    const endTime = new Date(startTime.getTime() + 60 * 60000); // Assuming 60 minutes duration
    const location = `https://app.larq.ai?m=${meetingId}`;
  
    return `${baseUrl}&text=${encodeURIComponent(meetingName)}&dates=${formatTime(startTime)}/${formatTime(endTime)}&location=${encodeURIComponent(location)}`;
  }
  

  function generateOutlookCalendarLink(meetingTime, meetingName, meetingId) {
    const formatICSDate = (date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, 15) + 'Z';
    };
  
    const startTime = new Date(meetingTime);
    const endTime = new Date(startTime.getTime() + 60 * 60000); // Assuming 60 minutes duration
    const location = `https://app.larq.ai?m=${meetingId}`;
  
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `URL:${location}`,
      `DTSTART:${formatICSDate(startTime)}`,
      `DTEND:${formatICSDate(endTime)}`,
      `SUMMARY:${meetingName}`,
      `DESCRIPTION:${meetingName}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');
  
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meetingName.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
  
    return url; // This is a blob URL, it won't be useful after the download is triggered
  }
    
  
  

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
                meeting_id = data.meeting_id;
                // set localstorage "host_id" to data.host_id
                localStorage.setItem('host_id', data.host_id);
                // Redirect to meeting page or perform other actions
            } else if (data.status === 'exists') {
                // Handle meeting already exists (JOIN MEETING)
                meeting_id = data.meeting_id;
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