import { Market } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@workspace/ui/components/dialog";

export interface Props {
  market: Market;
  setSelectedAiEvaluation: (market: Market | null) => void;
}

export default function AiEvaluationDialog({
  market,
  setSelectedAiEvaluation,
}: Props) {
  return (
    <Dialog open={true} onOpenChange={() => setSelectedAiEvaluation(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Evaluation for {market.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium">Resolvability</h3>
            <p className="text-sm text-muted-foreground">{market.aiResolvability}</p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium">Clarity</h3>
            <p className="text-sm text-muted-foreground">{market.aiClarity}</p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium">Manipulability</h3>
            <p className="text-sm text-muted-foreground">{market.aiManipulabilityRisk}</p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium">AI Explanation</h3>
            <p className="text-sm text-muted-foreground">{market.aiExplanation}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
