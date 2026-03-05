const fs = require('fs');
const vm = require('vm');

function loadData() {
  const code = fs.readFileSync('data.js', 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${code}; this.tournamentData = tournamentData;`, context);
  return context.tournamentData || { groups: [], matches: [] };
}

function isPlayed(match) {
  return !Number.isNaN(parseInt(match.score1, 10)) && !Number.isNaN(parseInt(match.score2, 10));
}

function compareTeamsWithTiebreak(a, b, matches = []) {
  if (b.points !== a.points) return b.points - a.points;

  const headToHeadMatches = matches.filter(match => {
    const s1 = parseInt(match.score1, 10);
    const s2 = parseInt(match.score2, 10);
    if (Number.isNaN(s1) || Number.isNaN(s2)) return false;
    return (
      (match.team1 === a.name && match.team2 === b.name) ||
      (match.team1 === b.name && match.team2 === a.name)
    );
  });

  if (headToHeadMatches.length) {
    const hh = {
      [a.name]: { points: 0, gd: 0, gf: 0 },
      [b.name]: { points: 0, gd: 0, gf: 0 }
    };

    for (const match of headToHeadMatches) {
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
    }

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

function tableFromMatches(group, matches) {
  const table = new Map();
  for (const team of group.teams || []) {
    table.set(team.name, {
      name: team.name,
      played: 0,
      won: 0,
      draw: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0
    });
  }

  for (const match of matches) {
    if (Number(match.group) !== Number(group.id)) continue;
    const t1 = table.get(match.team1);
    const t2 = table.get(match.team2);
    if (!t1 || !t2) continue;
    const s1 = parseInt(match.score1, 10);
    const s2 = parseInt(match.score2, 10);
    if (Number.isNaN(s1) || Number.isNaN(s2)) continue;

    t1.played += 1; t2.played += 1;
    t1.gf += s1; t1.ga += s2;
    t2.gf += s2; t2.ga += s1;

    if (Number.isFinite(match.team1Points) || Number.isFinite(match.team2Points)) {
      t1.points += Number.isFinite(match.team1Points) ? Number(match.team1Points) : 0;
      t2.points += Number.isFinite(match.team2Points) ? Number(match.team2Points) : 0;
      if (s1 > s2) { t1.won += 1; t2.lost += 1; }
      else if (s2 > s1) { t2.won += 1; t1.lost += 1; }
      else { t1.draw += 1; t2.draw += 1; }
    } else if (s1 > s2) {
      t1.won += 1; t2.lost += 1; t1.points += 3;
    } else if (s2 > s1) {
      t2.won += 1; t1.lost += 1; t2.points += 3;
    } else {
      t1.draw += 1; t2.draw += 1; t1.points += 1; t2.points += 1;
    }
  }

  const rows = [...table.values()].map(team => ({ ...team, gd: team.gf - team.ga }));
  return rankGroupTeams(group.id, rows, matches);
}

function parseOverrides(args) {
  const overrides = new Map();
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== '--set') continue;
    const value = args[i + 1] || '';
    const parts = value.split('|').map(x => x.trim());
    if (parts.length !== 4) continue;
    const [team1, team2, score1Raw, score2Raw] = parts;
    const score1 = Number(score1Raw);
    const score2 = Number(score2Raw);
    if (!Number.isFinite(score1) || !Number.isFinite(score2)) continue;
    overrides.set(`${team1}__${team2}`, { score1, score2 });
    i += 1;
  }
  return overrides;
}

function enumerateGroupOutcomes(group, playedMatches, remainingMatches, overrides) {
  const scenarios = [];
  const outcomes = [[1, 0], [1, 1], [0, 1]];

  function rec(idx, currentMatches) {
    if (idx === remainingMatches.length) {
      const allMatches = [...playedMatches, ...currentMatches];
      const ranked = tableFromMatches(group, allMatches);
      scenarios.push({
        first: ranked[0]?.name,
        second: ranked[1]?.name,
        third: ranked[2] ? {
          name: ranked[2].name,
          points: ranked[2].points,
          gd: ranked[2].gd,
          gf: ranked[2].gf
        } : null,
        count: 1
      });
      return;
    }

    const match = remainingMatches[idx];
    const key = `${match.team1}__${match.team2}`;
    const forced = overrides.get(key);
    const choices = forced ? [[forced.score1, forced.score2]] : outcomes;

    for (const [s1, s2] of choices) {
      rec(idx + 1, [...currentMatches, { ...match, score1: s1, score2: s2, team1Points: undefined, team2Points: undefined }]);
    }
  }

  rec(0, []);

  const firstCounts = new Map();
  const secondCounts = new Map();
  const thirdDist = new Map();

  for (const s of scenarios) {
    firstCounts.set(s.first, (firstCounts.get(s.first) || 0) + s.count);
    secondCounts.set(s.second, (secondCounts.get(s.second) || 0) + s.count);
    if (s.third) {
      const k = JSON.stringify(s.third);
      const prev = thirdDist.get(k) || { ...s.third, p: 0 };
      prev.p += s.count;
      thirdDist.set(k, prev);
    }
  }

  const total = scenarios.reduce((acc, s) => acc + s.count, 0);
  return {
    groupId: group.id,
    total,
    firstCounts,
    secondCounts,
    thirdDist: [...thirdDist.values()].map(x => ({ ...x, p: x.p / total }))
  };
}

function betterThird(a, b) {
  if (a.points !== b.points) return a.points > b.points;
  if (a.gd !== b.gd) return a.gd > b.gd;
  if (a.gf !== b.gf) return a.gf > b.gf;
  return a.name.localeCompare(b.name, 'ar') < 0;
}

function poissonBinomialAtMost(probs, maxSuccesses) {
  let dp = [1];
  for (const p of probs) {
    const next = new Array(dp.length + 1).fill(0);
    for (let k = 0; k < dp.length; k += 1) {
      next[k] += dp[k] * (1 - p);
      next[k + 1] += dp[k] * p;
    }
    dp = next;
  }
  let sum = 0;
  for (let k = 0; k <= maxSuccesses && k < dp.length; k += 1) sum += dp[k];
  return sum;
}

function main() {
  const tournamentData = loadData();
  const overrides = parseOverrides(process.argv.slice(2));
  const allMatches = tournamentData.matches || [];
  const playedMatches = allMatches.filter(isPlayed);

  const groupOutcomes = [];
  for (const group of tournamentData.groups || []) {
    const groupRemaining = allMatches.filter(m => Number(m.group) === Number(group.id) && !isPlayed(m));
    groupOutcomes.push(enumerateGroupOutcomes(group, playedMatches, groupRemaining, overrides));
  }

  const teams = [];
  for (const group of tournamentData.groups || []) {
    for (const team of group.teams || []) teams.push({ name: team.name, groupId: group.id });
  }

  const firstProb = new Map();
  const secondProb = new Map();
  for (const t of teams) { firstProb.set(t.name, 0); secondProb.set(t.name, 0); }

  for (const g of groupOutcomes) {
    for (const [team, c] of g.firstCounts.entries()) firstProb.set(team, c / g.total);
    for (const [team, c] of g.secondCounts.entries()) secondProb.set(team, c / g.total);
  }

  const groupById = new Map(groupOutcomes.map(g => [Number(g.groupId), g]));
  const thirdProb = new Map();
  for (const t of teams) thirdProb.set(t.name, 0);

  for (const t of teams) {
    const g = groupById.get(Number(t.groupId));
    const ownOutcomes = g.thirdDist.filter(o => o.name === t.name);
    if (!ownOutcomes.length) continue;

    for (const own of ownOutcomes) {
      const betterProbs = [];
      for (const otherGroup of groupOutcomes) {
        if (Number(otherGroup.groupId) === Number(t.groupId)) continue;
        let pBetter = 0;
        for (const otherThird of otherGroup.thirdDist) {
          if (betterThird(otherThird, own)) pBetter += otherThird.p;
        }
        betterProbs.push(pBetter);
      }

      const qualifyGivenOwn = poissonBinomialAtMost(betterProbs, 5);
      thirdProb.set(t.name, thirdProb.get(t.name) + own.p * qualifyGivenOwn);
    }
  }

  const result = teams.map(t => {
    const first = firstProb.get(t.name) || 0;
    const second = secondProb.get(t.name) || 0;
    const third = thirdProb.get(t.name) || 0;
    return {
      group: t.groupId,
      team: t.name,
      first: first * 100,
      second: second * 100,
      bestThird: third * 100,
      qualify: (first + second + third) * 100
    };
  }).sort((a, b) => b.qualify - a.qualify || a.group - b.group || a.team.localeCompare(b.team, 'ar'));

  console.log('احتمالات الصعود الدقيقة (كل الاحتمالات الممكنة لنتائج المباريات المتبقية بنظام فوز/تعادل/خسارة):');
  for (const row of result) {
    console.log(
      `المجموعة ${row.group} | ${row.team} | صعود مباشر ${row.first.toFixed(2)}% / ${row.second.toFixed(2)}% | أفضل ثالث ${row.bestThird.toFixed(2)}% | إجمالي ${row.qualify.toFixed(2)}%`
    );
  }
}

main();
