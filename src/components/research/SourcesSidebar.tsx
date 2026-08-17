import React from 'react';
import { SearchCitationsPanel, SourceItem } from './SearchCitationsPanel';

interface Source {
  url: string;
  title: string;
  index: number;
}

interface SourcesSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: Source[];
}

export const SourcesSidebar: React.FC<SourcesSidebarProps> = React.memo(({ open, onOpenChange, sources }) => {
  const formattedSources: SourceItem[] = sources.map((s, idx) => ({
    title: s.title,
    url: s.url,
    index: s.index ?? idx + 1
  }));

  return (
    <SearchCitationsPanel
      open={open}
      onOpenChange={onOpenChange}
      sources={formattedSources}
      mode="sidebar"
    />
  );
});

SourcesSidebar.displayName = 'SourcesSidebar';


