"use client";

import Image from "next/image";
import { useState } from "react";
import { IMAGE_BLUR_DATA_URL } from "@/lib/imagePlaceholder";

export default function PhotoGallery({
  photos,
  alt,
}: {
  photos: { id: number; url: string }[];
  alt: string;
}) {
  const [selected, setSelected] = useState(0);
  const active = photos[selected] ?? photos[0];

  return (
    <div className="space-y-2">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-orange-50 dark:bg-stone-800">
        <Image
          src={active.url}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 600px"
          placeholder="blur"
          blurDataURL={IMAGE_BLUR_DATA_URL}
        />
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSelected(index)}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg ring-2 transition-colors ${
                index === selected
                  ? "ring-orange-500"
                  : "ring-transparent hover:ring-orange-200 dark:hover:ring-stone-600"
              }`}
            >
              <Image
                src={photo.url}
                alt={`${alt} photo ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
                placeholder="blur"
                blurDataURL={IMAGE_BLUR_DATA_URL}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
