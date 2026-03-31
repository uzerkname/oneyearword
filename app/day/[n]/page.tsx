import { redirect } from "next/navigation";
import DayView from "@/components/DayView";

interface PageProps {
  params: Promise<{ n: string }>;
}

export default async function DayPage({ params }: PageProps) {
  const { n } = await params;
  const day = parseInt(n, 10);

  if (isNaN(day) || day < 1 || day > 365) {
    redirect("/day/1");
  }

  return <DayView day={day} />;
}

export function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  return params.then(({ n }) => ({
    title: `Day ${n} | Bible in a Year`,
  }));
}
