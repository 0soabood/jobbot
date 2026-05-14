import { truncate } from "../lib/text.js";

export function isAiConfigured() {
  return Boolean(getOpenAiApiKey());
}

export async function generateApplicationPacket({ config, profile, documents, job }) {
  if (!isAiConfigured()) {
    return buildFallbackPacket({ profile, documents, job, reason: "No OpenAI API key detected" });
  }

  try {
    const payload = await callOpenAI({ config, profile, documents, job });
    return {
      provider: "openai",
      mode: "ai",
      fitSummary: payload.fitSummary,
      resumeHeadline: payload.resumeHeadline,
      resumeHighlights: payload.resumeHighlights,
      coverLetter: payload.coverLetter,
      applicationAnswers: payload.applicationAnswers,
      atsKeywords: payload.atsKeywords,
      interviewPrep: payload.interviewPrep,
      notes: payload.notes,
    };
  } catch (error) {
    return buildFallbackPacket({
      profile,
      documents,
      job,
      reason: `AI generation failed: ${error.message}`,
    });
  }
}

async function callOpenAI({ config, profile, documents, job }) {
  const apiKey = getOpenAiApiKey();
  const response = await fetch(`${config.ai.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.ai.model,
      temperature: Number(config.ai.temperature ?? 0.4),
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "You are Jobbot, an expert application strategist. Produce concise, specific job application assets. Reply as valid JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({
            profile,
            documents: {
              resumeText: documents.resumeText,
              coverLetterBaseText: documents.coverLetterBaseText,
            },
            job,
            requiredShape: {
              fitSummary: "string",
              resumeHeadline: "string",
              resumeHighlights: ["string"],
              coverLetter: "string",
              applicationAnswers: {
                whyThisRole: "string",
                whyThisCompany: "string",
                valueProposition: "string",
                availability: "string",
              },
              atsKeywords: ["string"],
              interviewPrep: ["string"],
              notes: ["string"],
            },
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI returned ${response.status}: ${truncate(message, 180)}`);
  }

  const body = await response.json();
  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response did not include content");
  }

  const parsed = JSON.parse(content);
  return {
    fitSummary: String(parsed.fitSummary ?? ""),
    resumeHeadline: String(parsed.resumeHeadline ?? ""),
    resumeHighlights: ensureStrings(parsed.resumeHighlights, 5),
    coverLetter: String(parsed.coverLetter ?? ""),
    applicationAnswers: {
      whyThisRole: String(parsed.applicationAnswers?.whyThisRole ?? ""),
      whyThisCompany: String(parsed.applicationAnswers?.whyThisCompany ?? ""),
      valueProposition: String(parsed.applicationAnswers?.valueProposition ?? ""),
      availability: String(parsed.applicationAnswers?.availability ?? ""),
    },
    atsKeywords: ensureStrings(parsed.atsKeywords, 10),
    interviewPrep: ensureStrings(parsed.interviewPrep, 6),
    notes: ensureStrings(parsed.notes, 6),
  };
}

function getOpenAiApiKey() {
  return (
    process.env.JOBBOT_OPENAI_API_KEY ||
    process.env.JOB_BOT_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY
  );
}

function buildFallbackPacket({ profile, documents, job, reason }) {
  const topSkills = profile.skills.slice(0, 6);
  const matched = topSkills.filter((skill) =>
    `${job.title} ${job.description}`.toLowerCase().includes(skill.toLowerCase()),
  );
  const role = profile.targetRoles[0] ?? "professional";
  const intro =
    documents.coverLetterBaseText.trim() ||
    `I am excited to apply for the ${job.title} role at ${job.company}.`;

  return {
    provider: "fallback",
    mode: "rules",
    fitSummary: `Strong ${role} overlap with ${job.company}, with emphasis on ${matched[0] ?? "delivery"}, stakeholder communication, and measurable outcomes.`,
    resumeHeadline: `${profile.fullName} | ${role} | ${topSkills.slice(0, 3).join(" | ")}`,
    resumeHighlights: [
      `Lead with experience that mirrors ${job.title} responsibilities and outcomes.`,
      `Use metrics to prove impact in areas like ${matched[0] ?? topSkills[0] ?? "execution"}.`,
      `Mirror keywords from the description: ${extractKeywords(job.description, topSkills).join(", ") || "customer focus, ownership, collaboration"}.`,
    ],
    coverLetter: `${intro}\n\nMy background in ${topSkills.slice(0, 4).join(", ")} matches the needs of this position, and I am especially interested in how ${job.company} is approaching ${job.category || "its market"}. I have focused on shipping practical work with clear outcomes, collaborating across teams, and adapting quickly to new systems and expectations.\n\nI would bring a bias for action, strong communication, and a habit of turning ambiguous goals into structured execution. I would welcome the chance to discuss how I can contribute to ${job.company} in this role.\n\nBest regards,\n${profile.fullName}`,
    applicationAnswers: {
      whyThisRole: `This role is a strong fit because it lines up with my target path in ${role} and lets me apply experience in ${matched[0] ?? topSkills[0] ?? "problem solving"} to business outcomes.`,
      whyThisCompany: `${job.company} stands out because the role appears hands-on, outcome-oriented, and aligned with the type of team environment where I do my best work.`,
      valueProposition: `I bring a practical mix of execution, communication, and adaptability, plus experience with ${topSkills.slice(0, 3).join(", ")}.`,
      availability: "Available after interview process and notice-period alignment.",
    },
    atsKeywords: extractKeywords(job.description, topSkills),
    interviewPrep: [
      `Prepare a short story that connects your background to ${job.title}.`,
      `Be ready to explain why ${job.company} is a deliberate choice.`,
      "Have two quantified impact examples ready.",
    ],
    notes: [reason],
  };
}

function ensureStrings(values, limit) {
  return Array.isArray(values)
    ? values.map((value) => String(value)).filter(Boolean).slice(0, limit)
    : [];
}

function extractKeywords(description, preferred) {
  const candidates = [...preferred];
  const text = String(description ?? "").toLowerCase();
  const extras = [
    "ownership",
    "stakeholders",
    "delivery",
    "communication",
    "automation",
    "analysis",
    "collaboration",
    "product",
    "engineering",
  ];

  for (const keyword of extras) {
    if (text.includes(keyword)) {
      candidates.push(keyword);
    }
  }

  return [...new Set(candidates)].slice(0, 8);
}
