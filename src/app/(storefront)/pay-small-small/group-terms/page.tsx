import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/storefront/legal-page";
import { getSettings } from "@/lib/settings";
import { telHref, formatPhoneDisplay } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Group Savings Plan Terms & Conditions — OCare Phinas Integrated Services",
  description:
    "The terms governing the Ocare Phinas Group Savings Plan — a structured, group-based savings system for contributing towards products.",
};

function buildSections(phone: string): LegalSection[] {
  return [
  {
    id: "introduction",
    heading: "Introduction",
    body: (
      <>
        <p>
          The Ocare Phinas Group Savings Plan allows customers to contribute towards the purchase of
          products through a structured group-based savings system.
        </p>
        <p>
          By joining a Group Savings Plan, participants agree to comply with these Terms and
          Conditions.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    heading: "Eligibility",
    body: (
      <>
        <p>To participate in a Group Savings Plan, customers must:</p>
        <ul>
          <li>Create an active account on the Ocare Phinas platform.</li>
          <li>Provide accurate personal information.</li>
          <li>Make required contributions according to the selected group plan.</li>
        </ul>
      </>
    ),
  },
  {
    id: "group-structure",
    heading: "Group Structure",
    body: (
      <>
        <p>
          Each group consists of a predetermined number of participants and a defined contribution
          schedule.
        </p>
        <p>
          Group size, contribution amount, payment frequency, and product eligibility will be
          displayed before a customer joins the group.
        </p>
      </>
    ),
  },
  {
    id: "contributions",
    heading: "Contribution Requirements",
    body: (
      <>
        <p>Members are required to make contributions according to the agreed schedule.</p>
        <p>Contribution schedules may include:</p>
        <ul>
          <li>Daily Contributions</li>
          <li>Weekly Contributions</li>
          <li>Monthly Contributions</li>
        </ul>
        <p>
          Payments must be made through approved channels and verified by Ocare Phinas before being
          credited.
        </p>
      </>
    ),
  },
  {
    id: "allocation",
    heading: "Product Allocation",
    body: (
      <>
        <p>
          Product allocation under the Group Savings Plan shall be determined according to the rules
          applicable to the specific group.
        </p>
        <p>
          Customers acknowledge that joining a group does not guarantee immediate product delivery.
        </p>
        <p>Eligibility for product delivery is subject to:</p>
        <ul>
          <li>Payment compliance</li>
          <li>Group progress</li>
          <li>Product availability</li>
          <li>Internal verification procedures</li>
        </ul>
      </>
    ),
  },
  {
    id: "missed-payments",
    heading: "Missed Payments",
    body: (
      <>
        <p>
          Failure to maintain required contributions may affect a member&apos;s eligibility for
          benefits under the plan.
        </p>
        <p>
          Where a member repeatedly fails to contribute as required, Ocare Phinas reserves the right
          to:
        </p>
        <ul>
          <li>Restrict participation</li>
          <li>Suspend membership benefits</li>
          <li>Reassign group positions where necessary</li>
          <li>Apply administrative measures to protect the integrity of the group</li>
        </ul>
      </>
    ),
  },
  {
    id: "price-adjustments",
    heading: "Product Price Adjustments",
    body: (
      <>
        <p>
          Due to market conditions, exchange rate fluctuations, supplier pricing, and inflation,
          product prices may change during the contribution period.
        </p>
        <p>
          Where a significant price adjustment occurs, customers may be required to pay the difference
          before product delivery.
        </p>
        <p>Ocare Phinas will provide reasonable notice where such adjustments become necessary.</p>
      </>
    ),
  },
  {
    id: "withdrawal",
    heading: "Withdrawal from a Group",
    body: (
      <>
        <p>A member may request to withdraw from a Group Savings Plan.</p>
        <p>Withdrawal requests shall be reviewed by management.</p>
        <p>Approved withdrawals may be subject to:</p>
        <ul>
          <li>Administrative charges</li>
          <li>Processing fees</li>
          <li>Applicable deductions disclosed by Ocare Phinas</li>
        </ul>
        <p>Refund timelines may vary depending on the status of the group cycle.</p>
      </>
    ),
  },
  {
    id: "refunds",
    heading: "Refunds",
    body: (
      <>
        <p>
          Refunds shall only apply to the customer&apos;s verified contributions less any applicable
          deductions.
        </p>
        <p>Refund requests may require identity verification before processing.</p>
        <p>Ocare Phinas reserves the right to decline fraudulent or suspicious refund requests.</p>
      </>
    ),
  },
  {
    id: "account-transfers",
    heading: "Account Transfers",
    body: (
      <>
        <p>
          Group memberships are non-transferable unless expressly approved by Ocare Phinas.
        </p>
        <p>
          Customers may not sell, transfer, or assign their group position to another individual
          without written authorization.
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
          Submission of fake payment receipts, manipulation of contribution records, multiple
          fraudulent accounts, or any attempt to exploit the platform shall result in:
        </p>
        <ul>
          <li>Immediate suspension</li>
          <li>Termination of membership</li>
          <li>Investigation</li>
          <li>Possible legal action where necessary</li>
        </ul>
      </>
    ),
  },
  {
    id: "delivery",
    heading: "Delivery of Products",
    body: (
      <>
        <p>
          Products will only be released after all applicable eligibility conditions have been
          satisfied.
        </p>
        <p>
          Customers may be required to provide identification before product collection or delivery.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    heading: "Limitation of Liability",
    body: (
      <>
        <p>Ocare Phinas shall not be liable for losses resulting from:</p>
        <ul>
          <li>Customer failure to meet contribution obligations</li>
          <li>Incorrect information supplied by customers</li>
          <li>Delays caused by third-party logistics providers</li>
          <li>Events beyond our reasonable control</li>
        </ul>
      </>
    ),
  },
  {
    id: "modifications",
    heading: "Modifications",
    body: (
      <>
        <p>
          Ocare Phinas reserves the right to amend, modify, or update these Terms and Conditions at
          any time.
        </p>
        <p>Updated versions will be published on the platform.</p>
      </>
    ),
  },
  {
    id: "contact",
    heading: "Contact Information",
    body: (
      <>
        <p>For questions regarding Group Savings Plans, contact:</p>
        <p>
          <strong>Ocare Phinas Integrated Services</strong>
          <br />
          Phone: <a href={telHref(phone)}>{formatPhoneDisplay(phone)}</a>
        </p>
        <p>
          By joining a Group Savings Plan, you acknowledge that you have read, understood, and agreed
          to these Terms and Conditions.
        </p>
      </>
    ),
  },
  ];
}

export default async function GroupPlanTermsPage() {
  const { whatsappNumber } = await getSettings();
  return (
    <LegalPage
      title="Group Savings Plan Terms & Conditions"
      breadcrumb="Group Plan Terms"
      intro="The Ocare Phinas Group Savings Plan lets you contribute towards products through a structured, group-based savings system. These terms govern how the plan works."
      lastUpdated="June 2026"
      sections={buildSections(whatsappNumber)}
    />
  );
}
