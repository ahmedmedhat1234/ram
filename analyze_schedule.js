const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('data.js', 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(`${code}; this.tournamentData = tournamentData;`, context);

const tournamentData = context.tournamentData || { groups: [], matches: [] };

function parseDateLabel(label) {
  const m = String(label).match(/(\d{1,2})\/(\d{1,2})/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  return new Date(2025, month - 1, day);
}

function isPlayed(match) {
  return !Number.isNaN(parseInt(match.score1, 10)) && !Number.isNaN(parseInt(match.score2, 10));
}

const targetMatchesPerTeam = 3;
const teamPlayed = new Map();

for (const group of tournamentData.groups || []) {
  for (const team of group.teams || []) {
    teamPlayed.set(team.name, 0);
  }
}

for (const match of tournamentData.matches || []) {
  if (!isPlayed(match)) continue;
  teamPlayed.set(match.team1, (teamPlayed.get(match.team1) || 0) + 1);
  teamPlayed.set(match.team2, (teamPlayed.get(match.team2) || 0) + 1);
}

const teamsWithRemaining = [...teamPlayed.entries()]
  .map(([team, played]) => ({ team, played, remaining: Math.max(0, targetMatchesPerTeam - played) }))
  .filter(item => item.remaining > 0)
  .sort((a, b) => b.remaining - a.remaining || a.team.localeCompare(b.team, 'ar'));

const unplayedByTeam = new Map();
for (const match of tournamentData.matches || []) {
  if (isPlayed(match)) continue;
  const date = parseDateLabel(match.date);
  if (!date) continue;

  for (const team of [match.team1, match.team2]) {
    if (!unplayedByTeam.has(team)) unplayedByTeam.set(team, []);
    unplayedByTeam.get(team).push({ date, dateLabel: match.date, time: match.time, opponent: team === match.team1 ? match.team2 : match.team1 });
  }
}

const backToBackTeams = [];
for (const [team, fixtures] of unplayedByTeam.entries()) {
  fixtures.sort((a, b) => a.date - b.date || String(a.time).localeCompare(String(b.time), 'ar'));
  const pairs = [];
  for (let i = 1; i < fixtures.length; i += 1) {
    const diffDays = Math.round((fixtures[i].date - fixtures[i - 1].date) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      pairs.push([fixtures[i - 1], fixtures[i]]);
    }
  }
  if (pairs.length) backToBackTeams.push({ team, pairs });
}

console.log('الفرق المتبقي لها مباريات (على أساس 3 مباريات لكل فريق):');
for (const item of teamsWithRemaining) {
  console.log(`- ${item.team}: لعب ${item.played} / 3، متبقي ${item.remaining}`);
}

console.log('\nالفرق التي ستلعب يومين متتاليين (في المباريات غير الملعوبة):');
for (const row of backToBackTeams.sort((a, b) => a.team.localeCompare(b.team, 'ar'))) {
  for (const [m1, m2] of row.pairs) {
    console.log(`- ${row.team}: ${m1.dateLabel} (${m1.time}) ضد ${m1.opponent} ثم ${m2.dateLabel} (${m2.time}) ضد ${m2.opponent}`);
  }
}
