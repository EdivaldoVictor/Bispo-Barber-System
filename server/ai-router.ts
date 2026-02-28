import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

const PYTHON_BACKEND_URL =
  process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

export const aiRouter = router({
  chat: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await fetch(`${PYTHON_BACKEND_URL}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: input.conversationId,
          message: input.message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process message");
      }

      return response.json();
    }),

  extractAppointment: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      const response = await fetch(
        `${PYTHON_BACKEND_URL}/chat/extract-appointment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: input.conversationId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to extract appointment");
      }

      return response.json();
    }),

  validateAppointment: protectedProcedure
    .input(
      z.object({
        appointmentData: z.object({
          service: z.string().optional(),
          date: z.string().optional(),
          time: z.string().optional(),
          barberName: z.string().optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .query(async ({ input }) => {
      const response = await fetch(
        `${PYTHON_BACKEND_URL}/chat/validate-appointment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointment_data: {
              service: input.appointmentData.service,
              date: input.appointmentData.date,
              time: input.appointmentData.time,
              barber_name: input.appointmentData.barberName,
              notes: input.appointmentData.notes,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to validate appointment");
      }

      return response.json();
    }),

  getServices: publicProcedure.query(async () => {
    const response = await fetch(`${PYTHON_BACKEND_URL}/services`);

    if (!response.ok) {
      throw new Error("Failed to fetch services");
    }

    return response.json();
  }),
});
