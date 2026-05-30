import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/storefront/legal-page";

export const metadata: Metadata = {
  title: "Terms & Conditions — OCare Phinas Integrated Services",
  description:
    "The terms governing your use of Ocare Phinas Integrated Services, including orders, payments, contribution plans, and deliveries.",
};

const sections: LegalSection[] = [
  {
    id: "acceptance",
    heading: "Acceptance of Terms",
    body: (
      <p>
        These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to and use of the
        services provided by Ocare Phinas Integrated Services (&quot;OCare Phinas&quot;,
        &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By creating an account, placing an
        order, or joining a payment or contribution plan, you agree to these Terms. If you do not
        agree, please do not use our services.
      </p>
    ),
  },
  {
    id: "accounts",
    heading: "Accounts",
    body: (
      <>
        <p>
          To access certain features, you must create an account and provide accurate, complete
          information. You are responsible for safeguarding your password and for all activity under
          your account.
        </p>
        <ul>
          <li>You must be at least 18 years old to create an account.</li>
          <li>Keep your contact and delivery details up to date.</li>
          <li>Notify us promptly of any unauthorised use of your account.</li>
        </ul>
      </>
    ),
  },
  {
    id: "products-pricing",
    heading: "Products and Pricing",
    body: (
      <>
        <p>
          We aim to describe and price our products accurately. However, product availability,
          specifications, and prices may change without notice. Where a pricing or description error
          is identified, we reserve the right to cancel or correct affected orders.
        </p>
        <p>All prices are stated in Nigerian Naira (₦) and are inclusive of applicable charges unless stated otherwise.</p>
      </>
    ),
  },
  {
    id: "orders",
    heading: "Orders",
    body: (
      <p>
        Placing an order constitutes an offer to purchase. An order is confirmed only after we
        verify your payment. We reserve the right to refuse or cancel any order, including where the
        product is unavailable, payment cannot be verified, or we suspect fraudulent activity.
      </p>
    ),
  },
  {
    id: "payments",
    heading: "Payments and Confirmation",
    body: (
      <>
        <p>
          We accept payment by <strong>bank transfer</strong>. To complete a purchase:
        </p>
        <ul>
          <li>Transfer the exact amount to the account details provided.</li>
          <li>Include your order reference in the transfer narration.</li>
          <li>Send your payment screenshot to us on WhatsApp for confirmation.</li>
        </ul>
        <p>
          Payments are confirmed <strong>manually</strong>, usually within 2 hours on business days.
          Stock is reserved and dispatched only after payment is confirmed.
        </p>
      </>
    ),
  },
  {
    id: "plans",
    heading: "Pay Small Small & Contribution Plans",
    body: (
      <>
        <p>
          Our Pay Small Small options let you save gradually through contribution groups or personal
          payment plans towards a product or purchase milestone. Participation is entirely optional —
          you can shop normally without a plan.
        </p>
        <ul>
          <li>Plan terms, contribution amounts, and durations are shown when you join.</li>
          <li>Contributions must be made according to the agreed schedule.</li>
          <li>Products are released upon completion of the plan and verification of contributions.</li>
          <li>Specific refund and withdrawal conditions for plans are communicated at sign-up.</li>
        </ul>
      </>
    ),
  },
  {
    id: "delivery",
    heading: "Delivery",
    body: (
      <p>
        We deliver to the address you provide at checkout. Delivery timelines are estimates and may
        vary by location and product availability. Please ensure someone is available to receive and
        verify your order. Risk in the goods passes to you upon delivery.
      </p>
    ),
  },
  {
    id: "returns",
    heading: "Returns and Refunds",
    body: (
      <>
        <p>
          If a product arrives damaged, defective, or materially different from what you ordered,
          contact us promptly so we can resolve the issue. Eligible returns may be repaired,
          replaced, or refunded at our discretion and in line with applicable consumer protection
          laws.
        </p>
        <p>Items must be returned in their original condition and packaging where possible.</p>
      </>
    ),
  },
  {
    id: "conduct",
    heading: "Acceptable Use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Use our services for any unlawful or fraudulent purpose.</li>
          <li>Provide false information or impersonate another person.</li>
          <li>Interfere with the security or proper functioning of the platform.</li>
        </ul>
      </>
    ),
  },
  {
    id: "liability",
    heading: "Limitation of Liability",
    body: (
      <p>
        To the fullest extent permitted by law, OCare Phinas shall not be liable for any indirect,
        incidental, or consequential losses arising from your use of our services. Our total
        liability for any claim is limited to the amount you paid for the product or plan giving
        rise to the claim.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to These Terms",
    body: (
      <p>
        We may update these Terms from time to time. The &quot;Last updated&quot; date above
        reflects the latest version. Continued use of our services after changes take effect means
        you accept the revised Terms.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact Us",
    body: (
      <p>
        Questions about these Terms? Reach us via our <a href="/contact">Contact page</a>, by email
        at <a href="mailto:support@ocarephinas.com">support@ocarephinas.com</a>, or on WhatsApp.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      breadcrumb="Terms & Conditions"
      intro="Please read these terms carefully. They govern your use of Ocare Phinas Integrated Services, including orders, payments, contribution plans, and deliveries."
      lastUpdated="30 May 2026"
      sections={sections}
    />
  );
}
