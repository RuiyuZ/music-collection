import { getDatabase, ref, push, set, get, remove, child } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
import { app } from './firebase.js';  // Import the initialized Firebase app

// Initialize Firebase Database
const database = getDatabase(app);

let musicCollection = [];

// Fetch music collection from Firebase
export async function fetchMusicCollection() {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `musicCollection`));

    if (snapshot.exists()) {
        musicCollection = Object.entries(snapshot.val()).map(([key, value]) => ({ id: key, ...value }));
        更新音乐列表();
        更新歌手筛选();
    } else {
        console.log("No data available");
    }
}

// Add new music and save it to Firebase
async function 添加音乐() {
    const musicName = document.getElementById('musicName').value;
    const singerName = document.getElementById('singerName').value;

    if (musicName && singerName) {
        const newMusicRef = push(ref(database, 'musicCollection'));
        await set(newMusicRef, { musicName, singerName });

        musicCollection.push({ id: newMusicRef.key, musicName, singerName });

        document.getElementById('musicName').value = '';
        document.getElementById('singerName').value = '';

        更新音乐列表();
        更新歌手筛选();
    }
}

// Update music list in UI
function 更新音乐列表(filteredCollection = musicCollection) {
    const musicList = document.getElementById('musicList');
    musicList.innerHTML = '';

    filteredCollection.forEach((music, index) => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${music.musicName}</td>
            <td>${music.singerName}</td>
            <td><button>删除</button></td>
        `;

        // Attach the delete event listener
        row.querySelector('button').addEventListener('click', () => 删除音乐(index));

        musicList.appendChild(row);
    });
}

// Update singer filter dropdown
function 更新歌手筛选() {
    const filterSelect = document.getElementById('filterSelect');
    filterSelect.innerHTML = '<option value="">按歌手筛选</option>';

    const singers = new Set(musicCollection.map(music => music.singerName));
    singers.forEach(singer => {
        const option = `<option value="${singer}">${singer}</option>`;
        filterSelect.innerHTML += option;
    });
}

// Delete music from Firebase
async function 删除音乐(index) {
    const music = musicCollection[index];
    await remove(ref(database, `musicCollection/${music.id}`));
    musicCollection.splice(index, 1);
    更新音乐列表();
    更新歌手筛选();
}

// Search music by name
function 搜索音乐() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filteredMusic = musicCollection.filter(music => 
        music.musicName.toLowerCase().includes(searchInput)
    );
    更新音乐列表(filteredMusic);
}

// Filter music by singer
function 过滤歌手() {
    const selectedSinger = document.getElementById('filterSelect').value;
    const filteredMusic = musicCollection.filter(music => 
        music.singerName === selectedSinger || !selectedSinger
    );
    更新音乐列表(filteredMusic);
}

// Fetch the music collection when the page loads
document.addEventListener('DOMContentLoaded', fetchMusicCollection);

// Attach event listener for "Add Music" button
document.getElementById('addMusicButton').addEventListener('click', 添加音乐);

// Attach event listener for "Search by Name"
document.getElementById('searchInput').addEventListener('input', 搜索音乐);

// Attach event listener for "Filter by Singer"
document.getElementById('filterSelect').addEventListener('change', 过滤歌手);
