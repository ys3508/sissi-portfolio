// Everything TRUTH.EXE says. Fictional scenarios are labeled as such on screen.
// Real sources appear only where their text was read and supports the specific point.

export type Choice = "trust" | "verify" | "escalate";
export type ClaimStatus = "supported" | "contradicted" | "unverified" | "missing";
export type InvestigationCaseId = 1 | 2 | 4 | 5;
export type CaseId = InvestigationCaseId | 3 | 6;

export const STATUS_LABEL: Record<ClaimStatus, string> = {
  supported: "Supported",
  contradicted: "Contradicted",
  unverified: "Unverified",
  missing: "Missing context",
};

export type Source = { title: string; type: string; date?: string; url?: string };

export const SOURCES = {
  nistGai: {
    title: "Artificial Intelligence Risk Management Framework: Generative AI Profile (NIST AI 600-1)",
    type: "Government framework",
    date: "July 2024",
    url: "https://doi.org/10.6028/NIST.AI.600-1",
  },
  nistRmf: {
    title: "Artificial Intelligence Risk Management Framework (NIST AI 100-1)",
    type: "Government framework",
    date: "January 2023",
    url: "https://doi.org/10.6028/NIST.AI.100-1",
  },
  mata: {
    title: "Mata v. Avianca, Inc., No. 1:22-cv-01461, Opinion and Order on Sanctions (docket entry 54)",
    type: "US federal court record",
    date: "June 22, 2023",
    url: "https://www.courtlistener.com/docket/63107798/mata-v-avianca-inc/",
  },
  unesco: {
    title: "Recommendation on the Ethics of Artificial Intelligence",
    type: "Intergovernmental standard",
    date: "Adopted November 2021",
    url: "https://www.unesco.org/en/artificial-intelligence/recommendation-ethics",
  },
  oecd: {
    title: "OECD AI Principles overview",
    type: "Intergovernmental principles",
    date: "Adopted May 2019, updated May 2024",
    url: "https://oecd.ai/en/ai-principles",
  },
  gdpr: {
    title: "GDPR Article 5, Principles relating to processing of personal data (unofficial text)",
    type: "Regulation",
    url: "https://gdpr-info.eu/art-5-gdpr/",
  },
  obermeyer: {
    title: "Obermeyer et al., “Dissecting racial bias in an algorithm used to manage the health of populations,” Science 366(6464)",
    type: "Peer-reviewed study",
    date: "October 25, 2019",
    url: "https://pubmed.ncbi.nlm.nih.gov/31649194/",
  },
  parasuraman: {
    title: "Parasuraman & Manzey, “Complacency and bias in human use of automation: an attentional integration,” Human Factors 52(3)",
    type: "Peer-reviewed review",
    date: "June 2010",
    url: "https://pubmed.ncbi.nlm.nih.gov/21077562/",
  },
  who: {
    title: "Ethics and governance of artificial intelligence for health: Guidance on large multi-modal models",
    type: "International health guidance",
    date: "March 25, 2025",
    url: "https://www.who.int/publications/i/item/9789240084759",
  },
  caseFile: { title: "This case file (fictional)", type: "Fictional document, written for this exercise" },
  invented: { title: "No source: invented for this exercise", type: "Illustrative example" },
} satisfies Record<string, Source>;

export type Claim = {
  id: string;
  caseId: InvestigationCaseId;
  statement: string;
  status: ClaimStatus;
  evidence: string;
  source: Source;
  finding: string;
};

export const CLAIMS: Claim[] = [
  {
    id: "1a",
    caseId: 1,
    statement: "NIST's Generative AI Profile uses the term “confabulation” for confidently stated but false output.",
    status: "supported",
    evidence: "“The production of confidently stated but erroneous or false content (known colloquially as ‘hallucinations’ or ‘fabrications’)”",
    source: SOURCES.nistGai,
    finding: "This one checks out. A wrong answer can sit right beside a correct one, which is what makes spot-checking hard.",
  },
  {
    id: "1b",
    caseId: 1,
    statement: "In Mata v. Avianca, a US federal court sanctioned lawyers over a filing that cited non-existent cases.",
    status: "supported",
    evidence: "The sanctions opinion describes “non-existent judicial opinions with fake quotes and citations created by the artificial intelligence tool ChatGPT.”",
    source: SOURCES.mata,
    finding: "Real and on the public record. The court's point wasn't that the tool was used. It was that nobody checked, and then the lawyers stood by the fake cases.",
  },
  {
    id: "1c",
    caseId: 1,
    statement: "Hartwell & Osei (2021), “Confidence Calibration in Neural Language Models,” Journal of Machine Cognition 14(2), 101–119.",
    status: "unverified",
    evidence: "I made this citation up for the game. The journal, authors, volume, and pages look right, and that's all they do.",
    source: SOURCES.invented,
    finding: "Believable formatting isn't evidence. A citation counts only once you've found the paper and read that it says what's claimed.",
  },
  {
    id: "1d",
    caseId: 1,
    statement: "The same NIST report finds that about 27% of generative AI answers contain confabulations.",
    status: "unverified",
    evidence: "NIST AI 600-1 does define confabulation. Searching its full text finds no percentage like this one.",
    source: SOURCES.nistGai,
    finding: "A real source with an invented detail attached. Finding the document isn't enough: you have to check that it says this.",
  },
  {
    id: "2a",
    caseId: 2,
    statement: "This is almost certainly a muscle strain.",
    status: "missing",
    evidence: "The AI had one sentence to go on. It never asked about other symptoms, how it began, medical history, or what makes it better or worse.",
    source: SOURCES.caseFile,
    finding: "A general pattern was turned into a specific conclusion. “Almost certainly” describes the tone of the sentence, not what the system could know.",
  },
  {
    id: "2b",
    caseId: 2,
    statement: "There's no need to see anyone about it.",
    status: "unverified",
    evidence: "“Some AI systems may not require human oversight, such as models used to improve video compression. Other systems may specifically require human oversight.”",
    source: SOURCES.nistRmf,
    finding: "NIST doesn't rule on chest symptoms, and neither does this game. The point is that a consequential call needs more than a chatbot saying so.",
  },
  {
    id: "2c",
    caseId: 2,
    statement: "Ultimately, you're responsible for your own decisions.",
    status: "missing",
    evidence: "“Member States should ensure that AI systems do not displace ultimate human responsibility and accountability.”",
    source: SOURCES.unesco,
    finding: "Partly true, and easy to hide behind. UNESCO is addressing who stays accountable for AI systems, not telling a worried person to sort it out alone.",
  },
  {
    id: "4a",
    caseId: 4,
    statement: "HireSort ranks candidates objectively, using data rather than opinion.",
    status: "missing",
    evidence: "“the choice of convenient, seemingly effective proxies for ground truth can be an important source of algorithmic bias”",
    source: SOURCES.obermeyer,
    finding: "That study looked at health care, not hiring, but the lesson travels: numbers carry the choices behind them, including what was measured instead of what mattered.",
  },
  {
    id: "4b",
    caseId: 4,
    statement: "Higher scores mean stronger candidates.",
    status: "contradicted",
    evidence: "In the applicant file, the person with the highest skills test isn't ranked first. Remove the neighborhood and school features, and the order changes.",
    source: SOURCES.caseFile,
    finding: "The score measures what the model was built to reward. Whether that's the same as “stronger” is the question nobody asked.",
  },
  {
    id: "4c",
    caseId: 4,
    statement: "Neighborhood is just a neutral signal of commute reliability.",
    status: "unverified",
    evidence: "The vendor gives no data for this. Where people live can stand in for income, race, or family background, depending on the place.",
    source: SOURCES.caseFile,
    finding: "It might predict something. That doesn't make it fair to use, and a hiring team would need to test it and answer for it.",
  },
  {
    id: "4d",
    caseId: 4,
    statement: "HireSort is aligned with NIST's trustworthy AI characteristics, including fairness.",
    status: "missing",
    evidence: "NIST lists “fair with harmful bias managed” among the characteristics of trustworthy AI. It doesn't certify products.",
    source: SOURCES.nistRmf,
    finding: "The framework is real, and so is the quote. Neither one tells you that this product meets it.",
  },
  {
    id: "5a",
    caseId: 5,
    statement: "The grant pays $4,000 per academic year.",
    status: "supported",
    evidence: "Section 1 of the letter: “an award of $4,000 per academic year.”",
    source: SOURCES.caseFile,
    finding: "Correct. Most of this summary is accurate, which is why it's easy to stop reading.",
  },
  {
    id: "5b",
    caseId: 5,
    statement: "The grant renews automatically each year.",
    status: "contradicted",
    evidence: "Section 3 of the letter: “Renewal is not automatic. Recipients must submit a progress form by May 15.”",
    source: SOURCES.caseFile,
    finding: "One word changed the meaning. Here the summary says the opposite of the document.",
  },
  {
    id: "5c",
    caseId: 5,
    statement: "You keep the award as long as you stay enrolled.",
    status: "missing",
    evidence: "Section 4 of the letter: anyone who drops below 12 credits in a term “must repay that term's award within 90 days.”",
    source: SOURCES.caseFile,
    finding: "Enrolled and enrolled full time aren't the same. The summary left out the condition that costs money.",
  },
];

export const CASE_META: Record<CaseId, { title: string; topic: string; concept: string; file: string }> = {
  1: { title: "The Perfectly Wrong Answer", topic: "Hallucination and fabricated sources", concept: "Confabulation", file: "case_01_citation.txt" },
  2: { title: "The Doctor in Your Computer", topic: "High-stakes decisions", concept: "Human oversight", file: "case_02_symptom.txt" },
  3: { title: "Terms & Conditions Apply", topic: "Privacy and data protection", concept: "Data minimization", file: "case_03_privacy.txt" },
  4: { title: "The Invisible Bias", topic: "Bias and fairness", concept: "Proxy variables", file: "case_04_ranking.txt" },
  5: { title: "Lost in the Summary", topic: "Automation bias and overreliance", concept: "Automation bias", file: "case_05_summary.txt" },
  6: { title: "The Right Tool for the Job", topic: "Responsible AI use", concept: "Calibrated trust", file: "case_06_tools.txt" },
};

type Outcome = { headline: string; body: string };

export const OUTCOMES: Record<InvestigationCaseId, Record<Choice, Outcome> & { lesson: string; request: string; requester: string }> = {
  1: {
    requester: "Fictional student, writing a paper",
    request: "I need a source showing that AI can sound confident while being wrong, plus a real example. Due tonight!",
    trust: {
      headline: "Citation not found.",
      body: "You pasted all of it into the paper. Three days later, a reader goes looking for Hartwell & Osei and for that 27% figure, and finds neither. The two true claims now look doubtful too.",
    },
    verify: {
      headline: "Two real, two not.",
      body: "You kept the NIST definition and the court case, and dropped the citation and the statistic. The paper is shorter, and every line of it can be found by someone else.",
    },
    escalate: {
      headline: "A librarian found it in four minutes.",
      body: "That worked, and a librarian is a great person to know. It also cost a day you didn't have. Checking whether a paper exists is something you can do yourself first, then ask for help with what's left.",
    },
    lesson: "Fluent language and tidy formatting don't guarantee accuracy. Mistakes can sit right beside true statements, so check each claim instead of judging the answer as a whole.",
  },
  2: {
    requester: "Fictional user, “Mara”",
    request: "My chest has felt tight since my run two days ago. I'm 34 and healthy. Do I need to see someone?",
    trust: {
      headline: "Nobody else ever heard about it.",
      body: "Mara rested, and we don't know how it turned out. That's the problem: the answer closed the question before anyone qualified had looked at it. If she'd been right to worry, nothing in the chat would have caught it.",
    },
    verify: {
      headline: "The evidence can't settle this one.",
      body: "You found the gaps: no questions asked, no history, a lot of confidence. Reading more might help Mara ask better questions, but it can't examine her. Some checking ends with handing the question to a person.",
    },
    escalate: {
      headline: "Mara called a clinic.",
      body: "She asked the AI to help list what to mention: when it started, what it feels like, and what makes it change. That's a good use of it. The decision about what it means stayed with someone who could ask, examine, and be accountable.",
    },
    lesson: "AI can help organize questions and explain general information. It shouldn't be the only authority for a consequential medical decision. This is a fictional scenario, not medical advice: if you have a real health concern, talk to a health professional, and use emergency services for anything severe or sudden.",
  },
  4: {
    requester: "Fictional hiring manager",
    request: "We've got 200 applicants and two days. Rank them and tell me who to interview.",
    trust: {
      headline: "Top two advanced. Nobody asked why.",
      body: "You interviewed the top of the list. The applicant with the best skills test never got a call, and because no one looked at the features, no one could say why. “The system ranked them” isn't an explanation you can give anyone.",
    },
    verify: {
      headline: "The ranking moved.",
      body: "You took neighborhood and school out, and a different person came first. That doesn't prove the new order is fair. It proves the old one depended on choices that someone has to be able to defend.",
    },
    escalate: {
      headline: "HR and legal asked for the validation data.",
      body: "The vendor didn't have much. Rollout paused while the team reviewed the features and how the tool would be audited. It cost time, and that's a reasonable price when a tool decides who gets a job.",
    },
    lesson: "AI-generated rankings aren't automatically objective or fair. Model outputs need evaluation, context, and people who stay accountable for the decision.",
  },
  5: {
    requester: "Fictional student, reading an award letter",
    request: "Can you summarize this grant letter? I just need the key points.",
    trust: {
      headline: "Notice: repayment due in 90 days.",
      body: "You dropped a class in spring and fell to 9 credits. The summary said you'd keep the award as long as you stayed enrolled. The letter said otherwise, and you owe $2,000.",
    },
    verify: {
      headline: "You read the two paragraphs that mattered.",
      body: "The summary saved you time on the rest. You put May 15 on your calendar and checked before dropping a class. That's the summary doing its job, with you still doing yours.",
    },
    escalate: {
      headline: "The aid office confirmed it. Eventually.",
      body: "Asking was sensible, and for a real money question it's worth it. But the answer was printed in the letter you already had, and the office took a week to reply. Reading Sections 3 and 4 would have been faster.",
    },
    lesson: "An AI response can be useful without being complete. Accurate sentences can still leave out the condition that changes what you should do.",
  },
};

export const AI_REPLIES: Record<InvestigationCaseId, string> = {
  1: "Absolutely! Generative AI can produce false statements with complete confidence. NIST's Generative AI Profile uses the term “confabulation” for this. The same report finds that about 27% of generative AI answers contain confabulations. A well-known real example is Mata v. Avianca, where a US federal court sanctioned lawyers over a filing that cited non-existent cases. For peer-reviewed support, cite Hartwell & Osei (2021), “Confidence Calibration in Neural Language Models,” Journal of Machine Cognition 14(2), 101–119.",
  2: "Good news: this is almost certainly a muscle strain. Tightness after exercise is very common in active adults, especially when you're otherwise healthy. Rest for a week and you should feel better. There's no need to see anyone about it. Ultimately, you're responsible for your own decisions, but I wouldn't worry!",
  4: "HireSort ranks candidates objectively, using data rather than opinion. Higher scores mean stronger candidates, so I recommend interviewing the top of the list. The model weighs experience, skills, education, career continuity, and neighborhood, which is just a neutral signal of commute reliability. HireSort is aligned with NIST's trustworthy AI characteristics, including fairness.",
  5: "Key points: The Northbridge Community Grant pays $4,000 per academic year for up to four years. Funds go directly to your school each term. The grant renews automatically each year, and you keep the award as long as you stay enrolled. Congratulations!",
};

export const REFLECTION_ENDINGS = {
  fast: { name: "THE FAST MOVER", line: "In this run, you often prioritized speed and convenience." },
  evidence: { name: "THE EVIDENCE SEEKER", line: "In this run, you frequently inspected claims before relying on them." },
  human: { name: "THE HUMAN-CENTERED DECIDER", line: "In this run, you often brought in more expertise or oversight." },
  contextual: { name: "THE CONTEXTUAL THINKER", line: "In this run, your level of checking moved with the risk and uncertainty of the task." },
};

export type Situation = {
  id: string;
  label: string;
  level: "USE" | "VERIFY" | "ESCALATE";
  why: string;
  raised: { label: string; level: "USE" | "VERIFY" | "ESCALATE"; why: string };
};

export const SITUATIONS: Situation[] = [
  {
    id: "names",
    label: "Brainstorming names for a club",
    level: "USE",
    why: "A bad suggestion costs a few seconds. You can judge the results yourself, and nothing depends on them being factually right.",
    raised: { label: "Now it's a company name you'll trademark", level: "ESCALATE", why: "Brainstorming is still fine, but whether you can legally use the name needs a proper search and qualified advice." },
  },
  {
    id: "email",
    label: "Making an email clearer",
    level: "USE",
    why: "You know what you meant, so you can spot it when the rewrite goes wrong. Read it once before you send it.",
    raised: { label: "Now it contains a client's private details", level: "VERIFY", why: "The writing help is the same, but now you need to know where that text goes. Check the tool's data settings, or take the details out first." },
  },
  {
    id: "concept",
    label: "Explaining a technical concept",
    level: "VERIFY",
    why: "It's great for a first pass, but you're new to the topic, so you can't always spot a confident mistake. Check the key points somewhere else.",
    raised: { label: "Now you're just curious, with nothing riding on it", level: "USE", why: "If a detail is wrong, nothing much happens. Enjoy it, and check before you repeat it as fact." },
  },
  {
    id: "research",
    label: "Finding sources for a paper",
    level: "VERIFY",
    why: "AI can suggest where to look. Open every source and read that it says what's claimed, as Case 01 shows.",
    raised: { label: "Now it's a filing for a court", level: "ESCALATE", why: "A professional is accountable for what's filed. Mata v. Avianca shows that non-existent citations can lead to sanctions." },
  },
  {
    id: "money",
    label: "Deciding where to put your savings",
    level: "ESCALATE",
    why: "It's hard to undo, and it depends on details the AI doesn't have. Use AI to learn the vocabulary and prepare questions for someone qualified.",
    raised: { label: "Now you only want to understand what an index fund is", level: "VERIFY", why: "Learning a general concept is lower stakes than making the decision. Check it against an official or reputable source." },
  },
  {
    id: "health",
    label: "Working out what a symptom means",
    level: "ESCALATE",
    why: "The AI can't examine you and can miss what it never asked. It can help you list what to tell a clinician.",
    raised: { label: "Now you're preparing questions for an appointment", level: "USE", why: "A clinician will review what matters, so a rough list is useful. Keep your private details out of it if you can." },
  },
];
