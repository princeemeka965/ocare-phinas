import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/storefront/legal-page";

export const metadata: Metadata = {
  title: "Delivery & Shipping Policy — OCare Phinas Integrated Services",
  description:
    "How Ocare Phinas Integrated Services processes and delivers orders across Nigeria — doorstep delivery within Lagos, waybill services to other states, shipping charges and delivery timelines.",
};

const sections: LegalSection[] = [
  {
    id: "delivery-coverage",
    heading: "Delivery Coverage",
    body: (
      <>
        <p>We currently deliver products across Nigeria.</p>
        <p>Delivery methods vary depending on the customer&rsquo;s location.</p>
      </>
    ),
  },
  {
    id: "lagos-deliveries",
    heading: "Lagos State Deliveries",
    body: (
      <>
        <p>Customers located within Lagos State are eligible for Doorstep Delivery.</p>
        <p>
          Our delivery personnel or logistics partners will deliver orders directly to the
          customer&rsquo;s provided address.
        </p>
        <p>Customers are required to provide accurate delivery details, including:</p>
        <ul>
          <li>Full Name</li>
          <li>Phone Number</li>
          <li>Complete Delivery Address</li>
          <li>Landmark (where applicable)</li>
        </ul>
        <p>
          Delivery timelines within Lagos may vary depending on product availability, traffic
          conditions, weather, public holidays, and other unforeseen circumstances.
        </p>
      </>
    ),
  },
  {
    id: "outside-lagos",
    heading: "Deliveries Outside Lagos",
    body: (
      <>
        <p>
          For customers outside Lagos State, products will be delivered through approved transport
          and logistics companies (&ldquo;Waybill Services&rdquo;).
        </p>
        <p>Customers outside Lagos acknowledge and agree that:</p>
        <ul>
          <li>Ocare Phinas will hand over the product to the selected transport company in good condition.</li>
          <li>Risk of transportation passes to the logistics company once the item has been dispatched.</li>
          <li>Delivery timelines are determined by the transport company and destination location.</li>
        </ul>
        <p>Customers will be provided with waybill details where available.</p>
        <p>
          Customers outside Lagos may request motor park waybill, transport company waybill, or
          doorstep courier delivery where available. Once a product has been inspected, packaged,
          and handed over to the selected transport company, Ocare Phinas shall not be liable for
          delays, mishandling, or damages caused by the transport company during transit. However,
          we will make reasonable efforts to assist customers in resolving any delivery-related
          issues.
        </p>
      </>
    ),
  },
  {
    id: "shipping-charges",
    heading: "Shipping Charges",
    body: (
      <>
        <p>Delivery and shipping charges are calculated based on:</p>
        <ul>
          <li>Product size</li>
          <li>Product weight</li>
          <li>Delivery destination</li>
          <li>Logistics costs</li>
        </ul>
        <p>Shipping fees may be displayed during checkout or communicated before dispatch.</p>
      </>
    ),
  },
  {
    id: "order-processing",
    heading: "Order Processing",
    body: (
      <>
        <p>Orders are processed after:</p>
        <ul>
          <li>Full payment has been confirmed; or</li>
          <li>Required milestone payments have been met under approved Solo or Group Plans.</li>
        </ul>
        <p>Orders may be delayed where payment verification is pending.</p>
      </>
    ),
  },
  {
    id: "inspection",
    heading: "Inspection Upon Receipt",
    body: (
      <>
        <p>Customers are encouraged to inspect products immediately upon receipt.</p>
        <p>Any issue relating to:</p>
        <ul>
          <li>Missing items</li>
          <li>Wrong items</li>
          <li>Physical damage</li>
        </ul>
        <p>
          must be reported within <strong>24 hours of delivery</strong>.
        </p>
        <p>
          Failure to report such issues within the specified period may affect the customer&rsquo;s
          claim rights.
        </p>
      </>
    ),
  },
  {
    id: "failed-delivery",
    heading: "Failed Delivery Attempts",
    body: (
      <>
        <p>Where a customer is unavailable to receive a delivery:</p>
        <ul>
          <li>Additional delivery charges may apply.</li>
          <li>Delivery may be rescheduled.</li>
          <li>Orders may be returned to our facility pending further arrangements.</li>
        </ul>
      </>
    ),
  },
  {
    id: "timelines",
    heading: "Delivery Timelines",
    body: (
      <>
        <p>Estimated delivery timelines:</p>
        <p>
          <strong>Lagos State</strong>
        </p>
        <ul>
          <li>1 to 5 business days after confirmation.</li>
        </ul>
        <p>
          <strong>Other States</strong>
        </p>
        <ul>
          <li>2 to 10 business days after dispatch, depending on location and transport company schedules.</li>
        </ul>
        <p>These timelines are estimates only and are not guaranteed.</p>
      </>
    ),
  },
  {
    id: "force-majeure",
    heading: "Force Majeure",
    body: (
      <>
        <p>
          Ocare Phinas shall not be liable for delivery delays caused by events beyond our
          reasonable control, including:
        </p>
        <ul>
          <li>Floods</li>
          <li>Fire outbreaks</li>
          <li>Road closures</li>
          <li>Government restrictions</li>
          <li>Industrial actions</li>
          <li>Security concerns</li>
          <li>Transportation disruptions</li>
        </ul>
      </>
    ),
  },
  {
    id: "customer-responsibility",
    heading: "Customer Responsibility",
    body: (
      <>
        <p>
          Customers are responsible for ensuring that all delivery information provided is
          accurate.
        </p>
        <p>
          Ocare Phinas shall not be liable for losses arising from incorrect addresses, incorrect
          phone numbers, or failure of the customer to receive deliveries.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    heading: "Contact Information",
    body: (
      <>
        <p>For delivery-related inquiries, customers may contact:</p>
        <p>
          <strong>Ocare Phinas Integrated Services</strong>
          <br />
          Phone: <a href="tel:+2347069640753">0706 964 0753</a>
        </p>
        <p>
          We remain committed to ensuring a smooth and reliable delivery experience for all
          customers nationwide.
        </p>
      </>
    ),
  },
];

export default function DeliveryPolicyPage() {
  return (
    <LegalPage
      title="Delivery & Shipping Policy"
      breadcrumb="Delivery & Shipping"
      intro="At Ocare Phinas Integrated Services, we are committed to ensuring that all orders are delivered safely, efficiently, and in a timely manner. This Delivery and Shipping Policy explains how orders are processed and delivered to customers."
      lastUpdated="June 2026"
      sections={sections}
    />
  );
}
