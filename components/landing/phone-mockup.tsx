import Image from "next/image";

// A realistic phone frame (public/border2.png — a PNG with a transparent screen
// cutout) used throughout the landing page. Screen content is passed as
// children and shows through the glass; the frame, including its notch, overlays
// on top. Presentational only. No client JS.
//
// Insets below match the transparent window measured from border.png, so the
// content sits exactly inside the glass (and fills up behind the notch).
export function PhoneMockup({
  children,
  className = "",
  width = "w-[260px] sm:w-[280px]",
}: {
  children: React.ReactNode;
  className?: string;
  // Width utility classes for the frame; height follows via the 1:2 aspect and
  // the screen content scales with it. Override per placement (e.g. the hero).
  width?: string;
}) {
  return (
    <div className={`relative mx-auto aspect-[1/2] ${width} ${className}`}>
      {/* App screen — fills the glass; frame masks the rounded corners. */}
      <div
        className="absolute overflow-hidden rounded-[1.7rem] bg-background"
        style={{ top: "3.58%", bottom: "3.8%", left: "8.05%", right: "8.24%" }}
      >
        {children}
      </div>
      {/* Decorative frame on top — transparent screen lets content show. */}
      <Image
        src="/border2.png"
        alt=""
        fill
        sizes="280px"
        priority
        className="pointer-events-none select-none object-fill"
      />
    </div>
  );
}

// A small status bar so the screens read as a real app.
function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-4 text-[11px] font-semibold text-foreground">
      <span>9:41</span>
      <span className="tracking-tight">●●● ▤ ▮</span>
    </div>
  );
}

// An image card used inside the app screens.
function ScreenCard({
  image,
  title,
  meta,
}: {
  image: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
        <Image src={image} alt="" fill sizes="140px" className="object-cover" />
      </div>
      <p className="truncate text-[11px] font-medium text-foreground">{title}</p>
      <p className="text-[10px] text-zinc-500">{meta}</p>
    </div>
  );
}

/** Hero / discovery feed screen. */
export function FeedScreen({ heading }: { heading: string }) {
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <div className="mx-4 mt-3 flex items-center gap-2 rounded-full border border-nav-border px-3 py-2 text-[11px] text-zinc-500">
        <span>🔍</span>
        <span>Start your search</span>
      </div>
      <p className="mt-4 px-4 text-[13px] font-semibold text-foreground">
        {heading}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-3 px-4">
        <ScreenCard
          image="/images/chef.jpeg"
          title="Pasta night with Lina"
          meta="$45 / guest · ★ 5.0"
        />
        <ScreenCard
          image="/images/yoga.jpeg"
          title="Sunrise yoga in the park"
          meta="$20 / guest · ★ 4.9"
        />
        <ScreenCard
          image="/images/makeup.jpeg"
          title="Night-out glam session"
          meta="$60 / guest · ★ 5.0"
        />
        <ScreenCard
          image="/images/teacher.jpeg"
          title="Beginner guitar lesson"
          meta="$35 / guest · ★ 4.8"
        />
      </div>
    </div>
  );
}

/** Listing-detail screen (photo grid). */
export function ListingScreen() {
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <p className="mt-3 px-4 text-center text-[11px] font-medium text-zinc-500">
        Cooking · Your city
      </p>
      <div className="mt-3 grid grid-cols-2 gap-1 px-3">
        {["chef", "makeup", "yoga", "teacher"].map((k) => (
          <div
            key={k}
            className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 first:rounded-tl-xl dark:bg-zinc-800"
          >
            <Image
              src={`/images/${k === "yoga" ? "yoga" : k}.jpeg`}
              alt=""
              fill
              sizes="120px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="mt-3 px-4">
        <p className="text-[13px] font-semibold text-foreground">
          Pasta night with Lina
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Hand-rolled pasta in a cosy home kitchen.
        </p>
        <p className="mt-1.5 text-[11px] font-medium text-foreground">
          ★ 5.0 · 36 reviews
        </p>
      </div>
    </div>
  );
}

/** Calendar / scheduling screen. */
export function CalendarScreen() {
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <p className="mt-4 px-4 text-[13px] font-semibold text-foreground">
        Your calendar
      </p>
      <div className="mt-3 grid grid-cols-7 gap-1 px-4 text-center text-[9px] text-zinc-400">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
        {Array.from({ length: 21 }).map((_, i) => (
          <span
            key={i}
            className={`flex h-6 items-center justify-center rounded-md text-foreground ${
              i === 9 ? "bg-accent text-accent-foreground" : ""
            } ${i === 12 || i === 16 ? "bg-accent/10 text-accent" : ""}`}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <div className="mx-4 mt-3 rounded-lg bg-accent/10 px-3 py-2">
        <p className="text-[10px] font-medium text-accent">11:00 · Booked</p>
        <p className="text-[10px] text-zinc-500">Pasta night · 7 of 10 guests</p>
      </div>
    </div>
  );
}
