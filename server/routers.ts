import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createConversation, getConversationsByUserId, getMessagesByConversationId, addMessage, getAppointmentsByUserId, getAllAppointments, createAppointment, updateAppointment, getTrainingExamples, createTrainingExample, updateTrainingExample } from "./db";
import { stripeRouter } from "./stripe-router";
import { aiRouter } from "./ai-router";


export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  chat: router({
    startConversation: protectedProcedure.mutation(async ({ ctx }) => {
      const result = await createConversation(ctx.user.id, "New Conversation");
      return { conversationId: result.insertId };
    }),
    getConversations: protectedProcedure.query(async ({ ctx }) => {
      return getConversationsByUserId(ctx.user.id);
    }),
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return getMessagesByConversationId(input.conversationId);
      }),
    sendMessage: protectedProcedure
      .input(z.object({ conversationId: z.number(), content: z.string() }))
      .mutation(async ({ input }) => {
        await addMessage(input.conversationId, "user", input.content);
        return { success: true };
      }),
  }),

  /** ✅ NOVO ROUTER DE IA */
  ai: aiRouter,

  appointments: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getAppointmentsByUserId(ctx.user.id);
    }),
    listAll: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return next({ ctx });
      })
      .query(async () => {
        return getAllAppointments();
      }),
    create: protectedProcedure
      .input(z.object({
        service: z.string(),
        duration: z.number(),
        scheduledAt: z.date(),
        barberName: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await createAppointment({
          userId: ctx.user.id,
          service: input.service,
          duration: input.duration,
          scheduledAt: input.scheduledAt,
          barberName: input.barberName,
          notes: input.notes,
        });
        return { appointmentId: result.insertId };
      }),
    update: protectedProcedure
      .input(z.object({
        appointmentId: z.number(),
        status: z.enum(["confirmed", "pending", "completed", "cancelled"]).optional(),
        scheduledAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateAppointment(input.appointmentId, {
          status: input.status,
          scheduledAt: input.scheduledAt,
        });
        return { success: true };
      }),
  }),

  stripe: stripeRouter,

  training: router({
    getExamples: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return next({ ctx });
      })
      .query(async () => {
        return getTrainingExamples();
      }),
    createExample: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return next({ ctx });
      })
      .input(z.object({
        userMessage: z.string(),
        assistantResponse: z.string(),
        category: z.string(),
        quality: z.enum(["excellent", "good", "acceptable", "poor"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await createTrainingExample({
          createdByUserId: ctx.user.id,
          userMessage: input.userMessage,
          assistantResponse: input.assistantResponse,
          category: input.category,
          quality: input.quality,
        });
        return { exampleId: result.insertId };
      }),
    updateExample: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return next({ ctx });
      })
      .input(z.object({
        exampleId: z.number(),
        quality: z.enum(["excellent", "good", "acceptable", "poor"]).optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateTrainingExample(input.exampleId, {
          quality: input.quality,
          active: input.active ? 1 : 0,
        });
        return { success: true };
      }),
  }),
});


export type AppRouter = typeof appRouter;
