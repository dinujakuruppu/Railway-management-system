"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { passengerRecords } from "@/lib/passengers";
import PageHeading from "@/components/ui/PageHeading";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
export default function AdminPassengers() {
  const { adminBookings: bookings, user } = useApp();
  const [query, setQuery] = useState("");
  const passengers = passengerRecords(bookings, user).filter((p) =>
    `${p.fullName} ${p.identity} ${p.email}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="Passenger records"
        title="Passengers"
        description="Passenger details from saved demonstration bookings."
      />
      <div className="card panel mb-6">
        <Input
          label="Search passengers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, identity or email"
        />
      </div>
      {passengers.length ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>NIC / Passport</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Bookings</th>
              </tr>
            </thead>
            <tbody>
              {passengers.map((p) => (
                <tr key={p.identity}>
                  <td className="font-semibold">{p.fullName}</td>
                  <td>{p.identity}</td>
                  <td>{p.email}</td>
                  <td>{p.mobile}</td>
                  <td>{p.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No passengers found"
          description="Try a different name or identity number."
        />
      )}
      <p className="text-xs text-muted mt-5">
        Passenger records are grouped by identity number. Use fictional
        information in this demo.
      </p>
    </>
  );
}
