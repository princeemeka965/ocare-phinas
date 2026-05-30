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
      <>
        <p>
          Ocare Phinas Integrated Services (&quot;OCare Phinas&quot;, &quot;we&quot;,
          &quot;us&quot;, or &quot;our&quot;) respects your privacy and is committed to protecting
          the personal information you share with us. This Privacy Policy explains what information
          we collect, how we use it, and the choices you have when you use our website, shop with
          us, or join a Pay Small Small contribution or payment plan.
        </p>
        <p>
          By using our platform, you agree to the collection and use of information in accordance
          with this policy.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    heading: "Information We Collect",
    body: (
      <>
        <p>We collect information you provide directly and information generated as you use our services:</p>
        <ul>
          <li><strong>Account details</strong> — name, email address, phone number, and password.</li>
          <li><strong>Order information</strong> — products ordered, delivery address, and order history.</li>
          <li><strong>Payment information</strong> — bank transfer references and payment screenshots you send for manual confirmation. We do not store card numbers or bank login credentials.</li>
          <li><strong>Plan information</strong> — contribution group membership and personal payment-plan progress.</li>
          <li><strong>Technical data</strong> — device, browser, and usage information collected automatically to keep the service secure and reliable.</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use",
    heading: "How We Use Your Information",
    body: (
      <>
        <p>We use your information to:</p>
        <ul>
          <li>Process orders, confirm payments, and arrange deliveries.</li>
          <li>Manage your account, contribution groups, and payment plans.</li>
          <li>Provide customer support and respond to your enquiries.</li>
          <li>Send important updates about your orders, plans, and account.</li>
          <li>Improve our products, services, and overall customer experience.</li>
          <li>Detect, prevent, and address fraud or security issues.</li>
        </ul>
      </>
    ),
  },
  {
    id: "sharing",
    heading: "How We Share Information",
    body: (
      <>
        <p>
          We do not sell your personal information. We share it only when necessary to operate our
          services — for example, with delivery partners to fulfil your orders, or with service
          providers who help us run the platform, all of whom are required to protect your data.
        </p>
        <p>
          We may also disclose information where required by law, or to protect the rights, safety,
          and property of our customers and our business.
        </p>
      </>
    ),
  },
  {
    id: "data-security",
    heading: "Data Security",
    body: (
      <p>
        We apply reasonable technical and organisational measures to protect your information
        against unauthorised access, loss, or misuse. However, no method of transmission or storage
        is completely secure, and we cannot guarantee absolute security. Please keep your account
        password confidential.
      </p>
    ),
  },
  {
    id: "your-rights",
    heading: "Your Rights and Choices",
    body: (
      <>
        <p>You may:</p>
        <ul>
          <li>Access and update your account information at any time.</li>
          <li>Request a copy or correction of the personal data we hold about you.</li>
          <li>Request deletion of your account, subject to any legal or transactional obligations.</li>
          <li>Opt out of non-essential communications.</li>
        </ul>
        <p>To exercise any of these rights, contact us using the details below.</p>
      </>
    ),
  },
  {
    id: "retention",
    heading: "Data Retention",
    body: (
      <p>
        We retain your information for as long as your account is active or as needed to provide our
        services, comply with legal obligations, resolve disputes, and enforce our agreements.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to This Policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. When we do, we will revise the
        &quot;Last updated&quot; date above. Significant changes may be communicated to you
        directly. Continued use of our services after changes take effect means you accept the
        updated policy.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact Us",
    body: (
      <p>
        If you have any questions about this Privacy Policy or how we handle your information,
        please reach us via our <a href="/contact">Contact page</a>, by email at{" "}
        <a href="mailto:support@ocarephinas.com">support@ocarephinas.com</a>, or on WhatsApp.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      breadcrumb="Privacy Policy"
      intro="Your privacy matters to us. This policy describes how Ocare Phinas Integrated Services collects, uses, and protects your personal information."
      lastUpdated="30 May 2026"
      sections={sections}
    />
  );
}
