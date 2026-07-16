import { InboxManager } from "@/components/admin/InboxManager";

export default function AdminInboxPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl text-bark">Inquiries</h1>
      <p className="mt-1 mb-6 max-w-2xl text-sm text-stone">
        Form submissions from the public site. Check here even if you never got
        an email notification.
      </p>
      <InboxManager />
    </div>
  );
}
