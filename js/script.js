let allPlayers = [];
let sortBy = 'number';
let isAscending = true;

document.addEventListener('DOMContentLoaded', function() {
    // 设置事件监听器
    document.getElementById('sortBy').addEventListener('change', function(e) {
        sortBy = e.target.value;
        renderPlayers(sortPlayers(filterPlayers(document.getElementById('searchInput').value)));
    });

    document.getElementById('sortDirection').addEventListener('click', function() {
        isAscending = !isAscending;
        this.textContent = isAscending ? '↑' : '↓';
        renderPlayers(sortPlayers(filterPlayers(document.getElementById('searchInput').value)));
    });

    document.getElementById('searchInput').addEventListener('input', function(e) {
        renderPlayers(sortPlayers(filterPlayers(e.target.value)));
    });

    // 初始化加载数据
    fetchPlayers();
});

function fetchPlayers() {
    const loadingElement = document.querySelector('.loading');

    fetch('data/data.json')
	.then(response => response.json())
        .then(data => {
			allPlayers = data;
			if (loadingElement) loadingElement.remove();
			renderPlayers(data);
        })
        .catch(error => {
            showError('请求失败: ' + error.message);
        });
}

function renderPlayers(players) {
    const container = document.getElementById('playerList');
    container.innerHTML = '';

    players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card';

        // 计算总能力值
        const total = (player.offense || 0) +
                      (player.defense || 0) +
                      (player.stamina || 0) +
                      (player.awareness || 0) +
                      (player.toughness || 0) +
                      (player.consistency || 0);

        let tier = 'green';
        if (total >= 580) tier = 'orange';
        else if (total >= 500) tier = 'purple';
        else if (total >= 400) tier = 'blue';

        card.dataset.tier = tier; // 添加等级属性

        const chartId = `chart-${player.name.replace(/\s+/g, '-')}-${player.number}`;

        card.innerHTML = `
            <div class="player-header">
                <div class="player-info">
                    <h3>${player.name}<span> ${player.number}</span></h3>
                    <p><strong>位置:</strong> ${player.position}</p>
                    <p><strong>身高:</strong> ${player.height !== null ? player.height + 'cm' : ''}</p>
                    <p><strong>体重:</strong> ${player.weight !== null ? player.weight + 'kg' : ''}</p>
                </div>
                <div class="player-photo">
                    <img src="photo/${player.photo}"></img>
                </div>
            </div>
            <div class="radar-chart-container">
                <canvas class="radar-chart" id="${chartId}"></canvas>
            </div>
        `;

        container.appendChild(card);

        setTimeout(() => {
            renderRadarChart(
                chartId,
                ['进攻', '防守', '体能', '意识', '韧性', '稳定性'],
                [
                    player.offense || 0,
                    player.defense || 0,
                    player.stamina || 0,
                    player.awareness || 0,
                    player.toughness || 0,
                    player.consistency || 0
                ],
                tier
            );
        }, 0);
    });
}

function filterPlayers(keyword) {
    const filtered = allPlayers.filter(player =>
        player.name.toLowerCase().includes(keyword.toLowerCase())
    );
    return sortPlayers(filtered);
}

function renderRadarChart(canvasId, labels, data, tier) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // 根据球员等级设置颜色
    const tierColors = {
        'orange': '#ff6b35',
        'purple': '#9d4edd',
        'blue': '#4361ee',
        'green': '#2a9d8f'
    };

    const primaryColor = tierColors[tier] || '#9b59b6';
    const backgroundColor = `${primaryColor}33`; // 添加透明度

    new Chart(ctx.getContext('2d'), {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '能力值',
                data: data,
                backgroundColor: backgroundColor,
                borderColor: primaryColor,
                borderWidth: 2,
                pointBackgroundColor: primaryColor,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        stepSize: 20,
                        display: false
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    pointLabels: {
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

function getPositionColor(position) {
    const positionColors = {
        '控卫': '#e74c3c',
        '分卫': '#3498db',
        '小前': '#2ecc71',
        '大前': '#f39c12',
        '中锋': '#9b59b6'
    };

    return positionColors[position] || positionColors['中锋'];
}

function showError(message) {
    const container = document.getElementById('playerList');
    if (container) {
        container.innerHTML = `
            <div class="error-message" style="
                grid-column: 1/-1;
                text-align: center;
                padding: 30px;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                color: #e74c3c;
            ">
                <h3>数据加载失败</h3>
                <p>${message}</p>
                <button onclick="window.location.reload()" style="
                    margin-top: 15px;
                    padding: 8px 20px;
                    background: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">重新加载</button>
            </div>
        `;
    }
}

// 新增排序函数
function sortPlayers(players) {
    return [...players].sort((a, b) => {
        let valueA, valueB;
        let compareResult;

        switch (sortBy) {
            case 'number':
                valueA = a.number;
                valueB = b.number;
                break;
            case 'total':
                valueA = (a.offense || 0) + (a.defense || 0) +
                        (a.stamina || 0) + (a.awareness || 0) +
                        (a.toughness || 0) + (a.consistency || 0);
                valueB = (b.offense || 0) + (b.defense || 0) +
                        (b.stamina || 0) + (b.awareness || 0) +
                        (b.toughness || 0) + (b.consistency || 0);
                break;
            default:
                // 使用 localeCompare 进行中文拼音排序
                compareResult = a.name.localeCompare(b.name, 'zh-CN');
                // 统一处理排序方向
                return isAscending ? compareResult : -compareResult;
        }

        // 处理数字和总分的排序
        if (typeof valueA === 'number' && typeof valueB === 'number') {
            return isAscending ? valueA - valueB : valueB - valueA;
        }

        // 处理字符串排序（非中文）
        const strA = String(valueA).toLowerCase();
        const strB = String(valueB).toLowerCase();
        if (strA < strB) return isAscending ? -1 : 1;
        if (strA > strB) return isAscending ? 1 : -1;
        return 0;
    });
}
