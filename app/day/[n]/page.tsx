import DayView from "@/components/DayView";

interface PageProps {
  params: Promise<{ n: string }>;
}

export default async function DayPage({ params }: PageProps) {
  const { n } = await params;
  const day = parseInt(n, 10);
  const validDay = isNaN(day) || day < 1 || day > 365 ? 1 : day;

  return <DayView day={validDay} />;
}

export function generateStaticParams() {
  return Array.from({ length: 365 }, (_, i) => ({ n: String(i + 1) }));
}

export function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  return params.then(({ n }) => ({
    title: `Day ${n} | Bible in a Year`,
  }));
}
