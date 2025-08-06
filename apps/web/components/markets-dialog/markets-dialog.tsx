import { Market } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

export interface Props {
  market: Market;
  setSelectedMarket: (market: Market | null) => void;
}

export default function MarketsDialog({ market, setSelectedMarket }: Props) {
  return (
    <Dialog open={true} onOpenChange={() => setSelectedMarket(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{market.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium">End Date</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(Number(market.expiresAt) * 1000).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium">Total Volume</h3>
            <p className="text-sm text-muted-foreground">
              {(Number(market.totalVolume) / 10 ** 6).toLocaleString(
                undefined,  
                {
                  style: "currency",
                  currency: "USD",
                }
              )}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium">Resolution</h3>
            <p className="text-sm text-muted-foreground">
              {market.resolutionCriteria}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
