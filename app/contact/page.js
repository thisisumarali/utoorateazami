import ContactClient from "./ContactClient";

export const metadata = {
  title: "Contact Us | Utoorat e Azami Artisanal Fragrances",
  description:
    "Get in touch with Utoorat e Azami. Reach out for fragrance inquiries, custom gift set curation, bulk orders, or order status support across Pakistan.",
  keywords:
    "contact utoorateazami, attar shop contact, customer support, whatsapp perfume pakistan, fragrance inquiry",
  openGraph: {
    title: "Contact Utoorat e Azami | Fragrance House",
    description:
      "Connect with our fragrance curators via WhatsApp, phone, or direct message.",
    url: "https://utoorateazami.com/contact",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
