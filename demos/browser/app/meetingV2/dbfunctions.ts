import { Schema, model, connect } from 'mongoose';

// 1. Create an interface representing a document in MongoDB.
interface IUser {
  name: string;
  email: string;
  avatar?: string;
}

// 2. Create a Schema corresponding to the document interface.
const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  avatar: String
});

// 3. Create a Model.
const User = model<IUser>('User', userSchema);

run().catch(err => console.log(err));

async function run() {
  // 4. Connect to MongoDB
  await connect('mongodb+srv://TeachservAdmin:emR7jaiHTKdyeB0P@cluster0.g0zds.mongodb.net');
//   mongodb+srv://TeachservAdmin:emR7jaiHTKdyeB0P@cluster0.g0zds.mongodb.net

  const user = new User({
    name: 'Bill',
    email: 'bill@initech.com',
    avatar: 'https://i.imgur.com/dM7Thhn.png'
  });
  await user.save();
  console.log("***************CONNECTED TO MONGO DB***************",user.id); // '5d2dcf6b793fa0fc2a47ebb3'
  console.log(user.email); // 'bill@initech.com'
}





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
