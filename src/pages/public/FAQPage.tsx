import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { PublicFooter } from "../../components/public/PublicFooter";
import { PublicNavbar } from "../../components/public/PublicNavbar";

type FAQItem = {
  question: string;
  answer: ReactNode;
};

type FAQCategory = {
  number: string;
  title: string;
  description: string;
  questions: FAQItem[];
};

const faqCategories: FAQCategory[] = [
  {
    number: "01",
    title: "About Detrosys",
    description:
      "The basics: what Detrosys is, who it is for, and why it exists.",
    questions: [
      {
        question: "What is Detrosys?",
        answer:
          "Detrosys is a workspace built around the relationships between the things a business is already doing. People, audiences, campaigns, templates and automation are designed to work together rather than feeling like completely separate systems.",
      },
      {
        question: "Who is Detrosys for?",
        answer:
          "Detrosys is designed for people and teams who deal with recurring business work involving contacts, audiences, campaigns, communication and workflows. It is intended to make that work easier to understand and easier to move through.",
      },
      {
        question: "What makes Detrosys different?",
        answer:
          "The idea behind Detrosys is not simply to put more business tools in one place. The workspace is designed around the relationships between those tools, so the context of the work stays visible instead of being rebuilt every time you move from one task to another.",
      },
      {
        question: "What can I actually do with Detrosys?",
        answer:
          "You can organize people, create and manage audiences, work with campaigns, use or create templates, and connect repeated work through automation. The different parts are intended to form one connected working environment.",
      },
    ],
  },
  {
    number: "02",
    title: "How It Works",
    description:
      "How the different parts of the workspace connect and move together.",
    questions: [
      {
        question: "How does Detrosys work?",
        answer:
          "The workspace follows the way work moves. People can become part of audiences, audiences can be used in campaigns, campaigns can use templates, and repeated actions can be connected through automation. The goal is to keep those relationships visible.",
      },
      {
        question: "What are Audiences?",
        answer:
          "Audiences are groups of people organized around something useful to the work. Instead of treating contacts as one large list, audiences give you a way to understand and work with different groups of people.",
      },
      {
        question: "How do Campaigns and Templates work together?",
        answer:
          "A campaign provides the context for a piece of work, while templates provide reusable communication that can be brought into that work. Keeping the two connected means you can reuse what makes sense without losing the campaign it belongs to.",
      },
      {
        question: "What are Automations?",
        answer:
          "Automations connect repeated actions into a workflow so that parts of the process do not need to be handled manually every time. The intention is to make the sequence visible before it starts moving on its own.",
      },
      {
        question: "Do I need to understand the whole system before using Detrosys?",
        answer:
          "No. You should be able to start with the part of the work you need and understand the surrounding relationships as you go. Detrosys is intended to explain the system through the way the workspace is organized rather than requiring you to learn everything first.",
      },
    ],
  },
  {
    number: "03",
    title: "Workspace & Features",
    description:
      "Questions about the individual capabilities inside the workspace.",
    questions: [
      {
        question: "Can I manage my contacts in Detrosys?",
        answer:
          "Contacts are one of the starting points of the workspace. They can be organized into audiences and then connected to the campaigns and workflows that are relevant to them.",
      },
      {
        question: "Can I create my own audiences and campaigns?",
        answer:
          "The workspace is designed around creating and managing your own audiences and campaigns. The intention is to let the structure reflect the way your business actually works rather than forcing every team into the same process.",
      },
      {
        question: "Can I create my own templates?",
        answer:
          "Templates are intended to hold reusable communication close to the work that uses it. You can work from prepared templates or create communication that belongs specifically to your own workflow.",
      },
      {
        question: "Can multiple people use the same workspace?",
        answer:
          "Detrosys is designed around a shared working environment, so the different parts of the work can remain connected instead of being separated across individual tools and personal systems.",
      },
    ],
  },
  {
    number: "04",
    title: "Plans & Account",
    description:
      "The practical questions about plans, changing plans, and your account.",
    questions: [
      {
        question: "Is there a free plan?",
        answer:
          "Detrosys is intended to provide an accessible way to explore the workspace before committing to a paid plan. The exact availability and limits of the free offering can change as the product develops.",
      },
      {
        question: "What is included in each plan?",
        answer:
          "Each plan is designed around a different level of workspace usage and requirements. The Pricing page provides the current breakdown of what is included in each available plan.",
      },
      {
        question: "Can I upgrade or downgrade my plan?",
        answer:
          "Plans are intended to be changeable as your needs change. The exact process and timing can depend on the plan you are currently using and the plan you are moving to.",
      },
      {
        question: "Can I cancel my account?",
        answer:
          "Yes. Account cancellation should be straightforward and should not require you to continue using a service you no longer need. Any plan-specific effects of cancellation will be explained before the change is completed.",
      },
    ],
  },
  {
    number: "05",
    title: "Privacy & Support",
    description:
      "Questions about your information and what to do when you need help.",
    questions: [
      {
        question: "Is my information secure?",
        answer:
          "Protecting the information stored in a workspace is an important part of operating Detrosys. The exact security practices, infrastructure and policies will be documented in the relevant privacy and security information as the product is finalized.",
      },
      {
        question: "How can I get help if something isn't working?",
        answer:
          "If something is not working as expected, the first step is to use the available support resources or contact the Detrosys team. The support process and available channels will depend on the final product and plan.",
      },
      {
        question: "How can I contact Detrosys?",
        answer:
          "You can contact the Detrosys team through the Contact page. That page will provide the appropriate way to get in touch depending on what you need help with.",
      },
    ],
  },
];

export function FAQPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenItem((current) => (current === id ? null : id));
  };

  const scrollToCategory = (number: string) => {
    document.getElementById(`faq-${number}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f1e9] text-neutral-950 dark:bg-neutral-950 dark:text-white">
      <PublicNavbar />

      <main>
        {/* ============================================================
            INTRO
            ============================================================ */}
        <section className="relative overflow-hidden px-6 pb-20 pt-32 sm:px-8 lg:px-16 lg:pb-28 lg:pt-40">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full border border-[var(--detrosys-accent)]/20"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 top-36 h-56 w-56 rounded-full bg-[var(--detrosys-accent)]/5 blur-3xl"
          />

          <div className="relative mx-auto max-w-[1400px]">
            <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
              <div>
                <div className="mb-8 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
                  <span className="h-2 w-2 rounded-full bg-[var(--detrosys-accent)]" />
                  Detrosys / Questions
                </div>

                <h1 className="max-w-5xl text-[clamp(3.5rem,8vw,8rem)] font-semibold leading-[0.88] tracking-[-0.065em]">
                  Questions,
                  <br />
                  <span className="text-neutral-400 dark:text-neutral-600">
                    answered.
                  </span>
                </h1>
              </div>

              <div className="max-w-md lg:pb-2">
                <p className="text-base leading-7 text-neutral-600 dark:text-neutral-400 sm:text-lg sm:leading-8">
                  A straightforward place to understand Detrosys, how the
                  workspace fits together, and the practical questions that
                  come before you start using it.
                </p>
              </div>
            </div>

            {/* CATEGORY NAVIGATION */}
            <div className="mt-16 grid border-t border-black/10 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-5">
              {faqCategories.map((category) => (
                <button
                  key={category.number}
                  type="button"
                  onClick={() => scrollToCategory(category.number)}
                  className="group border-b border-black/10 px-1 py-6 text-left transition-colors hover:bg-black/[0.025] dark:border-white/10 dark:hover:bg-white/[0.025] lg:border-b-0 lg:border-r lg:px-5 lg:first:pl-0 lg:last:border-r-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">
                      {category.number}
                    </span>

                    <ArrowUpRight
                      size={15}
                      className="text-neutral-400 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                    />
                  </div>

                  <p className="mt-6 text-sm font-medium">
                    {category.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            FAQ CATEGORIES
            ============================================================ */}
        <section className="px-6 pb-24 sm:px-8 lg:px-16 lg:pb-36">
          <div className="mx-auto max-w-[1200px]">
            {faqCategories.map((category) => (
              <section
                key={category.number}
                id={`faq-${category.number}`}
                className="scroll-mt-28 border-t border-black/10 py-16 dark:border-white/10 lg:py-24"
              >
                <div className="grid gap-10 lg:grid-cols-[0.32fr_0.68fr] lg:gap-16">
                  {/* CATEGORY INTRO */}
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
                      {category.number}
                    </div>

                    <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                      {category.title}
                    </h2>

                    <p className="mt-5 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                      {category.description}
                    </p>
                  </div>

                  {/* ACCORDION */}
                  <div className="border-t border-black/10 dark:border-white/10">
                    {category.questions.map((item, index) => {
                      const id = `${category.number}-${index}`;
                      const isOpen = openItem === id;

                      return (
                        <div
                          key={id}
                          className="border-b border-black/10 dark:border-white/10"
                        >
                          <button
                            type="button"
                            onClick={() => toggleItem(id)}
                            aria-expanded={isOpen}
                            className="group flex w-full items-center justify-between gap-8 py-6 text-left transition-colors sm:py-7"
                          >
                            <span className="max-w-3xl text-base font-medium tracking-[-0.015em] sm:text-lg">
                              {item.question}
                            </span>

                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 transition-all duration-300 dark:border-white/10 ${
                                isOpen
                                  ? "rotate-180 bg-neutral-950 text-white dark:bg-[#f4f1e9] dark:text-neutral-950"
                                  : "group-hover:bg-black/5 dark:group-hover:bg-white/5"
                              }`}
                            >
                              <ChevronDown size={16} />
                            </span>
                          </button>

                          <div
                            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                              isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="max-w-2xl pb-7 pr-12 text-sm leading-7 text-neutral-600 dark:text-neutral-400 sm:text-base sm:leading-8">
                                {item.answer}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </section>

        {/* ============================================================
            CLOSING
            ============================================================ */}
        <section className="px-6 pb-10 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-[1400px]">
            <div className="relative overflow-hidden rounded-[2rem] bg-neutral-950 px-7 py-16 text-white sm:px-12 sm:py-20 lg:px-16 lg:py-24 dark:bg-[#f4f1e9] dark:text-neutral-950">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10 dark:border-black/10"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-10 top-10 h-3 w-3 rounded-full bg-[var(--detrosys-accent)]"
              />

              <div className="relative max-w-3xl">
                <div className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-500">
                  One more thing
                </div>

                <h2 className="mt-7 text-4xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                  Still figuring out
                  <br />
                  <span className="text-neutral-500">
                    whether it fits?
                  </span>
                </h2>

                <p className="mt-8 max-w-xl text-base leading-7 text-neutral-400 dark:text-neutral-600 sm:text-lg sm:leading-8">
                  Explore the workspace for yourself and see whether Detrosys
                  fits the way your work actually happens.
                </p>

                <a
                  href="/signup"
                  className="mt-9 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-neutral-950 transition-transform duration-300 hover:-translate-y-0.5 dark:bg-neutral-950 dark:text-white"
                >
                  Start free
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}