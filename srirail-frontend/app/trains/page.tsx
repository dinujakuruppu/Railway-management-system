import { Suspense } from "react";
import TrainSearchPage from "@/components/pages/TrainSearchPage";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
export const metadata = { title: "Find a train" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TrainSearchPage />
    </Suspense>
  );
}
