import { getBrand } from "@/lib/db";
import { BrandEditor } from "@/components/brand-editor";

export const dynamic = "force-dynamic";

export default function BrandPage() {
  const brand = getBrand();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-bold tracking-[-0.03em] text-white sm:text-[28px]">
          品牌库
        </h1>
        <p className="mt-1 text-[13px] text-white/35">
          统一品牌色、Logo 与 CTA，让每条广告都像同一个品牌出的。
        </p>
      </div>
      <BrandEditor initial={brand} />
    </div>
  );
}
