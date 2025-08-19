import axios from 'axios';

export const importGithub = async (req, res) => {
  try {
    const { username, max = 5 } = req.body || {};
    if (!username) return res.status(400).json({ error: 'username is required' });

    let repos = [];
    try {
      const gh = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=${max}&sort=updated`);
      repos = gh.data || [];
    } catch (e) {
      // fallback: empty list on network error
      repos = [];
    }

    // Map to resume projects format
    const projects = repos.slice(0, max).map(r => ({
      name: r.name,
      description: r.description || 'Open-source project',
      technologies: (r.language || '') + (r.topics?.length ? `, ${r.topics.join(', ')}` : ''),
      link: r.html_url,
      duration: ''
    }));

    return res.json({ projects });
  } catch (error) {
    console.error('importGithub error', error);
    res.status(500).json({ error: 'Failed to import from GitHub: ' + error.message });
  }
};

export const importLinkedIn = async (req, res) => {
  try {
    // Safer approach: accept pasted profile text (no scraping)
    const { profileText } = req.body || {};
    if (!profileText || profileText.length < 50) {
      return res.status(400).json({ error: 'Provide profileText (copy-pasted LinkedIn profile text)' });
    }

    // Heuristic parse (very light) – real parsing can use AI on the server if configured
    const lines = profileText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const summary = lines.slice(0, 6).join(' ');
    const skills = Array.from(new Set(lines
      .filter(l => /skills|technologies|tools/i.test(l))
      .flatMap(l => l.split(/[:,]|•|\||-/))
      .map(s => s.trim())
      .filter(s => s && s.length <= 40)
    )).slice(0, 20);

    const experience = [];
    lines.forEach((l) => {
      const m = l.match(/^(?:\d+\.)?\s*(.+) at (.+) \((\d{4}.*?\d{4}|Present.*?)\)/i);
      if (m) {
        experience.push({ jobTitle: m[1], company: m[2], location: '', startDate: '', endDate: '', currentJob: /present/i.test(m[3]), responsibilities: '' });
      }
    });

    const education = [];
    lines.forEach((l) => {
      const m = l.match(/^(Bachelor|Master|B\.?Tech|M\.?Tech|BSc|MSc|BE|ME).+ at (.+)(?:, (.+))?/i);
      if (m) {
        education.push({ degree: m[0], institution: m[2] || '', location: m[3] || '', startDate: '', endDate: '', gpa: '', achievements: '' });
      }
    });

    return res.json({ summary, skills, experience, education });
  } catch (error) {
    console.error('importLinkedIn error', error);
    res.status(500).json({ error: 'Failed to import from LinkedIn text: ' + error.message });
  }
};
