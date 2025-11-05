// -------------------------------------------------
// 🔹 IMPORTS
// -------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged,
    signInAnonymously,
    signInWithCustomToken
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { 
    getFirestore,
    doc,
    setDoc,
    getDoc,
    addDoc,
    updateDoc,
    collection,
    query,
    where,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
// UPDATED: Import Firebase Storage modules
import {
    getStorage,
    ref as storageRef,
    uploadBytesResumable, // Changed from uploadBytes
    getDownloadURL,
    // onSnapshot as onStorageSnapshot // THIS WAS THE BUG - REMOVED
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

// -------------------------------------------------
// 🔹 FIREBASE CONFIG & INITIALIZATION
// -------------------------------------------------
// Load config from global variables if available
const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config)
    : {
        apiKey: "AIzaSyCZ3zUlZ0fJz356LKgk45jet9-W9bWduLI",
        authDomain: "ai-based-internship.firebaseapp.com",
        databaseURL: "https://ai-based-internship-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "ai-based-internship",
        storageBucket: "gs://ai-based-internship.firebasestorage.app",
        messagingSenderId: "705633856385",
        appId: "1:705633856385:web:f05fa39a68e53a0cdf1680"
    };

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // NEW: Initialize Storage
console.log("✅ Firebase (Firestore & Storage) connected");

// -------------------------------------------------
// 🔹 FIRESTORE PATHS
// -------------------------------------------------
const usersPath = `/artifacts/${appId}/users`;
const jobsPath = `/artifacts/${appId}/public/data/jobs`;
const appsPath = `/artifacts/${appId}/public/data/applications`;

// -------------------------------------------------
// 🔹 GLOBAL STATE & REFERENCES
// -------------------------------------------------
const pages = [
    'login-page', 
    'student-register-page', 
    'recruiter-register-page', 
    'student-dashboard', 
    'recruiter-dashboard', 
    'admin-dashboard'
];

// Notification Modal
const notificationModal = document.getElementById('notification-modal');
const notificationMessage = document.getElementById('notification-message');
let notificationTimeout;

// Dynamic Content Containers
const studentJobList = document.getElementById('student-job-list');
const studentApplicationsList = document.getElementById('student-applications-list');
const recruiterJobList = document.getElementById('recruiter-job-list-with-applicants');
const adminApplicantsList = document.getElementById('admin-applicants-list');
const adminOpportunitiesList = document.getElementById('admin-opportunities-list');
const adminRecruitersList = document.getElementById('admin-recruiters-list');
const studentResumeText = document.getElementById('student-resume-text');
// NEW: Add references for file input
const studentResumeFile = document.getElementById('student-resume-file');
const currentFileName = document.getElementById('current-file-name');
const saveProfileButton = document.getElementById('save-profile-button');
// NEW: Add references for progress bar
const uploadProgressContainer = document.getElementById('upload-progress-container');
const uploadProgressBar = document.getElementById('upload-progress-bar');


// Global listeners unsubscribe functions
let unsubscribeJobs = () => {};
let unsubscribeApplications = () => {};
let unsubscribeUsers = () => {};
let unsubscribeProfile = () => {};

// -------------------------------------------------
// 🔹 NOTIFICATION MODAL (Replaces alert())
// -------------------------------------------------
function showNotification(message, isError = false) {
    clearTimeout(notificationTimeout);
    
    notificationMessage.textContent = message;
    
    // Set color
    if (isError) {
        notificationModal.classList.remove('bg-green-500');
        notificationModal.classList.add('bg-red-500');
    } else {
        notificationModal.classList.remove('bg-red-500');
        notificationModal.classList.add('bg-green-500');
    }
    
    // Show modal
    notificationModal.classList.add('show');
    
    // Hide after 3 seconds
    notificationTimeout = setTimeout(() => {
        notificationModal.classList.remove('show');
    }, 3000);
}

// -------------------------------------------------
// 🔹 PAGE & TAB NAVIGATION
// -------------------------------------------------
window.showPage = function(pageId, userType) {
    console.log(`Navigating to: ${userType} (${pageId})`);
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.remove('hidden');

    // Reset tabs to default when loading a dashboard
    if (pageId === 'student-dashboard') {
        showStudentTab('student-find');
    } else if (pageId === 'recruiter-dashboard') {
        showRecruiterTab('recruiter-applicants');
    } else if (pageId === 'admin-dashboard') {
        showAdminTab('admin-applicants');
    }
}

window.showStudentTab = function(tabId) {
    document.querySelectorAll('.student-tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId)?.classList.remove('hidden');
    
    document.querySelectorAll('.student-tab').forEach(btn => {
        btn.classList.remove('bg-indigo-700', 'text-white');
        btn.classList.add('text-indigo-300', 'hover:bg-indigo-700', 'hover:text-white');
    });
    document.querySelector(`button[onclick="showStudentTab('${tabId}')"]`)?.classList.add('bg-indigo-700', 'text-white');
}

window.showRecruiterTab = function(tabId) {
    document.querySelectorAll('.recruiter-tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId)?.classList.remove('hidden');

    document.querySelectorAll('.recruiter-tab').forEach(btn => {
        btn.classList.remove('bg-green-700', 'text-white');
        btn.classList.add('text-green-300', 'hover:bg-green-700', 'hover:text-white');
    });
    document.querySelector(`button[onclick="showRecruiterTab('${tabId}')"]`)?.classList.add('bg-green-700', 'text-white');
}

window.showAdminTab = function(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId)?.classList.remove('hidden');

    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.remove('bg-gray-900', 'text-white');
        btn.classList.add('text-gray-300', 'hover:bg-gray-700', 'hover:text-white');
    });
    document.querySelector(`button[onclick="showAdminTab('${tabId}')"]`)?.classList.add('bg-gray-900', 'text-white');
}

// -------------------------------------------------
// 🔹 AUTHENTICATION (REGISTER)
// -------------------------------------------------
async function handleStudentRegister(e) {
    e.preventDefault();
    const name = document.getElementById("student-reg-name").value;
    const email = document.getElementById("student-reg-email").value;
    const pass = document.getElementById("student-reg-password").value;
    const confirm = document.getElementById("student-reg-confirm-password").value;

    if (pass !== confirm) {
        return showNotification("Passwords do not match", true);
    }

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pass);
        const userDocRef = doc(db, usersPath, userCred.user.uid);
        await setDoc(userDocRef, {
            name,
            email,
            role: "student",
            createdAt: serverTimestamp(),
            resumeText: "" // Initialize resume text
        });
        showNotification("Student account created!", false);
        // No need to call showPage, onAuthStateChanged will handle it
    } catch (err) {
        showNotification(err.message, true);
    }
}

async function handleRecruiterRegister(e) {
    e.preventDefault();
    const name = document.getElementById("recruiter-reg-name").value;
    const company = document.getElementById("recruiter-reg-company").value;
    const email = document.getElementById("recruiter-reg-email").value;
    const pass = document.getElementById("recruiter-reg-password").value;
    const confirm = document.getElementById("recruiter-reg-confirm-password").value;

    if (pass !== confirm) {
        return showNotification("Passwords do not match", true);
    }

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pass);
        const userDocRef = doc(db, usersPath, userCred.user.uid);
        await setDoc(userDocRef, {
            name,
            company,
            email,
            role: "recruiter",
            createdAt: serverTimestamp()
        });
        showNotification("Recruiter account created!", false);
        // No need to call showPage, onAuthStateChanged will handle it
    } catch (err) {
        showNotification(err.message, true);
    }
}

// -------------------------------------------------
// 🔹 AUTHENTICATION (LOGIN & LOGOUT)
// -------------------------------------------------
async function handleStudentLogin(e) {
    e.preventDefault();
    const email = document.getElementById("student-email").value;
    const pass = document.getElementById("student-password").value;
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        // Check role
        const userDocRef = doc(db, usersPath, userCred.user.uid);
        const snapshot = await getDoc(userDocRef);

        // --- BEGIN DEBUGGING ---
        if (snapshot.exists()) {
            console.log("Found document!", snapshot.data());
        } else {
            console.log("No document found for UID:", userCred.user.uid);
        }
        // --- END DEBUGGING ---

        if (snapshot.exists() && snapshot.data().role === 'student') {
            // onAuthStateChanged will handle navigation
        } else {
            await signOut(auth);
            showNotification("No student account found with these credentials.", true);
        }
    } catch (err) {
        showNotification(err.message, true);
    }
}

async function handleRecruiterLogin(e) {
    e.preventDefault();
    const email = document.getElementById("recruiter-email").value;
    const pass = document.getElementById("recruiter-password").value;
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        // Check role
        const userDocRef = doc(db, usersPath, userCred.user.uid);
        const snapshot = await getDoc(userDocRef);
        if (snapshot.exists() && snapshot.data().role === 'recruiter') {
            // onAuthStateChanged will handle navigation
        } else {
            await signOut(auth);
            showNotification("No recruiter account found with these credentials.", true);
        }
    } catch (err) {
        showNotification(err.message, true);
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById("admin-email").value;
    const pass = document.getElementById("admin-password").value;
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        // Check role
        const userDocRef = doc(db, usersPath, userCred.user.uid);
        const snapshot = await getDoc(userDocRef);
        if (snapshot.exists() && snapshot.data().role === 'admin') {
            // onAuthStateChanged will handle navigation
        } else {
            await signOut(auth);
            showNotification("No admin account found with these credentials.", true);
        }
    } catch (err) {
        showNotification(err.message, true);
    }
}

window.handleLogout = async function() {
    await signOut(auth);
    showNotification("Logged out successfully.", false);
    showPage('login-page', 'Login'); // <-- ADDED THIS LINE
    // onAuthStateChanged will still run in the background to clean up listeners
}

// -------------------------------------------------
// 🔹 AUTH STATE CONTROLLER (The "Brain")
// -------------------------------------------------
onAuthStateChanged(auth, async (user) => {
    // First, sign in with token if available
    try {
        if (user && typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            // We have a user and a token, sign in with token
            await signInWithCustomToken(auth, __initial_auth_token);
            __initial_auth_token = null; // Use token only once
        } else if (!user && typeof __initial_auth_token === 'undefined') {
            // No user, no token, sign in anonymously for login page
            await signInAnonymously(auth);
        }
    } catch (authError) {
        console.error("Auth token/anonymous sign-in error:", authError);
        showNotification("Authentication failed. Please refresh.", true);
        return;
    }
    
    // Now check the *final* user state
    const currentUser = auth.currentUser;

    if (currentUser && !currentUser.isAnonymous) {
        // User is signed in, check their role
        const userDocRef = doc(db, usersPath, currentUser.uid);
        const snapshot = await getDoc(userDocRef);

        if (snapshot.exists()) {
            const userData = snapshot.data();
            // Navigate to the correct dashboard based on role
            if (userData.role === 'student') {
                document.getElementById('student-welcome-name').textContent = `Welcome, ${userData.name}!`;
                studentResumeText.value = userData.resumeText || '';
                showPage('student-dashboard', 'Student');
            } else if (userData.role === 'recruiter') {
                document.getElementById('recruiter-welcome-name').textContent = `Welcome, ${userData.name}!`;
                showPage('recruiter-dashboard', 'Recruiter');
            } else if (userData.role === 'admin') {
                document.getElementById('admin-welcome-name').textContent = `Welcome, ${userData.name}!`;
                showPage('admin-dashboard', 'Admin');
            }
            // Start listening to all data
            attachDataListeners(currentUser, userData.role);
        } else {
            // This case is rare, means auth created but DB write failed
            showNotification("User data not found. Please contact support.", true);
            await signOut(auth);
        }
    } else {
        // User is signed out or anonymous, show login page
        showPage('login-page', 'Login');
        // Detach all listeners
        detachAllListeners();
    }
});

// -------------------------------------------------
// 🔹 DATA LISTENERS & RENDERING
// -------------------------------------------------

function detachAllListeners() {
    console.log("Detaching all data listeners.");
    unsubscribeJobs();
    unsubscribeApplications();
    unsubscribeUsers();
    unsubscribeProfile();
}

function attachDataListeners(currentUser, role) {
    // Detach any existing listeners before attaching new ones
    detachAllListeners();
    console.log(`Attaching listeners for role: ${role}`);

    // Attach listeners based on role
    if (role === 'student') {
        // 1. Listen to all jobs
        const jobsQuery = query(collection(db, jobsPath));
        unsubscribeJobs = onSnapshot(jobsQuery, (jobsSnap) => {
            // 2. Listen to *only* this student's applications
            const appsQuery = query(collection(db, appsPath), where("studentId", "==", currentUser.uid));
            unsubscribeApplications = onSnapshot(appsQuery, (appsSnap) => {
                const allJobs = {};
                jobsSnap.forEach(doc => allJobs[doc.id] = doc.data());
                
                const myApplications = {};
                appsSnap.forEach(doc => myApplications[doc.id] = doc.data());

                renderStudentJobFeed(allJobs, myApplications, currentUser);
                renderStudentApplications(allJobs, myApplications, currentUser);
            });
        });
        
        // 3. Listen to *only* this student's profile
        unsubscribeProfile = onSnapshot(doc(db, usersPath, currentUser.uid), (docSnap) => {
            if(docSnap.exists()) {
                 const userData = docSnap.data();
                 studentResumeText.value = userData.resumeText || '';
                 // NEW: Display the name of the currently uploaded file
                 if (userData.resumeFileName) {
                    currentFileName.textContent = `Current file: ${userData.resumeFileName}`;
                 } else {
                    currentFileName.textContent = `Current file: None`;
                 }
            }
        });

    } else if (role === 'recruiter') {
        // 1. Listen to *only* this recruiter's jobs
        const jobsQuery = query(collection(db, jobsPath), where("recruiterId", "==", currentUser.uid));
        unsubscribeJobs = onSnapshot(jobsQuery, (jobsSnap) => {
            
            // 2. Listen to *only* applications for this recruiter
            const appsQuery = query(collection(db, appsPath), where("recruiterId", "==", currentUser.uid));
            unsubscribeApplications = onSnapshot(appsQuery, (appsSnap) => {
                
                const myJobs = {};
                jobsSnap.forEach(doc => myJobs[doc.id] = doc.data());

                const myJobApplications = {};
                appsSnap.forEach(doc => myJobApplications[doc.id] = doc.data());
                
                // We have all the data we need, render the dashboard
                // We denormalized studentName, so no extra user query is needed!
                renderRecruiterDashboard(myJobs, myJobApplications, currentUser);
            });
        });
        
    } else if (role === 'admin') {
        // Admin listens to everything
        // 1. Listen to all users
        unsubscribeUsers = onSnapshot(collection(db, usersPath), (usersSnap) => {
            // 2. Listen to all jobs
            unsubscribeJobs = onSnapshot(collection(db, jobsPath), (jobsSnap) => {
                // 3. Listen to all applications
                unsubscribeApplications = onSnapshot(collection(db, appsPath), (appsSnap) => {
                    
                    const allUsers = {};
                    usersSnap.forEach(doc => allUsers[doc.id] = doc.data());

                    const allJobs = {};
                    jobsSnap.forEach(doc => allJobs[doc.id] = doc.data());

                    const allApplications = {};
                    appsSnap.forEach(doc => allApplications[doc.id] = doc.data());
                    
                    renderAdminApplicants(allUsers, allApplications);
                    renderAdminOpportunities(allJobs, allApplications, allUsers);
                    renderAdminRecruiters(allUsers, allJobs);
                });
            });
        });
    }
}


// --- STUDENT: Render Job Feed ---
// Receives all jobs, and only this student's applications
function renderStudentJobFeed(allJobs, myApplications, currentUser) {
    studentJobList.innerHTML = ''; // Clear list
    const myApplicationJobIds = Object.values(myApplications).map(app => app.jobId);
    
    const jobs = Object.entries(allJobs);
    if (jobs.length === 0) {
        studentJobList.innerHTML = '<p class="text-gray-600">No internships are available right now. Check back soon!</p>';
        return;
    }

    jobs.forEach(([jobId, job]) => {
        const hasApplied = myApplicationJobIds.includes(jobId);

        const card = document.createElement('div');
        card.className = "bg-white p-6 rounded-2xl shadow-lg"; 
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-xl font-semibold text-indigo-600">${job.title}</h3>
                    <p class="text-gray-800">${job.companyName || 'A Company'}</p>
                    <p class="text-sm text-gray-500">${job.location || 'Remote'} | ${job.type || 'Internship'}</p>
                </div>
                <button 
                    class="apply-button rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm ${hasApplied ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'}" 
                    data-job-id="${jobId}" 
                    data-job-title="${job.title}"
                    data-company-name="${job.companyName || 'A Company'}"
                    data-recruiter-id="${job.recruiterId}"
                    ${hasApplied ? 'disabled' : ''}
                >
                    ${hasApplied ? 'Applied' : 'Apply Now'}
                </button>
            </div>
            <p class="mt-4 text-gray-700">${job.description}</p>
        `;

        // Add click listener only if not applied
        if (!hasApplied) {
            card.querySelector('.apply-button').addEventListener('click', handleJobApply);
        }
        studentJobList.appendChild(card);
    });
}

// --- STUDENT: Render My Applications ---
// Receives all jobs, and only this student's applications
function renderStudentApplications(allJobs, myApplications, currentUser) {
    studentApplicationsList.innerHTML = ''; // Clear list
    const myApplicationsArray = Object.values(myApplications);

    if (myApplicationsArray.length === 0) {
        studentApplicationsList.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">You have not applied to any jobs yet.</td></tr>';
        return;
    }

    myApplicationsArray.forEach(app => {
        let statusText = 'Pending';
        let statusColor = 'bg-yellow-100 text-yellow-800';
        if (app.status === 'accepted') {
            statusText = 'Accepted';
            statusColor = 'bg-green-100 text-green-800';
        } else if (app.status === 'rejected' || app.status === 'denied') { 
            statusText = 'Rejected';
            statusColor = 'bg-red-100 text-red-800';
        } else if (app.status === 'scanned' || app.status === 'shortlisted') { 
            statusText = 'Reviewed';
            statusColor = 'bg-blue-100 text-blue-800';
        }

        const aiScore = app.aiScore ? `${app.aiScore}% Match` : 'Not Scanned';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${app.jobTitle}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${app.companyName || 'Unknown Company'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusColor}">${statusText}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${aiScore}</td>
        `;
        studentApplicationsList.appendChild(row);
    });
}

// --- RECRUITER: Render Dashboard ---
// Receives only this recruiter's jobs and their corresponding applications
function renderRecruiterDashboard(myJobs, myJobApplications, currentUser) {
    recruiterJobList.innerHTML = ''; // Clear list
    
    const myJobsEntries = Object.entries(myJobs);
    const allMyApplications = Object.entries(myJobApplications);

    if (myJobsEntries.length === 0) {
        recruiterJobList.innerHTML = '<p class="text-gray-600">You have not posted any jobs yet. Post one to see applicants here.</p>';
        return;
    }

    myJobsEntries.forEach(([jobId, job]) => {
        const card = document.createElement('div');
        card.className = "bg-white p-6 rounded-2xl shadow-lg"; // Light theme
        
        // Get all applicants for this specific job
        const allApplicantsForJob = allMyApplications.filter(([appId, app]) => app.jobId === jobId);

        // Filter for scanned, sort by score, and take top 3
        const top3Applicants = allApplicantsForJob
            .filter(([appId, app]) => app.aiScore !== undefined) // Ensure they are scanned
            .sort((a, b) => b[1].aiScore - a[1].aiScore) // Sort descending by score
            .slice(0, 3); // Get only the top 3

        let applicantHtml = '';
        if (allApplicantsForJob.length === 0) {
             applicantHtml = '<tr><td colspan="4" class="px-4 py-3 text-center text-sm text-gray-500">No applicants yet.</td></tr>';
        } else if (top3Applicants.length === 0) {
             applicantHtml = '<tr><td colspan="4" class="px-4 py-3 text-center text-sm text-gray-500">No scanned applicants found.</td></tr>';
        } else {
            applicantHtml = top3Applicants.map(([appId, app]) => {
                // We use app.studentName (denormalized) - no extra lookup needed!
                const studentName = app.studentName || 'Unknown Student';
                const studentEmail = app.studentEmail || 'Unknown Email'; // Let's add email to denormalization
                // NEW: Create a viewable resume link if it exists
                const resumeLink = app.resumeUrl 
                    ? `<a href="${app.resumeUrl}" target="_blank" class="ml-2 text-sm text-indigo-500 hover:underline">(View Resume)</a>` 
                    : '';

                const aiScore = `<span class="font-bold text-blue-600">${app.aiScore}% Match</span>`;
                const aiSummary = app.aiSummary ? `<p class="text-xs text-gray-600 italic mt-1">"${app.aiSummary}"</p>` : '';

                let actionButtons = '';
                if (app.status === 'scanned') {
                    actionButtons = `
                        <button class="status-button rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-green-500" data-app-id="${appId}" data-status="accepted">Accept</button>
                        <button class="status-button rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-red-500" data-app-id="${appId}" data-status="rejected">Reject</button>
                    `;
                } else if (app.status === 'accepted') {
                     actionButtons = `<span class="text-green-600 font-semibold">Accepted</span>`;
                } else if (app.status === 'rejected' || app.status === 'denied') {
                     actionButtons = `<span class="text-red-600 font-semibold">Rejected</span>`;
                }

                return `
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${studentName}${resumeLink}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">${studentEmail}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">${aiScore}${aiSummary}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm space-x-1">${actionButtons}</td>
                    </tr>
                `;
            }).join('');
        }

        card.innerHTML = `
            <h3 class="text-xl font-semibold text-green-600">${job.title}</h3>
            <p class="text-sm text-gray-500">${job.description.substring(0, 100)}...</p>
            <h4 class="text-lg font-semibold text-gray-800 mt-4 mb-2">Top 3 Applicants</h4>
            <div class="overflow-x-auto rounded-lg border border-gray-200">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">AI Score</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${applicantHtml}
                    </tbody>
                </table>
            </div>
        `;
        recruiterJobList.appendChild(card);
    });

     // Add event listeners ONLY for "Status" buttons
    document.querySelectorAll('.status-button').forEach(button => {
        button.addEventListener('click', handleStatusUpdate); 
    });
}

// --- ADMIN: Render Applicants ---
function renderAdminApplicants(allUsers, allApplications) {
    adminApplicantsList.innerHTML = ''; // Clear
    const students = Object.values(allUsers).filter(u => u.role === 'student');
    const studentUids = Object.keys(allUsers).filter(uid => allUsers[uid].role === 'student');

    if (students.length === 0) {
         adminApplicantsList.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No students have registered.</td></tr>';
         return;
    }

    students.forEach((student, index) => {
        const studentUid = studentUids[index];
        const appCount = Object.values(allApplications).filter(app => app.studentId === studentUid).length;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${student.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${student.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${appCount}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">Student</span>
            </td>
        `;
        adminApplicantsList.appendChild(row);
    });
}

// --- ADMIN: Render Opportunities ---
function renderAdminOpportunities(allJobs, allApplications, allUsers) {
    adminOpportunitiesList.innerHTML = ''; // Clear
    const jobs = Object.entries(allJobs);

    if (jobs.length === 0) {
         adminOpportunitiesList.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No jobs have been posted.</td></tr>';
         return;
    }

    jobs.forEach(([jobId, job]) => {
         const appCount = Object.values(allApplications).filter(app => app.jobId === jobId).length;
         const recruiter = allUsers[job.recruiterId];

         const row = document.createElement('tr');
         row.innerHTML = `
             <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${job.title}</td>
             <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${recruiter?.company || 'Unknown'}</td>
             <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${appCount}</td>
             <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${recruiter?.name || 'Unknown'}</td>
         `;
         adminOpportunitiesList.appendChild(row);
    });
}

// --- ADMIN: Render Recruiters ---
function renderAdminRecruiters(allUsers, allJobs) {
    adminRecruitersList.innerHTML = ''; // Clear
    const recruiters = Object.entries(allUsers).filter(([uid, u]) => u.role === 'recruiter');

    if (recruiters.length === 0) {
         adminRecruitersList.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No recruiters have registered.</td></tr>';
         return;
    }

    recruiters.forEach(([uid, recruiter]) => {
         const jobCount = Object.values(allJobs).filter(job => job.recruiterId === uid).length;

         const row = document.createElement('tr');
         row.innerHTML = `
             <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${recruiter.name}</td>
             <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${recruiter.company}</td>
             <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${recruiter.email}</td>
             <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${jobCount}</td>
         `;
         adminRecruitersList.appendChild(row);
    });
}

// -------------------------------------------------
// 🔹 STUDENT ACTIONS
// -------------------------------------------------

async function handleJobApply(e) {
     const button = e.currentTarget;
     const user = auth.currentUser;
     if (!user) return showNotification("Please log in to apply", true);

     // Disable button immediately
     button.disabled = true;
     button.textContent = 'Applying...';
     button.classList.add('bg-gray-400');
     button.classList.remove('bg-indigo-600', 'hover:bg-indigo-500');

     const { jobId, jobTitle, companyName, recruiterId } = button.dataset;
     
     try {
        // 1. Get student's resume and name (for denormalization)
        const studentDocRef = doc(db, usersPath, user.uid);
        const studentSnap = await getDoc(studentDocRef);
        if (!studentSnap.exists()) {
             throw new Error("Could not find your user profile.");
        }
        const studentData = studentSnap.data();
        const resumeText = studentData.resumeText;
        const studentName = studentData.name;
        const studentEmail = studentData.email;
        const resumeUrl = studentData.resumeUrl || null; // NEW: Get the resume URL

        if (!resumeText || resumeText.trim() === "") {
            throw new Error("Please add your resume text to your profile before applying.");
        }

        // 2. Get Job Description
        const jobDocRef = doc(db, jobsPath, jobId);
        const jobSnap = await getDoc(jobDocRef);
        if (!jobSnap.exists()) {
             throw new Error("Job description not found. Cannot apply.");
        }
        const jobDescription = jobSnap.data().description;

        // 3. Call AI
        showNotification("Scanning your profile against the job...", false);
        const aiResponse = await callGeminiAPI(resumeText, jobDescription);

        // 4. Create the application with the AI score
        const appCollectionRef = collection(db, appsPath);
        await addDoc(appCollectionRef, {
            studentId: user.uid,
            studentName: studentName, // DENORMALIZED
            studentEmail: studentEmail, // DENORMALIZED
            resumeUrl: resumeUrl, // NEW: Add the resume URL to the application
            jobId,
            jobTitle,
            companyName,
            recruiterId,
            status: "scanned", // Set status to 'scanned' immediately
            aiScore: aiResponse.matchPercentage,
            aiSummary: aiResponse.summary,
            createdAt: serverTimestamp()
        });
        
        showNotification(`✅ Applied! AI Score: ${aiResponse.matchPercentage}%`, false);
        // The onSnapshot listener will automatically re-render the button as "Applied"

     } catch (err) {
         showNotification(err.message, true);
         // Re-enable button if apply fails
         button.disabled = false;
         button.textContent = 'Apply Now';
         button.classList.remove('bg-gray-400');
         button.classList.add('bg-indigo-600', 'hover:bg-indigo-500');
     }
}

async function handleSaveProfile(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return showNotification("Login required", true);
    
    saveProfileButton.disabled = true;
    saveProfileButton.textContent = 'Saving...';

    const resumeText = studentResumeText.value;
    const file = studentResumeFile.files[0];
    const userDocRef = doc(db, usersPath, user.uid);

    try {
        let dataToSave = {
            resumeText: resumeText
        };

        // Check if a new file was uploaded
        if (file) {
            // Show progress bar
            uploadProgressBar.style.width = '0%';
            uploadProgressContainer.classList.remove('hidden');

            const filePath = `resumes/${user.uid}/${file.name}`;
            const fileRef = storageRef(storage, filePath);
            
            // NEW: Use uploadBytesResumable
            const uploadTask = uploadBytesResumable(fileRef, file);

            // Listen to upload progress
            // No longer using onStorageSnapshot, using the task's .on() method
            uploadTask.on('state_changed', 
                (snapshot) => {
                    // Update progress bar
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    uploadProgressBar.style.width = progress + '%';
                    saveProfileButton.textContent = `Uploading... ${Math.round(progress)}%`;
                }, 
                (error) => {
                    // Handle unsuccessful uploads
                    console.error("Upload failed:", error);
                    showNotification("File upload failed: " + error.message, true);
                    // Reset button and hide progress bar
                    saveProfileButton.disabled = false;
                    saveProfileButton.textContent = 'Save Profile';
                    uploadProgressContainer.classList.add('hidden');
                }, 
                async () => {
                    // Handle successful uploads on complete
                    saveProfileButton.textContent = 'Processing...';
                    showNotification("File uploaded! Saving profile...", false);
                    
                    try {
                        // Get the public download URL
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        
                        // Add file info to the data we're saving
                        dataToSave.resumeUrl = downloadURL;
                        dataToSave.resumeFileName = file.name;

                        // Now update Firestore
                        await updateDoc(userDocRef, dataToSave);
                        
                        showNotification("Profile saved successfully!", false);
                        studentResumeFile.value = ''; // Clear file input
                    
                    } catch (saveError) {
                        showNotification("Failed to save profile: " + saveError.message, true);
                    
                    } finally {
                        // Reset button and hide progress bar
                        saveProfileButton.disabled = false;
                        saveProfileButton.textContent = 'Save Profile';
                        uploadProgressContainer.classList.add('hidden');
                    }
                }
            );

        } else {
            // No file uploaded, just save the text
            await updateDoc(userDocRef, dataToSave);
            showNotification("Profile text saved successfully!", false);
            saveProfileButton.disabled = false;
            saveProfileButton.textContent = 'Save Profile';
        }
        
    } catch (err) {
        // This will catch errors *before* the upload starts
        showNotification(err.message, true);
        saveProfileButton.disabled = false;
        saveProfileButton.textContent = 'Save Profile';
    }
}

// -------------------------------------------------
// 🔹 RECRUITER ACTIONS
// -------------------------------------------------
async function handlePostJob(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return showNotification("Please login first", true);

    // Get user's company name
    const userDocRef = doc(db, usersPath, user.uid);
    const userSnap = await getDoc(userDocRef);
    const companyName = userSnap.data()?.company || 'A Company';

    const title = document.getElementById("job-title").value;
    const specs = document.getElementById("job-specs").value;
    const openings = document.getElementById("num-openings").value;

    try {
        const jobCollectionRef = collection(db, jobsPath);
        await addDoc(jobCollectionRef, {
            recruiterId: user.uid,
            companyName: companyName,
            title,
            description: specs,
            numOpenings: openings,
            createdAt: serverTimestamp()
        });
        showNotification("Job posted successfully!", false);
        e.target.reset(); // Reset the form
        showRecruiterTab('recruiter-applicants'); // Switch to applicants tab
    } catch (err) {
        showNotification("Error posting job: " + err.message, true);
    }
}

async function handleStatusUpdate(e) {
    const button = e.currentTarget;
    const { appId, status } = button.dataset;
    const appDocRef = doc(db, appsPath, appId);
    try {
        await updateDoc(appDocRef, { status: status });
        showNotification(`Application status updated to ${status}.`, false);
        // Realtime listener handles UI update
    } catch(err) {
         showNotification(`Error updating status: ${err.message}`, true);
    }
}

// -------------------------------------------------
// 🔹 GEMINI AI FUNCTION
// -------------------------------------------------
async function callGeminiAPI(resumeText, jobDescription) {
    // This API key was present in the original file and is retained.
    // NOTE: In a real app, this key should be on a secure backend, not in client-side JS.
    // For this environment, we leave it as is.
    const apiKey = "AIzaSyDqTReOO95N85TTh8JwBqjDJ8xbGM45Fbs"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const systemPrompt = `
        You are an expert HR recruiter and talent analyst. You are reviewing a candidate's resume against a job description.
        Provide your analysis ONLY in a valid JSON object format.
        The JSON object must have exactly two keys:
        1. "matchPercentage": An integer (0-100) representing how well the resume matches the job description.
        2. "summary": A concise, one-sentence justification for your score.
    `;

    const userQuery = `
        Job Description:
        ---
        ${jobDescription}
        ---

        Candidate's Resume Text:
        ---
        ${resumeText}
        ---
    `;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
        }
    };
    
    try {
        // Add exponential backoff for retries
        let response;
        let retries = 0;
        const maxRetries = 3;
        while (retries < maxRetries) {
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                break; // Success
            }
            
            if (response.status === 429 || response.status >= 500) {
                // Throttling or server error, wait and retry
                retries++;
                const delay = Math.pow(2, retries) * 1000;
                console.warn(`AI API failed with status ${response.status}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Other client error (e.g., 400), don't retry
                throw new Error(`AI API request failed with status ${response.status}`);
            }
        }
        
        if (!response.ok) {
             throw new Error(`AI API request failed after ${maxRetries} retries.`);
        }

        const result = await response.json();
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!jsonText) {
            throw new Error("Invalid AI response. No text part found.");
        }

        // Parse the JSON string from the AI's response
        const parsedJson = JSON.parse(jsonText);
        
        if (typeof parsedJson.matchPercentage !== 'number' || typeof parsedJson.summary !== 'string') {
            throw new Error("Invalid AI JSON response format.");
        }

        return parsedJson; // Returns { matchPercentage: 85, summary: "..." }

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to get AI analysis.");
    }
}


// -------------------------------------------------
// 🔹 DOMCONTENTLOADED (Attaches initial listeners)
// -------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded. Attaching listeners.");
    
    // Register Forms
    document.getElementById('student-register-form')?.addEventListener('submit', handleStudentRegister);
    document.getElementById('recruiter-register-form')?.addEventListener('submit', handleRecruiterRegister);
    
    // Login Forms
    document.getElementById('student-login-form')?.addEventListener('submit', handleStudentLogin);
    document.getElementById('recruiter-login-form')?.addEventListener('submit', handleRecruiterLogin);
    document.getElementById('admin-login-form')?.addEventListener('submit', handleAdminLogin);

    // Dashboard Forms
    document.getElementById('student-profile-form')?.addEventListener('submit', handleSaveProfile);
    document.getElementById('recruiter-post-form')?.addEventListener('submit', handlePostJob);
});