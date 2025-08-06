export const dynamic = "force-static";
export const fetchCache = "force-cache";
export const revalidate = 2592000000; // this page will be revalidated via a webhook

import MarketsTable from "@/components/markets-table";

export default async function Home() {
  console.log({ process: process.env.API_URL });
  const response = await fetch(process.env.API_URL + "/api/markets");
  if (!response.ok) {
    return <div>Failed to fetch markets</div>;
  }
  const markets = await response.json();
  return <MarketsTable markets={markets} />;
}
