import { ArrowLeft, ExternalLink } from 'lucide-react';

interface KimiSitePanelProps {
  onBackToChat: () => void;
}

/**
 * Hosts the imported Kimi static export without bundling its compiled Vue
 * runtime into the existing React application. The iframe keeps the imported
 * site's DOM, CSS, and client-side behavior isolated and visually intact.
 */
export function KimiSitePanel({ onBackToChat }: KimiSitePanelProps) {
  const importedSiteUrl = new URL('kimi/en/index.html', document.baseURI).pathname;

  return (
    <section className="flex min-h-screen flex-col bg-black text-white">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/90 px-4 py-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={onBackToChat}
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to Rishi AI
        </button>
        <a
          href={importedSiteUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          Open in new tab
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      </header>
      <iframe
        title="Imported Kimi website"
        src={importedSiteUrl}
        className="min-h-[calc(100vh-65px)] w-full flex-1 border-0 bg-white"
        loading="eager"
      />
    </section>
  );
}
