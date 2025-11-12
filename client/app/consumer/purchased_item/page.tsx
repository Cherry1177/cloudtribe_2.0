import PurchasedItemContent from './PurchasedItemContent'

type Search = { tab?: string | string[] };

export default function Page({ searchParams }: { searchParams: Search }) {
  const tabParam = searchParams?.tab;
  const tab = Array.isArray(tabParam) ? tabParam[0] : (tabParam ?? undefined);
  const initialTab = tab === 'pending' ? 'pending' : 'all';

  return <PurchasedItemContent initialTab={initialTab} />;
}