import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";
export function Sheet({
  title,
  children,
  onClose,
  back,
  onBack,
  wide = false,
  viewKey,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  back?: boolean;
  onBack?: () => void;
  wide?: boolean;
  viewKey?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const scrollPositions = useRef(new Map<string, number>());
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const element = ref.current!,
      prior = document.activeElement as HTMLElement | null;
    element.showModal();
    const close = () => closeRef.current();
    element.addEventListener("close", close);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.removeEventListener("close", close);
      element.close();
      document.body.style.overflow = previousOverflow;
      prior?.focus();
    };
  }, []);
  useEffect(() => {
    const element = ref.current!,
      key = viewKey ?? title;
    element.querySelector("h2")?.focus({ preventScroll: true });
    element.scrollTop = scrollPositions.current.get(key) ?? 0;
    const remember = () => scrollPositions.current.set(key, element.scrollTop);
    element.addEventListener("scroll", remember);
    return () => element.removeEventListener("scroll", remember);
  }, [title, viewKey]);
  return (
    <dialog
      className={wide ? "sheet sheet-wide" : "sheet"}
      ref={ref}
      aria-labelledby="sheet-heading"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const r = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          onClose();
      }}
    >
      <header className="sheet-header">
        {back && (
          <button className="icon-button" aria-label="返回" onClick={onBack}>
            <Icon name="back" />
          </button>
        )}
        <h2 id="sheet-heading" tabIndex={-1}>
          {title}
        </h2>
        <button className="icon-button" aria-label="关闭面板" onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>
      <div className="sheet-content">{children}</div>
    </dialog>
  );
}
