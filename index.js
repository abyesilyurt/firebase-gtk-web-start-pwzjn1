// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from 'firebase/app';

// Add the Firebase products and methods that you want to use
import {
  getAuth,
  EmailAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

import {
  getFirestore,
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

// Dependencies for callable functions.
import { getFunctions, httpsCallable } from 'firebase/functions';

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

let rsvpListener = null;
let guestbookListener = null;

let db, auth;

// Listen to guestbook updates
function subscribeGuestbook() {
  const q = query(collection(db, 'guestbook'), orderBy('timestamp', 'desc'));
  guestbookListener = onSnapshot(q, (snaps) => {
    // Reset page
    guestbook.innerHTML = '';
    // Loop through documents in database
    snaps.forEach((doc) => {
      // Create an HTML entry for each document and add it to the chat
      const entry = document.createElement('p');
      entry.textContent = doc.data().name + ': ' + doc.data().text;
      guestbook.appendChild(entry);
    });
  });
}

// Unsubscribe from guestbook updates
function unsubscribeGuestbook() {
  if (guestbookListener != null) {
    guestbookListener();
    guestbookListener = null;
  }
}

async function main() {
  // Add Firebase project configuration object here
  // Your web app's Firebase configuration

  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: 'AIzaSyCOcAn3Hu5zDVNLqP-p_f_sugkWLPL_dCU',
    authDomain: 'battle-die-repeat-app.firebaseapp.com',
    projectId: 'battle-die-repeat-app',
    storageBucket: 'battle-die-repeat-app.appspot.com',
    messagingSenderId: '432334111417',
    appId: '1:432334111417:web:cb1a89d972d7da382b5168',
    measurementId: 'G-85Z7RRNJX2',
  };

  const firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth();
  db = getFirestore();

  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Email / Password Provider.
      EmailAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: function (authResult, redirectUrl) {
        // Handle sign-in.
        // Return false to avoid redirect.
        return false;
      },
    },
  };

  const ui = new firebaseui.auth.AuthUI(auth);

  startRsvpButton.addEventListener('click', () => {
    console.log('Click RSVP');
    if (auth.currentUser) {
      // User is signed in; allows user to sign out
      console.log('Sign out');
      signOut(auth);
    } else {
      // No user is signed in; allows user to sign in
      ui.start('#firebaseui-auth-container', uiConfig);
      console.log('Sign in');
    }
  });

  // Listen to the current Auth state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('Logged in');
      startRsvpButton.textContent = 'LOGOUT';
      // Show guestbook to logged-in users
      guestbookContainer.style.display = 'block';
      // Subscribe to the guestbook collection
      subscribeGuestbook();
    } else {
      startRsvpButton.textContent = 'RSVP';
      console.log('Logged out');
      // Hide guestbook for non-logged-in users
      guestbookContainer.style.display = 'none';
      // Unsubscribe from the guestbook collection
      unsubscribeGuestbook();
    }
  });

  // Listen to the form submission
  form.addEventListener('submit', async (e) => {
    let generatedItem = 'Failed generation';
    console.log('Try generation');
    const functions = getFunctions(firebaseApp, 'us-central1');
    const generateItem = httpsCallable(functions, 'summonSkill');
    await generateItem({ description: input.value })
      .then((result) => {
        const data = result.data;
        generatedItem = data.result;
        console.log('Completed generation');
        console.log(generatedItem);
      })
      .catch((error) => {
        // Getting the Error details.
        const code = error.code;
        const message = error.message;
        const details = error.details;
        console.log(code, message, details, error);
        // ...
      });

    console.log('Not Waiting!');

    await sleep(10000);

    // Prevent the default form redirect
    e.preventDefault();
    // Write a new message to the database collection "guestbook"
    addDoc(collection(db, 'guestbook'), {
      text: generatedItem,
      timestamp: Date.now(),
      name: auth.currentUser.displayName,
      userId: auth.currentUser.uid,
    });
    // clear message input field
    input.value = '';
    // Return false to avoid redirect
    return false;
  });
}
main();
