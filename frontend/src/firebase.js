import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDSJEsSAXPrSzbSapSHN9_R_9ZZLrrbBIY",
  authDomain: "lines-and-letters-bc7d5.firebaseapp.com",
  databaseURL: "https://lines-and-letters-bc7d5-default-rtdb.firebaseio.com",
  projectId: "lines-and-letters-bc7d5",
  storageBucket: "lines-and-letters-bc7d5.firebasestorage.app",
  messagingSenderId: "520998038607",
  appId: "1:520998038607:web:914ed069df968884d08e3a",
  measurementId: "G-ES0GWQWN0D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

export default database;