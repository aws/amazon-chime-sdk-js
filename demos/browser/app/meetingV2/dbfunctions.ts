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

    // Function to format the time
    function formatTime(date: any) {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return hours + ':' + minutes + ' ' + ampm;
    }

    // Get the current date and time
    const now = new Date();

    // Update the content of the elements with class 'currentDate'
    const dateElements = document.querySelectorAll('.currentDate');
    dateElements.forEach(element => {
        element.textContent = formatDate(now);
    });

    // Update the content of the elements with class 'currentTime'
    const timeElements = document.querySelectorAll('.currentTime');
    timeElements.forEach(element => {
        element.textContent = formatTime(now);
    });
  });
    // END TIME CHANGES

    