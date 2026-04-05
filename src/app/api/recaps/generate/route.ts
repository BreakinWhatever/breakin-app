import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { sendRecapEmail } from "@/lib/resend";

// ---------- Types ----------

interface PipelineMetrics {
  [stage: string]: number;
}

interface CampaignStats {
  name: string;
  total: number;
  sent: number;
  replied: number;
  replyRate: number;
}

interface RecapMetrics {
  emailsSent: number;
  repliesReceived: number;
  newContacts: number;
  followUpsDue: number;
  replyRate: number;
  pipelineByStage: PipelineMetrics;
  activeCampaigns: number;
  topCampaign: string | null;
  campaignStats: CampaignStats[];
  // Weekly-only
  avgDaysPerStage?: number;
  bestTemplate?: string | null;
  interviewsScheduled?: number;
}

// ---------- Helpers ----------

function getParisDate(date: Date = new Date()): Date {
  // Convert to Paris timezone
  const parisStr = date.toLocaleString("en-US", { timeZone: "Europe/Paris" });
  return new Date(parisStr);
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Monday = start of week
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]; // "2026-04-05"
}

// ---------- Data Aggregation ----------

async function aggregateDailyData() {
  const now = getParisDate();
  const startOfDay = getStartOfDay(now);
  const tomorrow = new Date(startOfDay);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Emails sent today
  const emailsSentToday = await prisma.email.count({
    where: {
      status: "sent",
      sentAt: { gte: startOfDay, lt: tomorrow },
    },
  });

  // Replies received today (outreaches that moved to "replied" today)
  const repliedToday = await prisma.outreach.count({
    where: {
      status: "replied",
      updatedAt: { gte: startOfDay, lt: tomorrow },
    },
  });

  // New contacts added today
  const newContacts = await prisma.contact.count({
    where: {
      createdAt: { gte: startOfDay, lt: tomorrow },
    },
  });

  // Follow-ups due tomorrow
  const tomorrowStart = new Date(tomorrow);
  const dayAfterTomorrow = new Date(tomorrowStart);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const followUpsDueTomorrow = await prisma.outreach.count({
    where: {
      nextActionDate: { gte: tomorrowStart, lt: dayAfterTomorrow },
      NOT: { nextActionType: "none" },
      status: { in: ["contacted", "followed_up", "followup_1", "followup_2", "followup_3"] },
    },
  });

  // Pipeline by stage
  const allOutreaches = await prisma.outreach.findMany({
    select: { status: true },
  });
  const pipelineByStage: PipelineMetrics = {};
  for (const o of allOutreaches) {
    pipelineByStage[o.status] = (pipelineByStage[o.status] || 0) + 1;
  }

  // Pipeline movement today (status changes)
  const movedToday = await prisma.outreach.findMany({
    where: {
      updatedAt: { gte: startOfDay, lt: tomorrow },
    },
    include: {
      contact: { include: { company: true } },
    },
  });

  // Campaign stats
  const campaigns = await prisma.campaign.findMany({
    where: { status: "active" },
    include: {
      outreaches: {
        include: {
          emails: { where: { status: "sent" } },
        },
      },
    },
  });

  const campaignStats: CampaignStats[] = campaigns.map((c) => {
    const total = c.outreaches.length;
    const sent = c.outreaches.filter((o) =>
      o.emails.length > 0
    ).length;
    const replied = c.outreaches.filter((o) => o.status === "replied").length;
    return {
      name: c.name,
      total,
      sent,
      replied,
      replyRate: sent > 0 ? Math.round((replied / sent) * 1000) / 10 : 0,
    };
  });

  // Total reply rate
  const totalSent = await prisma.email.count({ where: { status: "sent" } });
  const totalReplied = await prisma.outreach.count({ where: { status: "replied" } });
  const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 1000) / 10 : 0;

  // Drafts pending
  const draftsPending = await prisma.email.count({
    where: { status: "draft" },
  });

  // Events today
  const eventsToday = await prisma.event.findMany({
    where: {
      startDate: { gte: startOfDay, lt: tomorrow },
    },
  });

  // Top campaign (by reply rate, min 5 sent)
  const topCampaign = campaignStats
    .filter((c) => c.sent >= 5)
    .sort((a, b) => b.replyRate - a.replyRate)[0]?.name || null;

  return {
    emailsSent: emailsSentToday,
    repliesReceived: repliedToday,
    newContacts,
    followUpsDue: followUpsDueTomorrow,
    replyRate,
    pipelineByStage,
    activeCampaigns: campaigns.length,
    topCampaign,
    campaignStats,
    draftsPending,
    movedToday,
    eventsToday,
  };
}

async function aggregateWeeklyData() {
  const now = getParisDate();
  const startOfWeek = getStartOfWeek(now);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  // Emails sent this week
  const emailsSentWeek = await prisma.email.count({
    where: {
      status: "sent",
      sentAt: { gte: startOfWeek, lt: endOfWeek },
    },
  });

  // Replies this week
  const repliedWeek = await prisma.outreach.count({
    where: {
      status: "replied",
      updatedAt: { gte: startOfWeek, lt: endOfWeek },
    },
  });

  // New contacts this week
  const newContactsWeek = await prisma.contact.count({
    where: {
      createdAt: { gte: startOfWeek, lt: endOfWeek },
    },
  });

  // Interviews scheduled this week
  const interviewsWeek = await prisma.event.count({
    where: {
      type: "interview",
      startDate: { gte: startOfWeek, lt: endOfWeek },
    },
  });

  // Pipeline by stage
  const allOutreaches = await prisma.outreach.findMany({
    select: { status: true },
  });
  const pipelineByStage: PipelineMetrics = {};
  for (const o of allOutreaches) {
    pipelineByStage[o.status] = (pipelineByStage[o.status] || 0) + 1;
  }

  // Campaign stats (all active)
  const campaigns = await prisma.campaign.findMany({
    where: { status: "active" },
    include: {
      outreaches: {
        include: {
          emails: { where: { status: "sent" } },
        },
      },
    },
  });

  const campaignStats: CampaignStats[] = campaigns.map((c) => {
    const total = c.outreaches.length;
    const sent = c.outreaches.filter((o) => o.emails.length > 0).length;
    const replied = c.outreaches.filter((o) => o.status === "replied").length;
    return {
      name: c.name,
      total,
      sent,
      replied,
      replyRate: sent > 0 ? Math.round((replied / sent) * 1000) / 10 : 0,
    };
  });

  // Best campaign (by reply rate, min 5 sent)
  const topCampaign = campaignStats
    .filter((c) => c.sent >= 5)
    .sort((a, b) => b.replyRate - a.replyRate)[0]?.name || null;

  // Best template (by reply rate)
  const templates = await prisma.template.findMany({
    include: {
      campaigns: {
        include: {
          outreaches: {
            include: {
              emails: { where: { status: "sent" } },
            },
          },
        },
      },
    },
  });

  let bestTemplate: string | null = null;
  let bestTemplateRate = 0;
  for (const t of templates) {
    let tSent = 0;
    let tReplied = 0;
    for (const c of t.campaigns) {
      for (const o of c.outreaches) {
        if (o.emails.length > 0) tSent++;
        if (o.status === "replied") tReplied++;
      }
    }
    const rate = tSent > 0 ? tReplied / tSent : 0;
    if (tSent >= 3 && rate > bestTemplateRate) {
      bestTemplateRate = rate;
      bestTemplate = t.name;
    }
  }

  // Total stats
  const totalSent = await prisma.email.count({ where: { status: "sent" } });
  const totalReplied = await prisma.outreach.count({ where: { status: "replied" } });
  const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 1000) / 10 : 0;

  // Reply rate this week specifically
  const weekReplyRate = emailsSentWeek > 0
    ? Math.round((repliedWeek / emailsSentWeek) * 1000) / 10
    : 0;

  return {
    emailsSent: emailsSentWeek,
    repliesReceived: repliedWeek,
    newContacts: newContactsWeek,
    followUpsDue: 0, // Not relevant for weekly
    replyRate,
    weekReplyRate,
    pipelineByStage,
    activeCampaigns: campaigns.length,
    topCampaign,
    campaignStats,
    bestTemplate,
    interviewsScheduled: interviewsWeek,
  };
}

// ---------- Markdown Formatting ----------

function formatDailyRecap(data: Awaited<ReturnType<typeof aggregateDailyData>>, date: string): string {
  const pipeline = data.pipelineByStage;
  const pipelineLines = [
    `Identified: ${pipeline["identified"] || 0}`,
    `Contacted: ${pipeline["contacted"] || 0}`,
    `Follow-up 1: ${pipeline["followup_1"] || 0}`,
    `Follow-up 2: ${pipeline["followup_2"] || 0}`,
    `Follow-up 3: ${pipeline["followup_3"] || 0}`,
    `Replied: ${pipeline["replied"] || 0}`,
    `Interview: ${pipeline["interview"] || 0}`,
    `Offer: ${pipeline["offer"] || 0}`,
  ];

  const campaignLines = data.campaignStats.map(
    (c) => `- **${c.name}**: ${c.total} contacts, ${c.sent} sent, ${c.replied} replied (${c.replyRate}%)`
  );

  const movedLines = data.movedToday
    .filter((o) => o.contact)
    .map((o) => `- ${o.contact!.firstName} ${o.contact!.lastName} (${o.contact!.company?.name || "?"}) → ${o.status}`)
    .slice(0, 10);

  const eventLines = data.eventsToday.map(
    (e) => `- ${e.title} (${e.type})`
  );

  return `# Daily Recap — ${date}

## Today's Activity

- **Emails sent:** ${data.emailsSent}
- **Replies received:** ${data.repliesReceived}
- **New contacts added:** ${data.newContacts}
- **Drafts pending:** ${data.draftsPending}

## Pipeline

${pipelineLines.map((l) => `- ${l}`).join("\n")}

**Overall reply rate:** ${data.replyRate}%

## Follow-ups Due Tomorrow

${data.followUpsDue} follow-up${data.followUpsDue !== 1 ? "s" : ""} scheduled for tomorrow.

## Pipeline Movement Today

${movedLines.length > 0 ? movedLines.join("\n") : "No status changes today."}

## Campaigns

${campaignLines.length > 0 ? campaignLines.join("\n") : "No active campaigns."}

## Events Today

${eventLines.length > 0 ? eventLines.join("\n") : "No events today."}

## Action Items for Tomorrow

${data.followUpsDue > 0 ? `- Send ${data.followUpsDue} follow-up${data.followUpsDue !== 1 ? "s" : ""}` : ""}
${data.draftsPending > 0 ? `- Review ${data.draftsPending} pending draft${data.draftsPending !== 1 ? "s" : ""}` : ""}
${data.emailsSent === 0 ? "- No emails sent today — consider sourcing new contacts" : ""}
`.trim();
}

function formatWeeklyRecap(data: Awaited<ReturnType<typeof aggregateWeeklyData>>, week: string): string {
  const pipeline = data.pipelineByStage;
  const pipelineLines = [
    `Identified: ${pipeline["identified"] || 0}`,
    `Contacted: ${pipeline["contacted"] || 0}`,
    `Follow-up 1: ${pipeline["followup_1"] || 0}`,
    `Follow-up 2: ${pipeline["followup_2"] || 0}`,
    `Follow-up 3: ${pipeline["followup_3"] || 0}`,
    `Replied: ${pipeline["replied"] || 0}`,
    `Interview: ${pipeline["interview"] || 0}`,
    `Offer: ${pipeline["offer"] || 0}`,
  ];

  const campaignLines = data.campaignStats
    .sort((a, b) => b.replyRate - a.replyRate)
    .map((c) => `- **${c.name}**: ${c.total} contacts, ${c.sent} sent, ${c.replied} replied (${c.replyRate}%)`);

  return `# Weekly Recap — ${week}

## Week Summary

| Metric | Value |
|--------|-------|
| Emails sent | ${data.emailsSent} |
| Replies received | ${data.repliesReceived} |
| New contacts | ${data.newContacts} |
| Interviews scheduled | ${data.interviewsScheduled} |
| Weekly reply rate | ${data.weekReplyRate}% |
| Overall reply rate | ${data.replyRate}% |

## Pipeline Snapshot

${pipelineLines.map((l) => `- ${l}`).join("\n")}

**Total contacts in pipeline:** ${Object.values(pipeline).reduce((a, b) => a + b, 0)}

## Campaign Performance

${campaignLines.length > 0 ? campaignLines.join("\n") : "No active campaigns."}

${data.topCampaign ? `**Best performing campaign:** ${data.topCampaign}` : ""}

## Template Performance

${data.bestTemplate ? `**Best performing template:** ${data.bestTemplate}` : "Not enough data to determine best template (need 3+ sends)."}

## Key Takeaways

- ${data.emailsSent > 20 ? "Strong outreach volume this week." : data.emailsSent > 10 ? "Moderate outreach volume." : "Low outreach volume — consider increasing sourcing."}
- ${data.repliesReceived > 0 ? `${data.repliesReceived} replies received — follow up promptly.` : "No replies this week — consider adjusting templates or targeting."}
- ${(data.interviewsScheduled ?? 0) > 0 ? `${data.interviewsScheduled} interview${(data.interviewsScheduled ?? 0) > 1 ? "s" : ""} this week — great progress!` : "No interviews this week — keep pushing."}

## Next Week Priorities

- Review and optimize underperforming campaigns
- ${data.newContacts < 10 ? "Source more contacts (target: 20+ per week)" : "Good contact sourcing — maintain momentum"}
- Follow up on any pending replies
`.trim();
}

// ---------- Route Handler ----------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body.type as string; // "daily" or "weekly"

    if (!type || !["daily", "weekly"].includes(type)) {
      return Response.json(
        { error: 'type must be "daily" or "weekly"' },
        { status: 400 }
      );
    }

    const now = getParisDate();

    // Determine period string
    const period = type === "daily" ? formatDate(now) : getISOWeek(now);

    // Check for duplicate (already generated for this period)
    const existing = await prisma.recap.findFirst({
      where: { type, period },
    });

    if (existing) {
      return Response.json({
        recap: existing,
        message: `Recap for ${period} already exists.`,
        duplicate: true,
      });
    }

    // Aggregate data and generate content
    let content: string;
    let metrics: RecapMetrics;

    if (type === "daily") {
      const data = await aggregateDailyData();
      content = formatDailyRecap(data, period);
      metrics = {
        emailsSent: data.emailsSent,
        repliesReceived: data.repliesReceived,
        newContacts: data.newContacts,
        followUpsDue: data.followUpsDue,
        replyRate: data.replyRate,
        pipelineByStage: data.pipelineByStage,
        activeCampaigns: data.activeCampaigns,
        topCampaign: data.topCampaign,
        campaignStats: data.campaignStats,
      };
    } else {
      const data = await aggregateWeeklyData();
      content = formatWeeklyRecap(data, period);
      metrics = {
        emailsSent: data.emailsSent,
        repliesReceived: data.repliesReceived,
        newContacts: data.newContacts,
        followUpsDue: 0,
        replyRate: data.replyRate,
        pipelineByStage: data.pipelineByStage,
        activeCampaigns: data.activeCampaigns,
        topCampaign: data.topCampaign,
        campaignStats: data.campaignStats,
        bestTemplate: data.bestTemplate,
        interviewsScheduled: data.interviewsScheduled,
      };
    }

    // Store the recap
    const recap = await prisma.recap.create({
      data: {
        type,
        period,
        content,
        metrics: JSON.stringify(metrics),
        sentVia: JSON.stringify([]),
      },
    });

    // Send recap email
    const sendEmail = body.sendEmail !== false; // default: true
    if (sendEmail) {
      try {
        await sendRecapEmail({
          type,
          period,
          content,
        });

        // Update sentVia
        await prisma.recap.update({
          where: { id: recap.id },
          data: { sentVia: JSON.stringify(["email"]) },
        });
      } catch (emailError) {
        console.error("Failed to send recap email:", emailError);
        // Don't fail the whole request — recap is still stored
      }
    }

    return Response.json({
      recap,
      metrics,
      message: `${type} recap generated for ${period}.`,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/recaps/generate error:", error);
    return Response.json(
      { error: "Failed to generate recap" },
      { status: 500 }
    );
  }
}
