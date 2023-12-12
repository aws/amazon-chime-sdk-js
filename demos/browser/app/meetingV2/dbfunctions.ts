import * as bootstrap from 'bootstrap';



// import {  DataMessage } from 'amazon-chime-sdk-js';
// // TO DO
// // Hosts can create a quiz  
// // pass host privileges to another attendee
// // remove an attendee
// // host can mute all attendees
// import { DemoMeetingApp } from './meetingV2';

// // Additional imports as required by your application...
 

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
  
    let events: any[] = [];
    if (localStorage.getItem('data')) {
      events = JSON.parse(localStorage.getItem('data')).dashboard_stats.this_month_meetings;
    }
  
    for (let day = 1; day <= daysInMonth; day++) {
      const dateElement = document.createElement('div');
      dateElement.classList.add('calendar-day');
      dateElement.textContent = day.toString();
  
      // Check if there's an event for this day
      const eventDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const foundEvent = events.find(eventItem => eventItem.timestamp.startsWith(eventDate));
      
      if (foundEvent) {
        const eventElement = document.createElement('div');
        eventElement.classList.add('calendar-event');
        dateElement.appendChild(eventElement);
        dateElement.addEventListener('click', () => showEventModal(foundEvent.meeting_name, foundEvent.timestamp, foundEvent.meeting_name, foundEvent.duration));
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
  function generateGoogleCalendarLink(meetingTime: string, meetingName: string, meetingId: string): string {
    const baseUrl: string = 'https://www.google.com/calendar/render?action=TEMPLATE';
    const formatTime = (date: Date): string => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const startTime: Date = new Date(meetingTime);
    const endTime: Date = new Date(startTime.getTime() + 60 * 60000); // Assuming 60 minutes duration
    const location: string = `https://app.larq.ai?m=${meetingId}`;

    return `${baseUrl}&text=${encodeURIComponent(meetingName)}&dates=${formatTime(startTime)}/${formatTime(endTime)}&location=${encodeURIComponent(location)}`;
}

function generateOutlookCalendarLink(meetingTime: string, meetingName: string, meetingId: string): string {
    const formatICSDate = (date: Date): string => {
        return date.toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, 15) + 'Z';
    };

    const startTime: Date = new Date(meetingTime);
    const endTime: Date = new Date(startTime.getTime() + 60 * 60000); // Assuming 60 minutes duration
    const location: string = `https://app.larq.ai?m=${meetingId}`;

    const icsContent: string = [
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

    const blob: Blob = new Blob([icsContent], { type: 'text/calendar' });
    const url: string = URL.createObjectURL(blob);

    const link: HTMLAnchorElement = document.createElement('a');
    link.href = url;
    link.download = `${meetingName.replace(/\s+/g, '_')}.ics`;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);

    return url; // This is a blob URL, it won't be useful after the download is triggered
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

  