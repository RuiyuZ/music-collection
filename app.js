import { getDatabase, ref, push, set, get, remove, update, child } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
import { app } from './firebase.js';  // Import the initialized Firebase app

// Initialize Firebase Database
const database = getDatabase(app);

let musicCollection = [];

// Fetch music collection from Firebase
export async function fetchMusicCollection() {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `musicCollection`));

    if (snapshot.exists()) {
        // Populate the music collection array
        musicCollection = Object.entries(snapshot.val()).map(([key, value]) => ({ id: key, ...value }));
        更新音乐列表();  // Update the music list with fetched data
        更新歌手筛选();  // Update singer filter dropdown after fetching data
    } else {
        console.log("No data available");
    }
}

// Add new music and save it to Firebase
async function 添加音乐() {
    const musicName = document.getElementById('musicName').value;
    const singerName = document.getElementById('singerName').value;
    const language = document.getElementById('languageSelect').value;  // Capture the selected language

    if (musicName && singerName && language) {
        const newMusicRef = push(ref(database, 'musicCollection'));
        await set(newMusicRef, { musicName, singerName, language });

        // Add new song to the music collection array
        musicCollection.push({ id: newMusicRef.key, musicName, singerName, language });

        // Reset input fields
        document.getElementById('musicName').value = '';
        document.getElementById('singerName').value = '';
        document.getElementById('languageSelect').value = '';

        更新音乐列表();  // Update the music list after adding the new song
        更新歌手筛选();  // Update the singer filter dropdown
    } else {
        console.log("All fields are required");
    }
}

// Update music list in the UI
function 更新音乐列表(filteredCollection = musicCollection) {
    const musicList = document.getElementById('musicList');
    musicList.innerHTML = '';

    filteredCollection.forEach((music, index) => {
        const language = music.language ? music.language : "请选择";  // Default to "请选择" if language is missing

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${music.musicName}</td>
            <td>${music.singerName}</td>
            <td>
                <select id="languageSelect-${index}" data-index="${index}">
                    <option value="">请选择</option>
                    <option value="国语" ${language === '国语' ? 'selected' : ''}>国语</option>
                    <option value="粤语" ${language === '粤语' ? 'selected' : ''}>粤语</option>
                    <option value="英语" ${language === '英语' ? 'selected' : ''}>英语</option>
                    <option value="日语" ${language === '日语' ? 'selected' : ''}>日语</option>
                    <option value="韩语" ${language === '韩语' ? 'selected' : ''}>韩语</option>
                    <option value="法语" ${language === '法语' ? 'selected' : ''}>法语</option>
                    <option value="西班牙语" ${language === '西班牙语' ? 'selected' : ''}>西班牙语</option>
                    <option value="其他" ${language === '其他' ? 'selected' : ''}>其他</option>
                </select>
            </td>
            <td><button>删除</button></td>
        `;

        // Attach the delete event listener
        row.querySelector('button').addEventListener('click', () => 删除音乐(index));

        // Attach change event listener for language dropdown
        row.querySelector(`#languageSelect-${index}`).addEventListener('change', (event) => {
            const selectedLanguage = event.target.value;
            更新语言(index, selectedLanguage);
        });

        musicList.appendChild(row);
    });
}

// Update the language of a song in Firebase
async function 更新语言(index, newLanguage) {
    const music = musicCollection[index];
    const musicRef = ref(database, `musicCollection/${music.id}`);
    
    try {
        await update(musicRef, { language: newLanguage });
        musicCollection[index].language = newLanguage;
        console.log(`Language for "${music.musicName}" updated to: ${newLanguage}`);
    } catch (error) {
        console.error("Error updating language:", error);
    }
}

// Update singer filter dropdown
function 更新歌手筛选() {
    const filterSelect = document.getElementById('filterSelect');
    filterSelect.innerHTML = '<option value="">按歌手筛选</option>';  // Add default "select all" option

    const singers = new Set(musicCollection.map(music => music.singerName));  // Get unique singers
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
    const selectedSinger = document.getElementById('filterSelect').value;  // Get the selected singer
    if (!selectedSinger) {
        更新音乐列表();  // If no singer is selected, show all songs
        return;
    }

    const filteredMusic = musicCollection.filter(music => 
        music.singerName === selectedSinger  // Match the selected singer
    );

    更新音乐列表(filteredMusic);  // Update the music list with the filtered results
}

// Filter music by language (Triggered by changing the dropdown value)
function 过滤语言() {
    const selectedLanguage = document.getElementById('languageFilterSelect').value;

    const filteredMusic = musicCollection.filter(music => 
        music.language === selectedLanguage || !selectedLanguage
    );

    更新音乐列表(filteredMusic);
}

// Fetch the music collection when the page loads
document.addEventListener('DOMContentLoaded', fetchMusicCollection);

// Attach event listener for "Add Music" button
document.getElementById('addMusicButton').addEventListener('click', 添加音乐);

// Attach event listener for "Search by Name"
document.getElementById('searchInput').addEventListener('input', 搜索音乐);

// Attach event listener for "Filter by Singer" dropdown
document.getElementById('filterSelect').addEventListener('change', 过滤歌手);

// Attach event listener for "Filter by Language" dropdown (directly triggered by selection)
document.getElementById('languageFilterSelect').addEventListener('change', 过滤语言);