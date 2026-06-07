import type { Metadata } from "next";

import { MyPlanBoard } from "./my-plan-board";

export const metadata: Metadata = { title: "My Plan — Pay Small Small — OCare Phinas" };

export default function MyPlanPage() {
  return <MyPlanBoard />;
}
