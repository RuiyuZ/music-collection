import { getDatabase, ref, push, set, get, remove, update, child } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const database = getDatabase();
let musicCollection = [];
let isLoggedIn = false;
let authorizedUID = 'GHYgtYCyNbW3LTpvJPksN3NsITg1';  // Replace with the actual UID of the authorized user

// Fetch Music Collection
export async function fetchMusicCollection() {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `musicCollection`));

    if (snapshot.exists()) {
        musicCollection = Object.entries(snapshot.val()).map(([key, value]) => ({ id: key, ...value }));
        applyFilters();
        updateSingerFilter();
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

function updateMusicList(filteredCollection) {
    const musicList = document.getElementById('musicList');
    const songCountElement = document.getElementById('songCount');
    musicList.innerHTML = '';

    const totalSongs = filteredCollection.length;
    songCountElement.textContent = `总共有 ${totalSongs} 首歌曲`;

    filteredCollection.forEach((music, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${music.musicName}</td>
            <td>${music.singerName}</td>
            <td>${music.language}</td>
            <td>${music.genre}</td>
            <td>
                ${isLoggedIn && auth.currentUser.uid === authorizedUID ? `<button onclick="deleteMusic('${music.id}')">删除</button>` : ''}
            </td>
        `;
        musicList.appendChild(row);
    });
}

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

// Authentication Logic
document.getElementById('loginButton').addEventListener('click', () => {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    signInWithEmailAndPassword(auth, email, password).catch(console.error);
});

document.getElementById('logoutButton').addEventListener('click', () => {
    signOut(auth).catch(console.error);
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        isLoggedIn = true;
        document.getElementById('logoutButton').style.display = 'block';
        document.getElementById('loginButton').style.display = 'none';
        document.getElementById('musicForm').style.display = user.uid === authorizedUID ? 'block' : 'none';
    } else {
        isLoggedIn = false;
        document.getElementById('logoutButton').style.display = 'none';
        document.getElementById('loginButton').style.display = 'block';
        document.getElementById('musicForm').style.display = 'none';
    }
    applyFilters();
});

document.addEventListener('DOMContentLoaded', () => {
    fetchMusicCollection();
    $('#filterSelect').select2({
        placeholder: '按歌手筛选',
        allowClear: true
    });
});

document.getElementById('addMusicButton').addEventListener('click', addMusic);
document.getElementById('searchInput').addEventListener('input', applyFilters);
$('#filterSelect').on('change', applyFilters);
document.getElementById('languageFilterSelect').addEventListener('change', applyFilters);
document.getElementById('genreFilterSelect').addEventListener('change', applyFilters);
