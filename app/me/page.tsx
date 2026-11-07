import type { Metadata } from "next";
import MyLists from "@/components/MyLists";

export const metadata: Metadata = {
  title: "My recommendations · Food Recommendations",
  robots: { index: false },
};

export default function MePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <section className="mb-8 max-w-2xl">
        <h1 className="text-[30px] font-extrabold leading-[38px] tracking-tight text-ink sm:text-[40px] sm:leading-[48px]">
          My recommendations
        </h1>
        <p className="mt-2 text-base leading-6 text-muted">
          Posts made from this browser and dishes you&apos;ve saved. There are no accounts — this list
          lives on this device only.
        </p>
      </section>
      <MyLists />
    </div>
  );
}
