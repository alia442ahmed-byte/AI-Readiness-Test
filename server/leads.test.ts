import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock the DB helpers so tests don't need a real database ─────────────────
vi.mock("./db", () => ({
  saveLead: vi.fn().mockResolvedValue(42),
  getAllLeads: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Jane Doe",
      email: "jane@example.com",
      company: "Acme Corp",
      score: 55,
      tier: "moderate_risk",
      answers: [2, 3, 2, 2, 3],
      createdAt: new Date("2026-01-01T00:00:00Z"),
    },
  ]),
}));

// ─── Mock the notification helper ────────────────────────────────────────────
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ─── Context factories ────────────────────────────────────────────────────────

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "user-open-id",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("leads.submit", () => {
  it("saves a valid lead and returns success with an id", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.leads.submit({
      name: "John Smith",
      email: "john@acme.com",
      company: "Acme Construction",
      score: 35,
      tier: "high_risk",
      answers: [1, 2, 1, 1, 2],
    });

    expect(result.success).toBe(true);
    expect(result.id).toBe(42);
  });

  it("rejects an invalid email", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.leads.submit({
        name: "John Smith",
        email: "not-an-email",
        company: "Acme",
        score: 50,
        tier: "moderate_risk",
        answers: [2, 2, 2, 2, 2],
      })
    ).rejects.toThrow();
  });

  it("rejects an answers array that is not exactly 5 items", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.leads.submit({
        name: "John Smith",
        email: "john@acme.com",
        company: "Acme",
        score: 50,
        tier: "moderate_risk",
        answers: [2, 2, 2], // only 3 answers
      })
    ).rejects.toThrow();
  });
});

describe("leads.list", () => {
  it("returns leads when called by an admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const leads = await caller.leads.list();

    expect(Array.isArray(leads)).toBe(true);
    expect(leads.length).toBeGreaterThan(0);
    expect(leads[0].company).toBe("Acme Corp");
  });

  it("throws Forbidden when called by a non-admin user", async () => {
    const caller = appRouter.createCaller(createUserContext());

    await expect(caller.leads.list()).rejects.toThrow("Forbidden");
  });
});
