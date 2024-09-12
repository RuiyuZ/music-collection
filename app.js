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
    const genre = document.getElementById('genreSelect').value;  // Capture the selected genre (风格)

    if (musicName && singerName && language && genre) {
        const newMusicRef = push(ref(database, 'musicCollection'));
        await set(newMusicRef, { musicName, singerName, language, genre });

        musicCollection.push({ id: newMusicRef.key, musicName, singerName, language, genre });

        // Reset input fields
        document.getElementById('musicName').value = '';
        document.getElementById('singerName').value = '';
        document.getElementById('languageSelect').value = '';
        document.getElementById('genreSelect').value = '';

        更新音乐列表();
        更新歌手筛选();
    } else {
        console.log("All fields are required");
    }
}

// Update music list in the UI
function 更新音乐列表(filteredCollection = musicCollection) {
    const musicList = document.getElementById('musicList');
    const songCountElement = document.getElementById('songCount');  // Get the song count element
    musicList.innerHTML = '';

    // Update the total song count
    const totalSongs = filteredCollection.length;
    songCountElement.textContent = `总共有 ${totalSongs} 首歌曲`;

    filteredCollection.forEach((music, index) => {
        const language = music.language ? music.language : "请选择";
        const genre = music.genre ? music.genre : "请选择";

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
            <td>
                <select id="genreSelect-${index}" data-index="${index}">
                    <option value="">请选择</option>
                    <option value="EMO" ${genre === 'EMO' ? 'selected' : ''}>EMO</option>
                    <option value="流行" ${genre === '流行' ? 'selected' : ''}>流行</option>
                    <option value="搞怪" ${genre === '搞怪' ? 'selected' : ''}>搞怪</option>
                    <option value="动漫" ${genre === '动漫' ? 'selected' : ''}>动漫</option>
                    <option value="戏曲" ${genre === '戏曲' ? 'selected' : ''}>戏曲</option>
                    <option value="抒情" ${genre === '抒情' ? 'selected' : ''}>抒情</option>
                    <option value="说唱" ${genre === '说唱' ? 'selected' : ''}>说唱</option>
                    <option value="古风" ${genre === '古风' ? 'selected' : ''}>古风</option>
                    <option value="剑网三" ${genre === '剑网三' ? 'selected' : ''}>剑网三</option>
                </select>
            </td>
            <td><button>删除</button></td>
        `;

        row.querySelector('button').addEventListener('click', () => 删除音乐(index));

        row.querySelector(`#languageSelect-${index}`).addEventListener('change', (event) => {
            const selectedLanguage = event.target.value;
            更新语言(index, selectedLanguage);
        });

        row.querySelector(`#genreSelect-${index}`).addEventListener('change', (event) => {
            const selectedGenre = event.target.value;
            更新风格(index, selectedGenre);
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

// Update the genre (风格) of a song in Firebase
async function 更新风格(index, newGenre) {
    const music = musicCollection[index];
    const musicRef = ref(database, `musicCollection/${music.id}`);
    
    try {
        await update(musicRef, { genre: newGenre });
        musicCollection[index].genre = newGenre;
    } catch (error) {
        console.error("Error updating genre:", error);
    }
}

// Combined filter function for both language and genre
function 过滤音乐() {
    const selectedLanguage = document.getElementById('languageFilterSelect').value;
    const selectedGenre = document.getElementById('genreFilterSelect').value;

    let filteredMusic = musicCollection;

    // Apply language filter if a language is selected
    if (selectedLanguage) {
        filteredMusic = filteredMusic.filter(music => music.language === selectedLanguage);
    }

    // Apply genre filter if a genre is selected
    if (selectedGenre) {
        filteredMusic = filteredMusic.filter(music => music.genre === selectedGenre);
    }

    // Update the music list with the filtered results
    更新音乐列表(filteredMusic);
}

// Update singer filter dropdown with Select2
function 更新歌手筛选() {
    const filterSelect = $('#filterSelect');
    filterSelect.empty();  // Clear the existing options

    filterSelect.append(new Option('按歌手筛选', ''));  // Add default "select all" option

    const singers = new Set(musicCollection.map(music => music.singerName));  // Get unique singers
    singers.forEach(singer => {
        const option = new Option(singer, singer);
        filterSelect.append(option);
    });

    // Refresh the Select2 dropdown
    filterSelect.trigger('change');
}

// Delete music from Firebase
async function 删除音乐(index) {
    const music = musicCollection[index];
    await remove(ref(database, `musicCollection/${music.id}`));
    musicCollection.splice(index, 1);
    更新音乐列表();
    更新歌手筛选();
}

// Fetch the music collection when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchMusicCollection();

    // Initialize Select2 for the singer filter dropdown
    $('#filterSelect').select2({
        placeholder: '按歌手筛选',
        allowClear: true
    });
});

// Attach event listener for "Add Music" button
document.getElementById('addMusicButton').addEventListener('click', 添加音乐);

// Attach event listener for "Search by Name"
document.getElementById('searchInput').addEventListener('input', 搜索音乐);

// Attach event listener for "Filter by Singer" dropdown (with Select2)
$('#filterSelect').on('change', 过滤歌手);

// Attach event listener for "Filter by Language" dropdown
document.getElementById('languageFilterSelect').addEventListener('change', 过滤音乐);

// Attach event listener for "Filter by Genre" dropdown
document.getElementById('genreFilterSelect').addEventListener('change', 过滤音乐);