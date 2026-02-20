document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const tabDaily = document.getElementById('tab-daily');
    const tabGroups = document.getElementById('tab-groups');
    const contentDaily = document.getElementById('content-daily');
    const contentGroups = document.getElementById('content-groups');

    // Initialize UI
    document.getElementById('main-title').textContent = tournamentData.title;
    document.getElementById('main-subtitle').textContent = tournamentData.subtitle;
    document.getElementById('group-count').textContent = "12";

    // Render Daily Schedule
    function renderDaily(filter = '') {
        contentDaily.innerHTML = '';
        const groupedByDate = {};
        
        tournamentData.matches.forEach(match => {
            const matchText = `${match.team1} ${match.team2} ${match.date} ${match.group}`.toLowerCase();
            if (filter && !matchText.includes(filter.toLowerCase())) return;
            
            if (!groupedByDate[match.date]) groupedByDate[match.date] = [];
            groupedByDate[match.date].push(match);
        });

        const dates = Object.keys(groupedByDate);
        
        dates.forEach(date => {
            const dateSection = document.createElement('div');
            dateSection.className = 'bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8';
            
            const dateHeader = document.createElement('div');
            dateHeader.className = 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 font-bold text-lg flex items-center gap-3';
            dateHeader.innerHTML = `<i class="far fa-calendar-check"></i> ${date}`;
            dateSection.appendChild(dateHeader);

            const matchesList = document.createElement('div');
            matchesList.className = 'divide-y-2 divide-slate-100'; // Thicker dividers
            
            groupedByDate[date].forEach(match => {
                const matchRow = document.createElement('div');
                matchRow.className = 'p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-slate-50 transition-colors';
                matchRow.innerHTML = `
                    <div class="flex-1 flex items-center justify-end gap-4 w-full md:w-auto">
                        <span class="text-center md:text-right font-bold text-slate-800 text-xl order-2 md:order-1">${match.team1}</span>
                        <input type="text" value="${match.score1 || ''}" placeholder="-" class="w-12 h-12 text-center bg-slate-100 border-2 border-slate-200 rounded-xl font-black text-xl text-blue-700 focus:border-blue-500 focus:outline-none order-1 md:order-2">
                    </div>
                    
                    <div class="flex flex-col items-center gap-2 px-6 py-2 bg-blue-50/50 rounded-2xl border border-blue-100 min-w-[140px]">
                        <div class="text-blue-700 font-black text-2xl tracking-tighter">${match.time}</div>
                        <div class="text-[11px] bg-blue-600 text-white px-3 py-1 rounded-full font-bold uppercase">المجموعة ${match.group}</div>
                    </div>
                    
                    <div class="flex-1 flex items-center justify-start gap-4 w-full md:w-auto">
                        <input type="text" value="${match.score2 || ''}" placeholder="-" class="w-12 h-12 text-center bg-slate-100 border-2 border-slate-200 rounded-xl font-black text-xl text-blue-700 focus:border-blue-500 focus:outline-none">
                        <span class="text-center md:text-left font-bold text-slate-800 text-xl">${match.team2}</span>
                    </div>
                `;
                matchesList.appendChild(matchRow);
            });
            
            dateSection.appendChild(matchesList);
            contentDaily.appendChild(dateSection);
        });

        if (dates.length === 0) {
            contentDaily.innerHTML = '<div class="text-center py-12 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">لا توجد نتائج تطابق بحثك</div>';
        }
    }

    // Render Group Tables (Standings)
    function renderGroups(filter = '') {
        contentGroups.innerHTML = '';
        
        tournamentData.groups.forEach(group => {
            const hasTeamMatch = group.teams.some(t => t.name.toLowerCase().includes(filter.toLowerCase()));
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

            group.teams.forEach((team, idx) => {
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

    // Tab Switching
    tabDaily.addEventListener('click', () => {
        tabDaily.classList.add('tab-active', 'text-blue-600');
        tabDaily.classList.remove('text-slate-500');
        tabGroups.classList.remove('tab-active', 'text-blue-600');
        tabGroups.classList.add('text-slate-500');
        contentDaily.classList.remove('hidden');
        contentGroups.classList.add('hidden');
        renderDaily(searchInput.value);
    });

    tabGroups.addEventListener('click', () => {
        tabGroups.classList.add('tab-active', 'text-blue-600');
        tabGroups.classList.remove('text-slate-500');
        tabDaily.classList.remove('tab-active', 'text-blue-600');
        tabDaily.classList.add('text-slate-500');
        contentGroups.classList.remove('hidden');
        contentDaily.classList.add('hidden');
        renderGroups(searchInput.value);
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (!contentDaily.classList.contains('hidden')) {
            renderDaily(val);
        } else {
            renderGroups(val);
        }
    });

    // Initial Render
    renderDaily();
    renderGroups();
});
