"use client";

import { useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/store/toastStore";
import { api, ApiError } from "@/lib/api";

const SUBJECTS = [
  "General enquiry",
  "Order or delivery",
  "Payment confirmation",
  "Pay Small Small / contribution plan",
  "Product availability",
  "Other",
];

export function ContactForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await api.post("/api/contact", {
        name: (fd.get("name") as string) || "",
        email: (fd.get("email") as string) || "",
        phone: (fd.get("phone") as string) || undefined,
        subject: (fd.get("subject") as string) || "",
        message: (fd.get("message") as string) || "",
      });
      e.currentTarget.reset();
      toast.success(
        "Thanks for reaching out — we'll get back to you shortly.",
        "Message sent",
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-body-sm font-medium">Full name</label>
          <input id="name" name="name" type="text" required placeholder="Your name" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-body-sm font-medium">Phone number</label>
          <input id="phone" name="phone" type="tel" placeholder="08012345678" className={inputClass} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-body-sm font-medium">Email address</label>
        <input id="email" name="email" type="email" required placeholder="you@example.com" className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="subject" className="text-body-sm font-medium">Subject</label>
        <select id="subject" name="subject" defaultValue="" required className={inputClass}>
          <option value="" disabled>Choose a topic</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="text-body-sm font-medium">Message</label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="How can we help you?"
          className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors resize-y"
        />
      </div>

      <Button type="submit" size="lg" className="w-full gap-2 sm:w-auto" disabled={loading}>
        <Send className="size-4" />
        {loading ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
