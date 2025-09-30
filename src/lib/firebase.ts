// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getDownloadURL, getStorage, ref, uploadBytesResumable} from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDhQNmhpxRQsvfl9gzkvGNkyZ5aAhxWHDs",
  authDomain: "gitai-d68e9.firebaseapp.com",
  projectId: "gitai-d68e9",
  storageBucket: "gitai-d68e9.firebasestorage.app",
  messagingSenderId: "150034834325",
  appId: "1:150034834325:web:b5d98631ae1ff68e048c9c",
  measurementId: "G-DWGR0VP8MZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const storage = getStorage(app);

export async function uploadFile(file: File, setProgress?: (progress: number) => void) {
    return new Promise((resolve, reject) => {
        try {
           const storageRef = ref(storage, file.name);
           const uploadTask = uploadBytesResumable(storageRef, file);
           uploadTask.on('state_changed', snapshot => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100); // Fixed typo and operator
                if (setProgress) setProgress(progress); // Actually call the function
                switch (snapshot.state) {
                    case 'paused':
                        console.log('upload is paused');
                        break;
                    case 'running':
                        console.log('upload is running');
                        break;
                }
           }, error => {
                reject(error);
           }, () => {
                getDownloadURL(uploadTask.snapshot.ref).then(downloadUrl => {
                    resolve(downloadUrl as string);
                });
           });
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
}