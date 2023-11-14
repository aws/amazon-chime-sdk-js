import * as bootstrap from 'bootstrap';

// TIME CHANGES
  document.addEventListener("DOMContentLoaded", function() {
    // Function to format the date
    function formatDate(date: any) {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();

        return monthNames[monthIndex] + ' ' + day + ', ' + year;
    }

      function formatTime(date: any) {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = checkTime(minutes);
        return hours + ':' + minutes + ' ' + ampm;
    }
    
    function checkTime(i:any) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }
    
    function updateDateTime() {
        const now = new Date();
    
        // Update the content of the elements with class 'currentDate'
        const dateElements = document.querySelectorAll('.currentDate');
        dateElements.forEach(element => {
            element.textContent = formatDate(now);  // Assuming you have a formatDate function similar to formatTime
        });
    
        // Update the content of the elements with class 'currentTime'
        const timeElements = document.querySelectorAll('.currentTime');
        timeElements.forEach(element => {
            element.textContent = formatTime(now);
        });
    
        setTimeout(updateDateTime, 1000);
    }
    
    // Call the function to start the update loop
    updateDateTime();
  
  });
    // END TIME CHANGES

    

    
document.addEventListener('DOMContentLoaded', function () {
  const currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  const calendarDates = document.getElementById('calendar-dates');
  const currentMonthElement = document.getElementById('current-month');

  // Sample JSON structure for events
  // const events: { [key: string]: string } = {
  //   '2023-10-03': 'Teachserv Meeting',
  //   '2023-10-06': 'Meeting with Ryan',
  //   '2023-10-15': 'Meeting with Ryan',
  //   '2023-10-26': 'Meeting with Ryan',
  //   '2023-10-27': 'Meetings with team leads',
  //   // Add more events as needed
  // };

  const events:any[] = JSON.parse(localStorage.getItem('data')).dashboard_stats.this_month_meetings;



  function generateCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    currentMonthElement.textContent =
      firstDay.toLocaleString('default', { month: 'long' }) + ' ' + currentYear;

    calendarDates.innerHTML = '';

    // Add padding for days before the first day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const paddingElement = document.createElement('div');
      paddingElement.classList.add('calendar-day', 'inactive');
      calendarDates.appendChild(paddingElement);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateElement = document.createElement('div');
      dateElement.classList.add('calendar-day');
      dateElement.textContent = day.toString();

    // Check if there's an event for this day
    const eventDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`;
    
    const foundEvent = events.find(event => event.timestamp.startsWith(eventDate));
    
    if (foundEvent) {
      // alert(`FOUND EVENT ${foundEvent.meeting_name}, ${foundEvent.timestamp}, ${foundEvent._id}, ${foundEvent.duration}`);
      const eventElement = document.createElement('div');
      eventElement.classList.add('calendar-event');
  
      dateElement.appendChild(eventElement);
      dateElement.addEventListener('click', () => showEventModal(foundEvent.meeting_name, foundEvent.timestamp, foundEvent._id, foundEvent.duration));
    }
    
    calendarDates.appendChild(dateElement);
    }
  }

  function showPreviousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    generateCalendar();
  }

  function showNextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    generateCalendar();
  }

  const prevMonthButton = document.getElementById('prev-month');
  const nextMonthButton = document.getElementById('next-month');

  prevMonthButton.addEventListener('click', showPreviousMonth);
  nextMonthButton.addEventListener('click', showNextMonth);

  generateCalendar();

    
  // if click #close-quiz button, then hide #myDIV
  // const closeQuiz = document.getElementById('close-quiz');
  // const quiz = document.getElementById('myDIV'); 

  // closeQuiz.addEventListener('click', function () {
  //   quiz.style.display = 'none';
  // }
  // );

function showEventModal(content: string, timestamp: string, id: string, duration: string) {
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
    modalContentElement.innerHTML = ""
    modalContentElement.innerHTML += `<div class="text-center"><h3>${content}</h3><br><br><small>Event on ${formattedTimestamp}</small><br><br><i>Duration: ${duration} minutes</i>`;

    modalContentElement.innerHTML += `<br><br><button class="btn btn-success d-inline col-5 p-2 m-2" onclick="window.open('https://app.larq.ai?m=${id}', '_blank')">Go to Meeting</button>`;
    // add a copy meeting link(should copy: https://app.larq.ai?m=[ID]) button to the modal:
    modalContentElement.innerHTML += `<button class="btn btn-primary d-inline col-5 p-2 m-2" onclick="copyToClipboard('https://app.larq.ai?m=${id}', this)">Copy Meeting Link</button>`;
    // copy to clipboard function doesn't work yet but it should be something like this:
    // function copyToClipboard(text) {
    //   var inputc = document.body.appendChild(document.createElement("input"));
    //   inputc.value = text;
    //   inputc.focus();
    //   inputc.select();
    //   document.execCommand('copy');
    //   inputc.parentNode.removeChild(inputc);
    //   alert("Copied the text: " + inputc.value);
    // }

    
    modal.show();
}
function copyToClipboard(text: string, buttonElem: HTMLButtonElement) {
  navigator.clipboard.writeText(text).then(() => {
      // Change button text
      const originalText = buttonElem.textContent;
      buttonElem.textContent = 'Copied!';
      
      // Revert back after 5 seconds
      setTimeout(() => {
          buttonElem.textContent = originalText;
      }, 3000);
  }).catch(err => {
      console.error('Failed to copy text: ', err);
  });
}

(window as any).copyToClipboard = copyToClipboard;


// document.addEventListener('DOMContentLoaded', function() {
//   document.querySelectorAll('.calendar-day .calendar-event').forEach(eventDay => {
//     eventDay.parentElement?.addEventListener('click', function() {
//       // const content = "Test Event";  // Replace with actual event details
//       // const timestamp = "2023-10-03T14:00:00.000Z";  // Replace with actual timestamp
//       // const id = "1234"; // Replace with actual id
//       // const duration = "60"; // Replace with actual duration
//       // showEventModal(content, timestamp, id, duration);
//     });
//   });
// });


  const transcriptContainer = document.getElementById("transcript-container");
  
  // Load highlighted text from localStorage on page load
  const savedHighlight = localStorage.getItem("highlighted_text");
  if (!transcriptContainer) {
    console.error("Unable to find transcript-container.");
}  else {

  if (savedHighlight) {
    transcriptContainer.style.backgroundColor = savedHighlight;
  }

  transcriptContainer.addEventListener("mousedown", () => {
    
    // find the target text
    const selection = window.getSelection();
    const selectedText = selection?.toString(); 
    if (!selectedText) {
        return;
    }
    // Apply the highlight color to the selected text
    transcriptContainer.style.backgroundColor = '#ffff00';


    // Save the highlighted text's content to localStorage
    localStorage.setItem("highlighted_text", selectedText);

    


  });


}
  



const toggleMenuButton = document.getElementById('toggle-menu') as HTMLButtonElement | null;
const x = document.getElementById('toggle-icons');

toggleMenuButton?.addEventListener('click', (e) => {
  console.log('toggle menu clicked');
  if (x) {
    x.style.display = x.style.display === 'block' ? 'none' : 'block';
    e.stopPropagation();  // Prevent this click from being propagated to document
  }
});

document.addEventListener('click', (e) => {
  if (x && x.style.display === 'block' && !toggleMenuButton?.contains(e.target as Node) && !x.contains(e.target as Node)) {
    x.style.display = 'none';
  }
});













});

// ********** VUE CODE **********
// ******************************
// ******************************

  