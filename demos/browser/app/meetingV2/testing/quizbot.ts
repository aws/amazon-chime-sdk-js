// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// import './styleV2.scss';

// *********** *********** *********** ***********
// *********** QUIZBOT BELOW *********** ***********
// Drew add below

export default class QuizBot {
  constructor() {}

  // You can add other methods or properties here if needed.
}

// OLD QB BELOW
// // *********** *********** *********** ***********
// // *********** QUIZBOT BELOW *********** ***********
// // Drew add below

// // Function to toggle the quiz form
// function toggleQuizForm() {
//   let quizForm = document.getElementById('quiz-container');
//   if (quizForm.classList.contains('d-block')) {
//     quizForm = document.getElementById('quiz-container');
//     quizForm.classList.remove('d-block');

//     const cancelQuizBot = document.getElementById('cancel-quiz');
//     if (cancelQuizBot) {
//       cancelQuizBot.addEventListener('click', function() {
//         console.log('CANCELLING QUIZ TRIGGER... ');
//         quizForm.classList.add('d-none');
//       });
//     }
//     const generatePreviewQuiz = document.getElementById('generate-preview-quiz');
//     if (generatePreviewQuiz) {
//     console.log('Quiz button opened...');

//     generatePreviewQuiz.addEventListener('click', async function() {
//       console.log('Generating quiz...');
//       // log the text from the #transcript-container div:

//       const url = "https://aptiversity.com:5555/MakeQuiz";
//       const transcript = document.getElementById('transcript-container').innerText;
//       const transcriptData = {
//           "transcript": transcript
//       };
//       console.log("TRANSCRIPT DATA:",transcriptData);
//       const response = await fetch(url, {
//           method: 'POST',
//           headers: {
//               'Content-Type': 'application/json'
//           },
//           body: JSON.stringify(transcriptData)
//       });

//       const quizJson = await response.json();
//     // const quizJson = {"message": {"quiz_title":"Testing","questions": [{"answer_reason": "Drew mentions that it was merely a fortnight since they last met.","correct_answer": "a fortnight ago", "question": "According to the text, when did Drew and Ronnie last meet?","question_number": 1,"wrong_answers": ["last night","10 days ago", "a month ago"]},{"answer_reason": "Drew mentions that they went to McDonald's to have a nice milkshake.","correct_answer": "McDonald's","question": "Where did Drew and Ronnie go to have a milkshake?","question_number": 2,"wrong_answers": ["Starbucks","Burger King","Subway"]},{"answer_reason": "Drew mentions that Ronnie has beautiful legs and that he likes them.","correct_answer": "He likes her legs","question": "What did Drew say about Ronnie's legs?","question_number": 3,"wrong_answers": ["He hates her legs","He is jealous of her legs","He doesn't care about her legs"]}]}}
//       console.log("quizJson:",quizJson);
//       // 1. Quiz Title
//       const quizTitle = quizJson.message.quiz_title;
//       console.log(quizTitle);
//       // 2. Questions
//       const questions = quizJson.message.questions;
//       console.log(questions);
//       quizForm.classList.add('d-none');
//       const quizPreview = document.getElementById('quiz-preview');
//       // replace quizform with quizpreview

//       quizPreview.classList.remove('d-none');
//       const quizPreviewTitle = document.getElementById('quiz-preview-title');
//       quizPreviewTitle.innerText = quizTitle;
//       const quizPreviewQuestions = document.getElementById('quiz-preview-questions');

//       quizPreviewQuestions.innerHTML = '';
//       for (let i = 0; i < questions.length; i++) {
//           const question = questions[i];
//           const questionNumber = question.question_number;
//           const questionText = question.question;
//           const correctAnswer = question.correct_answer;
//           const wrongAnswers = question.wrong_answers;
//           const answerReason = question.answer_reason;
//           // Inside your loop:
//           const allAnswers = [correctAnswer, ...wrongAnswers];
//           shuffleArray(allAnswers);

//           const isActive = i === 0 ? 'active' : ''; // Make the first slide active
//           const answerHtml = allAnswers.map(answer => `<li contenteditable="true"><input type="radio" name="q${questionNumber}" value="${answer}"> ${answer}</li>`).join('');

//           const questionHtml = `
//           <div class="carousel-item ${isActive}">
//               <div class="d-flex flex-column align-items-start">
//                   <h5 contenteditable="true">${questionNumber}. ${questionText}</h5>
//                   <ul class="answer-list">
//                       ${answerHtml}
//                   </ul>
//                   <p class="reason d-none" contenteditable="true"><em>Reason:</em> ${answerReason}</p>
//                   <button id="save-edits">Save Edits</button>
//               </div>
//           </div>
//       `;

//         document.querySelectorAll('.answer-list input[type="radio"]').forEach(radio => {
//           radio.addEventListener('click', function(event) {
//               event.stopPropagation();
//           });
//       });

//           quizPreviewQuestions.insertAdjacentHTML('beforeend', questionHtml);
//           const finalSlide = `
//           <div class="carousel-item">
//               <h5>Finished!</h5>
//               <p id="quiz-score">Your score: <span>0</span>/<span>${questions.length}</span></p>
//           </div>
//           `;

//           quizPreviewQuestions.insertAdjacentHTML('beforeend', finalSlide);

//       }

//       // 9. Hide the quiz form
//       quizForm.classList.add('d-none');
//       // 10. Show the quiz
//       const quiz = document.getElementById('quiz');
//       quiz.classList.remove('d-none');
//       // 11. Add the quiz title
//       const quizTitleElement = document.getElementById('quiz-title');
//       quizTitleElement.innerText = quizTitle;
//       // 12. Add the questions
//       const quizQuestions = document.getElementById('quiz-questions');
//       quizQuestions.innerHTML = '';
//       document.addEventListener('keydown', function(event) {
//         const quizCarousel = document.getElementById('quizCarousel');
//         if (event.key === "ArrowRight") {
//           event.preventDefault();
//           const nextControl = quizCarousel.querySelector('.carousel-control-next') as HTMLElement;
//           nextControl.click();
//             } else if (event.key === "ArrowLeft") {
//             event.preventDefault();
//             const prevControl = quizCarousel.querySelector('.carousel-control-prev') as HTMLElement;
//             prevControl.click();
//         }
//        });

//       document.querySelectorAll('.answer-list input').forEach(input => {
//         input.addEventListener('change', function() {
//             this.closest('.carousel-item').querySelector('.reason').classList.remove('d-none');
//         });
//       });

//       console.log(quizJson);
//   });

//     }
//   }
// }

// function shuffleArray(array: string[]): void {
//   for (let i = array.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [array[i], array[j]] = [array[j], array[i]];
//   }
// }

// // Event listener for #button-quizbot
// const buttonQuizBot = document.getElementById('button-quizbot');
// buttonQuizBot.addEventListener('click', toggleQuizForm);

// // Drew added above
// // *********** *********** END QUIZBOT *********** ***********
// // *********** *********** *********** *********** ***********

// Drew added above
// *********** *********** END QUIZBOT *********** ***********
// *********** *********** *********** *********** ***********
