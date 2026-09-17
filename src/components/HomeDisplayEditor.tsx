import { useState } from "react";
import { SOUVENIRS, itemImage, itemName, type SouvenirId } from "../game/content";
import type { GameState } from "../game/engine";
import { DISPLAY_SLOTS, homeDisplay, type DisplaySlotId } from "../game/homeDisplay";

export function HomeDisplayEditor({ state, slot, onSlot, onPlace, canWrite, onView }: {
  state: GameState;
  slot: DisplaySlotId;
  onSlot: (slot: DisplaySlotId) => void;
  onPlace: (id: SouvenirId | null) => Promise<boolean>;
  canWrite: boolean;
  onView: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const display = homeDisplay(state);
  const selected = DISPLAY_SLOTS.find((s) => s.id === slot)!;
  const owned = SOUVENIRS.filter((item) => (state.souvenirs[item.id] ?? 0) > 0);
  async function place(id: SouvenirId | null) {
    setBusy(true);
    try { await onPlace(id); } finally { setBusy(false); }
  }
  return <div className="display-editor">
    <p className="muted intro">把路上带回的小东西，摆在每天看得见的地方。</p>
    <div className="display-slots" role="group" aria-label="选择摆放位置">
      {DISPLAY_SLOTS.map((target) => <button
        key={target.id}
        aria-pressed={slot === target.id}
        aria-label={`选择${target.name}，${display[target.id] ? itemName(display[target.id]!) : "空着"}`}
        disabled={busy}
        onClick={() => onSlot(target.id)}
      >
        <span className="display-slot-art">
          {display[target.id]
            ? <img className="item-art" src={itemImage(display[target.id]!)} alt="" />
            : <span aria-hidden="true">＋</span>}
        </span>
        <b>{target.name}</b>
        <small>{display[target.id] ? itemName(display[target.id]!) : "还空着"}</small>
      </button>)}
    </div>
    <div className="display-selection">
      <div><b>摆在{selected.name}</b><small>选一件就摆好，随时可以换。</small></div>
      <button disabled={!canWrite || busy || !display[slot]} onClick={() => void place(null)}>收回这件</button>
    </div>
    {owned.length ? <div className="display-choices" role="group" aria-label="已获得的纪念物">
      {owned.map((item) => {
        const placed = DISPLAY_SLOTS.find((s) => display[s.id] === item.id);
        return <button
          key={item.id}
          className="display-choice"
          aria-label={`摆放${item.name}`}
          aria-pressed={display[slot] === item.id}
          disabled={!canWrite || busy}
          onClick={() => void place(item.id)}
        >
          <img className="item-art" src={itemImage(item.id)} alt="" />
          <b>{item.name}</b>
          <small>{placed ? `已摆在${placed.name}` : "收在手账里"}</small>
        </button>;
      })}
    </div> : <p className="paper-note">等它带回第一件纪念物，就能布置小屋啦。</p>}
    <p className="muted display-note">只摆已获得的纪念物，不消耗数量或盘缠。每种摆一件，选到已摆出的，会搬到新位置；换下的仍收在手账里。布置会自动保存在当前浏览器。</p>
    <button className="primary display-done" onClick={onView}>回屋看看</button>
  </div>;
}
