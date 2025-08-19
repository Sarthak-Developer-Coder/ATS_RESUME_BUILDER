import { model } from '../config/gemini.js';
import axios from 'axios';

const hasGeminiKey = !!process.env.GEMINI_API_KEY;

export const generateSummary = async (req, res) => {
  try {
    const { type, personalDetails } = req.body;

    if (!personalDetails || !personalDetails.fullName) {
      return res.status(400).json({ error: 'Personal details required' });
    }

    const prompt = type === 'fresher' 
      ? `Generate a professional summary for a fresh graduate/entry-level candidate with the following details:
         Name: ${personalDetails.fullName}
         Email: ${personalDetails.email || 'Not provided'}
         
         The summary should be 2-3 sentences highlighting their potential, education background, and career objectives. Make sure you generate the summary as you are the user. Make it ATS-friendly and professional. Return only the summary text without any additional formatting.`
      : `Generate an executive summary for an experienced professional with the following details:
         Name: ${personalDetails.fullName}
         Email: ${personalDetails.email || 'Not provided'}
         
         The summary should be 2-3 sentences highlighting their experience, expertise, and value proposition. Make sure you generate the summary as you are the user. Make it ATS-friendly and impactful. Return only the summary text without any additional formatting.`;

    // console.log('Generating summary with prompt:', prompt);

    if (!hasGeminiKey) {
      return res.json({ summary: 'Professional and motivated individual seeking to contribute value while continuing to grow skills and experience.' });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summaryText = response.text().trim();
    
    // console.log('Generated summary:', summaryText);
    
    res.json({ summary: summaryText });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Failed to generate summary: ' + error.message });
  }
};

export const generateSkills = async (req, res) => {
  try {
    const { personalDetails, existingSkills } = req.body;

    if (!personalDetails || !personalDetails.fullName) {
      return res.status(400).json({ error: 'Personal details required' });
    }

    const prompt = `Based on the following personal details, suggest 8-10 relevant technical and soft skills for a professional resume:
      Name: ${personalDetails.fullName}
      Email: ${personalDetails.email || 'Not provided'}
      
      Existing skills: ${existingSkills ? existingSkills.join(', ') : 'None'}
      
      Return a JSON array of skill strings. Example: ["Communication", "Problem Solving", "JavaScript", "Project Management"]`;

    // console.log('Generating skills with prompt:', prompt);

    if (!hasGeminiKey) {
      return res.json({ skills: [
        'Communication', 'Problem Solving', 'Teamwork', 'Time Management',
        'Adaptability', 'Analytical Skills', 'Creativity', 'Ownership'
      ]});
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();
    
    // console.log('AI Skills Response:', responseText);

    // Clean up the response to extract JSON array
    responseText = responseText.replace(/```json\s*/, '').replace(/```\s*$/, '');
    
    // Try to find JSON array in the response
    const jsonMatch = responseText.match(/\[.*\]/s);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }
    
    try {
      const skills = JSON.parse(responseText);
      if (Array.isArray(skills) && skills.length > 0) {
        res.json({ skills });
      } else {
        throw new Error('Invalid skills array');
      }
    } catch (parseError) {
      console.error('Skills JSON Parse Error:', parseError);
      console.error('Raw response:', responseText);
      // Fallback skills based on common professional skills
      const fallbackSkills = [
        'Communication', 'Problem Solving', 'Teamwork', 'Leadership',
        'Time Management', 'Adaptability', 'Critical Thinking', 'Creativity',
        'Project Management', 'Analytical Skills'
      ];
      res.json({ skills: fallbackSkills });
    }
  } catch (error) {
    console.error('Error generating skills:', error);
    res.status(500).json({ error: 'Failed to generate skills: ' + error.message });
  }
};

export const analyzeResume = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;

    if (!resumeData || !jobDescription) {
      return res.status(400).json({ error: 'Resume data and job description required' });
    }

    // Clean keyword extraction helper
    const extractKeywords = (text) => {
      return text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    };

    const jdKeywords = extractKeywords(jobDescription);
    const resumeKeywords = extractKeywords(JSON.stringify(resumeData));
    const missingKeywords = jdKeywords.filter(k => !resumeKeywords.includes(k));

    const prompt = `
You are an expert ATS resume evaluator.

Analyze the resume below against the job description. Score based on:
- Skills Match
- Experience Relevance
- Keywords
- Education

Use this JSON format (values are examples only):
{
  "overallScore": 78, // Must be average of detailedScores
  "detailedScores": [
    {"category": "Skills Match", "score": 80},
    {"category": "Experience Relevance", "score": 75},
    {"category": "Keywords", "score": 70},
    {"category": "Education", "score": 85}
  ],
  "missingKeywords": ["Node.js", "Express"],
  "suggestions": [
    "Mention Node.js and Express explicitly",
    "Highlight experience duration in years",
    "Add more technical terms from the job description"
  ]
}

Resume Data: ${JSON.stringify(resumeData)}
Job Description: ${jobDescription}

Ensure:
- Scores are realistic (0-100)
- Suggestions are practical
- overallScore is the average of detailedScores
- Output must be valid JSON only
`;

    console.log('Analyzing resume...');

    if (!hasGeminiKey) {
      return res.json({
        overallScore: 70,
        detailedScores: [
          { category: 'Skills Match', score: 68 },
          { category: 'Experience Relevance', score: 72 },
          { category: 'Keywords', score: 70 },
          { category: 'Education', score: 71 }
        ],
        missingKeywords: [],
        suggestions: [
          'Tailor skills to the job description',
          'Add specific achievements with metrics',
          'Include tools and technologies mentioned in the JD'
        ]
      });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();

    // Clean formatting if code blocks present
    responseText = responseText.replace(/```json\s*/, '').replace(/```\s*$/, '');

    // console.log('Analysis Response:', responseText);

    try {
      const analysis = JSON.parse(responseText);

      // Optional: overwrite missing keywords if model fails to extract properly
      if (!analysis.missingKeywords || !Array.isArray(analysis.missingKeywords)) {
        analysis.missingKeywords = missingKeywords.slice(0, 5); // limit to top 5
      }

      // Optional: re-compute overallScore if not accurate
      const scores = analysis.detailedScores?.map(d => d.score) || [];
      if (scores.length) {
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        analysis.overallScore = avgScore;
      }

      res.json(analysis);
    } catch (parseError) {
      console.error('Analysis JSON Parse Error:', parseError);
      // Fallback analysis
      res.json({
        overallScore: 70,
        detailedScores: [
          { category: "Skills Match", score: 70 },
          { category: "Experience Relevance", score: 65 },
          { category: "Keywords", score: 75 },
          { category: "Education", score: 80 }
        ],
        missingKeywords: missingKeywords.slice(0, 5),
        suggestions: [
          "Add more relevant keywords from the job description",
          "Highlight specific achievements with quantifiable results",
          "Include more technical skills mentioned in the job posting"
        ]
      });
    }
  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({ error: 'Failed to analyze resume: ' + error.message });
  }
};

// Parse a job description (or fetch by URL) into structured data
export const parseJobDescription = async (req, res) => {
  try {
    let { jobDescription, url } = req.body || {};

    if (url && !jobDescription) {
      try {
        const resp = await axios.get(url, { timeout: 10000 });
        // Basic text extraction from HTML
        const html = resp.data || '';
        jobDescription = String(html)
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      } catch (e) {
        // Ignore fetch errors, continue with jobDescription if provided
      }
    }

    if (!jobDescription || jobDescription.trim().length < 30) {
      return res.status(400).json({ error: 'Provide a valid job description or URL' });
    }

    const heuristicParse = () => {
      const text = jobDescription;
      const titleMatch = text.match(/(?:Title|Position|Role)\s*[:\-]\s*(.+)/i);
      const title = titleMatch ? titleMatch[1].split(/\.|\n/)[0].trim() : (text.split('\n')[0] || '').slice(0, 80);
      const locationMatch = text.match(/\b(Remote|Hybrid|Onsite|On-site|\b[A-Z][a-zA-Z]+,?\s?[A-Z]{2}\b|\b[A-Z][a-zA-Z]+,?\s?[A-Z][a-zA-Z]+\b)/);
      const employmentTypeMatch = text.match(/(Full[- ]?time|Part[- ]?time|Contract|Internship|Temporary)/i);
      const levelMatch = text.match(/(Senior|Mid[- ]?level|Junior|Lead|Principal|Staff)/i);
      const skills = Array.from(new Set((text.toLowerCase().match(/\b[a-z][a-z0-9\+\.#\-]{2,}\b/g) || [])
        .filter(w => w.length >= 3)
        .filter(w => !['with','and','for','the','this','that','have','will','your','from','you','our','are','job','role','must','need','work','team','skills','experience','requirements','years','year','about','who','a','an','of','in','to','as','on','is','be','or','it','we','they','their','them','has','had','was','were','at','by','per','per','not','any','more','less','plus'].includes(w))
      ));
      // naive sentences => responsibilities
      const responsibilities = (text.match(/(Responsibilities|What you will do|Your impact)[:\-\s\n]+([\s\S]+)/i)?.[2] || text)
        .split(/[\n•\-\u2022]/)
        .map(s => s.trim())
        .filter(s => s.length > 25)
        .slice(0, 10);

      return {
        title: title || 'Unknown Title',
        level: levelMatch ? levelMatch[1] : 'Unspecified',
        location: locationMatch ? locationMatch[0] : 'Unspecified',
        employmentType: employmentTypeMatch ? employmentTypeMatch[1] : 'Unspecified',
        skills: skills.slice(0, 30),
        responsibilities,
        rawText: jobDescription
      };
    };

    if (!hasGeminiKey) {
      return res.json(heuristicParse());
    }

    const prompt = `You are a Job Description parser. Extract structured info from the JD below.
Return ONLY valid JSON with fields: {
  "title": string,
  "level": string, // e.g., Junior, Mid-level, Senior, Lead, Principal
  "location": string,
  "employmentType": string, // Full-time, Contract, etc
  "skills": string[], // 10-30 skills/keywords prioritized
  "responsibilities": string[] // 5-10 concise bullets
}
JD: ${jobDescription}`;

    const result = await model.generateContent(prompt);
    let text = (await result.response).text().trim();
    text = text.replace(/```json\s*/i, '').replace(/```\s*$/i, '');
    try {
      const data = JSON.parse(text);
      return res.json({ ...heuristicParse(), ...data });
    } catch {
      return res.json(heuristicParse());
    }
  } catch (error) {
    console.error('Error parsing JD:', error);
    res.status(500).json({ error: 'Failed to parse job description: ' + error.message });
  }
};

// Optimize/quantify bullet points against a JD
export const optimizeBullets = async (req, res) => {
  try {
    const { experience = [], jobDescription = '' } = req.body || {};
    const bullets = [];

    const flattenBullets = (str) => (String(str || '')
      .split(/\r?\n|•|\u2022|\-|\*/)
      .map(s => s.trim())
      .filter(Boolean));

    experience.forEach((exp) => {
      const lines = Array.isArray(exp.responsibilities) ? exp.responsibilities.flatMap(flattenBullets) : flattenBullets(exp.responsibilities);
      lines.forEach(line => bullets.push({
        company: exp.company || '',
        jobTitle: exp.jobTitle || '',
        original: line
      }));
    });

    const heuristic = () => {
      const jdWords = (jobDescription.toLowerCase().match(/\b[a-z0-9\+\.\-]{3,}\b/g) || []);
      const topJD = Array.from(new Set(jdWords)).slice(0, 10);
      return bullets.map(b => {
        // simple quantifier injection and keyword boost
        let suggestion = b.original;
        if (!/\d/.test(suggestion)) {
          suggestion = suggestion.replace(/^(Led|Built|Created|Implemented|Developed|Improved|Optimized|Managed|Designed)?/i,
            (m) => (m || 'Improved') + ' ').trim();
          suggestion += ' resulting in [X%] improvement';
        }
        const boost = topJD.find(k => !suggestion.toLowerCase().includes(k))
        if (boost) suggestion += ` using ${boost}`;
        return { ...b, suggestion };
      });
    };

    if (!hasGeminiKey) {
      return res.json({ bullets: heuristic() });
    }

    const prompt = `You are a resume coach. Improve each bullet for impact, quantify results, and align to the JD.
Return ONLY JSON array of objects: [{original, suggestion}].
JD: ${jobDescription}
Bullets: ${JSON.stringify(bullets.map(b => ({ original: b.original })))}
`;
    const result = await model.generateContent(prompt);
    let text = (await result.response).text().trim();
    text = text.replace(/```json\s*/i, '').replace(/```\s*$/i, '');
    try {
      const arr = JSON.parse(text);
      const merged = bullets.map((b, i) => ({ ...b, suggestion: arr[i]?.suggestion || b.original }));
      return res.json({ bullets: merged });
    } catch {
      return res.json({ bullets: heuristic() });
    }
  } catch (error) {
    console.error('Error optimizing bullets:', error);
    res.status(500).json({ error: 'Failed to optimize bullets: ' + error.message });
  }
};

// Generate a tailored cover letter
export const generateCoverLetter = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body || {};
    if (!resumeData || !resumeData.personalDetails || !jobDescription) {
      return res.status(400).json({ error: 'resumeData.personalDetails and jobDescription are required' });
    }

    const pd = resumeData.personalDetails || {};
    const name = pd.fullName || 'Candidate';
    const skills = (resumeData.skills || []).slice(0, 8).join(', ');

    const fallback = `Dear Hiring Manager,\n\nI am excited to apply for this role. With experience across projects and a strong foundation in ${skills || 'the required skills'}, I deliver results through collaboration, ownership, and continuous improvement. Highlights include successfully completing impactful projects and driving measurable outcomes.\n\nWhat attracts me to this position is the opportunity to contribute to ${name.split(' ')[0]}'s next team while growing expertise aligned with your job description. I look forward to bringing energy, curiosity, and reliable execution.\n\nThank you for your time.\n\nSincerely,\n${name}`;

    if (!hasGeminiKey) {
      return res.json({ coverLetter: fallback });
    }

    const prompt = `Write a concise, one-page cover letter tailored to the job description using the candidate's resume. Return plain text only.\n\nResume: ${JSON.stringify(resumeData)}\n\nJob Description: ${jobDescription}`;
    const result = await model.generateContent(prompt);
    const text = (await result.response).text().trim();
    return res.json({ coverLetter: text || fallback });
  } catch (error) {
    console.error('Error generating cover letter:', error);
    res.status(500).json({ error: 'Failed to generate cover letter: ' + error.message });
  }
};

// Detect ATS issues (formatting/content heuristics)
export const detectATSIssues = async (req, res) => {
  try {
    const { resumeData } = req.body || {};
    if (!resumeData) return res.status(400).json({ error: 'resumeData is required' });

    const issues = { blockers: [], warnings: [], recommendations: [] };

    const pd = resumeData.personalDetails || {};
    if (!pd.email) issues.blockers.push('Email address is missing');
    if (!pd.fullName) issues.blockers.push('Full name is missing');
    if (!pd.phone) issues.warnings.push('Phone number not provided');

    if (!resumeData.summary || String(resumeData.summary).trim().length < 40) {
      issues.warnings.push('Summary is too short. Aim for 2-3 impactful sentences.');
    }
    if (!Array.isArray(resumeData.skills) || resumeData.skills.length < 5) {
      issues.recommendations.push('Add at least 8-12 relevant skills to pass keyword screens.');
    }
    const exp = Array.isArray(resumeData.experience) ? resumeData.experience : [];
    if (!exp.length) {
      issues.warnings.push('No experience entries found. Include internships or projects.');
    } else {
      const bullets = exp
        .map(e => String(e.responsibilities || ''))
        .join('\n');
      if (!/\d/.test(bullets)) {
        issues.recommendations.push('Quantify impact in bullets (numbers, %s, time saved).');
      }
    }
    const projects = Array.isArray(resumeData.projects) ? resumeData.projects : [];
    if (!projects.length) {
      issues.recommendations.push('Add 1-2 strong projects highlighting relevant tech and impact.');
    }

    return res.json(issues);
  } catch (error) {
    console.error('Error detecting ATS issues:', error);
    res.status(500).json({ error: 'Failed to detect ATS issues: ' + error.message });
  }
};

// Tailor resume summary and skills ordering to a JD
export const tailorResume = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body || {};
    if (!resumeData || !jobDescription) return res.status(400).json({ error: 'resumeData and jobDescription are required' });

    const parsed = await (async () => {
      // locally call heuristic parser to avoid AI call twice
      const text = jobDescription;
      const skills = Array.from(new Set((text.toLowerCase().match(/\b[a-z][a-z0-9\+\.#\-]{3,}\b/g) || [])));
      return { skills };
    })();

    const currentSkills = Array.isArray(resumeData.skills) ? resumeData.skills.slice() : [];
    const prioritizedSkills = [
      ...currentSkills.filter(s => parsed.skills.includes(String(s).toLowerCase())),
      ...currentSkills.filter(s => !parsed.skills.includes(String(s).toLowerCase()))
    ];

    let summary = resumeData.summary || '';
    if (!summary || summary.length < 40) {
      const name = resumeData.personalDetails?.fullName || 'I';
      summary = `${name} is a motivated professional with experience in ${currentSkills.slice(0,4).join(', ')}. Strong focus on delivering measurable results aligned to role requirements.`;
    }

    if (hasGeminiKey) {
      try {
        const prompt = `Rewrite the resume summary to align with this job description in 2-3 sentences. Return plain text only.\nResume: ${JSON.stringify(resumeData)}\nJD: ${jobDescription}`;
        const result = await model.generateContent(prompt);
        const text = (await result.response).text().trim();
        if (text) summary = text;
      } catch {}
    }

    return res.json({
      updated: {
        ...resumeData,
        summary,
        skills: prioritizedSkills
      }
    });
  } catch (error) {
    console.error('Error tailoring resume:', error);
    res.status(500).json({ error: 'Failed to tailor resume: ' + error.message });
  }
};

// Polish text (grammar/style/tone)
export const polishText = async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'text is required' });
    const fallback = text.trim();
    if (!hasGeminiKey) return res.json({ text: fallback });
    const prompt = `Improve the following resume summary for grammar, clarity, conciseness, and professional tone. Keep first-person voice. Return plain text only.\n\n${text}`;
    const result = await model.generateContent(prompt);
    const t = (await result.response).text().trim();
    return res.json({ text: t || fallback });
  } catch (error) {
    console.error('Error polishing text:', error);
    res.status(500).json({ error: 'Failed to polish text: ' + error.message });
  }
};

// Translate summary to a target language
export const translateText = async (req, res) => {
  try {
    const { text, target = 'en' } = req.body || {};
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'text is required' });
    if (!hasGeminiKey) return res.json({ text });
    const prompt = `Translate to ${target}. Keep professional resume tone and first person. Return plain text only.\n\n${text}`;
    const result = await model.generateContent(prompt);
    const t = (await result.response).text().trim();
    return res.json({ text: t || text });
  } catch (error) {
    console.error('Error translating text:', error);
    res.status(500).json({ error: 'Failed to translate text: ' + error.message });
  }
};

// Keyword Gap Analysis (Resume vs JD)
export const keywordGapAnalysis = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body || {};
    if (!resumeData || !jobDescription) {
      return res.status(400).json({ error: 'resumeData and jobDescription are required' });
    }

    const textOfResume = JSON.stringify(resumeData || {}).toLowerCase();
    const textOfJD = String(jobDescription || '').toLowerCase();

    const STOP = new Set([
      'the','and','for','with','this','that','from','your','you','our','are','job','role','will','have','has','had','was','were','is','as','on','in','to','of','by','at','or','an','a','be','it','we','they','their','them','who','what','how','when','why','not','any','more','less','plus','years','year','experience','skills','requirements','responsibilities','about'
    ]);

    const tokenize = (t) => (t.match(/[a-z0-9\+#\.\-]{3,}/g) || [])
      .filter(w => !STOP.has(w))
      .map(w => w.replace(/\.$/, ''));

    const jdTokens = tokenize(textOfJD);
    const resumeTokens = tokenize(textOfResume);

    const freq = (arr) => arr.reduce((m, w) => (m[w] = (m[w] || 0) + 1, m), {});
    const jdFreq = freq(jdTokens);
    const resumeFreq = freq(resumeTokens);

    const uniqueJD = Array.from(new Set(jdTokens));
    const matched = uniqueJD.filter(k => resumeFreq[k]).map(k => ({ keyword: k, resumeCount: resumeFreq[k], jdWeight: jdFreq[k] }));
    const missing = uniqueJD.filter(k => !resumeFreq[k]).sort((a,b) => (jdFreq[b]||0) - (jdFreq[a]||0)).slice(0, 25);

    const coverage = uniqueJD.length ? Math.round((matched.length / uniqueJD.length) * 100) : 0;

    const suggestions = [
      ...(coverage < 60 ? ['Add more exact keywords from the JD into your skills and bullets.'] : []),
      ...(missing.length ? [`Consider including: ${missing.slice(0,10).join(', ')}`] : []),
      'Mirror phrasing used in the JD where truthful (avoid keyword stuffing).'
    ];

    if (!hasGeminiKey) {
      return res.json({ coverage, matchedKeywords: matched, missingKeywords: missing, suggestions });
    }

    try {
      const prompt = `You are an ATS optimizer. Given JD tokens and resume tokens with counts, suggest prioritized missing keywords and improvements. Return ONLY JSON with: {"coverage": number, "matchedKeywords": [{"keyword":string,"resumeCount":number,"jdWeight":number}], "missingKeywords": string[], "suggestions": string[]}.\n\nJD counts: ${JSON.stringify(jdFreq)}\nResume counts: ${JSON.stringify(resumeFreq)}`;
      const result = await model.generateContent(prompt);
      let t = (await result.response).text().trim();
      t = t.replace(/```json\s*/i, '').replace(/```\s*$/i, '');
      const ai = JSON.parse(t);
      // Fallback merge with heuristic if needed
      return res.json({
        coverage: typeof ai.coverage === 'number' ? ai.coverage : coverage,
        matchedKeywords: Array.isArray(ai.matchedKeywords) && ai.matchedKeywords.length ? ai.matchedKeywords : matched,
        missingKeywords: Array.isArray(ai.missingKeywords) && ai.missingKeywords.length ? ai.missingKeywords : missing,
        suggestions: Array.isArray(ai.suggestions) && ai.suggestions.length ? ai.suggestions : suggestions
      });
    } catch {
      return res.json({ coverage, matchedKeywords: matched, missingKeywords: missing, suggestions });
    }
  } catch (error) {
    console.error('Error in keyword gap analysis:', error);
    res.status(500).json({ error: 'Failed to analyze keyword gaps: ' + error.message });
  }
};

// Readability insights for resume content
export const readabilityInsights = async (req, res) => {
  try {
    const { resumeData } = req.body || {};
    if (!resumeData) return res.status(400).json({ error: 'resumeData is required' });

    const textBlocks = [];
    if (resumeData.summary) textBlocks.push({ section: 'Summary', text: String(resumeData.summary) });
    (resumeData.experience || []).forEach((e, idx) => {
      const t = [e.jobTitle, e.company, e.responsibilities].filter(Boolean).join('. ');
      if (t) textBlocks.push({ section: `Experience #${idx+1}`, text: String(t) });
    });
    (resumeData.projects || []).forEach((p, idx) => {
      const t = [p.name, p.description].filter(Boolean).join('. ');
      if (t) textBlocks.push({ section: `Project #${idx+1}`, text: String(t) });
    });

    const countSyllables = (word) => {
      const w = word.toLowerCase().replace(/[^a-z]/g,'');
      if (!w) return 0;
      // basic heuristic
      let syl = (w.match(/[aeiouy]{1,2}/g) || []).length;
      if (w.endsWith('e')) syl = Math.max(1, syl - 1);
      return Math.max(1, syl);
    };
    const splitSentences = (t) => t.split(/[.!?]+\s+/).filter(Boolean);
    const words = (t) => (t.match(/[A-Za-z']+/g) || []);
    const flesch = (t) => {
      const sents = splitSentences(t);
      const ws = words(t);
      const wordCount = ws.length || 1;
      const sentCount = sents.length || 1;
      const syllableCount = ws.reduce((a,w)=>a+countSyllables(w),0) || 1;
      const RE = 206.835 - 1.015 * (wordCount / sentCount) - 84.6 * (syllableCount / wordCount);
      return {
        readingEase: Math.max(0, Math.min(100, Math.round(RE))),
        wordsPerSentence: Math.round(wordCount / sentCount),
        syllablesPerWord: +(syllableCount / wordCount).toFixed(2)
      };
    };
    const passiveRegex = /\b(am|is|are|was|were|be|been|being)\b\s+\b(\w+ed|\w+en)\b/i;

    const results = textBlocks.map(b => {
      const m = flesch(b.text);
      const longSentences = splitSentences(b.text).filter(s => words(s).length > 25).length;
      const passive = passiveRegex.test(b.text);
      const score = m.readingEase;
      const tips = [];
      if (m.wordsPerSentence > 22) tips.push('Use shorter sentences (aim 12-18 words).');
      if (m.syllablesPerWord > 1.7) tips.push('Prefer simpler wording and reduce jargon.');
      if (longSentences) tips.push(`Split ${longSentences} long sentence(s) into concise bullets.`);
      if (passive) tips.push('Use active voice (Led, Built, Delivered) instead of passive.');
      if (!tips.length && score < 60) tips.push('Tighten phrasing to improve clarity.');
      return { section: b.section, metrics: m, longSentences, passiveVoice: passive, suggestions: tips };
    });

    if (!hasGeminiKey) {
      return res.json({ results });
    }

    try {
      const prompt = `You are a writing coach. Given these readability metrics, provide up to 2 extra micro-suggestions per section (plain text). Return ONLY JSON array of strings per section under key "extra" keeping order.\n\n${JSON.stringify(results)}`;
      const result = await model.generateContent(prompt);
      let t = (await result.response).text().trim();
      t = t.replace(/```json\s*/i, '').replace(/```\s*$/i, '');
      let extras = [];
      try { extras = JSON.parse(t); } catch { extras = []; }
      const merged = results.map((r,i) => ({ ...r, extra: Array.isArray(extras[i]) ? extras[i] : [] }));
      return res.json({ results: merged });
    } catch {
      return res.json({ results });
    }
  } catch (error) {
    console.error('Error generating readability insights:', error);
    res.status(500).json({ error: 'Failed to generate readability insights: ' + error.message });
  }
};

// Weave missing keywords into existing experience bullets responsibly
export const weaveKeywords = async (req, res) => {
  try {
    const { resumeData = {}, missingKeywords = [] } = req.body || {};
    const exp = Array.isArray(resumeData.experience) ? resumeData.experience : [];
    if (!exp.length || !Array.isArray(missingKeywords)) {
      return res.json({ experience: exp });
    }

    const topMissing = missingKeywords.slice(0, 15).map(k => String(k).toLowerCase());
    const toLines = (text) => String(text || '')
      .split(/\r?\n|•|\u2022|\-|\*/)
      .map(s => s.trim())
      .filter(Boolean);
    const fromLines = (lines) => lines.join('\n');

    const heuristicInject = (line) => {
      const lower = line.toLowerCase();
      const notPresent = topMissing.filter(k => !lower.includes(k));
      if (!notPresent.length) return line;
      // pick one keyword to weave in, prefer tech words
      const picked = notPresent[0];
      if (/(using|with|via|leveraging)\s+/i.test(line)) return `${line} ${picked}`;
      return `${line} using ${picked}`;
    };

    const updated = await (async () => {
      if (!hasGeminiKey) {
        return exp.map(e => {
          const lines = toLines(e.responsibilities);
          const newLines = lines.map(heuristicInject);
          return { ...e, responsibilities: fromLines(newLines) };
        });
      }
      try {
        const prompt = `Improve the following experience bullets by naturally weaving in these missing keywords when truthful. Maintain professional tone, avoid stuffing, and keep lines concise. Return ONLY a JSON array of strings per experience entry.\n\nMissing keywords: ${JSON.stringify(topMissing)}\n\nExperiences bullets arrays: ${JSON.stringify(exp.map(e => toLines(e.responsibilities)))}`;
        const result = await model.generateContent(prompt);
        let t = (await result.response).text().trim();
        t = t.replace(/```json\s*/i, '').replace(/```\s*$/i, '');
        const arr = JSON.parse(t); // array of arrays
        return exp.map((e, i) => ({ ...e, responsibilities: fromLines(Array.isArray(arr[i]) ? arr[i] : toLines(e.responsibilities)) }));
      } catch {
        return exp.map(e => {
          const lines = toLines(e.responsibilities);
          const newLines = lines.map(heuristicInject);
          return { ...e, responsibilities: fromLines(newLines) };
        });
      }
    })();

    return res.json({ experience: updated });
  } catch (error) {
    console.error('Error weaving keywords:', error);
    res.status(500).json({ error: 'Failed to weave keywords: ' + error.message });
  }
};

// Suggest optimal section order for the builder stepper
export const suggestSectionOrder = async (req, res) => {
  try {
    const { type = 'experienced', resumeData = {} } = req.body || {};

    const sections = [
      'Template',
      'Personal Details',
      'Summary',
      'Experience',
      'Projects',
      'Skills',
      'Education',
      'Achievements',
      'Hobbies'
    ];

    const hasExp = Array.isArray(resumeData.experience) && resumeData.experience.length > 0;
    const hasProjects = Array.isArray(resumeData.projects) && resumeData.projects.length > 0;

    const heuristic = () => {
      if (type === 'fresher') {
        // For freshers, prioritize Projects and Skills ahead of Experience
        return [
          'Template',
          'Personal Details',
          'Summary',
          'Projects',
          'Skills',
          'Education',
          'Experience',
          'Achievements',
          'Hobbies'
        ];
      }
      // Experienced: Experience comes before Projects; Skills before Education
      return [
        'Template',
        'Personal Details',
        'Summary',
        hasExp ? 'Experience' : (hasProjects ? 'Projects' : 'Experience'),
        hasProjects ? 'Projects' : 'Skills',
        'Skills',
        'Education',
        'Achievements'
      ];
    };

    if (!hasGeminiKey) {
      return res.json({ order: heuristic() });
    }

    const prompt = `You are a resume UX expert. Given the candidate type and content completeness, suggest an optimal order of sections for a resume builder stepper. Use this exact list of labels and include each at most once. Always start with "Template" then "Personal Details" then "Summary".

Valid labels: [${sections.map(s => '"' + s + '"').join(', ')}]
Candidate type: ${type}
Resume completeness: ${JSON.stringify({
      hasExp,
      expCount: (resumeData.experience || []).length || 0,
      hasProjects,
      projCount: (resumeData.projects || []).length || 0,
      skillsCount: (resumeData.skills || []).length || 0,
      eduCount: (resumeData.education || []).length || 0
    })}

Return ONLY a JSON array of labels in the recommended order.`;

    try {
      const result = await model.generateContent(prompt);
      let t = (await result.response).text().trim();
      t = t.replace(/```json\s*/i, '').replace(/```\s*$/i, '');
      const arr = JSON.parse(t);
      // sanitize: ensure only known labels, ensure leading trio
      const normalized = arr.filter(x => sections.includes(x));
      const ensured = ['Template', 'Personal Details', 'Summary', ...normalized.filter(x => !['Template','Personal Details','Summary'].includes(x))];
      // de-duplicate and keep order
      const seen = new Set();
      const finalOrder = ensured.filter(x => { if (seen.has(x)) return false; seen.add(x); return true; });
      // fill any missing sections at the end (optional)
      const missing = sections.filter(x => !finalOrder.includes(x));
      return res.json({ order: [...finalOrder, ...missing] });
    } catch {
      return res.json({ order: heuristic() });
    }
  } catch (error) {
    console.error('Error suggesting section order:', error);
    res.status(500).json({ error: 'Failed to suggest section order: ' + error.message });
  }
};

// export const scoreResume = async (req, res) => {
//   try {
//     const { resumeData } = req.body;

//     if (!resumeData || !resumeData.personalDetails) {
//       return res.status(400).json({ error: 'Resume data required' });
//     }

//     const prompt = `
// Analyze this resume and provide an ATS score based on the following criteria:
// - Completeness of sections (30%)
// - Skills relevance and quantity (25%)
// - Experience/Projects quality (25%)
// - Education and achievements (20%)

// Return only a JSON object with this format:
// {
//   "overallScore": 85,
//   "breakdown": {
//     "completeness": 90,
//     "skills": 80,
//     "experience": 85,
//     "education": 85
//   }
// }

// Resume Data: ${JSON.stringify(resumeData)}

// Score between 0-100. Be realistic but fair.`;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     let responseText = response.text().trim();
    
//     responseText = responseText.replace(/```json\s*/, '').replace(/```\s*$/, '');
    
//     try {
//       const scoreData = JSON.parse(responseText);
//       res.json(scoreData);
//     } catch (parseError) {
//       // Fallback scoring
//       res.json({
//         overallScore: 75,
//         breakdown: {
//           completeness: 75,
//           skills: 70,
//           experience: 80,
//           education: 75
//         }
//       });
//     }
//   } catch (error) {
//     console.error('Error scoring resume:', error);
//     res.status(500).json({ error: 'Failed to score resume: ' + error.message });
//   }
// };
