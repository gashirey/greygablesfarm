import { EventEditor } from "@/components/admin/EventEditor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEventEditPage({ params }: Props) {
  const { id } = await params;
  return <EventEditor eventId={id} />;
}
