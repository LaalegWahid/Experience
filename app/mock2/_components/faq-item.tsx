"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/shared/utils/cx";
import styles from "../mock2.module.css";

export function FaqItem({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = answerRef.current;
    if (el && defaultOpen) el.style.maxHeight = `${el.scrollHeight}px`;
    // Set once on mount to match the original mock's initial "open" FAQ item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    const el = answerRef.current;
    if (el) el.style.maxHeight = next ? `${el.scrollHeight}px` : "0px";
  }

  return (
    <article className={cx(styles["faq-item"], open && styles.open)}>
      <button
        type="button"
        className={styles["faq-question"]}
        aria-expanded={open}
        onClick={toggle}
      >
        <span>{question}</span>
        <span className={styles["faq-plus"]}>+</span>
      </button>
      <div ref={answerRef} className={styles["faq-answer"]}>
        <p>{answer}</p>
      </div>
    </article>
  );
}
