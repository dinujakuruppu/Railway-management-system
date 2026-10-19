import type { Booking } from "@/types";
import { formatDate, money } from "./format";
function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] ?? character,
  );
}
export function downloadTicket(booking: Booking) {
  const e = escapeHtml;
  const train = booking.journey.train;
  const document = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(booking.reference)} · SriRail E-Ticket</title><style>body{font:16px/1.6 Arial,sans-serif;color:#132b45;background:#f1f4f8;margin:0;padding:30px}main{max-width:800px;margin:auto;background:white;border:1px solid #d7dfe8}header{background:#132b45;color:white;padding:28px}article{padding:28px}h1,h2,p{margin:0 0 14px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid #d7dfe8;padding:12px;text-align:left}.route{font-size:27px;font-weight:bold}.meta{display:flex;flex-wrap:wrap;gap:28px;margin:24px 0}.note{padding:16px;background:#fff4dc;font-size:14px}.qr{width:100px;padding:14px;text-align:center;border:2px dashed #8191a2;margin-top:20px;font-size:12px}.hint{font-size:13px;color:#53647a}footer{padding:22px 28px;border-top:2px dashed #d7dfe8}@media print{body{background:white;padding:0}.hint{display:none}header{background:white;color:#132b45;border-bottom:2px solid #132b45}main{border:0}@page{size:A4;margin:16mm}}</style></head><body><main><header><h1>SriRail · E-Ticket</h1><p>${e(booking.reference)} · ${e(booking.status)}</p></header><article><p class="route">${e(booking.journey.from)} → ${e(booking.journey.to)}</p><p>${e(train.name)} · Train #${e(train.trainNumber)}</p><div class="meta"><span><b>Date</b><br>${e(formatDate(booking.journey.date))}</span><span><b>Departure</b><br>${e(train.departureTime)}</span><span><b>Arrival</b><br>${e(train.arrivalTime)}</span><span><b>Class / Coach</b><br>${e(booking.className)} / ${e(booking.coach)}</span></div><table><thead><tr><th>Passenger</th><th>NIC / Passport</th><th>Seat</th></tr></thead><tbody>${booking.passengers.map((p, i) => `<tr><td>${e(p.fullName)}<br>${e(p.type)}</td><td>${e(p.identity)}</td><td>${e(booking.seats[i] ?? "Unreserved")}</td></tr>`).join("")}</tbody></table><p style="margin-top:24px">Fare: ${e(money(booking.fare))} · Service fee: ${e(money(booking.serviceFee))}</p><h2>Total: ${e(money(booking.total))}</h2><div class="qr">QR PLACEHOLDER<br>NOT SCANNABLE</div></article><footer><p class="note"><b>DEMO — NOT VALID FOR TRAVEL.</b> Payment was simulated. No real seat has been reserved.</p><p class="hint">Open your browser’s print menu (Ctrl+P / Cmd+P) to print or save this ticket as a PDF. This HTML ticket can be opened offline.</p></footer></main></body></html>`;
  const url = URL.createObjectURL(
    new Blob([document], { type: "text/html;charset=utf-8" }),
  );
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `SriRail-${booking.reference}.html`;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
