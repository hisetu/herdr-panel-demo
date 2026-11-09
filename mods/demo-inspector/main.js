import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { spaces, focused, theme, run } from "herdr";

export default class DemoInspector extends View {
  render() {
    const t = theme();
    const focus = focused();
    const space = spaces().find(s => s.id === focus?.space);
    const tab = space?.tabs.find(item => item.id === focus?.tab);
    const row = (label, value) => v_flex().gap(5).p(12).rounded(8)
      .bg(t.surface)
      .child(div().text_size(12).text_color(t.muted).child(label))
      .child(div().text_size(13).text_color(t.foreground).child(value || "—"));

    return v_flex().size_full().bg(t.chrome).rounded(8)
      .border(1).border_color(t.border)
      .child(h_flex().h(48).px(12).items_center().justify_between()
        .child(div().text_size(14).font_semibold().text_color(t.foreground)
          .child("工作區資訊"))
        .child(div().id("demo-close-panel").h(32).px(8).rounded(5)
          .text_size(12).text_color(t.muted).hover(s => s.bg(t.hover))
          .on_click(() => run("layout.hide", { id: "panel" }))
          .child("關閉")))
      .child(v_flex().id("demo-panel-content").flex_1()
        .overflow_y_scrollbar().p(12).gap(10)
        .child(row("Space", space?.name))
        .child(row("Tab", tab?.name))
        .child(row("Machine", space ? (space.machine ?? "This computer") : null))
        .child(row("目前目錄", focus?.cwd))
        .child(row("Terminal", focus?.terminal))
        .child(row("Layout 的責任", "Files、Changes、Demo 共用同一個右側區域；stack 決定顯示哪個面板。"))
        .child(row("Mod 的責任", "畫出按鈕與這些卡片，讀取即時資料，點擊時執行指令。"))
        .child(div().text_size(12).text_color(t.muted)
          .child("這是唯讀範例：不執行 shell、不呼叫網路、不啟停 terminal。切換 Space 或 Tab 時，資料由 Herdr 自動更新。")));
  }
}
