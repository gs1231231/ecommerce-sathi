'use client';

import { useState } from 'react';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BlockType {
  id: string;
  label: string;
  icon: string;
}

interface CanvasSection {
  id: string;
  type: string;
  label: string;
}

interface SectionProps {
  bg: string;
  textColor: string;
  padding: string;
  fontSize: string;
  aiPrompt: string;
}

type Viewport = 'desktop' | 'tablet' | 'mobile';

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const blocks: BlockType[] = [
  { id: 'hero', label: 'Hero Section', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z' },
  { id: 'product-grid', label: 'Product Grid', icon: 'M4 4h4v4H4V4zm6 0h4v4h-4V4zm-6 6h4v4H4v-4zm6 0h4v4h-4v-4z' },
  { id: 'featured', label: 'Featured Products', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { id: 'category-banner', label: 'Category Banner', icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4z' },
  { id: 'testimonials', label: 'Testimonials', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { id: 'newsletter', label: 'Newsletter', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'rich-text', label: 'Rich Text', icon: 'M4 6h16M4 12h8m-8 6h16' },
  { id: 'image-gallery', label: 'Image Gallery', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'header', label: 'Header', icon: 'M3 4h18M3 8h18' },
  { id: 'footer', label: 'Footer', icon: 'M3 16h18M3 20h18' },
];

const initialSections: CanvasSection[] = [
  { id: 'sec-1', type: 'hero', label: 'Hero Section' },
  { id: 'sec-2', type: 'product-grid', label: 'Product Grid' },
  { id: 'sec-3', type: 'footer', label: 'Footer' },
];

const viewportWidths: Record<Viewport, string> = {
  desktop: 'w-full',
  tablet: 'max-w-[768px]',
  mobile: 'max-w-[375px]',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function BlockIcon({ path }: { path: string }): React.ReactElement {
  return (
    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Canvas section renderers                                           */
/* ------------------------------------------------------------------ */

function HeroPreview(): React.ReactElement {
  return (
    <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-20 text-center text-white">
      <h1 className="mb-3 text-4xl font-bold">Welcome to Our Store</h1>
      <p className="mx-auto mb-6 max-w-xl text-lg text-indigo-100">
        Discover amazing products at unbeatable prices. Shop the latest trends today.
      </p>
      <button className="rounded-lg bg-white px-6 py-3 font-semibold text-indigo-600 shadow-lg transition hover:bg-indigo-50">
        Shop Now
      </button>
    </div>
  );
}

function ProductGridPreview(): React.ReactElement {
  const products = [
    { name: 'Cotton Kurta Set', price: '1,499', img: 'bg-amber-100' },
    { name: 'Silver Jhumka', price: '899', img: 'bg-pink-100' },
    { name: 'Leather Wallet', price: '649', img: 'bg-blue-100' },
    { name: 'Silk Dupatta', price: '1,199', img: 'bg-emerald-100' },
  ];
  return (
    <div className="bg-white px-8 py-12">
      <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">Trending Products</h2>
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
        {products.map((p) => (
          <div key={p.name} className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <div className={`${p.img} flex h-36 items-center justify-center text-3xl`}>
              <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-gray-900">{p.name}</p>
              <p className="text-sm font-bold text-indigo-600">{'\u20B9'}{p.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterPreview(): React.ReactElement {
  return (
    <div className="bg-gray-900 px-8 py-10 text-gray-400">
      <div className="mx-auto flex max-w-4xl flex-wrap justify-between gap-8">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Company</h3>
          <ul className="space-y-2 text-sm">
            <li>About Us</li>
            <li>Careers</li>
            <li>Contact</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Support</h3>
          <ul className="space-y-2 text-sm">
            <li>Help Center</li>
            <li>Returns</li>
            <li>Shipping</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
            <li>GST Info</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-4xl border-t border-gray-700 pt-6 text-center text-xs text-gray-500">
        &copy; 2026 eCommerce Sathi. All rights reserved.
      </div>
    </div>
  );
}

function renderSectionContent(type: string): React.ReactElement {
  switch (type) {
    case 'hero':
      return <HeroPreview />;
    case 'product-grid':
      return <ProductGridPreview />;
    case 'footer':
      return <FooterPreview />;
    default:
      return (
        <div className="flex items-center justify-center bg-gray-50 px-8 py-16 text-gray-400">
          <p className="text-sm">[ {type} section ]</p>
        </div>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function EditorPage(): React.ReactElement {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [sections, setSections] = useState<CanvasSection[]>(initialSections);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [props, setProps] = useState<SectionProps>({
    bg: '#ffffff',
    textColor: '#111827',
    padding: '48',
    fontSize: '16',
    aiPrompt: '',
  });

  function showToast(msg: string): void {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  function handleDelete(id: string): void {
    setSections((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  const selectedSection = sections.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex h-screen flex-col bg-gray-100 text-sm">
      {/* -------- Toast -------- */}
      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* -------- Toolbar -------- */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold">Editor</span>
          </Link>
        </div>

        {/* Center - viewport toggles */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {(['desktop', 'tablet', 'mobile'] as Viewport[]).map((vp) => (
            <button
              key={vp}
              onClick={() => setViewport(vp)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                viewport === vp ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {vp === 'desktop' && (
                <svg className="mr-1 inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
              {vp === 'tablet' && (
                <svg className="mr-1 inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
              {vp === 'mobile' && (
                <svg className="mr-1 inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
              {vp.charAt(0).toUpperCase() + vp.slice(1)}
            </button>
          ))}
        </div>

        {/* Right - actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreview((p) => !p)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              isPreview ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="mr-1 inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>
          <button
            onClick={() => showToast('Saved!')}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
          >
            Save
          </button>
          <button
            onClick={() => showToast('Published successfully!')}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
          >
            Publish
          </button>
          <button
            onClick={() => showToast('AI Edit coming soon!')}
            className="rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition hover:bg-purple-100"
          >
            <svg className="mr-1 inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Edit
          </button>
        </div>
      </header>

      {/* -------- Body -------- */}
      <div className="flex flex-1 overflow-hidden">
        {/* -------- Left sidebar: Blocks -------- */}
        {!isPreview && (
          <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Blocks</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 gap-2">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="group flex cursor-grab flex-col items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', block.id)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm group-hover:bg-indigo-100">
                      <BlockIcon path={block.icon} />
                    </div>
                    <span className="text-center text-[11px] font-medium leading-tight text-gray-600 group-hover:text-indigo-700">
                      {block.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* -------- Canvas -------- */}
        <div
          className="flex flex-1 flex-col items-center overflow-y-auto bg-gray-100 p-6"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const blockId = e.dataTransfer.getData('text/plain');
            const block = blocks.find((b) => b.id === blockId);
            if (block) {
              const newSection: CanvasSection = {
                id: `sec-${Date.now()}`,
                type: block.id,
                label: block.label,
              };
              setSections((prev) => [...prev, newSection]);
              showToast(`Added ${block.label}`);
            }
          }}
        >
          <div className={`${viewportWidths[viewport]} w-full transition-all duration-300 ${viewport !== 'desktop' ? 'mx-auto' : ''}`}>
            <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg">
              {sections.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                  <svg className="mb-4 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-sm font-medium">Drag blocks here to build your storefront</p>
                </div>
              )}
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={`group relative cursor-pointer transition ${
                    selectedId === section.id ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                  }`}
                  onClick={() => setSelectedId(section.id)}
                >
                  {renderSectionContent(section.type)}

                  {/* Hover overlay */}
                  {!isPreview && (
                    <div className="pointer-events-none absolute inset-0 border-2 border-transparent transition group-hover:border-indigo-400 group-hover:bg-indigo-500/5">
                      <div className="pointer-events-auto absolute top-2 right-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(section.id);
                          }}
                          className="rounded bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-md transition hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(section.id);
                          }}
                          className="rounded bg-white px-2 py-1 text-xs font-medium text-red-600 shadow-md transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                      {/* Section label badge */}
                      <div className="pointer-events-none absolute top-2 left-2 opacity-0 transition group-hover:opacity-100">
                        <span className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                          {section.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* -------- Right sidebar: Properties -------- */}
        {!isPreview && (
          <aside className="flex w-70 shrink-0 flex-col border-l border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Properties</h2>
            </div>

            {selectedSection ? (
              <div className="flex-1 overflow-y-auto p-4">
                {/* Section name */}
                <div className="mb-5 rounded-lg bg-indigo-50 px-3 py-2">
                  <p className="text-xs font-semibold text-indigo-700">{selectedSection.label}</p>
                  <p className="text-[11px] text-indigo-500">ID: {selectedSection.id}</p>
                </div>

                {/* Style properties */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={props.bg}
                        onChange={(e) => setProps({ ...props, bg: e.target.value })}
                        className="h-8 w-8 cursor-pointer rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={props.bg}
                        onChange={(e) => setProps({ ...props, bg: e.target.value })}
                        className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={props.textColor}
                        onChange={(e) => setProps({ ...props, textColor: e.target.value })}
                        className="h-8 w-8 cursor-pointer rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={props.textColor}
                        onChange={(e) => setProps({ ...props, textColor: e.target.value })}
                        className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Padding (px)</label>
                    <input
                      type="range"
                      min="0"
                      max="120"
                      value={props.padding}
                      onChange={(e) => setProps({ ...props, padding: e.target.value })}
                      className="w-full accent-indigo-600"
                    />
                    <div className="mt-0.5 flex justify-between text-[10px] text-gray-400">
                      <span>0</span>
                      <span className="font-medium text-gray-600">{props.padding}px</span>
                      <span>120</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Font Size (px)</label>
                    <input
                      type="range"
                      min="10"
                      max="48"
                      value={props.fontSize}
                      onChange={(e) => setProps({ ...props, fontSize: e.target.value })}
                      className="w-full accent-indigo-600"
                    />
                    <div className="mt-0.5 flex justify-between text-[10px] text-gray-400">
                      <span>10</span>
                      <span className="font-medium text-gray-600">{props.fontSize}px</span>
                      <span>48</span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <hr className="my-5 border-gray-200" />

                {/* AI Edit */}
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
                    <svg className="h-3.5 w-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Edit
                  </label>
                  <textarea
                    rows={3}
                    value={props.aiPrompt}
                    onChange={(e) => setProps({ ...props, aiPrompt: e.target.value })}
                    placeholder="e.g. Make the hero section more vibrant with a CTA for Diwali sale..."
                    className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-xs placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={() => showToast('AI Edit applied!')}
                    className="mt-2 w-full rounded-md bg-purple-600 py-1.5 text-xs font-medium text-white transition hover:bg-purple-700"
                  >
                    Apply AI Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-gray-400">
                <svg className="mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="text-xs font-medium text-gray-500">Select a section to edit its properties</p>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* -------- Bottom bar -------- */}
      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-gray-200 bg-white px-4 text-[11px] text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
            Auto-saved 30s ago
          </span>
          <span className="text-gray-300">|</span>
          <span>{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
        </div>
        <span className="font-medium">Version 1 of 10</span>
      </footer>
    </div>
  );
}
