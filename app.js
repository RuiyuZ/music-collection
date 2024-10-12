import { getDatabase, ref, push, set, get, remove, update, child } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const database = getDatabase();
let musicCollection = [];
let isLoggedIn = false;
let authorizedUID = 'GHYgtYCyNbW3LTpvJPksN3NsITg1';  // Replace with the actual UID of the authorized user

// Elements for login modal
const loginModal = document.getElementById('loginModal');
const loginTriggerButton = document.getElementById('loginTriggerButton');
const closeButton = document.querySelector('.close-button');
const errorMessage = document.getElementById('errorMessage');
const loginButton = document.getElementById('loginButton');

// Hide modal by default and show only on button click
loginModal.style.display = 'none';  // Ensure the modal is hidden when the page loads

// Show modal when login button is clicked
loginTriggerButton.addEventListener('click', () => {
    loginModal.style.display = 'flex';  // Show the modal when the login button is clicked
    clearInputs();  // Clear input fields each time the modal opens
    document.getElementById('emailInput').focus();  // Automatically focus on email input
});

// Close modal when 'x' button is clicked
closeButton.addEventListener('click', () => {
    loginModal.style.display = 'none';  // Hide the modal when close button is clicked
});

// Close modal when clicking outside the modal
window.addEventListener('click', (event) => {
    if (event.target === loginModal) {
        loginModal.style.display = 'none';  // Hide the modal when clicking outside
    }
});

// Clear input fields
function clearInputs() {
    document.getElementById('emailInput').value = '';
    document.getElementById('passwordInput').value = '';
    errorMessage.style.display = 'none';  // Hide error message when modal opens
    loginButton.disabled = false;  // Re-enable login button
}

// Authentication Logic for Firebase (handling the login)
function handleLogin() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;

    if (!email || !password) {
        errorMessage.textContent = "Both fields are required.";
        errorMessage.style.display = 'block';
        return;
    }

    // Disable the login button while processing
    loginButton.disabled = true;

    // Use Firebase authentication for login
    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            loginModal.style.display = 'none';  // Close the modal after successful login
            clearInputs();  // Clear input fields after successful login
        })
        .catch((error) => {
            console.error("Login failed: ", error);
            errorMessage.textContent = "Invalid email or password. Please try again.";
            errorMessage.style.display = 'block';  // Show error message on login failure
            loginButton.disabled = false;  // Re-enable login button on error
        });
}

// Attach event listener for button click
loginButton.addEventListener('click', handleLogin);

// Allow form submission with Enter key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && loginModal.style.display === 'flex') {
        handleLogin();
    }
});



document.getElementById('logoutButton').addEventListener('click', () => {
    signOut(auth).then(() => {
        renderTableHeader(); // Re-render the table header to remove the 操作 column after logout
    }).catch(console.error);
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        isLoggedIn = true;
        const emailWithoutDomain = user.email.split('@')[0];
        document.getElementById('userDisplay').textContent = `${emailWithoutDomain} 已登陆`;
        document.getElementById('logoutButton').style.display = 'block';
        document.getElementById('loginTriggerButton').style.display = 'none';
        document.getElementById('musicForm').style.display = user.uid === authorizedUID ? 'block' : 'none';
    } else {
        isLoggedIn = false;
        document.getElementById('userDisplay').textContent = '';
        document.getElementById('logoutButton').style.display = 'none';
        document.getElementById('loginTriggerButton').style.display = 'block';
        document.getElementById('musicForm').style.display = 'none';
    }
    renderTableHeader();  // Re-render the table header based on login state
    fetchMusicCollection();  // Fetch music whether the user is logged in or not
});

// Render the Table Header (conditionally show 操作 column)
function renderTableHeader() {
    const musicTable = document.getElementById('musicTable');
    const thead = musicTable.querySelector('thead');
    thead.innerHTML = `
        <tr>
            <th>音乐名称</th>
            <th>歌手</th>
            <th>语言</th>
            <th>风格</th>
            ${isLoggedIn ? '<th>操作</th>' : ''}
        </tr>
    `;
}

// Fetch Music Collection
export async function fetchMusicCollection() {
    const dbRef = ref(database, 'musicCollection');  // Correct path to musicCollection
    const snapshot = await get(dbRef);

    if (snapshot.exists()) {
        const data = snapshot.val();
        musicCollection = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value
        }));
        applyFilters();
        updateSingerFilter();
    } else {
        console.log("No music data found");
        document.getElementById('musicList').innerHTML = '';  // Clear the list if no data
    }
}

// Add Music (only for authorized users)
async function addMusic() {
    if (!isLoggedIn || auth.currentUser.uid !== authorizedUID) return;

    const musicName = document.getElementById('musicName').value;
    const singerName = document.getElementById('singerName').value;
    const language = document.getElementById('languageSelect').value;
    const genre = document.getElementById('genreSelect').value;

    if (musicName && singerName && language && genre) {
        const newMusicRef = push(ref(database, 'musicCollection'));
        await set(newMusicRef, { musicName, singerName, language, genre });
        musicCollection.push({ id: newMusicRef.key, musicName, singerName, language, genre });
        clearForm();
        applyFilters();
        updateSingerFilter();
    }
}

function clearForm() {
    document.getElementById('musicName').value = '';
    document.getElementById('singerName').value = '';
    document.getElementById('languageSelect').value = '';
    document.getElementById('genreSelect').value = '';
}

// Filter and Update Music List
function applyFilters() {
    const selectedLanguage = document.getElementById('languageFilterSelect').value;
    const selectedGenre = document.getElementById('genreFilterSelect').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const selectedSinger = $('#filterSelect').val();

    let filteredMusic = musicCollection.filter(music => {
        const matchesLanguage = selectedLanguage ? music.language === selectedLanguage : true;
        const matchesGenre = selectedGenre ? music.genre === selectedGenre : true;
        const matchesSearch = searchInput ? music.musicName.toLowerCase().includes(searchInput) : true;
        const matchesSinger = selectedSinger ? music.singerName === selectedSinger : true;
        return matchesLanguage && matchesGenre && matchesSearch && matchesSinger;
    });

    updateMusicList(filteredMusic);
}

// Update Music List in the DOM
function updateMusicList(filteredCollection) {
    const musicList = document.getElementById('musicList');
    const songCountElement = document.getElementById('songCount');
    musicList.innerHTML = '';

    const totalSongs = filteredCollection.length;
    songCountElement.textContent = `总共有 ${totalSongs} 首歌曲`;

    filteredCollection.forEach((music, index) => {
        const row = document.createElement('tr');
        const isEditable = isLoggedIn && auth.currentUser.uid === authorizedUID;

        // For non-logged-in users, show plain text for language and genre
        row.innerHTML = `
            <td>${music.musicName}</td>
            <td>${music.singerName}</td>
            <td>
                ${isEditable ? `
                <select id="languageSelect-${index}" data-index="${index}">
                    <option value="国语" ${music.language === '国语' ? 'selected' : ''}>国语</option>
                    <option value="粤语" ${music.language === '粤语' ? 'selected' : ''}>粤语</option>
                    <option value="英语" ${music.language === '英语' ? 'selected' : ''}>英语</option>
                    <option value="日语" ${music.language === '日语' ? 'selected' : ''}>日语</option>
                    <option value="韩语" ${music.language === '韩语' ? 'selected' : ''}>韩语</option>
                    <option value="法语" ${music.language === '法语' ? 'selected' : ''}>法语</option>
                    <option value="西班牙语" ${music.language === '西班牙语' ? 'selected' : ''}>西班牙语</option>
                    <option value="其他" ${music.language === '其他' ? 'selected' : ''}>其他</option>
                </select>
                ` : music.language || 'N/A'}
            </td>
            <td>
                ${isEditable ? `
                <select id="genreSelect-${index}" data-index="${index}">
                    <option value="EMO" ${music.genre === 'EMO' ? 'selected' : ''}>EMO</option>
                    <option value="流行" ${music.genre === '流行' ? 'selected' : ''}>流行</option>
                    <option value="搞怪" ${music.genre === '搞怪' ? 'selected' : ''}>搞怪</option>
                    <option value="动漫" ${music.genre === '动漫' ? 'selected' : ''}>动漫</option>
                    <option value="戏曲" ${music.genre === '戏曲' ? 'selected' : ''}>戏曲</option>
                    <option value="抒情" ${music.genre === '抒情' ? 'selected' : ''}>抒情</option>
                    <option value="说唱" ${music.genre === '说唱' ? 'selected' : ''}>说唱</option>
                    <option value="古风" ${music.genre === '古风' ? 'selected' : ''}>古风</option>
                    <option value="剑网三" ${music.genre === '剑网三' ? 'selected' : ''}>剑网三</option>
                </select>
                ` : music.genre || 'N/A'}
            </td>
            ${isEditable ? `<td><button class="delete-button">删除</button></td>` : ''}
        `;

        // If the user is logged in and authorized, attach event listeners to update language and genre
        if (isEditable) {
            row.querySelector(`#languageSelect-${index}`).addEventListener('change', (event) => {
                const selectedLanguage = event.target.value;
                updateMusicField(music.id, 'language', selectedLanguage);
            });

            row.querySelector(`#genreSelect-${index}`).addEventListener('change', (event) => {
                const selectedGenre = event.target.value;
                updateMusicField(music.id, 'genre', selectedGenre);
            });

            // Add event listener for the delete button
            const deleteButton = row.querySelector('.delete-button');
            deleteButton.addEventListener('click', () => deleteMusic(music.id));
        }

        musicList.appendChild(row);
    });
}


// Update language or genre in Firebase
async function updateMusicField(musicId, field, value) {
    const musicRef = ref(database, `musicCollection/${musicId}`);
    try {
        await update(musicRef, { [field]: value });
        musicCollection = musicCollection.map(music => music.id === musicId ? { ...music, [field]: value } : music);
        applyFilters();
    } catch (error) {
        console.error(`Error updating ${field}:`, error);
    }
}

// Delete Music (only for authorized users)
async function deleteMusic(musicId) {
    if (!isLoggedIn || auth.currentUser.uid !== authorizedUID) return;
    await remove(ref(database, `musicCollection/${musicId}`));
    musicCollection = musicCollection.filter(music => music.id !== musicId);
    applyFilters();
    updateSingerFilter();
}

function updateSingerFilter() {
    const filterSelect = $('#filterSelect');
    filterSelect.empty();
    filterSelect.append(new Option('按歌手筛选', ''));
    const singers = new Set(musicCollection.map(music => music.singerName));
    singers.forEach(singer => {
        const option = new Option(singer, singer);
        filterSelect.append(option);
    });
    filterSelect.trigger('change');
}

// Event Listeners
document.getElementById('addMusicButton').addEventListener('click', addMusic);
document.getElementById('searchInput').addEventListener('input', applyFilters);
$('#filterSelect').on('change', applyFilters);
document.getElementById('languageFilterSelect').addEventListener('change', applyFilters);
document.getElementById('genreFilterSelect').addEventListener('change', applyFilters);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderTableHeader();  // Initial render of the table header
    fetchMusicCollection();
    $('#filterSelect').select2({
        placeholder: '按歌手筛选',
        allowClear: true
    });
});
