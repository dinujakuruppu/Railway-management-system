import { Suspense } from "react";
import TrainDetailsPage from "@/components/pages/TrainDetailsPage";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
export const metadata = { title: "Train details" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TrainDetailsPage id={id} />
    </Suspense>
  );
}
