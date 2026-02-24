document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const tabDaily = document.getElementById('tab-daily');
    const tabGroups = document.getElementById('tab-groups');
    const tabStats = document.getElementById('tab-stats');
    const tabDisciplinary = document.getElementById('tab-disciplinary');
    const tabRules = document.getElementById('tab-rules');
    
    const contentDaily = document.getElementById('content-daily');
    const contentGroups = document.getElementById('content-groups');
    const contentStats = document.getElementById('content-stats');
    const contentDisciplinary = document.getElementById('content-disciplinary');
    const contentRules = document.getElementById('content-rules');

    const teamModal = document.getElementById('team-modal');
    const closeModal = document.getElementById('close-modal');
    const modalTeamName = document.getElementById('modal-team-name');
    const modalTeamCoach = document.getElementById('modal-team-coach');
    const modalContent = document.getElementById('modal-content');

    // Initialize UI
    document.getElementById('main-title').textContent = tournamentData.title;
    document.getElementById('main-subtitle').textContent = tournamentData.subtitle;
    document.getElementById('group-count').textContent = tournamentData.groupCount || "12";

    function normalizePlayerName(entry = '') {
        return entry.split('(')[0].trim();
    }

    function getGoalCountFromEntry(entry = '') {
        const text = String(entry);
        const normalizedDigits = text.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

        const numericMatch = normalizedDigits.match(/(\d+)\s*(?:هدف(?:ان|ين)?|أهداف|اهداف)/);
        if (numericMatch) return parseInt(numericMatch[1], 10);

        if (/سوبر\s*هاتريك/.test(normalizedDigits)) return 4;
        if (/هاتريك/.test(normalizedDigits)) return 3;
        if (/هدف(?:ان|ين)/.test(normalizedDigits)) return 2;
        const numericMatch = text.match(/(\d+)\s*هدف/);
        if (numericMatch) return parseInt(numericMatch[1], 10);

        if (/سوبر\s*هاتريك/.test(text)) return 4;
        if (/هاتريك/.test(text)) return 3;
        if (/هدف(?:ان|ين)/.test(text)) return 2;

        return 1;
    }

    function getComputedGroupStandings() {
        const standingsByGroup = new Map();

        (tournamentData.groups || []).forEach(group => {
            const teamTable = new Map();
            (group.teams || []).forEach(team => {
                teamTable.set(team.name, {
                    name: team.name,
                    played: 0,
                    won: 0,
                    lost: 0,
                    draw: 0,
                    gf: 0,
                    ga: 0,
                    gd: 0,
                    points: 0
                });
            });
            standingsByGroup.set(group.id, teamTable);
        });

        (tournamentData.matches || []).forEach(match => {
            const groupId = Number(match.group);
            const groupStandings = standingsByGroup.get(groupId);
            if (!groupStandings) return;

            const s1 = parseInt(match.score1, 10);
            const s2 = parseInt(match.score2, 10);
            const isPlayed = !isNaN(s1) && !isNaN(s2);
            if (!isPlayed) return;

            const team1 = groupStandings.get(match.team1);
            const team2 = groupStandings.get(match.team2);
            if (!team1 || !team2) return;

            team1.played += 1;
            team2.played += 1;
            team1.gf += s1;
            team1.ga += s2;
            team2.gf += s2;
            team2.ga += s1;

            if (s1 > s2) {
                team1.won += 1;
                team2.lost += 1;
                team1.points += 3;
            } else if (s2 > s1) {
                team2.won += 1;
                team1.lost += 1;
                team2.points += 3;
            } else {
                team1.draw += 1;
                team2.draw += 1;
                team1.points += 1;
                team2.points += 1;
            }
        });

        const result = new Map();
        standingsByGroup.forEach((teamsMap, groupId) => {
            const rows = [...teamsMap.values()].map(team => ({
                ...team,
                gd: team.gf - team.ga
            })).sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.gd !== a.gd) return b.gd - a.gd;
                if (b.gf !== a.gf) return b.gf - a.gf;
                return a.name.localeCompare(b.name, 'ar');
            });

            result.set(groupId, rows);
        });

        return result;
    }

    // Helper to switch tabs
    function switchTab(activeTab, activeContent) {
        [tabDaily, tabGroups, tabStats, tabDisciplinary, tabRules].forEach(tab => {
            if (tab) {
                tab.classList.remove('tab-active');
                tab.classList.add('text-slate-500');
                tab.classList.remove('text-sm', 'md:text-base');
                tab.classList.add('text-[10px]', 'md:text-sm');
            }
        });
        [contentDaily, contentGroups, contentStats, contentDisciplinary, contentRules].forEach(content => {
            if (content) content.classList.add('hidden');
        });

        activeTab.classList.add('tab-active');
        activeTab.classList.remove('text-slate-500');
        activeContent.classList.remove('hidden');
    }

    // Modal Logic
    function openTeamModal(teamName) {
        const team = (tournamentData.teams || {})[teamName];
        if (!team) return;

        modalTeamName.textContent = teamName;
        modalTeamCoach.textContent = `المدير الفني: ${team.coach || 'غير محدد'}`;
        
        const playerStats = {};
        (tournamentData.matches || []).forEach(match => {
            const isTeam1 = match.team1 === teamName;
            const isTeam2 = match.team2 === teamName;
            if (!isTeam1 && !isTeam2) return;

            const scorers = isTeam1 ? (match.team1Scorers || match.scorers || []) : (match.team2Scorers || []);
            const yellows = isTeam1 ? (match.team1YellowCards || match.yellowCards || []) : (match.team2YellowCards || []);
            const reds = isTeam1 ? (match.team1RedCards || []) : (match.team2RedCards || []);

            scorers.forEach(s => {
                const name = normalizePlayerName(s);
                playerStats[name] = playerStats[name] || { goals: 0, yellows: 0, reds: 0 };
                playerStats[name].goals += getGoalCountFromEntry(s);
            });
            yellows.forEach(s => {
                const name = normalizePlayerName(s);
                playerStats[name] = playerStats[name] || { goals: 0, yellows: 0, reds: 0 };
                playerStats[name].yellows += 1;
            });
            reds.forEach(s => {
                const name = normalizePlayerName(s);
                playerStats[name] = playerStats[name] || { goals: 0, yellows: 0, reds: 0 };
                playerStats[name].reds += 1;
            });
        });

        const playerCount = (team.players || []).length;
        let html = `
            <div class="mb-4">
                <h3 class="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-2">حارس المرمى</h3>
                <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm">
                            <i class="fas fa-hands text-xs"></i>
                        </div>
                        <span class="font-bold text-emerald-900 text-sm">${team.goalkeeper || 'غير محدد'}</span>
                    </div>
                    <span class="text-[9px] bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded font-bold">GK</span>
                </div>
            </div>
            <div>
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-slate-400 text-[10px] uppercase font-black tracking-widest">قائمة اللاعبين</h3>
                    <span class="text-[10px] font-bold ${playerCount > 12 ? 'text-red-500' : 'text-blue-600'} bg-blue-50 px-2 py-0.5 rounded-full">
                        ${playerCount} / 12 لاعب
                    </span>
                </div>
                <div class="grid grid-cols-1 gap-1.5">
        `;

        (team.players || []).forEach(player => {
            const stats = playerStats[player] || { goals: 0, yellows: 0, reds: 0 };
            html += `
                <div class="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between hover:bg-white hover:shadow-sm transition-all group">
                    <span class="font-bold text-slate-700 text-sm group-hover:text-blue-600 transition-colors">${player}</span>
                    <div class="flex items-center gap-1.5">
                        ${stats.goals > 0 ? `<span class="flex items-center gap-1 text-blue-600 font-black text-[10px] bg-blue-50 px-1.5 py-0.5 rounded"><i class="fas fa-futbol text-[8px]"></i> ${stats.goals}</span>` : ''}
                        ${stats.yellows > 0 ? `<span class="w-2.5 h-3.5 bg-yellow-400 rounded-sm shadow-sm" title="إنذار"></span>` : ''}
                        ${stats.reds > 0 ? `<span class="w-2.5 h-3.5 bg-red-500 rounded-sm shadow-sm" title="طرد"></span>` : ''}
                    </div>
                </div>
            `;
        });

        html += `</div></div>`;
        modalContent.innerHTML = html;
        teamModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal.addEventListener('click', () => {
        teamModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    });

    teamModal.addEventListener('click', (e) => {
        if (e.target === teamModal) closeModal.click();
    });

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
            dateSection.className = 'bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6';

            const dateHeader = document.createElement('div');
            dateHeader.className = 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-4 py-2.5 font-bold text-sm flex items-center gap-3';
            dateHeader.innerHTML = `<i class="far fa-calendar-check"></i> ${date}`;
            dateSection.appendChild(dateHeader);

            const matchesList = document.createElement('div');
            matchesList.className = 'divide-y divide-slate-100';

            groupedByDate[date].forEach(match => {
                const matchRow = document.createElement('div');
                matchRow.className = 'px-3 py-3 hover:bg-slate-50 transition-colors text-xs';

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
                        <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[10px]">
                            <div class="bg-slate-50 rounded-lg p-2 border border-slate-100">
                                <div class="font-bold text-slate-700 mb-1 cursor-pointer hover:text-blue-600" onclick="window.openTeamModal('${match.team1}')">${match.team1}</div>
                                ${team1Scorers.length ? `<div class="text-slate-600"><span class="font-bold">الهدافون:</span> ${team1Scorers.join('، ')}</div>` : ''}
                                ${team1YellowCards.length ? `<div class="text-amber-700 mt-0.5"><span class="font-bold">إنذارات:</span> ${team1YellowCards.join('، ')}</div>` : ''}
                                ${team1RedCards.length ? `<div class="text-red-700 mt-0.5"><span class="font-bold">طرد:</span> ${team1RedCards.join('، ')}</div>` : ''}
                            </div>
                            <div class="bg-slate-50 rounded-lg p-2 border border-slate-100">
                                <div class="font-bold text-slate-700 mb-1 cursor-pointer hover:text-blue-600" onclick="window.openTeamModal('${match.team2}')">${match.team2}</div>
                                ${team2Scorers.length ? `<div class="text-slate-600"><span class="font-bold">الهدافون:</span> ${team2Scorers.join('، ')}</div>` : ''}
                                ${team2YellowCards.length ? `<div class="text-amber-700 mt-0.5"><span class="font-bold">إنذارات:</span> ${team2YellowCards.join('، ')}</div>` : ''}
                                ${team2RedCards.length ? `<div class="text-red-700 mt-0.5"><span class="font-bold">طرد:</span> ${team2RedCards.join('، ')}</div>` : ''}
                            </div>
                        </div>
                    `
                    : '';

                matchRow.innerHTML = `
                    <div class="w-full">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-1.5 flex-1 min-w-0">
                                <span class="font-bold text-slate-800 truncate cursor-pointer hover:text-blue-600" onclick="window.openTeamModal('${match.team1}')">${match.team1}</span>
                                <span class="w-7 h-7 flex items-center justify-center rounded-lg font-black text-[10px] flex-shrink-0 ${scoreState.team1}">${match.score1 || '-'}</span>
                            </div>
                            
                            <div class="flex flex-col items-center gap-0.5 flex-shrink-0">
                                <span class="font-black text-blue-700 text-[10px]">${match.time}</span>
                                <span class="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">G${match.group}</span>
                                ${match.status ? `<span class="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold">${match.status}</span>` : ''}
                            </div>
                            
                            <div class="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                                <span class="w-7 h-7 flex items-center justify-center rounded-lg font-black text-[10px] flex-shrink-0 ${scoreState.team2}">${match.score2 || '-'}</span>
                                <span class="font-bold text-slate-800 truncate text-right cursor-pointer hover:text-blue-600" onclick="window.openTeamModal('${match.team2}')">${match.team2}</span>
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
    }

    // Render Group Tables
    function renderGroups(filter = '') {
        contentGroups.innerHTML = '';
        const computedStandings = getComputedGroupStandings();
        (tournamentData.groups || []).forEach(group => {
            const teams = computedStandings.get(group.id) || (group.teams || []);
            const hasTeamMatch = teams.some(t => (t.name || '').toLowerCase().includes(filter.toLowerCase()));
            if (filter && !hasTeamMatch) return;

            const groupCard = document.createElement('div');
            groupCard.className = 'bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mb-4';
            
            let tableHTML = `
                <div class="bg-slate-50 border-b border-slate-100 px-4 py-3 font-bold text-slate-800 flex items-center justify-between text-sm">
                    <span>${group.name}</span> <i class="fas fa-trophy text-amber-500 text-xs"></i>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-right text-xs">
                        <thead class="bg-slate-50/50 text-slate-500 text-[9px] uppercase font-bold border-b border-slate-100">
                            <tr><th class="px-3 py-2">الفريق</th><th class="px-2 py-2 text-center">ل</th><th class="px-2 py-2 text-center">+/-</th><th class="px-3 py-2 text-center text-blue-600">ن</th></tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
            `;

            teams.forEach((team, idx) => {
                tableHTML += `
                    <tr class="hover:bg-slate-50 transition-colors cursor-pointer" onclick="window.openTeamModal('${team.name}')">
                        <td class="px-3 py-3 font-bold text-slate-800">${idx + 1}. ${team.name}</td>
                        <td class="px-2 py-3 text-center text-slate-600">${team.played}</td>
                        <td class="px-2 py-3 text-center text-slate-600 font-bold">${team.gd}</td>
                        <td class="px-3 py-3 text-center font-black text-blue-700 bg-blue-50/30">${team.points}</td>
                    </tr>
                `;
            });

            tableHTML += `</tbody></table></div>`;
            groupCard.innerHTML = tableHTML;
            contentGroups.appendChild(groupCard);
        });
    }

    function renderStats(filter = '') {
        contentStats.innerHTML = '';
        
        const scorers = {};
        const cleanSheets = {};
        const teamStats = {};

        (tournamentData.matches || []).forEach(match => {
            const s1 = parseInt(match.score1);
            const s2 = parseInt(match.score2);
            const isPlayed = !isNaN(s1) && !isNaN(s2);

            if (isPlayed) {
                [... (match.team1Scorers || match.scorers || []), ... (match.team2Scorers || [])].forEach(s => {
                    const name = normalizePlayerName(s);
                    scorers[name] = (scorers[name] || 0) + getGoalCountFromEntry(s);
                });

                if (s2 === 0) cleanSheets[match.team1] = (cleanSheets[match.team1] || 0) + 1;
                if (s1 === 0) cleanSheets[match.team2] = (cleanSheets[match.team2] || 0) + 1;

                teamStats[match.team1] = teamStats[match.team1] || { gf: 0, ga: 0, p: 0 };
                teamStats[match.team2] = teamStats[match.team2] || { gf: 0, ga: 0, p: 0 };
                teamStats[match.team1].gf += s1; teamStats[match.team1].ga += s2; teamStats[match.team1].p += 1;
                teamStats[match.team2].gf += s2; teamStats[match.team2].ga += s1; teamStats[match.team2].p += 1;
            }
        });

        const topScorers = Object.entries(scorers).map(([name, goals]) => {
            const team = Object.keys(tournamentData.teams || {}).find(t => (tournamentData.teams[t].players || []).includes(name)) || "غير معروف";
            return { name, goals, team };
        }).sort((a, b) => b.goals - a.goals).slice(0, 10);

        const topKeepers = Object.entries(cleanSheets).map(([teamName, count]) => {
            const keeper = (tournamentData.teams || {})[teamName]?.goalkeeper || "غير معروف";
            return { name: keeper, team: teamName, cleanSheets: count };
        }).sort((a, b) => b.cleanSheets - a.cleanSheets).slice(0, 10);

        const bestAttack = Object.entries(teamStats).map(([name, s]) => ({ name, avg: (s.gf / s.p).toFixed(2), total: s.gf }))
            .sort((a, b) => b.avg - a.avg).slice(0, 5);
        
        const bestDefense = Object.entries(teamStats).map(([name, s]) => ({ name, avg: (s.ga / s.p).toFixed(2), total: s.ga }))
            .sort((a, b) => a.avg - b.avg).slice(0, 5);

        const createTableCard = (title, icon, colorClass, headers, rows) => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4';
            card.innerHTML = `
                <div class="bg-slate-50 border-b border-slate-100 px-4 py-3 font-bold text-slate-800 flex items-center gap-3 text-sm">
                    <i class="${icon} ${colorClass}"></i> <span>${title}</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-right text-xs">
                        <thead class="bg-slate-50/50 text-slate-500 text-[9px] uppercase font-bold border-b border-slate-100">
                            <tr>${headers.map(h => `<th class="px-3 py-2">${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">${rows}</tbody>
                    </table>
                </div>
            `;
            return card;
        };

        const scorerRows = topScorers.map((p, idx) => `
            <tr class="hover:bg-slate-50 cursor-pointer" onclick="window.openTeamModal('${p.team}')">
                <td class="px-3 py-2.5 font-bold text-slate-800">${idx + 1}. ${p.name}</td>
                <td class="px-3 py-2.5 text-slate-600">${p.team}</td>
                <td class="px-3 py-2.5 text-center font-black text-blue-600">${p.goals}</td>
            </tr>
        `).join('');

        const keeperRows = topKeepers.map((p, idx) => `
            <tr class="hover:bg-slate-50 cursor-pointer" onclick="window.openTeamModal('${p.team}')">
                <td class="px-3 py-2.5 font-bold text-slate-800">${idx + 1}. ${p.name}</td>
                <td class="px-3 py-2.5 text-slate-600">${p.team}</td>
                <td class="px-3 py-2.5 text-center font-black text-emerald-600">${p.cleanSheets}</td>
            </tr>
        `).join('');

        const attackRows = bestAttack.map((t, idx) => `
            <tr class="hover:bg-slate-50 cursor-pointer" onclick="window.openTeamModal('${t.name}')">
                <td class="px-3 py-2.5 font-bold text-slate-800">${idx + 1}. ${t.name}</td>
                <td class="px-3 py-2.5 text-center font-black text-orange-600">${t.avg}</td>
            </tr>
        `).join('');

        const defenseRows = bestDefense.map((t, idx) => `
            <tr class="hover:bg-slate-50 cursor-pointer" onclick="window.openTeamModal('${t.name}')">
                <td class="px-3 py-2.5 font-bold text-slate-800">${idx + 1}. ${t.name}</td>
                <td class="px-3 py-2.5 text-center font-black text-indigo-600">${t.avg}</td>
            </tr>
        `).join('');

        contentStats.appendChild(createTableCard('أفضل الهدافين', 'fas fa-fire', 'text-orange-500', ['اللاعب', 'الفريق', '⚽'], scorerRows));
        contentStats.appendChild(createTableCard('أفضل الحراس', 'fas fa-hands', 'text-emerald-500', ['الحارس', 'الفريق', '🧤'], keeperRows));
        contentStats.appendChild(createTableCard('أقوى هجوم (معدل)', 'fas fa-bolt', 'text-yellow-500', ['الفريق', 'المعدل'], attackRows));
        contentStats.appendChild(createTableCard('أقوى دفاع (معدل)', 'fas fa-shield-alt', 'text-indigo-500', ['الفريق', 'المعدل'], defenseRows));
    }

    function renderDisciplinary(filter = '') {
        contentDisciplinary.innerHTML = '';
        const yellows = {};
        const suspended = [];

        (tournamentData.matches || []).forEach(match => {
            [... (match.team1YellowCards || match.yellowCards || []), ... (match.team2YellowCards || [])].forEach(s => {
                const name = normalizePlayerName(s);
                yellows[name] = (yellows[name] || 0) + 1;
            });
            [... (match.team1RedCards || []), ... (match.team2RedCards || [])].forEach(r => {
                const name = normalizePlayerName(r);
                const team = (match.team1RedCards || []).includes(r) ? match.team1 : match.team2;
                suspended.push({ name, team, match: "المباراة القادمة" });
            });
        });

        const yellowRows = Object.entries(yellows).sort((a, b) => b[1] - a[1]).map(([name, count], idx) => {
            const team = Object.keys(tournamentData.teams || {}).find(t => (tournamentData.teams[t].players || []).includes(name)) || "غير معروف";
            return `
                <tr class="hover:bg-slate-50 cursor-pointer" onclick="window.openTeamModal('${team}')">
                    <td class="px-3 py-2.5 font-bold text-slate-800">${idx + 1}. ${name}</td>
                    <td class="px-3 py-2.5 text-slate-600">${team}</td>
                    <td class="px-3 py-2.5 text-center"><span class="inline-block w-2.5 h-3.5 bg-yellow-400 rounded-sm shadow-sm"></span> ${count}</td>
                </tr>
            `;
        }).join('');

        const suspendedRows = suspended.map((p, idx) => `
            <tr class="hover:bg-slate-50 cursor-pointer" onclick="window.openTeamModal('${p.team}')">
                <td class="px-3 py-2.5 font-bold text-slate-800">${idx + 1}. ${p.name}</td>
                <td class="px-3 py-2.5 text-slate-600">${p.team}</td>
                <td class="px-3 py-2.5 text-red-600 font-bold text-[10px]">${p.match}</td>
            </tr>
        `).join('');

        const createTableCard = (title, icon, colorClass, headers, rows) => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4';
            card.innerHTML = `
                <div class="bg-slate-50 border-b border-slate-100 px-4 py-3 font-bold text-slate-800 flex items-center gap-3 text-sm">
                    <i class="${icon} ${colorClass}"></i> <span>${title}</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-right text-xs">
                        <thead class="bg-slate-50/50 text-slate-500 text-[9px] uppercase font-bold border-b border-slate-100">
                            <tr>${headers.map(h => `<th class="px-3 py-2">${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">${rows || '<tr><td colspan="3" class="py-4 text-center text-slate-400">لا توجد بيانات</td></tr>'}</tbody>
                    </table>
                </div>
            `;
            return card;
        };

        contentDisciplinary.appendChild(createTableCard('سجل الإنذارات', 'fas fa-copy', 'text-yellow-500', ['اللاعب', 'الفريق', '🟨'], yellowRows));
        contentDisciplinary.appendChild(createTableCard('الموقوفون', 'fas fa-user-slash', 'text-red-500', ['اللاعب', 'الفريق', 'الحالة'], suspendedRows));
    }

    function renderRules() {
        contentRules.innerHTML = '';
        (tournamentData.rules || []).forEach(rule => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-3';
            card.innerHTML = `
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3 class="font-black text-slate-800 text-sm">${rule.title}</h3>
                </div>
                <p class="text-slate-600 text-xs leading-relaxed font-medium">${rule.content}</p>
            `;
            contentRules.appendChild(card);
        });
    }

    // Tab Switching Events
    tabDaily.addEventListener('click', () => { switchTab(tabDaily, contentDaily); renderDaily(searchInput.value); });
    tabGroups.addEventListener('click', () => { switchTab(tabGroups, contentGroups); renderGroups(searchInput.value); });
    tabStats.addEventListener('click', () => { switchTab(tabStats, contentStats); renderStats(searchInput.value); });
    tabDisciplinary.addEventListener('click', () => { switchTab(tabDisciplinary, contentDisciplinary); renderDisciplinary(searchInput.value); });
    tabRules.addEventListener('click', () => { switchTab(tabRules, contentRules); renderRules(); });

    // Search
    searchInput.addEventListener('input', (e) => {
        const val = (e.target.value || "").trim();
        if (!contentDaily.classList.contains('hidden')) renderDaily(val);
        else if (!contentGroups.classList.contains('hidden')) renderGroups(val);
        else if (!contentStats.classList.contains('hidden')) renderStats(val);
        else if (!contentDisciplinary.classList.contains('hidden')) renderDisciplinary(val);
    });

    window.openTeamModal = openTeamModal;

    // Initial Render
    renderDaily();
    renderGroups();
    renderStats();
    renderDisciplinary();
    renderRules();
});
