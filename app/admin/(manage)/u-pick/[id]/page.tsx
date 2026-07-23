import { UPickExperienceEditor } from "@/components/admin/UPickExperienceEditor";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function AdminUPickExperiencePage({ params }: Params) {
  const { id } = await params;
  return <UPickExperienceEditor experienceId={id} />;
}
