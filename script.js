document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const tabDaily = document.getElementById('tab-daily');
    const tabGroups = document.getElementById('tab-groups');
    const tabStats = document.getElementById('tab-stats');
    const tabDisciplinary = document.getElementById('tab-disciplinary');
    
    const contentDaily = document.getElementById('content-daily');
    const contentGroups = document.getElementById('content-groups');
    const contentStats = document.getElementById('content-stats');
    const contentDisciplinary = document.getElementById('content-disciplinary');
    let contentAwards = document.getElementById('content-awards');

    if (!contentDaily || !contentGroups || !tabDaily || !tabGroups || !searchInput) {
        console.error('Required UI elements are missing.');
        return;
    }

    // Initialize UI
    document.getElementById('main-title').textContent = tournamentData.title;
    document.getElementById('main-subtitle').textContent = tournamentData.subtitle;
    document.getElementById('group-count').textContent = tournamentData.groupCount || "12";

    // Helper to switch tabs
    function switchTab(activeTab, activeContent) {
        [tabDaily, tabGroups, tabStats, tabDisciplinary].forEach(tab => {
            if (tab) {
                tab.classList.remove('tab-active');
                tab.classList.add('text-slate-500');
            }
        });
        [contentDaily, contentGroups, contentStats, contentDisciplinary].forEach(content => {
            if (content) content.classList.add('hidden');
        });

        activeTab.classList.add('tab-active');
        activeTab.classList.remove('text-slate-500');
        activeContent.classList.remove('hidden');
    }

    // Render Daily Schedule
    function renderDaily(filter = '') {
        contentDaily.innerHTML = '';
        const groupedByDate = {};

        (tournamentData.matches || []).forEach(match => {
            const matchText = `${match.team1} ${match.team2} ${match.date} ${match.group}`.toLowerCase();
            if (filter && !matchText.includes(filter.toLowerCase())) return;

            if (!groupedByDate[match.date]) groupedByDate[match.date] = [];
            groupedByDate[match.date].push(match);
        });

        const getScoreState = (score1, score2) => {
            if (score1 === "" || score2 === "") return { team1: 'bg-slate-100 text-slate-600', team2: 'bg-slate-100 text-slate-600' };
            const s1 = parseInt(score1);
            const s2 = parseInt(score2);
            if (s1 > s2) return { team1: 'bg-emerald-100 text-emerald-700 border border-emerald-200', team2: 'bg-red-100 text-red-700 border border-red-200' };
            if (s1 < s2) return { team1: 'bg-red-100 text-red-700 border border-red-200', team2: 'bg-emerald-100 text-emerald-700 border border-emerald-200' };
            return { team1: 'bg-blue-100 text-blue-700 border border-blue-200', team2: 'bg-blue-100 text-blue-700 border border-blue-200' };
        };

        Object.keys(groupedByDate).forEach(date => {
            const dateSection = document.createElement('div');
            dateSection.className = 'bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8';

            const dateHeader = document.createElement('div');
            dateHeader.className = 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-3 font-bold text-base flex items-center gap-3';
            dateHeader.innerHTML = `<i class="far fa-calendar-check"></i> ${date}`;
            dateSection.appendChild(dateHeader);

            const matchesList = document.createElement('div');
            matchesList.className = 'divide-y-2 divide-slate-100';

            groupedByDate[date].forEach(match => {
                const matchRow = document.createElement('div');
                matchRow.className = 'px-4 py-3 hover:bg-slate-50 transition-colors text-sm';

                const scoreState = getScoreState(match.score1, match.score2);
                const team1Scorers = [...new Set(match.team1Scorers || [])];
                const team2Scorers = [...new Set(match.team2Scorers || [])];
                const team1YellowCards = [...new Set(match.team1YellowCards || [])];
                const team2YellowCards = [...new Set(match.team2YellowCards || [])];
                const team1RedCards = [...new Set(match.team1RedCards || [])];
                const team2RedCards = [...new Set(match.team2RedCards || [])];

                const hasTeamDetails = team1Scorers.length || team2Scorers.length || team1YellowCards.length || team2YellowCards.length || team1RedCards.length || team2RedCards.length;

                const teamDetailsHTML = hasTeamDetails
                    ? `
                        <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div class="bg-slate-50 rounded-lg p-2 border border-slate-100">
                                <div class="font-bold text-slate-700 mb-1">${match.team1}</div>
                                ${team1Scorers.length ? `<div class="text-slate-600"><span class="font-bold">الهدافون:</span> ${team1Scorers.join('، ')}</div>` : '<div class="text-slate-400">لا يوجد مسجلون</div>'}
                                ${team1YellowCards.length ? `<div class="text-amber-700 mt-1"><span class="font-bold">إنذارات:</span> ${team1YellowCards.join('، ')}</div>` : ''}
                                ${team1RedCards.length ? `<div class="text-red-700 mt-1"><span class="font-bold">طرد:</span> ${team1RedCards.join('، ')}</div>` : ''}
                            </div>
                            <div class="bg-slate-50 rounded-lg p-2 border border-slate-100">
                                <div class="font-bold text-slate-700 mb-1">${match.team2}</div>
                                ${team2Scorers.length ? `<div class="text-slate-600"><span class="font-bold">الهدافون:</span> ${team2Scorers.join('، ')}</div>` : '<div class="text-slate-400">لا يوجد مسجلون</div>'}
                                ${team2YellowCards.length ? `<div class="text-amber-700 mt-1"><span class="font-bold">إنذارات:</span> ${team2YellowCards.join('، ')}</div>` : ''}
                                ${team2RedCards.length ? `<div class="text-red-700 mt-1"><span class="font-bold">طرد:</span> ${team2RedCards.join('، ')}</div>` : ''}
                            </div>
                        </div>
                    `
                    : '';

                matchRow.innerHTML = `
                    <div class="w-full">
                        <div class="flex items-center justify-between gap-3">
                            <div class="flex items-center gap-2 flex-1 min-w-0">
                                <span class="font-semibold text-slate-800 truncate">${match.team1}</span>
                                <span class="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs flex-shrink-0 ${scoreState.team1}">${match.score1 || '-'}</span>
                            </div>
                            
                            <div class="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-100 flex-shrink-0">
                                <span class="font-bold text-blue-700 text-xs">${match.time}</span>
                                <span class="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">G${match.group}</span>
                                ${match.status ? `<span class="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded font-bold">${match.status}</span>` : ''}
                            </div>
                            
                            <div class="flex items-center gap-2 flex-1 justify-end min-w-0">
                                <span class="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs flex-shrink-0 ${scoreState.team2}">${match.score2 || '-'}</span>
                                <span class="font-semibold text-slate-800 truncate text-right">${match.team2}</span>
                            </div>
                        </div>
                        ${teamDetailsHTML}
                    </div>
                `;
                matchesList.appendChild(matchRow);
            });

            dateSection.appendChild(matchesList);
            contentDaily.appendChild(dateSection);
        });

        if (!Object.keys(groupedByDate).length) {
            contentDaily.innerHTML = '<div class="text-center py-12 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">لا توجد نتائج تطابق بحثك</div>';
        }
    }

    // Render Group Tables (Standings)
    function renderGroups(filter = '') {
        contentGroups.innerHTML = '';
        
        const completedMatches = (tournamentData.matches || []).filter(match => match.score1 !== "" && match.score2 !== "");

        const getHeadToHeadScore = (groupId, teamA, teamB) => {
            const directMatches = completedMatches.filter(match =>
                Number(match.group) === Number(groupId) &&
                ((match.team1 === teamA && match.team2 === teamB) || (match.team1 === teamB && match.team2 === teamA))
            );

            return directMatches.reduce((acc, match) => {
                const s1 = Number(match.score1);
                const s2 = Number(match.score2);
                const aIsTeam1 = match.team1 === teamA;
                const aGoals = aIsTeam1 ? s1 : s2;
                const bGoals = aIsTeam1 ? s2 : s1;

                acc.gd += (aGoals - bGoals);
                if (aGoals > bGoals) acc.points += 3;
                else if (aGoals === bGoals) acc.points += 1;
                return acc;
            }, { points: 0, gd: 0, played: directMatches.length });
        };

        (tournamentData.groups || []).forEach(group => {
            const teams = [...(group.teams || [])].sort((a, b) => {
                if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
                if ((b.gd || 0) !== (a.gd || 0)) return (b.gd || 0) - (a.gd || 0);

                const h2hA = getHeadToHeadScore(group.id, a.name, b.name);
                const h2hB = getHeadToHeadScore(group.id, b.name, a.name);

                if (h2hA.played > 0 || h2hB.played > 0) {
                    if (h2hB.points !== h2hA.points) return h2hB.points - h2hA.points;
                    if (h2hB.gd !== h2hA.gd) return h2hB.gd - h2hA.gd;
                }

                if ((b.gf || 0) !== (a.gf || 0)) return (b.gf || 0) - (a.gf || 0);
                return (a.name || '').localeCompare((b.name || ''), 'ar');
            });
            const hasTeamMatch = teams.some(t => (t.name || '').toLowerCase().includes(filter.toLowerCase()));
            if (filter && !hasTeamMatch) return;

            const groupCard = document.createElement('div');
            groupCard.className = 'bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow';
            
            const groupHeader = document.createElement('div');
            groupHeader.className = 'bg-slate-50 border-b-2 border-slate-100 px-5 py-4 font-bold text-slate-800 flex items-center justify-between';
            groupHeader.innerHTML = `<span>${group.name}</span> <i class="fas fa-trophy text-amber-500"></i>`;
            groupCard.appendChild(groupHeader);

            const tableContainer = document.createElement('div');
            tableContainer.className = 'overflow-x-auto';
            
            let tableHTML = `
                <table class="w-full text-right text-sm">
                    <thead class="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-100">
                        <tr>
                            <th class="px-4 py-3 text-right">الفريق</th>
                            <th class="px-2 py-3 text-center">ل</th>
                            <th class="px-2 py-3 text-center">ف</th>
                            <th class="px-2 py-3 text-center">ت</th>
                            <th class="px-2 py-3 text-center">خ</th>
                            <th class="px-2 py-3 text-center">له</th>
                            <th class="px-2 py-3 text-center">ع</th>
                            <th class="px-2 py-3 text-center">+/-</th>
                            <th class="px-4 py-3 text-center text-blue-600">ن</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
            `;

            teams.forEach((team, idx) => {
                const isHighlighted = filter && team.name.toLowerCase().includes(filter.toLowerCase());
                tableHTML += `
                    <tr class="${isHighlighted ? 'bg-yellow-50' : ''} hover:bg-slate-50 transition-colors">
                        <td class="px-4 py-4 font-bold text-slate-800">
                            <span class="inline-block w-5 text-slate-300 text-[10px]">${idx + 1}</span>
                            ${team.name}
                        </td>
                        <td class="px-2 py-4 text-center text-slate-600">${team.played}</td>
                        <td class="px-2 py-4 text-center text-green-600 font-bold">${team.won}</td>
                        <td class="px-2 py-4 text-center text-slate-600">${team.draw}</td>
                        <td class="px-2 py-4 text-center text-red-600 font-bold">${team.lost}</td>
                        <td class="px-2 py-4 text-center text-slate-600">${team.gf}</td>
                        <td class="px-2 py-4 text-center text-slate-600">${team.ga}</td>
                        <td class="px-2 py-4 text-center text-slate-600 font-bold">${team.gd}</td>
                        <td class="px-4 py-4 text-center font-black text-blue-700 bg-blue-50/30">${team.points}</td>
                    </tr>
                `;
            });

            tableHTML += `</tbody></table>`;
            tableContainer.innerHTML = tableHTML;
            groupCard.appendChild(tableContainer);
            contentGroups.appendChild(groupCard);
        });

        if (contentGroups.children.length === 0) {
            contentGroups.innerHTML = '<div class="col-span-full text-center py-12 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">لا توجد نتائج تطابق بحثك</div>';
        }
    }

    function renderStats(filter = '') {
        contentStats.innerHTML = '';
        
        // 1. Top Scorers
        const topScorers = [...(tournamentData.topScorers || [])]
            .filter(p => !filter || p.name.includes(filter) || p.team.includes(filter))
            .sort((a, b) => (b.goals || 0) - (a.goals || 0));
            
        // 2. Top Goalkeepers
        const topGoalkeepers = [...(tournamentData.topGoalkeepers || [])]
            .filter(p => !filter || p.name.includes(filter) || p.team.includes(filter))
            .sort((a, b) => (b.cleanSheets || 0) - (a.cleanSheets || 0));

        // 3. Team Stats (Attack & Defense)
        const teamStats = [];
        (tournamentData.groups || []).forEach(group => {
            (group.teams || []).forEach(team => {
                teamStats.push({
                    name: team.name,
                    gf: team.gf || 0,
                    ga: team.ga || 0,
                    played: team.played || 0,
                    avgGf: team.played > 0 ? (team.gf / team.played).toFixed(2) : 0,
                    avgGa: team.played > 0 ? (team.ga / team.played).toFixed(2) : 0
                });
            });
        });

        const bestAttack = [...teamStats].sort((a, b) => b.avgGf - a.avgGf).slice(0, 5);
        const bestDefense = [...teamStats].filter(t => t.played > 0).sort((a, b) => a.avgGa - b.avgGa).slice(0, 5);

        const createTableCard = (title, icon, colorClass, headers, rows) => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden';
            card.innerHTML = `
                <div class="bg-slate-50 border-b border-slate-100 px-5 py-4 font-bold text-slate-800 flex items-center gap-3">
                    <i class="${icon} ${colorClass}"></i>
                    <span>${title}</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-right text-sm">
                        <thead class="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-100">
                            <tr>${headers.map(h => `<th class="px-4 py-3">${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">${rows}</tbody>
                    </table>
                </div>
            `;
            return card;
        };

        // Scorers Rows
        const scorerRows = topScorers.slice(0, 10).map((p, idx) => `
            <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-bold text-slate-800">${idx + 1}. ${p.name}</td>
                <td class="px-4 py-3 text-slate-600">${p.team}</td>
                <td class="px-4 py-3 text-center font-black text-blue-600">${p.goals}</td>
            </tr>
        `).join('');

        // Keepers Rows
        const keeperRows = topGoalkeepers.slice(0, 10).map((p, idx) => `
            <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-bold text-slate-800">${idx + 1}. ${p.name}</td>
                <td class="px-4 py-3 text-slate-600">${p.team}</td>
                <td class="px-4 py-3 text-center font-black text-emerald-600">${p.cleanSheets}</td>
            </tr>
        `).join('');

        // Attack Rows
        const attackRows = bestAttack.map((t, idx) => `
            <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-bold text-slate-800">${idx + 1}. ${t.name}</td>
                <td class="px-4 py-3 text-center text-slate-600">${t.gf}</td>
                <td class="px-4 py-3 text-center font-black text-orange-600">${t.avgGf}</td>
            </tr>
        `).join('');

        // Defense Rows
        const defenseRows = bestDefense.map((t, idx) => `
            <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-bold text-slate-800">${idx + 1}. ${t.name}</td>
                <td class="px-4 py-3 text-center text-slate-600">${t.ga}</td>
                <td class="px-4 py-3 text-center font-black text-indigo-600">${t.avgGa}</td>
            </tr>
        `).join('');

        contentStats.appendChild(createTableCard('أفضل الهدافين', 'fas fa-fire', 'text-orange-500', ['اللاعب', 'الفريق', 'الأهداف'], scorerRows));
        contentStats.appendChild(createTableCard('أفضل الحراس', 'fas fa-hands', 'text-emerald-500', ['الحارس', 'الفريق', 'كلين شيت'], keeperRows));
        contentStats.appendChild(createTableCard('أقوى هجوم (متوسط)', 'fas fa-bolt', 'text-yellow-500', ['الفريق', 'الأهداف', 'المعدل'], attackRows));
        contentStats.appendChild(createTableCard('أقوى دفاع (متوسط)', 'fas fa-shield-alt', 'text-indigo-500', ['الفريق', 'عليه', 'المعدل'], defenseRows));
    }

    function renderDisciplinary(filter = '') {
        contentDisciplinary.innerHTML = '';
        
        const yellowCards = [...(tournamentData.disciplinary?.yellowCardTable || [])]
            .filter(p => !filter || p.name.includes(filter) || p.team.includes(filter))
            .sort((a, b) => b.yellowCards - a.yellowCards);
            
        const suspended = [...(tournamentData.disciplinary?.suspendedPlayers || [])]
            .filter(p => !filter || p.name.includes(filter) || p.team.includes(filter));

        const createTableCard = (title, icon, colorClass, headers, rows) => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden';
            card.innerHTML = `
                <div class="bg-slate-50 border-b border-slate-100 px-5 py-4 font-bold text-slate-800 flex items-center gap-3">
                    <i class="${icon} ${colorClass}"></i>
                    <span>${title}</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-right text-sm">
                        <thead class="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-100">
                            <tr>${headers.map(h => `<th class="px-4 py-3">${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">${rows}</tbody>
                    </table>
                </div>
            `;
            return card;
        };

        const yellowRows = yellowCards.map((p, idx) => `
            <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-bold text-slate-800">${idx + 1}. ${p.name}</td>
                <td class="px-4 py-3 text-slate-600">${p.team}</td>
                <td class="px-4 py-3 text-center">
                    <span class="inline-block w-4 h-6 bg-yellow-400 rounded-sm shadow-sm mr-2 align-middle"></span>
                    <span class="font-black text-slate-700">${p.yellowCards}</span>
                </td>
            </tr>
        `).join('');

        const suspendedRows = suspended.map((p, idx) => `
            <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-bold text-slate-800">${idx + 1}. ${p.name}</td>
                <td class="px-4 py-3 text-slate-600">${p.team}</td>
                <td class="px-4 py-3 text-red-600 font-bold text-xs">${p.suspendedMatch}</td>
            </tr>
        `).join('');

        contentDisciplinary.appendChild(createTableCard('سجل الإنذارات', 'fas fa-copy', 'text-yellow-500', ['اللاعب', 'الفريق', 'الإنذارات'], yellowRows));
        contentDisciplinary.appendChild(createTableCard('الموقوفون', 'fas fa-user-slash', 'text-red-500', ['اللاعب', 'الفريق', 'مباراة الإيقاف'], suspendedRows));
    }

    // Tab Switching Events
    tabDaily.addEventListener('click', () => {
        switchTab(tabDaily, contentDaily);
        renderDaily(searchInput.value);
    });

    tabGroups.addEventListener('click', () => {
        switchTab(tabGroups, contentGroups);
        renderGroups(searchInput.value);
    });

    tabStats.addEventListener('click', () => {
        switchTab(tabStats, contentStats);
        renderStats(searchInput.value);
    });

    tabDisciplinary.addEventListener('click', () => {
        switchTab(tabDisciplinary, contentDisciplinary);
        renderDisciplinary(searchInput.value);
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        const val = (e.target.value || "").trim();
        if (!contentDaily.classList.contains('hidden')) renderDaily(val);
        else if (!contentGroups.classList.contains('hidden')) renderGroups(val);
        else if (!contentStats.classList.contains('hidden')) renderStats(val);
        else if (!contentDisciplinary.classList.contains('hidden')) renderDisciplinary(val);
    });

    // Initial Render
    try {
        renderDaily();
        renderGroups();
        renderStats();
        renderDisciplinary();
    } catch (err) {
        console.error('Render failed:', err);
        contentDaily.innerHTML = '<div class="text-center py-12 text-red-500 bg-white rounded-2xl border border-red-200">حدث خطأ أثناء عرض البيانات.</div>';
    }
});
