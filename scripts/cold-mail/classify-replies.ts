// classify-replies.ts — cron script
//
// For each InboundEmail with classification IS NULL, dispatches a
// classify-reply task to the cold-mail-agent (Sonnet 4.6 via the
// model-selection convention in the agent's CLAUDE.md), then applies
// the suppression / follow-up rules per spec section 4.4.
//
// Suppression / pipeline rules per classification:
//   interested      → urgent Telegram ping with the body
//   not_interested  → suppress Contact (reason=not_interested), flush follow-ups
//   ooo             → bump every active Outreach.nextActionDate by +7 days
//   wrong_person    → flush follow-ups, optionally create stub Contact if
//                     alternateContactName extracted
//   auto_reply      → noop (just record the classification)
//
// Run: tsx scripts/cold-mail/classify-replies.ts

import { prisma } from "@/lib/db";
import {
  dispatchClassifyReply,
  AgentTaskTimeoutError,
} from "@/lib/cold-mail-agent";
import { notify, notifyError } from "./lib/notify";
import { bump, endRun, logError, startRun } from "./lib/run-counter";

async function main() {
  const stats = startRun("classify-replies");

  try {
    const pending = await prisma.inboundEmail.findMany({
      where: { classification: null },
      orderBy: { receivedAt: "asc" },
      take: 50,
    });

    if (pending.length === 0) {
      bump(stats, "pending", 0);
      console.log("[classify-replies] nothing to classify");
      return;
    }

    bump(stats, "pending", pending.length);

    for (const inbound of pending) {
      try {
        const result = await dispatchClassifyReply({
          inboundEmailId: inbound.id,
          fromEmail: inbound.fromEmail,
          subject: inbound.subject,
          bodyText: inbound.bodyText ?? "",
        });

        await prisma.inboundEmail.update({
          where: { id: inbound.id },
          data: {
            classification: result.classification,
            classifiedAt: new Date(),
            classificationConfidence: result.confidence,
            alternateContactName: result.alternateContactName,
          },
        });
        bump(stats, "classified");
        bump(stats, `class.${result.classification}`);

        // Apply rules
        await applyClassificationRules(inbound.outreachId, inbound.contactId, result, inbound);
      } catch (err) {
        if (err instanceof AgentTaskTimeoutError) {
          logError(stats, `agent timeout for inbound ${inbound.id}`);
          notify(`⚠️ classify-replies: agent timeout for inbound ${inbound.id}`);
        } else {
          const m = err instanceof Error ? err.message : String(err);
          logError(stats, `inbound ${inbound.id}: ${m}`);
          console.error(`[classify-replies] error on ${inbound.id}: ${m}`);
        }
      }
    }
  } catch (err) {
    notifyError("classify-replies", err);
    logError(stats, err instanceof Error ? err.message : String(err));
  } finally {
    await endRun(stats);
    await prisma.$disconnect();
  }
}

async function applyClassificationRules(
  outreachId: string | null,
  contactId: string | null,
  result: {
    classification: string;
    alternateContactName: string | null;
    confidence: string;
    reasoning: string;
  },
  inbound: { id: string; fromEmail: string; subject: string; bodyText: string | null }
) {
  switch (result.classification) {
    case "interested": {
      // Set status to replied to stop automated follow-ups and update pipeline metrics
      if (outreachId) {
        await prisma.outreach.update({
          where: { id: outreachId },
          data: {
            status: "replied",
            nextActionType: "none",
            nextActionDate: null,
          },
        });
      }
      
      // Urgent Telegram ping.
      const preview = (inbound.bodyText ?? "").slice(0, 300);
      notify(
        `🔥 Reply intéressé !\n` +
          `De : ${inbound.fromEmail}\n` +
          `Sujet : ${inbound.subject}\n\n` +
          `${preview}${(inbound.bodyText ?? "").length > 300 ? "..." : ""}\n\n` +
          `→ https://breakin.app/contacts ` +
          (contactId ? `(contact ${contactId})` : "(contact non matché)")
      );
      break;
    }

    case "pending_response": {
      // The contact replied something like "I'll get back to you".
      // We pause automated follow-ups but keep them in the pipeline as "replied".
      if (outreachId) {
        await prisma.outreach.update({
          where: { id: outreachId },
          data: {
            status: "replied",
            nextActionType: "none", // Human must take over
            nextActionDate: null,
          },
        });
      }
      const preview = (inbound.bodyText ?? "").slice(0, 300);
      notify(
        `⏳ En attente de retour : ${inbound.fromEmail} a répondu qu'il reviendrait vers toi.\n\n` +
        `${preview}${(inbound.bodyText ?? "").length > 300 ? "..." : ""}`
      );
      break;
    }

    case "not_interested": {
      if (outreachId) {
        await prisma.outreach.update({
          where: { id: outreachId },
          data: { status: "replied" },
        });
      }
      if (contactId) {
        await prisma.contact.update({
          where: { id: contactId },
          data: {
            suppressedAt: new Date(),
            suppressionReason: "not_interested",
          },
        });
        // Flush all in-flight outreaches for this contact
        await prisma.outreach.updateMany({
          where: {
            contactId,
            status: {
              in: [
                "identified",
                "contacted",
                "followed_up",
                "followup_1",
                "followup_2",
                "followup_3",
              ],
            },
          },
          data: { nextActionType: "none", nextActionDate: null },
        });
        notify(
          `🚫 not_interested : ${inbound.fromEmail} → contact suppressed, follow-ups flushed`
        );
      }
      break;
    }

    case "ooo": {
      // Bump nextActionDate by 7 days for the matching outreach (or all
      // active outreaches for this contact)
      const where = outreachId
        ? { id: outreachId }
        : contactId
        ? {
            contactId,
            status: {
              in: [
                "contacted",
                "followed_up",
                "followup_1",
                "followup_2",
                "followup_3",
              ],
            },
          }
        : null;
      if (where) {
        const sevenDaysFromNow = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        );
        await prisma.outreach.updateMany({
          where: where as any,
          data: { nextActionDate: sevenDaysFromNow },
        });
      }
      break;
    }

    case "wrong_person": {
      if (outreachId) {
        await prisma.outreach.update({
          where: { id: outreachId },
          data: { status: "replied" },
        });
      }
      if (contactId) {
        await prisma.outreach.updateMany({
          where: {
            contactId,
            status: {
              in: [
                "contacted",
                "followed_up",
                "followup_1",
                "followup_2",
                "followup_3",
              ],
            },
          },
          data: { nextActionType: "none", nextActionDate: null },
        });

        // If Opus extracted a name, create a stub contact for triage.
        // We don't have email/title yet — operator will enrich.
        if (result.alternateContactName) {
          const original = await prisma.contact.findUnique({
            where: { id: contactId },
          });
          if (original) {
            const [firstName, ...rest] = result.alternateContactName.split(" ");
            const lastName = rest.join(" ") || "(à compléter)";
            // Idempotent: skip if a contact with the same firstName+lastName+companyId already exists
            const existing = await prisma.contact.findFirst({
              where: {
                firstName,
                lastName,
                companyId: original.companyId,
              },
            });
            if (!existing) {
              await prisma.contact.create({
                data: {
                  firstName,
                  lastName,
                  companyId: original.companyId,
                  title: "(à compléter — signalé par wrong_person)",
                  email: `placeholder-${Date.now()}@unknown.local`,
                  source: "wrong_person_redirect",
                  notes: `Suggéré par ${original.firstName} ${original.lastName} via reply à ${inbound.subject}`,
                },
              });
              notify(
                `↪ wrong_person → nouveau contact stub créé : ${result.alternateContactName} (à compléter)`
              );
            }
          }
        } else {
          notify(
            `↪ wrong_person : ${inbound.fromEmail} → follow-ups flushed (aucun nom alternatif extrait)`
          );
        }
      }
      break;
    }

    case "auto_reply":
    default:
      // No-op
      break;
  }
}

main().catch(async (err) => {
  console.error("[classify-replies] fatal:", err);
  notifyError("classify-replies", err);
  await prisma.$disconnect();
  process.exit(1);
});
