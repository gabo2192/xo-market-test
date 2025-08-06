import dynamic from "next/dynamic";
import type { Props } from "./ai-evaluation-dialog";

const AiEvaluationDialog = dynamic<Props>(
  () => import("./ai-evaluation-dialog"),
  {
    ssr: false,
  }
);

export default AiEvaluationDialog;
