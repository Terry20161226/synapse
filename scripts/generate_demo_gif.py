import os
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFont

def generate_gif():
    width = 860
    height = 500
    frames_dir = "/tmp/synapse_gif_frames"
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir)
    os.makedirs(frames_dir, exist_ok=True)

    font_path = "/System/Library/Fonts/Menlo.ttc"
    try:
        font_regular = ImageFont.truetype(font_path, 13)
        font_bold = ImageFont.truetype(font_path, 13)
        font_title = ImageFont.truetype(font_path, 12)
    except Exception:
        font_regular = ImageFont.load_default()
        font_bold = font_regular
        font_title = font_regular

    def draw_window_frame(draw, title_text="synapse — zsh"):
        # Dark modern slate background
        draw.rounded_rectangle([0, 0, width, height], radius=12, fill="#0d1117")
        # Header bar
        draw.rounded_rectangle([0, 0, width, 38], radius=12, fill="#161b22")
        draw.rectangle([0, 26, width, 38], fill="#161b22")
        draw.line([0, 38, width, 38], fill="#30363d", width=1)
        # Window buttons
        draw.ellipse([18, 14, 28, 24], fill="#ff5f56")
        draw.ellipse([36, 14, 46, 24], fill="#ffbd2e")
        draw.ellipse([54, 14, 64, 24], fill="#27c93f")
        # Title
        draw.text((width // 2 - 80, 12), title_text, font=font_title, fill="#8b949e")

    total_frames = 65
    print(f"Rendering {total_frames} frames...")

    for i in range(total_frames):
        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        if i < 22:
            # Phase 1: Running init
            draw_window_frame(draw, "order-manager-source — zsh")
            y = 56
            draw.text((25, y), "➜  order-manager-source git:(develop) ", font=font_bold, fill="#58a6ff")
            
            # Typewriter effect
            cmd = "npx synapse-agent init"
            typed_chars = min(len(cmd), max(0, int((i - 2) * 2)))
            draw.text((310, y), cmd[:typed_chars], font=font_bold, fill="#f0f6fc")
            if (i // 3) % 2 == 0 and typed_chars < len(cmd):
                draw.rectangle([310 + typed_chars * 8, y + 2, 318 + typed_chars * 8, y + 16], fill="#58a6ff")

            if i >= 12:
                y += 26
                draw.text((25, y), "🧠 Initializing Synapse Universal Agent Matrix...", font=font_bold, fill="#79c0ff")
                y += 22
                draw.text((25, y), "📁 Local .synapse context directory initialized.", font=font_regular, fill="#8b949e")
                y += 20
                draw.text((45, y), "✓ [Cursor]      .cursor/mcp.json & .cursorrules", font=font_regular, fill="#7ee787")
                y += 18
                draw.text((45, y), "✓ [Claude Code] CLAUDE.md & Claude Desktop config", font=font_regular, fill="#7ee787")
                y += 18
                draw.text((45, y), "✓ [Codex & AGY] AGENTS.md", font=font_regular, fill="#7ee787")
                y += 18
                draw.text((45, y), "✓ [Windsurf]    .windsurfrules", font=font_regular, fill="#7ee787")
                y += 18
                draw.text((45, y), "✓ [Cline]       .clinerules", font=font_regular, fill="#7ee787")
                y += 24
                draw.text((25, y), "🎉 Synapse ready! All your AI agents are now sharing the same brain.", font=font_bold, fill="#56d364")

        elif i < 38:
            # Phase 2: Setting Goal & Decision
            draw_window_frame(draw, "order-manager-source — zsh")
            y = 56
            draw.text((25, y), "➜  order-manager-source git:(develop) npx synapse-agent set-goal \"EasyExcel Streaming\"", font=font_regular, fill="#8b949e")
            y += 22
            draw.text((25, y), "✓ Active goal set to: EasyExcel Streaming", font=font_bold, fill="#7ee787")
            y += 26
            draw.text((25, y), "➜  order-manager-source git:(develop) ", font=font_bold, fill="#58a6ff")
            cmd2 = "npx synapse-agent watch"
            typed2 = min(len(cmd2), max(0, int((i - 25) * 2)))
            draw.text((310, y), cmd2[:typed2], font=font_bold, fill="#f0f6fc")
            if (i // 3) % 2 == 0:
                draw.rectangle([310 + typed2 * 8, y + 2, 318 + typed2 * 8, y + 16], fill="#58a6ff")

        else:
            # Phase 3: Live TUI Dashboard with Real-Time Agent Activity
            draw_window_frame(draw, "order-manager-source — npx synapse-agent watch")
            hr = "─" * 74
            y = 50
            draw.text((30, y), f"┌{hr}┐", font=font_bold, fill="#38bdf8")
            y += 18
            pulse = "🟢 LIVE" if (i // 4) % 2 == 0 else "⚪ LIVE"
            draw.text((30, y), f"│ 🧠 SYNAPSE LIVE CONTEXT MONITOR • v0.4.0        {pulse} [16:45:10] │", font=font_bold, fill="#f8fafc")
            y += 18
            draw.text((30, y), f"├{hr}┤", font=font_bold, fill="#38bdf8")
            y += 18
            draw.text((30, y), f"│ 📁 Project: order-manager-source                                          │", font=font_bold, fill="#e2e8f0")
            y += 18
            draw.text((30, y), f"│ 🎯 Goal:    订单导出 Excel 性能重构与流式写入规范                         │", font=font_bold, fill="#4ade80")
            y += 18
            draw.text((30, y), f"│ 📜 Rule:    全系统订单导出禁用内存全量加载，统一采用 EasyExcel 流式分页    │", font=font_regular, fill="#94a3b8")
            y += 18
            draw.text((30, y), f"├{hr}┤", font=font_bold, fill="#38bdf8")
            y += 18
            draw.text((30, y), f"│ 🚧 ACTIVE WORKING TREE CHANGES (Uncommitted - Live Sync):                 │", font=font_bold, fill="#f8fafc")
            y += 18
            # File changes highlight
            mod_color = "#facc15" if (i // 3) % 2 == 0 else "#eab308"
            draw.text((30, y), f"│   [MODIFIED] backend/service/OrderExportService.java (Claude Code 4s ago) │", font=font_regular, fill=mod_color)
            y += 18
            draw.text((30, y), f"│   [ADDED]    frontend/src/views/order/ExportDialog.vue (Cursor 1s ago)    │", font=font_regular, fill="#4ade80")
            y += 18
            draw.text((30, y), f"├{hr}┤", font=font_bold, fill="#38bdf8")
            y += 18
            draw.text((30, y), f"│ ⏱️  RECENT CROSS-AGENT TIMELINE:                                           │", font=font_bold, fill="#f8fafc")
            y += 18
            draw.text((30, y), f"│  [16:44:50] [AGY] Decision: 统一采用 EasyExcel 流式分页，单批 1000 条     │", font=font_regular, fill="#c084fc")
            y += 18
            draw.text((30, y), f"│  [16:45:02] [Codex] Reading .synapse/context.md and following guidelines  │", font=font_regular, fill="#38bdf8")
            y += 18
            draw.text((30, y), f"│  [16:45:08] [Cursor] Generating UI components conforming to backend specs │", font=font_regular, fill="#94a3b8")
            y += 18
            draw.text((30, y), f"├{hr}┤", font=font_bold, fill="#38bdf8")
            y += 18
            draw.text((30, y), f"│ [q] Quit  •  [r] Force Refresh  •  Universal Agent Matrix Active         │", font=font_regular, fill="#64748b")
            y += 18
            draw.text((30, y), f"└{hr}┘", font=font_bold, fill="#38bdf8")

        frame_file = os.path.join(frames_dir, f"frame_{i:04d}.png")
        img.save(frame_file)

    output_dir = "/Users/fengbo/.gemini/antigravity/scratch/synapse/assets"
    os.makedirs(output_dir, exist_ok=True)
    output_gif = os.path.join(output_dir, "demo.gif")

    print("Encoding with ffmpeg...")
    cmd = [
        "/opt/homebrew/bin/ffmpeg",
        "-y",
        "-framerate", "10",
        "-i", f"{frames_dir}/frame_%04d.png",
        "-vf", "split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse",
        output_gif
    ]
    subprocess.run(cmd, check=True)
    print(f"GIF created successfully at: {output_gif}")
    print(f"File size: {os.path.getsize(output_gif) / 1024:.1f} KB")

if __name__ == "__main__":
    generate_gif()
