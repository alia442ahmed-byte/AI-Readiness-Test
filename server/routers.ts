import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { saveLead, getAllLeads } from "./db";
import { notifyOwner } from "./_core/notification";

// ─── Leads Router ───────────────────────────────────────────────────────────────────

const leadsRouter = router({
  /**
   * Submit a completed AI Readiness Assessment.
   * Saves the lead to the database and notifies the owner.
   * Public — no login required.
   */
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().max(320),
        company: z.string().min(1).max(255),
        score: z.number().int().min(0).max(100),
        tier: z.enum(["high_risk", "moderate_risk", "optimized"]),
        answers: z.array(z.number().int().min(1).max(4)).length(5),
      })
    )
    .mutation(async ({ input }) => {
      const id = await saveLead({
        name: input.name,
        email: input.email,
        company: input.company,
        score: input.score,
        tier: input.tier,
        answers: input.answers,
      });

      // Notify the site owner of the new lead
      await notifyOwner({
        title: `New AI Readiness Lead: ${input.company}`,
        content: `**${input.name}** (${input.email}) from **${input.company}** completed the assessment.\n\nScore: **${input.score}/100** (${input.tier.replace("_", " ")})`,
      }).catch(() => {
        // Non-critical — don't fail the request if notification fails
      });

      return { success: true, id };
    }),

  /**
   * List all leads — owner/admin only.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Forbidden");
    }
    return getAllLeads();
  }),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  leads: leadsRouter,
});

export type AppRouter = typeof appRouter;
