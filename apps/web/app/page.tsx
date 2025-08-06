import MarketsTable from "@/components/markets-table";

export default async function Home() {
  const response = await fetch(process.env.API_URL + "/api/markets");
  console.log(response);
  if (!response.ok) {
    return <div>Failed to fetch markets</div>;
  }
  const markets = await response.json();
  console.log({ markets });
  return <MarketsTable markets={markets} />;
}
