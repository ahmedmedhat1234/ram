document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const tabDaily = document.getElementById('tab-daily');
    const tabGroups = document.getElementById('tab-groups');
    const contentDaily = document.getElementById('content-daily');
    const contentGroups = document.getElementById('content-groups');

    console.log('Tournament Data Loaded:', tournamentData);

    // Initialize UI
    document.getElementById('main-title').textContent = tournamentData.title;
    document.getElementById('main-subtitle').textContent = tournamentData.subtitle;
    document.getElementById('group-count').textContent = tournamentData.groupCount;

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

        // Sort dates if needed, but here we rely on the order in data.js
        const dates = Object.keys(groupedByDate);
        
        dates.forEach(date => {
            const dateSection = document.createElement('div');
            dateSection.className = 'bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6';
            
            const dateHeader = document.createElement('div');
            dateHeader.className = 'bg-blue-600 text-white px-6 py-3 font-bold text-lg flex items-center gap-3';
            dateHeader.innerHTML = `<i class="far fa-calendar-check"></i> ${date}`;
            dateSection.appendChild(dateHeader);

            const matchesList = document.createElement('div');
            matchesList.className = 'divide-y divide-slate-50';
            
            groupedByDate[date].forEach(match => {
                const matchRow = document.createElement('div');
                matchRow.className = 'p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-slate-50 transition-colors';
                matchRow.innerHTML = `
                    <div class="flex-1 text-center md:text-right font-semibold text-slate-700">${match.team1}</div>
                    <div class="flex flex-col items-center gap-1 px-4 min-w-[120px]">
                        <div class="text-blue-600 font-bold text-lg">${match.time}</div>
                        <div class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">مجموعة ${match.group}</div>
                    </div>
                    <div class="flex-1 text-center md:text-left font-semibold text-slate-700">${match.team2}</div>
                `;
                matchesList.appendChild(matchRow);
            });
            
            dateSection.appendChild(matchesList);
            contentDaily.appendChild(dateSection);
        });

        if (dates.length === 0) {
            contentDaily.innerHTML = '<div class="text-center py-12 text-slate-400">لا توجد نتائج تطابق بحثك</div>';
        }
    }

    // Render Group Tables
    function renderGroups(filter = '') {
        contentGroups.innerHTML = '';
        const groupedByGroup = {};
        
        for (let i = 1; i <= tournamentData.groupCount; i++) {
            groupedByGroup[i] = tournamentData.matches.filter(m => m.group === i);
        }

        Object.keys(groupedByGroup).forEach(groupNum => {
            const matches = groupedByGroup[groupNum];
            const hasMatch = matches.some(m => {
                const matchText = `${m.team1} ${m.team2} ${m.date}`.toLowerCase();
                return !filter || matchText.includes(filter.toLowerCase());
            });
            
            if (filter && !hasMatch) return;

            const groupCard = document.createElement('div');
            groupCard.className = 'bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group-card flex flex-col';
            
            const groupHeader = document.createElement('div');
            groupHeader.className = 'bg-slate-50 border-b border-slate-100 px-6 py-4 font-bold text-slate-800 flex items-center justify-between';
            groupHeader.innerHTML = `<span>المجموعة ${groupNum}</span> <i class="fas fa-users text-slate-300"></i>`;
            groupCard.appendChild(groupHeader);

            const matchesList = document.createElement('div');
            matchesList.className = 'p-4 space-y-3 flex-1';
            
            matches.forEach(match => {
                const matchText = `${match.team1} ${match.team2} ${match.date}`.toLowerCase();
                const isMatch = !filter || matchText.includes(filter.toLowerCase());
                
                const matchItem = document.createElement('div');
                matchItem.className = `p-3 rounded-xl border ${isMatch ? 'border-slate-100 bg-slate-50/50' : 'border-transparent opacity-40'} transition-all`;
                matchItem.innerHTML = `
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[10px] font-bold text-slate-400">${match.date}</span>
                        <span class="text-[10px] font-bold text-blue-500">${match.time}</span>
                    </div>
                    <div class="flex items-center justify-between gap-2 text-xs font-bold text-slate-700">
                        <span class="flex-1 text-right truncate">${match.team1}</span>
                        <span class="text-slate-300">×</span>
                        <span class="flex-1 text-left truncate">${match.team2}</span>
                    </div>
                `;
                matchesList.appendChild(matchItem);
            });
            
            groupCard.appendChild(matchesList);
            contentGroups.appendChild(groupCard);
        });

        if (contentGroups.children.length === 0) {
            contentGroups.innerHTML = '<div class="col-span-full text-center py-12 text-slate-400">لا توجد نتائج تطابق بحثك</div>';
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
