"use client";

import { useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import type { BrandKit } from "@/lib/types";
import { Button, Card, Input, Label } from "@/components/ui";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.03] p-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-mono text-[12.5px] uppercase text-white/80 outline-none"
        />
      </div>
    </div>
  );
}

export function BrandEditor({ initial }: { initial: BrandKit }) {
  const [brand, setBrand] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brand),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      setBrand(data.brand);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label hint="出现在片头与 CTA">品牌名</Label>
            <Input
              value={brand.name}
              onChange={(e) => setBrand({ ...brand, name: e.target.value })}
            />
          </div>
          <ColorField
            label="主色 / Accent"
            value={brand.primary}
            onChange={(v) => setBrand({ ...brand, primary: v })}
          />
          <ColorField
            label="深色 / Ink"
            value={brand.ink}
            onChange={(v) => setBrand({ ...brand, ink: v })}
          />
          <ColorField
            label="浅色 / Paper"
            value={brand.paper}
            onChange={(v) => setBrand({ ...brand, paper: v })}
          />
          <div>
            <Label hint="CTA 按钮文案">行动指令</Label>
            <Input
              value={brand.cta}
              onChange={(e) => setBrand({ ...brand, cta: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label hint="显示在成片底部">域名 / 店铺</Label>
            <Input
              value={brand.domain ?? ""}
              onChange={(e) => setBrand({ ...brand, domain: e.target.value })}
              placeholder="yourstore.com"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存品牌库
          </Button>
          {saved ? (
            <span className="flex items-center gap-1 text-[12px] text-emerald-300">
              <Check className="h-3.5 w-3.5" /> 已保存
            </span>
          ) : null}
          {error ? <span className="text-[12px] text-rose-300">{error}</span> : null}
        </div>
        <p className="mt-4 text-[11.5px] leading-relaxed text-white/25">
          品牌色会进入成片的背景、字幕高亮与 CTA 卡片；修改后新生成的视频自动生效。
        </p>
      </Card>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <Card className="overflow-hidden">
          <div className="border-b border-white/[0.06] px-4 py-3 text-[12px] font-semibold text-white/60">
            实时预览
          </div>
          <div
            className="p-6"
            style={{ background: `linear-gradient(160deg, ${brand.ink}, #0a0a0c)` }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: brand.primary }}
            >
              {brand.name || "YOUR BRAND"}
            </p>
            <p className="mt-4 text-[28px] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
              STOP
              <br />
              SCROLLING.
            </p>
            <p className="mt-3 text-[12px] text-white/45">
              品牌色、CTA 与落款会出现在每一帧。
            </p>
            <div
              className="mt-6 inline-flex h-10 items-center rounded-full px-5 text-[12px] font-bold uppercase tracking-wide"
              style={{ background: brand.primary, color: brand.ink }}
            >
              {brand.cta || "SHOP NOW"}
            </div>
            <p className="mt-6 text-[10px] text-white/25">{brand.domain}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
