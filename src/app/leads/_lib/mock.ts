"use client";

import { faker } from "@faker-js/faker";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "new" | "contacted" | "qualified" | "lost";
  score: number;
  createdAt: Date;
  nested?: Array<{ id: string; note: string; at: Date }>;
};

const statuses: Lead["status"][] = ["new", "contacted", "qualified", "lost"];

export function makeLeads(count = 200): Lead[] {
  faker.seed(42);
  return Array.from({ length: count }).map(() => {
    const id = faker.string.nanoid(10);
    const nestedCount = faker.number.int({ min: 0, max: 3 });
    return {
      id,
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      phone: faker.phone.number({ style: "international" }),
      status: faker.helpers.arrayElement(statuses),
      score: faker.number.int({ min: 0, max: 100 }),
      createdAt: faker.date.recent({ days: 180 }),
      nested: Array.from({ length: nestedCount }).map(() => ({
        id: faker.string.nanoid(8),
        note: faker.lorem.sentence(),
        at: faker.date.recent({ days: 60 }),
      })),
    } satisfies Lead;
  });
}
