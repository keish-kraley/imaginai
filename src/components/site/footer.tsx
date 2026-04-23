export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-[var(--color-muted-foreground)] sm:flex-row sm:px-6">
        <div>© {new Date().getFullYear()} ImaginAI por Astra. Todos os direitos reservados.</div>
        <div className="flex gap-4">
          <a href="/contato" className="hover:text-[var(--color-foreground)]">Contato</a>
          <a href="/como-usar" className="hover:text-[var(--color-foreground)]">Como usar</a>
          <a href="/como-funciona" className="hover:text-[var(--color-foreground)]">Como funciona</a>
        </div>
      </div>
    </footer>
  );
}
