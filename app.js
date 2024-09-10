let musicCollection = [];
let singers = new Set();

function 添加音乐() {
    const musicName = document.getElementById('musicName').value;
    const singerName = document.getElementById('singerName').value;

    if (musicName && singerName) {
        musicCollection.push({ musicName, singerName });
        singers.add(singerName);

        document.getElementById('musicName').value = '';
        document.getElementById('singerName').value = '';

        更新音乐列表();
        更新歌手筛选();
    }
}

function 更新音乐列表() {
    const musicList = document.getElementById('musicList');
    musicList.innerHTML = '';

    musicCollection.forEach((music, index) => {
        const row = `<tr>
                        <td>${music.musicName}</td>
                        <td>${music.singerName}</td>
                        <td><button onclick="删除音乐(${index})">删除</button></td>
                    </tr>`;
        musicList.innerHTML += row;
    });
}

function 更新歌手筛选() {
    const filterSelect = document.getElementById('filterSelect');
    filterSelect.innerHTML = '<option value="">按歌手筛选</option>';

    singers.forEach(singer => {
        const option = `<option value="${singer}">${singer}</option>`;
        filterSelect.innerHTML += option;
    });
}

function 删除音乐(index) {
    musicCollection.splice(index, 1);
    更新音乐列表();
}

function 搜索音乐() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filteredMusic = musicCollection.filter(music => 
        music.musicName.toLowerCase().includes(searchInput)
    );
    显示过滤后的音乐(filteredMusic);
}

function 过滤歌手() {
    const selectedSinger = document.getElementById('filterSelect').value;
    const filteredMusic = musicCollection.filter(music => 
        music.singerName === selectedSinger || !selectedSinger
    );
    显示过滤后的音乐(filteredMusic);
}

function 显示过滤后的音乐(filteredMusic) {
    const musicList = document.getElementById('musicList');
    musicList.innerHTML = '';

    filteredMusic.forEach((music, index) => {
        const row = `<tr>
                        <td>${music.musicName}</td>
                        <td>${music.singerName}</td>
                        <td><button onclick="删除音乐(${index})">删除</button></td>
                    </tr>`;
        musicList.innerHTML += row;
    });
}
