import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "ps-lounge-ya27.firebaseapp.com",
    databaseURL: "https://ps-lounge-ya27-default-rtdb.firebaseio.com",
    projectId: "ps-lounge-ya27",
    storageBucket: "ps-lounge-ya27.appspot.com",
    messagingSenderId: "59106058953",
    appId: "1:59106058953:web:dc938a480951af76326318"
};
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);