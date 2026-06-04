import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/storefront/legal-page";

export const metadata: Metadata = {
  title: "Product Warranty Policy — OCare Phinas Integrated Services",
  description:
    "Warranty coverage for products purchased from Ocare Phinas Integrated Services, including brand-new electronics, appliances, and pre-owned (Tokunbo) items.",
};

const sections: LegalSection[] = [
  {
    id: "general-coverage",
    heading: "General Warranty Coverage",
    body: (
      <>
        <p>Warranty coverage begins from the date the customer receives the product.</p>
        <p>
          Warranty covers manufacturing defects and faults not caused by misuse, negligence, power
          surges, accidents, liquid damage, unauthorized repairs, or physical damage.
        </p>
        <p>
          Warranty does not cover cosmetic damage, wear and tear, or damage resulting from improper
          use.
        </p>
        <p>Customers must retain proof of purchase to access warranty services.</p>
      </>
    ),
  },
  {
    id: "brand-new",
    heading: "Brand-New Products",
    body: (
      <>
        <p>Brand-new products sold by Ocare Phinas Integrated Services may carry either:</p>
        <p>
          <strong>a) Manufacturer Warranty</strong>
          <br />
          Where a manufacturer warranty exists, customers will enjoy the warranty period specified by
          the manufacturer.
        </p>
        <p>
          <strong>b) Ocare Phinas Warranty</strong>
          <br />
          Where no manufacturer warranty exists, Ocare Phinas may provide a limited warranty period
          as stated on the product page.
        </p>
      </>
    ),
  },
  {
    id: "electronics-appliances",
    heading: "Electronics and Appliances",
    body: (
      <>
        <p>Eligible products may receive warranty coverage ranging from:</p>
        <ul>
          <li>7 Days Replacement Guarantee</li>
          <li>30 Days Limited Warranty</li>
          <li>90 Days Limited Warranty</li>
          <li>Manufacturer Warranty (where applicable)</li>
        </ul>
        <p>The specific warranty period for each product will be displayed on the product listing.</p>
      </>
    ),
  },
  {
    id: "claim-process",
    heading: "Warranty Claim Process",
    body: (
      <>
        <p>To initiate a warranty claim:</p>
        <ul>
          <li>Contact Customer Support.</li>
          <li>Provide Order Number.</li>
          <li>Provide evidence of fault through photos or videos if requested.</li>
          <li>Return the item for inspection if necessary.</li>
        </ul>
        <p>
          Ocare Phinas reserves the right to inspect products before approving any replacement,
          repair, or refund.
        </p>
      </>
    ),
  },
  {
    id: "remedies",
    heading: "Remedies",
    body: (
      <>
        <p>Where a warranty claim is approved, Ocare Phinas may:</p>
        <ul>
          <li>Repair the item.</li>
          <li>Replace the item with the same model.</li>
          <li>Replace with a similar model if the original is unavailable.</li>
          <li>Issue store credit.</li>
          <li>Offer a refund where appropriate.</li>
        </ul>
        <p>The remedy provided shall be at the discretion of Ocare Phinas Integrated Services.</p>
      </>
    ),
  },
  {
    id: "void-conditions",
    heading: "Warranty Void Conditions",
    body: (
      <>
        <p>Warranty becomes void if:</p>
        <ul>
          <li>Product is opened by unauthorized technicians.</li>
          <li>Product is physically damaged.</li>
          <li>Product is exposed to water or moisture damage.</li>
          <li>Product is damaged by power fluctuations.</li>
          <li>Product serial numbers are altered or removed.</li>
          <li>Product is misused contrary to manufacturer instructions.</li>
        </ul>
      </>
    ),
  },
  {
    id: "transportation",
    heading: "Transportation Costs",
    body: (
      <p>
        Customers may be responsible for transportation costs associated with warranty inspections
        unless otherwise determined by Ocare Phinas.
      </p>
    ),
  },
  {
    id: "final-decision",
    heading: "Final Decision",
    body: (
      <p>
        Ocare Phinas reserves the right to make the final determination regarding all warranty claims
        after inspection.
      </p>
    ),
  },
  {
    id: "pre-owned",
    heading: "Pre-Owned (Tokunbo) Product Warranty",
    body: (
      <>
        <p>
          Pre-owned products are previously used items carefully selected and tested before being
          offered for sale.
        </p>

        <p>
          <strong>Product Condition</strong>
        </p>
        <p>Customers acknowledge that pre-owned items:</p>
        <ul>
          <li>Have been previously used.</li>
          <li>May show minor cosmetic signs of usage.</li>
          <li>May not come with original packaging or accessories.</li>
          <li>Are sold based on their tested working condition.</li>
        </ul>

        <p>
          <strong>Testing Process</strong>
        </p>
        <p>All pre-owned products undergo basic testing before delivery.</p>
        <p>
          Where possible, customers are encouraged to inspect and test products upon delivery.
        </p>

        <p>
          <strong>Warranty Period</strong>
        </p>
        <p>Unless otherwise stated:</p>
        <ul>
          <li>Phones: 7 Days Functional Warranty</li>
          <li>Laptops: 14 Days Functional Warranty</li>
          <li>Televisions: 7 Days Functional Warranty</li>
          <li>Home Appliances: 7 Days Functional Warranty</li>
          <li>Other Electronics: Warranty period stated on listing</li>
        </ul>

        <p>
          <strong>What the Warranty Covers</strong>
        </p>
        <p>Warranty covers:</p>
        <ul>
          <li>Failure resulting from defects existing before delivery.</li>
          <li>Functional faults not caused by customer actions.</li>
        </ul>

        <p>
          <strong>What the Warranty Does Not Cover</strong>
        </p>
        <p>Warranty does not cover:</p>
        <ul>
          <li>Battery performance degradation.</li>
          <li>Cosmetic scratches.</li>
          <li>Physical damage.</li>
          <li>Water damage.</li>
          <li>Software issues caused by customer installations.</li>
          <li>Damage caused by electrical surges.</li>
          <li>Damage caused by misuse.</li>
        </ul>

        <p>
          <strong>No Change of Mind Returns</strong>
        </p>
        <p>Pre-owned items cannot be returned because:</p>
        <ul>
          <li>Customer changes their mind.</li>
          <li>Customer wants a different color.</li>
          <li>Customer later finds a lower price elsewhere.</li>
        </ul>

        <p>
          <strong>Warranty Remedy</strong>
        </p>
        <p>Approved claims may receive:</p>
        <ul>
          <li>Repair</li>
          <li>Replacement</li>
          <li>Store Credit</li>
        </ul>
        <p>Refunds are only considered where repair or replacement is impossible.</p>

        <p>
          <strong>Customer Responsibility</strong>
        </p>
        <p>Customers must report faults within the warranty period.</p>
        <p>Claims reported after expiration of warranty coverage may not be accepted.</p>
      </>
    ),
  },
];

export default function WarrantyPage() {
  return (
    <LegalPage
      title="Product Warranty Policy"
      breadcrumb="Warranty Policy"
      intro="At Ocare Phinas Integrated Services, we are committed to delivering quality products and ensuring customer satisfaction. This policy outlines the warranty coverage available on products purchased through our platform, including brand-new and pre-owned (Tokunbo) items."
      lastUpdated="June 2026"
      sections={sections}
    />
  );
}
