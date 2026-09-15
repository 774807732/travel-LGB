export function SaveNotice({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <aside className="save-notice" aria-label="存档提示">
      <p>
        更换手机或浏览器，<strong>不会自动同步存档</strong>。
      </p>
      <button type="button" onClick={onOpenSettings}>
        存档备份与迁移
      </button>
    </aside>
  );
}
