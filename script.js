document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const tabDaily = document.getElementById('tab-daily');
    const tabGroups = document.getElementById('tab-groups');
    const tabStats = document.getElementById('tab-stats');
    const tabDisciplinary = document.getElementById('tab-disciplinary');
    const tabRules = document.getElementById('tab-rules');
    const tabKnockout = document.getElementById('tab-knockout');
    
    const contentDaily = document.getElementById('content-daily');
    const contentGroups = document.getElementById('content-groups');
    const contentStats = document.getElementById('content-stats');
    const contentDisciplinary = document.getElementById('content-disciplinary');
    const contentRules = document.getElementById('content-rules');
    const contentKnockout = document.getElementById('content-knockout');

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
        const numericMatch2 = text.match(/(\d+)\s*هدف/);
        if (numericMatch2) return parseInt(numericMatch2[1], 10);

        if (/سوبر\s*هاتريك/.test(text)) return 4;
        if (/هاتريك/.test(text)) return 3;
        if (/هدف(?:ان|ين)/.test(text)) return 2;

        return 1;
    }


    function compareTeamsWithTiebreak(a, b, matches = []) {
        if (b.points !== a.points) return b.points - a.points;

        const headToHeadMatches = matches.filter(match => {
            const s1 = parseInt(match.score1, 10);
            const s2 = parseInt(match.score2, 10);
            if (isNaN(s1) || isNaN(s2)) return false;
            return (match.team1 === a.name && match.team2 === b.name) || (match.team1 === b.name && match.team2 === a.name);
        });

        if (headToHeadMatches.length) {
            const hh = {
                [a.name]: { points: 0, gd: 0, gf: 0 },
                [b.name]: { points: 0, gd: 0, gf: 0 }
            };

            headToHeadMatches.forEach(match => {
                const s1 = parseInt(match.score1, 10);
                const s2 = parseInt(match.score2, 10);

                hh[match.team1].gf += s1;
                hh[match.team1].gd += (s1 - s2);
                hh[match.team2].gf += s2;
                hh[match.team2].gd += (s2 - s1);

                if (Number.isFinite(match.team1Points) || Number.isFinite(match.team2Points)) {
                    hh[match.team1].points += Number.isFinite(match.team1Points) ? Number(match.team1Points) : 0;
                    hh[match.team2].points += Number.isFinite(match.team2Points) ? Number(match.team2Points) : 0;
                } else if (s1 > s2) {
                    hh[match.team1].points += 3;
                } else if (s2 > s1) {
                    hh[match.team2].points += 3;
                } else {
                    hh[match.team1].points += 1;
                    hh[match.team2].points += 1;
                }
            });

            if (hh[b.name].points !== hh[a.name].points) return hh[b.name].points - hh[a.name].points;
            if (hh[b.name].gd !== hh[a.name].gd) return hh[b.name].gd - hh[a.name].gd;
            if (hh[b.name].gf !== hh[a.name].gf) return hh[b.name].gf - hh[a.name].gf;
        }

        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.name.localeCompare(b.name, 'ar');
    }

    function rankGroupTeams(groupId, teamRows, matches) {
        const groupMatches = (matches || []).filter(match => Number(match.group) === Number(groupId));
        return [...teamRows].sort((a, b) => compareTeamsWithTiebreak(a, b, groupMatches));
    }

    function getQualificationSnapshot(iterations = 4000) {
        const groups = tournamentData.groups || [];
        const allMatches = tournamentData.matches || [];
        const playedMatches = allMatches.filter(match => !isNaN(parseInt(match.score1, 10)) && !isNaN(parseInt(match.score2, 10)));
        const remainingMatches = allMatches.filter(match => isNaN(parseInt(match.score1, 10)) || isNaN(parseInt(match.score2, 10)));
        const scenarios = remainingMatches.length ? iterations : 1;

        const qualifyCount = {};
        const firstCount = {};
        const secondCount = {};
        const bestThirdCount = {};
        const teamGroup = {};

        groups.forEach(group => (group.teams || []).forEach(team => {
            qualifyCount[team.name] = 0;
            firstCount[team.name] = 0;
            secondCount[team.name] = 0;
            bestThirdCount[team.name] = 0;
            teamGroup[team.name] = group.id;
        }));

        for (let i = 0; i < scenarios; i += 1) {
            const scenarioMatches = [...playedMatches];
            remainingMatches.forEach(match => {
                const r = Math.random();
                let score1 = 1;
                let score2 = 1;
                if (r < 1 / 3) {
                    score1 = 1;
                    score2 = 0;
                } else if (r < 2 / 3) {
                    score1 = 1;
                    score2 = 1;
                } else {
                    score1 = 0;
                    score2 = 1;
                }
                scenarioMatches.push({ ...match, score1, score2, team1Points: undefined, team2Points: undefined });
            });

            const groupTables = new Map();
            groups.forEach(group => {
                const table = new Map();
                (group.teams || []).forEach(team => {
                    table.set(team.name, { name: team.name, played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 });
                });

                scenarioMatches.forEach(match => {
                    if (Number(match.group) !== Number(group.id)) return;
                    const t1 = table.get(match.team1);
                    const t2 = table.get(match.team2);
                    if (!t1 || !t2) return;

                    const s1 = parseInt(match.score1, 10);
                    const s2 = parseInt(match.score2, 10);
                    if (isNaN(s1) || isNaN(s2)) return;

                    t1.played += 1;
                    t2.played += 1;
                    t1.gf += s1;
                    t1.ga += s2;
                    t2.gf += s2;
                    t2.ga += s1;

                    if (Number.isFinite(match.team1Points) || Number.isFinite(match.team2Points)) {
                        t1.points += Number.isFinite(match.team1Points) ? Number(match.team1Points) : 0;
                        t2.points += Number.isFinite(match.team2Points) ? Number(match.team2Points) : 0;
                        if (s1 > s2) {
                            t1.won += 1;
                            t2.lost += 1;
                        } else if (s2 > s1) {
                            t2.won += 1;
                            t1.lost += 1;
                        } else {
                            t1.draw += 1;
                            t2.draw += 1;
                        }
                    } else if (s1 > s2) {
                        t1.won += 1;
                        t2.lost += 1;
                        t1.points += 3;
                    } else if (s2 > s1) {
                        t2.won += 1;
                        t1.lost += 1;
                        t2.points += 3;
                    } else {
                        t1.draw += 1;
                        t2.draw += 1;
                        t1.points += 1;
                        t2.points += 1;
                    }
                });

                const ranked = rankGroupTeams(group.id, [...table.values()].map(team => ({ ...team, gd: team.gf - team.ga })), scenarioMatches);
                groupTables.set(group.id, ranked);
            });

            const thirdTeams = [];
            groupTables.forEach((ranked, groupId) => {
                if (ranked[0]) {
                    qualifyCount[ranked[0].name] += 1;
                    firstCount[ranked[0].name] += 1;
                }
                if (ranked[1]) {
                    qualifyCount[ranked[1].name] += 1;
                    secondCount[ranked[1].name] += 1;
                }
                if (ranked[2]) thirdTeams.push({ ...ranked[2], groupId });
            });

            thirdTeams
                .sort((a, b) => {
                    if (b.points !== a.points) return b.points - a.points;
                    if (b.gd !== a.gd) return b.gd - a.gd;
                    if (b.gf !== a.gf) return b.gf - a.gf;
                    return a.name.localeCompare(b.name, 'ar');
                })
                .slice(0, 6)
                .forEach(team => {
                    qualifyCount[team.name] += 1;
                    bestThirdCount[team.name] += 1;
                });
        }

        const chancesByTeam = {};
        const firstChanceByTeam = {};
        const secondChanceByTeam = {};
        const bestThirdChanceByTeam = {};
        Object.keys(qualifyCount).forEach(team => {
            chancesByTeam[team] = scenarios ? (qualifyCount[team] / scenarios) * 100 : 0;
            firstChanceByTeam[team] = scenarios ? (firstCount[team] / scenarios) * 100 : 0;
            secondChanceByTeam[team] = scenarios ? (secondCount[team] / scenarios) * 100 : 0;
            bestThirdChanceByTeam[team] = scenarios ? (bestThirdCount[team] / scenarios) * 100 : 0;
        });

        const guaranteed = Object.entries(chancesByTeam)
            .filter(([, chance]) => chance >= 99.999)
            .map(([team]) => ({ team, groupId: teamGroup[team] }));

        return {
            chancesByTeam,
            firstChanceByTeam,
            secondChanceByTeam,
            bestThirdChanceByTeam,
            guaranteed,
            guaranteedSet: new Set(guaranteed.map(item => `${item.groupId}|${item.team}`))
        };
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

            if (Number.isFinite(match.team1Points) || Number.isFinite(match.team2Points)) {
                team1.points += Number.isFinite(match.team1Points) ? Number(match.team1Points) : 0;
                team2.points += Number.isFinite(match.team2Points) ? Number(match.team2Points) : 0;
                if (s1 > s2) {
                    team1.won += 1;
                    team2.lost += 1;
                } else if (s2 > s1) {
                    team2.won += 1;
                    team1.lost += 1;
                } else {
                    team1.draw += 1;
                    team2.draw += 1;
                }
            } else if (s1 > s2) {
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
            const rowsUnsorted = [...teamsMap.values()].map(team => ({
                ...team,
                gd: team.gf - team.ga
            }));

            const rows = rankGroupTeams(groupId, rowsUnsorted, tournamentData.matches || []);

            result.set(groupId, rows);
        });

        return result;
    }

    function getRemainingMatchesByGroup() {
        const remaining = new Map();
        (tournamentData.matches || []).forEach(match => {
            const s1 = parseInt(match.score1, 10);
            const s2 = parseInt(match.score2, 10);
            const isPlayed = !isNaN(s1) && !isNaN(s2);
            if (isPlayed) return;

            const groupId = Number(match.group);
            if (!remaining.has(groupId)) remaining.set(groupId, new Map());
            const groupMap = remaining.get(groupId);
            groupMap.set(match.team1, (groupMap.get(match.team1) || 0) + 1);
            groupMap.set(match.team2, (groupMap.get(match.team2) || 0) + 1);
        });
        return remaining;
    }

    function getQualifiedTeamsData() {
        const guaranteed = [];
        const guaranteedSet = new Set();

        (tournamentData.groups || []).forEach(group => {
            const teams = (group.teams || []).map(team => team.name);
            if (teams.length < 2) return;

            const points = Object.fromEntries(teams.map(name => [name, 0]));
            const pairResult = new Map();

            (tournamentData.matches || []).forEach(match => {
                if (Number(match.group) !== Number(group.id)) return;
                if (!teams.includes(match.team1) || !teams.includes(match.team2)) return;

                const s1 = parseInt(match.score1, 10);
                const s2 = parseInt(match.score2, 10);
                if (isNaN(s1) || isNaN(s2)) return;

                const pairKey = [match.team1, match.team2].sort((a, b) => a.localeCompare(b, 'ar')).join('|');
                pairResult.set(pairKey, { team1: match.team1, team2: match.team2, score1: s1, score2: s2 });
            });

            pairResult.forEach(result => {
                if (result.score1 > result.score2) points[result.team1] += 3;
                else if (result.score2 > result.score1) points[result.team2] += 3;
                else {
                    points[result.team1] += 1;
                    points[result.team2] += 1;
                }
            });

            const remainingPairs = [];
            for (let i = 0; i < teams.length; i += 1) {
                for (let j = i + 1; j < teams.length; j += 1) {
                    const pairKey = [teams[i], teams[j]].sort((a, b) => a.localeCompare(b, 'ar')).join('|');
                    if (!pairResult.has(pairKey)) {
                        remainingPairs.push({ team1: teams[i], team2: teams[j] });
                    }
                }
            }

            const worstRank = Object.fromEntries(teams.map(name => [name, 1]));

            function evaluateScenario(matchIndex, scenarioPoints) {
                if (matchIndex >= remainingPairs.length) {
                    teams.forEach(teamName => {
                        const teamPoints = scenarioPoints[teamName] || 0;
                        const higherTeams = teams.filter(other => (scenarioPoints[other] || 0) > teamPoints).length;
                        const equalTeams = teams.filter(other => other !== teamName && (scenarioPoints[other] || 0) === teamPoints).length;
                        worstRank[teamName] = Math.max(worstRank[teamName], higherTeams + equalTeams + 1);
                    });
                    return;
                }

                const match = remainingPairs[matchIndex];

                scenarioPoints[match.team1] = (scenarioPoints[match.team1] || 0) + 3;
                evaluateScenario(matchIndex + 1, scenarioPoints);
                scenarioPoints[match.team1] -= 3;

                scenarioPoints[match.team1] = (scenarioPoints[match.team1] || 0) + 1;
                scenarioPoints[match.team2] = (scenarioPoints[match.team2] || 0) + 1;
                evaluateScenario(matchIndex + 1, scenarioPoints);
                scenarioPoints[match.team1] -= 1;
                scenarioPoints[match.team2] -= 1;

                scenarioPoints[match.team2] = (scenarioPoints[match.team2] || 0) + 3;
                evaluateScenario(matchIndex + 1, scenarioPoints);
                scenarioPoints[match.team2] -= 3;
            }

            evaluateScenario(0, { ...points });

            teams.forEach(teamName => {
                if (worstRank[teamName] <= 2) {
                    guaranteed.push({ groupId: group.id, team: teamName });
                    guaranteedSet.add(teamName);
                }
            });
        });

        return { guaranteed, guaranteedSet };
    }

    function getExpectedQualificationData() {
        const expected = [];

        (tournamentData.groups || []).forEach(group => {
            const teams = (group.teams || []).map(team => team.name);
            if (teams.length < 2) return;

            const currentPoints = Object.fromEntries(teams.map(name => [name, 0]));
            const playedPairs = new Map();

            (tournamentData.matches || []).forEach(match => {
                if (Number(match.group) !== Number(group.id)) return;
                if (!teams.includes(match.team1) || !teams.includes(match.team2)) return;

                const s1 = parseInt(match.score1, 10);
                const s2 = parseInt(match.score2, 10);
                if (isNaN(s1) || isNaN(s2)) return;

                const pairKey = [match.team1, match.team2].sort((a, b) => a.localeCompare(b, 'ar')).join('|');
                playedPairs.set(pairKey, true);

                if (s1 > s2) currentPoints[match.team1] += 3;
                else if (s2 > s1) currentPoints[match.team2] += 3;
                else {
                    currentPoints[match.team1] += 1;
                    currentPoints[match.team2] += 1;
                }
            });

            const remainingPairs = [];
            for (let i = 0; i < teams.length; i += 1) {
                for (let j = i + 1; j < teams.length; j += 1) {
                    const pairKey = [teams[i], teams[j]].sort((a, b) => a.localeCompare(b, 'ar')).join('|');
                    if (!playedPairs.has(pairKey)) remainingPairs.push({ team1: teams[i], team2: teams[j] });
                }
            }

            const qualificationScore = Object.fromEntries(teams.map(name => [name, 0]));
            const totalScenarios = Math.pow(3, remainingPairs.length);

            function evaluateScenario(matchIndex, scenarioPoints) {
                if (matchIndex >= remainingPairs.length) {
                    const tiers = [...teams]
                        .sort((a, b) => (scenarioPoints[b] || 0) - (scenarioPoints[a] || 0))
                        .reduce((acc, team) => {
                            const pts = scenarioPoints[team] || 0;
                            const last = acc[acc.length - 1];
                            if (!last || last.points !== pts) acc.push({ points: pts, teams: [team] });
                            else last.teams.push(team);
                            return acc;
                        }, []);

                    let slots = 2;
                    tiers.forEach(tier => {
                        if (slots <= 0) return;
                        if (slots >= tier.teams.length) {
                            tier.teams.forEach(team => { qualificationScore[team] += 1; });
                            slots -= tier.teams.length;
                        } else {
                            const share = slots / tier.teams.length;
                            tier.teams.forEach(team => { qualificationScore[team] += share; });
                            slots = 0;
                        }
                    });
                    return;
                }

                const match = remainingPairs[matchIndex];

                scenarioPoints[match.team1] = (scenarioPoints[match.team1] || 0) + 3;
                evaluateScenario(matchIndex + 1, scenarioPoints);
                scenarioPoints[match.team1] -= 3;

                scenarioPoints[match.team1] = (scenarioPoints[match.team1] || 0) + 1;
                scenarioPoints[match.team2] = (scenarioPoints[match.team2] || 0) + 1;
                evaluateScenario(matchIndex + 1, scenarioPoints);
                scenarioPoints[match.team1] -= 1;
                scenarioPoints[match.team2] -= 1;

                scenarioPoints[match.team2] = (scenarioPoints[match.team2] || 0) + 3;
                evaluateScenario(matchIndex + 1, scenarioPoints);
                scenarioPoints[match.team2] -= 3;
            }

            evaluateScenario(0, { ...currentPoints });

            teams.forEach(team => {
                expected.push({
                    groupId: group.id,
                    team,
                    chance: totalScenarios ? ((qualificationScore[team] / totalScenarios) * 100) : 0
                });
            });
        });

        return expected.sort((a, b) => b.chance - a.chance);
    }

    function getNextScheduledMatchForTeam(teamName, fromMatchIndex) {
        const matches = tournamentData.matches || [];
        for (let i = fromMatchIndex + 1; i < matches.length; i += 1) {
            const nextMatch = matches[i];
            const involvesTeam = nextMatch.team1 === teamName || nextMatch.team2 === teamName;
            if (!involvesTeam) continue;

            const opponent = nextMatch.team1 === teamName ? nextMatch.team2 : nextMatch.team1;
            return `${nextMatch.date} - ${nextMatch.time} ضد ${opponent}`;
        }
        return 'لا توجد مباراة مجدولة';
    }

    // Helper to switch tabs
    function switchTab(activeTab, activeContent) {
        [tabDaily, tabGroups, tabStats, tabDisciplinary, tabRules, tabKnockout].forEach(tab => {
            if (tab) {
                tab.classList.remove('tab-active');
                tab.classList.add('text-slate-500');
                tab.classList.remove('text-sm', 'md:text-base');
                tab.classList.add('text-[10px]', 'md:text-sm');
            }
        });
        [contentDaily, contentGroups, contentStats, contentDisciplinary, contentRules, contentKnockout].forEach(content => {
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
        
        // Calculate team statistics
        let teamStats = {
            played: 0,
            won: 0,
            lost: 0,
            draw: 0,
            gf: 0,
            ga: 0
        };
        
        const playerStats = {};
        (tournamentData.matches || []).forEach(match => {
            const isTeam1 = match.team1 === teamName;
            const isTeam2 = match.team2 === teamName;
            if (!isTeam1 && !isTeam2) return;

            const score1 = parseInt(match.score1);
            const score2 = parseInt(match.score2);
            const isPlayed = !isNaN(score1) && !isNaN(score2);
            
            if (isPlayed) {
                teamStats.played += 1;
                if (isTeam1) {
                    teamStats.gf += score1;
                    teamStats.ga += score2;
                    if (score1 > score2) teamStats.won += 1;
                    else if (score1 < score2) teamStats.lost += 1;
                    else teamStats.draw += 1;
                } else {
                    teamStats.gf += score2;
                    teamStats.ga += score1;
                    if (score2 > score1) teamStats.won += 1;
                    else if (score2 < score1) teamStats.lost += 1;
                    else teamStats.draw += 1;
                }
            }

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
        const gd = teamStats.gf - teamStats.ga;
        const points = (teamStats.won * 3) + teamStats.draw;
        const avgGoals = teamStats.played > 0 ? (teamStats.gf / teamStats.played).toFixed(2) : '0.00';
        const avgAgainst = teamStats.played > 0 ? (teamStats.ga / teamStats.played).toFixed(2) : '0.00';
        
        let html = `
            <div class="mb-4 grid grid-cols-2 gap-2">
                <div class="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                    <div class="text-[10px] text-blue-600 font-bold uppercase mb-1">المباريات</div>
                    <div class="text-2xl font-black text-blue-700">${teamStats.played}</div>
                </div>
                <div class="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
                    <div class="text-[10px] text-emerald-600 font-bold uppercase mb-1">الفوز</div>
                    <div class="text-2xl font-black text-emerald-700">${teamStats.won}</div>
                </div>
                <div class="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
                    <div class="text-[10px] text-red-600 font-bold uppercase mb-1">الخسارة</div>
                    <div class="text-2xl font-black text-red-700">${teamStats.lost}</div>
                </div>
                <div class="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
                    <div class="text-[10px] text-amber-600 font-bold uppercase mb-1">التعادل</div>
                    <div class="text-2xl font-black text-amber-700">${teamStats.draw}</div>
                </div>
            </div>
            <div class="mb-4 grid grid-cols-3 gap-2">
                <div class="bg-orange-50 border border-orange-100 rounded-lg p-2 text-center">
                    <div class="text-[9px] text-orange-600 font-bold uppercase mb-0.5">له</div>
                    <div class="text-xl font-black text-orange-700">${teamStats.gf}</div>
                    <div class="text-[9px] text-orange-500 mt-0.5">معدل: ${avgGoals}</div>
                </div>
                <div class="bg-purple-50 border border-purple-100 rounded-lg p-2 text-center">
                    <div class="text-[9px] text-purple-600 font-bold uppercase mb-0.5">عليه</div>
                    <div class="text-xl font-black text-purple-700">${teamStats.ga}</div>
                    <div class="text-[9px] text-purple-500 mt-0.5">معدل: ${avgAgainst}</div>
                </div>
                <div class="bg-indigo-50 border border-indigo-100 rounded-lg p-2 text-center">
                    <div class="text-[9px] text-indigo-600 font-bold uppercase mb-0.5">الفارق</div>
                    <div class="text-xl font-black ${gd > 0 ? 'text-green-700' : gd < 0 ? 'text-red-700' : 'text-slate-700'}">${gd > 0 ? '+' : ''}${gd}</div>
                    <div class="text-[9px] text-indigo-500 mt-0.5">نقاط: ${points}</div>
                </div>
            </div>
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
        const qualificationSnapshot = getQualificationSnapshot();
        const qualifiedData = { guaranteed: qualificationSnapshot.guaranteed, guaranteedSet: qualificationSnapshot.guaranteedSet };
        const expectedData = Object.entries(qualificationSnapshot.chancesByTeam).map(([team, chance]) => ({
            team,
            groupId: ((tournamentData.groups || []).find(g => (g.teams || []).some(t => t.name === team)) || {}).id || '-',
            chance,
            firstChance: qualificationSnapshot.firstChanceByTeam[team] || 0,
            secondChance: qualificationSnapshot.secondChanceByTeam[team] || 0,
            bestThirdChance: qualificationSnapshot.bestThirdChanceByTeam[team] || 0
        })).sort((a, b) => b.chance - a.chance);

        const qualifiedCard = document.createElement('div');
        qualifiedCard.className = 'bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mb-4 md:col-span-2';
        qualifiedCard.innerHTML = `
            <div class="bg-emerald-50 border-b border-emerald-100 px-4 py-3 font-bold text-emerald-800 flex items-center justify-between text-sm">
                <span>المتأهلون</span>
                <i class="fas fa-star text-amber-500 text-xs"></i>
            </div>
            <div class="p-4 text-xs text-slate-600 leading-6">
                <div class="font-bold text-emerald-700 mb-2">إجمالي الفرق الصاعدة رسميًا (بعد اكتمال كل المباريات): ${qualifiedData.guaranteed.length}</div>
                ${qualifiedData.guaranteed.length ? qualifiedData.guaranteed.map(item => `<div>⭐ المجموعة ${item.groupId}: ${item.team}</div>`).join('') : '<div>لا يوجد فريق ضمن التأهل رسميًا حتى الآن وفق النظام الحالي (الأول والثاني + أفضل 6 ثوالث).</div>'}
            </div>
        `;
        contentGroups.appendChild(qualifiedCard);

        const expectedCard = document.createElement('div');
        expectedCard.className = 'bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mb-4 md:col-span-2';
        expectedCard.innerHTML = `
            <div class="bg-blue-50 border-b border-blue-100 px-4 py-3 font-bold text-blue-800 flex items-center justify-between text-sm">
                <span>الفرق المتوقع صعودها (احتمالات)</span>
                <i class="fas fa-chart-line text-blue-500 text-xs"></i>
            </div>
            <div class="p-4 text-xs text-slate-600 leading-6">
                <div class="text-[11px] text-slate-500 mb-2">مبنية على محاكاة حتى إكمال كل فريق 3 مباريات (المتبقي من دور المجموعات).</div>
                ${expectedData.map(item => `
                    <div class="py-1 border-b border-slate-100 last:border-b-0">
                        <div>${item.team} (المجموعة ${item.groupId}): <span class="font-bold text-blue-700">${item.chance.toFixed(1)}%</span></div>
                        <div class="text-[11px] text-slate-500">أول: ${item.firstChance.toFixed(1)}% | ثاني: ${item.secondChance.toFixed(1)}% | أفضل ثالث: ${item.bestThirdChance.toFixed(1)}%</div>
                    </div>
                `).join('')}
            </div>
        `;
        contentGroups.appendChild(expectedCard);

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
                            <tr>
                                <th class="px-2 py-2">الفريق</th>
                                <th class="px-1.5 py-2 text-center">ل</th>
                                <th class="px-1.5 py-2 text-center">ف</th>
                                <th class="px-1.5 py-2 text-center">ت</th>
                                <th class="px-1.5 py-2 text-center">خ</th>
                                <th class="px-1.5 py-2 text-center">له</th>
                                <th class="px-1.5 py-2 text-center">عليه</th>
                                <th class="px-1.5 py-2 text-center">+/-</th>
                                <th class="px-2 py-2 text-center text-blue-600">ن</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
            `;

            teams.forEach((team, idx) => {
                tableHTML += `
                    <tr class="hover:bg-slate-50 transition-colors cursor-pointer" onclick="window.openTeamModal('${team.name}')">
                        <td class="px-2 py-2.5 font-bold text-slate-800">${idx + 1}. ${team.name} <span class='text-[10px] text-blue-700'>(${(qualificationSnapshot.chancesByTeam[team.name] || 0).toFixed(1)}%)</span>${qualifiedData.guaranteedSet.has(`${group.id}|${team.name}`) ? ' ⭐' : ''}</td>
                        <td class="px-1.5 py-2.5 text-center text-slate-600 font-medium">${team.played}</td>
                        <td class="px-1.5 py-2.5 text-center text-emerald-600 font-bold">${team.won}</td>
                        <td class="px-1.5 py-2.5 text-center text-blue-600 font-bold">${team.draw}</td>
                        <td class="px-1.5 py-2.5 text-center text-red-600 font-bold">${team.lost}</td>
                        <td class="px-1.5 py-2.5 text-center text-slate-700 font-medium">${team.gf}</td>
                        <td class="px-1.5 py-2.5 text-center text-slate-700 font-medium">${team.ga}</td>
                        <td class="px-1.5 py-2.5 text-center text-slate-600 font-bold">${team.gd > 0 ? '+' : ''}${team.gd}</td>
                        <td class="px-2 py-2.5 text-center font-black text-blue-700 bg-blue-50/30">${team.points}</td>
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

        const topKeepers = Object.entries(cleanSheets).map(([keeper, count]) => {
            const teamName = keeper;
            return { name: keeper, team: teamName, cleanSheets: count };
        }).sort((a, b) => b.cleanSheets - a.cleanSheets).slice(0, 10);

        const bestAttack = Object.entries(teamStats).map(([name, s]) => ({ name, avg: (s.gf / s.p).toFixed(2) }))
            .sort((a, b) => b.avg - a.avg).slice(0, 5);
        
        const bestDefense = Object.entries(teamStats).map(([name, s]) => ({ name, avg: (s.ga / s.p).toFixed(2) }))
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

        (tournamentData.matches || []).forEach((match, matchIndex) => {
            [... (match.team1YellowCards || match.yellowCards || []), ... (match.team2YellowCards || [])].forEach(s => {
                const name = normalizePlayerName(s);
                yellows[name] = (yellows[name] || 0) + 1;
            });
            [... (match.team1RedCards || []), ... (match.team2RedCards || [])].forEach(r => {
                const name = normalizePlayerName(r);
                const team = (match.team1RedCards || []).includes(r) ? match.team1 : match.team2;
                const nextMatchText = getNextScheduledMatchForTeam(team, matchIndex);
                suspended.push({ name, team, match: nextMatchText });
            });
        });

        (tournamentData.stats?.suspendedPlayers || []).forEach(item => {
            suspended.push({
                name: item.name,
                team: item.team,
                match: item.suspendedMatch || item.reason || 'إيقاف المباراة القادمة'
            });
        });

        const suspensionSeen = new Set();
        const uniqueSuspended = suspended.filter(p => {
            const key = `${p.name}|${p.team}|${p.match}`;
            if (suspensionSeen.has(key)) return false;
            suspensionSeen.add(key);
            return true;
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

        const suspendedRows = uniqueSuspended.map((p, idx) => `
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
        const rules = (tournamentData.rules && tournamentData.rules.length)
            ? tournamentData.rules
            : [
                {
                    title: 'نظام التأهل',
                    content: 'يصعد أول وثاني كل مجموعة، بالإضافة إلى أفضل 6 فرق تحتل المركز الثالث على مستوى جميع المجموعات. وفي حالة تساوي النقاط يتم الاحتكام إلى: المواجهات المباشرة ثم فرق الأهداف ثم الأهداف المسجلة.'
                }
            ];
        rules.forEach(rule => {
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

    function renderKnockoutBracket() {
        contentKnockout.innerHTML = '';

        const createMatchBox = (label) => `
            <div class="bg-white border border-slate-200 rounded-xl p-2 text-[11px] md:text-xs font-black text-slate-500 text-center shadow-sm min-h-10 flex items-center justify-center">
                ${label}
            </div>
        `;

        const leftRound32 = Array.from({ length: 8 }, (_, i) => createMatchBox(`مباراة ${i + 1}`)).join('');
        const rightRound32 = Array.from({ length: 8 }, (_, i) => createMatchBox(`مباراة ${i + 9}`)).join('');

        const leftRound16 = Array.from({ length: 4 }, (_, i) => createMatchBox(`الفائز من ${i * 2 + 1} × ${i * 2 + 2}`)).join('');
        const rightRound16 = Array.from({ length: 4 }, (_, i) => createMatchBox(`الفائز من ${i * 2 + 9} × ${i * 2 + 10}`)).join('');

        const leftQuarter = Array.from({ length: 2 }, (_, i) => createMatchBox(`الفائز من ثمن ${i * 2 + 1} × ثمن ${i * 2 + 2}`)).join('');
        const rightQuarter = Array.from({ length: 2 }, (_, i) => createMatchBox(`الفائز من ثمن ${i * 2 + 5} × ثمن ${i * 2 + 6}`)).join('');

        const leftSemi = createMatchBox('الفائز من ربع 1 × ربع 2');
        const rightSemi = createMatchBox('الفائز من ربع 3 × ربع 4');

        const card = document.createElement('div');
        card.className = 'bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-6';
        card.innerHTML = `
            <div class="flex items-center justify-between flex-wrap gap-3 mb-5">
                <h3 class="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2">
                    <i class="fas fa-trophy text-amber-500"></i>
                    شجرة خروج المغلوب
                </h3>
                <span class="text-[11px] md:text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-black">تصاعد تلقائي: الفائز يتأهل للدور التالي</span>
            </div>

            <div class="overflow-x-auto">
                <div class="min-w-[1180px] grid grid-cols-[1fr_1fr_1fr_auto_1fr_1fr_1fr] gap-3 items-center">
                    <div class="space-y-2">${leftRound32}</div>
                    <div class="space-y-4">${leftRound16}</div>
                    <div class="space-y-8">${leftQuarter}</div>

                    <div class="flex flex-col items-center gap-2 px-2">
                        <div class="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-lg flex items-center justify-center">
                            <i class="fas fa-trophy text-lg"></i>
                        </div>
                        <div class="text-[10px] md:text-xs font-black text-slate-700">النهائي</div>
                        ${leftSemi}
                        <div class="text-slate-400 text-[10px] font-black">VS</div>
                        ${rightSemi}
                    </div>

                    <div class="space-y-8">${rightQuarter}</div>
                    <div class="space-y-4">${rightRound16}</div>
                    <div class="space-y-2">${rightRound32}</div>
                </div>
            </div>
        `;

        contentKnockout.appendChild(card);
    }

    // Tab Switching Events
    tabDaily.addEventListener('click', () => { switchTab(tabDaily, contentDaily); renderDaily(searchInput.value); });
    tabGroups.addEventListener('click', () => { switchTab(tabGroups, contentGroups); renderGroups(searchInput.value); });
    tabStats.addEventListener('click', () => { switchTab(tabStats, contentStats); renderStats(searchInput.value); });
    tabDisciplinary.addEventListener('click', () => { switchTab(tabDisciplinary, contentDisciplinary); renderDisciplinary(searchInput.value); });
    tabRules.addEventListener('click', () => { switchTab(tabRules, contentRules); renderRules(); });
    tabKnockout.addEventListener('click', () => { switchTab(tabKnockout, contentKnockout); renderKnockoutBracket(); });

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
    renderKnockoutBracket();
});
