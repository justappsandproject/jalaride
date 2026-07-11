import type { FastifyInstance } from "fastify";
import { z } from "zod";

const DEMO_NINS: Record<string, { name: string; dob: string; address: string; email?: string }> = {
  "12345678901": {
    name: "ADEYEMI JAMES OKONKWO",
    dob: "1990-05-15",
    address: "12 Ademola Adetokunbo Crescent, Wuse II, Abuja",
    email: "adeyemi.okonkwo@example.com",
  },
  "98765432109": {
    name: "CHIOMA ADA OBI",
    dob: "1995-11-22",
    address: "45 Ahmadu Bello Way, Victoria Island, Lagos",
    email: "chioma.obi@example.com",
  },
};

const verifyBody = z.object({ nin: z.string().regex(/^\d{11}$/) });

export async function nimcRoutes(app: FastifyInstance) {
  app.post("/verify", async (req, reply) => {
    const parsed = verifyBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "NIN must be 11 digits" });
    }
    const { nin } = parsed.data;
    const demo = DEMO_NINS[nin] ?? {
      name: "DEMO USER JALA RIDE",
      dob: "1992-01-01",
      address: "Plot 1021, Cadastral Zone, Abuja FCT",
      email: undefined,
    };
    return {
      success: true,
      nin,
      name: demo.name,
      dob: demo.dob,
      address: demo.address,
      email: demo.email,
      photo_url: null,
      gender: "M",
      source: "demo",
    };
  });
}
