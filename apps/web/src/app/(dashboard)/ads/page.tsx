'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://65.1.110.181/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Types ──────────────────────────────────────────────────────────────

interface ConnectedAccount {
  platform: 'meta' | 'google';
  accountId: string;
  accountName: string;
  accessToken: string;
  connected: boolean;
}

interface DashboardStats {
  totalSpend: number;
  totalClicks: number;
  conversions: number;
  avgRoas: number;
}

interface Campaign {
  id: string;
  name: string;
  platform: 'meta' | 'google';
  objective: string;
  budget: number;
  budgetType: 'daily' | 'lifetime';
  status: 'Active' | 'Paused' | 'Draft';
  spend: number;
  clicks: number;
  conversions: number;
  roas: number;
  startDate: string;
  endDate: string;
}

interface Audience {
  id: string;
  name: string;
  platform: 'meta' | 'google';
  type: 'Custom' | 'Lookalike' | 'Retargeting' | 'Interest';
  size: number;
  status: 'Active' | 'Building' | 'Ready';
}

interface CampaignForm {
  platform: 'meta' | 'google';
  name: string;
  objective: string;
  budget: number;
  budgetType: 'daily' | 'lifetime';
  startDate: string;
  endDate: string;
  ageMin: number;
  ageMax: number;
  gender: 'All' | 'Male' | 'Female';
  locations: string;
  headline: string;
  description: string;
  ctaText: string;
  landingUrl: string;
  imageUrl: string;
}

interface ConnectForm {
  accountId: string;
  accountName: string;
  accessToken: string;
}

interface AudienceForm {
  platform: 'meta' | 'google';
  name: string;
  type: 'Custom' | 'Lookalike' | 'Retargeting' | 'Interest';
}

// ── Mock Data ──────────────────────────────────────────────────────────

const mockStats: DashboardStats = {
  totalSpend: 124500,
  totalClicks: 18420,
  conversions: 342,
  avgRoas: 4.2,
};

const mockCampaigns: Campaign[] = [
  { id: '1', name: 'Summer Sale - Instagram Reels', platform: 'meta', objective: 'Conversions', budget: 5000, budgetType: 'daily', status: 'Active', spend: 42300, clicks: 8240, conversions: 156, roas: 5.1, startDate: '2026-03-01', endDate: '2026-03-31' },
  { id: '2', name: 'Google Shopping - Electronics', platform: 'google', objective: 'Catalog Sales', budget: 3000, budgetType: 'daily', status: 'Active', spend: 38200, clicks: 5120, conversions: 98, roas: 3.8, startDate: '2026-03-10', endDate: '2026-04-10' },
  { id: '3', name: 'Brand Awareness - Facebook', platform: 'meta', objective: 'Brand Awareness', budget: 50000, budgetType: 'lifetime', status: 'Paused', spend: 28000, clicks: 3200, conversions: 45, roas: 2.9, startDate: '2026-02-15', endDate: '2026-03-15' },
  { id: '4', name: 'Search Campaign - Apparel', platform: 'google', objective: 'Traffic', budget: 2000, budgetType: 'daily', status: 'Draft', spend: 0, clicks: 0, conversions: 0, roas: 0, startDate: '2026-04-01', endDate: '2026-04-30' },
  { id: '5', name: 'Retargeting - Cart Abandoners', platform: 'meta', objective: 'Conversions', budget: 1500, budgetType: 'daily', status: 'Active', spend: 16000, clicks: 1860, conversions: 43, roas: 6.2, startDate: '2026-03-05', endDate: '2026-03-25' },
];

const mockAudiences: Audience[] = [
  { id: '1', name: 'Website Visitors (30 days)', platform: 'meta', type: 'Retargeting', size: 24500, status: 'Active' },
  { id: '2', name: 'High-Value Buyers Lookalike', platform: 'meta', type: 'Lookalike', size: 1200000, status: 'Ready' },
  { id: '3', name: 'Fashion Enthusiasts', platform: 'google', type: 'Interest', size: 850000, status: 'Active' },
  { id: '4', name: 'Email Subscribers', platform: 'meta', type: 'Custom', size: 8200, status: 'Building' },
];

// ── Helpers ─────────────────────────────────────────────────────────────

const objectives = ['Traffic', 'Conversions', 'Catalog Sales', 'Brand Awareness', 'Reach', 'Engagement'];

function formatCurrency(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toLocaleString('en-IN')}`;
}

function formatNumber(val: number): string {
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toLocaleString('en-IN');
}

function campaignStatusClass(status: string): string {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-700';
    case 'Paused': return 'bg-yellow-100 text-yellow-700';
    case 'Draft': return 'bg-gray-100 text-gray-500';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function audienceStatusClass(status: string): string {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-700';
    case 'Building': return 'bg-blue-100 text-blue-700';
    case 'Ready': return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function audienceTypeClass(type: string): string {
  switch (type) {
    case 'Custom': return 'bg-indigo-100 text-indigo-700';
    case 'Lookalike': return 'bg-cyan-100 text-cyan-700';
    case 'Retargeting': return 'bg-orange-100 text-orange-700';
    case 'Interest': return 'bg-pink-100 text-pink-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function platformBadge(platform: 'meta' | 'google'): React.ReactElement {
  return platform === 'meta' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
      <span>📘</span> Meta
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
      <span>🔍</span> Google
    </span>
  );
}

// ── Component ──────────────────────────────────────────────────────────

export default function AdsManagerPage(): React.ReactElement {
  // State
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [audiences, setAudiences] = useState<Audience[]>(mockAudiences);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([
    { platform: 'meta', accountId: '', accountName: '', accessToken: '', connected: false },
    { platform: 'google', accountId: '', accountName: '', accessToken: '', connected: false },
  ]);

  // Modals
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState<'meta' | 'google' | null>(null);
  const [showAudienceModal, setShowAudienceModal] = useState(false);

  // Forms
  const [campaignForm, setCampaignForm] = useState<CampaignForm>({
    platform: 'meta', name: '', objective: 'Traffic', budget: 0, budgetType: 'daily',
    startDate: '', endDate: '', ageMin: 18, ageMax: 65, gender: 'All', locations: '',
    headline: '', description: '', ctaText: 'Shop Now', landingUrl: '', imageUrl: '',
  });
  const [connectForm, setConnectForm] = useState<ConnectForm>({ accountId: '', accountName: '', accessToken: '' });
  const [audienceForm, setAudienceForm] = useState<AudienceForm>({ platform: 'meta', name: '', type: 'Custom' });
  const [loading, setLoading] = useState(false);

  // ── Data Fetching ────────────────────────────────────────────────────

  const fetchDashboard = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`${API_URL}/ads/dashboard`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.data) setStats(json.data);
      }
    } catch {
      // fallback to mock
    }
  }, []);

  const fetchCampaigns = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`${API_URL}/ads/campaigns`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.length) setCampaigns(json.data);
      }
    } catch {
      // fallback to mock
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchCampaigns();
  }, [fetchDashboard, fetchCampaigns]);

  // ── Actions ──────────────────────────────────────────────────────────

  async function connectAccount(platform: 'meta' | 'google'): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ads/accounts/connect`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ platform, ...connectForm }),
      });
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) => a.platform === platform ? { ...a, ...connectForm, connected: true } : a)
        );
      } else {
        setAccounts((prev) =>
          prev.map((a) => a.platform === platform ? { ...a, ...connectForm, connected: true } : a)
        );
      }
    } catch {
      setAccounts((prev) =>
        prev.map((a) => a.platform === platform ? { ...a, ...connectForm, connected: true } : a)
      );
    }
    setConnectForm({ accountId: '', accountName: '', accessToken: '' });
    setShowConnectModal(null);
    setLoading(false);
  }

  function disconnectAccount(platform: 'meta' | 'google'): void {
    setAccounts((prev) =>
      prev.map((a) => a.platform === platform ? { ...a, accountId: '', accountName: '', accessToken: '', connected: false } : a)
    );
  }

  async function createCampaign(): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ads/campaigns`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(campaignForm),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setCampaigns((prev) => [json.data, ...prev]);
        }
      }
    } catch {
      // add locally as draft on failure
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        name: campaignForm.name,
        platform: campaignForm.platform,
        objective: campaignForm.objective,
        budget: campaignForm.budget,
        budgetType: campaignForm.budgetType,
        status: 'Draft',
        spend: 0, clicks: 0, conversions: 0, roas: 0,
        startDate: campaignForm.startDate,
        endDate: campaignForm.endDate,
      };
      setCampaigns((prev) => [newCampaign, ...prev]);
    }
    setCampaignForm({
      platform: 'meta', name: '', objective: 'Traffic', budget: 0, budgetType: 'daily',
      startDate: '', endDate: '', ageMin: 18, ageMax: 65, gender: 'All', locations: '',
      headline: '', description: '', ctaText: 'Shop Now', landingUrl: '', imageUrl: '',
    });
    setShowCampaignModal(false);
    setLoading(false);
  }

  async function toggleCampaignStatus(id: string): Promise<void> {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newStatus = c.status === 'Active' ? 'Paused' : 'Active';
        return { ...c, status: newStatus };
      })
    );
  }

  function deleteCampaign(id: string): void {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  function createAudience(): void {
    const newAudience: Audience = {
      id: Date.now().toString(),
      name: audienceForm.name,
      platform: audienceForm.platform,
      type: audienceForm.type,
      size: 0,
      status: 'Building',
    };
    setAudiences((prev) => [newAudience, ...prev]);
    setAudienceForm({ platform: 'meta', name: '', type: 'Custom' });
    setShowAudienceModal(false);
  }

  // ── Stats Cards Config ───────────────────────────────────────────────

  const statCards = [
    { label: 'Total Spend', value: formatCurrency(stats.totalSpend), icon: '💰', accent: 'border-l-indigo-500' },
    { label: 'Total Clicks', value: formatNumber(stats.totalClicks), icon: '👆', accent: 'border-l-blue-500' },
    { label: 'Conversions', value: formatNumber(stats.conversions), icon: '🎯', accent: 'border-l-green-500' },
    { label: 'Avg ROAS', value: `${stats.avgRoas.toFixed(1)}x`, icon: '📈', accent: 'border-l-purple-500' },
  ];

  const metaAccount = accounts.find((a) => a.platform === 'meta')!;
  const googleAccount = accounts.find((a) => a.platform === 'google')!;

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ads Manager</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your ad campaigns across Meta and Google from one place.</p>
        </div>
        <button
          onClick={() => setShowCampaignModal(true)}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          + Create Campaign
        </button>
      </div>

      {/* Connected Accounts */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {/* Meta Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-xl">📘</div>
              <div>
                <h3 className="font-semibold text-gray-900">Meta Ads</h3>
                <p className="text-xs text-gray-500">Facebook & Instagram</p>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${metaAccount.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {metaAccount.connected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
          {metaAccount.connected && (
            <p className="mt-3 text-sm text-gray-600">Account: <span className="font-medium text-gray-900">{metaAccount.accountName}</span></p>
          )}
          <div className="mt-4">
            {metaAccount.connected ? (
              <button onClick={() => disconnectAccount('meta')} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                Disconnect
              </button>
            ) : (
              <button onClick={() => setShowConnectModal('meta')} className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                Connect Account
              </button>
            )}
          </div>
        </div>

        {/* Google Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-xl">🔍</div>
              <div>
                <h3 className="font-semibold text-gray-900">Google Ads</h3>
                <p className="text-xs text-gray-500">Search, Display & Shopping</p>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${googleAccount.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {googleAccount.connected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
          {googleAccount.connected && (
            <p className="mt-3 text-sm text-gray-600">Account: <span className="font-medium text-gray-900">{googleAccount.accountName}</span></p>
          )}
          <div className="mt-4">
            {googleAccount.connected ? (
              <button onClick={() => disconnectAccount('google')} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                Disconnect
              </button>
            ) : (
              <button onClick={() => setShowConnectModal('google')} className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors">
                Connect Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-xl border border-gray-200 border-l-4 ${card.accent} bg-white p-5`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Campaigns Table */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Campaigns</h2>
          <span className="text-sm text-gray-500">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</span>
        </div>

        {campaigns.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
            <div className="text-4xl">📢</div>
            <h3 className="mt-3 text-lg font-semibold text-gray-900">No campaigns yet</h3>
            <p className="mt-1 text-sm text-gray-500">Create your first campaign to start driving traffic and sales.</p>
            <button
              onClick={() => setShowCampaignModal(true)}
              className="mt-5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Create your first campaign
            </button>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Platform</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Objective</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Budget</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Spend</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Clicks</th>
                  <th className="hidden px-4 py-3 font-medium xl:table-cell">Conv.</th>
                  <th className="hidden px-4 py-3 font-medium xl:table-cell">ROAS</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{c.name}</td>
                    <td className="px-4 py-3">{platformBadge(c.platform)}</td>
                    <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{c.objective}</td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                      {formatCurrency(c.budget)}<span className="text-gray-400">/{c.budgetType === 'daily' ? 'day' : 'total'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${campaignStatusClass(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">{formatCurrency(c.spend)}</td>
                    <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">{formatNumber(c.clicks)}</td>
                    <td className="hidden px-4 py-3 text-gray-600 xl:table-cell">{formatNumber(c.conversions)}</td>
                    <td className="hidden px-4 py-3 font-medium text-gray-900 xl:table-cell">{c.roas > 0 ? `${c.roas.toFixed(1)}x` : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleCampaignStatus(c.id)}
                          title={c.status === 'Active' ? 'Pause' : 'Resume'}
                          className={`rounded-lg p-2 text-sm transition-colors ${c.status === 'Active' ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                        >
                          {c.status === 'Active' ? '⏸' : '▶'}
                        </button>
                        <button
                          onClick={() => deleteCampaign(c.id)}
                          title="Delete"
                          className="rounded-lg p-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audiences Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Audiences</h2>
          <button
            onClick={() => setShowAudienceModal(true)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            + Create Audience
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Size</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {audiences.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                  <td className="px-4 py-3">{platformBadge(a.platform)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${audienceTypeClass(a.type)}`}>
                      {a.type}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">{a.size > 0 ? formatNumber(a.size) : 'Building...'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${audienceStatusClass(a.status)}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Connect Account Modal ──────────────────────────────────────── */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Connect {showConnectModal === 'meta' ? 'Meta' : 'Google'} Ads
              </h2>
              <button onClick={() => setShowConnectModal(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Account ID</label>
                <input
                  type="text"
                  value={connectForm.accountId}
                  onChange={(e) => setConnectForm({ ...connectForm, accountId: e.target.value })}
                  placeholder="e.g. act_123456789"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Name</label>
                <input
                  type="text"
                  value={connectForm.accountName}
                  onChange={(e) => setConnectForm({ ...connectForm, accountName: e.target.value })}
                  placeholder="My Business Account"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Access Token</label>
                <input
                  type="password"
                  value={connectForm.accessToken}
                  onChange={(e) => setConnectForm({ ...connectForm, accessToken: e.target.value })}
                  placeholder="Paste your access token"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => connectAccount(showConnectModal)}
                disabled={loading || !connectForm.accountId || !connectForm.accountName || !connectForm.accessToken}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Connecting...' : 'Connect'}
              </button>
              <button
                onClick={() => setShowConnectModal(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Campaign Modal ──────────────────────────────────────── */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Create Campaign</h2>
              <button onClick={() => setShowCampaignModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCampaignForm({ ...campaignForm, platform: 'meta' })}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${campaignForm.platform === 'meta' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="text-2xl">📘</span>
                    <div>
                      <p className="font-semibold text-gray-900">Meta Ads</p>
                      <p className="text-xs text-gray-500">Facebook & Instagram</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampaignForm({ ...campaignForm, platform: 'google' })}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${campaignForm.platform === 'google' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="text-2xl">🔍</span>
                    <div>
                      <p className="font-semibold text-gray-900">Google Ads</p>
                      <p className="text-xs text-gray-500">Search, Display & Shopping</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Campaign Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    placeholder="e.g. Summer Sale - Instagram"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Objective</label>
                  <select
                    value={campaignForm.objective}
                    onChange={(e) => setCampaignForm({ ...campaignForm, objective: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    {objectives.map((obj) => (
                      <option key={obj} value={obj}>{obj}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget (INR)</label>
                  <input
                    type="number"
                    value={campaignForm.budget || ''}
                    onChange={(e) => setCampaignForm({ ...campaignForm, budget: Number(e.target.value) })}
                    placeholder="5000"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Budget Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={campaignForm.budgetType === 'daily'}
                      onChange={() => setCampaignForm({ ...campaignForm, budgetType: 'daily' })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Daily</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={campaignForm.budgetType === 'lifetime'}
                      onChange={() => setCampaignForm({ ...campaignForm, budgetType: 'lifetime' })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Lifetime</span>
                  </label>
                </div>
              </div>

              {/* Dates */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={campaignForm.endDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Targeting */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Targeting</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age Min</label>
                    <input
                      type="number"
                      value={campaignForm.ageMin}
                      onChange={(e) => setCampaignForm({ ...campaignForm, ageMin: Number(e.target.value) })}
                      min={13} max={65}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age Max</label>
                    <input
                      type="number"
                      value={campaignForm.ageMax}
                      onChange={(e) => setCampaignForm({ ...campaignForm, ageMax: Number(e.target.value) })}
                      min={13} max={65}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <select
                      value={campaignForm.gender}
                      onChange={(e) => setCampaignForm({ ...campaignForm, gender: e.target.value as 'All' | 'Male' | 'Female' })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="All">All</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Locations</label>
                  <input
                    type="text"
                    value={campaignForm.locations}
                    onChange={(e) => setCampaignForm({ ...campaignForm, locations: e.target.value })}
                    placeholder="Mumbai, Delhi, Bangalore"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">Comma-separated list of target locations</p>
                </div>
              </div>

              {/* Creative */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Creative</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Headline</label>
                    <input
                      type="text"
                      value={campaignForm.headline}
                      onChange={(e) => setCampaignForm({ ...campaignForm, headline: e.target.value })}
                      placeholder="Shop the Summer Sale"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CTA Button Text</label>
                    <input
                      type="text"
                      value={campaignForm.ctaText}
                      onChange={(e) => setCampaignForm({ ...campaignForm, ctaText: e.target.value })}
                      placeholder="Shop Now"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={campaignForm.description}
                      onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                      rows={2}
                      placeholder="Get up to 50% off on all summer styles..."
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Landing URL</label>
                    <input
                      type="url"
                      value={campaignForm.landingUrl}
                      onChange={(e) => setCampaignForm({ ...campaignForm, landingUrl: e.target.value })}
                      placeholder="https://yourstore.com/summer-sale"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Image URL <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="url"
                      value={campaignForm.imageUrl}
                      onChange={(e) => setCampaignForm({ ...campaignForm, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3 border-t border-gray-100 pt-6">
              <button
                onClick={createCampaign}
                disabled={loading || !campaignForm.name || !campaignForm.budget}
                className="flex-1 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Launching...' : 'Launch Campaign'}
              </button>
              <button
                onClick={() => setShowCampaignModal(false)}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Audience Modal ──────────────────────────────────────── */}
      {showAudienceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Create Audience</h2>
              <button onClick={() => setShowAudienceModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Platform</label>
                <select
                  value={audienceForm.platform}
                  onChange={(e) => setAudienceForm({ ...audienceForm, platform: e.target.value as 'meta' | 'google' })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="meta">Meta (Facebook/Instagram)</option>
                  <option value="google">Google Ads</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Audience Name</label>
                <input
                  type="text"
                  value={audienceForm.name}
                  onChange={(e) => setAudienceForm({ ...audienceForm, name: e.target.value })}
                  placeholder="e.g. High-Value Customers"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={audienceForm.type}
                  onChange={(e) => setAudienceForm({ ...audienceForm, type: e.target.value as AudienceForm['type'] })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Custom">Custom</option>
                  <option value="Lookalike">Lookalike</option>
                  <option value="Retargeting">Retargeting</option>
                  <option value="Interest">Interest-based</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={createAudience}
                disabled={!audienceForm.name}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Audience
              </button>
              <button
                onClick={() => setShowAudienceModal(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
