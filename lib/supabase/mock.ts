// In-memory mock Supabase client. Activated when NEXT_PUBLIC_BYPASS_AUTH=true.
// Mirrors the seed data in supabase/schema.sql so the dashboard renders end-to-end
// without a real Supabase project. Mutations persist for the lifetime of the server process.

type Row = Record<string, any>;

const stores: Record<string, Row[]> = {
  allowed_users: [],
  businesses: [
    { id: 'marco', name: 'Marco Wang Co.', subtitle: 'Photography + Photobox', color_theme: 'stone', display_order: 1 },
    { id: 'flowe', name: 'Flowe', subtitle: 'Wefts → Salon → Booth', color_theme: 'rose', display_order: 2 },
  ],
  income_streams: [],
  income_targets: [],
  income_actuals: [],
  milestones: [],
  milestone_subtasks: [],
  strategic_notes: [],
};

const sid = (name: string, biz: string) => `stream-${biz}-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
const mid = (biz: string, order: number) => `milestone-${biz}-${order}`;

const marcoStreams = [
  ['Photography (flagship)', 'Marco Wang digital flagship weddings', 1],
  ['Photography (film flagship)', 'Marco Wang Film co-shot with senior associate', 2],
  ['Photography (associates)', 'Marco Wang Studio Associates tier', 3],
  ['Photobox subscriptions', 'Photographer monthly subs', 4],
  ['Photobox transactions', 'Box order revenue (your cut after photographer split)', 5],
] as const;

const floweStreams = [
  ['Butterfly wefts', 'Pro stylist wholesale', 1],
  ['Salon services', 'Jordan + team chair work', 2],
  ['Booth rental', '3 chairs at $600/week', 3],
] as const;

for (const [name, desc, ord] of marcoStreams) {
  stores.income_streams.push({ id: sid(name, 'marco'), business_id: 'marco', name, description: desc, display_order: ord, active: true });
}
for (const [name, desc, ord] of floweStreams) {
  stores.income_streams.push({ id: sid(name, 'flowe'), business_id: 'flowe', name, description: desc, display_order: ord, active: true });
}

const targets: Array<[string, string, number, number, string]> = [
  ['marco', 'Photography (flagship)', 2026, 175000, 'Year 1: stable at current'],
  ['marco', 'Photography (flagship)', 2027, 200000, 'Y2: associate model maturing'],
  ['marco', 'Photography (flagship)', 2028, 220000, 'Y3: peak'],
  ['marco', 'Photography (flagship)', 2029, 200000, 'Y4: scaling back personal weddings'],
  ['marco', 'Photography (flagship)', 2030, 150000, 'Y5: semi-retirement transition'],
  ['marco', 'Photography (film flagship)', 2026, 40000, 'Y1: 4-6 weddings, ramp'],
  ['marco', 'Photography (film flagship)', 2027, 100000, 'Y2: full year'],
  ['marco', 'Photography (film flagship)', 2028, 130000, 'Y3'],
  ['marco', 'Photography (film flagship)', 2029, 130000, 'Y4'],
  ['marco', 'Photography (film flagship)', 2030, 100000, 'Y5'],
  ['marco', 'Photography (associates)', 2026, 25000, 'Y1: junior tier launch'],
  ['marco', 'Photography (associates)', 2027, 60000, 'Y2'],
  ['marco', 'Photography (associates)', 2028, 90000, 'Y3'],
  ['marco', 'Photography (associates)', 2029, 110000, 'Y4'],
  ['marco', 'Photography (associates)', 2030, 130000, 'Y5'],
  ['marco', 'Photobox subscriptions', 2026, 5000, 'Y1: small beta'],
  ['marco', 'Photobox subscriptions', 2027, 25000, 'Y2'],
  ['marco', 'Photobox subscriptions', 2028, 60000, 'Y3'],
  ['marco', 'Photobox subscriptions', 2029, 100000, 'Y4'],
  ['marco', 'Photobox subscriptions', 2030, 150000, 'Y5'],
  ['marco', 'Photobox transactions', 2026, 30000, 'Y1: first paid orders'],
  ['marco', 'Photobox transactions', 2027, 100000, 'Y2'],
  ['marco', 'Photobox transactions', 2028, 220000, 'Y3'],
  ['marco', 'Photobox transactions', 2029, 350000, 'Y4'],
  ['marco', 'Photobox transactions', 2030, 500000, 'Y5'],
  ['flowe', 'Butterfly wefts', 2026, 30000, 'Y1: 5-10 stylists, ramp'],
  ['flowe', 'Butterfly wefts', 2027, 80000, 'Y2'],
  ['flowe', 'Butterfly wefts', 2028, 150000, 'Y3: v2 launch'],
  ['flowe', 'Butterfly wefts', 2029, 220000, 'Y4'],
  ['flowe', 'Butterfly wefts', 2030, 300000, 'Y5'],
  ['flowe', 'Salon services', 2026, 180000, 'Y1: current state, restructuring'],
  ['flowe', 'Salon services', 2027, 240000, 'Y2: higher-value mix'],
  ['flowe', 'Salon services', 2028, 280000, 'Y3'],
  ['flowe', 'Salon services', 2029, 280000, 'Y4: stable'],
  ['flowe', 'Salon services', 2030, 250000, 'Y5: Jordan scaling back'],
  ['flowe', 'Booth rental', 2026, 90000, '3 chairs × $600/wk'],
  ['flowe', 'Booth rental', 2027, 95000, 'Y2'],
  ['flowe', 'Booth rental', 2028, 120000, 'Y3: possibly 4th chair'],
  ['flowe', 'Booth rental', 2029, 120000, 'Y4'],
  ['flowe', 'Booth rental', 2030, 120000, 'Y5'],
];

for (const [biz, name, year, amount, note] of targets) {
  stores.income_targets.push({
    id: `target-${biz}-${name}-${year}`,
    stream_id: sid(name, biz),
    year,
    target_amount: amount,
    notes: note,
  });
}

const marcoMilestones = [
  ['Senior associate film flagship', 'Months 1-2', 'not_started', '2026-06-15', "Co-launch premium film line at $25-35k. He's already convinced — formalize splits in writing.", 1, 2026],
  ['Junior associate tier launch', 'Months 1-3', 'not_started', '2026-07-01', 'Marco Wang Studio Associates at $5-10k. OTJ training as he interns.', 2, 2026],
  ['Inquiry routing system', 'Months 1-2', 'not_started', '2026-06-01', 'CRM already built — add tier branching for $15k+/film/sub-$10k routing.', 3, 2026],
  ['Photobox: Fix demo gallery', 'Week 1', 'not_started', '2026-05-02', '/g/demo currently 404s. Fix before sending to beta photographers.', 4, 2026],
  ['Photobox: Three photographer demos', 'Weeks 1-2', 'not_started', '2026-05-09', 'Frame as favor request, not pitch. "Tell me what\'s wrong."', 5, 2026],
  ['Photobox: Supply chain validation', 'Weeks 1-2', 'not_started', '2026-05-09', 'Local lab confirmed. Vendor conversation with engraver friend needed.', 6, 2026],
  ['Photobox: Stripe Connect + commerce', 'Months 2-3', 'not_started', '2026-07-15', '40-65 hours of work. Stripe Connect Express, photographer onboarding, base + markup pricing.', 7, 2026],
  ['Photobox: First paid box shipped', 'Months 4-6', 'not_started', '2026-09-30', 'First real revenue milestone. Validates entire end-to-end flow.', 8, 2026],
  ['Photography Y1 success criteria', 'Month 12', 'not_started', '2027-04-01', 'Senior assoc 2+ film weddings, junior 4+, gross up $80k+, hours flat or down.', 9, 2026],
] as const;

const floweMilestones = [
  ['Butterfly wefts: Initial PO', 'Months 1-2', 'not_started', '2026-06-15', '4-6 SKUs, 100-150 units. ~$15-20k cash outlay.', 1, 2026],
  ['Wefts: Shopify B2B + Pro pricing', 'Months 1-2', 'not_started', '2026-06-30', 'Pro account verification, 15-18% pro discount structure.', 2, 2026],
  ['Wefts: 20 stylist outreach', 'Months 2-4', 'not_started', '2026-07-15', 'Jordan personally calls 20 stylists from existing network. Send samples to top 8-12.', 3, 2026],
  ['Wefts: First reorder cycle', 'Months 4-6', 'not_started', '2026-10-01', 'Track which stylists reorder vs one-time. Reorder rate = leading indicator.', 4, 2026],
  ['Brand: Flowe identity locked', 'Months 1-3', 'not_started', '2026-07-15', 'Logo, palette, typography, voice that carries across wefts → salon → booth rental.', 5, 2026],
  ['Salon: Higher-value service marketing', 'Ongoing', 'not_started', '2026-12-31', 'Ensure Jordan can fill recovered chair time with $300+ services.', 6, 2026],
  ['Booth rental: Stable operation', 'Ongoing', 'in_progress', '2026-12-31', '$600/week × 3 stylists currently. Stable revenue, low effort.', 7, 2026],
  ['Wefts v2: Custom PU innovation', 'Months 12-18', 'not_started', '2027-10-01', 'Real product differentiation. Engineer with factory partner.', 8, 2027],
] as const;

for (const [title, phase, status, due, notes, ord, year] of marcoMilestones) {
  stores.milestones.push({ id: mid('marco', ord), business_id: 'marco', title, phase, status, due_date: due, notes, display_order: ord, target_year: year });
}
for (const [title, phase, status, due, notes, ord, year] of floweMilestones) {
  stores.milestones.push({ id: mid('flowe', ord), business_id: 'flowe', title, phase, status, due_date: due, notes, display_order: ord, target_year: year });
}

const subtasks: Array<[string, string, string, number]> = [
  ['marco', 'Senior associate film flagship', 'Formalize 50/50 split agreement in writing', 1],
  ['marco', 'Senior associate film flagship', 'Define film flagship package (deliverables, turnaround)', 2],
  ['marco', 'Senior associate film flagship', 'Build Marco Wang Film offer page', 3],
  ['marco', 'Senior associate film flagship', 'First booking target', 4],
  ['marco', 'Junior associate tier launch', 'Define junior tier package and pricing', 1],
  ['marco', 'Junior associate tier launch', 'Build Studio Associates landing page section', 2],
  ['marco', 'Junior associate tier launch', 'First sub-$10k inquiry routed to junior', 3],
  ['marco', 'Junior associate tier launch', 'Quality check protocol on first 5 weddings', 4],
  ['marco', 'Photobox: Fix demo gallery', 'Debug 404 on demo route', 1],
  ['marco', 'Photobox: Fix demo gallery', 'Seed demo gallery with hero images', 2],
  ['marco', 'Photobox: Fix demo gallery', 'Test on mobile + desktop', 3],
  ['marco', 'Photobox: Three photographer demos', 'Send outreach messages to 3 photographers', 1],
  ['marco', 'Photobox: Three photographer demos', 'Schedule 30-min demo calls', 2],
  ['marco', 'Photobox: Three photographer demos', 'Conduct demos and capture feedback', 3],
  ['marco', 'Photobox: Three photographer demos', 'Decision: greenlight, refine, or pivot', 4],
  ['marco', 'Photobox: Supply chain validation', 'Vendor conversation with engraver friend (terms in writing)', 1],
  ['marco', 'Photobox: Supply chain validation', 'Order print sample from local lab', 2],
  ['marco', 'Photobox: Supply chain validation', 'Contact 2 box vendors with 4x6 window-top spec', 3],
  ['marco', 'Photobox: Supply chain validation', 'Confirm per-box COGS at small batch', 4],
  ['flowe', 'Butterfly wefts: Initial PO', 'Finalize launch SKU list (16/18/20 base + 20 prem)', 1],
  ['flowe', 'Butterfly wefts: Initial PO', 'Confirm factory FOB pricing for initial run', 2],
  ['flowe', 'Butterfly wefts: Initial PO', 'Place initial PO', 3],
  ['flowe', 'Butterfly wefts: Initial PO', 'Inventory arrival and intake', 4],
  ['flowe', 'Wefts: 20 stylist outreach', 'Inventory stylist network (full list with notes)', 1],
  ['flowe', 'Wefts: 20 stylist outreach', 'Initial outreach to top 20', 2],
  ['flowe', 'Wefts: 20 stylist outreach', 'Send samples to 8-12 most likely converters', 3],
  ['flowe', 'Wefts: 20 stylist outreach', 'Convert 5-10 to first orders', 4],
];

for (const [biz, parent, title, ord] of subtasks) {
  const ms = stores.milestones.find((m) => m.business_id === biz && m.title === parent);
  if (!ms) continue;
  stores.milestone_subtasks.push({
    id: `subtask-${biz}-${ms.display_order}-${ord}`,
    milestone_id: ms.id,
    title,
    done: false,
    display_order: ord,
  });
}

type Filter = { col: string; val: any };

function applyFilters(rows: Row[], filters: Filter[]) {
  return rows.filter((r) => filters.every((f) => r[f.col] === f.val));
}

function buildQuery(table: string) {
  const filters: Filter[] = [];
  let orderCol: string | null = null;
  let isSingle = false;
  let mode: 'select' | 'insert' | 'update' | 'delete' = 'select';
  let payload: any = null;

  const exec = () => {
    const tableRows = stores[table] ?? [];
    if (mode === 'delete') {
      const keep = tableRows.filter((r) => !filters.every((f) => r[f.col] === f.val));
      stores[table] = keep;
      return { data: null, error: null };
    }
    if (mode === 'update') {
      for (const r of tableRows) {
        if (filters.every((f) => r[f.col] === f.val)) Object.assign(r, payload);
      }
      return { data: null, error: null };
    }
    if (mode === 'insert') {
      const rows = Array.isArray(payload) ? payload : [payload];
      const inserted = rows.map((row) => {
        const next = { id: `gen-${Math.random().toString(36).slice(2, 10)}`, ...row };
        tableRows.push(next);
        return next;
      });
      return { data: inserted.length === 1 ? inserted[0] : inserted, error: null };
    }
    let result = applyFilters(tableRows, filters);
    if (orderCol) {
      result = [...result].sort((a, b) => {
        const av = a[orderCol!];
        const bv = b[orderCol!];
        if (typeof av === 'number' && typeof bv === 'number') return av - bv;
        return String(av).localeCompare(String(bv));
      });
    }
    if (isSingle) return { data: result[0] ?? null, error: null };
    return { data: result, error: null };
  };

  const builder: any = {
    select() { return builder; },
    eq(col: string, val: any) { filters.push({ col, val }); return builder; },
    order(col: string) { orderCol = col; return builder; },
    single() { isSingle = true; return builder; },
    insert(row: any) { mode = 'insert'; payload = row; return builder; },
    update(patch: any) { mode = 'update'; payload = patch; return builder; },
    delete() { mode = 'delete'; return builder; },
    then(resolve: any, reject: any) {
      try { return Promise.resolve(exec()).then(resolve, reject); }
      catch (e) { return Promise.reject(e).then(resolve, reject); }
    },
    catch(reject: any) { return Promise.resolve(exec()).catch(reject); },
  };
  return builder;
}

export const isBypass = () => process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

export function createMockClient() {
  return {
    from: (table: string) => buildQuery(table),
    auth: {
      getUser: async () => ({ data: { user: { id: 'mock-user', email: 'bypass@local' } }, error: null }),
      signInWithOtp: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
    },
  } as any;
}
