import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/storefront/legal-page";

export const metadata: Metadata = {
  title: "Terms & Conditions — OCare Phinas Integrated Services",
  description:
    "The terms governing your use of Ocare Phinas Integrated Services, including orders, payments, contribution plans, and deliveries.",
};

const sections: LegalSection[] = [
  {
    id: "introduction",
    heading: "Introduction",
    body: (
      <>
        <p>
          Welcome to Ocare Phinas Integrated Services (&quot;Ocare Phinas&quot;, &quot;we&quot;,
          &quot;our&quot;, or &quot;us&quot;).
        </p>
        <p>
          By creating an account, accessing our website, placing an order, participating in a savings
          plan, or using any of our services, you agree to be bound by these Terms and Conditions.
        </p>
        <p>If you do not agree with any part of these Terms, please discontinue use of our services.</p>
      </>
    ),
  },
  {
    id: "eligibility",
    heading: "Eligibility",
    body: (
      <>
        <p>To use our services, you must:</p>
        <ul>
          <li>Be at least 18 years old or have parental/guardian consent.</li>
          <li>Provide accurate and complete information during registration.</li>
          <li>Maintain the confidentiality of your login credentials.</li>
        </ul>
      </>
    ),
  },
  {
    id: "services",
    heading: "Services Offered",
    body: (
      <>
        <p>Ocare Phinas provides:</p>
        <p>
          <strong>A. Outright Purchase</strong>
          <br />
          Customers may purchase products immediately and make full payment before delivery.
        </p>
        <p>
          <strong>B. Solo Savings Plan</strong>
          <br />
          Customers may select a product and make flexible contributions toward the purchase price.
        </p>
        <p>
          <strong>C. Group Savings Plan</strong>
          <br />
          Customers may join a group-based contribution plan where members contribute according to
          the agreed schedule and become eligible for product allocation based on the applicable
          group rules.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    heading: "Payments",
    body: (
      <>
        <p>Payments may be made through approved payment methods displayed on the platform.</p>
        <p>All payments are subject to verification and approval.</p>
        <p>Ocare Phinas reserves the right to reject suspicious, incomplete, or unverifiable payments.</p>
      </>
    ),
  },
  {
    id: "wallet",
    heading: "Wallet System",
    body: (
      <>
        <p>Approved deposits may be reflected in a customer&apos;s wallet balance.</p>
        <p>
          Wallet balances are intended solely for transactions within the Ocare Phinas platform and
          may not be transferable unless expressly approved by management.
        </p>
      </>
    ),
  },
  {
    id: "pricing",
    heading: "Product Pricing",
    body: (
      <>
        <p>
          Product prices may change without prior notice due to market fluctuations, exchange rates,
          supplier pricing, or availability.
        </p>
        <p>Customers may be required to cover any difference in product cost where applicable.</p>
      </>
    ),
  },
  {
    id: "delivery",
    heading: "Delivery Policy",
    body: (
      <>
        <p>Products will be delivered according to the applicable plan conditions.</p>
        <p>Delivery timelines may vary depending on stock availability, logistics, and payment status.</p>
        <p>Ocare Phinas shall not be liable for delays caused by circumstances beyond its control.</p>
      </>
    ),
  },
  {
    id: "responsibilities",
    heading: "User Responsibilities",
    body: (
      <>
        <p>Customers agree not to:</p>
        <ul>
          <li>Provide false information.</li>
          <li>Upload fraudulent payment receipts.</li>
          <li>Abuse the platform.</li>
          <li>Engage in activities that disrupt services.</li>
        </ul>
        <p>Violation may result in suspension or account termination.</p>
      </>
    ),
  },
  {
    id: "suspension",
    heading: "Suspension and Termination",
    body: (
      <p>
        Ocare Phinas reserves the right to suspend or terminate accounts involved in fraud, abuse,
        misrepresentation, or violations of these Terms.
      </p>
    ),
  },
  {
    id: "liability",
    heading: "Limitation of Liability",
    body: (
      <p>
        Ocare Phinas shall not be liable for indirect, incidental, consequential, or special damages
        arising from use of the platform.
      </p>
    ),
  },
  {
    id: "amendments",
    heading: "Amendments",
    body: (
      <>
        <p>These Terms may be updated periodically.</p>
        <p>Continued use of the platform constitutes acceptance of any modifications.</p>
      </>
    ),
  },
  {
    id: "contact",
    heading: "Contact Information",
    body: (
      <>
        <p>
          <strong>Ocare Phinas Integrated Services</strong>
          <br />
          Phone: <a href="tel:07069640753">07069640753</a>
        </p>
        <p>For questions regarding these Terms, please contact customer support.</p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      breadcrumb="Terms & Conditions"
      intro="Please read these Terms and Conditions carefully. They govern your use of Ocare Phinas Integrated Services, including accounts, orders, payments, savings plans, and deliveries."
      lastUpdated="4 June 2026"
      sections={sections}
    />
  );
}
