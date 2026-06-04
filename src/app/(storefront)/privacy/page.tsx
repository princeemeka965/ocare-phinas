import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/storefront/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — OCare Phinas Integrated Services",
  description:
    "How Ocare Phinas Integrated Services collects, uses, protects, and shares your personal information.",
};

const sections: LegalSection[] = [
  {
    id: "introduction",
    heading: "Introduction",
    body: (
      <p>
        Ocare Phinas Integrated Services values your privacy and is committed to protecting your
        personal information.
      </p>
    ),
  },
  {
    id: "information-we-collect",
    heading: "Information We Collect",
    body: (
      <>
        <p>We may collect:</p>
        <ul>
          <li>Full name</li>
          <li>Phone number</li>
          <li>Email address</li>
          <li>Residential address</li>
          <li>Payment information</li>
          <li>Transaction history</li>
          <li>Device and browser information</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use",
    heading: "How We Use Your Information",
    body: (
      <>
        <p>Your information may be used to:</p>
        <ul>
          <li>Create and manage your account.</li>
          <li>Process orders and payments.</li>
          <li>Verify transactions.</li>
          <li>Communicate with you.</li>
          <li>Improve our services.</li>
          <li>Comply with legal obligations.</li>
        </ul>
      </>
    ),
  },
  {
    id: "data-protection",
    heading: "Data Protection",
    body: (
      <p>
        We implement reasonable administrative, technical, and organizational safeguards to protect
        user information.
      </p>
    ),
  },
  {
    id: "information-sharing",
    heading: "Information Sharing",
    body: (
      <>
        <p>We do not sell customer information.</p>
        <p>Information may be shared only with:</p>
        <ul>
          <li>Payment processors</li>
          <li>Delivery partners</li>
          <li>Regulatory authorities where legally required</li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    heading: "Cookies",
    body: (
      <p>
        Our website may use cookies to improve user experience and platform functionality.
      </p>
    ),
  },
  {
    id: "user-rights",
    heading: "User Rights",
    body: (
      <p>
        Users may request access, correction, or deletion of personal information subject to
        applicable laws and business requirements.
      </p>
    ),
  },
  {
    id: "retention",
    heading: "Retention of Data",
    body: (
      <p>
        We retain information only as long as reasonably necessary for operational, legal, and
        security purposes.
      </p>
    ),
  },
  {
    id: "updates",
    heading: "Updates",
    body: (
      <>
        <p>This Privacy Policy may be updated periodically.</p>
        <p>Continued use of our platform indicates acceptance of any updates.</p>
      </>
    ),
  },
  {
    id: "refund-savings-policy",
    heading: "Refund, Cancellation and Savings Plan Policy",
    body: (
      <>
        <p>
          <strong>Outright Purchase</strong>
        </p>
        <p>Customers may cancel an order before product processing begins.</p>
        <p>Approved refunds may take up to 14 business days.</p>
        <p>Transaction fees and processing charges may be deducted where applicable.</p>

        <p>
          <strong>Solo Savings Plan</strong>
        </p>
        <p>Customers may contribute daily, weekly, or monthly toward a selected product.</p>
        <p>Savings remain the property of the customer.</p>
        <p>
          Where a customer chooses to discontinue participation before delivery, a refund request
          may be submitted.
        </p>
        <p>Administrative charges may apply.</p>
        <p>
          Where product prices increase significantly during the savings period, customers may be
          required to pay the difference before delivery.
        </p>

        <p>
          <strong>Group Savings Plan</strong>
        </p>
        <p>Customers agree to contribute according to the group&apos;s contribution schedule.</p>
        <p>
          Failure to maintain required contributions may affect eligibility for product allocation.
        </p>
        <p>
          Where a customer voluntarily exits a group before completion, management reserves the
          right to apply administrative charges before processing any eligible refund.
        </p>
        <p>Refund timelines may vary depending on the status of the group cycle.</p>

        <p>
          <strong>Product Delivery</strong>
        </p>
        <p>
          Delivery eligibility is determined according to the applicable plan rules and payment
          status.
        </p>
        <p>Ocare Phinas reserves the right to verify all records before releasing products.</p>

        <p>
          <strong>Fraud Prevention</strong>
        </p>
        <p>
          Any attempt to manipulate contributions, submit false payment records, or exploit
          platform features may result in account suspension and forfeiture of benefits pending
          investigation.
        </p>

        <p>
          <strong>Exceptional Circumstances</strong>
        </p>
        <p>
          Ocare Phinas reserves the right to review refund requests on a case-by-case basis where
          exceptional circumstances exist.
        </p>
        <p>Management decisions regarding exceptional cases shall be final.</p>
      </>
    ),
  },
  {
    id: "contact",
    heading: "Contact",
    body: (
      <>
        <p>For privacy-related inquiries, contact:</p>
        <p>
          <strong>Ocare Phinas Integrated Services</strong>
          <br />
          Phone: <a href="tel:+2347069640753">07069640753</a>
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      breadcrumb="Privacy Policy"
      intro="Ocare Phinas Integrated Services values your privacy. This policy describes the information we collect, how we use it, and our refund, cancellation, and savings plan terms."
      lastUpdated="4 June 2026"
      sections={sections}
    />
  );
}
