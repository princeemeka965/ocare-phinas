import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, type LegalSection } from "@/components/storefront/legal-page";
import { getSettings } from "@/lib/settings";
import { telHref, formatPhoneDisplay } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Returns & Refunds Policy — OCare Phinas Integrated Services",
  description:
    "How returns, replacements and refunds work at Ocare Phinas Integrated Services — the 7-day return window, eligible items, how to start a return, and refund timelines.",
};

function buildSections(phone: string): LegalSection[] {
  return [
  {
    id: "return-window",
    heading: "Return Window",
    body: (
      <>
        <p>
          Eligible items may be returned <strong>free of charge within 7 days of delivery</strong>.
        </p>
        <p>
          The return window starts on the day the customer receives the product. Return requests
          made after the window has closed may not be accepted.
        </p>
      </>
    ),
  },
  {
    id: "eligible-items",
    heading: "Eligible Items",
    body: (
      <>
        <p>An item qualifies for a free return where:</p>
        <ul>
          <li>It arrived with a defect or functional fault not caused by the customer.</li>
          <li>It is not the item that was ordered (wrong item, wrong model, or wrong specification).</li>
          <li>It arrived physically damaged or with parts missing.</li>
        </ul>
        <p>
          Items returned for the reasons above are collected or shipped back at no cost to the
          customer.
        </p>
        <p>To qualify, the item must be returned:</p>
        <ul>
          <li>In the condition it was delivered, with all accessories that came with it.</li>
          <li>In its original packaging where the packaging was supplied.</li>
          <li>With proof of purchase (order reference).</li>
        </ul>
      </>
    ),
  },
  {
    id: "report-timelines",
    heading: "Reporting Timelines",
    body: (
      <>
        <p>
          Issues relating to <strong>missing items, wrong items, or physical damage</strong> must be
          reported within <strong>24 hours of delivery</strong>, as set out in our{" "}
          <Link href="/delivery">Delivery &amp; Shipping Policy</Link>.
        </p>
        <p>
          Functional defects discovered after the first use may be reported at any point within the
          7-day return window, or within the product&rsquo;s warranty period where one applies (see
          our <Link href="/warranty">Product Warranty Policy</Link>).
        </p>
      </>
    ),
  },
  {
    id: "not-eligible",
    heading: "Items Not Eligible for Return",
    body: (
      <>
        <p>The following are not eligible for return:</p>
        <ul>
          <li>
            <strong>Change of mind</strong> on pre-owned (Tokunbo) items — including wanting a
            different colour or finding a lower price elsewhere.
          </li>
          <li>Items damaged by misuse, accidents, liquid, power surges, or unauthorized repairs.</li>
          <li>Items with altered or removed serial numbers.</li>
          <li>Items returned incomplete, without the accessories they were delivered with.</li>
          <li>Software issues caused by customer installations.</li>
          <li>Normal wear, battery degradation, and cosmetic marks disclosed at the time of sale.</li>
        </ul>
        <p>
          Where a return request does not qualify for a free return, any transport costs associated
          with inspection are the customer&rsquo;s responsibility unless otherwise determined by
          Ocare Phinas.
        </p>
      </>
    ),
  },
  {
    id: "how-to-return",
    heading: "How to Start a Return",
    body: (
      <>
        <p>To start a return:</p>
        <ul>
          <li>Contact Customer Support by phone or WhatsApp.</li>
          <li>Provide your order reference.</li>
          <li>Describe the issue and provide photos or videos where requested.</li>
          <li>Keep the item, its accessories, and packaging available for collection or drop-off.</li>
        </ul>
        <p>
          We will confirm whether the item qualifies, then arrange collection, a drop-off at our
          store, or a waybill return depending on your location.
        </p>
      </>
    ),
  },
  {
    id: "inspection-approval",
    heading: "Inspection and Approval",
    body: (
      <>
        <p>
          All returned items are inspected before a return is approved. Ocare Phinas reserves the
          right to decline a return where the item does not match the reported issue or where the
          conditions of this policy are not met.
        </p>
        <p>The final determination on every return rests with Ocare Phinas Integrated Services.</p>
      </>
    ),
  },
  {
    id: "remedies",
    heading: "Remedies",
    body: (
      <>
        <p>Where a return is approved, Ocare Phinas may, at its discretion:</p>
        <ul>
          <li>Repair the item.</li>
          <li>Replace the item with the same model.</li>
          <li>Replace it with a similar model where the original is unavailable.</li>
          <li>Issue store credit.</li>
          <li>Issue a refund where repair or replacement is impossible.</li>
        </ul>
      </>
    ),
  },
  {
    id: "refunds",
    heading: "Refund Method and Timeline",
    body: (
      <>
        <p>
          Approved refunds are paid by <strong>bank transfer</strong> to an account in the
          customer&rsquo;s name.
        </p>
        <p>
          Refunds may take up to <strong>14 business days</strong> after approval. Refund requests
          may require identity verification before processing.
        </p>
      </>
    ),
  },
  {
    id: "plan-orders",
    heading: "Pay Small Small Orders",
    body: (
      <>
        <p>
          Items delivered under a Solo or Group Plan are covered by this policy in the same way as
          outright purchases, from the date of delivery.
        </p>
        <p>
          Cancelling a plan <em>before</em> delivery is not a return — it is governed by the refund
          and cancellation provisions of the{" "}
          <Link href="/pay-small-small/solo-terms">Solo Plan Terms</Link> and{" "}
          <Link href="/pay-small-small/group-terms">Group Plan Terms</Link>.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    heading: "Contact Information",
    body: (
      <>
        <p>For return-related inquiries, customers may contact:</p>
        <p>
          <strong>Ocare Phinas Integrated Services</strong>
          <br />
          Phone: <a href={telHref(phone)}>{formatPhoneDisplay(phone)}</a>
        </p>
      </>
    ),
  },
  ];
}

export default async function ReturnsPolicyPage() {
  const { whatsappNumber } = await getSettings();
  return (
    <LegalPage
      title="Returns & Refunds Policy"
      breadcrumb="Returns & Refunds"
      intro="This policy explains when products purchased from Ocare Phinas Integrated Services can be returned, how to start a return, and how replacements and refunds are handled. It works alongside our Product Warranty Policy and Delivery & Shipping Policy."
      lastUpdated="June 2026"
      sections={buildSections(whatsappNumber)}
    />
  );
}
