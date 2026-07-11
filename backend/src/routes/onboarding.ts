import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { DocType, RegistrationStatus } from "@prisma/client";

const profileBody = z.object({
  nin: z.string().regex(/^\d{11}$/),
  name: z.string().min(2),
  dob: z.string().min(4),
  address: z.string().min(3),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
});

const documentBody = z.object({
  docType: z.enum(["DRIVERS_LICENSE", "POLICE_CLEARANCE", "DSS_CLEARANCE", "SELFIE", "OTHER"]),
  fileData: z.string().min(20),
});

export async function onboardingRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/profile", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const parsed = profileBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const { nin, name, dob, address, phone, email } = parsed.data;
    const existing = await app.prisma.user.findFirst({
      where: { phone, NOT: { id: user.sub } },
    });
    if (existing) {
      return reply.status(409).send({ error: "Phone already in use" });
    }
    const updated = await app.prisma.user.update({
      where: { id: user.sub },
      data: {
        nin,
        ninVerified: true,
        name,
        dob,
        address,
        phone,
        email: email || null,
        registrationStatus: RegistrationStatus.DOCUMENTS_PENDING,
      },
    });
    const { passwordHash: _, ...rest } = updated;
    return { user: rest };
  });

  app.post("/document", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const parsed = documentBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const { docType, fileData } = parsed.data;
    const doc = await app.prisma.document.upsert({
      where: {
        userId_docType: { userId: user.sub, docType: docType as DocType },
      },
      create: {
        userId: user.sub,
        docType: docType as DocType,
        fileData,
      },
      update: { fileData },
    });
    if (docType === "SELFIE") {
      await app.prisma.user.update({
        where: { id: user.sub },
        data: { selfieUrl: fileData.slice(0, 500) },
      });
    }
    return { document: { id: doc.id, docType: doc.docType, verified: doc.verified } };
  });

  app.post("/submit", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const me = await app.prisma.user.findUnique({
      where: { id: user.sub },
      include: { documents: true, driverProfile: true },
    });
    if (!me?.ninVerified) {
      return reply.status(400).send({ error: "Complete NIN and profile first" });
    }
    const hasSelfie = me.documents.some((d) => d.docType === "SELFIE");
    if (!hasSelfie) {
      return reply.status(400).send({ error: "Selfie required" });
    }
    if (user.role === "DRIVER") {
      const required: DocType[] = ["DRIVERS_LICENSE", "POLICE_CLEARANCE", "DSS_CLEARANCE", "SELFIE"];
      const uploaded = new Set(me.documents.map((d) => d.docType));
      for (const t of required) {
        if (!uploaded.has(t)) {
          return reply.status(400).send({ error: `Missing document: ${t}` });
        }
      }
      await app.prisma.user.update({
        where: { id: user.sub },
        data: { registrationStatus: RegistrationStatus.AWAITING_APPROVAL },
      });
      if (me.driverProfile) {
        await app.prisma.driver.update({
          where: { id: me.driverProfile.id },
          data: { status: "PENDING" },
        });
      }
      return { status: RegistrationStatus.AWAITING_APPROVAL, message: "Awaiting admin approval" };
    }
    const approved = await app.prisma.user.update({
      where: { id: user.sub },
      data: { registrationStatus: RegistrationStatus.APPROVED },
    });
    return { status: approved.registrationStatus, message: "Registration approved" };
  });

  app.get("/status", async (req) => {
    const user = req.user as { sub: string };
    const me = await app.prisma.user.findUnique({
      where: { id: user.sub },
      include: { documents: { select: { docType: true, verified: true } }, driverProfile: true },
    });
    if (!me) return { error: "Not found" };
    const { passwordHash: _, ...rest } = me;
    return rest;
  });
}
