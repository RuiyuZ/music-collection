import { getDatabase, ref, push, set, get, remove, update, child } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
import { app } from './firebase.js';

const database = getDatabase(app);
let musicCollection = [];

export async function fetchMusicCollection() {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `musicCollection`));

    if (snapshot.exists()) {
        musicCollection = Object.entries(snapshot.val()).map(([key, value]) => ({ id: key, ...value }));
        applyFilters();
        更新歌手筛选();
    }
}

async function 添加音乐() {
    const musicName = document.getElementById('musicName').value;
    const singerName = document.getElementById('singerName').value;
    const language = document.getElementById('languageSelect').value;
    const genre = document.getElementById('genreSelect').value;

    if (musicName && singerName && language && genre) {
        const newMusicRef = push(ref(database, 'musicCollection'));
        await set(newMusicRef, { musicName, singerName, language, genre });
        musicCollection.push({ id: newMusicRef.key, musicName, singerName, language, genre });
        document.getElementById('musicName').value = '';
        document.getElementById('singerName').value = '';
        document.getElementById('languageSelect').value = '';
        document.getElementById('genreSelect').value = '';
        applyFilters();
        更新歌手筛选();
    }
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

    更新音乐列表(filteredMusic);
}

function 更新音乐列表(filteredCollection) {
    const musicList = document.getElementById('musicList');
    const songCountElement = document.getElementById('songCount');
    musicList.innerHTML = '';

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
        row.querySelector('button').addEventListener('click', () => 删除音乐(music.id));

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

async function 更新语言(index, newLanguage) {
    const music = musicCollection[index];
    const musicRef = ref(database, `musicCollection/${music.id}`);
    
    try {
        await update(musicRef, { language: newLanguage });
        musicCollection[index].language = newLanguage;
        applyFilters();
    } catch (error) {
        console.error("Error updating language:", error);
    }
}

async function 更新风格(index, newGenre) {
    const music = musicCollection[index];
    const musicRef = ref(database, `musicCollection/${music.id}`);
    
    try {
        await update(musicRef, { genre: newGenre });
        musicCollection[index].genre = newGenre;
        applyFilters();
    } catch (error) {
        console.error("Error updating genre:", error);
    }
}

function 更新歌手筛选() {
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

async function 删除音乐(musicId) {
    await remove(ref(database, `musicCollection/${musicId}`));
    musicCollection = musicCollection.filter(music => music.id !== musicId);
    applyFilters();
    更新歌手筛选();
}

document.addEventListener('DOMContentLoaded', () => {
    fetchMusicCollection();
    $('#filterSelect').select2({
        placeholder: '按歌手筛选',
        allowClear: true
    });
});

document.getElementById('addMusicButton').addEventListener('click', 添加音乐);
document.getElementById('searchInput').addEventListener('input', applyFilters);
$('#filterSelect').on('change', applyFilters);
document.getElementById('languageFilterSelect').addEventListener('change', applyFilters);
document.getElementById('genreFilterSelect').addEventListener('change', applyFilters);
