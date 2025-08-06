import dynamic from "next/dynamic";
import type { Props } from "./markets-dialog";

const MarketsDialog = dynamic<Props>(() => import("./markets-dialog"), {
  ssr: false,
});

export default MarketsDialog;
