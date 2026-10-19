"use client";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { popularRoutes } from "@/data/stations";
import { dateOffset, formatDate, money, searchQuery } from "@/lib/format";
import JourneySearchForm from "@/components/booking/JourneySearchForm";
import Icon, { type IconName } from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
const highlights: { icon: IconName; title: string; description: string }[] = [
  {
    icon: "search",
    title: "Find your way",
    description:
      "Compare journeys, departure times and travel classes in one place.",
  },
  {
    icon: "ticket",
    title: "A place for your plans",
    description:
      "Choose a reserved seat or travel with a flexible open-seating ticket.",
  },
  {
    icon: "phone",
    title: "Your ticket, with you",
    description:
      "Keep a digital ticket on your phone, or print a copy before you go.",
  },
];
export default function HomePage() {
  const { notices } = useApp();
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <p className="eyebrow">Across the island. Closer to you.</p>
              <h1>
                Your next journey,
                <br />
                <span className="text-gold">made simple.</span>
              </h1>
              <p className="hero-copy">
                From the morning commute to a weekend in the hills. Find your
                train, choose your seat, and enjoy the journey.
              </p>
              <div className="hero-facts">
                <span>
                  <Icon name="shield" size={17} />
                  Clear fares
                </span>
                <span>
                  <Icon name="ticket" size={17} />
                  Digital tickets
                </span>
                <span>
                  <Icon name="pin" size={17} />
                  Sri Lankan journeys
                </span>
              </div>
            </div>
            <div className="destination-board">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest">
                  EXPLORE THE NETWORK
                </span>
                <Icon name="train" />
              </div>
              <p className="text-xs text-slate-300 mt-2 mb-2">
                Sample departures · Colombo Fort
              </p>
              {[
                { time: "05:55", to: "Badulla", line: "Hill country" },
                { time: "06:35", to: "Jaffna", line: "Northern" },
                { time: "06:50", to: "Matara", line: "Coastal" },
                { time: "07:00", to: "Kandy", line: "Intercity" },
              ].map((row) => (
                <div className="board-row" key={row.to}>
                  <time>{row.time}</time>
                  <span>{row.to}</span>
                  <small>{row.line}</small>
                </div>
              ))}
              <p className="text-xs text-slate-300 mt-5 mb-0">
                A window seat. A different view.
              </p>
            </div>
          </div>
          <div className="hero-search">
            <JourneySearchForm />
          </div>
        </div>
      </section>
      <div className="container home-content">
        <section>
          <div className="flex flex-wrap gap-3 items-end justify-between mb-6">
            <div>
              <p className="eyebrow">Where will you go?</p>
              <h2 className="section-title m-0">Journeys worth taking</h2>
            </div>
            <Link
              href="/schedule"
              className="text-sm font-semibold text-maroon flex items-center gap-2"
            >
              Explore schedules <Icon name="arrow" size={17} />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {popularRoutes.map((route, i) => (
              <Link
                key={route.to}
                href={`/trains?${searchQuery({ ...route, date: dateOffset(1), count: 1 })}`}
                className="card route-card"
              >
                <div className="flex justify-between items-center">
                  <span className="route-number">
                    0{i + 1} / {route.label.toUpperCase()}
                  </span>
                  <Icon name="arrow" size={18} />
                </div>
                <div>
                  <p className="text-sm text-muted mb-1">{route.from}</p>
                  <h3>{route.to}</h3>
                  <p className="text-sm text-muted mt-2 mb-0">
                    {route.description}
                  </p>
                </div>
                <div className="route-fare">
                  <span className="flex items-center gap-2">
                    <Icon name="clock" size={15} />
                    {route.time}
                  </span>
                  <span>
                    From <strong>{money(route.fare)}</strong>
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <p className="text-xs text-muted mt-3">
            Illustrative routes and fares. Search results show the applicable
            demo prices.
          </p>
        </section>
        <section className="section-space">
          <p className="eyebrow">Travel with less to think about</p>
          <h2 className="section-title mb-6">
            A better start to every journey
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {highlights.map((item) => (
              <article className="card feature-card" key={item.title}>
                <span className="icon-tile">
                  <Icon name={item.icon} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section-space grid lg:grid-cols-[1.1fr_.9fr] gap-9">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="section-title m-0">Before you travel</h2>
              <Link
                href="/notices"
                className="text-sm text-maroon font-semibold"
              >
                All notices →
              </Link>
            </div>
            {notices
              .filter((n) => n.published)
              .slice(0, 3)
              .map((notice) => (
                <Link
                  href={`/notices#${notice.id}`}
                  key={notice.id}
                  className="notice-item"
                >
                  <div className="flex gap-3 items-center mb-2">
                    <Badge tone="neutral">{notice.category}</Badge>
                    <span className="text-xs text-muted">
                      {formatDate(notice.date, true)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm m-0">{notice.title}</h3>
                </Link>
              ))}
          </div>
          <div className="card panel">
            <p className="eyebrow">Why smart ticketing?</p>
            <h2 className="section-title">
              More journey.
              <br />
              Less waiting.
            </h2>
            <p className="text-muted text-sm mt-4">
              See your travel options before you reach the station. Keep your
              booking details together and choose the class that suits your
              plans.
            </p>
            <ul className="space-y-4 mt-6 text-sm">
              {[
                "Compare all five travel classes",
                "Select seats in reserved coaches",
                "Download and print your e-ticket",
              ].map((item) => (
                <li key={item} className="flex gap-3 items-center">
                  <Icon name="check" size={18} className="text-maroon" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="app-promo section-space">
          <div>
            <p className="eyebrow">SriRail on the go</p>
            <h2 className="mb-3">
              Your next journey.
              <br />
              Right in your pocket.
            </h2>
            <p className="text-muted text-sm mb-0">
              The website works on your phone today.
              <br />
              Native mobile apps are planned for a future release.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <span className="store-chip">
              <Icon name="phone" />
              App Store · Coming soon
            </span>
            <span className="store-chip">
              <Icon name="phone" />
              Google Play · Coming soon
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
