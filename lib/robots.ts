interface RobotsGroup {
  agents: string[];
  rules: Array<{ kind: 'allow' | 'disallow'; path: string }>;
}

export function robotsAllows(
  source: string,
  pathname = '/',
  userAgent = 'iswebmcp-research',
): boolean {
  const groups: RobotsGroup[] = [];
  let group: RobotsGroup | undefined;
  let sawRule = false;

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (field === 'user-agent') {
      if (!group || sawRule) {
        group = { agents: [], rules: [] };
        groups.push(group);
        sawRule = false;
      }
      group.agents.push(value.toLowerCase());
      continue;
    }
    if ((field === 'allow' || field === 'disallow') && group) {
      group.rules.push({ kind: field, path: value });
      sawRule = true;
    }
  }

  const normalizedAgent = userAgent.toLowerCase();
  const matching = groups
    .map((candidate) => ({
      candidate,
      specificity: Math.max(
        ...candidate.agents.map((agent) =>
          agent === '*'
            ? 0
            : normalizedAgent.includes(agent)
              ? agent.length
              : -1,
        ),
      ),
    }))
    .filter(({ specificity }) => specificity >= 0);
  if (!matching.length) return true;
  const bestSpecificity = Math.max(
    ...matching.map(({ specificity }) => specificity),
  );
  const rules = matching
    .filter(({ specificity }) => specificity === bestSpecificity)
    .flatMap(({ candidate }) => candidate.rules)
    .filter((rule) => rule.path && pathname.startsWith(rule.path));
  if (!rules.length) return true;
  rules.sort(
    (a, b) => b.path.length - a.path.length || (a.kind === 'allow' ? -1 : 1),
  );
  return rules[0].kind === 'allow';
}
