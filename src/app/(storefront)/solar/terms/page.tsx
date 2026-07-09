import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/storefront/legal-page";
import { getSettings } from "@/lib/settings";
import { telHref, formatPhoneDisplay } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Solar Pay Small Small Terms & Conditions — OCare Phinas Integrated Services",
  description:
    "The terms governing the Ocare Phinas Solar Pay Small Small package — registration, deposit, ownership, relocation, payment obligations, and default.",
};

function buildSections(phone: string): LegalSection[] {
  return [
    {
      id: "application-approval",
      heading: "Application & Approval",
      body: (
        <ul>
          <li>All applications are subject to verification and approval by Ocare Phinas.</li>
          <li>Customers must provide accurate and complete information during registration and KYC verification.</li>
          <li>Ocare Phinas reserves the right to approve or decline any application based on the verification results.</li>
        </ul>
      ),
    },
    {
      id: "registration-deposit",
      heading: "Registration Fee & Deposit",
      body: (
        <ul>
          <li>The registration fee of ₦5,000 is non-refundable.</li>
          <li>Customers must make the agreed initial deposit before installation is scheduled.</li>
          <li>Installation will only proceed after approval and confirmation of the deposit payment.</li>
        </ul>
      ),
    },
    {
      id: "ownership",
      heading: "Ownership of Solar Equipment",
      body: (
        <>
          <p>
            All solar equipment supplied under this package remains the property of Ocare Phinas until
            the customer completes full payment.
          </p>
          <p>Full ownership transfers to the customer only after all outstanding payments have been cleared.</p>
        </>
      ),
    },
    {
      id: "relocation",
      heading: "Relocation & Use of the Solar System",
      body: (
        <ul>
          <li>The installed solar system must remain at the approved installation address.</li>
          <li>
            The customer must not relocate, remove, transfer, or alter the installation location without
            prior written notification to, and approval from, Ocare Phinas.
          </li>
          <li>While payment is still ongoing, the customer must not rent out, lease, resell, or give the solar system to any other person.</li>
        </ul>
      ),
    },
    {
      id: "payment-obligations",
      heading: "Payment Obligations",
      body: (
        <ul>
          <li>The customer agrees to complete payments according to the selected payment plan (daily, weekly, or monthly).</li>
          <li>Late or missed payments may affect the customer&apos;s eligibility for future services or promotions.</li>
          <li>Customers are encouraged to contact Ocare Phinas promptly if they experience any difficulty with payments.</li>
        </ul>
      ),
    },
    {
      id: "care-maintenance",
      heading: "Care & Maintenance",
      body: (
        <ul>
          <li>The customer must use and maintain the solar equipment properly.</li>
          <li>Any damage caused by misuse, unauthorised movement, or third-party interference may be the customer&apos;s responsibility.</li>
        </ul>
      ),
    },
    {
      id: "default",
      heading: "Default",
      body: (
        <ul>
          <li>Failure to comply with the payment terms or these conditions may result in further action by Ocare Phinas in line with this agreement.</li>
          <li>Continued default may affect the customer&apos;s future access to Ocare Phinas services.</li>
        </ul>
      ),
    },
    {
      id: "agreement",
      heading: "Agreement",
      body: (
        <>
          <p>
            By completing registration and accepting this package, the customer confirms that they have
            read, understood, and agreed to these Terms and Conditions.
          </p>
          <p>
            For inquiries regarding the Solar Pay Small Small package, contact{" "}
            <strong>Ocare Phinas Integrated Services</strong> on{" "}
            <a href={telHref(phone)}>{formatPhoneDisplay(phone)}</a>.
          </p>
        </>
      ),
    },
  ];
}

export default async function SolarTermsPage() {
  const { whatsappNumber } = await getSettings();
  return (
    <LegalPage
      title="Solar Pay Small Small — Terms & Conditions"
      breadcrumb="Solar Plan Terms"
      intro="Making Quality Solar & Home Appliances Affordable. These terms govern the Ocare Phinas Solar Pay Small Small package, from application through to full ownership."
      lastUpdated="July 2026"
      sections={buildSections(whatsappNumber)}
    />
  );
}
