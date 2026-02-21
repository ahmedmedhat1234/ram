document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const tabDaily = document.getElementById('tab-daily');
    const tabGroups = document.getElementById('tab-groups');
    const contentDaily = document.getElementById('content-daily');
    const contentGroups = document.getElementById('content-groups');
    let contentAwards = document.getElementById('content-awards');

    if (!contentDaily || !contentGroups || !tabDaily || !tabGroups || !searchInput) {
        console.error('Required UI elements are missing.');
        return;
    }

    if (!contentAwards) {
        contentAwards = document.createElement('div');
        contentAwards.id = 'content-awards';
        contentAwards.className = 'grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8';
        contentGroups.insertAdjacentElement('afterend', contentAwards);
    }

    // Initialize UI
    document.getElementById('main-title').textContent = tournamentData.title;
    document.getElementById('main-subtitle').textContent = tournamentData.subtitle;
    document.getElementById('group-count').textContent = tournamentData.groupCount || "12";

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
                const team1Scorers = match.team1Scorers || [];
                const team2Scorers = match.team2Scorers || [];
                const legacyScorers = (!team1Scorers.length && !team2Scorers.length) ? (match.scorers || []) : [];
                const team1YellowCards = match.team1YellowCards || [];
                const team2YellowCards = match.team2YellowCards || [];
                const team1RedCards = match.team1RedCards || [];
                const team2RedCards = match.team2RedCards || [];

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

    function renderAwards() {
        const topScorers = [...(tournamentData.topScorers || [])].sort((a, b) => (b.goals || 0) - (a.goals || 0));
        const topGoalkeepers = tournamentData.topGoalkeepers || [];

        const scorerRows = topScorers.map((player, idx) => `
            <tr class="border-b border-slate-100">
                <td class="py-2 font-bold text-slate-700">${idx + 1}. ${player.name}</td>
                <td class="py-2 text-slate-500">${player.team}</td>
                <td class="py-2 font-black text-blue-700 text-center">${player.goals}</td>
            </tr>
        `).join('');

        const keeperRows = topGoalkeepers.map((keeper, idx) => `
            <tr class="border-b border-slate-100">
                <td class="py-2 font-bold text-slate-700">${idx + 1}. ${keeper.name}</td>
                <td class="py-2 text-slate-500">${keeper.team}</td>
                <td class="py-2 font-black text-emerald-700 text-center">${keeper.cleanSheets}</td>
            </tr>
        `).join('');

        contentAwards.innerHTML = `
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h3 class="font-black text-lg mb-3 text-slate-800">أفضل 5 هدافين</h3>
                <table class="w-full text-sm">
                    <thead><tr class="text-slate-500"><th class="text-right pb-2">اللاعب</th><th class="text-right pb-2">الفريق</th><th class="text-center pb-2">الأهداف</th></tr></thead>
                    <tbody>${scorerRows}</tbody>
                </table>
            </div>
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h3 class="font-black text-lg mb-3 text-slate-800">أفضل 5 حراس</h3>
                <table class="w-full text-sm">
                    <thead><tr class="text-slate-500"><th class="text-right pb-2">الحارس</th><th class="text-right pb-2">الفريق</th><th class="text-center pb-2">كلين شيت</th></tr></thead>
                    <tbody>${keeperRows}</tbody>
                </table>
            </div>
        `;
    }

    // Tab Switching
    tabDaily.addEventListener('click', () => {
        tabDaily.classList.add('tab-active');
        tabDaily.classList.remove('text-slate-500');
        tabGroups.classList.remove('tab-active');
        tabGroups.classList.add('text-slate-500');
        contentDaily.classList.remove('hidden');
        contentGroups.classList.add('hidden');
        renderDaily(searchInput.value);
    });

    tabGroups.addEventListener('click', () => {
        tabGroups.classList.add('tab-active');
        tabGroups.classList.remove('text-slate-500');
        tabDaily.classList.remove('tab-active');
        tabDaily.classList.add('text-slate-500');
        contentGroups.classList.remove('hidden');
        contentDaily.classList.add('hidden');
        renderGroups(searchInput.value);
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        const val = (e.target.value || "").trim();
        if (!contentDaily.classList.contains('hidden')) {
            renderDaily(val);
        } else {
            renderGroups(val);
        }
    });

    // Initial Render
    try {
        renderDaily();
        renderGroups();
        renderAwards();
    } catch (err) {
        console.error('Render failed:', err);
        contentDaily.innerHTML = '<div class="text-center py-12 text-red-500 bg-white rounded-2xl border border-red-200">حدث خطأ أثناء عرض البيانات.</div>';
    }
});
