import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/storefront/legal-page";
import { getSettings } from "@/lib/settings";
import { telHref, formatPhoneDisplay } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Solo Plan Terms & Conditions — OCare Phinas Integrated Services",
  description:
    "The terms governing the Ocare Phinas Solo Plan — a flexible savings and payment plan that lets you save daily, weekly, or monthly towards a product.",
};

function buildSections(phone: string): LegalSection[] {
  return [
  {
    id: "introduction",
    heading: "Introduction",
    body: (
      <>
        <p>
          The Ocare Phinas Solo Plan is a flexible savings and payment plan that allows customers to
          gradually save towards the purchase of products available on the Ocare Phinas platform.
        </p>
        <p>By enrolling in a Solo Plan, customers agree to be bound by these Terms and Conditions.</p>
      </>
    ),
  },
  {
    id: "eligibility",
    heading: "Eligibility",
    body: (
      <>
        <p>To participate in the Solo Plan, customers must:</p>
        <ul>
          <li>Create an active account on the Ocare Phinas platform.</li>
          <li>Provide accurate registration information.</li>
          <li>Select a product or savings target.</li>
          <li>Comply with all applicable policies and procedures.</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-it-works",
    heading: "How the Solo Plan Works",
    body: (
      <>
        <p>
          The Solo Plan allows customers to make flexible contributions towards a selected product or
          savings goal.
        </p>
        <p>Customers may contribute:</p>
        <ul>
          <li>Daily</li>
          <li>Weekly</li>
          <li>Monthly</li>
          <li>At any other approved interval</li>
        </ul>
        <p>
          Contributions accumulate in the customer&apos;s account and are applied toward the selected
          product or savings target.
        </p>
      </>
    ),
  },
  {
    id: "ownership",
    heading: "Ownership of Savings",
    body: (
      <>
        <p>
          All verified contributions made under the Solo Plan remain the customer&apos;s funds subject
          to these Terms and Conditions.
        </p>
        <p>
          Savings may only be used within the Ocare Phinas platform unless otherwise approved by
          management.
        </p>
      </>
    ),
  },
  {
    id: "reservation",
    heading: "Product Reservation",
    body: (
      <>
        <p>Enrollment in a Solo Plan does not automatically reserve a product.</p>
        <p>Products remain subject to:</p>
        <ul>
          <li>Availability</li>
          <li>Supplier inventory</li>
          <li>Market conditions</li>
          <li>Pricing adjustments</li>
        </ul>
        <p>Customers are encouraged to complete payments within a reasonable timeframe.</p>
      </>
    ),
  },
  {
    id: "price-changes",
    heading: "Product Price Changes",
    body: (
      <>
        <p>
          Due to inflation, supplier adjustments, exchange rate fluctuations, and market conditions,
          product prices may increase or decrease during the savings period.
        </p>
        <p>
          Where the price of a selected product increases, the customer may be required to pay the
          difference before delivery.
        </p>
        <p>
          Where the price decreases, the customer shall benefit from the revised pricing where
          applicable.
        </p>
      </>
    ),
  },
  {
    id: "delivery-eligibility",
    heading: "Delivery Eligibility",
    body: (
      <>
        <p>A customer becomes eligible for product delivery when:</p>
        <ul>
          <li>
            The required payment threshold has been achieved according to the applicable product
            policy.
          </li>
          <li>All verification processes have been completed.</li>
          <li>Any outstanding balance has been settled.</li>
        </ul>
        <p>Ocare Phinas reserves the right to verify all payment records before delivery.</p>
      </>
    ),
  },
  {
    id: "plan-modification",
    heading: "Plan Modification",
    body: (
      <>
        <p>Customers may request to:</p>
        <ul>
          <li>Upgrade to another product.</li>
          <li>Downgrade to a lower-priced product.</li>
          <li>Change savings targets.</li>
        </ul>
        <p>Such requests may be subject to review and approval.</p>
        <p>Any price differences must be settled before delivery.</p>
      </>
    ),
  },
  {
    id: "withdrawal",
    heading: "Withdrawal of Savings",
    body: (
      <>
        <p>Customers may request withdrawal of funds saved under the Solo Plan.</p>
        <p>Withdrawal requests may be subject to:</p>
        <ul>
          <li>Identity verification</li>
          <li>Administrative charges</li>
          <li>Processing fees</li>
        </ul>
        <p>Approved withdrawals shall be processed within the applicable processing period.</p>
      </>
    ),
  },
  {
    id: "inactivity",
    heading: "Inactivity",
    body: (
      <>
        <p>
          Where a Solo Plan remains inactive for an extended period, Ocare Phinas reserves the right
          to contact the customer to determine whether the plan should remain active.
        </p>
        <p>
          Savings balances shall remain recorded on the customer&apos;s account subject to applicable
          policies.
        </p>
      </>
    ),
  },
  {
    id: "fraud-prevention",
    heading: "Fraud Prevention",
    body: (
      <>
        <p>
          Submission of fake payment receipts, unauthorized account access, payment manipulation, or
          any fraudulent activity may result in:
        </p>
        <ul>
          <li>Account suspension</li>
          <li>Account termination</li>
          <li>Forfeiture of benefits</li>
          <li>Legal action where necessary</li>
        </ul>
      </>
    ),
  },
  {
    id: "delivery-shipping",
    heading: "Delivery and Shipping",
    body: (
      <p>
        Product deliveries under the Solo Plan shall be governed by the Ocare Phinas Delivery and
        Shipping Policy.
      </p>
    ),
  },
  {
    id: "liability",
    heading: "Limitation of Liability",
    body: (
      <>
        <p>Ocare Phinas shall not be liable for losses arising from:</p>
        <ul>
          <li>Incorrect information supplied by customers.</li>
          <li>Customer failure to complete payments.</li>
          <li>Product availability issues caused by suppliers.</li>
          <li>Delays beyond our reasonable control.</li>
        </ul>
      </>
    ),
  },
  {
    id: "amendments",
    heading: "Amendments",
    body: (
      <>
        <p>
          Ocare Phinas reserves the right to modify or update these Terms and Conditions at any time.
        </p>
        <p>Any updates shall be published on the platform.</p>
      </>
    ),
  },
  {
    id: "contact",
    heading: "Contact Information",
    body: (
      <>
        <p>For inquiries regarding the Solo Plan, contact:</p>
        <p>
          <strong>Ocare Phinas Integrated Services</strong>
          <br />
          Phone: <a href={telHref(phone)}>{formatPhoneDisplay(phone)}</a>
        </p>
        <p>
          By participating in the Solo Plan, you confirm that you have read, understood, and agreed to
          these Terms and Conditions.
        </p>
      </>
    ),
  },
  ];
}

export default async function SoloPlanTermsPage() {
  const { whatsappNumber } = await getSettings();
  return (
    <LegalPage
      title="Solo Plan Terms & Conditions"
      breadcrumb="Solo Plan Terms"
      intro="The Ocare Phinas Solo Plan lets you save towards a product at your own pace — daily, weekly, or monthly. These terms govern how the plan works."
      lastUpdated="June 2026"
      sections={buildSections(whatsappNumber)}
    />
  );
}
