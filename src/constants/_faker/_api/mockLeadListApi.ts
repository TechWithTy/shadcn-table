// Simple self-contained mock Lead List API for external demo usage

export interface LeadList {
  id: string;
  listName: string;
  records: number;
}

// Deterministic pseudo-random generator
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let cache: LeadList[] | null = null;
function buildLists(): LeadList[] {
  if (cache) return cache;
  const rand = mulberry32(123456);
  const companies = [
    "Acme Corp",
    "Globex",
    "Initech",
    "Umbrella",
    "Soylent",
    "Vehement",
    "Hooli",
    "Stark Industries",
    "Wayne Enterprises",
    "Wonka LLC",
  ];
  const phrases = [
    "Prospects",
    "Qualified",
    "Follow-ups",
    "Nurture",
    "High Intent",
    "Cold Outreach",
    "Warm Leads",
  ];
  cache = Array.from({ length: 100 }, (_, i) => {
    const name = `${companies[Math.floor(rand() * companies.length)]} - ${phrases[Math.floor(
      rand() * phrases.length,
    )]}`;
    const records = 50 + Math.floor(rand() * 9950);
    return { id: `ll_${i + 1}`, listName: name, records };
  });
  return cache!;
}

export async function fetchFakeLeadLists(
  page: number,
  limit = 10,
): Promise<{ items: LeadList[]; hasMore: boolean }> {
  await new Promise((r) => setTimeout(r, 200));
  const all = buildLists();
  const offset = page * limit;
  const items = all.slice(offset, offset + limit);
  const hasMore = offset + limit < all.length;
  return { items, hasMore };
}
