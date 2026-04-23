"use client";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface ExamplePromptItem {
  id: string;
  prompt: string;
  imageUrl: string;
}

export function ExampleGallery({ items }: { items: ExamplePromptItem[] }) {
  // Duplicate to fill two rows consistently.
  const top = items.slice(0, 7);
  const bottom = items.slice(7, 14).concat(items.slice(0, Math.max(0, 7 - (items.length - 7))));

  return (
    <div className="mx-auto mt-12 w-full max-w-6xl space-y-3 px-4 sm:px-6">
      <GalleryRow items={top} offsetClassName="" />
      <GalleryRow items={bottom} offsetClassName="-translate-x-8 sm:-translate-x-16" />
    </div>
  );
}

function GalleryRow({
  items,
  offsetClassName,
}: {
  items: ExamplePromptItem[];
  offsetClassName: string;
}) {
  return (
    <div className={cn("grid grid-cols-7 gap-3", offsetClassName)}>
      {items.map((item) => (
        <GalleryCell key={item.id + item.prompt} item={item} />
      ))}
    </div>
  );
}

function GalleryCell({ item }: { item: ExamplePromptItem }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--color-muted)]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Image
        src={item.imageUrl}
        alt={item.prompt}
        fill
        sizes="(min-width: 640px) 14vw, 28vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center bg-white/90 p-3 text-center text-xs text-[var(--color-foreground)] opacity-0 transition-opacity duration-200",
          hover && "opacity-100",
        )}
      >
        <span className="line-clamp-4">{item.prompt}</span>
      </div>
    </div>
  );
}
