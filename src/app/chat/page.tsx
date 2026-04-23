import { Sparkles } from "lucide-react";
import { NewConversationClient } from "@/components/chat/new-conversation-client";

export default async function ChatIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-brand-blue-soft)] text-[var(--color-brand-blue)]">
        <Sparkles className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-semibold">Comece sua primeira ideia</h1>
      <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
        Descreva um item para casa ou construção e deixe a IA ganhar forma. Suas
        ideias aprovadas são encaminhadas para a equipe da Astra.
      </p>
      <NewConversationClient initialPrompt={sp.prompt} />
    </div>
  );
}
