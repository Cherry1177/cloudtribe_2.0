import PurchasedItemContent from './PurchasedItemContent'

type Search = { tab?: string | string[] };

export default async function Page({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const tabParam = params?.tab;
  const tab = Array.isArray(tabParam) ? tabParam[0] : (tabParam ?? undefined);
  const initialTab = tab === 'pending' ? 'pending' : 'all';

  return <PurchasedItemContent initialTab={initialTab} />;
}